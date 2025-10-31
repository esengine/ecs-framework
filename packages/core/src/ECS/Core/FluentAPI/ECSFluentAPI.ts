import { Entity } from '../../Entity';
import { Component } from '../../Component';
import { IScene } from '../../IScene';
import { ComponentType } from '../ComponentStorage';
import { QuerySystem, QueryBuilder } from '../QuerySystem';
import { TypeSafeEventSystem } from '../EventSystem';
import { EntityBuilder } from './EntityBuilder';
import { SceneBuilder } from './SceneBuilder';
import { ComponentBuilder } from './ComponentBuilder';
import { EntityBatchOperator } from './EntityBatchOperator';

/**
 * ECS流式API主入口
 * 提供统一的流式接口
 */
export class ECSFluentAPI {
    private scene: IScene;
    private querySystem: QuerySystem;
    private eventSystem: TypeSafeEventSystem;

    constructor(scene: IScene, querySystem: QuerySystem, eventSystem: TypeSafeEventSystem) {
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
        componentClass: new (...args: unknown[]) => T,
        ...args: unknown[]
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
     * 查找实体
     * @param componentTypes 组件类型
     * @returns 实体数组
     */
    public find(...componentTypes: ComponentType[]): readonly Entity[] {
        return this.querySystem.queryAll(...componentTypes).entities;
    }

    /**
     * 查找第一个匹配的实体
     * @param componentTypes 组件类型
     * @returns 实体或null
     */
    public findFirst(...componentTypes: ComponentType[]): Entity | null {
        const result = this.querySystem.queryAll(...componentTypes);
        return result.entities.length > 0 ? result.entities[0]! : null;
    }

    /**
     * 按名称查找实体
     * @param name 实体名称
     * @returns 实体或null
     */
    public findByName(name: string): Entity | null {
        return this.scene.findEntity(name);
    }

    /**
     * 按标签查找实体
     * @param tag 标签
     * @returns 实体数组
     */
    public findByTag(tag: number): Entity[] {
        return this.scene.findEntitiesByTag(tag);
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
        componentStats: Map<string, unknown>;
        queryStats: unknown;
        eventStats: Map<string, unknown>;
        } {
        return {
            entityCount: this.scene.entities.count,
            systemCount: this.scene.systems.length,
            componentStats: this.scene.componentStorageManager.getAllStats(),
            queryStats: this.querySystem.getStats(),
            eventStats: this.eventSystem.getStats() as Map<string, unknown>
        };
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
    scene: IScene,
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
    scene: IScene,
    querySystem: QuerySystem,
    eventSystem: TypeSafeEventSystem
): void {
    ECS = createECSAPI(scene, querySystem, eventSystem);
}
