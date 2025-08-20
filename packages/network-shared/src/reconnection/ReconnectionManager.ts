/**
 * 断线重连管理器
 * 处理网络断开后的自动重连、状态恢复等功能
 */
import { createLogger } from '@esengine/ecs-framework';
import { EventEmitter } from '../utils/EventEmitter';
import { GameStateSnapshot } from '../state/StateSnapshot';

/**
 * 重连状态
 */
export enum ReconnectionState {
    DISCONNECTED = 'disconnected',
    RECONNECTING = 'reconnecting',
    CONNECTED = 'connected',
    FAILED = 'failed',
    ABANDONED = 'abandoned'
}

/**
 * 重连策略
 */
export interface ReconnectionStrategy {
    maxAttempts: number;          // 最大重连尝试次数
    initialDelay: number;         // 初始延迟时间（毫秒）
    maxDelay: number;             // 最大延迟时间（毫秒）
    backoffFactor: number;        // 退避因子
    jitter: boolean;              // 是否添加随机抖动
    timeoutPerAttempt: number;    // 每次尝试的超时时间
}

/**
 * 断线重连配置
 */
export interface ReconnectionConfig {
    strategy: ReconnectionStrategy;
    stateRecovery: {
        enabled: boolean;
        snapshotInterval: number;    // 快照保存间隔（毫秒）
        maxSnapshots: number;        // 最大保存快照数
        recoveryTimeout: number;     // 状态恢复超时时间
    };
    heartbeat: {
        enabled: boolean;
        interval: number;            // 心跳间隔（毫秒）
        timeout: number;             // 心跳超时时间
        maxMissed: number;           // 最大丢失心跳数
    };
    persistence: {
        enabled: boolean;
        saveToLocal: boolean;        // 保存到本地存储
        encryptData: boolean;        // 加密保存的数据
    };
}

/**
 * 重连会话信息
 */
export interface ReconnectionSession {
    sessionId: string;
    userId: string;
    lastActiveTime: number;
    disconnectedAt: number;
    snapshotId?: string;
    resumeToken: string;
    clientState: Record<string, any>;
    serverState: Record<string, any>;
    reconnectionCount: number;
    isExpired: boolean;
}

/**
 * 重连尝试信息
 */
export interface ReconnectionAttempt {
    attemptNumber: number;
    startTime: number;
    delay: number;
    error?: string;
    success: boolean;
}

/**
 * 状态同步结果
 */
export interface StateSyncResult {
    success: boolean;
    syncedAt: number;
    snapshotId?: string;
    missingUpdates: number;
    conflictResolutions: number;
    error?: string;
}

/**
 * 重连管理器事件
 */
export interface ReconnectionManagerEvents {
    'reconnection:started': (sessionId: string, attempt: ReconnectionAttempt) => void;
    'reconnection:progress': (sessionId: string, attempt: ReconnectionAttempt) => void;
    'reconnection:success': (sessionId: string, syncResult: StateSyncResult) => void;
    'reconnection:failed': (sessionId: string, attempt: ReconnectionAttempt) => void;
    'reconnection:abandoned': (sessionId: string, reason: string) => void;
    'state:snapshot:created': (sessionId: string, snapshotId: string) => void;
    'state:recovery:started': (sessionId: string) => void;
    'state:recovery:completed': (sessionId: string, result: StateSyncResult) => void;
    'heartbeat:missed': (sessionId: string, missedCount: number) => void;
    'connection:unstable': (sessionId: string, metrics: ConnectionMetrics) => void;
}

/**
 * 连接指标
 */
export interface ConnectionMetrics {
    latency: number;
    packetLoss: number;
    jitter: number;
    bandwidth: number;
    reconnections: number;
    lastReconnection: number;
}

/**
 * 断线重连管理器
 */
export class ReconnectionManager extends EventEmitter<ReconnectionManagerEvents> {
    private logger = createLogger('ReconnectionManager');
    private config: ReconnectionConfig;
    
