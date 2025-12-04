import { Entity } from '../Entity';
import { PerformanceMonitor } from '../../Utils/PerformanceMonitor';
import { Matcher, type QueryCondition } from '../Utils/Matcher';
import type { Scene } from '../Scene';
import type { ISystemBase } from '../../Types';
import type { QuerySystem } from '../Core/QuerySystem';
import { getSystemInstanceTypeName } from '../Decorators';
import { createLogger } from '../../Utils/Logger';
import type { EventListenerConfig, TypeSafeEventSystem, EventHandler } from '../Core/EventSystem';
import type { ComponentConstructor, ComponentInstance } from '../../Types/TypeHelpers';
import type { IService } from '../../Core/ServiceContainer';
import { EntityCache } from './EntityCache';

/**
 * 事件监听器记录
 * 只存储引用信息，用于系统销毁时自动清理
 */
interface EventListenerRecord {
    eventSystem: TypeSafeEventSystem;
    eventType: string;
    listenerRef: string;
}

/**
 * 实体系统的基类
 *
 * 用于处理一组符合特定条件的实体。系统是ECS架构中的逻辑处理单元，
 * 负责对拥有特定组件组合的实体执行业务逻辑。
 *
 * 支持泛型参数以提供类型安全的组件访问：
 *
 * @template TComponents - 系统需要的组件类型数组
 *
 * @example
 * ```typescript
 * // 传统方式
 * class MovementSystem extends EntitySystem {
 *     constructor() {
 *         super(Matcher.empty().all(Transform, Velocity));
 *     }
 *
 *     protected process(entities: readonly Entity[]): void {
 *         for (const entity of entities) {
 *             const transform = entity.getComponent(Transform);
 *             const velocity = entity.getComponent(Velocity);
 *             transform.position.add(velocity.value);
 *         }
 *     }
 * }
 *
 * // 类型安全方式
 * class MovementSystem extends EntitySystem<[typeof Transform, typeof Velocity]> {
 *     constructor() {
 *         super(Matcher.empty().all(Transform, Velocity));
 *     }
 *
 *     protected process(entities: readonly Entity[]): void {
 *         for (const entity of entities) {
 *             // 类型安全的组件访问
 *             const [transform, velocity] = this.getComponents(entity);
 *             transform.position.add(velocity.value);
 *         }
 *     }
 * }
 * ```
 */
export abstract class EntitySystem implements ISystemBase, IService {
    private _updateOrder: number;
    /**
     * 添加顺序，用于 updateOrder 相同时的稳定排序
     * Add order for stable sorting when updateOrder is the same
     * @internal
     */
    private _addOrder: number;
    private _enabled: boolean;
    private _performanceMonitor: PerformanceMonitor | null;
    private _systemName: string;
    private _initialized: boolean;
    private _matcher: Matcher;
    private _eventListeners: EventListenerRecord[];
    private _scene: Scene | null;
    private _destroyed: boolean;
    protected logger: ReturnType<typeof createLogger>;

    /**
     * 实体ID映射缓存
     */
    private _entityIdMap: Map<number, Entity> | null;
    private _entityIdMapVersion: number;

    /**
     * 统一的实体缓存管理器
     */
    private _entityCache: EntityCache;

    /**
     * 获取系统处理的实体列表
     */
    public get entities(): readonly Entity[] {
        // 如果在update周期内，优先使用帧缓存
        const frameCache = this._entityCache.getFrame();
        if (frameCache !== null) {
            return frameCache;
        }

        // 否则使用持久缓存
        if (!this._entityCache.hasPersistent()) {
            this._entityCache.setPersistent(this.queryEntities());
        }

        return this._entityCache.getPersistent()!;
    }

    /**
     * 获取系统的更新时序
     */
    public get updateOrder(): number {
        return this._updateOrder;
    }

    public set updateOrder(value: number) {
        this.setUpdateOrder(value);
    }

    /**
     * 获取系统的添加顺序
     * Get the add order of the system
     * @internal
     */
    public get addOrder(): number {
        return this._addOrder;
    }

