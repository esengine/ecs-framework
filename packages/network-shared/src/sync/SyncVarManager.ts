import { 
    getSyncVarMetadata, 
    getDirtySyncVars, 
    clearDirtyFlags, 
    SyncVarMetadata,
    hasSyncVars,
    SyncVarValue
} from '../decorators/SyncVar';
import { SyncMode, AuthorityType, NetworkScope } from '../types/NetworkTypes';
import { EventEmitter } from '../utils/EventEmitter';

/**
 * 属性值映射类型
 */
export interface PropertyChanges {
    [propertyKey: string]: SyncVarValue;
}

/**
 * 同步模式映射类型
 */
export interface SyncModeMap {
    [propertyKey: string]: SyncMode;
}

/**
 * 权限映射类型
 */
export interface AuthorityMap {
    [propertyKey: string]: AuthorityType;
}

/**
 * 作用域映射类型
 */
export interface ScopeMap {
    [propertyKey: string]: NetworkScope;
}

/**
 * 优先级映射类型
 */
export interface PriorityMap {
    [propertyKey: string]: number;
}

/**
 * 同步批次数据
 */
export interface SyncBatch {
    /** 实例ID */
    instanceId: string;
    /** 实例类型 */
    instanceType: string;
    /** 变化的属性数据 */
    changes: PropertyChanges;
    /** 时间戳 */
    timestamp: number;
    /** 同步模式映射 */
    syncModes: SyncModeMap;
    /** 权限映射 */
    authorities: AuthorityMap;
    /** 作用域映射 */
    scopes: ScopeMap;
    /** 优先级映射 */
    priorities: PriorityMap;
}

/**
 * 同步统计信息
 */
export interface SyncStats {
    /** 注册的实例数量 */
    registeredInstances: number;
    /** 脏实例数量 */
    dirtyInstances: number;
    /** 总同步次数 */
    totalSyncs: number;
    /** 总传输字节数 */
    totalBytes: number;
    /** 平均同步延迟 */
    averageLatency: number;
    /** 每秒同步次数 */
    syncsPerSecond: number;
    /** 最后同步时间 */
    lastSyncTime: number;
}

/**
 * SyncVar管理器事件
 */
export interface SyncVarManagerEvents {
    instanceRegistered: (instanceId: string, instance: object) => void;
    instanceUnregistered: (instanceId: string) => void;
    syncBatchReady: (batch: SyncBatch) => void;
    syncCompleted: (instanceId: string, propertyCount: number) => void;
    syncError: (error: Error, instanceId?: string) => void;
}

/**
 * SyncVar管理器
 * 负责管理所有带有SyncVar的实例，追踪变化并生成同步批次
 */
export class SyncVarManager extends EventEmitter {
    private static instance: SyncVarManager | null = null;
    
    /** 注册的实例映射 */
    private registeredInstances = new Map<string, object>();
    
    /** 脏实例集合 */
    private dirtyInstances = new Set<string>();
    
    /** 实例ID计数器 */
    private instanceIdCounter = 0;
    
    /** 实例ID映射 */
    private instanceIdMap = new WeakMap<any, string>();
    
    /** 统计信息 */
    private stats: SyncStats = {
        registeredInstances: 0,
        dirtyInstances: 0,
        totalSyncs: 0,
        totalBytes: 0,
        averageLatency: 0,
        syncsPerSecond: 0,
        lastSyncTime: 0
    };
    
    /** 自动同步定时器 */
    private autoSyncTimer: ReturnType<typeof setInterval> | null = null;
    
    /** 同步频率(毫秒) */
    private syncRate = 100;
    
    /** 是否启用自动同步 */
    private autoSyncEnabled = true;
    
    /** 最大批次大小 */
    private maxBatchSize = 100;
    
    /** 立即同步请求队列 */
    private immediateSyncQueue = new Set<{ instanceId: string; propertyKey?: string | symbol }>();

    private constructor() {
        super();
        this.startAutoSync();
    }

    /**
     * 获取单例实例
     */
    public static getInstance(): SyncVarManager {
        if (!SyncVarManager.instance) {
            SyncVarManager.instance = new SyncVarManager();
        }
        return SyncVarManager.instance;
    }

