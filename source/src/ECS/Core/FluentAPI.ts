import { Entity } from '../Entity';
import { Component } from '../Component';
import { Scene } from '../Scene';
import { ComponentType, ComponentStorageManager } from './ComponentStorage';
import { QuerySystem, QueryBuilder } from './QuerySystem';
import { TypeSafeEventSystem } from './EventSystem';

/**
 * 实体构建器 - 提供流式API创建和配置实体
 */
export class EntityBuilder {
    private entity: Entity;
    private scene: Scene;
    private storageManager: ComponentStorageManager;

    constructor(scene: Scene, storageManager: ComponentStorageManager) {
        this.scene = scene;
        this.storageManager = storageManager;
        this.entity = new Entity("", scene.identifierPool.checkOut());
    }

    /**
     * 设置实体名称
     * @param name 实体名称
     * @returns 实体构建器
     */
    public named(name: string): EntityBuilder {
        this.entity.name = name;
        return this;
    }

    /**
     * 设置实体标签
     * @param tag 标签
     * @returns 实体构建器
     */
    public tagged(tag: number): EntityBuilder {
        this.entity.tag = tag;
        return this;
    }

    /**
     * 添加组件
     * @param component 组件实例
     * @returns 实体构建器
     */
    public with<T extends Component>(component: T): EntityBuilder {
        this.entity.addComponent(component);
        return this;
    }

    /**
     * 添加多个组件
     * @param components 组件数组
     * @returns 实体构建器
     */
    public withComponents(...components: Component[]): EntityBuilder {
        for (const component of components) {
            this.entity.addComponent(component);
        }
        return this;
    }

    /**
     * 条件性添加组件
     * @param condition 条件
     * @param component 组件实例
     * @returns 实体构建器
     */
    public withIf<T extends Component>(condition: boolean, component: T): EntityBuilder {
        if (condition) {
            this.entity.addComponent(component);
        }
        return this;
    }

    /**
     * 使用工厂函数创建并添加组件
     * @param factory 组件工厂函数
     * @returns 实体构建器
     */
    public withFactory<T extends Component>(factory: () => T): EntityBuilder {
        const component = factory();
        this.entity.addComponent(component);
        return this;
    }

    /**
     * 配置组件属性
     * @param componentType 组件类型
     * @param configurator 配置函数
     * @returns 实体构建器
     */
    public configure<T extends Component>(
        componentType: ComponentType<T>, 
        configurator: (component: T) => void
    ): EntityBuilder {
        const component = this.entity.getComponent(componentType);
        if (component) {
            configurator(component);
        }
        return this;
    }

    /**
     * 设置实体为启用状态
     * @param enabled 是否启用
     * @returns 实体构建器
     */
    public enabled(enabled: boolean = true): EntityBuilder {
        this.entity.enabled = enabled;
        return this;
    }

    /**
     * 设置实体为活跃状态
     * @param active 是否活跃
     * @returns 实体构建器
     */
    public active(active: boolean = true): EntityBuilder {
        this.entity.active = active;
        return this;
    }

    /**
     * 添加子实体
     * @param childBuilder 子实体构建器
     * @returns 实体构建器
     */
    public withChild(childBuilder: EntityBuilder): EntityBuilder {
        const child = childBuilder.build();
        this.entity.addChild(child);
        return this;
    }

    /**
     * 批量添加子实体
     * @param childBuilders 子实体构建器数组
     * @returns 实体构建器
     */
    public withChildren(...childBuilders: EntityBuilder[]): EntityBuilder {
        for (const childBuilder of childBuilders) {
            const child = childBuilder.build();
            this.entity.addChild(child);
        }
        return this;
    }

    /**
     * 使用工厂函数创建子实体
     * @param childFactory 子实体工厂函数
     * @returns 实体构建器
     */
    public withChildFactory(childFactory: (parent: Entity) => EntityBuilder): EntityBuilder {
        const childBuilder = childFactory(this.entity);
        const child = childBuilder.build();
        this.entity.addChild(child);
        return this;
    }

    /**
     * 条件性添加子实体
     * @param condition 条件
     * @param childBuilder 子实体构建器
     * @returns 实体构建器
     */
    public withChildIf(condition: boolean, childBuilder: EntityBuilder): EntityBuilder {
        if (condition) {
            const child = childBuilder.build();
            this.entity.addChild(child);
        }
        return this;
    }

    /**
     * 构建并返回实体
     * @returns 构建的实体
     */
    public build(): Entity {
        return this.entity;
    }

    /**
     * 构建实体并添加到场景
     * @returns 构建的实体
     */
    public spawn(): Entity {
        this.scene.addEntity(this.entity);
        return this.entity;
    }

    /**
     * 克隆当前构建器
     * @returns 新的实体构建器
     */
    public clone(): EntityBuilder {
        const newBuilder = new EntityBuilder(this.scene, this.storageManager);
        // 这里需要深度克隆实体，简化实现
        newBuilder.entity = this.entity; // 实际应该是深度克隆
        return newBuilder;
    }
}

/**
 * 场景构建器 - 提供流式API创建和配置场景
 */
export class SceneBuilder {
    private scene: Scene;

