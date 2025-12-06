/**
 * 场景资源管理器 - 集中式场景资源加载
 * SceneResourceManager - Centralized resource loading for scenes
 *
 * 扫描场景中所有组件，收集资源引用，批量加载资源，并将运行时 ID 分配回组件
 * Scans all components in a scene, collects resource references, batch-loads them, and assigns runtime IDs back to components
 */

import type { Scene } from '@esengine/ecs-framework';
import { isResourceComponent, type ResourceReference } from '../interfaces/IResourceComponent';

/**
 * 资源加载器接口
 * Resource loader interface
 */
export interface IResourceLoader {
    /**
     * 批量加载资源并返回路径到 ID 的映射
     * Load a batch of resources and return path-to-ID mapping
     * @param paths 资源路径数组 / Array of resource paths
     * @param type 资源类型 / Resource type
     * @returns 路径到运行时 ID 的映射 / Map of paths to runtime IDs
     */
    loadResourcesBatch(paths: string[], type: ResourceReference['type']): Promise<Map<string, number>>;

    /**
     * 卸载纹理资源（可选）
     * Unload texture resource (optional)
     */
    unloadTexture?(textureId: number): void;

    /**
     * 卸载音频资源（可选）
     * Unload audio resource (optional)
     */
    unloadAudio?(audioId: number): void;

    /**
     * 卸载数据资源（可选）
     * Unload data resource (optional)
     */
    unloadData?(dataId: number): void;
}

/**
 * 资源引用计数条目
 * Resource reference count entry
 */
interface ResourceRefCountEntry {
    /** 资源路径 / Resource path */
    path: string;
    /** 资源类型 / Resource type */
    type: ResourceReference['type'];
    /** 运行时 ID / Runtime ID */
    runtimeId: number;
    /** 使用此资源的场景名称集合 / Set of scene names using this resource */
    sceneNames: Set<string>;
}

export class SceneResourceManager {
    private resourceLoader: IResourceLoader | null = null;

    /**
     * 资源引用计数表
     * Resource reference count table
     *
     * Key: resource path, Value: reference count entry
     */
    private _resourceRefCounts = new Map<string, ResourceRefCountEntry>();

    /**
     * 场景到其使用的资源路径的映射
     * Map of scene name to resource paths used by that scene
     */
    private _sceneResources = new Map<string, Set<string>>();

    /**
     * 设置资源加载器实现
     * Set the resource loader implementation
     *
     * 应由引擎集成层调用
     * This should be called by the engine integration layer
     *
     * @param loader 资源加载器实例 / Resource loader instance
     */
    setResourceLoader(loader: IResourceLoader): void {
        this.resourceLoader = loader;
    }

    /**
     * 加载场景所需的所有资源
     * Load all resources required by a scene
     *
     * 流程 / Process:
     * 1. 扫描所有实体并从 IResourceComponent 实现中收集资源引用
     *    Scan all entities and collect resource references from IResourceComponent implementations
     * 2. 按类型分组资源（纹理、音频等）
     *    Group resources by type (texture, audio, etc.)
     * 3. 批量加载每种资源类型
     *    Batch load each resource type
     * 4. 将运行时 ID 分配回组件
     *    Assign runtime IDs back to components
     * 5. 更新引用计数
     *    Update reference counts
     *
     * @param scene 要加载资源的场景 / The scene to load resources for
     * @returns 当所有资源加载完成时解析的 Promise / Promise that resolves when all resources are loaded
     */
    async loadSceneResources(scene: Scene): Promise<void> {
        if (!this.resourceLoader) {
            console.warn('[SceneResourceManager] No resource loader set, skipping resource loading');
            return;
        }

        const sceneName = scene.name;

        // 从组件收集所有资源引用 / Collect all resource references from components
        const resourceRefs = this.collectResourceReferences(scene);

        if (resourceRefs.length === 0) {
            return;
        }

        // 按资源类型分组 / Group by resource type
        const resourcesByType = new Map<ResourceReference['type'], Set<string>>();
        for (const ref of resourceRefs) {
            if (!resourcesByType.has(ref.type)) {
                resourcesByType.set(ref.type, new Set());
            }
            resourcesByType.get(ref.type)!.add(ref.path);
        }

        // 批量加载每种资源类型 / Load each resource type in batch
        const allResourceIds = new Map<string, number>();

        for (const [type, paths] of resourcesByType) {
            const pathsArray = Array.from(paths);

            try {
                const resourceIds = await this.resourceLoader.loadResourcesBatch(pathsArray, type);

                // 合并到总映射表 / Merge into combined map
                for (const [path, id] of resourceIds) {
                    allResourceIds.set(path, id);

                    // 更新引用计数 / Update reference count
                    this.addResourceReference(path, type, id, sceneName);
                }
            } catch (error) {
                console.error(`[SceneResourceManager] Failed to load ${type} resources:`, error);
            }
        }

        // 将资源 ID 分配回组件 / Assign resource IDs back to components
        this.assignResourceIds(scene, allResourceIds);

        // 记录场景使用的资源 / Record resources used by scene
        const scenePaths = new Set<string>();
        for (const ref of resourceRefs) {
            scenePaths.add(ref.path);
        }
        this._sceneResources.set(sceneName, scenePaths);
    }

