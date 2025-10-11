import { Entity } from '../Entity';
import { QueryCondition, QueryConditionType } from './QuerySystem';
import { BitMask64Utils } from '../Utils/BigIntCompatibility';
import { createLogger } from '../../Utils/Logger';

const logger = createLogger('ReactiveQuery');

/**
 * 响应式查询变化类型
 */
export enum ReactiveQueryChangeType {
    /** 实体添加到查询结果 */
    ADDED = 'added',
    /** 实体从查询结果移除 */
    REMOVED = 'removed',
    /** 查询结果批量更新 */
    BATCH_UPDATE = 'batch_update'
}

/**
 * 响应式查询变化事件
 */
export interface ReactiveQueryChange {
    /** 变化类型 */
    type: ReactiveQueryChangeType;
    /** 变化的实体 */
    entity?: Entity;
    /** 批量变化的实体 */
    entities?: readonly Entity[];
    /** 新增的实体列表(仅batch_update时有效) */
    added?: readonly Entity[];
    /** 移除的实体列表(仅batch_update时有效) */
    removed?: readonly Entity[];
}

/**
 * 响应式查询监听器
 */
export type ReactiveQueryListener = (change: ReactiveQueryChange) => void;

/**
 * 响应式查询配置
 */
export interface ReactiveQueryConfig {
    /** 是否启用批量模式(减少通知频率) */
    enableBatchMode?: boolean;
    /** 批量模式的延迟时间(毫秒) */
    batchDelay?: number;
    /** 调试模式 */
    debug?: boolean;
}

/**
 * 响应式查询类
 *
 * 提供基于事件驱动的实体查询机制,只在实体/组件真正变化时触发通知。
 *
 * 核心特性:
 * - Event-driven: 基于事件的增量更新
 * - 精确通知: 只通知真正匹配的变化
 * - 性能优化: 避免每帧重复查询
 *
 * @example
 * ```typescript
 * // 创建响应式查询
 * const query = new ReactiveQuery(querySystem, {
 *     type: QueryConditionType.ALL,
 *     componentTypes: [Position, Velocity],
 *     mask: createMask([Position, Velocity])
 * });
 *
 * // 订阅变化
 * query.subscribe((change) => {
 *     if (change.type === ReactiveQueryChangeType.ADDED) {
 *         console.log('新实体:', change.entity);
 *     }
 * });
 *
 * // 获取当前结果
 * const entities = query.getEntities();
 * ```
 */
export class ReactiveQuery {
    /** 当前查询结果 */
    private _entities: Entity[] = [];

    /** 实体ID集合,用于快速查找 */
    private _entityIdSet: Set<number> = new Set();

    /** 查询条件 */
    private readonly _condition: QueryCondition;

    /** 监听器列表 */
    private _listeners: ReactiveQueryListener[] = [];

    /** 配置 */
    private readonly _config: ReactiveQueryConfig;

    /** 批量变化缓存 */
    private _batchChanges: {
        added: Entity[];
        removed: Entity[];
        timer: ReturnType<typeof setTimeout> | null;
    };

    /** 查询ID(用于调试) */
    private readonly _id: string;

    /** 是否已激活 */
    private _active: boolean = true;

    constructor(condition: QueryCondition, config: ReactiveQueryConfig = {}) {
        this._condition = condition;
        this._config = {
            enableBatchMode: config.enableBatchMode ?? true,
            batchDelay: config.batchDelay ?? 16, // 默认一帧
            debug: config.debug ?? false
        };

        this._id = this.generateQueryId();

        this._batchChanges = {
            added: [],
            removed: [],
            timer: null
        };

        if (this._config.debug) {
            logger.debug(`创建ReactiveQuery: ${this._id}`);
        }
    }

    /**
     * 生成查询ID
     */
    private generateQueryId(): string {
        const typeStr = this._condition.type;
        const componentsStr = this._condition.componentTypes
            .map(t => t.name)
            .sort()
            .join(',');
        return `${typeStr}:${componentsStr}`;
    }

    /**
     * 订阅查询变化
     *
     * @param listener 监听器函数
     * @returns 取消订阅的函数
     */
    public subscribe(listener: ReactiveQueryListener): () => void {
        this._listeners.push(listener);

        if (this._config.debug) {
            logger.debug(`订阅ReactiveQuery: ${this._id}, 监听器数量: ${this._listeners.length}`);
        }

        // 返回取消订阅函数
        return () => {
            const index = this._listeners.indexOf(listener);
            if (index !== -1) {
                this._listeners.splice(index, 1);
            }
        };
    }

    /**
     * 取消所有订阅
     */
    public unsubscribeAll(): void {
        this._listeners.length = 0;
    }

    /**
     * 获取当前查询结果
     */
    public getEntities(): readonly Entity[] {
        return this._entities;
    }

    /**
     * 获取查询结果数量
     */
    public get count(): number {
        return this._entities.length;
    }

    /**
     * 检查实体是否匹配查询条件
     *
     * @param entity 要检查的实体
     * @returns 是否匹配
     */
    public matches(entity: Entity): boolean {
        const entityMask = entity.componentMask;

        switch (this._condition.type) {
            case QueryConditionType.ALL:
                return BitMask64Utils.hasAll(entityMask, this._condition.mask);
            case QueryConditionType.ANY:
                return BitMask64Utils.hasAny(entityMask, this._condition.mask);
            case QueryConditionType.NONE:
                return BitMask64Utils.hasNone(entityMask, this._condition.mask);
            default:
                return false;
        }
    }