    /**
     * 设置系统的添加顺序（由 Scene 在添加时设置）
     * Set the add order of the system (set by Scene when adding)
     * @internal
     */
    public set addOrder(value: number) {
        this._addOrder = value;
    }

    /**
     * 获取系统的启用状态
     */
    public get enabled(): boolean {
        return this._enabled;
    }

    /**
     * 设置系统的启用状态
     */
    public set enabled(value: boolean) {
        this._enabled = value;
    }

    /**
     * 获取系统名称
     */
    public get systemName(): string {
        return this._systemName;
    }

    constructor(matcher?: Matcher) {
        this._updateOrder = 0;
        this._addOrder = 0;
        this._enabled = true;
        this._performanceMonitor = null;
        this._systemName = getSystemInstanceTypeName(this);
        this._initialized = false;
        this._matcher = matcher || Matcher.empty();
        this._eventListeners = [];
        this._scene = null;
        this._destroyed = false;

        this._entityIdMap = null;
        this._entityIdMapVersion = -1;

        // 初始化logger
        this.logger = createLogger(this.getLoggerName());

        this._entityCache = new EntityCache();
    }

    /**
     * 这个系统所属的场景
     */
    public get scene(): Scene | null {
        return this._scene;
    }

    public set scene(value: Scene | null) {
        this._scene = value;
    }

    /**
     * 设置性能监控器
     */
    public setPerformanceMonitor(monitor: PerformanceMonitor): void {
        this._performanceMonitor = monitor;
    }

    /**
     * 获取性能监控器
     */
    private getPerformanceMonitor(): PerformanceMonitor {
        if (!this._performanceMonitor) {
            throw new Error(
                `${this._systemName}: PerformanceMonitor未注入，请确保在Core.create()之后再添加System到Scene`
            );
        }
        return this._performanceMonitor;
    }

    /**
     * 获取实体匹配器
     */
    public get matcher(): Matcher {
        return this._matcher;
    }

    /**
     * 设置更新时序
     * @param order 更新时序
     */
    public setUpdateOrder(order: number): void {
        if (this._updateOrder === order) return;
        this._updateOrder = order;
        this._scene?.markSystemsOrderDirty();
    }

    /**
     * 系统初始化（框架调用）
     *
     * 在系统创建时调用。框架内部使用，用户不应直接调用。
     */
    public initialize(): void {
        // 防止重复初始化
        if (this._initialized) {
            return;
        }

        this._initialized = true;

        // 框架内部初始化：触发一次实体查询，以便正确跟踪现有实体
        if (this.scene) {
            // 清理缓存确保初始化时重新查询
            this._entityCache.invalidate();
            this.queryEntities();
        }

        // 调用用户可重写的初始化方法
        this.onInitialize();
    }

    /**
     * 系统初始化回调
     *
     * 子类可以重写此方法进行初始化操作。
     */
    protected onInitialize(): void {
        // 子类可以重写此方法进行初始化
    }

    /**
     * 清除实体缓存（内部使用）
     * 当Scene中的实体发生变化时调用
     */
    public clearEntityCache(): void {
        this._entityCache.invalidate();
    }

    /**
     * 完全重置实体跟踪状态
     * 清除所有缓存和跟踪的实体，强制下次 update 时重新扫描所有实体并触发 onAdded
     * 用于场景重载/预览重置等场景
     */
    public resetEntityTracking(): void {
        this._entityCache.clearAll();
        this._entityIdMap = null;
        this._entityIdMapVersion = -1;
    }

    /**
     * 重置系统状态
     *
     * 当系统从场景中移除时调用，重置初始化状态以便重新添加时能正确初始化。
     *
     * 注意：此方法由 Scene.removeEntityProcessor 调用，在 unregister（触发dispose）之后调用。
     * dispose 已经调用了 onDestroy 并设置了 _destroyed 标志，所以这里不需要重置该标志。
     * 重置 _destroyed 会违反服务容器的语义（dispose 后不应重用）。
     */
    public reset(): void {
        // 如果系统已经被销毁，不需要再次调用destroy
        if (this._destroyed) {
            return;
        }

        this.scene = null;
        this._initialized = false;
        this._entityCache.clearAll();

        // 清理实体ID映射缓存
        this._entityIdMap = null;
        this._entityIdMapVersion = -1;

        // 清理所有事件监听器并调用销毁回调
        this.destroy();
    }

