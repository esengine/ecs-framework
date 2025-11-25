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
}

export class SceneResourceManager {
    private resourceLoader: IResourceLoader | null = null;

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
     *
     * @param scene 要加载资源的场景 / The scene to load resources for
     * @returns 当所有资源加载完成时解析的 Promise / Promise that resolves when all resources are loaded
     */
    async loadSceneResources(scene: Scene): Promise<void> {
        if (!this.resourceLoader) {
            console.warn('[SceneResourceManager] No resource loader set, skipping resource loading');
            return;
        }

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
                }
            } catch (error) {
                console.error(`[SceneResourceManager] Failed to load ${type} resources:`, error);
            }
        }

        // 将资源 ID 分配回组件 / Assign resource IDs back to components
        this.assignResourceIds(scene, allResourceIds);
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
     * 在场景销毁时调用
     * Called when a scene is being destroyed
     *
     * @param scene 要卸载资源的场景 / The scene to unload resources for
     */
    async unloadSceneResources(_scene: Scene): Promise<void> {
        // TODO: 实现资源卸载 / Implement resource unloading
        // 需要跟踪资源引用计数，仅在不再使用时卸载
        // Need to track resource reference counts and only unload when no longer used
        console.log('[SceneResourceManager] Scene resource unloading not yet implemented');
    }
}
