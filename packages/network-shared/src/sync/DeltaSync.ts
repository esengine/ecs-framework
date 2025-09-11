import { createLogger } from '@esengine/ecs-framework';

/**
 * 差量同步配置
 */
export interface DeltaSyncConfig {
    /** 是否启用差量同步 */
    enabled: boolean;
    /** 最大历史版本数 */
    maxHistoryVersions: number;
    /** 版本超时时间(毫秒) */
    versionTimeout: number;
    /** 差量压缩阈值 */
    compressionThreshold: number;
    /** 是否启用智能合并 */
    enableSmartMerging: boolean;
    /** 合并时间窗口(毫秒) */
    mergeWindow: number;
}

/**
 * 版本化数据
 */
export interface VersionedData {
    version: number;
    timestamp: number;
    data: any;
    checksum?: string;
}

/**
 * 差量变更映射
 */
export interface DeltaChanges {
    [key: string]: any;
}

/**
 * 差量元数据
 */
export interface DeltaMetadata {
    timestamp: number;
    size: number;
    compressionRatio: number;
}

/**
 * 差量数据
 */
export interface DeltaData {
    baseVersion: number;
    targetVersion: number;
    changes: DeltaChanges;
    deletions: string[];
    metadata: DeltaMetadata;
}

/**
 * 差量操作类型
 */
export enum DeltaOperationType {
    /** 添加属性 */
    ADD = 'add',
    /** 修改属性 */
    MODIFY = 'modify',
    /** 删除属性 */
    DELETE = 'delete',
    /** 批量操作 */
    BATCH = 'batch',
    /** 无操作（合并后消除的操作） */
    NOOP = 'noop'
}

/**
 * 差量操作
 */
export interface DeltaOperation {
    type: DeltaOperationType;
    path: string;
    oldValue?: any;
    newValue?: any;
    timestamp: number;
}

/**
 * 差量同步统计
 */
export interface DeltaSyncStats {
    totalDeltas: number;
    totalSize: number;
    compressionRatio: number;
    averageDeltaSize: number;
    cacheHitRate: number;
    mergedOperations: number;
}

/**
 * 差量同步器
 * 负责计算和应用数据差量，减少网络传输量
 */
export class DeltaSync {
    private logger = createLogger('DeltaSync');
    private config: DeltaSyncConfig;
    
    /** 版本历史 */
    private versionHistory = new Map<string, Map<number, VersionedData>>();
    
    /** 版本计数器 */
    private versionCounters = new Map<string, number>();
    
    /** 差量缓存 */
    private deltaCache = new Map<string, DeltaData>();
    
    /** 待合并操作 */
    private pendingOperations = new Map<string, DeltaOperation[]>();
    
    /** 统计信息 */
    private stats: DeltaSyncStats = {
        totalDeltas: 0,
        totalSize: 0,
        compressionRatio: 1,
        averageDeltaSize: 0,
        cacheHitRate: 0,
        mergedOperations: 0
    };
    
    /** 合并定时器 */
    private mergeTimers = new Map<string, any>();

    constructor(config: Partial<DeltaSyncConfig> = {}) {
        this.config = {
            enabled: true,
            maxHistoryVersions: 10,
            versionTimeout: 30000,
            compressionThreshold: 100,
            enableSmartMerging: true,
            mergeWindow: 50,
            ...config
        };
    }

    /**
     * 记录基线版本
     */
    public recordBaseline(instanceId: string, data: any): number {
        if (!this.config.enabled) {
            return 0;
        }
        
        const version = this.getNextVersion(instanceId);
        const versionedData: VersionedData = {
            version,
            timestamp: Date.now(),
            data: this.deepClone(data),
            checksum: this.calculateChecksum(data)
        };
        
        this.storeVersion(instanceId, versionedData);
        return version;
    }

    /**
     * 计算差量
     */
    public calculateDelta(instanceId: string, newData: any, baseVersion?: number): DeltaData | null {
        if (!this.config.enabled) {
            return null;
        }
        
        const history = this.versionHistory.get(instanceId);
        if (!history || history.size === 0) {
            // 没有基线，记录第一个版本
            this.recordBaseline(instanceId, newData);
            return null;
        }
        
        // 选择基线版本
        let baseVersionData: VersionedData;
        if (baseVersion !== undefined) {
            const foundVersion = history.get(baseVersion);
            if (!foundVersion) {
                this.logger.warn(`未找到版本 ${baseVersion}，使用最新版本`);
                const latestVersion = this.getLatestVersion(instanceId);
                if (!latestVersion) {
                    this.logger.error(`实例 ${instanceId} 没有任何版本历史`);
                    return null;
                }
                baseVersionData = latestVersion;
            } else {
                baseVersionData = foundVersion;
            }
        } else {
            const latestVersion = this.getLatestVersion(instanceId);
            if (!latestVersion) {
                this.logger.error(`实例 ${instanceId} 没有任何版本历史`);
                return null;
            }
            baseVersionData = latestVersion;
        }
        
        const targetVersion = this.getNextVersion(instanceId);
        const changes = this.computeChanges(baseVersionData.data, newData);
        const deletions = this.computeDeletions(baseVersionData.data, newData);
        
        // 检查是否有变化
        if (Object.keys(changes).length === 0 && deletions.length === 0) {
            return null;
        }
        
        const deltaData: DeltaData = {
            baseVersion: baseVersionData.version,
            targetVersion,
            changes,
            deletions,
            metadata: {
                timestamp: Date.now(),
                size: this.estimateSize(changes) + this.estimateSize(deletions),
                compressionRatio: 1
            }
        };
        
        // 记录新版本
        this.recordBaseline(instanceId, newData);
        
        // 更新统计
        this.updateStats(deltaData);
        
        return deltaData;
    }

