/**
 * 身份验证管理器
 * 
 * 处理客户端身份验证、令牌验证等功能
 */

import { EventEmitter } from 'events';
import { createHash, randomBytes } from 'crypto';
import { NetworkValue } from '@esengine/ecs-framework-network-shared';
import { ClientConnection } from '../core/ClientConnection';

/**
 * 认证配置
 */
export interface AuthConfig {
  /** 令牌过期时间(毫秒) */
  tokenExpirationTime?: number;
  /** 最大登录尝试次数 */
  maxLoginAttempts?: number;
  /** 登录尝试重置时间(毫秒) */
  loginAttemptResetTime?: number;
  /** 是否启用令牌刷新 */
  enableTokenRefresh?: boolean;
  /** 令牌刷新阈值(毫秒) */
  tokenRefreshThreshold?: number;
  /** 是否启用IP限制 */
  enableIpRestriction?: boolean;
  /** 密码哈希算法 */
  passwordHashAlgorithm?: 'sha256' | 'sha512';
}

/**
 * 用户信息
 */
export interface UserInfo {
  /** 用户ID */
  id: string;
  /** 用户名 */
  username: string;
  /** 密码哈希 */
  passwordHash: string;
  /** 用户角色 */
  roles: string[];
  /** 用户元数据 */
  metadata: Record<string, NetworkValue>;
  /** 创建时间 */
  createdAt: Date;
  /** 最后登录时间 */
  lastLoginAt?: Date;
  /** 是否激活 */
  isActive: boolean;
  /** 允许的IP地址列表 */
  allowedIps?: string[];
}

/**
 * 认证令牌
 */
export interface AuthToken {
  /** 令牌ID */
  id: string;
  /** 用户ID */
  userId: string;
  /** 令牌值 */
  token: string;
  /** 创建时间 */
  createdAt: Date;
  /** 过期时间 */
  expiresAt: Date;
  /** 是否已撤销 */
  isRevoked: boolean;
  /** 令牌元数据 */
  metadata: Record<string, NetworkValue>;
}

/**
 * 登录尝试记录
 */
interface LoginAttempt {
  /** IP地址 */
  ip: string;
  /** 用户名 */
  username: string;
  /** 尝试次数 */
  attempts: number;
  /** 最后尝试时间 */
  lastAttempt: Date;
}

/**
 * 认证结果
 */
export interface AuthResult {
  /** 是否成功 */
  success: boolean;
  /** 用户信息 */
  user?: UserInfo;
  /** 认证令牌 */
  token?: AuthToken;
  /** 错误信息 */
  error?: string;
  /** 错误代码 */
  errorCode?: string;
}

/**
 * 认证管理器事件
 */
export interface AuthManagerEvents {
  /** 用户登录成功 */
  'login-success': (user: UserInfo, token: AuthToken, clientId: string) => void;
  /** 用户登录失败 */
  'login-failed': (username: string, reason: string, clientId: string) => void;
  /** 用户注销 */
  'logout': (userId: string, clientId: string) => void;
  /** 令牌过期 */
  'token-expired': (userId: string, tokenId: string) => void;
  /** 令牌刷新 */
  'token-refreshed': (userId: string, oldTokenId: string, newTokenId: string) => void;
  /** 认证错误 */
  'auth-error': (error: Error, clientId?: string) => void;
}

/**
 * 身份验证管理器
 */
