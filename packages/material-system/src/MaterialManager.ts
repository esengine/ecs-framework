/**
 * Material manager service.
 * 材质管理器服务。
 *
 * Manages materials and shaders for the rendering system.
 * 管理渲染系统的材质和着色器。
 */

import { Material } from './Material';
import {
    Shader,
    DEFAULT_VERTEX_SHADER,
    DEFAULT_FRAGMENT_SHADER,
    GRAYSCALE_FRAGMENT_SHADER,
    TINT_FRAGMENT_SHADER,
    FLASH_FRAGMENT_SHADER,
    OUTLINE_FRAGMENT_SHADER
} from './Shader';
import { BuiltInMaterials, BuiltInShaders, UniformType } from './types';
import type { IAssetManager } from '@esengine/asset-system';
import { AssetType } from '@esengine/asset-system';
import { MaterialLoader, type IMaterialAssetData } from './loaders/MaterialLoader';
import { ShaderLoader, type IShaderAssetData } from './loaders/ShaderLoader';
import { createLogger } from '@esengine/esengine';

/** Logger instance for MaterialManager. | MaterialManager的日志实例。 */
const logger = createLogger('MaterialManager');

/**
 * Engine bridge interface for communicating with Rust engine.
 * 与Rust引擎通信的引擎桥接接口。
 */
export interface IEngineBridge {
    compileShader(vertexSource: string, fragmentSource: string): Promise<number>;
    compileShaderWithId(shaderId: number, vertexSource: string, fragmentSource: string): Promise<void>;
    hasShader(shaderId: number): boolean;
    removeShader(shaderId: number): boolean;

    createMaterial(name: string, shaderId: number, blendMode: number): number;
    createMaterialWithId(materialId: number, name: string, shaderId: number, blendMode: number): void;
    hasMaterial(materialId: number): boolean;
    removeMaterial(materialId: number): boolean;

    setMaterialFloat(materialId: number, name: string, value: number): boolean;
    setMaterialVec2(materialId: number, name: string, x: number, y: number): boolean;
    setMaterialVec3(materialId: number, name: string, x: number, y: number, z: number): boolean;
    setMaterialVec4(materialId: number, name: string, x: number, y: number, z: number, w: number): boolean;
    setMaterialColor(materialId: number, name: string, r: number, g: number, b: number, a: number): boolean;
    setMaterialBlendMode(materialId: number, blendMode: number): boolean;
}

/**
 * Material manager service.
 * 材质管理器服务。
 *
 * Manages materials, shaders, and their GPU resources.
 * 管理材质、着色器及其GPU资源。
 */
export class MaterialManager {
    /** Registered shaders. | 已注册的着色器。 */
    private shaders: Map<number, Shader> = new Map();

    /** Shader name to ID mapping. | 着色器名称到ID的映射。 */
    private shaderNameToId: Map<string, number> = new Map();

    /** Registered materials. | 已注册的材质。 */
    private materials: Map<number, Material> = new Map();

    /** Material name to ID mapping. | 材质名称到ID的映射。 */
    private materialNameToId: Map<string, number> = new Map();

    /** Material path to ID mapping. | 材质路径到ID的映射。 */
    private materialPathToId: Map<string, number> = new Map();

    /** Shader path to ID mapping. | 着色器路径到ID的映射。 */
    private shaderPathToId: Map<string, number> = new Map();

    /** Pending material loads (path -> promise). | 等待加载的材质（路径 -> Promise）。 */
    private pendingMaterialLoads: Map<string, Promise<number>> = new Map();

    /** Pending shader loads (path -> promise). | 等待加载的着色器（路径 -> Promise）。 */
    private pendingShaderLoads: Map<string, Promise<number>> = new Map();

    /** Next shader ID for custom shaders. | 下一个自定义着色器ID。 */
    private nextShaderId: number = 100;

    /** Next material ID for custom materials. | 下一个自定义材质ID。 */
    private nextMaterialId: number = 100;

    /** Engine bridge for GPU operations. | 用于GPU操作的引擎桥接。 */
    private engineBridge: IEngineBridge | null = null;

    /** Asset manager for loading material files. | 用于加载材质文件的资产管理器。 */
    private assetManager: IAssetManager | null = null;

