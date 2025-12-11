import { Entity, Component, getComponentDependencies, getComponentTypeName } from '@esengine/ecs-framework';
import { MessageHub, ComponentRegistry } from '@esengine/editor-core';
import { Core } from '@esengine/ecs-framework';
import { BaseCommand } from '../BaseCommand';

/**
 * 添加组件命令
 *
 * 自动添加缺失的依赖组件（通过 @ECSComponent requires 选项声明）
 * Automatically adds missing dependency components (declared via @ECSComponent requires option)
 */
export class AddComponentCommand extends BaseCommand {
    private component: Component | null = null;
    /** 自动添加的依赖组件（用于撤销时一并移除） | Auto-added dependencies (for undo removal) */
    private autoAddedDependencies: Component[] = [];

    constructor(
        private messageHub: MessageHub,
        private entity: Entity,
        private ComponentClass: new () => Component,
        private initialData?: Record<string, unknown>
    ) {
        super();
    }

    execute(): void {
        // 先添加缺失的依赖组件 | Add missing dependencies first
        this.addMissingDependencies();

        this.component = new this.ComponentClass();

        // 应用初始数据 | Apply initial data
        if (this.initialData) {
            for (const [key, value] of Object.entries(this.initialData)) {
                (this.component as any)[key] = value;
            }
        }

        this.entity.addComponent(this.component);

        this.messageHub.publish('component:added', {
            entity: this.entity,
            component: this.component
        });
    }

    /**
     * 添加缺失的依赖组件
     * Add missing dependency components
     */
    private addMissingDependencies(): void {
        const dependencies = getComponentDependencies(this.ComponentClass);

        if (!dependencies || dependencies.length === 0) {
            return;
        }

        const componentRegistry = Core.services.tryResolve(ComponentRegistry) as ComponentRegistry | null;
        if (!componentRegistry) {
            return;
        }

        for (const depName of dependencies) {
            // 检查实体是否已有该依赖组件 | Check if entity already has this dependency
            const depInfo = componentRegistry.getComponent(depName);

            if (!depInfo?.type) {
                console.warn(`Dependency component not found in registry: ${depName}`);
                continue;
            }

            const DepClass = depInfo.type;

            // 使用名称检查而非类引用，因为打包可能导致同一个类有多个副本
            // Use name-based check instead of class reference, as bundling may create multiple copies of the same class
            const foundByName = this.entity.components.find(c => c.constructor.name === DepClass.name);

            if (foundByName) {
                // 组件已存在（通过名称匹配），跳过添加
                // Component already exists (matched by name), skip adding
                continue;
            }

            // 自动添加依赖组件 | Auto-add dependency component
            const depComponent = new DepClass();
            this.entity.addComponent(depComponent);
            this.autoAddedDependencies.push(depComponent);

            this.messageHub.publish('component:added', {
                entity: this.entity,
                component: depComponent,
                isAutoDependency: true
            });
        }
    }

    undo(): void {
        if (!this.component) return;

        // 先移除主组件 | Remove main component first
        this.entity.removeComponent(this.component);

        this.messageHub.publish('component:removed', {
            entity: this.entity,
            componentType: getComponentTypeName(this.ComponentClass)
        });

        // 移除自动添加的依赖组件（逆序） | Remove auto-added dependencies (reverse order)
        for (let i = this.autoAddedDependencies.length - 1; i >= 0; i--) {
            const dep = this.autoAddedDependencies[i];
            if (dep) {
                this.entity.removeComponent(dep);
                this.messageHub.publish('component:removed', {
                    entity: this.entity,
                    componentType: dep.constructor.name,
                    isAutoDependency: true
                });
            }
        }

        this.component = null;
        this.autoAddedDependencies = [];
    }

    getDescription(): string {
        const mainName = getComponentTypeName(this.ComponentClass);
        if (this.autoAddedDependencies.length > 0) {
            const depNames = this.autoAddedDependencies.map(d => d.constructor.name).join(', ');
            return `添加组件: ${mainName} (+ 依赖: ${depNames})`;
        }
        return `添加组件: ${mainName}`;
    }
}
