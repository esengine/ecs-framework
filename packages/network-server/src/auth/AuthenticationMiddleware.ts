/**
 * 认证中间件
 * 处理客户端认证请求和权限验证
 */
import { createLogger } from '@esengine/ecs-framework';
import { EventEmitter } from '@esengine/network-shared';
import { JWTAuthManager, UserAuthInfo, JWTPayload } from './JWTAuthManager';
import { ClientSession } from '../core/ConnectionManager';

/**
 * 认证请求数据
 */
export interface AuthRequest {
    type: 'login' | 'refresh' | 'logout';
    credentials?: {
        username: string;
        password: string;
        email?: string;
    };
    refreshToken?: string;
}

/**
 * 认证响应数据
 */
export interface AuthResponse {
    success: boolean;
    message?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    userInfo?: {
        userId: string;
        username: string;
        roles: string[];
        permissions: string[];
    };
}

/**
 * 用户提供者接口
 */
export interface UserProvider {
    /**
     * 验证用户凭据
     */
    validateCredentials(username: string, password: string): Promise<UserAuthInfo | null>;
    
    /**
     * 根据用户ID获取用户信息
     */
    getUserById(userId: string): Promise<UserAuthInfo | null>;
    
    /**
     * 根据用户名获取用户信息
     */
    getUserByUsername(username: string): Promise<UserAuthInfo | null>;
}

/**
 * 权限检查器接口
 */
export interface PermissionChecker {
    /**
     * 检查用户是否有指定权限
     */
    hasPermission(userId: string, permission: string): Promise<boolean>;
    
    /**
     * 检查用户是否有指定角色
     */
    hasRole(userId: string, role: string): Promise<boolean>;
}

/**
 * 认证中间件配置
 */
export interface AuthMiddlewareConfig {
    jwtConfig: {
        secret: string;
        accessTokenExpiry: number;
        refreshTokenExpiry: number;
    };
    userProvider: UserProvider;
    permissionChecker?: PermissionChecker;
    maxLoginAttempts: number;
    lockoutDuration: number; // 锁定时间（秒）
    enableRateLimit: boolean;
}

/**
 * 认证中间件事件
 */
export interface AuthMiddlewareEvents {
    'auth:login:success': (userId: string, session: ClientSession) => void;
    'auth:login:failed': (username: string, reason: string, session: ClientSession) => void;
    'auth:logout': (userId: string, session: ClientSession) => void;
    'auth:token:refreshed': (userId: string, session: ClientSession) => void;
    'auth:permission:denied': (userId: string, permission: string, session: ClientSession) => void;
    'auth:account:locked': (userId: string, session: ClientSession) => void;
}

/**
 * 登录尝试记录
 */
interface LoginAttempt {
    count: number;
    lastAttempt: number;
    locked: boolean;
    lockExpiry: number;
}

/**
 * 认证中间件
 */
export class AuthenticationMiddleware extends EventEmitter<AuthMiddlewareEvents> {
    private logger = createLogger('AuthMiddleware');
    private config: AuthMiddlewareConfig;
    private jwtManager: JWTAuthManager;
    private loginAttempts: Map<string, LoginAttempt> = new Map();
    private authenticatedSessions: Map<string, JWTPayload> = new Map(); // sessionId -> payload

    constructor(config: AuthMiddlewareConfig) {
        super();
        this.config = config;
        this.jwtManager = new JWTAuthManager(config.jwtConfig);
        this.setupCleanupTimer();
    }

    /**
     * 处理认证请求
     */
    async handleAuthRequest(request: AuthRequest, session: ClientSession): Promise<AuthResponse> {
        switch (request.type) {
            case 'login':
                return await this.handleLogin(request, session);
            case 'refresh':
                return await this.handleRefresh(request, session);
            case 'logout':
                return await this.handleLogout(session);
            default:
                return {
                    success: false,
                    message: 'Unknown authentication request type'
                };
        }
    }

