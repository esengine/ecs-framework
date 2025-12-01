import { Core, Entity, HierarchySystem, HierarchyComponent } from '@esengine/ecs-framework';
import { EntityStoreService, MessageHub } from '@esengine/editor-core';
import { TransformComponent } from '@esengine/engine-core';
import { SpriteComponent } from '@esengine/sprite';
import { BaseCommand } from '../BaseCommand';

/**
 * 创建带Sprite组件的实体命令
 */
export class CreateSpriteEntityCommand extends BaseCommand {
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

        // 添加 Transform、Sprite 和 Hierarchy 组件
        this.entity.addComponent(new TransformComponent());
        this.entity.addComponent(new SpriteComponent());
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
        return `创建Sprite实体: ${this.entityName}`;
    }

    getCreatedEntity(): Entity | null {
        return this.entity;
    }
}