    /**
     * 应用差量
     */
    public applyDelta(instanceId: string, delta: DeltaData): any {
        if (!this.config.enabled) {
            return null;
        }
        
        const history = this.versionHistory.get(instanceId);
        if (!history) {
            this.logger.error(`实例 ${instanceId} 没有版本历史`);
            return null;
        }
        
        const baseData = history.get(delta.baseVersion);
        if (!baseData) {
            this.logger.error(`未找到基线版本 ${delta.baseVersion}`);
            return null;
        }
        
        // 复制基线数据
        const result = this.deepClone(baseData.data);
        
        // 应用变化
        for (const [key, value] of Object.entries(delta.changes)) {
            this.setNestedProperty(result, key, value);
        }
        
        // 应用删除
        for (const key of delta.deletions) {
            this.deleteNestedProperty(result, key);
        }
        
        // 记录结果版本
        const resultVersion: VersionedData = {
            version: delta.targetVersion,
            timestamp: delta.metadata.timestamp,
            data: this.deepClone(result),
            checksum: this.calculateChecksum(result)
        };
        
        this.storeVersion(instanceId, resultVersion);
        
        return result;
    }

    /**
     * 智能合并操作
     */
    public mergeOperations(instanceId: string, operations: DeltaOperation[]): DeltaOperation[] {
        if (!this.config.enableSmartMerging || operations.length <= 1) {
            return operations;
        }
        
        const pathMap = new Map<string, DeltaOperation>();
        
        // 按路径分组操作
        for (const op of operations) {
            const existing = pathMap.get(op.path);
            
            if (!existing) {
                pathMap.set(op.path, op);
            } else {
                // 合并同路径的操作
                const mergedOp = this.mergeTwoOperations(existing, op);
                pathMap.set(op.path, mergedOp);
                this.stats.mergedOperations++;
            }
        }
        
        // 过滤掉NOOP操作
        return Array.from(pathMap.values()).filter(op => op.type !== DeltaOperationType.NOOP);
    }

    /**
     * 延迟合并操作
     */
    public scheduleOperation(instanceId: string, operation: DeltaOperation): void {
        if (!this.config.enableSmartMerging) {
            return;
        }
        
        let operations = this.pendingOperations.get(instanceId);
        if (!operations) {
            operations = [];
            this.pendingOperations.set(instanceId, operations);
        }
        
        operations.push(operation);
        
        // 重置合并定时器
        const existingTimer = this.mergeTimers.get(instanceId);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        
        const timer = setTimeout(() => {
            this.flushPendingOperations(instanceId);
        }, this.config.mergeWindow);
        
        this.mergeTimers.set(instanceId, timer);
    }

    /**
     * 压缩差量数据
     */
    public compressDelta(delta: DeltaData): DeltaData {
        if (delta.metadata.size < this.config.compressionThreshold) {
            return delta;
        }
        
        // 简化的压缩实现
        const compressedChanges = this.compressObject(delta.changes);
        const compressedDeletions = delta.deletions; // 删除操作通常已经很紧凑
        
        const originalSize = delta.metadata.size;
        const compressedSize = this.estimateSize(compressedChanges) + this.estimateSize(compressedDeletions);
        
        return {
            ...delta,
            changes: compressedChanges,
            deletions: compressedDeletions,
            metadata: {
                ...delta.metadata,
                size: compressedSize,
                compressionRatio: compressedSize / originalSize
            }
        };
    }

