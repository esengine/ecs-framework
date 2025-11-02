import { EntitySystem, createLogger } from '@esengine/ecs-framework';
import {
    SyncVarManager,
    SyncBatch,
    SyncVarSerializer,
    NetworkScope,
    SyncMode,
    AuthorityType
} from '@esengine/network-shared';
import { NetworkServer } from '../core/NetworkServer';
import { ConnectionManager } from '../core/ConnectionManager';

/**
 * 服务端SyncVar系统配置
 */
export interface SyncVarSystemConfig {
    /** 同步频率(毫秒) */
    syncRate: number;
    /** 最大同步批次大小 */
    maxBatchSize: number;
    /** 是否启用网络作用域优化 */
    enableScopeOptimization: boolean;
    /** 是否启用带宽限制 */
    enableBandwidthLimit: boolean;
    /** 每客户端最大带宽(字节/秒) */
    maxBandwidthPerClient: number;
    /** 是否启用优先级调度 */
    enablePriorityScheduling: boolean;
    /** 是否启用批量优化 */
    enableBatching: boolean;
    /** 批量超时时间(毫秒) */
    batchTimeout: number;
}

/**
 * 客户端同步状态
 */
interface ClientSyncState {
    clientId: string;
    lastSyncTime: number;
    pendingBatches: SyncBatch[];
    bandwidth: {
        used: number;
        limit: number;
        resetTime: number;
    };
    scope: {
        position?: { x: number; y: number; z: number };
        range: number;
        customFilter?: (batch: SyncBatch) => boolean;
    };
}

/**
 * 同步统计信息
 */
interface SyncSystemStats {
    totalSyncs: number;
    totalBytes: number;
    clientCount: number;
    averageLatency: number;
    syncsPerSecond: number;
    droppedSyncs: number;
    scopeFiltered: number;
}

/**
 * 服务端SyncVar系统
 * 负责收集所有SyncVar变化并向客户端同步
 */
export class SyncVarSystem extends EntitySystem {
    private config: SyncVarSystemConfig;
    private syncVarManager: SyncVarManager;
    private serializer: SyncVarSerializer;
    private networkServer?: NetworkServer;
    private connectionManager?: ConnectionManager;

    /** 客户端同步状态 */
    private clientStates = new Map<string, ClientSyncState>();

    /** 待发送的批次队列 */
    private pendingBatches: SyncBatch[] = [];

    /** 同步统计 */
    private stats: SyncSystemStats = {
        totalSyncs: 0,
        totalBytes: 0,
        clientCount: 0,
        averageLatency: 0,
        syncsPerSecond: 0,
        droppedSyncs: 0,
        scopeFiltered: 0
    };

    /** 最后统计重置时间 */
    private lastStatsReset = Date.now();

    /** 同步定时器 */
    private syncTimer: any = null;

    constructor(config: Partial<SyncVarSystemConfig> = {}) {
        super();

        this.config = {
            syncRate: 60, // 60ms = ~16fps
            maxBatchSize: 50,
            enableScopeOptimization: true,
            enableBandwidthLimit: true,
            maxBandwidthPerClient: 10240, // 10KB/s
            enablePriorityScheduling: true,
            enableBatching: true,
            batchTimeout: 16,
            ...config
        };

        this.syncVarManager = SyncVarManager.getInstance();
        this.serializer = new SyncVarSerializer({
            enableCompression: true,
            enableDeltaSync: true,
            enableBatching: this.config.enableBatching,
            batchTimeout: this.config.batchTimeout
        });

        this.setupSyncVarManager();
    }

    /**
     * 初始化系统
     */
    public override initialize(): void {
        super.initialize();

        this.logger.info('SyncVar系统初始化');
        this.startSyncTimer();
    }

    /**
     * 系统更新
     */
    protected override process(): void {
        this.updateClientStates();
        this.processScheduledSyncs();
        this.updateStats();
    }

    /**
     * 设置网络服务器
     */
    public setNetworkServer(server: NetworkServer): void {
        this.networkServer = server;
    }

    /**
     * 设置连接管理器
     */
    public setConnectionManager(manager: ConnectionManager): void {
        this.connectionManager = manager;

        // 监听客户端连接事件
        manager.on('clientConnected', (clientId: string) => {
            this.addClient(clientId);
        });

        manager.on('clientDisconnected', (clientId: string) => {
            this.removeClient(clientId);
        });
    }

    /**
     * 注册网络实体
     */
    public registerNetworkEntity(entity: any): void {
        this.syncVarManager.registerInstance(entity);
    }