    /**
     * 验证会话是否已认证
     */
    isSessionAuthenticated(session: ClientSession): boolean {
        return this.authenticatedSessions.has(session.id);
    }

    /**
     * 获取会话的用户载荷
     */
    getSessionPayload(session: ClientSession): JWTPayload | null {
        return this.authenticatedSessions.get(session.id) || null;
    }

    /**
     * 检查会话权限
     */
    async checkPermission(session: ClientSession, permission: string): Promise<boolean> {
        const payload = this.getSessionPayload(session);
        if (!payload) {
            return false;
        }

        // 首先检查JWT载荷中的权限
        if (this.jwtManager.hasPermission(payload, permission)) {
            return true;
        }

        // 如果有权限检查器，使用它进行额外验证
        if (this.config.permissionChecker) {
            const hasPermission = await this.config.permissionChecker.hasPermission(payload.userId, permission);
            if (!hasPermission) {
                this.emit('auth:permission:denied', payload.userId, permission, session);
            }
            return hasPermission;
        }

        this.emit('auth:permission:denied', payload.userId, permission, session);
        return false;
    }

    /**
     * 检查会话角色
     */
    async checkRole(session: ClientSession, role: string): Promise<boolean> {
        const payload = this.getSessionPayload(session);
        if (!payload) {
            return false;
        }

        // 首先检查JWT载荷中的角色
        if (this.jwtManager.hasRole(payload, role)) {
            return true;
        }

        // 如果有权限检查器，使用它进行额外验证
        if (this.config.permissionChecker) {
            return await this.config.permissionChecker.hasRole(payload.userId, role);
        }

        return false;
    }

    /**
     * 撤销会话认证
     */
    revokeSessionAuth(session: ClientSession): void {
        const payload = this.authenticatedSessions.get(session.id);
        if (payload) {
            this.jwtManager.revokeUserTokens(payload.userId);
            this.authenticatedSessions.delete(session.id);
            this.emit('auth:logout', payload.userId, session);
        }
    }

    /**
     * 处理登录请求
     */
    private async handleLogin(request: AuthRequest, session: ClientSession): Promise<AuthResponse> {
        if (!request.credentials) {
            return {
                success: false,
                message: 'Missing credentials'
            };
        }

        const { username, password } = request.credentials;

        // 检查账户锁定状态
        if (this.isAccountLocked(username)) {
            this.emit('auth:account:locked', username, session);
            return {
                success: false,
                message: 'Account is temporarily locked due to multiple failed login attempts'
            };
        }

        try {
            // 验证用户凭据
            const userInfo = await this.config.userProvider.validateCredentials(username, password);
            if (!userInfo) {
                this.recordFailedLogin(username);
                this.emit('auth:login:failed', username, 'Invalid credentials', session);
                return {
                    success: false,
                    message: 'Invalid username or password'
                };
            }

            // 生成令牌对
            const tokenPair = this.jwtManager.generateTokenPair(userInfo);
            
            // 验证并存储会话
            const verifyResult = this.jwtManager.verifyAccessToken(tokenPair.accessToken);
            if (verifyResult.valid && verifyResult.payload) {
                this.authenticatedSessions.set(session.id, verifyResult.payload);
            }

            // 清除失败记录
            this.loginAttempts.delete(username);

            this.emit('auth:login:success', userInfo.userId, session);

            return {
                success: true,
                accessToken: tokenPair.accessToken,
                refreshToken: tokenPair.refreshToken,
                expiresIn: tokenPair.expiresIn,
                userInfo: {
                    userId: userInfo.userId,
                    username: userInfo.username,
                    roles: userInfo.roles,
                    permissions: userInfo.permissions
                }
            };
        } catch (error) {
            this.recordFailedLogin(username);
            const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
            this.emit('auth:login:failed', username, errorMessage, session);
            return {
                success: false,
                message: 'Authentication failed'
            };
        }
    }

