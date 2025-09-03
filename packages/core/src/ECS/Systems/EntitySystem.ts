import { Entity } from '../Entity';
import { PerformanceMonitor } from '../../Utils/PerformanceMonitor';
import { Matcher } from '../Utils/Matcher';
import type { Scene } from '../Scene';
import type { ISystemBase } from '../../Types';
import type { QuerySystem } from '../Core/QuerySystem';
import { getSystemInstanceTypeName } from '../Decorators';

/**
 * 实体系统的基类
 * 
 * 用于处理一组符合特定条件的实体。系统是ECS架构中的逻辑处理单元，
 * 负责对拥有特定组件组合的实体执行业务逻辑。
 * 
 * @example
 * ```typescript
 * class MovementSystem extends EntitySystem {
 *     constructor() {
 *         super(Transform, Velocity);
 *     }
 * 
 *     protected process(entities: Entity[]): void {
 *         for (const entity of entities) {
 *             const transform = entity.getComponent(Transform);
 *             const velocity = entity.getComponent(Velocity);
 *             transform.position.add(velocity.value);
 *         }
 *     }
 * }
 * ```
 */
export abstract class EntitySystem implements ISystemBase {
    private _updateOrder: number = 0;
    private _enabled: boolean = true;
    private _performanceMonitor = PerformanceMonitor.instance;
    private _systemName: string;
    private _initialized: boolean = false;
    private _matcher: Matcher;
    private _trackedEntities: Set<Entity> = new Set();

    /**
     * 获取系统处理的实体列表（动态查询）
     */
    public get entities(): readonly Entity[] {
        return this.queryEntities();
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
        this._matcher = matcher ? matcher : Matcher.empty();
        this._systemName = getSystemInstanceTypeName(this);
    }

    private _scene: Scene | null = null;

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
        this._updateOrder = order;
        if (this.scene && this.scene.entityProcessors) {
            this.scene.entityProcessors.setDirty();
        }
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
     * 重置系统状态
     * 
     * 当系统从场景中移除时调用，重置初始化状态以便重新添加时能正确初始化。
     */
    public reset(): void {
        this._initialized = false;
        this._trackedEntities.clear();
    }

    /**
     * 查询匹配的实体
     */
    private queryEntities(): Entity[] {
        if (!this.scene?.querySystem || !this._matcher) {
            return [];
        }

        const condition = this._matcher.getCondition();
        const querySystem = this.scene.querySystem;
        let currentEntities: Entity[] = [];

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
     */
    private isSingleCondition(condition: any): boolean {
        const conditionCount =
            (condition.all.length > 0 ? 1 : 0) +
            (condition.any.length > 0 ? 1 : 0) +
            (condition.none.length > 0 ? 1 : 0) +
            (condition.tag !== undefined ? 1 : 0) +
            (condition.name !== undefined ? 1 : 0) +
            (condition.component !== undefined ? 1 : 0);

        return conditionCount === 1;
    }

    /**
     * 执行单一条件查询
     */
    private executeSingleConditionQuery(condition: any, querySystem: any): Entity[] {
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
    private executeComplexQueryWithIdSets(condition: any, querySystem: QuerySystem): Entity[] {
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
    private extractEntityIds(entities: Entity[]): Set<number> {
        const idSet = new Set<number>();
        for (let i = 0; i < entities.length; i++) {
            idSet.add(entities[i].id);
        }
        return idSet;
    }

    /**
     * ID集合交集运算
     * 
     * 使用单次扫描算法，选择较小集合进行迭代以提高效率
     */
    private intersectIdSets(setA: Set<number>, setB: Set<number>): Set<number> {
        const [smaller, larger] = setA.size <= setB.size ? [setA, setB] : [setB, setA];
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
     * 
     * 使用单次扫描算法计算setA - setB
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
     * 从ID集合构建Entity数组
     * 
     * 先构建ID到Entity的映射，然后根据ID集合构建结果数组
     */
    private idSetToEntityArray(idSet: Set<number>, allEntities: Entity[]): Entity[] {
        const entityMap = new Map<number, Entity>();
        for (const entity of allEntities) {
            entityMap.set(entity.id, entity);
        }

        const result: Entity[] = [];
        for (const id of idSet) {
            const entity = entityMap.get(id);
            if (entity) {
                result.push(entity);
            }
        }

        return result;
    }

    /**
     * 执行复合查询
     * 
     * 使用基于ID集合的单次扫描算法进行复杂查询
     */
    private executeComplexQuery(condition: any, querySystem: QuerySystem): Entity[] {
        return this.executeComplexQueryWithIdSets(condition, querySystem);
    }

    /**
     * 更新系统
     * 
     * 在每帧调用，处理系统的主要逻辑。
     */
    public update(): void {
        if (!this._enabled || !this.onCheckProcessing()) {
            return;
        }

        const startTime = this._performanceMonitor.startMonitoring(this._systemName);
        let entityCount = 0;

        try {
            this.onBegin();
            // 动态查询实体并处理
            const entities = this.queryEntities();
            entityCount = entities.length;

            this.process(entities);
        } finally {
            this._performanceMonitor.endMonitoring(this._systemName, startTime, entityCount);
        }
    }

    /**
     * 后期更新系统
     * 
     * 在所有系统的update方法执行完毕后调用。
     */
    public lateUpdate(): void {
        if (!this._enabled || !this.onCheckProcessing()) {
            return;
        }

        const startTime = this._performanceMonitor.startMonitoring(`${this._systemName}_Late`);
        let entityCount = 0;

        try {
            // 动态查询实体并处理
            const entities = this.queryEntities();
            entityCount = entities.length;
            this.lateProcess(entities);
            this.onEnd();
        } finally {
            this._performanceMonitor.endMonitoring(`${this._systemName}_Late`, startTime, entityCount);
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
    protected process(_entities: Entity[]): void {
        // 子类必须实现此方法
    }

    /**
     * 后期处理实体列表
     * 
     * 在主要处理逻辑之后执行，子类可以重写此方法。
     * 
     * @param entities 要处理的实体列表
     */
    protected lateProcess(_entities: Entity[]): void {
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
        return this._performanceMonitor.getSystemData(this._systemName);
    }

    /**
     * 获取系统的性能统计
     * 
     * @returns 性能统计或undefined
     */
    public getPerformanceStats() {
        return this._performanceMonitor.getSystemStats(this._systemName);
    }

    /**
     * 重置系统的性能数据
     */
    public resetPerformanceData(): void {
        this._performanceMonitor.resetSystem(this._systemName);
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
    private updateEntityTracking(currentEntities: Entity[]): void {
        const currentSet = new Set(currentEntities);

        // 检查新增的实体
        for (const entity of currentEntities) {
            if (!this._trackedEntities.has(entity)) {
                this._trackedEntities.add(entity);
                this.onAdded(entity);
            }
        }

        // 检查移除的实体
        for (const entity of this._trackedEntities) {
            if (!currentSet.has(entity)) {
                this._trackedEntities.delete(entity);
                this.onRemoved(entity);
            }
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
}