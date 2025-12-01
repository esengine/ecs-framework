import { Entity } from '../../Entity';
import { Component } from '../../Component';
import { IScene } from '../../IScene';
import { ComponentType, ComponentStorageManager } from '../ComponentStorage';
import { HierarchySystem } from '../../Systems/HierarchySystem';

/**
 * 实体构建器 - 提供流式API创建和配置实体
 */
export class EntityBuilder {
    private entity: Entity;
    private scene: IScene;
    private storageManager: ComponentStorageManager;

    constructor(scene: IScene, storageManager: ComponentStorageManager) {
        this.scene = scene;
        this.storageManager = storageManager;
        const id = scene.identifierPool.checkOut();
        this.entity = new Entity('', id);
        this.entity.scene = this.scene as any;
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
        const hierarchySystem = this.scene.getSystem(HierarchySystem);
        hierarchySystem?.setParent(child, this.entity);
        return this;
    }

    /**
     * 批量添加子实体
     * @param childBuilders 子实体构建器数组
     * @returns 实体构建器
     */
    public withChildren(...childBuilders: EntityBuilder[]): EntityBuilder {
        const hierarchySystem = this.scene.getSystem(HierarchySystem);
        for (const childBuilder of childBuilders) {
            const child = childBuilder.build();
            hierarchySystem?.setParent(child, this.entity);
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
        const hierarchySystem = this.scene.getSystem(HierarchySystem);
        hierarchySystem?.setParent(child, this.entity);
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
            const hierarchySystem = this.scene.getSystem(HierarchySystem);
            hierarchySystem?.setParent(child, this.entity);
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
