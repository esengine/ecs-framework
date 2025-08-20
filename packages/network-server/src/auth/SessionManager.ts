/**
 * 增强的会话管理系统
 * 负责用户会话的生命周期管理、状态维护和安全监控
 */
import { createLogger } from '@esengine/ecs-framework';
import { EventEmitter } from '@esengine/network-shared';
import { ClientSession } from '../core/ConnectionManager';
import { JWTPayload } from './JWTAuthManager';

/**
 * 用户会话信息
 */
export interface UserSession {
    sessionId: string;
    userId: string;
    username: string;
    roles: string[];
    permissions: string[];
    clientSession: ClientSession;
    loginTime: number;
    lastActivityTime: number;
    ipAddress: string;
    userAgent?: string;
    metadata: Record<string, any>;
    isActive: boolean;
}

/**
 * 会话统计信息
 */
export interface SessionStats {
    totalSessions: number;
    activeSessions: number;
    inactiveSessions: number;
    averageSessionDuration: number;
    uniqueUsers: number;
}

/**
 * 会话查询选项
 */
export interface SessionQueryOptions {
    userId?: string;
    active?: boolean;
    minLastActivity?: number;
    maxLastActivity?: number;
    roles?: string[];
    permissions?: string[];
    ipAddress?: string;
    limit?: number;
    offset?: number;
}

/**
 * 会话管理器配置
 */
export interface SessionManagerConfig {
    maxSessionsPerUser: number;
    sessionTimeout: number; // 会话超时时间（毫秒）
    cleanupInterval: number; // 清理间隔（毫秒）
    trackUserActivity: boolean;
    enableSessionSecurity: boolean;
    maxConcurrentSessions: number; // 系统最大并发会话数
}

/**
 * 会话管理器事件
 */
export interface SessionManagerEvents {
    'session:created': (session: UserSession) => void;
    'session:destroyed': (sessionId: string, reason: string) => void;
    'session:activity': (sessionId: string, activityType: string) => void;
    'session:timeout': (sessionId: string) => void;
    'session:security:violation': (sessionId: string, violation: string) => void;
    'session:limit:reached': (userId: string, newSession: UserSession, oldSessions: UserSession[]) => void;
}

/**
 * 活动记录
 */
interface ActivityRecord {
    timestamp: number;
    type: string;
    details?: any;
}

/**
 * 增强的会话管理器
 */
export class SessionManager extends EventEmitter<SessionManagerEvents> {
    private logger = createLogger('SessionManager');
    private config: SessionManagerConfig;
    private sessions: Map<string, UserSession> = new Map(); // sessionId -> UserSession
    private userSessions: Map<string, Set<string>> = new Map(); // userId -> Set<sessionId>
    private sessionActivities: Map<string, ActivityRecord[]> = new Map(); // sessionId -> activities
    private cleanupTimer?: NodeJS.Timeout;

    constructor(config: SessionManagerConfig) {
        super();
        this.config = config;
        this.startCleanupTimer();
    }

    /**
     * 创建用户会话
     */
    createSession(
        clientSession: ClientSession,
        jwtPayload: JWTPayload,
        ipAddress: string,
        userAgent?: string
    ): UserSession {
        const sessionId = clientSession.id;
        const userId = jwtPayload.userId;
        const now = Date.now();

        // 检查系统并发会话限制
        if (this.sessions.size >= this.config.maxConcurrentSessions) {
            this.cleanupOldestInactiveSessions(1);
        }

        // 检查用户会话数量限制
        const existingSessions = this.getUserSessions(userId);
        if (existingSessions.length >= this.config.maxSessionsPerUser) {
            // 移除最旧的会话
            const oldestSession = existingSessions
                .sort((a, b) => a.lastActivityTime - b.lastActivityTime)[0];
            this.destroySession(oldestSession.sessionId, 'session_limit_reached');
            
            this.emit('session:limit:reached', userId, 
                { sessionId } as UserSession, existingSessions);
        }

        // 创建会话
        const userSession: UserSession = {
            sessionId,
            userId,
            username: jwtPayload.username,
            roles: jwtPayload.roles,
            permissions: jwtPayload.permissions,
            clientSession,
            loginTime: now,
            lastActivityTime: now,
            ipAddress,
            userAgent,
            metadata: {},
            isActive: true
        };

        // 存储会话
        this.sessions.set(sessionId, userSession);
        
        // 更新用户会话索引
        if (!this.userSessions.has(userId)) {
            this.userSessions.set(userId, new Set());
        }
        this.userSessions.get(userId)!.add(sessionId);

        // 初始化活动记录
        if (this.config.trackUserActivity) {
            this.sessionActivities.set(sessionId, [{
                timestamp: now,
                type: 'session_created',
                details: { ipAddress, userAgent }
            }]);
        }

        this.emit('session:created', userSession);
        this.logger.info(`创建会话: ${sessionId} (用户: ${userId})`);

        return userSession;
    }

