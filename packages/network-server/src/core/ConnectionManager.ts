/**
 * 服务端连接管理器
 * 负责管理所有客户端连接的生命周期
 */
import { createLogger, ITimer, Core } from '@esengine/ecs-framework';
import { 
    ITransportClientInfo,
    ConnectionState,
    IConnectionStats,
    EventEmitter
} from '@esengine/network-shared';

/**
 * 客户端会话信息
 */
export interface ClientSession {
    id: string;
    info: ITransportClientInfo;
    state: ConnectionState;
    lastHeartbeat: number;
    stats: IConnectionStats;
    authenticated: boolean;
    roomId?: string;
    userData?: Record<string, any>;
}

/**
 * 连接管理器配置
 */
export interface ConnectionManagerConfig {
    heartbeatInterval: number;
    heartbeatTimeout: number;
    maxIdleTime: number;
    cleanupInterval: number;
}

/**
 * 连接管理器
 */
export class ConnectionManager extends EventEmitter {
    private logger = createLogger('ConnectionManager');
    private sessions: Map<string, ClientSession> = new Map();
    private config: ConnectionManagerConfig;
    private heartbeatTimer?: ITimer;
    private cleanupTimer?: ITimer;

    /**
     * 构造函数
     */
    constructor(config: Partial<ConnectionManagerConfig> = {}) {
        super();
        this.config = {
            heartbeatInterval: 30000,  // 30秒心跳间隔
            heartbeatTimeout: 60000,   // 60秒心跳超时
            maxIdleTime: 300000,       // 5分钟最大空闲时间
            cleanupInterval: 60000,    // 1分钟清理间隔
            ...config
        };
    }

    /**
     * 启动连接管理器
     */
    start(): void {
        this.logger.info('连接管理器启动');
        this.startHeartbeatTimer();
        this.startCleanupTimer();
    }

    /**
     * 停止连接管理器
     */
    stop(): void {
        this.logger.info('连接管理器停止');
        this.stopHeartbeatTimer();
        this.stopCleanupTimer();
        this.sessions.clear();
    }

    /**
     * 添加客户端会话
     */
    addSession(clientInfo: ITransportClientInfo): ClientSession {
        const session: ClientSession = {
            id: clientInfo.id,
            info: clientInfo,
            state: ConnectionState.Connected,
            lastHeartbeat: Date.now(),
            authenticated: false,
            stats: {
                state: ConnectionState.Connected,
                connectTime: clientInfo.connectTime,
                reconnectCount: 0,
                bytesSent: 0,
                bytesReceived: 0,
                messagesSent: 0,
                messagesReceived: 0
            }
        };

        this.sessions.set(clientInfo.id, session);
        this.logger.info(`添加客户端会话: ${clientInfo.id}`);
        
        this.emit('sessionAdded', session);
        return session;
    }

    /**
     * 移除客户端会话
     */
    removeSession(clientId: string, reason?: string): boolean {
        const session = this.sessions.get(clientId);
        if (!session) {
            return false;
        }

        session.state = ConnectionState.Disconnected;
        session.stats.disconnectTime = Date.now();
        
        this.sessions.delete(clientId);
        this.logger.info(`移除客户端会话: ${clientId}, 原因: ${reason || '未知'}`);
        
        this.emit('sessionRemoved', session, reason);
        return true;
    }

    /**
     * 获取客户端会话
     */
    getSession(clientId: string): ClientSession | undefined {
        return this.sessions.get(clientId);
    }

    /**
     * 获取所有客户端会话
     */
    getAllSessions(): ClientSession[] {
        return Array.from(this.sessions.values());
    }

    /**
     * 获取已认证的会话
     */
    getAuthenticatedSessions(): ClientSession[] {
        return Array.from(this.sessions.values()).filter(session => session.authenticated);
    }

    /**
     * 获取指定房间的会话
     */
    getSessionsByRoom(roomId: string): ClientSession[] {
        return Array.from(this.sessions.values()).filter(session => session.roomId === roomId);
    }

    /**
     * 更新会话心跳时间
     */
    updateHeartbeat(clientId: string): boolean {
        const session = this.sessions.get(clientId);
        if (!session) {
            return false;
        }

        session.lastHeartbeat = Date.now();
        return true;
    }

    /**
     * 设置会话认证状态
     */
    setSessionAuthenticated(clientId: string, authenticated: boolean): boolean {
        const session = this.sessions.get(clientId);
        if (!session) {
            return false;
        }

        const wasAuthenticated = session.authenticated;
        session.authenticated = authenticated;
        
        if (wasAuthenticated !== authenticated) {
            this.emit('sessionAuthChanged', session, authenticated);
            this.logger.info(`客户端 ${clientId} 认证状态变更: ${authenticated}`);
        }
        
        return true;
    }

    /**
     * 设置会话所在房间
     */
    setSessionRoom(clientId: string, roomId?: string): boolean {
        const session = this.sessions.get(clientId);
        if (!session) {
            return false;
        }

        const oldRoomId = session.roomId;
        session.roomId = roomId;
        
        if (oldRoomId !== roomId) {
            this.emit('sessionRoomChanged', session, oldRoomId, roomId);
            this.logger.info(`客户端 ${clientId} 房间变更: ${oldRoomId} -> ${roomId}`);
        }
        
        return true;
    }

    /**
     * 更新会话数据统计
     */
    updateSessionStats(clientId: string, stats: Partial<IConnectionStats>): boolean {
        const session = this.sessions.get(clientId);
        if (!session) {
            return false;
        }

        Object.assign(session.stats, stats);
        return true;
    }

