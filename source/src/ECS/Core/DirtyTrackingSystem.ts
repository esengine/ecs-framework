import { Entity } from '../Entity';
import { Component } from '../Component';
import { ComponentType } from './ComponentStorage';

/**
 * 脏标记类型
 */
export enum DirtyFlag {
    /** 组件数据已修改 */
    COMPONENT_MODIFIED = 1 << 0,
    /** 组件已添加 */
    COMPONENT_ADDED = 1 << 1,
    /** 组件已移除 */
    COMPONENT_REMOVED = 1 << 2,
    /** 实体位置已改变 */
    TRANSFORM_CHANGED = 1 << 3,
    /** 实体状态已改变 */
    STATE_CHANGED = 1 << 4,
    /** 自定义标记1 */
    CUSTOM_1 = 1 << 8,
    /** 自定义标记2 */
    CUSTOM_2 = 1 << 9,
    /** 自定义标记3 */
    CUSTOM_3 = 1 << 10,
    /** 所有标记 */
    ALL = 0xFFFFFFFF
}

/**
 * 脏标记数据
 */
export interface DirtyData {
    /** 实体引用 */
    entity: Entity;
    /** 脏标记位 */
    flags: number;
    /** 修改的组件类型列表 */
    modifiedComponents: Set<ComponentType>;
    /** 标记时间戳 */
    timestamp: number;
    /** 帧编号 */
    frameNumber: number;
}

/**
 * 脏标记监听器
 */
export interface DirtyListener {
    /** 感兴趣的标记类型 */
    flags: number;
    /** 回调函数 */
    callback: (dirtyData: DirtyData) => void;
    /** 监听器优先级（数字越小优先级越高） */
    priority?: number;
}

/**
 * 脏标记统计信息
 */
export interface DirtyStats {
    /** 当前脏实体数量 */
    dirtyEntityCount: number;
    /** 总标记次数 */
    totalMarkings: number;
    /** 总清理次数 */
    totalCleanups: number;
    /** 监听器数量 */
    listenerCount: number;
    /** 平均每帧脏实体数量 */
    avgDirtyPerFrame: number;
    /** 内存使用量估算 */
    estimatedMemoryUsage: number;
}

/**
 * 脏标记追踪系统
 * 
 * 提供高效的组件和实体变更追踪，避免不必要的计算和更新。
 * 支持细粒度的脏标记和批量处理机制。
 * 
 * @example
 * ```typescript
 * const dirtySystem = new DirtyTrackingSystem();
 * 
 * // 标记实体的位置组件已修改
 * dirtySystem.markDirty(entity, DirtyFlag.TRANSFORM_CHANGED, [PositionComponent]);
 * 
 * // 监听位置变化
 * dirtySystem.addListener({
 *     flags: DirtyFlag.TRANSFORM_CHANGED,
 *     callback: (data) => {
 *         console.log('Entity position changed:', data.entity.name);
 *     }
 * });
 * 
 * // 处理所有脏标记
 * dirtySystem.processDirtyEntities();
 * ```
 */
export class DirtyTrackingSystem {
    /** 脏实体映射表 */
    private _dirtyEntities = new Map<Entity, DirtyData>();
    
    /** 脏标记监听器 */
    private _listeners: DirtyListener[] = [];
    
    /** 性能统计 */
    private _stats = {
        totalMarkings: 0,
        totalCleanups: 0,
        frameCount: 0,
        totalDirtyPerFrame: 0
    };
    
    /** 当前帧编号 */
    private _currentFrame = 0;
    
    private _batchSize = 100;
    private _maxProcessingTime = 16;
    
    /** 延迟处理队列 */
    private _processingQueue: DirtyData[] = [];
    private _isProcessing = false;
    
    /**
     * 标记实体为脏状态
     * 
     * @param entity 要标记的实体
     * @param flags 脏标记位
     * @param modifiedComponents 修改的组件类型列表
     */
    public markDirty(entity: Entity, flags: DirtyFlag, modifiedComponents: ComponentType[] = []): void {
        this._stats.totalMarkings++;
        
        let dirtyData = this._dirtyEntities.get(entity);
        if (!dirtyData) {
            dirtyData = {
                entity,
                flags: 0,
                modifiedComponents: new Set(),
                timestamp: performance.now(),
                frameNumber: this._currentFrame
            };
            this._dirtyEntities.set(entity, dirtyData);
        }
        
        dirtyData.flags |= flags;
        dirtyData.timestamp = performance.now();
        dirtyData.frameNumber = this._currentFrame;
        
        for (const componentType of modifiedComponents) {
            dirtyData.modifiedComponents.add(componentType);
        }
        
        this.notifyListeners(dirtyData, flags);
    }
    
    /**
     * 检查实体是否有指定的脏标记
     * 
     * @param entity 要检查的实体
     * @param flags 要检查的标记位
     * @returns 是否有指定的脏标记
     */
    public isDirty(entity: Entity, flags: DirtyFlag = DirtyFlag.ALL): boolean {
        const dirtyData = this._dirtyEntities.get(entity);
        return dirtyData ? (dirtyData.flags & flags) !== 0 : false;
    }
    