    /**
     * 添加资源引用
     * Add resource reference
     */
    private addResourceReference(
        path: string,
        type: ResourceReference['type'],
        runtimeId: number,
        sceneName: string
    ): void {
        let entry = this._resourceRefCounts.get(path);
        if (!entry) {
            entry = {
                path,
                type,
                runtimeId,
                sceneNames: new Set()
            };
            this._resourceRefCounts.set(path, entry);
        }
        entry.sceneNames.add(sceneName);
    }

    /**
     * 移除资源引用
     * Remove resource reference
     *
     * @returns true 如果资源引用计数归零 / true if resource reference count reaches zero
     */
    private removeResourceReference(path: string, sceneName: string): boolean {
        const entry = this._resourceRefCounts.get(path);
        if (!entry) {
            return false;
        }

        entry.sceneNames.delete(sceneName);

        if (entry.sceneNames.size === 0) {
            this._resourceRefCounts.delete(path);
            return true;
        }

        return false;
    }

    /**
     * 从场景实体收集所有资源引用
     * Collect all resource references from scene entities
     */
    private collectResourceReferences(scene: Scene): ResourceReference[] {
        const refs: ResourceReference[] = [];

        for (const entity of scene.entities.buffer) {
            for (const component of entity.components) {
                if (isResourceComponent(component)) {
                    const componentRefs = component.getResourceReferences();
                    refs.push(...componentRefs);
                }
            }
        }

        return refs;
    }

    /**
     * 将已加载的资源 ID 分配回组件
     * Assign loaded resource IDs back to components
     *
     * @param scene 场景 / Scene
     * @param pathToId 路径到 ID 的映射 / Path to ID mapping
     */
    private assignResourceIds(scene: Scene, pathToId: Map<string, number>): void {
        for (const entity of scene.entities.buffer) {
            for (const component of entity.components) {
                if (isResourceComponent(component)) {
                    component.setResourceIds(pathToId);
                }
            }
        }
    }

    /**
     * 卸载场景使用的所有资源
     * Unload all resources used by a scene
     *
     * 在场景销毁时调用，只会卸载不再被其他场景引用的资源
     * Called when a scene is being destroyed, only unloads resources not referenced by other scenes
     *
     * @param scene 要卸载资源的场景 / The scene to unload resources for
     */
    async unloadSceneResources(scene: Scene): Promise<void> {
        const sceneName = scene.name;

        // 获取场景使用的资源路径 / Get resource paths used by scene
        const scenePaths = this._sceneResources.get(sceneName);
        if (!scenePaths) {
            return;
        }

        // 要卸载的资源 / Resources to unload
        const toUnload: ResourceRefCountEntry[] = [];

        // 移除引用并收集需要卸载的资源 / Remove references and collect resources to unload
        for (const path of scenePaths) {
            const entry = this._resourceRefCounts.get(path);
            if (entry) {
                const shouldUnload = this.removeResourceReference(path, sceneName);
                if (shouldUnload) {
                    toUnload.push(entry);
                }
            }
        }

        // 清理场景资源记录 / Clean up scene resource record
        this._sceneResources.delete(sceneName);

        // 卸载不再使用的资源 / Unload resources no longer in use
        if (this.resourceLoader && toUnload.length > 0) {
            for (const entry of toUnload) {
                this.unloadResource(entry);
            }
        }
    }

    /**
     * 卸载单个资源
     * Unload a single resource
     */
    private unloadResource(entry: ResourceRefCountEntry): void {
        if (!this.resourceLoader) return;

        switch (entry.type) {
            case 'texture':
                if (this.resourceLoader.unloadTexture) {
                    this.resourceLoader.unloadTexture(entry.runtimeId);
                }
                break;
            case 'audio':
                if (this.resourceLoader.unloadAudio) {
                    this.resourceLoader.unloadAudio(entry.runtimeId);
                }
                break;
            case 'data':
                if (this.resourceLoader.unloadData) {
                    this.resourceLoader.unloadData(entry.runtimeId);
                }
                break;
            case 'font':
                // 字体卸载暂未实现 / Font unloading not yet implemented
                break;
        }
    }

    /**
     * 获取资源统计信息
     * Get resource statistics
     */
    getStatistics(): {
        totalResources: number;
        trackedScenes: number;
        resourcesByType: Map<ResourceReference['type'], number>;
    } {
        const resourcesByType = new Map<ResourceReference['type'], number>();

        for (const entry of this._resourceRefCounts.values()) {
            const count = resourcesByType.get(entry.type) || 0;
            resourcesByType.set(entry.type, count + 1);
        }

        return {
            totalResources: this._resourceRefCounts.size,
            trackedScenes: this._sceneResources.size,
            resourcesByType
        };
    }

    /**
     * 获取资源的引用计数
     * Get reference count for a resource
     */
    getResourceRefCount(path: string): number {
        const entry = this._resourceRefCounts.get(path);
        return entry ? entry.sceneNames.size : 0;
    }

    /**
     * 清空所有跟踪数据
     * Clear all tracking data
     */
    clearAll(): void {
        this._resourceRefCounts.clear();
        this._sceneResources.clear();
    }
}
