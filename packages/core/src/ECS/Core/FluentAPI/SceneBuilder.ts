import { Entity } from '../../Entity';
import { Scene } from '../../Scene';
import { EntitySystem } from '../../Systems/EntitySystem';
import { EntityBuilder } from './EntityBuilder';

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
    public withSystem(system: EntitySystem): SceneBuilder {
        this.scene.addSystem(system);
        return this;
    }

    /**
     * 批量添加系统
     * @param systems 系统数组
     * @returns 场景构建器
     */
    public withSystems(...systems: EntitySystem[]): SceneBuilder {
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
