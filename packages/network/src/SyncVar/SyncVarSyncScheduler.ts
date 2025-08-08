import { SyncVarManager } from './SyncVarManager';
import { NetworkIdentityRegistry, NetworkIdentity } from '../Core/NetworkIdentity';
import { SyncVarUpdateMessage } from '../Messaging/MessageTypes';
import { NetworkEnvironment } from '../Core/NetworkEnvironment';
import { ComponentRegistry, createLogger } from '@esengine/ecs-framework';
import { NetworkComponent } from '../NetworkComponent';

/**
 * SyncVar同步调度配置
 */
export interface SyncVarSyncConfig {
    /** 同步频率（毫秒） */
    syncInterval: number;
    /** 最大批处理消息数量 */
    maxBatchSize: number;
    /** 最大每帧处理对象数量 */
    maxObjectsPerFrame: number;
    /** 是否启用优先级排序 */
    enablePrioritySort: boolean;
    /** 最小同步间隔（防止过于频繁） */
    minSyncInterval: number;
    /** 是否启用增量同步 */
    enableIncrementalSync: boolean;
}

/**
 * 同步优先级计算器
 */
export interface ISyncPriorityCalculator {
    /**
     * 计算组件的同步优先级
     * 
     * @param component - 网络组件
     * @param identity - 网络身份
     * @returns 优先级值，数字越大优先级越高
     */
    calculatePriority(component: any, identity: NetworkIdentity): number;
}

/**
 * 默认优先级计算器
 */
export class DefaultSyncPriorityCalculator implements ISyncPriorityCalculator {
    public calculatePriority(component: any, identity: NetworkIdentity): number {
        let priority = 0;
        
        // 权威对象优先级更高
        if (identity.hasAuthority) {
            priority += 10;
        }
        
        // 距离上次同步时间越长，优先级越高
        const timeSinceLastSync = Date.now() - identity.lastSyncTime;
        priority += Math.min(timeSinceLastSync / 1000, 10); // 最多加10分
        
        // 变化数量越多，优先级越高
        const syncVarManager = SyncVarManager.Instance;
        const changes = syncVarManager.getPendingChanges(component);
        priority += changes.length;
        
        return priority;
    }
}

/**
 * SyncVar同步调度器
 * 
 * 负责定期扫描网络对象的SyncVar变化，创建和分发同步消息
 * 支持批处理、优先级排序和性能优化
 */
export class SyncVarSyncScheduler {
    private static readonly logger = createLogger('SyncVarSyncScheduler');
    private static _instance: SyncVarSyncScheduler | null = null;
    
    private _config: SyncVarSyncConfig;
    private _priorityCalculator: ISyncPriorityCalculator;
    private _isRunning: boolean = false;
    private _syncTimer: NodeJS.Timeout | null = null;
    private _lastSyncTime: number = 0;
    private _syncCounter: number = 0;
    
    // 统计信息
    private _stats = {
        totalSyncCycles: 0,
        totalObjectsScanned: 0,
        totalMessagesSent: 0,
        totalChangesProcessed: 0,
        averageCycleTime: 0,
        lastCycleTime: 0,
        errors: 0
    };
    
    // 消息发送回调
    private _messageSendCallback: ((message: SyncVarUpdateMessage) => Promise<void>) | null = null;
    
    /**
     * 获取调度器单例
     */
    public static get Instance(): SyncVarSyncScheduler {
        if (!SyncVarSyncScheduler._instance) {
            SyncVarSyncScheduler._instance = new SyncVarSyncScheduler();
        }
        return SyncVarSyncScheduler._instance;
    }
    
    private constructor() {
        // 默认配置
        this._config = {
            syncInterval: 50, // 20fps
            maxBatchSize: 10,
            maxObjectsPerFrame: 50,
            enablePrioritySort: true,
            minSyncInterval: 16, // 最小16ms (60fps)
            enableIncrementalSync: true
        };
        
        this._priorityCalculator = new DefaultSyncPriorityCalculator();
    }
    
    /**
     * 配置调度器
     * 
     * @param config - 调度器配置
     */
    public configure(config: Partial<SyncVarSyncConfig>): void {
        this._config = { ...this._config, ...config };
        
        // 如果正在运行，重启以应用新配置
        if (this._isRunning) {
            this.stop();
            this.start();
        }
        
        SyncVarSyncScheduler.logger.debug('调度器配置已更新:', this._config);
    }
    
    /**
     * 设置优先级计算器
     * 
     * @param calculator - 优先级计算器
     */
    public setPriorityCalculator(calculator: ISyncPriorityCalculator): void {
        this._priorityCalculator = calculator;
        SyncVarSyncScheduler.logger.debug('优先级计算器已更新');
    }
    
