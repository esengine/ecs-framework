/**
 * Editor-Engine Sync Service
 * 编辑器-引擎同步服务
 *
 * Synchronizes editor entities to Rust engine for rendering.
 * 将编辑器实体同步到Rust引擎进行渲染。
 */

import { Entity, Component } from '@esengine/esengine';
import { MessageHub, EntityStoreService } from '@esengine/editor-core';
import { TransformComponent } from '@esengine/engine-core';
import { SpriteComponent, SpriteAnimatorComponent } from '@esengine/sprite';
import { EngineService } from './EngineService';

export class EditorEngineSync {
    private static instance: EditorEngineSync | null = null;

    private engineService: EngineService;
    private messageHub: MessageHub | null = null;
    private entityStore: EntityStoreService | null = null;

    // Track synced entities: editor entity id -> engine entity id
    private syncedEntities: Map<number, Entity> = new Map();

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
     * Note: Texture loading is now handled automatically by EngineRenderSystem
     * via Rust engine's path-based texture loading.
     * 注意：纹理加载现在由EngineRenderSystem通过Rust引擎的路径加载自动处理。
     */
    private syncEntity(entity: Entity): void {
        // Check if entity has sprite component
        const spriteComponent = entity.getComponent(SpriteComponent);
        if (!spriteComponent) {
            return;
        }

        // Preload animator textures and set first frame
        // 预加载动画纹理并设置第一帧
        const animator = entity.getComponent(SpriteAnimatorComponent);
        if (animator && animator.clips) {
            const bridge = this.engineService.getBridge();
            if (bridge) {
                for (const clip of animator.clips) {
                    for (const frame of clip.frames) {
                        if (frame.textureGuid) {
                            // Trigger texture loading
                            bridge.getOrLoadTextureByPath(frame.textureGuid);
                        }
                    }
                }

                // Set sprite texture to first frame (static preview in editor)
                // 设置精灵纹理为第一帧（编辑器中的静态预览）
                if (animator.clips && animator.clips.length > 0) {
                    const firstClip = animator.clips[0];
                    if (firstClip && firstClip.frames && firstClip.frames.length > 0) {
                        const firstFrame = firstClip.frames[0];
                        if (firstFrame && firstFrame.textureGuid && spriteComponent) {
                            spriteComponent.textureGuid = firstFrame.textureGuid;
                        }
                    }
                }
            }
        }

        // Track synced entity
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
        } else if (component instanceof SpriteAnimatorComponent) {
            this.updateAnimator(engineEntity, component, propertyName);
        }
    }

    /**
     * Update animator - preload textures and set initial frame.
     * 更新动画器 - 预加载纹理并设置初始帧。
     */
    private updateAnimator(entity: Entity, animator: SpriteAnimatorComponent, propertyName: string): void {
        // In editor mode, only preload textures and show first frame (no animation playback)
        // 编辑模式下只预加载纹理并显示第一帧（不播放动画）
        const bridge = this.engineService.getBridge();
        const sprite = entity.getComponent(SpriteComponent);

        if (bridge && animator.clips) {
            // Preload all frame textures
            for (const clip of animator.clips) {
                for (const frame of clip.frames) {
                    if (frame.textureGuid) {
                        bridge.getOrLoadTextureByPath(frame.textureGuid);
                    }
                }
            }

            // Set sprite texture to first frame if available (static preview in editor)
            // 设置精灵纹理为第一帧（编辑器中的静态预览）
            if (sprite && animator.clips && animator.clips.length > 0) {
                const firstClip = animator.clips[0];
                if (firstClip && firstClip.frames && firstClip.frames.length > 0) {
                    const firstFrame = firstClip.frames[0];
                    if (firstFrame && firstFrame.textureGuid) {
                        sprite.textureGuid = firstFrame.textureGuid;
                    }
                }
            }
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
     *
     * Note: Texture loading is now handled automatically by EngineRenderSystem.
     * 注意：纹理加载现在由EngineRenderSystem自动处理。
     */
    private updateSprite(entity: Entity, sprite: SpriteComponent, property: string, value: any): void {
        // No manual texture loading needed - EngineRenderSystem handles it
        // 不需要手动加载纹理 - EngineRenderSystem会处理
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

        this.initialized = false;
    }
}

export default EditorEngineSync;
