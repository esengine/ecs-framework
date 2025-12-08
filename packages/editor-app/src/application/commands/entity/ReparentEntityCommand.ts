import { Core, Entity, HierarchySystem, HierarchyComponent } from '@esengine/ecs-framework';
import { EntityStoreService, MessageHub } from '@esengine/editor-core';
import { BaseCommand } from '../BaseCommand';

/**
 * 拖放位置类型
 */
export enum DropPosition {
    /** 在目标之前 */
    BEFORE = 'before',
    /** 在目标内部（作为子级） */
    INSIDE = 'inside',
    /** 在目标之后 */
    AFTER = 'after'
}

/**
 * 重新设置实体父级命令
 *
 * 支持拖拽重排功能，可以将实体移动到：
 * - 另一个实体之前 (BEFORE)
 * - 另一个实体内部作为子级 (INSIDE)
 * - 另一个实体之后 (AFTER)
 */
export class ReparentEntityCommand extends BaseCommand {
    private oldParentId: number | null;
    private oldSiblingIndex: number;

    constructor(
        private entityStore: EntityStoreService,
        private messageHub: MessageHub,
        private entity: Entity,
        private targetEntity: Entity,
        private dropPosition: DropPosition
    ) {
        super();

        // 保存原始状态用于撤销
        const hierarchy = entity.getComponent(HierarchyComponent);
        this.oldParentId = hierarchy?.parentId ?? null;

        // 获取在兄弟列表中的原始索引
        this.oldSiblingIndex = this.getSiblingIndex(entity);
    }

    execute(): void {
        const scene = Core.scene;
        if (!scene) {
            console.warn('[ReparentEntityCommand] No scene available');
            return;
        }

        const hierarchySystem = scene.getSystem(HierarchySystem);
        if (!hierarchySystem) {
            console.warn('[ReparentEntityCommand] No HierarchySystem found');
            return;
        }

        // 确保目标实体有 HierarchyComponent
        if (!this.targetEntity.getComponent(HierarchyComponent)) {
            this.targetEntity.addComponent(new HierarchyComponent());
        }

        console.log(`[ReparentEntityCommand] Moving ${this.entity.name} to ${this.targetEntity.name} (${this.dropPosition})`);

        switch (this.dropPosition) {
            case DropPosition.INSIDE:
                // 移动到目标实体内部作为最后一个子级
                hierarchySystem.setParent(this.entity, this.targetEntity);
                break;

            case DropPosition.BEFORE:
            case DropPosition.AFTER:
                // 移动到目标实体的同级
                this.moveToSibling(hierarchySystem);
                break;
        }

        this.entityStore.syncFromScene();
        this.messageHub.publish('entity:reparented', {
            entityId: this.entity.id,
            targetId: this.targetEntity.id,
            position: this.dropPosition
        });
    }

    undo(): void {
        const scene = Core.scene;
        if (!scene) return;

        const hierarchySystem = scene.getSystem(HierarchySystem);
        if (!hierarchySystem) return;

        // 恢复到原始父级
        const oldParent = this.oldParentId !== null
            ? scene.findEntityById(this.oldParentId)
            : null;

        if (oldParent) {
            // 恢复到原始父级的指定位置
            hierarchySystem.insertChildAt(oldParent, this.entity, this.oldSiblingIndex);
        } else {
            // 恢复到根级
            hierarchySystem.setParent(this.entity, null);
        }

        this.entityStore.syncFromScene();
        this.messageHub.publish('entity:reparented', {
            entityId: this.entity.id,
            targetId: null,
            position: 'undo'
        });
    }

    getDescription(): string {
        const positionText = this.dropPosition === DropPosition.INSIDE
            ? '移入'
            : this.dropPosition === DropPosition.BEFORE ? '移动到前面' : '移动到后面';
        return `${positionText}: ${this.entity.name} -> ${this.targetEntity.name}`;
    }

    /**
     * 移动到目标的同级位置
     */
    private moveToSibling(hierarchySystem: HierarchySystem): void {
        const targetHierarchy = this.targetEntity.getComponent(HierarchyComponent);
        const targetParentId = targetHierarchy?.parentId ?? null;

        const scene = Core.scene;
        if (!scene) return;

        // 获取目标的父实体
        const targetParent = targetParentId !== null
            ? scene.findEntityById(targetParentId)
            : null;

        // 获取目标在兄弟列表中的索引
        let targetIndex = this.getSiblingIndex(this.targetEntity);

        // 根据放置位置调整索引
        if (this.dropPosition === DropPosition.AFTER) {
            targetIndex++;
        }

        // 如果移动到同一父级下，需要考虑原位置对索引的影响
        const entityHierarchy = this.entity.getComponent(HierarchyComponent);
        const entityParentId = entityHierarchy?.parentId ?? null;

        const bSameParent = entityParentId === targetParentId;
        if (bSameParent) {
            const currentIndex = this.getSiblingIndex(this.entity);
            if (currentIndex < targetIndex) {
                targetIndex--;
            }
        }

        console.log(`[ReparentEntityCommand] moveToSibling: targetParent=${targetParent?.name ?? 'ROOT'}, targetIndex=${targetIndex}`);

        if (targetParent) {
            // 有父级，插入到父级的指定位置
            hierarchySystem.insertChildAt(targetParent, this.entity, targetIndex);
        } else {
            // 目标在根级
            // 先确保实体移动到根级
            if (entityParentId !== null) {
                hierarchySystem.setParent(this.entity, null);
            }
            // 然后调整根级顺序
            this.entityStore.reorderEntity(this.entity.id, targetIndex);
        }
    }

    /**
     * 获取实体在兄弟列表中的索引
     */
    private getSiblingIndex(entity: Entity): number {
        const scene = Core.scene;
        if (!scene) return 0;

        const hierarchy = entity.getComponent(HierarchyComponent);
        const parentId = hierarchy?.parentId;

        if (parentId === null || parentId === undefined) {
            // 根级实体，从 EntityStoreService 获取
            return this.entityStore.getRootEntityIds().indexOf(entity.id);
        }

        const parent = scene.findEntityById(parentId);
        if (!parent) return 0;

        const parentHierarchy = parent.getComponent(HierarchyComponent);
        return parentHierarchy?.childIds.indexOf(entity.id) ?? 0;
    }
}