    /**
     * 设置消息发送回调
     * 
     * @param callback - 消息发送回调函数
     */
    public setMessageSendCallback(callback: (message: SyncVarUpdateMessage) => Promise<void>): void {
        this._messageSendCallback = callback;
        SyncVarSyncScheduler.logger.debug('消息发送回调已设置');
    }
    
    /**
     * 启动调度器
     */
    public start(): void {
        if (this._isRunning) {
            SyncVarSyncScheduler.logger.warn('调度器已经在运行');
            return;
        }
        
        this._isRunning = true;
        this._lastSyncTime = Date.now();
        
        // 设置定时器
        this._syncTimer = setInterval(() => {
            this.performSyncCycle();
        }, this._config.syncInterval);
        
        SyncVarSyncScheduler.logger.info(`调度器已启动，同步间隔: ${this._config.syncInterval}ms`);
    }
    
    /**
     * 停止调度器
     */
    public stop(): void {
        if (!this._isRunning) {
            return;
        }
        
        this._isRunning = false;
        
        if (this._syncTimer) {
            clearInterval(this._syncTimer);
            this._syncTimer = null;
        }
        
        SyncVarSyncScheduler.logger.info('调度器已停止');
    }
    
    /**
     * 执行一次同步周期
     */
    public performSyncCycle(): void {
        if (!this._isRunning) {
            return;
        }
        
        const cycleStartTime = Date.now();
        
        try {
            // 检查最小同步间隔
            if (cycleStartTime - this._lastSyncTime < this._config.minSyncInterval) {
                return;
            }
            
            this._stats.totalSyncCycles++;
            this._lastSyncTime = cycleStartTime;
            
            // 获取所有激活的网络对象
            const activeObjects = NetworkIdentityRegistry.Instance.getActiveObjects();
            this._stats.totalObjectsScanned += activeObjects.length;
            
            // 收集需要同步的组件
            const syncCandidates = this.collectSyncCandidates(activeObjects);
            
            // 优先级排序
            if (this._config.enablePrioritySort) {
                syncCandidates.sort((a, b) => b.priority - a.priority);
            }
            
            // 限制每帧处理的对象数量
            const objectsToProcess = syncCandidates.slice(0, this._config.maxObjectsPerFrame);
            
            // 创建和发送同步消息
            this.processSyncCandidates(objectsToProcess);
            
            // 更新统计信息
            const cycleTime = Date.now() - cycleStartTime;
            this._stats.lastCycleTime = cycleTime;
            this._stats.averageCycleTime = (this._stats.averageCycleTime * (this._stats.totalSyncCycles - 1) + cycleTime) / this._stats.totalSyncCycles;
            
        } catch (error) {
            this._stats.errors++;
            SyncVarSyncScheduler.logger.error('同步周期执行失败:', error);
        }
    }
    
    /**
     * 收集同步候选对象
     */
    private collectSyncCandidates(activeObjects: NetworkIdentity[]): Array<{
        identity: NetworkIdentity;
        component: any;
        priority: number;
        changeCount: number;
    }> {
        const candidates: Array<{
            identity: NetworkIdentity;
            component: any;
            priority: number;
            changeCount: number;
        }> = [];
        
        const syncVarManager = SyncVarManager.Instance;
        
        for (const identity of activeObjects) {
            try {
                // 获取对象的所有网络组件
                const components = this.getNetworkComponents(identity);
                
                for (const component of components) {
                    // 检查组件是否有SyncVar变化
                    const pendingChanges = syncVarManager.getPendingChanges(component);
                    if (pendingChanges.length === 0) {
                        continue;
                    }
                    
                    // 权限检查：只有有权限的对象才能发起同步
                    if (!this.canComponentSync(component, identity)) {
                        continue;
                    }
                    
                    // 计算优先级
                    const priority = this._priorityCalculator.calculatePriority(component, identity);
                    
                    candidates.push({
                        identity,
                        component,
                        priority,
                        changeCount: pendingChanges.length
                    });
                }
            } catch (error) {
                SyncVarSyncScheduler.logger.error(`处理网络对象失败: ${identity.networkId}`, error);
            }
        }
        
        return candidates;
    }
    
