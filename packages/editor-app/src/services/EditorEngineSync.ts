/**
 * Editor-Engine Sync Service
 * 编辑器-引擎同步服务
 *
 * Synchronizes editor entities to Rust engine for rendering.
 * 将编辑器实体同步到Rust引擎进行渲染。
 */

import { Entity, Component } from '@esengine/ecs-framework';
import { MessageHub, EntityStoreService } from '@esengine/editor-core';
import { TransformComponent, SpriteComponent } from '@esengine/ecs-components';
import { AssetReference } from '@esengine/asset-system';
import { EngineService } from './EngineService';
import { convertFileSrc } from '@tauri-apps/api/core';

export class EditorEngineSync {
    private static instance: EditorEngineSync | null = null;

    private engineService: EngineService;
    private messageHub: MessageHub | null = null;
    private entityStore: EntityStoreService | null = null;

    // Track synced entities: editor entity id -> engine entity id
    private syncedEntities: Map<number, Entity> = new Map();

    // Track loaded textures
    // 跟踪已加载的纹理
    private loadedTextures: Map<string, number> = new Map();

    // Subscription IDs
    private subscriptions: Array<() => void> = [];

    private initialized = false;

    private constructor() {
        this.engineService = EngineService.getInstance();
    }

    /**
     * Get singleton instance.
     * 获取单例实例。
     */
    static getInstance(): EditorEngineSync {
        if (!EditorEngineSync.instance) {
            EditorEngineSync.instance = new EditorEngineSync();
        }
        return EditorEngineSync.instance;
    }

    /**
     * Initialize sync service.
     * 初始化同步服务。
     */
    initialize(messageHub: MessageHub, entityStore: EntityStoreService): void {
        if (this.initialized) {
            return;
        }

        this.messageHub = messageHub;
        this.entityStore = entityStore;

        // Subscribe to entity events
        this.subscribeToEvents();

        // Sync existing entities
        this.syncAllEntities();

        this.initialized = true;
    }

    /**
     * Subscribe to MessageHub events.
     * 订阅MessageHub事件。
     */
    private subscribeToEvents(): void {
        if (!this.messageHub) return;

        // Entity added
        const unsubAdd = this.messageHub.subscribe('entity:added', (data: { entity: Entity }) => {
            this.syncEntity(data.entity);
        });
        this.subscriptions.push(unsubAdd);

        // Entity removed
        const unsubRemove = this.messageHub.subscribe('entity:removed', (data: { entity: Entity }) => {
            this.removeEntityFromEngine(data.entity);
        });
        this.subscriptions.push(unsubRemove);

        // Component property changed - need to re-sync entity
        const unsubComponent = this.messageHub.subscribe('component:property:changed', (data: { entity: Entity; component: Component; propertyName: string; value: any }) => {
            this.updateEntityInEngine(data.entity, data.component, data.propertyName, data.value);
        });
        this.subscriptions.push(unsubComponent);

        // Component added - sync entity if it has sprite
        const unsubComponentAdded = this.messageHub.subscribe('component:added', (data: { entity: Entity; component: Component }) => {
            this.syncEntity(data.entity);
        });
        this.subscriptions.push(unsubComponentAdded);

        // Entities cleared
        const unsubClear = this.messageHub.subscribe('entities:cleared', () => {
            this.clearAllFromEngine();
        });
        this.subscriptions.push(unsubClear);

        // Entity selected - update gizmo display
        const unsubSelected = this.messageHub.subscribe('entity:selected', (data: { entity: Entity | null }) => {
            this.updateSelectedEntity(data.entity);
        });
        this.subscriptions.push(unsubSelected);
    }

    /**
     * Update selected entity for gizmo display.
     * 更新选中的实体用于Gizmo显示。
     */
    private updateSelectedEntity(entity: Entity | null): void {
        if (entity) {
            this.engineService.setSelectedEntityIds([entity.id]);
        } else {
            this.engineService.setSelectedEntityIds([]);
        }
    }

    /**
     * Sync all existing entities.
     * 同步所有现有实体。
     */
    private syncAllEntities(): void {
        if (!this.entityStore) return;

        const entities = this.entityStore.getAllEntities();
        for (const entity of entities) {
            this.syncEntity(entity);
        }
    }

    /**
     * Sync a single entity to engine.
     * 将单个实体同步到引擎。
     *
     * Note: Entity is already in Core.scene, we just need to load textures.
     * 注意：实体已经在Core.scene中，我们只需要加载纹理。
     */
    private async syncEntity(entity: Entity): Promise<void> {
        // Check if entity has sprite component
        const spriteComponent = entity.getComponent(SpriteComponent);
        if (!spriteComponent) {
            return;
        }

        // Load texture if needed and set textureId on the sprite component
        // 如果需要，加载纹理并设置精灵组件的textureId
        if (spriteComponent.texture && spriteComponent.textureId === 0) {
            try {
                const textureId = await this.getOrLoadTexture(spriteComponent.texture);
                spriteComponent.textureId = textureId;
            } catch (error) {
                console.error(`Failed to load texture for entity ${entity.id}:`, error);
            }
        } else if (spriteComponent.texture && spriteComponent.textureId !== 0) {
            // Texture already has ID, but might be a different texture path
            // 纹理已有ID，但可能是不同的纹理路径
            const existingId = this.loadedTextures.get(spriteComponent.texture);
            if (existingId === undefined) {
                // New texture path, need to load it
                // 新纹理路径，需要加载
                try {
                    const textureId = await this.getOrLoadTexture(spriteComponent.texture);
                    spriteComponent.textureId = textureId;
                } catch (error) {
                    console.error(`Failed to load texture for entity ${entity.id}:`, error);
                }
            }
        }

        // Track synced entity (no need to create duplicate)
        this.syncedEntities.set(entity.id, entity);
    }