    /**
     * 设置会话用户数据
     */
    setSessionUserData(clientId: string, userData: Record<string, any>): boolean {
        const session = this.sessions.get(clientId);
        if (!session) {
            return false;
        }

        session.userData = { ...session.userData, ...userData };
        return true;
    }

    /**
     * 检查会话是否存活
     */
    isSessionAlive(clientId: string): boolean {
        const session = this.sessions.get(clientId);
        if (!session) {
            return false;
        }

        const now = Date.now();
        return (now - session.lastHeartbeat) <= this.config.heartbeatTimeout;
    }

    /**
     * 获取超时的会话
     */
    getTimeoutSessions(): ClientSession[] {
        const now = Date.now();
        return Array.from(this.sessions.values()).filter(session => {
            return (now - session.lastHeartbeat) > this.config.heartbeatTimeout;
        });
    }

    /**
     * 获取空闲的会话
     */
    getIdleSessions(): ClientSession[] {
        const now = Date.now();
        return Array.from(this.sessions.values()).filter(session => {
            return (now - session.lastHeartbeat) > this.config.maxIdleTime;
        });
    }

    /**
     * 获取连接统计信息
     */
    getConnectionStats() {
        const allSessions = this.getAllSessions();
        const authenticatedSessions = this.getAuthenticatedSessions();
        const timeoutSessions = this.getTimeoutSessions();
        
        return {
            totalConnections: allSessions.length,
            authenticatedConnections: authenticatedSessions.length,
            timeoutConnections: timeoutSessions.length,
            averageLatency: this.calculateAverageLatency(allSessions),
            connectionsByRoom: this.getConnectionsByRoom(),
            totalBytesSent: allSessions.reduce((sum, s) => sum + s.stats.bytesSent, 0),
            totalBytesReceived: allSessions.reduce((sum, s) => sum + s.stats.bytesReceived, 0),
            totalMessagesSent: allSessions.reduce((sum, s) => sum + s.stats.messagesSent, 0),
            totalMessagesReceived: allSessions.reduce((sum, s) => sum + s.stats.messagesReceived, 0)
        };
    }

    /**
     * 计算平均延迟
     */
    private calculateAverageLatency(sessions: ClientSession[]): number {
        const validLatencies = sessions
            .map(s => s.stats.latency)
            .filter(latency => latency !== undefined) as number[];
            
        if (validLatencies.length === 0) return 0;
        
        return validLatencies.reduce((sum, latency) => sum + latency, 0) / validLatencies.length;
    }

    /**
     * 按房间统计连接数
     */
    private getConnectionsByRoom(): Record<string, number> {
        const roomCounts: Record<string, number> = {};
        
        for (const session of this.sessions.values()) {
            const roomId = session.roomId || 'lobby';
            roomCounts[roomId] = (roomCounts[roomId] || 0) + 1;
        }
        
        return roomCounts;
    }

    /**
     * 启动心跳定时器
     */
    private startHeartbeatTimer(): void {
        this.heartbeatTimer = Core.schedule(this.config.heartbeatInterval / 1000, true, this, () => {
            this.checkHeartbeats();
        });
    }

    /**
     * 停止心跳定时器
     */
    private stopHeartbeatTimer(): void {
        if (this.heartbeatTimer) {
            this.heartbeatTimer.stop();
            this.heartbeatTimer = undefined;
        }
    }

    /**
     * 启动清理定时器
     */
    private startCleanupTimer(): void {
        this.cleanupTimer = Core.schedule(this.config.cleanupInterval / 1000, true, this, () => {
            this.performCleanup();
        });
    }

    /**
     * 停止清理定时器
     */
    private stopCleanupTimer(): void {
        if (this.cleanupTimer) {
            this.cleanupTimer.stop();
            this.cleanupTimer = undefined;
        }
    }

    /**
     * 检查心跳超时
     */
    private checkHeartbeats(): void {
        const timeoutSessions = this.getTimeoutSessions();
        
        for (const session of timeoutSessions) {
            this.logger.warn(`客户端心跳超时: ${session.id}`);
            this.emit('heartbeatTimeout', session);
            
            // 可以选择断开超时的连接
            // this.removeSession(session.id, '心跳超时');
        }

        if (timeoutSessions.length > 0) {
            this.logger.warn(`发现 ${timeoutSessions.length} 个心跳超时的连接`);
        }
    }

    /**
     * 执行清理操作
     */
    private performCleanup(): void {
        const idleSessions = this.getIdleSessions();
        
        for (const session of idleSessions) {
            this.logger.info(`清理空闲连接: ${session.id}`);
            this.removeSession(session.id, '空闲超时');
        }

        if (idleSessions.length > 0) {
            this.logger.info(`清理了 ${idleSessions.length} 个空闲连接`);
        }
    }

    /**
     * 批量操作：踢出指定房间的所有客户端
     */
    kickRoomClients(roomId: string, reason?: string): number {
        const roomSessions = this.getSessionsByRoom(roomId);
        
        for (const session of roomSessions) {
            this.removeSession(session.id, reason || '房间解散');
        }
        
        this.logger.info(`踢出房间 ${roomId} 的 ${roomSessions.length} 个客户端`);
        return roomSessions.length;
    }

    /**
     * 批量操作：向指定房间广播消息（这里只返回会话列表）
     */
    getRoomSessionsForBroadcast(roomId: string, excludeClientId?: string): ClientSession[] {
        return this.getSessionsByRoom(roomId).filter(session => 
            session.id !== excludeClientId && session.authenticated
        );
    }
}