    /**
     * 注册实例
     */
    public registerInstance(instance: object): string {
        if (!hasSyncVars(instance)) {
            throw new Error('实例没有SyncVar属性，无法注册');
        }

        // 检查是否已经注册
        if (this.instanceIdMap.has(instance)) {
            return this.instanceIdMap.get(instance)!;
        }

        // 生成新的实例ID
        const instanceId = `syncvar_${++this.instanceIdCounter}`;
        
        // 注册实例
        this.registeredInstances.set(instanceId, instance);
        this.instanceIdMap.set(instance, instanceId);
        
        // 更新统计
        this.stats.registeredInstances = this.registeredInstances.size;
        
        this.emit('instanceRegistered', instanceId, instance);
        return instanceId;
    }

    /**
     * 注销实例
     */
    public unregisterInstance(instance: object): boolean {
        const instanceId = this.instanceIdMap.get(instance);
        if (!instanceId) {
            return false;
        }

        // 删除注册信息
        this.registeredInstances.delete(instanceId);
        this.instanceIdMap.delete(instance);
        this.dirtyInstances.delete(instanceId);
        
        // 更新统计
        this.stats.registeredInstances = this.registeredInstances.size;
        this.stats.dirtyInstances = this.dirtyInstances.size;
        
        this.emit('instanceUnregistered', instanceId);
        return true;
    }

    /**
     * 标记实例为脏数据
     */
    public markInstanceDirty(instance: object): void {
        const instanceId = this.instanceIdMap.get(instance);
        if (!instanceId) {
            // 自动注册实例
            this.registerInstance(instance);
            return this.markInstanceDirty(instance);
        }

        this.dirtyInstances.add(instanceId);
        this.stats.dirtyInstances = this.dirtyInstances.size;
    }

    /**
     * 请求立即同步
     */
    public requestImmediateSync(instance: object, propertyKey?: string | symbol): void {
        const instanceId = this.instanceIdMap.get(instance);
        if (!instanceId) {
            return;
        }

        this.markInstanceDirty(instance);
        this.immediateSyncQueue.add({ instanceId, propertyKey });
        
        // 立即处理同步
        this.processImmediateSyncs();
    }

    /**
     * 手动触发同步
     */
    public syncNow(): SyncBatch[] {
        const batches: SyncBatch[] = [];
        
        // 处理立即同步请求
        this.processImmediateSyncs();
        
        // 收集所有脏实例的数据
        for (const instanceId of this.dirtyInstances) {
            const batch = this.createSyncBatch(instanceId);
            if (batch && Object.keys(batch.changes).length > 0) {
                batches.push(batch);
            }
        }
        
        // 清理脏标记
        this.clearAllDirtyFlags();
        
        // 更新统计
        this.stats.totalSyncs += batches.length;
        this.stats.lastSyncTime = Date.now();
        
        return batches;
    }

    /**
     * 设置同步频率
     */
    public setSyncRate(rate: number): void {
        this.syncRate = Math.max(1, rate);
        if (this.autoSyncEnabled) {
            this.restartAutoSync();
        }
    }

    /**
     * 启用/禁用自动同步
     */
    public setAutoSyncEnabled(enabled: boolean): void {
        this.autoSyncEnabled = enabled;
        if (enabled) {
            this.startAutoSync();
        } else {
            this.stopAutoSync();
        }
    }

    /**
     * 设置最大批次大小
     */
    public setMaxBatchSize(size: number): void {
        this.maxBatchSize = Math.max(1, size);
    }

    /**
     * 获取统计信息
     */
    public getStats(): SyncStats {
        return { ...this.stats };
    }

    /**
     * 获取实例ID
     */
    public getInstanceId(instance: object): string | undefined {
        return this.instanceIdMap.get(instance);
    }

    /**
     * 获取实例
     */
    public getInstance(instanceId: string): object | undefined {
        return this.registeredInstances.get(instanceId);
    }

    /**
     * 获取所有注册的实例ID
     */
    public getAllInstanceIds(): string[] {
        return Array.from(this.registeredInstances.keys());
    }

    /**
     * 检查实例是否为脏数据
     */
    public isInstanceDirty(instanceId: string): boolean {
        return this.dirtyInstances.has(instanceId);
    }

    /**
     * 重置统计信息
     */
    public resetStats(): void {
        this.stats = {
            ...this.stats,
            totalSyncs: 0,
            totalBytes: 0,
            averageLatency: 0,
            syncsPerSecond: 0
        };
    }