    constructor() {
        // Register built-in shaders and materials.
        // 注册内置着色器和材质。
        this.registerBuiltInAssets();
    }

    /**
     * Set the engine bridge for GPU operations.
     * 设置用于GPU操作的引擎桥接。
     *
     * @param bridge - Engine bridge instance. | 引擎桥接实例。
     */
    setEngineBridge(bridge: IEngineBridge): void {
        this.engineBridge = bridge;
    }

    /**
     * Set the asset manager for loading material files.
     * 设置用于加载材质文件的资产管理器。
     *
     * Also registers Material and Shader loaders with the asset manager.
     * 同时向资产管理器注册材质和着色器加载器。
     *
     * @param manager - Asset manager instance. | 资产管理器实例。
     */
    setAssetManager(manager: IAssetManager): void {
        this.assetManager = manager;

        // Register loaders with asset manager.
        // 向资产管理器注册加载器。
        if (manager.registerLoader) {
            manager.registerLoader(AssetType.Material, new MaterialLoader());
            manager.registerLoader(AssetType.Shader, new ShaderLoader());
            logger.info('Registered Material and Shader loaders');
        }
    }

    private registerBuiltInAssets(): void {
        // Built-in shaders
        const builtInShaders = [
            { id: BuiltInShaders.DefaultSprite, name: 'DefaultSprite', vertex: DEFAULT_VERTEX_SHADER, fragment: DEFAULT_FRAGMENT_SHADER },
            { id: BuiltInShaders.Grayscale, name: 'Grayscale', vertex: DEFAULT_VERTEX_SHADER, fragment: GRAYSCALE_FRAGMENT_SHADER },
            { id: BuiltInShaders.Tint, name: 'Tint', vertex: DEFAULT_VERTEX_SHADER, fragment: TINT_FRAGMENT_SHADER },
            { id: BuiltInShaders.Flash, name: 'Flash', vertex: DEFAULT_VERTEX_SHADER, fragment: FLASH_FRAGMENT_SHADER },
            { id: BuiltInShaders.Outline, name: 'Outline', vertex: DEFAULT_VERTEX_SHADER, fragment: OUTLINE_FRAGMENT_SHADER },
        ];

        for (const { id, name, vertex, fragment } of builtInShaders) {
            const shader = new Shader(name, vertex, fragment);
            shader.id = id;
            this.shaders.set(id, shader);
            this.shaderNameToId.set(name, id);
        }

        // Built-in materials
        const builtInMaterials = [
            { id: BuiltInMaterials.Default, material: Material.sprite() },
            { id: BuiltInMaterials.Additive, material: Material.additive() },
            { id: BuiltInMaterials.Multiply, material: Material.multiply() },
            { id: BuiltInMaterials.Unlit, material: Material.unlit() },
        ];

        for (const { id, material } of builtInMaterials) {
            material.id = id;
            this.materials.set(id, material);
            this.materialNameToId.set(material.name, id);
        }
    }

    // ============= Shader Management =============
    // ============= 着色器管理 =============

    /**
     * Register a shader.
     * 注册着色器。
     *
     * # Arguments | 参数
     * * `shader` - Shader instance to register. | 要注册的着色器实例。
     *
     * # Returns | 返回
     * Shader ID for referencing this shader. | 用于引用此着色器的ID。
     */
    async registerShader(shader: Shader): Promise<number> {
        const shaderId = this.nextShaderId++;
        shader.id = shaderId;

        // Compile on GPU if engine bridge is available
        if (this.engineBridge) {
            await this.engineBridge.compileShaderWithId(
                shaderId,
                shader.vertexSource,
                shader.fragmentSource
            );
            shader.markCompiled();
        }

        this.shaders.set(shaderId, shader);
        this.shaderNameToId.set(shader.name, shaderId);

        return shaderId;
    }

    /**
     * Get a shader by ID.
     * 按ID获取着色器。
     *
     * # Arguments | 参数
     * * `shaderId` - Shader ID to look up. | 要查找的着色器ID。
     *
     * # Returns | 返回
     * Shader instance or undefined if not found. | 着色器实例，未找到则返回 undefined。
     */
    getShader(shaderId: number): Shader | undefined {
        return this.shaders.get(shaderId);
    }