    /**
     * 查询匹配的实体
     */
    private queryEntities(): readonly Entity[] {
        if (!this.scene?.querySystem || !this._matcher) {
            return [];
        }

        const condition = this._matcher.getCondition();
        const querySystem = this.scene.querySystem;
        let currentEntities: readonly Entity[] = [];

        // matchNothing 条件返回空数组（用于只需要生命周期方法的系统）
        if (this._matcher.isNothing()) {
            return [];
        }

        // 空条件返回所有实体
        if (this._matcher.isEmpty()) {
            currentEntities = querySystem.getAllEntities();
        } else if (this.isSingleCondition(condition)) {
            // 单一条件优化查询
            currentEntities = this.executeSingleConditionQuery(condition, querySystem);
        } else {
            // 复合查询
            currentEntities = this.executeComplexQuery(condition, querySystem);
        }

        // 检查实体变化并触发回调
        this.updateEntityTracking(currentEntities);

        return currentEntities;
    }

    /**
     * 检查是否为单一条件查询
     *
     * 使用位运算优化多条件检测。将每种查询条件映射到不同的位：
     * - all: 第0位 (1)
     * - any: 第1位 (2)
     * - none: 第2位 (4)
     * - tag: 第3位 (8)
     * - name: 第4位 (16)
     * - component: 第5位 (32)
     */
    private isSingleCondition(condition: QueryCondition): boolean {
        // 使用位OR运算合并所有条件标记
        const flags =
            (condition.all.length > 0 ? 1 : 0) |
            (condition.any.length > 0 ? 2 : 0) |
            (condition.none.length > 0 ? 4 : 0) |
            (condition.tag !== undefined ? 8 : 0) |
            (condition.name !== undefined ? 16 : 0) |
            (condition.component !== undefined ? 32 : 0);

        // 位运算技巧：如果只有一个位被设置，则 flags & (flags - 1) == 0
        // 例如：flags=4 (100), flags-1=3 (011), 4&3=0
        // 但如果 flags=6 (110), flags-1=5 (101), 6&5=4≠0
        return flags !== 0 && (flags & (flags - 1)) === 0;
    }

    /**
     * 执行单一条件查询
     */
    private executeSingleConditionQuery(condition: QueryCondition, querySystem: QuerySystem): readonly Entity[] {
        // 按标签查询
        if (condition.tag !== undefined) {
            return querySystem.queryByTag(condition.tag).entities;
        }

        // 按名称查询
        if (condition.name !== undefined) {
            return querySystem.queryByName(condition.name).entities;
        }

        // 单组件查询
        if (condition.component !== undefined) {
            return querySystem.queryByComponent(condition.component).entities;
        }

        // 基础组件查询
        if (condition.all.length > 0 && condition.any.length === 0 && condition.none.length === 0) {
            return querySystem.queryAll(...condition.all).entities;
        }

        if (condition.all.length === 0 && condition.any.length > 0 && condition.none.length === 0) {
            return querySystem.queryAny(...condition.any).entities;
        }

        if (condition.all.length === 0 && condition.any.length === 0 && condition.none.length > 0) {
            return querySystem.queryNone(...condition.none).entities;
        }

        return [];
    }

