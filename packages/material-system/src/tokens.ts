/**
 * Material System Service Tokens
 * 材质系统服务令牌
 *
 * 遵循"谁定义接口，谁导出 Token"原则。
 * Following "who defines interface, who exports Token" principle.
 */

import { createServiceToken } from '@esengine/ecs-framework';
import type { Material } from './Material';
import type { Shader } from './Shader';
import type { IEngineBridge } from './MaterialManager';
import type { IAssetManager } from '@esengine/asset-system';

// ============================================================================
// Material Manager Interface
// ============================================================================

/**
 * MaterialManager 接口
 * MaterialManager interface
 *
 * 提供材质和着色器管理功能。
 * Provides material and shader management functionality.
 */
export interface IMaterialManager {
    // ========== Initialization | 初始化 ==========

    /**
     * 设置引擎桥接
     * Set engine bridge for Rust communication
     */
    setEngineBridge(bridge: IEngineBridge): void;

    /**
     * 设置资产管理器
     * Set asset manager for loading assets
     */
    setAssetManager(assetManager: IAssetManager): void;

    /**
     * 初始化内置材质
     * Initialize built-in materials
     */
    initializeBuiltInMaterials(): Promise<void>;

    // ========== Shader Management | 着色器管理 ==========

    /**
     * 注册着色器
     * Register a shader
     */
    registerShader(shader: Shader): Promise<number>;

    /**
     * 通过 ID 获取着色器
     * Get shader by ID
     */
    getShader(id: number): Shader | undefined;

    /**
     * 通过名称获取着色器
     * Get shader by name
     */
    getShaderByName(name: string): Shader | undefined;

    /**
     * 移除着色器
     * Remove a shader
     */
    removeShader(id: number): boolean;

    /**
     * 从路径加载着色器
     * Load shader from path
     */
    loadShaderByPath(path: string): Promise<number>;

    // ========== Material Management | 材质管理 ==========

    /**
     * 注册材质
     * Register a material
     */
    registerMaterial(material: Material): Promise<number>;

    /**
     * 通过 ID 获取材质
     * Get material by ID
     */
    getMaterial(id: number): Material | undefined;

    /**
     * 通过名称获取材质
     * Get material by name
     */
    getMaterialByName(name: string): Material | undefined;

    /**
     * 移除材质
     * Remove a material
     */
    removeMaterial(id: number): boolean;

    /**
     * 从路径加载材质
     * Load material from path
     */
    loadMaterialByPath(path: string): Promise<number>;

    /**
     * 克隆材质
     * Clone a material
     */
    cloneMaterial(materialId: number, newName?: string): Promise<Material | null>;

    // ========== Built-in Materials | 内置材质 ==========

    /**
     * 获取默认材质 ID
     * Get default material ID
     */
    getDefaultMaterialId(): number;

    /**
     * 获取灰度材质 ID
     * Get grayscale material ID
     */
    getGrayscaleMaterialId(): number;

    /**
     * 获取着色材质 ID
     * Get tint material ID
     */
    getTintMaterialId(): number;

    /**
     * 获取闪烁材质 ID
     * Get flash material ID
     */
    getFlashMaterialId(): number;

    /**
     * 获取轮廓材质 ID
     * Get outline material ID
     */
    getOutlineMaterialId(): number;

    // ========== Uniform Management | Uniform 管理 ==========

    /**
     * 设置材质 uniform 值
     * Set material uniform value
     */
    setMaterialUniform(materialId: number, name: string, value: any): boolean;

    // ========== Lifecycle | 生命周期 ==========

    /**
     * 销毁管理器，释放所有资源
     * Destroy manager and release all resources
     */
    destroy(): void;
}

// ============================================================================
// Service Token
// ============================================================================

/**
 * MaterialManager 服务令牌
 * MaterialManager service token
 */
export const MaterialManagerToken = createServiceToken<IMaterialManager>('materialManager');