    /**
     * Get a shader by name.
     * 按名称获取着色器。
     *
     * # Arguments | 参数
     * * `name` - Shader name to look up. | 要查找的着色器名称。
     *
     * # Returns | 返回
     * Shader instance or undefined if not found. | 着色器实例，未找到则返回 undefined。
     */
    getShaderByName(name: string): Shader | undefined {
        const id = this.shaderNameToId.get(name);
        return id !== undefined ? this.shaders.get(id) : undefined;
    }

    /**
     * Check if a shader exists.
     * 检查着色器是否存在。
     *
     * # Arguments | 参数
     * * `shaderId` - Shader ID to check. | 要检查的着色器ID。
     */
    hasShader(shaderId: number): boolean {
        return this.shaders.has(shaderId);
    }

    /**
     * Remove a shader.
     * 移除着色器。
     *
     * # Arguments | 参数
     * * `shaderId` - Shader ID to remove. | 要移除的着色器ID。
     *
     * # Returns | 返回
     * True if shader was removed, false if not found or is built-in. | 移除成功返回 true，未找到或是内置着色器返回 false。
     */
    removeShader(shaderId: number): boolean {
        if (shaderId < 100) {
            logger.warn('Cannot remove built-in shader:', shaderId);
            return false;
        }

        const shader = this.shaders.get(shaderId);
        if (shader) {
            this.shaderNameToId.delete(shader.name);
            this.shaders.delete(shaderId);

            if (this.engineBridge) {
                this.engineBridge.removeShader(shaderId);
            }

            return true;
        }

        return false;
    }

    // ============= Path-based Shader Loading =============
    // ============= 基于路径的着色器加载 =============

    /**
     * Get shader ID by file path.
     * 通过文件路径获取着色器ID。
     *
     * Returns 0 (default shader) if not loaded.
     * 如果未加载则返回0（默认着色器）。
     *
     * # Arguments | 参数
     * * `path` - Shader file path (.shader). | 着色器文件路径（.shader）。
     *
     * # Returns | 返回
     * Shader ID or 0 if not found. | 着色器ID，未找到则返回0。
     */
    getShaderIdByPath(path: string): number {
        if (!path) return 0;
        return this.shaderPathToId.get(path) ?? 0;
    }

    /**
     * Check if a shader is loaded from a path.
     * 检查着色器是否已从路径加载。
     *
     * # Arguments | 参数
     * * `path` - Shader file path to check. | 要检查的着色器文件路径。
     */
    hasShaderByPath(path: string): boolean {
        return this.shaderPathToId.has(path);
    }

    /**
     * Load a shader from a .shader file path.
     * 从 .shader 文件路径加载着色器。
     *
     * Uses asset-system for file loading and caches the result.
     * 使用 asset-system 进行文件加载并缓存结果。
     *
     * # Arguments | 参数
     * * `path` - Shader file path. | 着色器文件路径。
     *
     * # Returns | 返回
     * Shader ID (0 if load failed). | 着色器ID（加载失败返回0）。
     */
    async loadShaderFromPath(path: string): Promise<number> {
        // Return cached ID if already loaded.
        // 如果已加载则返回缓存的ID。
        const existingId = this.shaderPathToId.get(path);
        if (existingId !== undefined) {
            return existingId;
        }

        // Return pending promise if already loading.
        // 如果正在加载则返回等待中的 Promise。
        const pendingLoad = this.pendingShaderLoads.get(path);
        if (pendingLoad) {
            return pendingLoad;
        }

        // Create loading promise.
        // 创建加载 Promise。
        const loadPromise = this.doLoadShaderFromPath(path);
        this.pendingShaderLoads.set(path, loadPromise);

        try {
            const shaderId = await loadPromise;
            return shaderId;
        } finally {
            this.pendingShaderLoads.delete(path);
        }
    }

