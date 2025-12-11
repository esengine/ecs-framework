/**
 * 应用预制体命令
 * Apply prefab command
 *
 * 将预制体实例的修改应用到源预制体文件。
 * Applies modifications from a prefab instance to the source prefab file.
 */

import { Entity, PrefabInstanceComponent } from '@esengine/ecs-framework';
import type { MessageHub, PrefabService } from '@esengine/editor-core';
import { BaseCommand } from '../BaseCommand';

/**
 * 应用预制体命令
 * Apply prefab command
 */
export class ApplyPrefabCommand extends BaseCommand {
    private previousModifiedProperties: string[] = [];
    private previousOriginalValues: Record<string, unknown> = {};
    private success: boolean = false;

    constructor(
        private prefabService: PrefabService,
        private messageHub: MessageHub,
        private entity: Entity
    ) {
        super();
    }

    async execute(): Promise<void> {
        // 保存当前状态用于撤销 | Save current state for undo
        const comp = this.entity.getComponent(PrefabInstanceComponent);
        if (comp) {
            this.previousModifiedProperties = [...comp.modifiedProperties];
            this.previousOriginalValues = { ...comp.originalValues };
        }

        // 执行应用操作 | Execute apply operation
        this.success = await this.prefabService.applyToPrefab(this.entity);

        if (!this.success) {
            throw new Error('Failed to apply changes to prefab');
        }
    }

    undo(): void {
        // 恢复修改状态 | Restore modification state
        const comp = this.entity.getComponent(PrefabInstanceComponent);
        if (comp) {
            comp.modifiedProperties = this.previousModifiedProperties;
            comp.originalValues = this.previousOriginalValues;
        }

        // 发布事件通知 UI 更新 | Publish event to notify UI update
        this.messageHub.publish('component:property:changed', {
            entityId: this.entity.id
        });
    }

    getDescription(): string {
        const comp = this.entity.getComponent(PrefabInstanceComponent);
        const prefabName = comp?.sourcePrefabPath?.split(/[/\\]/).pop()?.replace('.prefab', '') || 'Prefab';
        return `应用修改到预制体: ${prefabName}`;
    }
}