export class AuthenticationManager extends EventEmitter {
  private config: AuthConfig;
  private users = new Map<string, UserInfo>();
  private tokens = new Map<string, AuthToken>();
  private loginAttempts = new Map<string, LoginAttempt>();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: AuthConfig = {}) {
    super();
    
    this.config = {
      tokenExpirationTime: 24 * 60 * 60 * 1000, // 24小时
      maxLoginAttempts: 5,
      loginAttemptResetTime: 15 * 60 * 1000, // 15分钟
      enableTokenRefresh: true,
      tokenRefreshThreshold: 60 * 60 * 1000, // 1小时
      enableIpRestriction: false,
      passwordHashAlgorithm: 'sha256',
      ...config
    };

    this.initialize();
  }

  /**
   * 注册用户
   */
  async registerUser(userData: {
    username: string;
    password: string;
    roles?: string[];
    metadata?: Record<string, NetworkValue>;
    allowedIps?: string[];
  }): Promise<UserInfo> {
    const { username, password, roles = ['user'], metadata = {}, allowedIps } = userData;

    // 检查用户名是否已存在
    if (this.findUserByUsername(username)) {
      throw new Error('Username already exists');
    }

    const userId = this.generateId();
    const passwordHash = this.hashPassword(password);

    const user: UserInfo = {
      id: userId,
      username,
      passwordHash,
      roles,
      metadata,
      createdAt: new Date(),
      isActive: true,
      allowedIps
    };

    this.users.set(userId, user);
    
    console.log(`User registered: ${username} (${userId})`);
    return user;
  }

  /**
   * 用户登录
   */
  async login(
    username: string, 
    password: string, 
    client: ClientConnection
  ): Promise<AuthResult> {
    try {
      const clientIp = client.remoteAddress;
      const attemptKey = `${clientIp}-${username}`;

      // 检查登录尝试次数
      if (this.isLoginBlocked(attemptKey)) {
        const result: AuthResult = {
          success: false,
          error: 'Too many login attempts. Please try again later.',
          errorCode: 'LOGIN_BLOCKED'
        };
        this.emit('login-failed', username, result.error!, client.id);
        return result;
      }

      // 查找用户
      const user = this.findUserByUsername(username);
      if (!user || !user.isActive) {
        this.recordLoginAttempt(attemptKey);
        const result: AuthResult = {
          success: false,
          error: 'Invalid username or password',
          errorCode: 'INVALID_CREDENTIALS'
        };
        this.emit('login-failed', username, result.error!, client.id);
        return result;
      }

      // 验证密码
      const passwordHash = this.hashPassword(password);
      if (user.passwordHash !== passwordHash) {
        this.recordLoginAttempt(attemptKey);
        const result: AuthResult = {
          success: false,
          error: 'Invalid username or password',
          errorCode: 'INVALID_CREDENTIALS'
        };
        this.emit('login-failed', username, result.error!, client.id);
        return result;
      }

      // IP限制检查
      if (this.config.enableIpRestriction && user.allowedIps && user.allowedIps.length > 0) {
        if (!user.allowedIps.includes(clientIp)) {
          const result: AuthResult = {
            success: false,
            error: 'Access denied from this IP address',
            errorCode: 'IP_RESTRICTED'
          };
          this.emit('login-failed', username, result.error!, client.id);
          return result;
        }
      }

      // 创建认证令牌
      const token = this.createToken(user.id);
      
      // 更新用户最后登录时间
      user.lastLoginAt = new Date();
      
      // 清除登录尝试记录
      this.loginAttempts.delete(attemptKey);

      const result: AuthResult = {
        success: true,
        user,
        token
      };

      console.log(`User logged in: ${username} (${user.id}) from ${clientIp}`);
      this.emit('login-success', user, token, client.id);
      
      return result;

    } catch (error) {
      const result: AuthResult = {
        success: false,
        error: (error as Error).message,
        errorCode: 'INTERNAL_ERROR'
      };
      this.emit('auth-error', error as Error, client.id);
      return result;
    }
  }

  /**
   * 用户注销
   */
  async logout(tokenValue: string, client: ClientConnection): Promise<boolean> {
    try {
      const token = this.findTokenByValue(tokenValue);
      if (!token) {
        return false;
      }

      // 撤销令牌
      token.isRevoked = true;
      
      console.log(`User logged out: ${token.userId} from ${client.remoteAddress}`);
      this.emit('logout', token.userId, client.id);
      
      return true;

    } catch (error) {
      this.emit('auth-error', error as Error, client.id);
      return false;
    }
  }

  /**
   * 验证令牌
   */
  async validateToken(tokenValue: string): Promise<AuthResult> {
    try {
      const token = this.findTokenByValue(tokenValue);
      
      if (!token || token.isRevoked) {
        return {
          success: false,
          error: 'Invalid token',
          errorCode: 'INVALID_TOKEN'
        };
      }

      if (token.expiresAt < new Date()) {
        token.isRevoked = true;
        this.emit('token-expired', token.userId, token.id);
        return {
          success: false,
          error: 'Token expired',
          errorCode: 'TOKEN_EXPIRED'
        };
      }

      const user = this.users.get(token.userId);
      if (!user || !user.isActive) {
        return {
          success: false,
          error: 'User not found or inactive',
          errorCode: 'USER_NOT_FOUND'
        };
      }

      return {
        success: true,
        user,
        token
      };

    } catch (error) {
      this.emit('auth-error', error as Error);
      return {
        success: false,
        error: (error as Error).message,
        errorCode: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * 刷新令牌
   */
  async refreshToken(tokenValue: string): Promise<AuthResult> {
    try {
      const validationResult = await this.validateToken(tokenValue);
      if (!validationResult.success || !validationResult.user || !validationResult.token) {
        return validationResult;
      }

      const token = validationResult.token;
      const timeUntilExpiration = token.expiresAt.getTime() - Date.now();

      // 检查是否需要刷新
      if (timeUntilExpiration > this.config.tokenRefreshThreshold!) {
        return validationResult; // 不需要刷新
      }

      // 创建新令牌
      const newToken = this.createToken(token.userId, token.metadata);
      
      // 撤销旧令牌
      token.isRevoked = true;

      console.log(`Token refreshed for user: ${token.userId}`);
      this.emit('token-refreshed', token.userId, token.id, newToken.id);

      return {
        success: true,
        user: validationResult.user,
        token: newToken
      };

    } catch (error) {
      this.emit('auth-error', error as Error);
      return {
        success: false,
        error: (error as Error).message,
        errorCode: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * 获取用户信息
   */
  getUserById(userId: string): UserInfo | undefined {
    return this.users.get(userId);
  }

  /**
   * 获取用户信息（通过用户名）
   */
  getUserByUsername(username: string): UserInfo | undefined {
    return this.findUserByUsername(username);
  }

  /**
   * 更新用户信息
   */
  async updateUser(userId: string, updates: Partial<UserInfo>): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    // 不允许更新某些字段
    const { id, createdAt, ...allowedUpdates } = updates as any;
    Object.assign(user, allowedUpdates);

    return true;
  }

  /**
   * 撤销所有用户令牌
   */
  async revokeAllUserTokens(userId: string): Promise<number> {
    let revokedCount = 0;
    
    for (const token of this.tokens.values()) {
      if (token.userId === userId && !token.isRevoked) {
        token.isRevoked = true;
        revokedCount++;
      }
    }

    return revokedCount;
  }

  /**
   * 获取活跃令牌数量
   */
  getActiveTokenCount(): number {
    return Array.from(this.tokens.values())
      .filter(token => !token.isRevoked && token.expiresAt > new Date()).length;
  }

  /**
   * 清理过期令牌和登录尝试记录
   */
  cleanup(): void {
    const now = new Date();
    let cleanedTokens = 0;
    let cleanedAttempts = 0;

    // 清理过期令牌
    for (const [tokenId, token] of this.tokens.entries()) {
      if (token.expiresAt < now || token.isRevoked) {
        this.tokens.delete(tokenId);
        cleanedTokens++;
      }
    }

    // 清理过期的登录尝试记录
    const resetTime = this.config.loginAttemptResetTime!;
    for (const [attemptKey, attempt] of this.loginAttempts.entries()) {
      if (now.getTime() - attempt.lastAttempt.getTime() > resetTime) {
        this.loginAttempts.delete(attemptKey);
        cleanedAttempts++;
      }
    }

    if (cleanedTokens > 0 || cleanedAttempts > 0) {
      console.log(`Auth cleanup: ${cleanedTokens} tokens, ${cleanedAttempts} login attempts`);
    }
  }

  /**
   * 销毁认证管理器
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.users.clear();
    this.tokens.clear();
    this.loginAttempts.clear();
    this.removeAllListeners();
  }

  /**
   * 初始化
   */
  private initialize(): void {
    // 启动清理定时器（每小时清理一次）
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);
  }

  /**
   * 查找用户（通过用户名）
   */
  private findUserByUsername(username: string): UserInfo | undefined {
    return Array.from(this.users.values())
      .find(user => user.username === username);
  }

  /**
   * 查找令牌（通过令牌值）
   */
  private findTokenByValue(tokenValue: string): AuthToken | undefined {
    return Array.from(this.tokens.values())
      .find(token => token.token === tokenValue);
  }

  /**
   * 生成ID
   */
  private generateId(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * 哈希密码
   */
  private hashPassword(password: string): string {
    return createHash(this.config.passwordHashAlgorithm!)
      .update(password)
      .digest('hex');
  }

  /**
   * 创建认证令牌
   */
  private createToken(userId: string, metadata: Record<string, NetworkValue> = {}): AuthToken {
    const tokenId = this.generateId();
    const tokenValue = randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.tokenExpirationTime!);

    const token: AuthToken = {
      id: tokenId,
      userId,
      token: tokenValue,
      createdAt: now,
      expiresAt,
      isRevoked: false,
      metadata
    };

    this.tokens.set(tokenId, token);
    return token;
  }

  /**
   * 检查登录是否被阻止
   */
  private isLoginBlocked(attemptKey: string): boolean {
    const attempt = this.loginAttempts.get(attemptKey);
    if (!attempt) {
      return false;
    }

    const now = new Date();
    const resetTime = this.config.loginAttemptResetTime!;
    
    // 检查重置时间
    if (now.getTime() - attempt.lastAttempt.getTime() > resetTime) {
      this.loginAttempts.delete(attemptKey);
      return false;
    }

    return attempt.attempts >= this.config.maxLoginAttempts!;
  }

  /**
   * 记录登录尝试
   */
  private recordLoginAttempt(attemptKey: string): void {
    const now = new Date();
    const [ip, username] = attemptKey.split('-', 2);
    
    const existingAttempt = this.loginAttempts.get(attemptKey);
    if (existingAttempt) {
      // 检查是否需要重置
      if (now.getTime() - existingAttempt.lastAttempt.getTime() > this.config.loginAttemptResetTime!) {
        existingAttempt.attempts = 1;
      } else {
        existingAttempt.attempts++;
      }
      existingAttempt.lastAttempt = now;
    } else {
      this.loginAttempts.set(attemptKey, {
        ip,
        username,
        attempts: 1,
        lastAttempt: now
      });
    }
  }

  /**
   * 类型安全的事件监听
   */
  override on<K extends keyof AuthManagerEvents>(event: K, listener: AuthManagerEvents[K]): this {
    return super.on(event, listener);
  }

  /**
   * 类型安全的事件触发
   */
  override emit<K extends keyof AuthManagerEvents>(event: K, ...args: Parameters<AuthManagerEvents[K]>): boolean {
    return super.emit(event, ...args);
  }
}