    /**
     * Internal method to load shader from path.
     * 内部方法，从路径加载着色器。
     *
     * # Arguments | 参数
     * * `path` - Shader file path. | 着色器文件路径。
     *
     * # Returns | 返回
     * Shader ID, or 0 if load failed. | 着色器ID，加载失败返回0。
     */
    private async doLoadShaderFromPath(path: string): Promise<number> {
        if (!this.assetManager) {
            logger.warn('No asset manager set, cannot load shader from path:', path);
            return 0;
        }

        try {
            // Use asset-system to load shader file.
            // 使用 asset-system 加载着色器文件。
            const result = await this.assetManager.loadAssetByPath<IShaderAssetData>(path);

            // Get shader from asset data.
            // 从资产数据获取着色器。
            const shader = result.asset.shader;
            if (!shader) {
                logger.error('Shader asset is null for path:', path);
                return 0;
            }

            // Register the shader.
            // 注册着色器。
            const shaderId = await this.registerShader(shader);

            // Cache path -> ID mapping.
            // 缓存路径到ID的映射。
            this.shaderPathToId.set(path, shaderId);

            return shaderId;
        } catch (error) {
            logger.error('Failed to load shader from path:', path, error);
            return 0;
        }
    }

    /**
     * Unload a shader loaded from a path.
     * 卸载从路径加载的着色器。
     *
     * # Arguments | 参数
     * * `path` - Shader file path to unload. | 要卸载的着色器文件路径。
     *
     * # Returns | 返回
     * True if unloaded successfully. | 卸载成功返回 true。
     */
    unloadShaderByPath(path: string): boolean {
        const shaderId = this.shaderPathToId.get(path);
        if (shaderId === undefined) {
            return false;
        }

        this.shaderPathToId.delete(path);
        return this.removeShader(shaderId);
    }

    // ============= Material Management =============
    // ============= 材质管理 =============

    /**
     * Register a material.
     * 注册材质。
     *
     * # Arguments | 参数
     * * `material` - Material instance to register. | 要注册的材质实例。
     *
     * # Returns | 返回
     * Material ID for referencing this material. | 用于引用此材质的ID。
     */
    registerMaterial(material: Material): number {
        const materialId = this.nextMaterialId++;
        material.id = materialId;

        // Create on GPU if engine bridge is available
        if (this.engineBridge) {
            this.engineBridge.createMaterialWithId(
                materialId,
                material.name,
                material.shaderId,
                material.blendMode
            );
            this.syncMaterialUniforms(material);
        }

        this.materials.set(materialId, material);
        this.materialNameToId.set(material.name, materialId);

        return materialId;
    }

    /**
     * Get a material by ID.
     * 按ID获取材质。
     *
     * # Arguments | 参数
     * * `materialId` - Material ID to look up. | 要查找的材质ID。
     *
     * # Returns | 返回
     * Material instance or undefined if not found. | 材质实例，未找到则返回 undefined。
     */
    getMaterial(materialId: number): Material | undefined {
        return this.materials.get(materialId);
    }

    /**
     * Get a material by name.
     * 按名称获取材质。
     *
     * # Arguments | 参数
     * * `name` - Material name to look up. | 要查找的材质名称。
     *
     * # Returns | 返回
     * Material instance or undefined if not found. | 材质实例，未找到则返回 undefined。
     */
    getMaterialByName(name: string): Material | undefined {
        const id = this.materialNameToId.get(name);
        return id !== undefined ? this.materials.get(id) : undefined;
    }

    /**
     * Check if a material exists.
     * 检查材质是否存在。
     *
     * # Arguments | 参数
     * * `materialId` - Material ID to check. | 要检查的材质ID。
     */
    hasMaterial(materialId: number): boolean {
        return this.materials.has(materialId);
    }

    /**
     * Remove a material.
     * 移除材质。
     *
     * # Arguments | 参数
     * * `materialId` - Material ID to remove. | 要移除的材质ID。
     *
     * # Returns | 返回
     * True if material was removed, false if not found or is built-in. | 移除成功返回 true，未找到或是内置材质返回 false。
     */
    removeMaterial(materialId: number): boolean {
        if (materialId < 100) {
            logger.warn('Cannot remove built-in material:', materialId);
            return false;
        }

        const material = this.materials.get(materialId);
        if (material) {
            this.materialNameToId.delete(material.name);
            this.materials.delete(materialId);

            if (this.engineBridge) {
                this.engineBridge.removeMaterial(materialId);
            }

            return true;
        }

        return false;
    }