    /**
     * 通知实体添加
     *
     * 当Scene中添加实体时调用
     *
     * @param entity 添加的实体
     */
    public notifyEntityAdded(entity: Entity): void {
        if (!this._active) return;

        // 检查实体是否匹配查询条件
        if (!this.matches(entity)) {
            return;
        }

        // 检查是否已存在
        if (this._entityIdSet.has(entity.id)) {
            return;
        }

        // 添加到结果集
        this._entities.push(entity);
        this._entityIdSet.add(entity.id);

        // 通知监听器
        if (this._config.enableBatchMode) {
            this.addToBatch('added', entity);
        } else {
            this.notifyListeners({
                type: ReactiveQueryChangeType.ADDED,
                entity
            });
        }

        if (this._config.debug) {
            logger.debug(`ReactiveQuery ${this._id}: 实体添加 ${entity.name}(${entity.id})`);
        }
    }

    /**
     * 通知实体移除
     *
     * 当Scene中移除实体时调用
     *
     * @param entity 移除的实体
     */
    public notifyEntityRemoved(entity: Entity): void {
        if (!this._active) return;

        // 检查是否在结果集中
        if (!this._entityIdSet.has(entity.id)) {
            return;
        }

        // 从结果集移除
        const index = this._entities.indexOf(entity);
        if (index !== -1) {
            this._entities.splice(index, 1);
        }
        this._entityIdSet.delete(entity.id);

        // 通知监听器
        if (this._config.enableBatchMode) {
            this.addToBatch('removed', entity);
        } else {
            this.notifyListeners({
                type: ReactiveQueryChangeType.REMOVED,
                entity
            });
        }

        if (this._config.debug) {
            logger.debug(`ReactiveQuery ${this._id}: 实体移除 ${entity.name}(${entity.id})`);
        }
    }

    /**
     * 通知实体组件变化
     *
     * 当实体的组件发生变化时调用
     *
     * @param entity 变化的实体
     */
    public notifyEntityChanged(entity: Entity): void {
        if (!this._active) return;

        const wasMatching = this._entityIdSet.has(entity.id);
        const isMatching = this.matches(entity);

        if (wasMatching && !isMatching) {
            // 实体不再匹配,从结果集移除
            this.notifyEntityRemoved(entity);
        } else if (!wasMatching && isMatching) {
            // 实体现在匹配,添加到结果集
            this.notifyEntityAdded(entity);
        }
    }

    /**
     * 批量初始化查询结果
     *
     * @param entities 初始实体列表
     */
    public initializeWith(entities: readonly Entity[]): void {
        // 清空现有结果
        this._entities.length = 0;
        this._entityIdSet.clear();

        // 筛选匹配的实体
        for (const entity of entities) {
            if (this.matches(entity)) {
                this._entities.push(entity);
                this._entityIdSet.add(entity.id);
            }
        }

        if (this._config.debug) {
            logger.debug(`ReactiveQuery ${this._id}: 初始化 ${this._entities.length} 个实体`);
        }
    }

    /**
     * 添加到批量变化缓存
     */
    private addToBatch(type: 'added' | 'removed', entity: Entity): void {
        if (type === 'added') {
            this._batchChanges.added.push(entity);
        } else {
            this._batchChanges.removed.push(entity);
        }

        // 启动批量通知定时器
        if (this._batchChanges.timer === null) {
            this._batchChanges.timer = setTimeout(() => {
                this.flushBatchChanges();
            }, this._config.batchDelay);
        }
    }

    /**
     * 刷新批量变化
     */
    private flushBatchChanges(): void {
        if (this._batchChanges.added.length === 0 && this._batchChanges.removed.length === 0) {
            this._batchChanges.timer = null;
            return;
        }

        const added = [...this._batchChanges.added];
        const removed = [...this._batchChanges.removed];

        // 清空缓存
        this._batchChanges.added.length = 0;
        this._batchChanges.removed.length = 0;
        this._batchChanges.timer = null;

        // 通知监听器
        this.notifyListeners({
            type: ReactiveQueryChangeType.BATCH_UPDATE,
            added,
            removed,
            entities: this._entities
        });

        if (this._config.debug) {
            logger.debug(`ReactiveQuery ${this._id}: 批量更新 +${added.length} -${removed.length}`);
        }
    }

    /**
     * 通知所有监听器
     */
    private notifyListeners(change: ReactiveQueryChange): void {
        for (const listener of this._listeners) {
            try {
                listener(change);
            } catch (error) {
                logger.error(`ReactiveQuery ${this._id}: 监听器执行出错`, error);
            }
        }
    }

    /**
     * 暂停响应式查询
     *
     * 暂停后不再响应实体变化,但可以继续获取当前结果
     */
    public pause(): void {
        this._active = false;

        // 清空批量变化缓存
        if (this._batchChanges.timer !== null) {
            clearTimeout(this._batchChanges.timer);
            this._batchChanges.timer = null;
        }
        this._batchChanges.added.length = 0;
        this._batchChanges.removed.length = 0;
    }

    /**
     * 恢复响应式查询
     */
    public resume(): void {
        this._active = true;
    }

    /**
     * 销毁响应式查询
     *
     * 释放所有资源,清空监听器和结果集
     */
    public dispose(): void {
        this.pause();
        this.unsubscribeAll();
        this._entities.length = 0;
        this._entityIdSet.clear();

        if (this._config.debug) {
            logger.debug(`ReactiveQuery ${this._id}: 已销毁`);
        }
    }

    /**
     * 获取查询条件
     */
    public get condition(): QueryCondition {
        return this._condition;
    }

    /**
     * 获取查询ID
     */
    public get id(): string {
        return this._id;
    }

    /**
     * 检查是否激活
     */
    public get active(): boolean {
        return this._active;
    }

    /**
     * 获取监听器数量
     */
    public get listenerCount(): number {
        return this._listeners.length;
    }
}
