/**
 * JWT认证管理器
 * 负责JWT令牌的生成、验证和刷新
 */
import { createLogger } from '@esengine/ecs-framework';
import { EventEmitter } from '@esengine/network-shared';

/**
 * JWT载荷接口
 */
export interface JWTPayload {
    userId: string;
    username: string;
    roles: string[];
    permissions: string[];
    iat: number;  // 签发时间
    exp: number;  // 过期时间
    iss?: string; // 签发者
    sub?: string; // 主题
}

/**
 * 用户认证信息
 */
export interface UserAuthInfo {
    userId: string;
    username: string;
    roles: string[];
    permissions: string[];
    email?: string;
    metadata?: Record<string, any>;
}

/**
 * JWT配置
 */
export interface JWTConfig {
    secret: string;
    accessTokenExpiry: number;  // 访问令牌过期时间（秒）
    refreshTokenExpiry: number; // 刷新令牌过期时间（秒）
    issuer?: string;
    algorithm?: 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512';
}

/**
 * 令牌对
 */
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

/**
 * 令牌验证结果
 */
export interface TokenVerificationResult {
    valid: boolean;
    payload?: JWTPayload;
    error?: string;
}

/**
 * JWT认证管理器事件
 */
export interface JWTAuthManagerEvents {
    'token:generated': (userId: string, tokenType: 'access' | 'refresh') => void;
    'token:verified': (userId: string, payload: JWTPayload) => void;
    'token:expired': (userId: string, payload: JWTPayload) => void;
    'token:invalid': (token: string, error: string) => void;
    'token:refreshed': (userId: string, oldToken: string, newToken: string) => void;
}

/**
 * JWT认证管理器
 */
export class JWTAuthManager extends EventEmitter<JWTAuthManagerEvents> {
    private logger = createLogger('JWTAuthManager');
    private config: JWTConfig;
    private refreshTokens: Map<string, string> = new Map(); // userId -> refreshToken

    constructor(config: JWTConfig) {
        super();
        this.config = {
            algorithm: 'HS256',
            issuer: 'ecs-network-server',
            ...config
        };
    }

    /**
     * 生成访问令牌
     */
    generateAccessToken(userInfo: UserAuthInfo): string {
        const now = Math.floor(Date.now() / 1000);
        const payload: JWTPayload = {
            userId: userInfo.userId,
            username: userInfo.username,
            roles: userInfo.roles,
            permissions: userInfo.permissions,
            iat: now,
            exp: now + this.config.accessTokenExpiry,
            iss: this.config.issuer,
            sub: userInfo.userId
        };

        const token = this.createToken(payload);
        this.emit('token:generated', userInfo.userId, 'access');
        return token;
    }

    /**
     * 生成刷新令牌
     */
    generateRefreshToken(userId: string): string {
        const now = Math.floor(Date.now() / 1000);
        const payload = {
            userId,
            type: 'refresh',
            iat: now,
            exp: now + this.config.refreshTokenExpiry,
            iss: this.config.issuer
        };

        const token = this.createToken(payload);
        this.refreshTokens.set(userId, token);
        this.emit('token:generated', userId, 'refresh');
        return token;
    }

    /**
     * 生成令牌对
     */
    generateTokenPair(userInfo: UserAuthInfo): TokenPair {
        const accessToken = this.generateAccessToken(userInfo);
        const refreshToken = this.generateRefreshToken(userInfo.userId);

        return {
            accessToken,
            refreshToken,
            expiresIn: this.config.accessTokenExpiry
        };
    }

