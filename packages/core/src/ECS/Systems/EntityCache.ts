import { Entity } from '../Entity';

/**
 * 实体缓存管理器
 *
 * 负责管理 EntitySystem 中的实体缓存，提供帧缓存和持久缓存两级缓存机制。
 * 使用面向对象设计，将数据和行为封装在类中。
 *
 * @example
 * ```typescript
 * const cache = new EntityCache();
 * cache.setPersistent(entities);
 * const cached = cache.getPersistent();
 * cache.invalidate();
 * ```
 */
export class EntityCache {
    /**
     * 帧缓存
     *
     * 在update周期内使用，每帧结束后清理
     */
    private _frameCache: readonly Entity[] | null = null;

    /**
     * 持久缓存
     *
     * 跨帧使用，直到被显式失效
     */
    private _persistentCache: readonly Entity[] | null = null;

    /**
     * 被跟踪的实体集合
     *
     * 用于跟踪哪些实体正在被此系统处理
     */
    private _trackedEntities: Set<Entity> = new Set();

    /**
     * 获取帧缓存
     */
    public getFrame(): readonly Entity[] | null {
        return this._frameCache;
    }

    /**
     * 设置帧缓存
     *
     * @param entities 要缓存的实体列表
     */
    public setFrame(entities: readonly Entity[]): void {
        this._frameCache = entities;
    }

    /**
     * 获取持久缓存
     */
    public getPersistent(): readonly Entity[] | null {
        return this._persistentCache;
    }

    /**
     * 设置持久缓存
     *
     * @param entities 要缓存的实体列表
     */
    public setPersistent(entities: readonly Entity[]): void {
        this._persistentCache = entities;
    }

    /**
     * 获取被跟踪的实体集合
     */
    public getTracked(): ReadonlySet<Entity> {
        return this._trackedEntities;
    }

    /**
     * 添加被跟踪的实体
     *
     * @param entity 要跟踪的实体
     */
    public addTracked(entity: Entity): void {
        this._trackedEntities.add(entity);
    }

    /**
     * 移除被跟踪的实体
     *
     * @param entity 要移除的实体
     */
    public removeTracked(entity: Entity): void {
        this._trackedEntities.delete(entity);
    }

    /**
     * 检查实体是否被跟踪
     *
     * @param entity 要检查的实体
     */
    public isTracked(entity: Entity): boolean {
        return this._trackedEntities.has(entity);
    }

    /**
     * 使持久缓存失效
     *
     * 当实体变化时调用，强制下次查询时重新计算
     */
    public invalidate(): void {
        this._persistentCache = null;
    }

    /**
     * 清除帧缓存
     *
     * 在每帧结束时调用
     */
    public clearFrame(): void {
        this._frameCache = null;
    }

    /**
     * 清除所有缓存
     *
     * 在系统重置或销毁时调用
     */
    public clearAll(): void {
        this._frameCache = null;
        this._persistentCache = null;
        this._trackedEntities.clear();
    }

    /**
     * 检查是否有有效的持久缓存
     */
    public hasPersistent(): boolean {
        return this._persistentCache !== null;
    }

    /**
     * 检查是否有有效的帧缓存
     */
    public hasFrame(): boolean {
        return this._frameCache !== null;
    }

    /**
     * 获取缓存统计信息
     */
    public getStats(): {
        hasFrame: boolean;
        hasPersistent: boolean;
        trackedCount: number;
        frameEntityCount: number;
        persistentEntityCount: number;
        } {
        return {
            hasFrame: this._frameCache !== null,
            hasPersistent: this._persistentCache !== null,
            trackedCount: this._trackedEntities.size,
            frameEntityCount: this._frameCache?.length ?? 0,
            persistentEntityCount: this._persistentCache?.length ?? 0
        };
    }
}
