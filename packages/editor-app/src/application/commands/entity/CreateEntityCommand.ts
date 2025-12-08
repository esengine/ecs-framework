import { Core, Entity, HierarchySystem, HierarchyComponent } from '@esengine/ecs-framework';
import { EntityStoreService, MessageHub } from '@esengine/editor-core';
import { TransformComponent } from '@esengine/engine-core';
import { BaseCommand } from '../BaseCommand';

/**
 * 创建实体命令
 */
export class CreateEntityCommand extends BaseCommand {
    private entity: Entity | null = null;
    private entityId: number | null = null;

    constructor(
        private entityStore: EntityStoreService,
        private messageHub: MessageHub,
        private entityName: string,
        private parentEntity?: Entity
    ) {
        super();
    }

    execute(): void {
        const scene = Core.scene;
        if (!scene) {
            throw new Error('场景未初始化');
        }

        this.entity = scene.createEntity(this.entityName);
        this.entityId = this.entity.id;

        // 自动添加 Transform 组件
        this.entity.addComponent(new TransformComponent());

        // 添加 HierarchyComponent 支持层级结构
        this.entity.addComponent(new HierarchyComponent());

        if (this.parentEntity) {
            const hierarchySystem = scene.getSystem(HierarchySystem);
            hierarchySystem?.setParent(this.entity, this.parentEntity);
        }

        this.entityStore.addEntity(this.entity, this.parentEntity);
        this.entityStore.selectEntity(this.entity);

        this.messageHub.publish('entity:added', { entity: this.entity });
    }

    undo(): void {
        if (!this.entity) return;

        this.entityStore.removeEntity(this.entity);
        this.entity.destroy();

        this.messageHub.publish('entity:removed', { entityId: this.entityId });

        this.entity = null;
    }

    getDescription(): string {
        return `创建实体: ${this.entityName}`;
    }

    getCreatedEntity(): Entity | null {
        return this.entity;
    }
}
