/**
 * 实例化预制体命令
 * Instantiate prefab command
 *
 * 从预制体资产创建实体实例。
 * Creates an entity instance from a prefab asset.
 */

import { Core, Entity, HierarchySystem, PrefabSerializer, ComponentRegistry } from '@esengine/ecs-framework';
import type { EntityStoreService, MessageHub } from '@esengine/editor-core';
import type { PrefabData, ComponentType } from '@esengine/ecs-framework';
import { BaseCommand } from '../BaseCommand';

/**
 * 实例化预制体命令选项
 * Instantiate prefab command options
 */
export interface InstantiatePrefabOptions {
    /** 父实体 | Parent entity */
    parent?: Entity;
    /** 实例名称（可选，默认使用预制体名称） | Instance name (optional, defaults to prefab name) */
    name?: string;
    /** 位置覆盖 | Position override */
    position?: { x: number; y: number };
    /** 是否追踪为预制体实例 | Whether to track as prefab instance */
    trackInstance?: boolean;
}

/**
 * 实例化预制体命令
 * Instantiate prefab command
 */
export class InstantiatePrefabCommand extends BaseCommand {
    private createdEntity: Entity | null = null;
    private createdEntityIds: number[] = [];

    constructor(
        private entityStore: EntityStoreService,
        private messageHub: MessageHub,
        private prefabData: PrefabData,
        private options: InstantiatePrefabOptions = {}
    ) {
        super();
    }

    execute(): void {
        const scene = Core.scene;
        if (!scene) {
            throw new Error('场景未初始化 | Scene not initialized');
        }

        // 获取组件注册表 | Get component registry
        // ComponentRegistry.getAllComponentNames() returns Map<string, Function>
        // We need to cast it to Map<string, ComponentType>
        const componentRegistry = ComponentRegistry.getAllComponentNames() as Map<string, ComponentType>;

        // 实例化预制体 | Instantiate prefab
        this.createdEntity = PrefabSerializer.instantiate(
            this.prefabData,
            scene,
            componentRegistry,
            {
                parentId: this.options.parent?.id,
                name: this.options.name,
                position: this.options.position,
                trackInstance: this.options.trackInstance ?? true
            }
        );

        // 收集所有创建的实体 ID（用于撤销） | Collect all created entity IDs (for undo)
        this.collectEntityIds(this.createdEntity);

        // 更新 EntityStore | Update EntityStore
        this.entityStore.syncFromScene();

        // 选中创建的实体 | Select created entity
        this.entityStore.selectEntity(this.createdEntity);

        // 发布事件 | Publish event
        this.messageHub.publish('entity:added', { entity: this.createdEntity });
        this.messageHub.publish('prefab:instantiated', {
            entity: this.createdEntity,
            prefabName: this.prefabData.metadata.name,
            prefabGuid: this.prefabData.metadata.guid
        });
    }

    undo(): void {
        if (!this.createdEntity) return;

        const scene = Core.scene;
        if (!scene) return;

        // 移除所有创建的实体 | Remove all created entities
        for (const entityId of this.createdEntityIds) {
            const entity = scene.findEntityById(entityId);
            if (entity) {
                scene.entities.remove(entity);
            }
        }

        // 更新 EntityStore | Update EntityStore
        this.entityStore.syncFromScene();

        // 发布事件 | Publish event
        this.messageHub.publish('entity:removed', { entityId: this.createdEntity.id });

        this.createdEntity = null;
        this.createdEntityIds = [];
    }

    getDescription(): string {
        const name = this.options.name || this.prefabData.metadata.name;
        return `实例化预制体: ${name}`;
    }

    /**
     * 获取创建的根实体
     * Get created root entity
     */
    getCreatedEntity(): Entity | null {
        return this.createdEntity;
    }

    /**
     * 递归收集实体 ID
     * Recursively collect entity IDs
     */
    private collectEntityIds(entity: Entity): void {
        this.createdEntityIds.push(entity.id);

        const scene = Core.scene;
        if (!scene) return;

        const hierarchySystem = scene.getSystem(HierarchySystem);
        if (hierarchySystem) {
            const children = hierarchySystem.getChildren(entity);
            for (const child of children) {
                this.collectEntityIds(child);
            }
        }
    }
}