    // 状态管理
    private state: ReconnectionState = ReconnectionState.DISCONNECTED;
    private sessions: Map<string, ReconnectionSession> = new Map();
    private snapshots: Map<string, GameStateSnapshot> = new Map();
    private attempts: Map<string, ReconnectionAttempt[]> = new Map();
    private connectionMetrics: Map<string, ConnectionMetrics> = new Map();
    
    // 定时器
    private heartbeatTimers: Map<string, NodeJS.Timeout> = new Map();
    private snapshotTimer?: NodeJS.Timeout;
    private cleanupTimer?: NodeJS.Timeout;

    constructor(config: ReconnectionConfig) {
        super();
        this.config = config;
        this.startPeriodicTasks();
    }

    /**
     * 创建重连会话
     */
    createSession(sessionId: string, userId: string, initialState: any): ReconnectionSession {
        const session: ReconnectionSession = {
            sessionId,
            userId,
            lastActiveTime: Date.now(),
            disconnectedAt: 0,
            resumeToken: this.generateResumeToken(),
            clientState: { ...initialState },
            serverState: {},
            reconnectionCount: 0,
            isExpired: false
        };

        this.sessions.set(sessionId, session);
        this.startHeartbeat(sessionId);
        
        if (this.config.stateRecovery.enabled) {
            this.createSnapshot(sessionId, initialState, 'session_created');
        }

        this.logger.info(`创建重连会话: ${sessionId} (用户: ${userId})`);
        return session;
    }

    /**
     * 开始重连过程
     */
    async startReconnection(
        sessionId: string,
        resumeToken: string,
        connectionFactory: () => Promise<any>
    ): Promise<StateSyncResult> {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        if (session.resumeToken !== resumeToken) {
            throw new Error('Invalid resume token');
        }

        if (session.isExpired) {
            throw new Error('Session expired');
        }

        this.state = ReconnectionState.RECONNECTING;
        session.reconnectionCount++;

        const strategy = this.config.strategy;
        const sessionAttempts: ReconnectionAttempt[] = [];
        this.attempts.set(sessionId, sessionAttempts);

        for (let attemptNum = 1; attemptNum <= strategy.maxAttempts; attemptNum++) {
            const delay = this.calculateDelay(attemptNum, strategy);
            const attempt: ReconnectionAttempt = {
                attemptNumber: attemptNum,
                startTime: Date.now(),
                delay,
                success: false
            };

            sessionAttempts.push(attempt);
            this.emit('reconnection:started', sessionId, attempt);

            // 等待延迟
            if (delay > 0) {
                await this.sleep(delay);
            }

            try {
                // 尝试重新连接
                const connection = await this.attemptConnection(connectionFactory, strategy.timeoutPerAttempt);
                
                // 恢复状态
                const syncResult = await this.recoverState(sessionId, connection);
                
                if (syncResult.success) {
                    attempt.success = true;
                    this.state = ReconnectionState.CONNECTED;
                    session.lastActiveTime = Date.now();
                    session.disconnectedAt = 0;
                    
                    this.restartHeartbeat(sessionId);
                    this.emit('reconnection:success', sessionId, syncResult);
                    
                    this.logger.info(`重连成功: ${sessionId} (尝试 ${attemptNum}/${strategy.maxAttempts})`);
                    return syncResult;
                }

            } catch (error) {
                attempt.error = error instanceof Error ? error.message : 'Unknown error';
                this.emit('reconnection:progress', sessionId, attempt);
                
                this.logger.warn(`重连尝试失败 ${attemptNum}/${strategy.maxAttempts}:`, error);
            }
        }

        // 所有尝试都失败了
        this.state = ReconnectionState.FAILED;
        const finalAttempt = sessionAttempts[sessionAttempts.length - 1];
        this.emit('reconnection:failed', sessionId, finalAttempt);
        
        // 决定是否放弃重连
        if (this.shouldAbandonReconnection(session)) {
            this.abandonReconnection(sessionId, 'Max attempts exceeded');
        }

        throw new Error(`Reconnection failed after ${strategy.maxAttempts} attempts`);
    }