    /**
     * 清理过期版本
     */
    public cleanup(): void {
        const now = Date.now();
        
        for (const [instanceId, history] of this.versionHistory) {
            const versionsToDelete: number[] = [];
            
            for (const [version, versionData] of history) {
                // 检查超时
                if (now - versionData.timestamp > this.config.versionTimeout) {
                    versionsToDelete.push(version);
                }
            }
            
            // 保留最新的几个版本
            const sortedVersions = Array.from(history.keys()).sort((a, b) => b - a);
            const toKeep = sortedVersions.slice(0, this.config.maxHistoryVersions);
            
            for (const version of versionsToDelete) {
                if (!toKeep.includes(version)) {
                    history.delete(version);
                }
            }
            
            // 如果实例没有版本了，删除实例
            if (history.size === 0) {
                this.versionHistory.delete(instanceId);
                this.versionCounters.delete(instanceId);
            }
        }
        
        // 清理差量缓存
        this.deltaCache.clear();
    }

    /**
     * 获取统计信息
     */
    public getStats(): DeltaSyncStats {
        return { ...this.stats };
    }

    /**
     * 重置统计信息
     */
    public resetStats(): void {
        this.stats = {
            totalDeltas: 0,
            totalSize: 0,
            compressionRatio: 1,
            averageDeltaSize: 0,
            cacheHitRate: 0,
            mergedOperations: 0
        };
    }

    /**
     * 更新配置
     */
    public updateConfig(newConfig: Partial<DeltaSyncConfig>): void {
        Object.assign(this.config, newConfig);
    }

    /**
     * 销毁同步器
     */
    public destroy(): void {
        // 清理定时器
        for (const timer of this.mergeTimers.values()) {
            clearTimeout(timer);
        }
        
        this.versionHistory.clear();
        this.versionCounters.clear();
        this.deltaCache.clear();
        this.pendingOperations.clear();
        this.mergeTimers.clear();
    }

    /**
     * 获取下一个版本号
     */
    private getNextVersion(instanceId: string): number {
        const current = this.versionCounters.get(instanceId) || 0;
        const next = current + 1;
        this.versionCounters.set(instanceId, next);
        return next;
    }

    /**
     * 存储版本数据
     */
    private storeVersion(instanceId: string, versionData: VersionedData): void {
        let history = this.versionHistory.get(instanceId);
        if (!history) {
            history = new Map();
            this.versionHistory.set(instanceId, history);
        }
        
        history.set(versionData.version, versionData);
        
        // 限制历史版本数量
        if (history.size > this.config.maxHistoryVersions) {
            const oldestVersion = Math.min(...Array.from(history.keys()));
            history.delete(oldestVersion);
        }
    }

    /**
     * 获取最新版本
     */
    private getLatestVersion(instanceId: string): VersionedData | undefined {
        const history = this.versionHistory.get(instanceId);
        if (!history || history.size === 0) {
            return undefined;
        }
        
        const latestVersion = Math.max(...Array.from(history.keys()));
        return history.get(latestVersion);
    }

    /**
     * 计算变化
     */
    private computeChanges(oldData: any, newData: any): DeltaChanges {
        const changes: DeltaChanges = {};
        
        for (const [key, newValue] of Object.entries(newData)) {
            const oldValue = oldData[key];
            
            if (!this.deepEqual(oldValue, newValue)) {
                changes[key] = newValue;
            }
        }
        
        return changes;
    }

    /**
     * 计算删除
     */
    private computeDeletions(oldData: any, newData: any): string[] {
        const deletions: string[] = [];
        
        for (const key of Object.keys(oldData)) {
            if (!(key in newData)) {
                deletions.push(key);
            }
        }
        
        return deletions;
    }

    /**
     * 合并两个操作
     */
    private mergeTwoOperations(op1: DeltaOperation, op2: DeltaOperation): DeltaOperation {
        // 智能合并逻辑
        const mergedOp: DeltaOperation = {
            type: op2.type,
            path: op2.path,
            oldValue: op1.oldValue, // 保留最初的旧值
            newValue: op2.newValue,
            timestamp: op2.timestamp
        };

        // 处理特殊合并情况
        if (op1.type === DeltaOperationType.ADD && op2.type === DeltaOperationType.DELETE) {
            // 添加后删除 = 无操作
            return {
                type: DeltaOperationType.NOOP,
                path: op2.path,
                oldValue: undefined,
                newValue: undefined,
                timestamp: op2.timestamp
            };
        }

        if (op1.type === DeltaOperationType.DELETE && op2.type === DeltaOperationType.ADD) {
            // 删除后添加 = 修改
            mergedOp.type = DeltaOperationType.MODIFY;
            mergedOp.oldValue = op1.oldValue;
        }

        if (op1.type === DeltaOperationType.MODIFY && op2.type === DeltaOperationType.DELETE) {
            // 修改后删除 = 删除原始值
            mergedOp.type = DeltaOperationType.DELETE;
            mergedOp.newValue = undefined;
        }

        // 检查是否值回到了原始状态
        if (op1.type === DeltaOperationType.MODIFY && 
            op2.type === DeltaOperationType.MODIFY &&
            this.deepEqual(op1.oldValue, op2.newValue)) {
            // 值回到原始状态 = 无操作
            return {
                type: DeltaOperationType.NOOP,
                path: op2.path,
                oldValue: undefined,
                newValue: undefined,
                timestamp: op2.timestamp
            };
        }

        return mergedOp;
    }

