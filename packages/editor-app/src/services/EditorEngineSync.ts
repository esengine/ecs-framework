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
    private loadedTextures: Map<string, number> = new Map();
    private textureIdCounter = 1;

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
    private syncEntity(entity: Entity): void {
        // Check if entity has sprite component
        const spriteComponent = entity.getComponent(SpriteComponent);
        if (!spriteComponent) {
            return;
        }

        // Load texture if needed and set textureId on the sprite component
        // Use === 0 to explicitly check for unset textureId (since 0 is falsy)
        if (spriteComponent.texture && spriteComponent.textureId === 0) {
            const textureId = this.getOrLoadTexture(spriteComponent.texture);
            spriteComponent.textureId = textureId;
            console.log(`Set textureId ${textureId} on sprite for entity ${entity.name} | 为实体 ${entity.name} 的精灵设置纹理ID ${textureId}`);
        } else if (spriteComponent.texture && spriteComponent.textureId !== 0) {
            // Texture already has ID, but might be a different texture path - check if we need to update
            const existingId = this.loadedTextures.get(spriteComponent.texture);
            if (existingId === undefined) {
                // New texture path, need to load it
                const textureId = this.getOrLoadTexture(spriteComponent.texture);
                spriteComponent.textureId = textureId;
                console.log(`Updated textureId ${textureId} on sprite for entity ${entity.name} | 为实体 ${entity.name} 的精灵更新纹理ID ${textureId}`);
            }
        }

        // Track synced entity (no need to create duplicate)
        this.syncedEntities.set(entity.id, entity);
        console.log(`Synced entity ${entity.name} (texture: ${spriteComponent.texture}, textureId: ${spriteComponent.textureId}) | 已同步实体 ${entity.name}`);
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
        console.log(`Removed entity ${entity.name} from tracking | 已从跟踪中移除实体 ${entity.name}`);
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
    private updateSprite(entity: Entity, sprite: SpriteComponent, property: string, value: any): void {
        if (property === 'texture' && value) {
            const textureId = this.getOrLoadTexture(value);
            sprite.textureId = textureId;
            console.log(`Set textureId ${textureId} on sprite for entity ${entity.name} | 为实体 ${entity.name} 的精灵设置纹理ID ${textureId}`);
        }
    }

    /**
     * Get or load texture, returning texture ID.
     * 获取或加载纹理，返回纹理ID。
     */
    private getOrLoadTexture(texturePath: string): number {
        // Check if already loaded
        let textureId = this.loadedTextures.get(texturePath);
        if (textureId !== undefined) {
            return textureId;
        }

        // Assign new ID and load
        textureId = this.textureIdCounter++;
        this.loadedTextures.set(texturePath, textureId);

        // Convert relative path to URL if needed
        const textureUrl = this.resolveTexturePath(texturePath);
        this.engineService.loadTexture(textureId, textureUrl);

        console.log(`Loaded texture ${texturePath} with ID ${textureId} | 已加载纹理 ${texturePath}，ID: ${textureId}`);
        return textureId;
    }

    /**
     * Resolve texture path to URL.
     * 将纹理路径解析为URL。
     */
    private resolveTexturePath(path: string): string {
        // If it's already a URL, return as-is
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
            return path;
        }

        // Convert file path to Tauri asset URL
        // Tauri uses asset:// protocol to access local files
        // 将文件路径转换为Tauri资产URL
        // Tauri使用asset://协议访问本地文件

        // Use Tauri's convertFileSrc API
        // 使用Tauri的convertFileSrc API
        const assetUrl = convertFileSrc(path);
        console.log(`Converted path to asset URL: ${path} -> ${assetUrl}`);
        return assetUrl;
    }

    /**
     * Clear all synced entities from tracking.
     * 清除所有已同步实体的跟踪。
     */
    private clearAllFromEngine(): void {
        // Just clear tracking, entity destruction is handled elsewhere
        this.syncedEntities.clear();
        console.log('Cleared all entities from tracking | 已清除所有实体跟踪');
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