    constructor() {
        this.scene = new Scene();
    }

    /**
     * 设置场景名称
     * @param name 场景名称
     * @returns 场景构建器
     */
    public named(name: string): SceneBuilder {
        this.scene.name = name;
        return this;
    }

    /**
     * 添加实体
     * @param entity 实体
     * @returns 场景构建器
     */
    public withEntity(entity: Entity): SceneBuilder {
        this.scene.addEntity(entity);
        return this;
    }

    /**
     * 使用实体构建器添加实体
     * @param builderFn 实体构建器函数
     * @returns 场景构建器
     */
    public withEntityBuilder(builderFn: (builder: EntityBuilder) => EntityBuilder): SceneBuilder {
        const builder = new EntityBuilder(this.scene, this.scene.componentStorageManager);
        const configuredBuilder = builderFn(builder);
        const entity = configuredBuilder.build();
        this.scene.addEntity(entity);
        return this;
    }

    /**
     * 批量添加实体
     * @param entities 实体数组
     * @returns 场景构建器
     */
    public withEntities(...entities: Entity[]): SceneBuilder {
        for (const entity of entities) {
            this.scene.addEntity(entity);
        }
        return this;
    }

    /**
     * 添加系统
     * @param system 系统实例
     * @returns 场景构建器
     */
    public withSystem(system: any): SceneBuilder {
        this.scene.addSystem(system);
        return this;
    }

    /**
     * 批量添加系统
     * @param systems 系统数组
     * @returns 场景构建器
     */
    public withSystems(...systems: any[]): SceneBuilder {
        for (const system of systems) {
            this.scene.addSystem(system);
        }
        return this;
    }

    /**
     * 构建并返回场景
     * @returns 构建的场景
     */
    public build(): Scene {
        return this.scene;
    }
}

/**
 * 组件构建器 - 提供流式API创建组件
 */
export class ComponentBuilder<T extends Component> {
    private component: T;

    constructor(componentClass: new (...args: any[]) => T, ...args: any[]) {
        this.component = new componentClass(...args);
    }

    /**
     * 设置组件属性
     * @param property 属性名
     * @param value 属性值
     * @returns 组件构建器
     */
    public set<K extends keyof T>(property: K, value: T[K]): ComponentBuilder<T> {
        this.component[property] = value;
        return this;
    }

    /**
     * 使用配置函数设置组件
     * @param configurator 配置函数
     * @returns 组件构建器
     */
    public configure(configurator: (component: T) => void): ComponentBuilder<T> {
        configurator(this.component);
        return this;
    }

    /**
     * 条件性设置属性
     * @param condition 条件
     * @param property 属性名
     * @param value 属性值
     * @returns 组件构建器
     */
    public setIf<K extends keyof T>(condition: boolean, property: K, value: T[K]): ComponentBuilder<T> {
        if (condition) {
            this.component[property] = value;
        }
        return this;
    }

    /**
     * 构建并返回组件
     * @returns 构建的组件
     */
    public build(): T {
        return this.component;
    }
}

/**
 * ECS流式API主入口
 * 提供统一的流式接口
 */
export class ECSFluentAPI {
    private scene: Scene;
    private querySystem: QuerySystem;
    private eventSystem: TypeSafeEventSystem;

    constructor(scene: Scene, querySystem: QuerySystem, eventSystem: TypeSafeEventSystem) {
        this.scene = scene;
        this.querySystem = querySystem;
        this.eventSystem = eventSystem;
    }

    /**
     * 创建实体构建器
     * @returns 实体构建器
     */
    public createEntity(): EntityBuilder {
        return new EntityBuilder(this.scene, this.scene.componentStorageManager);
    }

    /**
     * 创建场景构建器
     * @returns 场景构建器
     */
    public createScene(): SceneBuilder {
        return new SceneBuilder();
    }

    /**
     * 创建组件构建器
     * @param componentClass 组件类
     * @param args 构造参数
     * @returns 组件构建器
     */
    public createComponent<T extends Component>(
        componentClass: new (...args: any[]) => T, 
        ...args: any[]
    ): ComponentBuilder<T> {
        return new ComponentBuilder(componentClass, ...args);
    }

    /**
     * 创建查询构建器
     * @returns 查询构建器
     */
    public query(): QueryBuilder {
        return new QueryBuilder(this.querySystem);
    }

    /**
     * 查找实体（简化版）
     * @param componentTypes 组件类型
     * @returns 实体数组
     */
    public find(...componentTypes: ComponentType[]): Entity[] {
        return this.querySystem.queryAll(...componentTypes).entities;
    }

    /**
     * 查找第一个匹配的实体
     * @param componentTypes 组件类型
     * @returns 实体或null
     */
    public findFirst(...componentTypes: ComponentType[]): Entity | null {
        const result = this.querySystem.queryAll(...componentTypes);
        return result.entities.length > 0 ? result.entities[0] : null;
    }

    /**
     * 按名称查找实体
     * @param name 实体名称
     * @returns 实体或null
     */
    public findByName(name: string): Entity | null {
        return this.scene.getEntityByName(name);
    }

