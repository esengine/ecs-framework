/**
 * Preview Scene Service
 * 预览场景服务
 *
 * Manages isolated preview scenes for editor tools (tilemap editor, material preview, etc.)
 * 管理编辑器工具的隔离预览场景（瓦片地图编辑器、材质预览等）
 */

import { Scene, EntitySystem, Entity } from '@esengine/ecs-framework';

/**
 * Configuration for creating a preview scene
 * 创建预览场景的配置
 */
export interface PreviewSceneConfig {
    /** Unique identifier for the preview scene | 预览场景的唯一标识符 */
    id: string;
    /** Scene name | 场景名称 */
    name?: string;
    /** Systems to add to the scene | 要添加到场景的系统 */
    systems?: EntitySystem[];
    /** Initial clear color | 初始清除颜色 */
    clearColor?: { r: number; g: number; b: number; a: number };
}

/**
 * Represents an isolated preview scene for editor tools
 * 表示编辑器工具的隔离预览场景
 */
export interface IPreviewScene {
    /** Scene instance | 场景实例 */
    readonly scene: Scene;
    /** Unique identifier | 唯一标识符 */
    readonly id: string;
    /** Scene name | 场景名称 */
    readonly name: string;
    /** Clear color | 清除颜色 */
    clearColor: { r: number; g: number; b: number; a: number };

    /**
     * Create a temporary entity (auto-cleaned on dispose)
     * 创建临时实体（dispose 时自动清理）
     */
    createEntity(name: string): Entity;

    /**
     * Remove a temporary entity
     * 移除临时实体
     */
    removeEntity(entity: Entity): void;

    /**
     * Get all entities in the scene
     * 获取场景中的所有实体
     */
    getEntities(): readonly Entity[];

    /**
     * Clear all temporary entities
     * 清除所有临时实体
     */
    clearEntities(): void;

    /**
     * Add a system to the scene
     * 向场景添加系统
     */
    addSystem(system: EntitySystem): void;

    /**
     * Remove a system from the scene
     * 从场景移除系统
     */
    removeSystem(system: EntitySystem): void;

    /**
     * Update the scene (process systems)
     * 更新场景（处理系统）
     */
    update(deltaTime: number): void;

    /**
     * Dispose the preview scene
     * 释放预览场景
     */
    dispose(): void;
}

/**
 * Preview scene implementation
 * 预览场景实现
 */
class PreviewScene implements IPreviewScene {
    readonly scene: Scene;
    readonly id: string;
    readonly name: string;
    clearColor: { r: number; g: number; b: number; a: number };

    private _entities: Set<Entity> = new Set();
    private _disposed = false;

    constructor(config: PreviewSceneConfig) {
        this.id = config.id;
        this.name = config.name ?? `PreviewScene_${config.id}`;
        this.clearColor = config.clearColor ?? { r: 0.1, g: 0.1, b: 0.12, a: 1.0 };

        // Create isolated scene
        this.scene = new Scene({ name: this.name });

        // Add configured systems
        if (config.systems) {
            for (const system of config.systems) {
                this.scene.addSystem(system);
            }
        }
    }

    createEntity(name: string): Entity {
        if (this._disposed) {
            throw new Error(`PreviewScene ${this.id} is disposed`);
        }

        const entity = this.scene.createEntity(name);
        this._entities.add(entity);
        return entity;
    }

    removeEntity(entity: Entity): void {
        if (this._disposed) return;

        if (this._entities.has(entity)) {
            this._entities.delete(entity);
            this.scene.destroyEntities([entity]);
        }
    }

    getEntities(): readonly Entity[] {
        return Array.from(this._entities);
    }

    clearEntities(): void {
        if (this._disposed) return;

        const entities = Array.from(this._entities);
        if (entities.length > 0) {
            this.scene.destroyEntities(entities);
        }
        this._entities.clear();
    }

    addSystem(system: EntitySystem): void {
        if (this._disposed) return;
        this.scene.addSystem(system);
    }

    removeSystem(system: EntitySystem): void {
        if (this._disposed) return;
        this.scene.removeSystem(system);
    }

    update(_deltaTime: number): void {
        if (this._disposed) return;
        this.scene.update();
    }

    dispose(): void {
        if (this._disposed) return;
        this._disposed = true;

        // Clear all entities
        this.clearEntities();

        // Scene cleanup is handled by GC
    }
}

/**
 * Preview Scene Service - manages all preview scenes
 * 预览场景服务 - 管理所有预览场景
 */
export class PreviewSceneService {
    private static _instance: PreviewSceneService | null = null;
    private _scenes: Map<string, PreviewScene> = new Map();

    private constructor() {}

    /**
     * Get singleton instance
     * 获取单例实例
     */
    static getInstance(): PreviewSceneService {
        if (!PreviewSceneService._instance) {
            PreviewSceneService._instance = new PreviewSceneService();
        }
        return PreviewSceneService._instance;
    }

    /**
     * Create a new preview scene
     * 创建新的预览场景
     */
    createScene(config: PreviewSceneConfig): IPreviewScene {
        if (this._scenes.has(config.id)) {
            throw new Error(`Preview scene with id "${config.id}" already exists`);
        }

        const scene = new PreviewScene(config);
        this._scenes.set(config.id, scene);
        return scene;
    }

    /**
     * Get a preview scene by ID
     * 通过 ID 获取预览场景
     */
    getScene(id: string): IPreviewScene | null {
        return this._scenes.get(id) ?? null;
    }

    /**
     * Check if a preview scene exists
     * 检查预览场景是否存在
     */
    hasScene(id: string): boolean {
        return this._scenes.has(id);
    }

    /**
     * Dispose a preview scene
     * 释放预览场景
     */
    disposeScene(id: string): void {
        const scene = this._scenes.get(id);
        if (scene) {
            scene.dispose();
            this._scenes.delete(id);
        }
    }

    /**
     * Get all preview scene IDs
     * 获取所有预览场景 ID
     */
    getSceneIds(): string[] {
        return Array.from(this._scenes.keys());
    }

    /**
     * Dispose all preview scenes
     * 释放所有预览场景
     */
    disposeAll(): void {
        for (const scene of this._scenes.values()) {
            scene.dispose();
        }
        this._scenes.clear();
    }

    /**
     * Dispose the service
     * 释放服务
     */
    dispose(): void {
        this.disposeAll();
    }
}

/**
 * Service identifier for dependency injection
 * 依赖注入的服务标识符
 */
export const IPreviewSceneService = Symbol.for('IPreviewSceneService');
