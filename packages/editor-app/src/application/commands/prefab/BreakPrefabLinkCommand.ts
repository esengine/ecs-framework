/**
 * 断开预制体链接命令
 * Break prefab link command
 *
 * 断开实体与源预制体的关联，使其成为普通实体。
 * Breaks the link between an entity and its source prefab, making it a regular entity.
 */

import { Entity, PrefabInstanceComponent, Core } from '@esengine/ecs-framework';
import type { MessageHub, PrefabService } from '@esengine/editor-core';
import { BaseCommand } from '../BaseCommand';

/**
 * 保存的预制体实例组件状态
 * Saved prefab instance component state
 */
interface PrefabInstanceState {
    entityId: number;
    sourcePrefabGuid: string;
    sourcePrefabPath: string;
    isRoot: boolean;
    rootInstanceEntityId: number | null;
    modifiedProperties: string[];
    originalValues: Record<string, unknown>;
    instantiatedAt: number;
}

/**
 * 断开预制体链接命令
 * Break prefab link command
 */
export class BreakPrefabLinkCommand extends BaseCommand {
    private removedStates: PrefabInstanceState[] = [];

    constructor(
        private prefabService: PrefabService,
        private messageHub: MessageHub,
        private entity: Entity
    ) {
        super();
    }

    execute(): void {
        // 保存所有将被移除的组件状态 | Save all component states that will be removed
        this.removedStates = [];

        const comp = this.entity.getComponent(PrefabInstanceComponent);
        if (!comp) {
            throw new Error('Entity is not a prefab instance');
        }

        // 保存根实体的状态 | Save root entity state
        this.saveComponentState(this.entity);

        // 如果是根节点，也保存所有子实体的状态
        // If it's root, also save all children's state
        if (comp.isRoot) {
            const scene = Core.scene;
            if (scene) {
                scene.entities.forEach((e) => {
                    if (e.id === this.entity.id) return;
                    const childComp = e.getComponent(PrefabInstanceComponent);
                    if (childComp && childComp.rootInstanceEntityId === this.entity.id) {
                        this.saveComponentState(e);
                    }
                });
            }
        }

        // 执行断开链接操作 | Execute break link operation
        this.prefabService.breakPrefabLink(this.entity);
    }

    undo(): void {
        // 恢复所有被移除的组件 | Restore all removed components
        const scene = Core.scene;
        if (!scene) return;

        for (const state of this.removedStates) {
            const entity = scene.findEntityById(state.entityId);
            if (!entity) continue;

            // 创建并恢复组件 | Create and restore component
            const comp = new PrefabInstanceComponent(
                state.sourcePrefabGuid,
                state.sourcePrefabPath,
                state.isRoot
            );
            comp.rootInstanceEntityId = state.rootInstanceEntityId;
            comp.modifiedProperties = state.modifiedProperties;
            comp.originalValues = state.originalValues;
            comp.instantiatedAt = state.instantiatedAt;

            entity.addComponent(comp);
        }

        // 发布事件通知 UI 更新 | Publish event to notify UI update
        this.messageHub.publish('prefab:link:restored', {
            entityId: this.entity.id
        });
    }

    getDescription(): string {
        const state = this.removedStates.find(s => s.entityId === this.entity.id);
        const prefabName = state?.sourcePrefabPath?.split(/[/\\]/).pop()?.replace('.prefab', '') || 'Prefab';
        return `断开预制体链接: ${prefabName}`;
    }

    /**
     * 保存实体的预制体实例组件状态
     * Save entity's prefab instance component state
     */
    private saveComponentState(entity: Entity): void {
        const comp = entity.getComponent(PrefabInstanceComponent);
        if (!comp) return;

        this.removedStates.push({
            entityId: entity.id,
            sourcePrefabGuid: comp.sourcePrefabGuid,
            sourcePrefabPath: comp.sourcePrefabPath,
            isRoot: comp.isRoot,
            rootInstanceEntityId: comp.rootInstanceEntityId,
            modifiedProperties: [...comp.modifiedProperties],
            originalValues: { ...comp.originalValues },
            instantiatedAt: comp.instantiatedAt
        });
    }
}