    /**
     * 注销网络实体
     */
    public unregisterNetworkEntity(entity: any): void {
        this.syncVarManager.unregisterInstance(entity);
    }

    /**
     * 设置客户端作用域
     */
    public setClientScope(clientId: string, position?: { x: number; y: number; z: number }, range: number = 100): void {
        const clientState = this.clientStates.get(clientId);
        if (clientState) {
            clientState.scope.position = position;
            clientState.scope.range = range;
        }
    }

    /**
     * 设置客户端自定义过滤器
     */
    public setClientFilter(clientId: string, filter: (batch: SyncBatch) => boolean): void {
        const clientState = this.clientStates.get(clientId);
        if (clientState) {
            clientState.scope.customFilter = filter;
        }
    }

    /**
     * 获取统计信息
     */
    public getStats(): SyncSystemStats {
        return { ...this.stats };
    }

    /**
     * 重置统计信息
     */
    public resetStats(): void {
        this.stats = {
            totalSyncs: 0,
            totalBytes: 0,
            clientCount: this.clientStates.size,
            averageLatency: 0,
            syncsPerSecond: 0,
            droppedSyncs: 0,
            scopeFiltered: 0
        };
        this.lastStatsReset = Date.now();
    }

    /**
     * 更新配置
     */
    public updateConfig(newConfig: Partial<SyncVarSystemConfig>): void {
        Object.assign(this.config, newConfig);

        if (newConfig.syncRate !== undefined) {
            this.restartSyncTimer();
        }
    }

    /**
     * 销毁系统
     */
    public override destroy(): void {
        this.stopSyncTimer();
        this.clientStates.clear();
        this.pendingBatches.length = 0;
        super.destroy();
    }

    protected override getLoggerName(): string {
        return 'SyncVarSystem';
    }

    /**
     * 设置SyncVar管理器事件
     */
    private setupSyncVarManager(): void {
        this.syncVarManager.on('syncBatchReady', (batch: SyncBatch) => {
            this.enqueueBatch(batch);
        });

        this.syncVarManager.on('syncError', (error: Error) => {
            this.logger.error('SyncVar同步错误:', error);
        });
    }

    /**
     * 添加客户端
     */
    private addClient(clientId: string): void {
        const clientState: ClientSyncState = {
            clientId,
            lastSyncTime: 0,
            pendingBatches: [],
            bandwidth: {
                used: 0,
                limit: this.config.maxBandwidthPerClient,
                resetTime: Date.now() + 1000
            },
            scope: {
                range: 100
            }
        };

        this.clientStates.set(clientId, clientState);
        this.stats.clientCount = this.clientStates.size;

        this.logger.info(`客户端 ${clientId} 已添加到同步系统`);
    }

    /**
     * 移除客户端
     */
    private removeClient(clientId: string): void {
        this.clientStates.delete(clientId);
        this.stats.clientCount = this.clientStates.size;

        this.logger.info(`客户端 ${clientId} 已从同步系统移除`);
    }

    /**
     * 将批次加入队列
     */
    private enqueueBatch(batch: SyncBatch): void {
        this.pendingBatches.push(batch);

        // 如果队列过长，移除最旧的批次
        if (this.pendingBatches.length > this.config.maxBatchSize * 2) {
            this.pendingBatches.shift();
            this.stats.droppedSyncs++;
        }
    }

    /**
     * 处理计划的同步
     */
    private processScheduledSyncs(): void {
        if (this.pendingBatches.length === 0 || this.clientStates.size === 0) {
            return;
        }

        const now = Date.now();
        const batchesToProcess = this.pendingBatches.splice(0, this.config.maxBatchSize);

        for (const batch of batchesToProcess) {
            this.distributeBatchToClients(batch);
        }
    }

    /**
     * 将批次分发给客户端
     */
    private distributeBatchToClients(batch: SyncBatch): void {
        for (const [clientId, clientState] of this.clientStates) {
            // 检查网络作用域
            if (this.config.enableScopeOptimization && !this.isInClientScope(batch, clientState)) {
                this.stats.scopeFiltered++;
                continue;
            }

            // 检查带宽限制
            if (this.config.enableBandwidthLimit && !this.checkBandwidthLimit(clientId, batch)) {
                // 将批次添加到待发送队列
                clientState.pendingBatches.push(batch);
                continue;
            }

            this.sendBatchToClient(clientId, batch);
        }
    }