    /**
     * 验证访问令牌
     */
    verifyAccessToken(token: string): TokenVerificationResult {
        try {
            const payload = this.verifyToken(token);
            
            if (!payload.userId || !payload.username) {
                this.emit('token:invalid', token, 'Missing required fields');
                return { valid: false, error: 'Invalid token payload' };
            }

            const now = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < now) {
                this.emit('token:expired', payload.userId, payload);
                return { valid: false, error: 'Token expired' };
            }

            this.emit('token:verified', payload.userId, payload);
            return { valid: true, payload };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.emit('token:invalid', token, errorMessage);
            return { valid: false, error: errorMessage };
        }
    }

    /**
     * 验证刷新令牌
     */
    verifyRefreshToken(token: string): TokenVerificationResult {
        try {
            const payload = this.verifyToken(token) as any;
            
            if (payload.type !== 'refresh') {
                this.emit('token:invalid', token, 'Not a refresh token');
                return { valid: false, error: 'Invalid token type' };
            }

            const storedToken = this.refreshTokens.get(payload.userId);
            if (storedToken !== token) {
                this.emit('token:invalid', token, 'Refresh token not found or invalid');
                return { valid: false, error: 'Invalid refresh token' };
            }

            const now = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < now) {
                this.refreshTokens.delete(payload.userId);
                this.emit('token:expired', payload.userId, payload);
                return { valid: false, error: 'Refresh token expired' };
            }

            return { valid: true, payload };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.emit('token:invalid', token, errorMessage);
            return { valid: false, error: errorMessage };
        }
    }

    /**
     * 刷新访问令牌
     */
    refreshAccessToken(refreshToken: string, userInfo: UserAuthInfo): TokenPair | null {
        const result = this.verifyRefreshToken(refreshToken);
        if (!result.valid) {
            return null;
        }

        const newAccessToken = this.generateAccessToken(userInfo);
        const newRefreshToken = this.generateRefreshToken(userInfo.userId);

        this.emit('token:refreshed', userInfo.userId, refreshToken, newAccessToken);

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresIn: this.config.accessTokenExpiry
        };
    }

    /**
     * 撤销用户的所有令牌
     */
    revokeUserTokens(userId: string): void {
        this.refreshTokens.delete(userId);
        this.logger.info(`撤销用户令牌: ${userId}`);
    }

    /**
     * 撤销刷新令牌
     */
    revokeRefreshToken(userId: string): void {
        this.refreshTokens.delete(userId);
    }

    /**
     * 检查用户是否有特定权限
     */
    hasPermission(payload: JWTPayload, permission: string): boolean {
        return payload.permissions.includes(permission);
    }

    /**
     * 检查用户是否有特定角色
     */
    hasRole(payload: JWTPayload, role: string): boolean {
        return payload.roles.includes(role);
    }

    /**
     * 检查用户是否有任一权限
     */
    hasAnyPermission(payload: JWTPayload, permissions: string[]): boolean {
        return permissions.some(permission => payload.permissions.includes(permission));
    }

    /**
     * 检查用户是否有任一角色
     */
    hasAnyRole(payload: JWTPayload, roles: string[]): boolean {
        return roles.some(role => payload.roles.includes(role));
    }

    /**
     * 清理过期的刷新令牌
     */
    cleanupExpiredTokens(): number {
        const now = Math.floor(Date.now() / 1000);
        let cleanedCount = 0;

        for (const [userId, token] of this.refreshTokens.entries()) {
            try {
                const payload = this.verifyToken(token) as any;
                if (payload.exp && payload.exp < now) {
                    this.refreshTokens.delete(userId);
                    cleanedCount++;
                }
            } catch (error) {
                // 令牌无法解析，直接删除
                this.refreshTokens.delete(userId);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            this.logger.info(`清理了 ${cleanedCount} 个过期的刷新令牌`);
        }

        return cleanedCount;
    }

    /**
     * 获取活跃刷新令牌数量
     */
    getActiveRefreshTokenCount(): number {
        return this.refreshTokens.size;
    }

    /**
     * 创建JWT令牌（简化实现，生产环境建议使用专业的JWT库）
     */
    private createToken(payload: any): string {
        const header = {
            alg: this.config.algorithm,
            typ: 'JWT'
        };

        const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
        const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
        const signature = this.createSignature(`${encodedHeader}.${encodedPayload}`);

        return `${encodedHeader}.${encodedPayload}.${signature}`;
    }

    /**
     * 验证JWT令牌
     */
    private verifyToken(token: string): JWTPayload {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid token format');
        }

        const [encodedHeader, encodedPayload, signature] = parts;
        
        // 验证签名
        const expectedSignature = this.createSignature(`${encodedHeader}.${encodedPayload}`);
        if (signature !== expectedSignature) {
            throw new Error('Invalid token signature');
        }

        // 解析载荷
        const payload = JSON.parse(this.base64UrlDecode(encodedPayload));
        return payload;
    }

    /**
     * 创建签名（简化实现）
     */
    private createSignature(data: string): string {
        // 这里使用简化的HMAC实现
        // 生产环境建议使用crypto库的真正HMAC实现
        const crypto = require('crypto');
        return crypto.createHmac('sha256', this.config.secret).update(data).digest('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    /**
     * Base64URL编码
     */
    private base64UrlEncode(str: string): string {
        return Buffer.from(str).toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    /**
     * Base64URL解码
     */
    private base64UrlDecode(str: string): string {
        // 补全填充
        str += '='.repeat(4 - str.length % 4);
        // 还原标准base64字符
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        return Buffer.from(str, 'base64').toString();
    }
}