    /**
     * 销毁管理器
     */
    public destroy(): void {
        this.stopAutoSync();
        this.registeredInstances.clear();
        this.dirtyInstances.clear();
        this.instanceIdMap = new WeakMap();
        this.immediateSyncQueue.clear();
        this.removeAllListeners();
        SyncVarManager.instance = null;
    }

    /**
     * 创建同步批次
     */
    private createSyncBatch(instanceId: string): SyncBatch | null {
        const instance = this.registeredInstances.get(instanceId);
        if (!instance) {
            return null;
        }

        const dirtyVars = getDirtySyncVars(instance);
        if (dirtyVars.size === 0) {
            return null;
        }

        const changes: { [propertyKey: string]: SyncVarValue } = {};
        const syncModes: { [propertyKey: string]: SyncMode } = {};
        const authorities: { [propertyKey: string]: AuthorityType } = {};
        const scopes: { [propertyKey: string]: NetworkScope } = {};
        const priorities: { [propertyKey: string]: number } = {};

        for (const [propertyKey, metadata] of dirtyVars) {
            const key = String(propertyKey);
            changes[key] = (instance as any)[propertyKey];
            syncModes[key] = metadata.options.mode;
            authorities[key] = metadata.options.authority;
            scopes[key] = metadata.options.scope;
            priorities[key] = metadata.options.priority;
        }

        return {
            instanceId,
            instanceType: instance.constructor.name,
            changes,
            timestamp: Date.now(),
            syncModes,
            authorities,
            scopes,
            priorities
        };
    }

    /**
     * 处理立即同步请求
     */
    private processImmediateSyncs(): void {
        if (this.immediateSyncQueue.size === 0) {
            return;
        }

        const batches: SyncBatch[] = [];
        
        for (const request of this.immediateSyncQueue) {
            const batch = this.createSyncBatch(request.instanceId);
            if (batch && Object.keys(batch.changes).length > 0) {
                // 如果指定了特定属性，只同步该属性
                if (request.propertyKey) {
                    const key = String(request.propertyKey);
                    if (batch.changes[key] !== undefined) {
                        const filteredBatch: SyncBatch = {
                            ...batch,
                            changes: { [key]: batch.changes[key] },
                            syncModes: { [key]: batch.syncModes[key] },
                            authorities: { [key]: batch.authorities[key] },
                            scopes: { [key]: batch.scopes[key] },
                            priorities: { [key]: batch.priorities[key] }
                        };
                        batches.push(filteredBatch);
                    }
                } else {
                    batches.push(batch);
                }
            }
        }

        // 清空立即同步队列
        this.immediateSyncQueue.clear();

        // 发送批次
        for (const batch of batches) {
            this.emit('syncBatchReady', batch);
            this.emit('syncCompleted', batch.instanceId, Object.keys(batch.changes).length);
        }
    }

    /**
     * 清理所有脏标记
     */
    private clearAllDirtyFlags(): void {
        for (const instanceId of this.dirtyInstances) {
            const instance = this.registeredInstances.get(instanceId);
            if (instance) {
                clearDirtyFlags(instance);
            }
        }
        
        this.dirtyInstances.clear();
        this.stats.dirtyInstances = 0;
    }

    /**
     * 启动自动同步
     */
    private startAutoSync(): void {
        if (this.autoSyncTimer || !this.autoSyncEnabled) {
            return;
        }

        this.autoSyncTimer = setInterval(() => {
            try {
                const batches = this.syncNow();
                for (const batch of batches) {
                    this.emit('syncBatchReady', batch);
                    this.emit('syncCompleted', batch.instanceId, Object.keys(batch.changes).length);
                }
            } catch (error) {
                this.emit('syncError', error as Error);
            }
        }, this.syncRate);
    }

    /**
     * 停止自动同步
     */
    private stopAutoSync(): void {
        if (this.autoSyncTimer) {
            clearInterval(this.autoSyncTimer);
            this.autoSyncTimer = null;
        }
    }

    /**
     * 重启自动同步
     */
    private restartAutoSync(): void {
        this.stopAutoSync();
        this.startAutoSync();
    }
}

// 全局单例访问
if (typeof window !== 'undefined') {
    (window as any).SyncVarManager = SyncVarManager.getInstance();
}