    /**
     * 执行复合查询
     */
    private executeComplexQueryWithIdSets(condition: QueryCondition, querySystem: QuerySystem): readonly Entity[] {
        let resultIds: Set<number> | null = null;

        // 1. 应用标签条件作为基础集合
        if (condition.tag !== undefined) {
            const tagResult = querySystem.queryByTag(condition.tag);
            resultIds = this.extractEntityIds(tagResult.entities);
        }

        // 2. 应用名称条件 (交集)
        if (condition.name !== undefined) {
            const nameIds = this.extractEntityIds(querySystem.queryByName(condition.name).entities);
            resultIds = resultIds ? this.intersectIdSets(resultIds, nameIds) : nameIds;
        }

        // 3. 应用单组件条件 (交集)
        if (condition.component !== undefined) {
            const componentIds = this.extractEntityIds(querySystem.queryByComponent(condition.component).entities);
            resultIds = resultIds ? this.intersectIdSets(resultIds, componentIds) : componentIds;
        }

        // 4. 应用all条件 (交集)
        if (condition.all.length > 0) {
            const allIds = this.extractEntityIds(querySystem.queryAll(...condition.all).entities);
            resultIds = resultIds ? this.intersectIdSets(resultIds, allIds) : allIds;
        }

        // 5. 应用any条件 (交集)
        if (condition.any.length > 0) {
            const anyIds = this.extractEntityIds(querySystem.queryAny(...condition.any).entities);
            resultIds = resultIds ? this.intersectIdSets(resultIds, anyIds) : anyIds;
        }

        // 6. 应用none条件 (差集)
        if (condition.none.length > 0) {
            if (!resultIds) {
                resultIds = this.extractEntityIds(querySystem.getAllEntities());
            }

            const noneResult = querySystem.queryAny(...condition.none);
            const noneIds = this.extractEntityIds(noneResult.entities);
            resultIds = this.differenceIdSets(resultIds, noneIds);
        }

        return resultIds ? this.idSetToEntityArray(resultIds, querySystem.getAllEntities()) : [];
    }

    /**
     * 提取实体ID集合
     */
    private extractEntityIds(entities: readonly Entity[]): Set<number> {
        const len = entities.length;
        const idSet = new Set<number>();

        for (let i = 0; i < len; i = (i + 1) | 0) {
            idSet.add(entities[i]!.id | 0);
        }
        return idSet;
    }

    /**
     * ID集合交集运算
     */
    private intersectIdSets(setA: Set<number>, setB: Set<number>): Set<number> {
        let smaller: Set<number>, larger: Set<number>;

        if (setA.size <= setB.size) {
            smaller = setA;
            larger = setB;
        } else {
            smaller = setB;
            larger = setA;
        }

        const result = new Set<number>();

        for (const id of smaller) {
            if (larger.has(id)) {
                result.add(id);
            }
        }

        return result;
    }

    /**
     * ID集合差集运算
     */
    private differenceIdSets(setA: Set<number>, setB: Set<number>): Set<number> {
        const result = new Set<number>();

        for (const id of setA) {
            if (!setB.has(id)) {
                result.add(id);
            }
        }

        return result;
    }

    /**
     * 获取或构建实体ID映射
     */
    private getEntityIdMap(allEntities: readonly Entity[]): Map<number, Entity> {
        const currentVersion = this.scene?.querySystem?.version ?? 0;
        if (this._entityIdMap !== null && this._entityIdMapVersion === currentVersion) {
            return this._entityIdMap;
        }

        return this.rebuildEntityIdMap(allEntities, currentVersion);
    }

    /**
     * 重建实体ID映射
     */
    private rebuildEntityIdMap(allEntities: readonly Entity[], version: number): Map<number, Entity> {
        let entityMap = this._entityIdMap;

        if (!entityMap) {
            entityMap = new Map<number, Entity>();
        } else {
            entityMap.clear();
        }

        const len = allEntities.length;
        for (let i = 0; i < len; i = (i + 1) | 0) {
            const entity = allEntities[i]!;
            entityMap.set(entity.id | 0, entity);
        }

        this._entityIdMap = entityMap;
        this._entityIdMapVersion = version;

        return entityMap;
    }