    /**
     * 按标签查找实体
     * @param tag 标签
     * @returns 实体数组
     */
    public findByTag(tag: number): Entity[] {
        return this.scene.getEntitiesByTag(tag);
    }

    /**
     * 触发事件
     * @param eventType 事件类型
     * @param event 事件数据
     */
    public emit<T>(eventType: string, event: T): void {
        this.eventSystem.emitSync(eventType, event);
    }

    /**
     * 异步触发事件
     * @param eventType 事件类型
     * @param event 事件数据
     */
    public async emitAsync<T>(eventType: string, event: T): Promise<void> {
        await this.eventSystem.emit(eventType, event);
    }

    /**
     * 监听事件
     * @param eventType 事件类型
     * @param handler 事件处理器
     * @returns 监听器ID
     */
    public on<T>(eventType: string, handler: (event: T) => void): string {
        return this.eventSystem.on(eventType, handler);
    }

    /**
     * 一次性监听事件
     * @param eventType 事件类型
     * @param handler 事件处理器
     * @returns 监听器ID
     */
    public once<T>(eventType: string, handler: (event: T) => void): string {
        return this.eventSystem.once(eventType, handler);
    }

    /**
     * 移除事件监听器
     * @param eventType 事件类型
     * @param listenerId 监听器ID
     */
    public off(eventType: string, listenerId: string): void {
        this.eventSystem.off(eventType, listenerId);
    }

    /**
     * 批量操作实体
     * @param entities 实体数组
     * @returns 批量操作器
     */
    public batch(entities: Entity[]): EntityBatchOperator {
        return new EntityBatchOperator(entities);
    }

    /**
     * 获取场景统计信息
     * @returns 统计信息
     */
    public getStats(): {
        entityCount: number;
        systemCount: number;
        componentStats: Map<string, any>;
        queryStats: any;
        eventStats: Map<string, any>;
    } {
        return {
            entityCount: this.scene.entities.count,
            systemCount: this.scene.systems.length,
            componentStats: this.scene.componentStorageManager.getAllStats(),
            queryStats: this.querySystem.getStats(),
            eventStats: this.eventSystem.getStats() as Map<string, any>
        };
    }
}

/**
 * 实体批量操作器
 * 提供对多个实体的批量操作
 */
export class EntityBatchOperator {
    private entities: Entity[];

    constructor(entities: Entity[]) {
        this.entities = entities;
    }

    /**
     * 批量添加组件
     * @param component 组件实例
     * @returns 批量操作器
     */
    public addComponent<T extends Component>(component: T): EntityBatchOperator {
        for (const entity of this.entities) {
            entity.addComponent(component);
        }
        return this;
    }

    /**
     * 批量移除组件
     * @param componentType 组件类型
     * @returns 批量操作器
     */
    public removeComponent<T extends Component>(componentType: ComponentType<T>): EntityBatchOperator {
        for (const entity of this.entities) {
            entity.removeComponentByType(componentType);
        }
        return this;
    }

    /**
     * 批量设置活跃状态
     * @param active 是否活跃
     * @returns 批量操作器
     */
    public setActive(active: boolean): EntityBatchOperator {
        for (const entity of this.entities) {
            entity.active = active;
        }
        return this;
    }

    /**
     * 批量设置标签
     * @param tag 标签
     * @returns 批量操作器
     */
    public setTag(tag: number): EntityBatchOperator {
        for (const entity of this.entities) {
            entity.tag = tag;
        }
        return this;
    }

    /**
     * 批量执行操作
     * @param operation 操作函数
     * @returns 批量操作器
     */
    public forEach(operation: (entity: Entity, index: number) => void): EntityBatchOperator {
        this.entities.forEach(operation);
        return this;
    }

    /**
     * 过滤实体
     * @param predicate 过滤条件
     * @returns 新的批量操作器
     */
    public filter(predicate: (entity: Entity) => boolean): EntityBatchOperator {
        return new EntityBatchOperator(this.entities.filter(predicate));
    }

    /**
     * 获取实体数组
     * @returns 实体数组
     */
    public toArray(): Entity[] {
        return this.entities.slice();
    }

    /**
     * 获取实体数量
     * @returns 实体数量
     */
    public count(): number {
        return this.entities.length;
    }
}

/**
 * 创建ECS流式API实例
 * @param scene 场景
 * @param querySystem 查询系统
 * @param eventSystem 事件系统
 * @returns ECS流式API实例
 */
export function createECSAPI(
    scene: Scene, 
    querySystem: QuerySystem, 
    eventSystem: TypeSafeEventSystem
): ECSFluentAPI {
    return new ECSFluentAPI(scene, querySystem, eventSystem);
}

/**
 * 全局ECS流式API实例（需要在使用前初始化）
 */
export let ECS: ECSFluentAPI;

/**
 * 初始化全局ECS API
 * @param scene 场景
 * @param querySystem 查询系统
 * @param eventSystem 事件系统
 */
export function initializeECS(
    scene: Scene, 
    querySystem: QuerySystem, 
    eventSystem: TypeSafeEventSystem
): void {
    ECS = createECSAPI(scene, querySystem, eventSystem);
}