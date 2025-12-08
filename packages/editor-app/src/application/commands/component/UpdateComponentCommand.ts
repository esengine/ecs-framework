import { Entity, Component } from '@esengine/ecs-framework';
import { MessageHub } from '@esengine/editor-core';
import { BaseCommand } from '../BaseCommand';
import { ICommand } from '../ICommand';

/**
 * 更新组件属性命令
 */
export class UpdateComponentCommand extends BaseCommand {
    private oldValue: unknown;

    constructor(
        private messageHub: MessageHub,
        private entity: Entity,
        private component: Component,
        private propertyName: string,
        private newValue: unknown
    ) {
        super();
        this.oldValue = (component as any)[propertyName];
    }

    execute(): void {
        (this.component as any)[this.propertyName] = this.newValue;

        this.messageHub.publish('component:property:changed', {
            entity: this.entity,
            component: this.component,
            propertyName: this.propertyName,
            value: this.newValue
        });
    }

    undo(): void {
        (this.component as any)[this.propertyName] = this.oldValue;

        this.messageHub.publish('component:property:changed', {
            entity: this.entity,
            component: this.component,
            propertyName: this.propertyName,
            value: this.oldValue
        });
    }

    getDescription(): string {
        return `更新 ${this.component.constructor.name}.${this.propertyName}`;
    }

    canMergeWith(other: ICommand): boolean {
        if (!(other instanceof UpdateComponentCommand)) return false;

        return (
            this.entity === other.entity &&
            this.component === other.component &&
            this.propertyName === other.propertyName
        );
    }

    mergeWith(other: ICommand): ICommand {
        if (!(other instanceof UpdateComponentCommand)) {
            throw new Error('无法合并不同类型的命令');
        }

        // 保留原始值，使用新命令的新值
        const merged = new UpdateComponentCommand(
            this.messageHub,
            this.entity,
            this.component,
            this.propertyName,
            other.newValue
        );
        merged.oldValue = this.oldValue;

        return merged;
    }
}