    /**
     * 处理令牌刷新请求
     */
    private async handleRefresh(request: AuthRequest, session: ClientSession): Promise<AuthResponse> {
        if (!request.refreshToken) {
            return {
                success: false,
                message: 'Missing refresh token'
            };
        }

        try {
            const verifyResult = this.jwtManager.verifyRefreshToken(request.refreshToken);
            if (!verifyResult.valid || !verifyResult.payload) {
                return {
                    success: false,
                    message: 'Invalid refresh token'
                };
            }

            // 获取用户信息
            const userInfo = await this.config.userProvider.getUserById(verifyResult.payload.userId);
            if (!userInfo) {
                return {
                    success: false,
                    message: 'User not found'
                };
            }

            // 刷新令牌
            const newTokenPair = this.jwtManager.refreshAccessToken(request.refreshToken, userInfo);
            if (!newTokenPair) {
                return {
                    success: false,
                    message: 'Failed to refresh token'
                };
            }

            // 更新会话
            const newVerifyResult = this.jwtManager.verifyAccessToken(newTokenPair.accessToken);
            if (newVerifyResult.valid && newVerifyResult.payload) {
                this.authenticatedSessions.set(session.id, newVerifyResult.payload);
            }

            this.emit('auth:token:refreshed', userInfo.userId, session);

            return {
                success: true,
                accessToken: newTokenPair.accessToken,
                refreshToken: newTokenPair.refreshToken,
                expiresIn: newTokenPair.expiresIn
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
            return {
                success: false,
                message: errorMessage
            };
        }
    }

    /**
     * 处理登出请求
     */
    private async handleLogout(session: ClientSession): Promise<AuthResponse> {
        this.revokeSessionAuth(session);
        return {
            success: true,
            message: 'Logged out successfully'
        };
    }

    /**
     * 记录失败的登录尝试
     */
    private recordFailedLogin(username: string): void {
        const now = Date.now();
        const attempt = this.loginAttempts.get(username) || {
            count: 0,
            lastAttempt: now,
            locked: false,
            lockExpiry: 0
        };

        attempt.count++;
        attempt.lastAttempt = now;

        if (attempt.count >= this.config.maxLoginAttempts) {
            attempt.locked = true;
            attempt.lockExpiry = now + (this.config.lockoutDuration * 1000);
            this.logger.warn(`账户已锁定: ${username}, 锁定至: ${new Date(attempt.lockExpiry)}`);
        }

        this.loginAttempts.set(username, attempt);
    }

    /**
     * 检查账户是否被锁定
     */
    private isAccountLocked(username: string): boolean {
        const attempt = this.loginAttempts.get(username);
        if (!attempt || !attempt.locked) {
            return false;
        }

        const now = Date.now();
        if (now >= attempt.lockExpiry) {
            // 锁定已过期，清除记录
            this.loginAttempts.delete(username);
            return false;
        }

        return true;
    }

    /**
     * 设置清理定时器
     */
    private setupCleanupTimer(): void {
        // 每10分钟清理一次过期数据
        setInterval(() => {
            this.cleanupExpiredData();
        }, 10 * 60 * 1000);
    }

    /**
     * 清理过期数据
     */
    private cleanupExpiredData(): void {
        const now = Date.now();
        
        // 清理过期的登录尝试记录
        for (const [username, attempt] of this.loginAttempts.entries()) {
            if (attempt.locked && now >= attempt.lockExpiry) {
                this.loginAttempts.delete(username);
            }
        }

        // 清理过期的JWT令牌
        this.jwtManager.cleanupExpiredTokens();

        // 清理过期的会话认证
        for (const [sessionId, payload] of this.authenticatedSessions.entries()) {
            if (payload.exp && payload.exp * 1000 < now) {
                this.authenticatedSessions.delete(sessionId);
            }
        }
    }
}