    /**
     * 获取网络对象的所有网络组件
     */
    private getNetworkComponents(identity: NetworkIdentity): NetworkComponent[] {
        const entity = identity.entity;
        if (!entity) {
            SyncVarSyncScheduler.logger.warn(`NetworkIdentity ${identity.networkId} 缺少Entity引用`);
            return [];
        }
        
        const networkComponents: NetworkComponent[] = [];
        
        try {
            // 获取所有已注册的组件类型
            const allRegisteredTypes = ComponentRegistry.getAllRegisteredTypes();
            
            for (const [ComponentClass] of allRegisteredTypes) {
                // 检查是否为NetworkComponent子类
                if (ComponentClass.prototype instanceof NetworkComponent || ComponentClass === NetworkComponent) {
                    const component = entity.getComponent(ComponentClass as any);
                    if (component && component instanceof NetworkComponent) {
                        networkComponents.push(component);
                    }
                }
            }
        } catch (error) {
            SyncVarSyncScheduler.logger.error(`获取网络组件失败 (${identity.networkId}):`, error);
        }
        
        return networkComponents;
    }
    
    /**
     * 检查组件是否可以进行同步
     */
    private canComponentSync(component: any, identity: NetworkIdentity): boolean {
        // 服务端对象通常有同步权限
        if (NetworkEnvironment.isServer && identity.hasAuthority) {
            return true;
        }
        
        // 客户端只能同步自己拥有的对象
        if (NetworkEnvironment.isClient) {
            // 这里需要获取当前客户端ID，暂时简化处理
            return identity.hasAuthority;
        }
        
        return false;
    }
    
    /**
     * 处理同步候选对象
     */
    private processSyncCandidates(candidates: Array<{
        identity: NetworkIdentity;
        component: any;
        priority: number;
        changeCount: number;
    }>): void {
        const syncVarManager = SyncVarManager.Instance;
        const messageBatch: SyncVarUpdateMessage[] = [];
        
        for (const candidate of candidates) {
            try {
                // 创建SyncVar更新消息
                const message = syncVarManager.createSyncVarUpdateMessage(
                    candidate.component,
                    candidate.identity.networkId,
                    '', // senderId，后续可以从环境获取
                    candidate.identity.getNextSyncSequence(),
                    false // isFullSync
                );
                
                if (message) {
                    messageBatch.push(message);
                    this._stats.totalChangesProcessed += candidate.changeCount;
                    
                    // 更新对象的同步时间
                    candidate.identity.updateSyncTime();
                    
                    // 清除已同步的变化
                    syncVarManager.clearChanges(candidate.component);
                }
                
                // 检查批处理大小限制
                if (messageBatch.length >= this._config.maxBatchSize) {
                    this.sendMessageBatch(messageBatch);
                    messageBatch.length = 0; // 清空数组
                }
                
            } catch (error) {
                SyncVarSyncScheduler.logger.error(`处理同步候选对象失败: ${candidate.identity.networkId}`, error);
            }
        }
        
        // 发送剩余的消息
        if (messageBatch.length > 0) {
            this.sendMessageBatch(messageBatch);
        }
    }
    
    /**
     * 发送消息批次
     */
    private async sendMessageBatch(messages: SyncVarUpdateMessage[]): Promise<void> {
        if (!this._messageSendCallback) {
            SyncVarSyncScheduler.logger.warn('没有设置消息发送回调，消息被丢弃');
            return;
        }
        
        for (const message of messages) {
            try {
                await this._messageSendCallback(message);
                this._stats.totalMessagesSent++;
            } catch (error) {
                SyncVarSyncScheduler.logger.error('发送SyncVar消息失败:', error);
                this._stats.errors++;
            }
        }
    }
    
    /**
     * 手动触发同步
     * 
     * @param networkId - 指定网络对象ID，如果不提供则同步所有对象
     */
    public manualSync(networkId?: string): void {
        if (networkId) {
            const identity = NetworkIdentityRegistry.Instance.find(networkId);
            if (identity) {
                this.performSyncCycle();
            }
        } else {
            this.performSyncCycle();
        }
    }
    
    /**
     * 获取调度器统计信息
     */
    public getStats(): typeof SyncVarSyncScheduler.prototype._stats & {
        isRunning: boolean;
        config: SyncVarSyncConfig;
        uptime: number;
    } {
        return {
            ...this._stats,
            isRunning: this._isRunning,
            config: { ...this._config },
            uptime: this._isRunning ? Date.now() - (this._lastSyncTime - this._config.syncInterval) : 0
        };
    }
    
    /**
     * 重置统计信息
     */
    public resetStats(): void {
        this._stats = {
            totalSyncCycles: 0,
            totalObjectsScanned: 0,
            totalMessagesSent: 0,
            totalChangesProcessed: 0,
            averageCycleTime: 0,
            lastCycleTime: 0,
            errors: 0
        };
        SyncVarSyncScheduler.logger.debug('统计信息已重置');
    }
    
    /**
     * 获取当前配置
     */
    public getConfig(): SyncVarSyncConfig {
        return { ...this._config };
    }
    
    /**
     * 检查调度器是否正在运行
     */
    public get isRunning(): boolean {
        return this._isRunning;
    }
}