    /**
     * Remove entity from tracking.
     * 从跟踪中移除实体。
     */
    private removeEntityFromEngine(entity: Entity): void {
        if (!entity) {
            return;
        }
        // Just remove from tracking, entity destruction is handled by the command
        this.syncedEntities.delete(entity.id);
    }

    /**
     * Update entity in engine when component changes.
     * 当组件变化时更新引擎中的实体。
     */
    private updateEntityInEngine(entity: Entity, component: Component, propertyName: string, value: any): void {
        const engineEntity = this.syncedEntities.get(entity.id);
        if (!engineEntity) {
            // Entity not synced yet, try to sync it
            this.syncEntity(entity);
            return;
        }

        // Update based on component type
        if (component instanceof TransformComponent) {
            this.updateTransform(engineEntity, component);
        } else if (component instanceof SpriteComponent) {
            this.updateSprite(engineEntity, component, propertyName, value);
        }
    }

    /**
     * Update transform in engine entity.
     * 更新引擎实体的变换。
     */
    private updateTransform(engineEntity: Entity, transform: TransformComponent): void {
        // Get engine transform component (same type as editor)
        const engineTransform = engineEntity.getComponent(TransformComponent);
        if (engineTransform) {
            engineTransform.position = {
                x: transform.position?.x ?? 0,
                y: transform.position?.y ?? 0,
                z: transform.position?.z ?? 0
            };
            engineTransform.rotation = {
                x: transform.rotation?.x ?? 0,
                y: transform.rotation?.y ?? 0,
                z: transform.rotation?.z ?? 0
            };
            engineTransform.scale = {
                x: transform.scale?.x ?? 1,
                y: transform.scale?.y ?? 1,
                z: transform.scale?.z ?? 1
            };
        }
    }

    /**
     * Update sprite in engine entity.
     * 更新引擎实体的精灵。
     */
    private async updateSprite(entity: Entity, sprite: SpriteComponent, property: string, value: any): Promise<void> {
        if (property === 'texture') {
            if (value) {
                try {
                    const textureId = await this.getOrLoadTexture(value);
                    sprite.textureId = textureId;
                } catch (error) {
                    console.error(`Failed to update texture for entity ${entity.id}:`, error);
                    sprite.textureId = 0; // Fallback to default texture
                }
            } else {
                // Texture cleared, reset to default (white texture)
                // 纹理清除，重置为默认值（白色纹理）
                sprite.textureId = 0;
            }
        }
    }

    /**
     * Get or load texture, returning texture ID.
     * 获取或加载纹理，返回纹理ID。
     */
    private async getOrLoadTexture(texturePath: string): Promise<number> {
        // Check if already loaded in cache
        // 检查缓存中是否已加载
        let textureId = this.loadedTextures.get(texturePath);
        if (textureId !== undefined) {
            return textureId;
        }

        // Get asset system components
        // 获取资产系统组件
        const engineIntegration = this.engineService.getEngineIntegration();
        if (!engineIntegration) {
            throw new Error('Asset system not initialized | 资产系统未初始化');
        }

        try {
            // Convert path to proper URL format for asset system
            // 为资产系统转换路径为正确的URL格式
            const resolvedPath = this.resolveTexturePath(texturePath);

            // Load through asset system with caching and memory management
            // 通过资产系统加载，支持缓存和内存管理
            textureId = await engineIntegration.loadTextureForComponent(resolvedPath);

            // Cache the mapping for quick lookup
            // 缓存映射以便快速查找
            this.loadedTextures.set(texturePath, textureId);

            return textureId;
        } catch (error) {
            console.error(`Failed to load texture: ${texturePath}`, error);
            throw error;
        }
    }

    /**
     * Resolve texture path to URL.
     * 将纹理路径解析为URL。
     */
    private resolveTexturePath(path: string): string {
        // If it's already a URL (including asset://), return as-is
        // 如果已经是URL（包括asset://），直接返回
        if (path.startsWith('http://') ||
            path.startsWith('https://') ||
            path.startsWith('data:') ||
            path.startsWith('asset://')) {
            return path;
        }

        // Convert file path to Tauri asset URL
        // 将文件路径转换为Tauri资产URL
        const assetUrl = convertFileSrc(path);
        return assetUrl;
    }

    /**
     * Clear all synced entities from tracking.
     * 清除所有已同步实体的跟踪。
     */
    private clearAllFromEngine(): void {
        // Just clear tracking, entity destruction is handled elsewhere
        this.syncedEntities.clear();
    }

    /**
     * Check if initialized.
     * 检查是否已初始化。
     */
    isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Get synced entity count.
     * 获取已同步实体数量。
     */
    getSyncedCount(): number {
        return this.syncedEntities.size;
    }

    /**
     * Dispose sync service.
     * 释放同步服务。
     */
    dispose(): void {
        // Unsubscribe from all events
        for (const unsub of this.subscriptions) {
            unsub();
        }
        this.subscriptions = [];

        // Clear synced entities
        this.syncedEntities.clear();
        this.loadedTextures.clear();

        this.initialized = false;
    }
}

export default EditorEngineSync;