    /**
     * 清除实体的脏标记
     * 
     * @param entity 要清除的实体
     * @param flags 要清除的标记位，默认清除所有
     */
    public clearDirty(entity: Entity, flags: DirtyFlag = DirtyFlag.ALL): void {
        const dirtyData = this._dirtyEntities.get(entity);
        if (!dirtyData) return;
        
        if (flags === DirtyFlag.ALL) {
            this._dirtyEntities.delete(entity);
        } else {
            dirtyData.flags &= ~flags;
            if (dirtyData.flags === 0) {
                this._dirtyEntities.delete(entity);
            }
        }
        
        this._stats.totalCleanups++;
    }
    
    /**
     * 获取所有脏实体
     * 
     * @param flags 过滤标记位，只返回包含指定标记的实体
     * @returns 脏实体数据数组
     */
    public getDirtyEntities(flags: DirtyFlag = DirtyFlag.ALL): DirtyData[] {
        const result: DirtyData[] = [];
        
        for (const dirtyData of this._dirtyEntities.values()) {
            if ((dirtyData.flags & flags) !== 0) {
                result.push(dirtyData);
            }
        }
        
        return result;
    }
    
    /**
     * 批量处理脏实体
     * 
     * 使用时间分片的方式处理脏实体，避免单帧卡顿
     */
    public processDirtyEntities(): void {
        if (this._isProcessing) return;
        
        this._isProcessing = true;
        const startTime = performance.now();
        
        if (this._processingQueue.length === 0) {
            this._processingQueue.push(...this._dirtyEntities.values());
        }
        
        let processed = 0;
        while (this._processingQueue.length > 0 && processed < this._batchSize) {
            const elapsed = performance.now() - startTime;
            if (elapsed > this._maxProcessingTime) {
                break;
            }
            
            const dirtyData = this._processingQueue.shift()!;
            this.processEntity(dirtyData);
            processed++;
        }
        
        if (this._processingQueue.length === 0) {
            this._isProcessing = false;
            this.onFrameEnd();
        }
    }
    
    /**
     * 添加脏标记监听器
     * 
     * @param listener 监听器配置
     */
    public addListener(listener: DirtyListener): void {
        this._listeners.push(listener);
        
        this._listeners.sort((a, b) => (a.priority || 100) - (b.priority || 100));
    }
    
    /**
     * 移除脏标记监听器
     * 
     * @param callback 要移除的回调函数
     */
    public removeListener(callback: (dirtyData: DirtyData) => void): void {
        const index = this._listeners.findIndex(l => l.callback === callback);
        if (index !== -1) {
            this._listeners.splice(index, 1);
        }
    }
    
    /**
     * 开始新的帧
     */
    public beginFrame(): void {
        this._currentFrame++;
    }
    
    /**
     * 结束当前帧
     */
    public endFrame(): void {
        if (!this._isProcessing) {
            this.processDirtyEntities();
        }
    }
    
    /**
     * 获取统计信息
     */
    public getStats(): DirtyStats {
        return {
            dirtyEntityCount: this._dirtyEntities.size,
            totalMarkings: this._stats.totalMarkings,
            totalCleanups: this._stats.totalCleanups,
            listenerCount: this._listeners.length,
            avgDirtyPerFrame: this._stats.frameCount > 0 ? 
                this._stats.totalDirtyPerFrame / this._stats.frameCount : 0,
            estimatedMemoryUsage: this.estimateMemoryUsage()
        };
    }
    
    /**
     * 清空所有脏标记和统计信息
     */
    public clear(): void {
        this._dirtyEntities.clear();
        this._processingQueue.length = 0;
        this._isProcessing = false;
        this._stats = {
            totalMarkings: 0,
            totalCleanups: 0,
            frameCount: 0,
            totalDirtyPerFrame: 0
        };
    }
    
    /**
     * 配置批量处理参数
     * 
     * @param batchSize 每次处理的最大实体数量
     * @param maxProcessingTime 每帧最大处理时间（毫秒）
     */
    public configureBatchProcessing(batchSize: number, maxProcessingTime: number): void {
        this._batchSize = batchSize;
        this._maxProcessingTime = maxProcessingTime;
    }
    
    /**
     * 处理单个脏实体
     */
    private processEntity(dirtyData: DirtyData): void {
        for (const listener of this._listeners) {
            if ((dirtyData.flags & listener.flags) !== 0) {
                try {
                    listener.callback(dirtyData);
                } catch (error) {
                    console.error('Dirty listener error:', error);
                }
            }
        }
        
        this.clearDirty(dirtyData.entity);
    }
    
    /**
     * 通知监听器
     */
    private notifyListeners(dirtyData: DirtyData, newFlags: DirtyFlag): void {
        for (const listener of this._listeners) {
            if ((newFlags & listener.flags) !== 0) {
                try {
                    listener.callback(dirtyData);
                } catch (error) {
                    console.error('Dirty listener notification error:', error);
                }
            }
        }
    }
    
    /**
     * 帧结束时的统计更新
     */
    private onFrameEnd(): void {
        this._stats.frameCount++;
        this._stats.totalDirtyPerFrame += this._dirtyEntities.size;
    }
    
    /**
     * 估算内存使用量
     */
    private estimateMemoryUsage(): number {
        let usage = 0;
        
        usage += this._dirtyEntities.size * 100;
        usage += this._listeners.length * 50;
        usage += this._processingQueue.length * 8;
        
        return usage;
    }
} 