import { Entity, Component } from '@esengine/ecs-framework';
import { MessageHub } from '@esengine/editor-core';
import { BaseCommand } from '../BaseCommand';

/**
 * 移除组件命令
 */
export class RemoveComponentCommand extends BaseCommand {
    private componentData: Record<string, unknown> = {};
    private ComponentClass: new () => Component;

    constructor(
        private messageHub: MessageHub,
        private entity: Entity,
        private component: Component
    ) {
        super();
        this.ComponentClass = component.constructor as new () => Component;

        // 保存组件数据用于撤销
        for (const key of Object.keys(component)) {
            if (key !== 'entity' && key !== 'id') {
                this.componentData[key] = (component as any)[key];
            }
        }
    }

    execute(): void {
        this.entity.removeComponent(this.component);

        this.messageHub.publish('component:removed', {
            entity: this.entity,
            componentType: this.ComponentClass.name
        });
    }

    undo(): void {
        const newComponent = new this.ComponentClass();

        // 恢复数据
        for (const [key, value] of Object.entries(this.componentData)) {
            (newComponent as any)[key] = value;
        }

        this.entity.addComponent(newComponent);
        this.component = newComponent;

        this.messageHub.publish('component:added', {
            entity: this.entity,
            component: newComponent
        });
    }

    getDescription(): string {
        return `移除组件: ${this.ComponentClass.name}`;
    }
}