    /**
     * 检查批次是否在客户端作用域内
     */
    private isInClientScope(batch: SyncBatch, clientState: ClientSyncState): boolean {
        // 检查自定义过滤器
        if (clientState.scope.customFilter) {
            return clientState.scope.customFilter(batch);
        }

        // 检查权限和作用域
        for (const [prop, scope] of Object.entries(batch.scopes)) {
            const authority = batch.authorities[prop];
            const syncMode = batch.syncModes[prop];

            // 检查权限
            if (authority === AuthorityType.Client) {
                // 只有拥有权限的客户端才能看到
                if (batch.instanceId !== clientState.clientId) {
                    continue;
                }
            }

            // 检查同步模式
            switch (syncMode) {
                case SyncMode.Owner:
                    if (batch.instanceId !== clientState.clientId) {
                        continue;
                    }
                    break;

                case SyncMode.Others:
                    if (batch.instanceId === clientState.clientId) {
                        continue;
                    }
                    break;

                case SyncMode.Nearby:
                    if (!this.isNearby(batch, clientState)) {
                        continue;
                    }
                    break;
            }

            // 检查网络作用域
            switch (scope) {
                case NetworkScope.Owner:
                    if (batch.instanceId !== clientState.clientId) {
                        continue;
                    }
                    break;

                case NetworkScope.Nearby:
                    if (!this.isNearby(batch, clientState)) {
                        continue;
                    }
                    break;
            }
        }

        return true;
    }

    /**
     * 检查是否在附近范围内
     */
    private isNearby(batch: SyncBatch, clientState: ClientSyncState): boolean {
        // 简化实现，实际项目中需要根据具体的位置信息判断
        return true;
    }

    /**
     * 检查带宽限制
     */
    private checkBandwidthLimit(clientId: string, batch: SyncBatch): boolean {
        if (!this.config.enableBandwidthLimit) {
            return true;
        }

        const clientState = this.clientStates.get(clientId);
        if (!clientState) {
            return false;
        }

        const now = Date.now();

        // 重置带宽计数器
        if (now >= clientState.bandwidth.resetTime) {
            clientState.bandwidth.used = 0;
            clientState.bandwidth.resetTime = now + 1000;
        }

        // 估算批次大小
        const estimatedSize = this.estimateBatchSize(batch);

        return clientState.bandwidth.used + estimatedSize <= clientState.bandwidth.limit;
    }

    /**
     * 估算批次大小
     */
    private estimateBatchSize(batch: SyncBatch): number {
        // 简化实现，根据变化属性数量估算
        const propertyCount = Object.keys(batch.changes).length;
        return propertyCount * 50; // 假设每个属性平均50字节
    }

    /**
     * 向客户端发送批次
     */
    private sendBatchToClient(clientId: string, batch: SyncBatch): void {
        if (!this.networkServer || !this.connectionManager) {
            return;
        }

        try {
            const message = this.serializer.createSyncMessage(batch, 'server');
            this.networkServer.sendToClient(clientId, message);

            // 更新统计
            const clientState = this.clientStates.get(clientId);
            if (clientState) {
                clientState.lastSyncTime = Date.now();
                const estimatedSize = this.estimateBatchSize(batch);
                clientState.bandwidth.used += estimatedSize;
                this.stats.totalBytes += estimatedSize;
                this.stats.totalSyncs++;
            }

        } catch (error) {
            this.logger.error(`向客户端 ${clientId} 发送同步数据失败:`, error);
        }
    }

    /**
     * 更新客户端状态
     */
    private updateClientStates(): void {
        const now = Date.now();

        for (const [clientId, clientState] of this.clientStates) {
            // 处理待发送的批次
            if (clientState.pendingBatches.length > 0 &&
                this.checkBandwidthLimit(clientId, clientState.pendingBatches[0])) {

                const batch = clientState.pendingBatches.shift()!;
                this.sendBatchToClient(clientId, batch);
            }
        }
    }

    /**
     * 更新统计信息
     */
    private updateStats(): void {
        const now = Date.now();
        const deltaTime = now - this.lastStatsReset;

        if (deltaTime >= 1000) { // 每秒更新一次
            this.stats.syncsPerSecond = this.stats.totalSyncs / (deltaTime / 1000);
            this.lastStatsReset = now;
        }
    }

    /**
     * 启动同步定时器
     */
    private startSyncTimer(): void {
        if (this.syncTimer) {
            return;
        }

        this.syncTimer = setInterval(() => {
            this.processScheduledSyncs();
        }, this.config.syncRate);
    }

    /**
     * 停止同步定时器
     */
    private stopSyncTimer(): void {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
    }

    /**
     * 重启同步定时器
     */
    private restartSyncTimer(): void {
        this.stopSyncTimer();
        this.startSyncTimer();
    }
}