    /**
     * 处理连接断开
     */
    handleDisconnection(sessionId: string, reason: string): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.disconnectedAt = Date.now();
            this.state = ReconnectionState.DISCONNECTED;
            
            this.stopHeartbeat(sessionId);
            
            // 保存最后状态快照
            if (this.config.stateRecovery.enabled) {
                this.createSnapshot(sessionId, session.clientState, 'disconnection');
            }
            
            this.logger.info(`会话断开: ${sessionId}, 原因: ${reason}`);
        }
    }

    /**
     * 更新会话状态
     */
    updateSessionState(sessionId: string, stateUpdate: any): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            Object.assign(session.clientState, stateUpdate);
            session.lastActiveTime = Date.now();
            
            // 定期创建快照
            if (this.config.stateRecovery.enabled) {
                this.scheduleSnapshot(sessionId);
            }
        }
    }

    /**
     * 获取会话信息
     */
    getSession(sessionId: string): ReconnectionSession | null {
        return this.sessions.get(sessionId) || null;
    }

    /**
     * 检查会话是否可以重连
     */
    canReconnect(sessionId: string, resumeToken: string): boolean {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return false;
        }

        return !session.isExpired && 
               session.resumeToken === resumeToken &&
               this.state !== ReconnectionState.ABANDONED;
    }

    /**
     * 更新连接指标
     */
    updateConnectionMetrics(sessionId: string, metrics: Partial<ConnectionMetrics>): void {
        const existing = this.connectionMetrics.get(sessionId) || {
            latency: 0,
            packetLoss: 0,
            jitter: 0,
            bandwidth: 0,
            reconnections: 0,
            lastReconnection: 0
        };

        const updated = { ...existing, ...metrics };
        this.connectionMetrics.set(sessionId, updated);

        // 检查连接稳定性
        if (this.isConnectionUnstable(updated)) {
            this.emit('connection:unstable', sessionId, updated);
        }
    }

    /**
     * 创建状态快照
     */
    private createSnapshot(sessionId: string, state: any, reason: string): string {
        if (!this.config.stateRecovery.enabled) {
            return '';
        }

        const snapshotId = this.generateSnapshotId();
        const snapshot: GameStateSnapshot = {
            id: snapshotId,
            timestamp: Date.now(),
            version: '1.0.0',
            worlds: [], // 根据实际状态结构填充
            players: [],
            gameTime: 0,
            gameState: 'playing',
            globalData: { ...state },
            metadata: {
                creator: 'reconnection_manager',
                reason,
                compressed: false,
                size: JSON.stringify(state).length
            }
        };

        this.snapshots.set(snapshotId, snapshot);
        
        const session = this.sessions.get(sessionId);
        if (session) {
            session.snapshotId = snapshotId;
        }

        // 限制快照数量
        this.limitSnapshots();

        this.emit('state:snapshot:created', sessionId, snapshotId);
        return snapshotId;
    }

    /**
     * 恢复状态
     */
    private async recoverState(sessionId: string, connection: any): Promise<StateSyncResult> {
        this.emit('state:recovery:started', sessionId);

        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        try {
            let syncResult: StateSyncResult = {
                success: false,
                syncedAt: Date.now(),
                missingUpdates: 0,
                conflictResolutions: 0
            };

            if (this.config.stateRecovery.enabled && session.snapshotId) {
                // 从快照恢复
                const snapshot = this.snapshots.get(session.snapshotId);
                if (snapshot) {
                    // 请求服务器同步状态
                    syncResult = await this.syncWithServer(connection, snapshot, session);
                } else {
                    // 快照不存在，请求完整状态
                    syncResult = await this.requestFullState(connection, session);
                }
            } else {
                // 没有快照，请求完整状态
                syncResult = await this.requestFullState(connection, session);
            }

            this.emit('state:recovery:completed', sessionId, syncResult);
            return syncResult;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const failedResult: StateSyncResult = {
                success: false,
                syncedAt: Date.now(),
                missingUpdates: 0,
                conflictResolutions: 0,
                error: errorMessage
            };

            this.emit('state:recovery:completed', sessionId, failedResult);
            throw error;
        }
    }

    /**
     * 与服务器同步状态
     */
    private async syncWithServer(
        connection: any, 
        snapshot: GameStateSnapshot, 
        session: ReconnectionSession
    ): Promise<StateSyncResult> {
        // 发送快照信息给服务器，请求增量更新
        const syncRequest = {
            type: 'state_sync',
            snapshotId: snapshot.id,
            timestamp: snapshot.timestamp,
            resumeToken: session.resumeToken
        };

        // 这里需要实际的网络通信实现
        // 简化为返回成功结果
        return {
            success: true,
            syncedAt: Date.now(),
            snapshotId: snapshot.id,
            missingUpdates: 0,
            conflictResolutions: 0
        };
    }

    /**
     * 请求完整状态
     */
    private async requestFullState(
        connection: any, 
        session: ReconnectionSession
    ): Promise<StateSyncResult> {
        const stateRequest = {
            type: 'full_state_request',
            resumeToken: session.resumeToken
        };

        // 这里需要实际的网络通信实现
        return {
            success: true,
            syncedAt: Date.now(),
            missingUpdates: 0,
            conflictResolutions: 0
        };
    }

    /**
     * 尝试连接
     */
    private async attemptConnection(
        connectionFactory: () => Promise<any>,
        timeout: number
    ): Promise<any> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('Connection attempt timeout'));
            }, timeout);

            connectionFactory()
                .then(connection => {
                    clearTimeout(timer);
                    resolve(connection);
                })
                .catch(error => {
                    clearTimeout(timer);
                    reject(error);
                });
        });
    }

    /**
     * 计算重连延迟
     */
    private calculateDelay(attemptNumber: number, strategy: ReconnectionStrategy): number {
        let delay = strategy.initialDelay * Math.pow(strategy.backoffFactor, attemptNumber - 1);
        delay = Math.min(delay, strategy.maxDelay);

        // 添加随机抖动
        if (strategy.jitter) {
            const jitterAmount = delay * 0.1; // 10% 抖动
            delay += (Math.random() - 0.5) * 2 * jitterAmount;
        }

        return Math.max(0, Math.floor(delay));
    }

    /**
     * 启动心跳检测
     */
    private startHeartbeat(sessionId: string): void {
        if (!this.config.heartbeat.enabled) {
            return;
        }

        const timer = setInterval(() => {
            this.checkHeartbeat(sessionId);
        }, this.config.heartbeat.interval);

        this.heartbeatTimers.set(sessionId, timer);
    }

    /**
     * 检查心跳
     */
    private checkHeartbeat(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return;
        }

        const now = Date.now();
        const timeSinceLastActivity = now - session.lastActiveTime;

        if (timeSinceLastActivity > this.config.heartbeat.timeout) {
            const metrics = this.connectionMetrics.get(sessionId);
            if (metrics) {
                metrics.reconnections++;
            }

            this.emit('heartbeat:missed', sessionId, 1);
            this.handleDisconnection(sessionId, 'heartbeat_timeout');
        }
    }

    /**
     * 重启心跳检测
     */
    private restartHeartbeat(sessionId: string): void {
        this.stopHeartbeat(sessionId);
        this.startHeartbeat(sessionId);
    }

    /**
     * 停止心跳检测
     */
    private stopHeartbeat(sessionId: string): void {
        const timer = this.heartbeatTimers.get(sessionId);
        if (timer) {
            clearInterval(timer);
            this.heartbeatTimers.delete(sessionId);
        }
    }

    /**
     * 检查是否应该放弃重连
     */
    private shouldAbandonReconnection(session: ReconnectionSession): boolean {
        const now = Date.now();
        const timeSinceDisconnection = now - session.disconnectedAt;
        const maxReconnectionTime = this.config.strategy.maxAttempts * this.config.strategy.maxDelay;

        return timeSinceDisconnection > maxReconnectionTime || 
               session.reconnectionCount > this.config.strategy.maxAttempts;
    }

    /**
     * 放弃重连
     */
    private abandonReconnection(sessionId: string, reason: string): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.isExpired = true;
            this.state = ReconnectionState.ABANDONED;
            this.emit('reconnection:abandoned', sessionId, reason);
            this.logger.info(`放弃重连: ${sessionId}, 原因: ${reason}`);
        }
    }

    /**
     * 检查连接是否不稳定
     */
    private isConnectionUnstable(metrics: ConnectionMetrics): boolean {
        return metrics.latency > 1000 || 
               metrics.packetLoss > 0.05 || 
               metrics.reconnections > 3;
    }

    /**
     * 定期快照
     */
    private scheduleSnapshot(sessionId: string): void {
        // 简化实现：立即创建快照
        const session = this.sessions.get(sessionId);
        if (session) {
            this.createSnapshot(sessionId, session.clientState, 'periodic');
        }
    }

    /**
     * 限制快照数量
     */
    private limitSnapshots(): void {
        const maxSnapshots = this.config.stateRecovery.maxSnapshots;
        if (this.snapshots.size > maxSnapshots) {
            const sortedSnapshots = Array.from(this.snapshots.entries())
                .sort(([,a], [,b]) => a.timestamp - b.timestamp);
            
            const toDelete = sortedSnapshots.slice(0, this.snapshots.size - maxSnapshots);
            for (const [id] of toDelete) {
                this.snapshots.delete(id);
            }
        }
    }

    /**
     * 启动周期性任务
     */
    private startPeriodicTasks(): void {
        // 定期创建快照
        if (this.config.stateRecovery.enabled) {
            this.snapshotTimer = setInterval(() => {
                for (const [sessionId] of this.sessions) {
                    this.scheduleSnapshot(sessionId);
                }
            }, this.config.stateRecovery.snapshotInterval);
        }

        // 定期清理过期数据
        this.cleanupTimer = setInterval(() => {
            this.cleanupExpiredData();
        }, 5 * 60 * 1000); // 每5分钟清理一次
    }

    /**
     * 清理过期数据
     */
    private cleanupExpiredData(): void {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24小时

        // 清理过期会话
        for (const [sessionId, session] of this.sessions.entries()) {
            if (now - session.lastActiveTime > maxAge) {
                this.sessions.delete(sessionId);
                this.stopHeartbeat(sessionId);
                this.attempts.delete(sessionId);
                this.connectionMetrics.delete(sessionId);
            }
        }

        // 清理过期快照
        for (const [snapshotId, snapshot] of this.snapshots.entries()) {
            if (now - snapshot.timestamp > maxAge) {
                this.snapshots.delete(snapshotId);
            }
        }
    }

    /**
     * 休眠指定时间
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 生成恢复令牌
     */
    private generateResumeToken(): string {
        return `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 生成快照ID
     */
    private generateSnapshotId(): string {
        return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 销毁重连管理器
     */
    destroy(): void {
        // 停止所有定时器
        for (const timer of this.heartbeatTimers.values()) {
            clearInterval(timer);
        }
        this.heartbeatTimers.clear();

        if (this.snapshotTimer) {
            clearInterval(this.snapshotTimer);
        }

        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }

        // 清理数据
        this.sessions.clear();
        this.snapshots.clear();
        this.attempts.clear();
        this.connectionMetrics.clear();

        this.logger.info('重连管理器已销毁');
    }
}