    /**
     * 从ID集合构建Entity数组
     */
    private idSetToEntityArray(idSet: Set<number>, allEntities: readonly Entity[]): readonly Entity[] {
        const entityMap = this.getEntityIdMap(allEntities);

        const size = idSet.size;
        const result = new Array<Entity>(size);
        let index = 0;

        for (const id of idSet) {
            const entity = entityMap.get(id);
            if (entity !== undefined) {
                result[index] = entity;
                index = (index + 1) | 0;
            }
        }

        if (index < size) {
            result.length = index;
        }

        return result;
    }

    /**
     * 执行复合查询
     *
     * 使用基于ID集合的单次扫描算法进行复杂查询
     */
    private executeComplexQuery(condition: QueryCondition, querySystem: QuerySystem): readonly Entity[] {
        return this.executeComplexQueryWithIdSets(condition, querySystem);
    }

    /**
     * 更新系统
     */
    public update(): void {
        if (!this._enabled || !this.onCheckProcessing()) {
            return;
        }

        const monitor = this.getPerformanceMonitor();
        const startTime = monitor.startMonitoring(this._systemName);
        let entityCount = 0;

        try {
            this.onBegin();
            // 查询实体并存储到帧缓存中
            // 响应式查询会自动维护最新的实体列表，updateEntityTracking会在检测到变化时invalidate
            const queriedEntities = this.queryEntities();
            // 创建数组副本以防止迭代过程中数组被修改
            // Create a copy to prevent array modification during iteration
            const entities = [...queriedEntities];
            this._entityCache.setFrame(entities);
            entityCount = entities.length;

            this.process(entities);
        } finally {
            monitor.endMonitoring(this._systemName, startTime, entityCount);
        }
    }

    /**
     * 后期更新系统
     */
    public lateUpdate(): void {
        if (!this._enabled || !this.onCheckProcessing()) {
            return;
        }

        const monitor = this.getPerformanceMonitor();
        const startTime = monitor.startMonitoring(`${this._systemName}_Late`);
        let entityCount = 0;

        try {
            // 重新查询实体以获取最新列表
            // 在 update 和 lateUpdate 之间可能有新组件被添加（事件驱动设计）
            // Re-query entities to get the latest list
            // New components may have been added between update and lateUpdate (event-driven design)
            const queriedEntities = this.queryEntities();
            // 创建数组副本以防止迭代过程中数组被修改
            // Create a copy to prevent array modification during iteration
            const entities = [...queriedEntities];
            this._entityCache.setFrame(entities);
            entityCount = entities.length;
            this.lateProcess(entities);
            this.onEnd();
        } finally {
            monitor.endMonitoring(`${this._systemName}_Late`, startTime, entityCount);
            // 清理帧缓存
            this._entityCache.clearFrame();
        }
    }

    /**
     * 在系统处理开始前调用
     *
     * 子类可以重写此方法进行预处理操作。
     */
    protected onBegin(): void {
        // 子类可以重写此方法
    }

    /**
     * 处理实体列表
     *
     * 系统的核心逻辑，子类必须实现此方法来定义具体的处理逻辑。
     *
     * @param entities 要处理的实体列表
     */
    protected process(_entities: readonly Entity[]): void {
        // 子类必须实现此方法
    }

    /**
     * 后期处理实体列表
     *
     * 在主要处理逻辑之后执行，子类可以重写此方法。
     *
     * @param entities 要处理的实体列表
     */
    protected lateProcess(_entities: readonly Entity[]): void {
        // 子类可以重写此方法
    }

    /**
     * 系统处理完毕后调用
     *
     * 子类可以重写此方法进行后处理操作。
     */
    protected onEnd(): void {
        // 子类可以重写此方法
    }

    /**
     * 检查系统是否需要处理
     *
     * 在启用系统时有用，但仅偶尔需要处理。
     * 这只影响处理，不影响事件或订阅列表。
     *
     * @returns 如果系统应该处理，则为true，如果不处理则为false
     */
    protected onCheckProcessing(): boolean {
        return true;
    }

    /**
     * 获取系统的性能数据
     *
     * @returns 性能数据或undefined
     */
    public getPerformanceData() {
        return this.getPerformanceMonitor().getSystemData(this._systemName);
    }