    /**
     * 刷新待处理操作
     */
    private flushPendingOperations(instanceId: string): void {
        const operations = this.pendingOperations.get(instanceId);
        if (!operations || operations.length === 0) {
            return;
        }
        
        // 合并操作并发送
        this.mergeOperations(instanceId, operations);
        
        // 清理待处理操作
        this.pendingOperations.delete(instanceId);
        this.mergeTimers.delete(instanceId);
    }

    /**
     * 压缩对象
     */
    private compressObject(obj: any): any {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }

        // 移除null和undefined值
        const compressed: any = Array.isArray(obj) ? [] : {};
        
        for (const [key, value] of Object.entries(obj)) {
            if (value !== null && value !== undefined) {
                if (typeof value === 'object') {
                    compressed[key] = this.compressObject(value);
                } else {
                    compressed[key] = value;
                }
            }
        }

        return compressed;
    }

    /**
     * 估算大小
     */
    private estimateSize(obj: any): number {
        if (obj === null || obj === undefined) {
            return 4; // "null"的长度
        }
        
        if (typeof obj === 'string') {
            return obj.length * 2; // UTF-16字符估算
        }
        
        if (typeof obj === 'number') {
            return 8; // 64位数字
        }
        
        if (typeof obj === 'boolean') {
            return 4; // true/false
        }
        
        if (Array.isArray(obj)) {
            let size = 2; // []
            for (const item of obj) {
                size += this.estimateSize(item) + 1; // +1 for comma
            }
            return size;
        }
        
        if (typeof obj === 'object') {
            let size = 2; // {}
            for (const [key, value] of Object.entries(obj)) {
                size += key.length * 2 + 3; // key + ":"
                size += this.estimateSize(value) + 1; // value + comma
            }
            return size;
        }
        
        return JSON.stringify(obj).length;
    }

    /**
     * 深度克隆
     */
    private deepClone(obj: any): any {
        if (obj === null || obj === undefined) {
            return obj;
        }
        
        if (typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (obj instanceof RegExp) {
            return new RegExp(obj);
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.deepClone(item));
        }
        
        const cloned: any = {};
        for (const [key, value] of Object.entries(obj)) {
            cloned[key] = this.deepClone(value);
        }
        
        return cloned;
    }

    /**
     * 深度比较
     */
    private deepEqual(obj1: any, obj2: any): boolean {
        if (obj1 === obj2) {
            return true;
        }
        
        if (obj1 === null || obj2 === null || obj1 === undefined || obj2 === undefined) {
            return obj1 === obj2;
        }
        
        if (typeof obj1 !== typeof obj2) {
            return false;
        }
        
        if (typeof obj1 !== 'object') {
            return obj1 === obj2;
        }
        
        if (obj1 instanceof Date && obj2 instanceof Date) {
            return obj1.getTime() === obj2.getTime();
        }
        
        if (Array.isArray(obj1) !== Array.isArray(obj2)) {
            return false;
        }
        
        if (Array.isArray(obj1)) {
            if (obj1.length !== obj2.length) {
                return false;
            }
            for (let i = 0; i < obj1.length; i++) {
                if (!this.deepEqual(obj1[i], obj2[i])) {
                    return false;
                }
            }
            return true;
        }
        
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        
        if (keys1.length !== keys2.length) {
            return false;
        }
        
        for (const key of keys1) {
            if (!keys2.includes(key)) {
                return false;
            }
            if (!this.deepEqual(obj1[key], obj2[key])) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * 设置嵌套属性
     */
    private setNestedProperty(obj: any, path: string, value: any): void {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current)) {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[keys[keys.length - 1]] = value;
    }

    /**
     * 删除嵌套属性
     */
    private deleteNestedProperty(obj: any, path: string): void {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current)) {
                return; // 路径不存在
            }
            current = current[key];
        }
        
        delete current[keys[keys.length - 1]];
    }

    /**
     * 计算校验和
     */
    private calculateChecksum(obj: any): string {
        // 简化的校验和实现
        const str = JSON.stringify(obj);
        let hash = 0;
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        
        return hash.toString(16);
    }

    /**
     * 更新统计信息
     */
    private updateStats(delta: DeltaData): void {
        this.stats.totalDeltas++;
        this.stats.totalSize += delta.metadata.size;
        this.stats.averageDeltaSize = this.stats.totalSize / this.stats.totalDeltas;
        this.stats.compressionRatio = 
            (this.stats.compressionRatio * (this.stats.totalDeltas - 1) + delta.metadata.compressionRatio) / 
            this.stats.totalDeltas;
    }
}