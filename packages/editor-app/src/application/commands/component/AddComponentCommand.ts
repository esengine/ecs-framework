import { Entity, Component } from '@esengine/ecs-framework';
import { MessageHub } from '@esengine/editor-core';
import { BaseCommand } from '../BaseCommand';

/**
 * 添加组件命令
 */
export class AddComponentCommand extends BaseCommand {
    private component: Component | null = null;

    constructor(
        private messageHub: MessageHub,
        private entity: Entity,
        private ComponentClass: new () => Component,
        private initialData?: Record<string, unknown>
    ) {
        super();
    }

    execute(): void {
        this.component = new this.ComponentClass();

        // 应用初始数据
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

    undo(): void {
        if (!this.component) return;

        this.entity.removeComponent(this.component);

        this.messageHub.publish('component:removed', {
            entity: this.entity,
            componentType: this.ComponentClass.name
        });

        this.component = null;
    }

    getDescription(): string {
        return `添加组件: ${this.ComponentClass.name}`;
    }
}