    /**
     * 获取系统的性能统计
     *
     * @returns 性能统计或undefined
     */
    public getPerformanceStats() {
        return this.getPerformanceMonitor().getSystemStats(this._systemName);
    }

    /**
     * 重置系统的性能数据
     */
    public resetPerformanceData(): void {
        this.getPerformanceMonitor().resetSystem(this._systemName);
    }

    /**
     * 获取系统信息的字符串表示
     *
     * @returns 系统信息字符串
     */
    public toString(): string {
        const entityCount = this.entities.length;
        const perfData = this.getPerformanceData();
        const perfInfo = perfData ? ` (${perfData.executionTime.toFixed(2)}ms)` : '';

        return `${this._systemName}[${entityCount} entities]${perfInfo}`;
    }

    /**
     * 更新实体跟踪，检查新增和移除的实体
     */
    private updateEntityTracking(currentEntities: readonly Entity[]): void {
        const currentSet = new Set(currentEntities);
        let hasChanged = false;

        // 检查新增的实体
        for (const entity of currentEntities) {
            if (!this._entityCache.isTracked(entity)) {
                this._entityCache.addTracked(entity);
                this.onAdded(entity);
                hasChanged = true;
            }
        }

        // 检查移除的实体
        for (const entity of this._entityCache.getTracked()) {
            if (!currentSet.has(entity)) {
                this._entityCache.removeTracked(entity);
                this.onRemoved(entity);
                hasChanged = true;
            }
        }

        // 如果实体发生了变化，使缓存失效
        if (hasChanged) {
            this._entityCache.invalidate();
        }
    }

    /**
     * 当实体被添加到系统时调用
     *
     * 子类可以重写此方法来处理实体添加事件。
     *
     * @param entity 被添加的实体
     */
    protected onAdded(_entity: Entity): void {
        // 子类可以重写此方法
    }

    /**
     * 当实体从系统中移除时调用
     *
     * 子类可以重写此方法来处理实体移除事件。
     *
     * @param entity 被移除的实体
     */
    protected onRemoved(_entity: Entity): void {
        // 子类可以重写此方法
    }

    /**
     * 释放系统资源
     *
     * 实现IService接口要求的dispose方法。
     * 当系统从Scene中移除或Scene销毁时调用。
     *
     * 默认行为：
     * - 移除所有事件监听器
     * - 调用 onDestroy 回调（仅首次）
     * - 清空所有缓存
     * - 重置初始化状态
     *
     * 子类可以重写此方法来清理自定义资源，但应该调用super.dispose()。
     */
    public dispose(): void {
        // 防止重复销毁
        if (this._destroyed) {
            return;
        }

        // 移除所有事件监听器
        this.cleanupManualEventListeners();

        // 调用用户销毁回调
        this.onDestroy();

        // 清空所有缓存
        this._entityCache.clearAll();
        this._entityIdMap = null;

        // 重置状态
        this._initialized = false;
        this._scene = null;
        this._destroyed = true;

        this.logger.debug(`System ${this._systemName} disposed`);
    }

    /**
     * 添加事件监听器
     *
     * 推荐使用此方法而不是直接调用eventSystem.on()，
     * 这样可以确保系统移除时自动清理监听器，避免内存泄漏。
     *
     * @param eventType 事件类型
     * @param handler 事件处理函数
     * @param config 监听器配置
     * @returns 监听器引用ID，可用于手动移除监听器
     */
    protected addEventListener<T>(
        eventType: string,
        handler: EventHandler<T>,
        config?: EventListenerConfig
    ): string | null {
        if (!this.scene?.eventSystem) {
            this.logger.warn(`${this.systemName}: 无法添加事件监听器，scene.eventSystem 不可用`);
            return null;
        }

        const listenerRef = this.scene.eventSystem.on(eventType, handler, config);

        // 跟踪监听器以便后续清理
        if (listenerRef) {
            this._eventListeners.push({
                eventSystem: this.scene.eventSystem,
                eventType,
                listenerRef
            });
        }

        return listenerRef;
    }