    /**
     * Sync material uniforms to GPU.
     * 同步材质 uniform 到GPU。
     *
     * # Arguments | 参数
     * * `material` - Material to sync. | 要同步的材质。
     */
    syncMaterialUniforms(material: Material): void {
        if (!this.engineBridge || material.id < 0) return;

        for (const [name, uniform] of material.getUniforms()) {
            switch (uniform.type) {
                case UniformType.Float:
                    this.engineBridge.setMaterialFloat(material.id, name, uniform.value as number);
                    break;
                case UniformType.Vec2: {
                    const v2 = uniform.value as number[];
                    this.engineBridge.setMaterialVec2(material.id, name, v2[0], v2[1]);
                    break;
                }
                case UniformType.Vec3: {
                    const v3 = uniform.value as number[];
                    this.engineBridge.setMaterialVec3(material.id, name, v3[0], v3[1], v3[2]);
                    break;
                }
                case UniformType.Vec4: {
                    const v4 = uniform.value as number[];
                    this.engineBridge.setMaterialVec4(material.id, name, v4[0], v4[1], v4[2], v4[3]);
                    break;
                }
                case UniformType.Color: {
                    const c = uniform.value as number[];
                    this.engineBridge.setMaterialColor(material.id, name, c[0], c[1], c[2], c[3]);
                    break;
                }
            }
        }

        material.markClean();
    }

    /**
     * Update all dirty materials.
     * 更新所有脏材质。
     *
     * Syncs all materials that have been modified since last sync.
     * 同步所有自上次同步以来被修改过的材质。
     */
    syncDirtyMaterials(): void {
        for (const material of this.materials.values()) {
            if (material.dirty) {
                this.syncMaterialUniforms(material);
            }
        }
    }

    // ============= Path-based Material Loading =============
    // ============= 基于路径的材质加载 =============

    /**
     * Get material ID by file path.
     * 通过文件路径获取材质ID。
     *
     * Returns 0 (default material) if not loaded.
     * 如果未加载则返回0（默认材质）。
     *
     * # Arguments | 参数
     * * `path` - Material file path (.mat). | 材质文件路径（.mat）。
     *
     * # Returns | 返回
     * Material ID or 0 if not found. | 材质ID，未找到则返回0。
     */
    getMaterialIdByPath(path: string): number {
        if (!path) return 0;
        return this.materialPathToId.get(path) ?? 0;
    }

    /**
     * Check if a material is loaded from a path.
     * 检查材质是否已从路径加载。
     *
     * # Arguments | 参数
     * * `path` - Material file path to check. | 要检查的材质文件路径。
     */
    hasMaterialByPath(path: string): boolean {
        return this.materialPathToId.has(path);
    }

    /**
     * Load a material from a .mat file path.
     * 从 .mat 文件路径加载材质。
     *
     * Uses asset-system for file loading and caches the result.
     * 使用 asset-system 进行文件加载并缓存结果。
     *
     * # Arguments | 参数
     * * `path` - Material file path. | 材质文件路径。
     *
     * # Returns | 返回
     * Material ID (0 if load failed). | 材质ID（加载失败返回0）。
     */
    async loadMaterialFromPath(path: string): Promise<number> {
        // Return cached ID if already loaded
        const existingId = this.materialPathToId.get(path);
        if (existingId !== undefined) {
            return existingId;
        }

        // Return pending promise if already loading
        const pendingLoad = this.pendingMaterialLoads.get(path);
        if (pendingLoad) {
            return pendingLoad;
        }

        // Create loading promise
        const loadPromise = this.doLoadMaterialFromPath(path);
        this.pendingMaterialLoads.set(path, loadPromise);

        try {
            const materialId = await loadPromise;
            return materialId;
        } finally {
            this.pendingMaterialLoads.delete(path);
        }
    }

