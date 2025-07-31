import { Entity } from '../Entity';
import { PerformanceMonitor } from '../../Utils/PerformanceMonitor';
import { Matcher } from '../Utils/Matcher';
import type { Scene } from '../Scene';
import type { ISystemBase } from '../../Types';
import type { QuerySystem } from '../Core/QuerySystem';

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
        this._systemName = this.constructor.name;
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
        
        // 空条件返回所有实体
        if (this._matcher.isEmpty()) {
            return querySystem.getAllEntities();
        }

        // 单一条件优化查询
        if (this.isSingleCondition(condition)) {
            return this.executeSingleConditionQuery(condition, querySystem);
        }

        // 复合查询
        return this.executeComplexQuery(condition, querySystem);
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
    private executeComplexQuery(condition: any, querySystem: QuerySystem): Entity[] {
        let result: Set<Entity> | null = null;

        // 1. 应用标签条件作为基础集合
        if (condition.tag !== undefined) {
            const tagResult = querySystem.queryByTag(condition.tag);
            result = new Set(tagResult.entities);
        }

        // 2. 应用名称条件
        if (condition.name !== undefined) {
            const nameResult = querySystem.queryByName(condition.name);
            const nameSet = new Set(nameResult.entities);
            
            if (result) {
                result = new Set([...result].filter(e => nameSet.has(e)));
            } else {
                result = nameSet;
            }
        }

        // 3. 应用单组件条件
        if (condition.component !== undefined) {
            const componentResult = querySystem.queryByComponent(condition.component);
            const componentSet = new Set(componentResult.entities);
            
            if (result) {
                result = new Set([...result].filter(e => componentSet.has(e)));
            } else {
                result = componentSet;
            }
        }

        // 4. 应用all条件
        if (condition.all.length > 0) {
            const allResult = querySystem.queryAll(...condition.all);
            const allSet = new Set(allResult.entities);
            
            if (result) {
                result = new Set([...result].filter(e => allSet.has(e)));
            } else {
                result = allSet;
            }
        }

        // 5. 应用any条件（求交集）
        if (condition.any.length > 0) {
            const anyResult = querySystem.queryAny(...condition.any);
            const anySet = new Set(anyResult.entities);
            
            if (result) {
                result = new Set([...result].filter(e => anySet.has(e)));
            } else {
                result = anySet;
            }
        }

        // 6. 应用none条件（排除）
        if (condition.none.length > 0) {
            if (!result) {
                // 如果没有前置条件，从所有实体开始
                result = new Set(querySystem.getAllEntities());
            }
            
            const noneResult = querySystem.queryAny(...condition.none);
            const noneSet = new Set(noneResult.entities);
            result = new Set([...result].filter(e => !noneSet.has(e)));
        }

        return result ? Array.from(result) : [];
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
    protected process(entities: Entity[]): void {
        // 子类必须实现此方法
    }

    /**
     * 后期处理实体列表
     * 
     * 在主要处理逻辑之后执行，子类可以重写此方法。
     * 
     * @param entities 要处理的实体列表
     */
    protected lateProcess(entities: Entity[]): void {
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
}