    /**
     * 移除特定的事件监听器
     *
     * @param eventType 事件类型
     * @param listenerRef 监听器引用ID（由 addEventListener 返回）
     */
    protected removeEventListener(eventType: string, listenerRef: string): void {
        const listenerIndex = this._eventListeners.findIndex(
            (listener) => listener.eventType === eventType && listener.listenerRef === listenerRef
        );

        if (listenerIndex >= 0) {
            const listener = this._eventListeners[listenerIndex];
            if (!listener) return;

            // 从事件系统中移除
            listener.eventSystem.off(eventType, listener.listenerRef);

            // 从跟踪列表中移除
            this._eventListeners.splice(listenerIndex, 1);
        }
    }

    /**
     * 清理手动添加的事件监听器
     */
    private cleanupManualEventListeners(): void {
        for (const listener of this._eventListeners) {
            try {
                listener.eventSystem.off(listener.eventType, listener.listenerRef);
            } catch (error) {
                this.logger.warn(`${this.systemName}: 移除事件监听器失败 "${listener.eventType}"`, error);
            }
        }

        // 清空跟踪列表
        this._eventListeners.length = 0;
    }

    /**
     * 框架内部销毁方法
     * 由框架调用，处理系统的完整销毁流程
     */
    public destroy(): void {
        // 防止重复销毁
        if (this._destroyed) {
            return;
        }

        this.cleanupManualEventListeners();
        this._destroyed = true;
        this.onDestroy();
    }

    /**
     * 获取Logger名称
     * 默认返回类的构造函数名称, 子类可以重写此方法来自定义logger名称
     */
    protected getLoggerName(): string {
        return getSystemInstanceTypeName(this);
    }

    /**
     * 用户销毁回调
     *
     * 当系统从场景中移除时调用，子类可以重写此方法进行清理操作。
     * 注意：事件监听器会被框架自动清理，无需手动处理。
     */
    protected onDestroy(): void {
        // 子类可以重写此方法进行清理操作
    }

    /**
     * 类型安全地获取单个组件
     *
     * 相比Entity.getComponent，此方法保证返回非空值，
     * 如果组件不存在会抛出错误而不是返回null
     *
     * @param entity 实体
     * @param componentType 组件类型
     * @returns 组件实例（保证非空）
     * @throws 如果组件不存在则抛出错误
     *
     * @example
     * ```typescript
     * protected process(entities: readonly Entity[]): void {
     *     for (const entity of entities) {
     *         const transform = this.requireComponent(entity, Transform);
     *         // transform 保证非空，类型为 Transform
     *     }
     * }
     * ```
     */
    protected requireComponent<T extends ComponentConstructor>(entity: Entity, componentType: T): ComponentInstance<T> {
        const component = entity.getComponent(componentType);
        if (!component) {
            throw new Error(`Component ${componentType.name} not found on entity ${entity.name} in ${this.systemName}`);
        }
        return component as ComponentInstance<T>;
    }

    /**
     * 批量获取实体的所有必需组件
     *
     * 根据泛型参数TComponents推断返回类型，
     * 返回一个元组，包含所有组件实例
     *
     * @param entity 实体
     * @param components 组件类型数组
     * @returns 组件实例元组
     *
     * @example
     * ```typescript
     * class MySystem extends EntitySystem<[typeof Position, typeof Velocity]> {
     *     protected process(entities: readonly Entity[]): void {
     *         for (const entity of entities) {
     *             const [pos, vel] = this.getComponents(entity, Position, Velocity);
     *             // pos: Position, vel: Velocity (自动类型推断)
     *             pos.x += vel.x;
     *         }
     *     }
     * }
     * ```
     */
    protected getComponents<T extends readonly ComponentConstructor[]>(
        entity: Entity,
        ...components: T
    ): { [K in keyof T]: ComponentInstance<T[K]> } {
        return components.map((type) => this.requireComponent(entity, type)) as {
            [K in keyof T]: ComponentInstance<T[K]>;
        };
    }