    /**
     * Internal method to load material from path.
     * 内部方法，从路径加载材质。
     *
     * @param path - Material file path. | 材质文件路径。
     * @returns Material ID, or 0 if load failed. | 材质ID，加载失败返回0。
     */
    private async doLoadMaterialFromPath(path: string): Promise<number> {
        if (!this.assetManager) {
            logger.warn('No asset manager set, cannot load material from path:', path);
            return 0;
        }

        try {
            // Use asset-system to load material file.
            // 使用 asset-system 加载材质文件。
            const result = await this.assetManager.loadAssetByPath<IMaterialAssetData>(path);

            // Get material from asset data.
            // 从资产数据获取材质。
            const material = result.asset.material;
            if (!material) {
                logger.error('Material asset is null for path:', path);
                return 0;
            }

            // Register the material.
            // 注册材质。
            const materialId = this.registerMaterial(material);

            // Cache path -> ID mapping.
            // 缓存路径到ID的映射。
            this.materialPathToId.set(path, materialId);

            return materialId;
        } catch (error) {
            logger.error('Failed to load material from path:', path, error);
            return 0;
        }
    }

    /**
     * Preload multiple materials from paths.
     * 从路径预加载多个材质。
     *
     * Loads all materials in parallel for better performance.
     * 并行加载所有材质以获得更好的性能。
     *
     * # Arguments | 参数
     * * `paths` - Array of material file paths. | 材质文件路径数组。
     *
     * # Returns | 返回
     * Map of path to material ID. | 路径到材质ID的映射。
     */
    async preloadMaterials(paths: string[]): Promise<Map<string, number>> {
        const results = new Map<string, number>();

        await Promise.all(
            paths.map(async (path) => {
                const id = await this.loadMaterialFromPath(path);
                results.set(path, id);
            })
        );

        return results;
    }

    /**
     * Unload a material loaded from a path.
     * 卸载从路径加载的材质。
     *
     * # Arguments | 参数
     * * `path` - Material file path to unload. | 要卸载的材质文件路径。
     *
     * # Returns | 返回
     * True if unloaded successfully. | 卸载成功返回 true。
     */
    unloadMaterialByPath(path: string): boolean {
        const materialId = this.materialPathToId.get(path);
        if (materialId === undefined) {
            return false;
        }

        this.materialPathToId.delete(path);
        return this.removeMaterial(materialId);
    }

    // ============= Convenience Methods =============
    // ============= 便捷方法 =============

    /**
     * Create a sprite material with optional tint.
     * 创建带有可选着色的精灵材质。
     *
     * # Arguments | 参数
     * * `name` - Material name. | 材质名称。
     * * `tintR` - Red tint (0-1). | 红色着色（0-1）。
     * * `tintG` - Green tint (0-1). | 绿色着色（0-1）。
     * * `tintB` - Blue tint (0-1). | 蓝色着色（0-1）。
     *
     * # Returns | 返回
     * New Material instance. | 新的材质实例。
     */
    createSpriteMaterial(name: string, tintR: number = 1, tintG: number = 1, tintB: number = 1): Material {
        const material = new Material(name, BuiltInShaders.DefaultSprite);
        material.setColor('u_tint', tintR, tintG, tintB, 1.0);
        return material;
    }

    /**
     * Get all shader IDs.
     * 获取所有着色器ID。
     *
     * # Returns | 返回
     * Array of all registered shader IDs. | 所有已注册着色器ID的数组。
     */
    getShaderIds(): number[] {
        return Array.from(this.shaders.keys());
    }

    /**
     * Get all material IDs.
     * 获取所有材质ID。
     *
     * # Returns | 返回
     * Array of all registered material IDs. | 所有已注册材质ID的数组。
     */
    getMaterialIds(): number[] {
        return Array.from(this.materials.keys());
    }
}

// Singleton instance.
// 单例实例。
let materialManagerInstance: MaterialManager | null = null;

/**
 * Get the global MaterialManager instance.
 * 获取全局 MaterialManager 实例。
 *
 * Creates a new instance if one doesn't exist.
 * 如果实例不存在则创建新实例。
 *
 * # Returns | 返回
 * The global MaterialManager instance. | 全局 MaterialManager 实例。
 */
export function getMaterialManager(): MaterialManager {
    if (!materialManagerInstance) {
        materialManagerInstance = new MaterialManager();
    }
    return materialManagerInstance;
}