    /**
     * 销毁会话
     */
    destroySession(sessionId: string, reason: string = 'manual'): boolean {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return false;
        }

        // 从会话映射中删除
        this.sessions.delete(sessionId);

        // 从用户会话索引中删除
        const userSessionSet = this.userSessions.get(session.userId);
        if (userSessionSet) {
            userSessionSet.delete(sessionId);
            if (userSessionSet.size === 0) {
                this.userSessions.delete(session.userId);
            }
        }

        // 清理活动记录
        this.sessionActivities.delete(sessionId);

        this.emit('session:destroyed', sessionId, reason);
        this.logger.info(`销毁会话: ${sessionId} (原因: ${reason})`);

        return true;
    }

    /**
     * 获取会话
     */
    getSession(sessionId: string): UserSession | null {
        return this.sessions.get(sessionId) || null;
    }

    /**
     * 获取用户的所有会话
     */
    getUserSessions(userId: string): UserSession[] {
        const sessionIds = this.userSessions.get(userId);
        if (!sessionIds) {
            return [];
        }

        return Array.from(sessionIds)
            .map(id => this.sessions.get(id))
            .filter((session): session is UserSession => session !== undefined);
    }

    /**
     * 更新会话活动时间
     */
    updateSessionActivity(sessionId: string, activityType: string = 'general', details?: any): boolean {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return false;
        }

        const now = Date.now();
        session.lastActivityTime = now;
        session.isActive = true;

        // 记录活动
        if (this.config.trackUserActivity) {
            const activities = this.sessionActivities.get(sessionId) || [];
            activities.push({
                timestamp: now,
                type: activityType,
                details
            });

            // 限制活动记录数量（保留最近100条）
            if (activities.length > 100) {
                activities.splice(0, activities.length - 100);
            }

            this.sessionActivities.set(sessionId, activities);
        }

        this.emit('session:activity', sessionId, activityType);
        return true;
    }

    /**
     * 检查会话是否有效
     */
    isSessionValid(sessionId: string): boolean {
        const session = this.sessions.get(sessionId);
        if (!session || !session.isActive) {
            return false;
        }

        const now = Date.now();
        const timeSinceLastActivity = now - session.lastActivityTime;
        
        if (timeSinceLastActivity > this.config.sessionTimeout) {
            // 会话超时
            session.isActive = false;
            this.emit('session:timeout', sessionId);
            return false;
        }

        return true;
    }

    /**
     * 设置会话元数据
     */
    setSessionMetadata(sessionId: string, key: string, value: any): boolean {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return false;
        }

        session.metadata[key] = value;
        return true;
    }

    /**
     * 获取会话元数据
     */
    getSessionMetadata(sessionId: string, key: string): any {
        const session = this.sessions.get(sessionId);
        return session?.metadata[key];
    }

    /**
     * 查询会话
     */
    querySessions(options: SessionQueryOptions = {}): UserSession[] {
        let results = Array.from(this.sessions.values());

        // 应用过滤条件
        if (options.userId !== undefined) {
            results = results.filter(s => s.userId === options.userId);
        }

        if (options.active !== undefined) {
            results = results.filter(s => s.isActive === options.active);
        }

        if (options.minLastActivity !== undefined) {
            results = results.filter(s => s.lastActivityTime >= options.minLastActivity!);
        }

        if (options.maxLastActivity !== undefined) {
            results = results.filter(s => s.lastActivityTime <= options.maxLastActivity!);
        }

        if (options.roles && options.roles.length > 0) {
            results = results.filter(s => 
                options.roles!.some(role => s.roles.includes(role))
            );
        }

        if (options.permissions && options.permissions.length > 0) {
            results = results.filter(s => 
                options.permissions!.some(perm => s.permissions.includes(perm))
            );
        }

        if (options.ipAddress !== undefined) {
            results = results.filter(s => s.ipAddress === options.ipAddress);
        }

        // 排序（按最后活动时间降序）
        results.sort((a, b) => b.lastActivityTime - a.lastActivityTime);

        // 应用分页
        if (options.offset !== undefined) {
            results = results.slice(options.offset);
        }
        if (options.limit !== undefined) {
            results = results.slice(0, options.limit);
        }

        return results;
    }

    /**
     * 获取会话统计信息
     */
    getSessionStats(): SessionStats {
        const sessions = Array.from(this.sessions.values());
        const activeSessions = sessions.filter(s => s.isActive);
        const now = Date.now();

        // 计算平均会话持续时间
        const totalDuration = sessions.reduce((sum, s) => {
            const duration = s.isActive ? now - s.loginTime : s.lastActivityTime - s.loginTime;
            return sum + duration;
        }, 0);

        const averageDuration = sessions.length > 0 ? totalDuration / sessions.length : 0;

        // 统计唯一用户数
        const uniqueUsers = new Set(sessions.map(s => s.userId)).size;

        return {
            totalSessions: sessions.length,
            activeSessions: activeSessions.length,
            inactiveSessions: sessions.length - activeSessions.length,
            averageSessionDuration: averageDuration,
            uniqueUsers
        };
    }

    /**
     * 获取会话活动历史
     */
    getSessionActivities(sessionId: string, limit: number = 50): ActivityRecord[] {
        const activities = this.sessionActivities.get(sessionId) || [];
        return activities.slice(-limit);
    }

    /**
     * 踢出用户的所有会话
     */
    kickUser(userId: string, reason: string = 'admin_action'): number {
        const sessions = this.getUserSessions(userId);
        let kickedCount = 0;

        for (const session of sessions) {
            if (this.destroySession(session.sessionId, reason)) {
                kickedCount++;
            }
        }

        return kickedCount;
    }

    /**
     * 清理超时会话
     */
    private cleanupTimeoutSessions(): number {
        const now = Date.now();
        const timeoutSessions: string[] = [];

        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.isActive && now - session.lastActivityTime > this.config.sessionTimeout) {
                session.isActive = false;
                timeoutSessions.push(sessionId);
                this.emit('session:timeout', sessionId);
            }
        }

        // 移除超时会话
        let removedCount = 0;
        for (const sessionId of timeoutSessions) {
            if (this.destroySession(sessionId, 'timeout')) {
                removedCount++;
            }
        }

        return removedCount;
    }

    /**
     * 清理最旧的非活跃会话
     */
    private cleanupOldestInactiveSessions(count: number): number {
        const inactiveSessions = Array.from(this.sessions.values())
            .filter(s => !s.isActive)
            .sort((a, b) => a.lastActivityTime - b.lastActivityTime)
            .slice(0, count);

        let removedCount = 0;
        for (const session of inactiveSessions) {
            if (this.destroySession(session.sessionId, 'cleanup_oldest')) {
                removedCount++;
            }
        }

        return removedCount;
    }

    /**
     * 启动清理定时器
     */
    private startCleanupTimer(): void {
        this.cleanupTimer = setInterval(() => {
            const removedCount = this.cleanupTimeoutSessions();
            if (removedCount > 0) {
                this.logger.info(`清理了 ${removedCount} 个超时会话`);
            }
        }, this.config.cleanupInterval);
    }

    /**
     * 停止会话管理器
     */
    destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }

        // 清理所有会话
        const sessionIds = Array.from(this.sessions.keys());
        for (const sessionId of sessionIds) {
            this.destroySession(sessionId, 'manager_destroyed');
        }

        this.logger.info('会话管理器已销毁');
    }
}