import { Core, Entity, Component, HierarchySystem, HierarchyComponent } from '@esengine/ecs-framework';
import { EntityStoreService, MessageHub } from '@esengine/editor-core';
import { BaseCommand } from '../BaseCommand';

/**
 * 删除实体命令
 */
export class DeleteEntityCommand extends BaseCommand {
    private entityId: number;
    private entityName: string;
    private parentEntityId: number | null;
    private components: Component[] = [];
    private childEntityIds: number[] = [];

    constructor(
        private entityStore: EntityStoreService,
        private messageHub: MessageHub,
        private entity: Entity
    ) {
        super();
        this.entityId = entity.id;
        this.entityName = entity.name;

        // 通过 HierarchyComponent 获取父实体 ID
        const hierarchy = entity.getComponent(HierarchyComponent);
        this.parentEntityId = hierarchy?.parentId ?? null;

        // 保存组件状态用于撤销
        this.components = [...entity.components];

        // 保存子实体 ID
        this.childEntityIds = hierarchy?.childIds ? [...hierarchy.childIds] : [];
    }

    execute(): void {
        const scene = Core.scene;
        if (!scene) return;

        // 先移除子实体
        for (const childId of this.childEntityIds) {
            const child = scene.findEntityById(childId);
            if (child) {
                this.entityStore.removeEntity(child);
            }
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

        const hierarchySystem = scene.getSystem(HierarchySystem);

        // 重新创建实体
        const newEntity = scene.createEntity(this.entityName);

        // 设置父实体
        if (this.parentEntityId !== null && hierarchySystem) {
            const parentEntity = scene.findEntityById(this.parentEntityId);
            if (parentEntity) {
                hierarchySystem.setParent(newEntity, parentEntity);
            }
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
        for (const childId of this.childEntityIds) {
            const child = scene.findEntityById(childId);
            if (child && hierarchySystem) {
                hierarchySystem.setParent(child, newEntity);
                this.entityStore.addEntity(child, newEntity);
            }
        }

        // 获取父实体
        const parentEntity = this.parentEntityId !== null
            ? scene.findEntityById(this.parentEntityId) ?? undefined
            : undefined;

        this.entityStore.addEntity(newEntity, parentEntity);
        this.entityStore.selectEntity(newEntity);

        // 更新引用
        this.entity = newEntity;

        this.messageHub.publish('entity:added', { entity: newEntity });
    }

    getDescription(): string {
        return `删除实体: ${this.entityName}`;
    }
}