    /**
     * 遍历实体并处理每个实体
     *
     * 提供更简洁的语法糖，避免手动遍历
     *
     * @param entities 实体列表
     * @param processor 处理函数
     *
     * @example
     * ```typescript
     * protected process(entities: readonly Entity[]): void {
     *     this.forEach(entities, (entity) => {
     *         const transform = this.requireComponent(entity, Transform);
     *         transform.position.y -= 9.8 * Time.deltaTime;
     *     });
     * }
     * ```
     */
    protected forEach(entities: readonly Entity[], processor: (entity: Entity, index: number) => void): void {
        for (let i = 0; i < entities.length; i++) {
            processor(entities[i]!, i);
        }
    }

    /**
     * 过滤实体
     *
     * @param entities 实体列表
     * @param predicate 过滤条件
     * @returns 过滤后的实体数组
     *
     * @example
     * ```typescript
     * protected process(entities: readonly Entity[]): void {
     *     const activeEntities = this.filterEntities(entities, (entity) => {
     *         const health = this.requireComponent(entity, Health);
     *         return health.value > 0;
     *     });
     * }
     * ```
     */
    protected filterEntities(
        entities: readonly Entity[],
        predicate: (entity: Entity, index: number) => boolean
    ): Entity[] {
        return Array.from(entities).filter(predicate);
    }

    /**
     * 映射实体到另一种类型
     *
     * @param entities 实体列表
     * @param mapper 映射函数
     * @returns 映射后的结果数组
     *
     * @example
     * ```typescript
     * protected process(entities: readonly Entity[]): void {
     *     const positions = this.mapEntities(entities, (entity) => {
     *         const transform = this.requireComponent(entity, Transform);
     *         return transform.position;
     *     });
     * }
     * ```
     */
    protected mapEntities<R>(entities: readonly Entity[], mapper: (entity: Entity, index: number) => R): R[] {
        return Array.from(entities).map(mapper);
    }

    /**
     * 查找第一个满足条件的实体
     *
     * @param entities 实体列表
     * @param predicate 查找条件
     * @returns 第一个满足条件的实体，或undefined
     *
     * @example
     * ```typescript
     * protected process(entities: readonly Entity[]): void {
     *     const player = this.findEntity(entities, (entity) =>
     *         entity.hasComponent(PlayerTag)
     *     );
     * }
     * ```
     */
    protected findEntity(
        entities: readonly Entity[],
        predicate: (entity: Entity, index: number) => boolean
    ): Entity | undefined {
        for (let i = 0; i < entities.length; i++) {
            if (predicate(entities[i]!, i)) {
                return entities[i];
            }
        }
        return undefined;
    }

    /**
     * 检查是否存在满足条件的实体
     *
     * @param entities 实体列表
     * @param predicate 检查条件
     * @returns 是否存在满足条件的实体
     *
     * @example
     * ```typescript
     * protected process(entities: readonly Entity[]): void {
     *     const hasLowHealth = this.someEntity(entities, (entity) => {
     *         const health = this.requireComponent(entity, Health);
     *         return health.value < 20;
     *     });
     * }
     * ```
     */
    protected someEntity(entities: readonly Entity[], predicate: (entity: Entity, index: number) => boolean): boolean {
        for (let i = 0; i < entities.length; i++) {
            if (predicate(entities[i]!, i)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 检查是否所有实体都满足条件
     *
     * @param entities 实体列表
     * @param predicate 检查条件
     * @returns 是否所有实体都满足条件
     *
     * @example
     * ```typescript
     * protected process(entities: readonly Entity[]): void {
     *     const allHealthy = this.everyEntity(entities, (entity) => {
     *         const health = this.requireComponent(entity, Health);
     *         return health.value > 50;
     *     });
     * }
     * ```
     */
    protected everyEntity(entities: readonly Entity[], predicate: (entity: Entity, index: number) => boolean): boolean {
        for (let i = 0; i < entities.length; i++) {
            if (!predicate(entities[i]!, i)) {
                return false;
            }
        }
        return true;
    }
}
