import { Entity } from '../Entity';
import { Core } from '../../Core';
import { Matcher } from '../Utils/Matcher';
import { PerformanceMonitor } from '../../Utils/PerformanceMonitor';
import type { Scene } from '../Scene';
import type { ISystemBase } from '../../Types';

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
 *         super(Matcher.empty().all(Transform, Velocity));
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
    private _entities: Entity[] = [];
    private _updateOrder: number = 0;
    private _enabled: boolean = true;
    private _performanceMonitor = PerformanceMonitor.instance;
    private _systemName: string;

    /**
     * 获取系统处理的实体列表
     */
    public get entities(): readonly Entity[] {
        return this._entities;
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
        this.initialize();
    }

    private _scene!: Scene;

    /**
     * 这个系统所属的场景
     */
    public get scene(): Scene {
        return this._scene;
    }

    public set scene(value: Scene) {
        this._scene = value;
        this._entities = [];
    }

    private _matcher: Matcher;

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
        this.scene.entityProcessors.setDirty();
    }

    /**
     * 系统初始化
     * 
     * 在系统创建时调用，子类可以重写此方法进行初始化操作。
     */
    public initialize(): void {
        // 子类可以重写此方法
    }

    /**
     * 当实体的组件发生变化时调用
     * 
     * 检查实体是否仍然符合系统的匹配条件，并相应地添加或移除实体。
     * 
     * @param entity 发生变化的实体
     */
    public onChanged(entity: Entity): void {
        const contains = this._entities.includes(entity);
        const interest = this._matcher.isInterestedEntity(entity);

        if (interest && !contains) {
            this.add(entity);
        } else if (!interest && contains) {
            this.remove(entity);
        }
    }

    /**
     * 添加实体到系统
     * 
     * @param entity 要添加的实体
     */
    public add(entity: Entity): void {
        if (!this._entities.includes(entity)) {
            this._entities.push(entity);
            this.onAdded(entity);
        }
    }

    /**
     * 当实体被添加到系统时调用
     * 
     * 子类可以重写此方法来处理实体添加事件。
     * 
     * @param entity 被添加的实体
     */
    protected onAdded(entity: Entity): void {
        // 子类可以重写此方法
    }

    /**
     * 从系统中移除实体
     * 
     * @param entity 要移除的实体
     */
    public remove(entity: Entity): void {
        const index = this._entities.indexOf(entity);
        if (index !== -1) {
            this._entities.splice(index, 1);
            this.onRemoved(entity);
        }
    }

    /**
     * 当实体从系统中移除时调用
     * 
     * 子类可以重写此方法来处理实体移除事件。
     * 
     * @param entity 被移除的实体
     */
    protected onRemoved(entity: Entity): void {
        // 子类可以重写此方法
    }

    /**
     * 更新系统
     * 
     * 在每帧调用，处理系统的主要逻辑。
     */
    public update(): void {
        if (!this._enabled || !this.checkProcessing()) {
            return;
        }

        const startTime = this._performanceMonitor.startMonitoring(this._systemName);
        
        try {
            this.begin();
            this.process(this._entities);
        } finally {
            this._performanceMonitor.endMonitoring(this._systemName, startTime, this._entities.length);
        }
    }

    /**
     * 后期更新系统
     * 
     * 在所有系统的update方法执行完毕后调用。
     */
    public lateUpdate(): void {
        if (!this._enabled || !this.checkProcessing()) {
            return;
        }

        const startTime = this._performanceMonitor.startMonitoring(`${this._systemName}_Late`);
        
        try {
            this.lateProcess(this._entities);
            this.end();
        } finally {
            this._performanceMonitor.endMonitoring(`${this._systemName}_Late`, startTime, this._entities.length);
        }
    }

    /**
     * 在系统处理开始前调用
     * 
     * 子类可以重写此方法进行预处理操作。
     */
    protected begin(): void {
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
    protected end(): void {
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
    protected checkProcessing(): boolean {
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
        const entityCount = this._entities.length;
        const perfData = this.getPerformanceData();
        const perfInfo = perfData ? ` (${perfData.executionTime.toFixed(2)}ms)` : '';
        
        return `${this._systemName}[${entityCount} entities]${perfInfo}`;
    }
}

