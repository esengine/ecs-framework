/**
 * 还原预制体实例命令
 * Revert prefab instance command
 *
 * 将预制体实例还原为源预制体的状态。
 * Reverts a prefab instance to the state of the source prefab.
 */

import { Entity, PrefabInstanceComponent } from '@esengine/ecs-framework';
import type { MessageHub, PrefabService } from '@esengine/editor-core';
import { BaseCommand } from '../BaseCommand';

/**
 * 组件快照
 * Component snapshot
 */
interface ComponentSnapshot {
    typeName: string;
    data: Record<string, unknown>;
}

/**
 * 还原预制体实例命令
 * Revert prefab instance command
 */
export class RevertPrefabCommand extends BaseCommand {
    private previousSnapshots: ComponentSnapshot[] = [];
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

            // 保存所有修改的属性当前值 | Save current values of all modified properties
            this.previousSnapshots = [];
            for (const key of comp.modifiedProperties) {
                const [componentType, ...pathParts] = key.split('.');
                const propertyPath = pathParts.join('.');

                for (const compInstance of this.entity.components) {
                    const typeName = (compInstance.constructor as any).__componentTypeName || compInstance.constructor.name;
                    if (typeName === componentType) {
                        const value = this.getNestedValue(compInstance, propertyPath);
                        this.previousSnapshots.push({
                            typeName: key,
                            data: { value: this.deepClone(value) }
                        });
                        break;
                    }
                }
            }
        }

        // 执行还原操作 | Execute revert operation
        this.success = await this.prefabService.revertInstance(this.entity);

        if (!this.success) {
            throw new Error('Failed to revert prefab instance');
        }
    }

    undo(): void {
        // 恢复修改的属性值 | Restore modified property values
        for (const snapshot of this.previousSnapshots) {
            const [componentType, ...pathParts] = snapshot.typeName.split('.');
            const propertyPath = pathParts.join('.');

            for (const compInstance of this.entity.components) {
                const typeName = (compInstance.constructor as any).__componentTypeName || compInstance.constructor.name;
                if (typeName === componentType) {
                    this.setNestedValue(compInstance, propertyPath, snapshot.data.value);
                    break;
                }
            }
        }

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
        return `还原预制体实例: ${prefabName}`;
    }

    /**
     * 获取嵌套属性值
     * Get nested property value
     */
    private getNestedValue(obj: any, path: string): unknown {
        const parts = path.split('.');
        let current = obj;
        for (const part of parts) {
            if (current === null || current === undefined) return undefined;
            current = current[part];
        }
        return current;
    }

    /**
     * 设置嵌套属性值
     * Set nested property value
     */
    private setNestedValue(obj: any, path: string, value: unknown): void {
        const parts = path.split('.');
        let current = obj;
        for (let i = 0; i < parts.length - 1; i++) {
            const key = parts[i]!;
            if (current[key] === null || current[key] === undefined) {
                current[key] = {};
            }
            current = current[key];
        }
        current[parts[parts.length - 1]!] = value;
    }

    /**
     * 深拷贝值
     * Deep clone value
     */
    private deepClone(value: unknown): unknown {
        if (value === null || value === undefined) return value;
        if (typeof value === 'object') {
            try {
                return JSON.parse(JSON.stringify(value));
            } catch {
                return value;
            }
        }
        return value;
    }
}
