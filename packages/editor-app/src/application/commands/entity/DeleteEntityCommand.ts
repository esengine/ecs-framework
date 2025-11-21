import { Core, Entity, Component } from '@esengine/ecs-framework';
import { EntityStoreService, MessageHub } from '@esengine/editor-core';
import { BaseCommand } from '../BaseCommand';

/**
 * 删除实体命令
 */
export class DeleteEntityCommand extends BaseCommand {
    private entityId: number;
    private entityName: string;
    private parentEntity: Entity | null;
    private components: Component[] = [];
    private childEntities: Entity[] = [];

    constructor(
        private entityStore: EntityStoreService,
        private messageHub: MessageHub,
        private entity: Entity
    ) {
        super();
        this.entityId = entity.id;
        this.entityName = entity.name;
        this.parentEntity = entity.parent;

        // 保存组件状态用于撤销
        this.components = [...entity.components];
        // 保存子实体
        this.childEntities = [...entity.children];
    }

    execute(): void {
        // 先移除子实体
        for (const child of this.childEntities) {
            this.entityStore.removeEntity(child);
        }

        this.entityStore.removeEntity(this.entity);
        this.entity.destroy();

        this.messageHub.publish('entity:removed', { entityId: this.entityId });
    }

    undo(): void {
        const scene = Core.scene;
        if (!scene) {
            throw new Error('场景未初始化');
        }

        // 重新创建实体
        const newEntity = scene.createEntity(this.entityName);

        // 设置父实体
        if (this.parentEntity) {
            this.parentEntity.addChild(newEntity);
        }

        // 恢复组件
        for (const component of this.components) {
            // 创建组件副本
            const ComponentClass = component.constructor as new () => Component;
            const newComponent = new ComponentClass();

            // 复制属性
            for (const key of Object.keys(component)) {
                if (key !== 'entity' && key !== 'id') {
                    (newComponent as any)[key] = (component as any)[key];
                }
            }

            newEntity.addComponent(newComponent);
        }

        // 恢复子实体
        for (const child of this.childEntities) {
            newEntity.addChild(child);
            this.entityStore.addEntity(child, newEntity);
        }

        this.entityStore.addEntity(newEntity, this.parentEntity ?? undefined);
        this.entityStore.selectEntity(newEntity);

        // 更新引用
        this.entity = newEntity;

        this.messageHub.publish('entity:added', { entity: newEntity });
    }

    getDescription(): string {
        return `删除实体: ${this.entityName}`;
    }
}
