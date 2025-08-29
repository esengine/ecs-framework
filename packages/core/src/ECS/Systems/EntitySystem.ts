import { Entity } from '../Entity';
import { PerformanceMonitor } from '../../Utils/PerformanceMonitor';
import { Matcher } from '../Utils/Matcher';
import type { Scene } from '../Scene';
import type { ISystemBase } from '../../Types';
import type { QuerySystem } from '../Core/QuerySystem';
import { IQueryHandle, QueryCondition } from '../Core/QuerySystem/QueryHandle';
import { getSystemInstanceTypeName, getSystemInstanceMetadata, SystemMetadata, SystemPhase } from '../Decorators';
import { Core } from '../../Core';

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
    private _queryHandle: IQueryHandle | null = null;
    private _cachedEntities: Entity[] = [];
    
    // 确定性排序相关属性
    private _registrationOrder: number = 0;
    private _systemHash: number = 0;
    private _systemMetadata: SystemMetadata = { name: '', phase: SystemPhase.Update };
    private _phase: SystemPhase = SystemPhase.Update;
    
    // 静态注册计数器，用于记录系统注册顺序
    private static _registrationCounter: number = 0;

    /**
     * 获取系统处理的实体列表（从缓存中获取）
     */
    public get entities(): readonly Entity[] {
        return this._cachedEntities;
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

    /**
     * 获取系统的执行阶段
     */
    public get phase(): SystemPhase {
        return this._phase;
    }

    /**
     * 获取系统的注册顺序
     */
    public get registrationOrder(): number {
        return this._registrationOrder;
    }

    /**
     * 获取系统的哈希值（用于确定性排序）
     */
    public get systemHash(): number {
        return this._systemHash;
    }

    /**
     * 获取系统的完整元数据
     */
    public get metadata(): SystemMetadata {
        return this._systemMetadata;
    }

    constructor(matcher?: Matcher) {
        this._matcher = matcher ? matcher : Matcher.empty();
        this._systemName = getSystemInstanceTypeName(this);
        
        // 初始化确定性排序相关属性
        this.initializeInternalProperties();
    }

    /**
     * 初始化内部属性（用于确定性排序）
     */
    private initializeInternalProperties(): void {
        // 获取系统元数据
        this._systemMetadata = getSystemInstanceMetadata(this);
        this._phase = this._systemMetadata.phase ?? SystemPhase.Update;
        
        // 如果元数据中指定了updateOrder，则使用它
        if (this._systemMetadata.updateOrder !== undefined) {
            this._updateOrder = this._systemMetadata.updateOrder;
        }
        
        // 分配注册顺序
        this._registrationOrder = EntitySystem._registrationCounter++;
        
        // 生成系统哈希值（基于装饰器名称）
        this._systemHash = this.generateSystemHash();
    }

    /**
     * 生成系统哈希值（基于ECSSystem装饰器名称的简单哈希）
     * 使用装饰器提供的名称而非类名，避免代码混淆问题
     */
    private generateSystemHash(): number {
        // 使用标准的系统名称获取方法，避免混淆后的问题
        const systemName = getSystemInstanceTypeName(this);
        let hash = 0;
        for (let i = 0; i < systemName.length; i++) {
            const char = systemName.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return Math.abs(hash);
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

        // 框架内部初始化：创建QueryHandle进行订阅式查询
        if (this.scene && this.scene.querySystem) {
            this.createQueryHandle();
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
        
        // 清理QueryHandle
        if (this._queryHandle && this.scene && this.scene.querySystem) {
            this.scene.querySystem.destroyQueryHandle(this._queryHandle);
            this._queryHandle = null;
        }
        
        this._cachedEntities = [];
    }

    /**
     * 创建查询句柄进行订阅式查询
     */
    private createQueryHandle(): void {
        if (!this.scene?.querySystem || !this._matcher) {
            return;
        }

        const condition = this.convertMatcherToQueryCondition();
        this._queryHandle = this.scene.querySystem.createQueryHandle(condition);
        
        // 初始化缓存的实体列表
        this.updateCachedEntities(Array.from(this._queryHandle.entities));
        
        // 订阅实体变更事件
        this._queryHandle.subscribe(event => {
            if (event.type === 'added') {
                this._trackedEntities.add(event.entity);
                this.onAdded(event.entity);
            } else if (event.type === 'removed') {
                this._trackedEntities.delete(event.entity);
                this.onRemoved(event.entity);
            }
            
            // 更新缓存的实体列表
            this.updateCachedEntities(Array.from(this._queryHandle!.entities));
        });
    }

    /**
     * 将Matcher转换为QueryCondition
     */
    private convertMatcherToQueryCondition(): QueryCondition {
        const matcherCondition = this._matcher.getCondition();
        const condition: QueryCondition = {};

        if (matcherCondition.all && matcherCondition.all.length > 0) {
            condition.all = matcherCondition.all;
        }
        if (matcherCondition.any && matcherCondition.any.length > 0) {
            condition.any = matcherCondition.any;
        }
        if (matcherCondition.none && matcherCondition.none.length > 0) {
            condition.none = matcherCondition.none;
        }
        if (matcherCondition.tag !== undefined) {
            condition.tag = matcherCondition.tag;
        }
        if (matcherCondition.name !== undefined) {
            condition.name = matcherCondition.name;
        }
        if (matcherCondition.component !== undefined) {
            condition.component = matcherCondition.component;
        }

        return condition;
    }

    /**
     * 更新缓存的实体列表
     */
    private updateCachedEntities(entities: Entity[]): void {
        this._cachedEntities = [...entities];
        
        // 根据配置决定是否对实体进行确定性排序
        if (Core.deterministicSortingEnabled) {
            this._cachedEntities.sort((a, b) => a.id - b.id);
        }
    }

    /**
     * 查询匹配的实体（已弃用，使用QueryHandle替代）
     * @deprecated 使用订阅式查询替代每帧查询
     */
    private queryEntities(): Entity[] {
        // 已弃用方法，保持向后兼容
        return this._cachedEntities;
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
            // 使用缓存的实体列表
            entityCount = this._cachedEntities.length;
            this.process(this._cachedEntities);
        } finally {
            this._performanceMonitor.endMonitoring(this._systemName, startTime, entityCount);
        }
    }

    /**
     * 固定步长更新系统
     * 
     * 用于物理计算、网络同步等需要确定性更新的逻辑。
     * 子类可以重写此方法来实现固定步长更新逻辑。
     */
    public fixedUpdate(): void {
        if (!this._enabled || !this.onCheckProcessing()) {
            return;
        }

        const startTime = this._performanceMonitor.startMonitoring(`${this._systemName}_Fixed`);
        let entityCount = 0;

        try {
            // 使用缓存的实体列表
            entityCount = this._cachedEntities.length;
            this.fixedProcess(this._cachedEntities);
        } finally {
            this._performanceMonitor.endMonitoring(`${this._systemName}_Fixed`, startTime, entityCount);
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
            // 使用缓存的实体列表
            entityCount = this._cachedEntities.length;
            this.lateProcess(this._cachedEntities);
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
     * 固定步长处理实体列表
     * 
     * 用于物理计算、网络同步等需要确定性更新的逻辑。
     * 子类可以重写此方法来实现固定步长处理逻辑。
     * 
     * @param entities 要处理的实体列表
     */
    protected fixedProcess(_entities: Entity[]): void {
        // 子类可以重写此方法
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
     * @deprecated 订阅式查询中由QueryHandle自动处理实体变更事件
     */
    private updateEntityTracking(_currentEntities: Entity[]): void {
        // 已弃用方法，订阅式查询中由QueryHandle自动处理实体变更事件
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