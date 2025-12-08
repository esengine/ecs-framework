/**
 * MaterialSystemPlugin for ES Engine.
 * ES引擎的材质系统插件。
 *
 * 注意：材质系统不注册独立组件，材质作为渲染组件（如 SpriteComponent）的属性使用
 */

import { MaterialManager, getMaterialManager } from './MaterialManager';
import { createLogger } from '@esengine/ecs-framework';
import type { IPlugin, ModuleManifest, IRuntimeModule } from '@esengine/engine-core';

/** Logger instance for MaterialRuntimeModule. | MaterialRuntimeModule的日志实例。 */
const logger = createLogger('MaterialRuntimeModule');

/**
 * Runtime module interface for Material system.
 * 材质系统的运行时模块接口。
 */
export interface IMaterialRuntimeModule {
    onInitialize?(): Promise<void>;
    onDestroy?(): void;
    getMaterialManager(): MaterialManager;
}

/**
 * Runtime module that provides material and shader functionality.
 * 提供材质和着色器功能的运行时模块。
 *
 * 该模块提供：
 * - MaterialManager: 材质资产管理
 * - 材质文件加载和缓存
 * - 与 Rust 引擎的材质/着色器桥接
 */
export class MaterialRuntimeModule implements IMaterialRuntimeModule {
    private materialManager: MaterialManager;

    constructor() {
        this.materialManager = getMaterialManager();
    }

    /**
     * Initialize the material system.
     * 初始化材质系统。
     */
    async onInitialize(): Promise<void> {
        logger.info('Initialized');
    }

    /**
     * Cleanup the material system.
     * 清理材质系统。
     */
    onDestroy(): void {
        logger.info('Destroyed');
    }

    /**
     * Get the material manager.
     * 获取材质管理器。
     */
    getMaterialManager(): MaterialManager {
        return this.materialManager;
    }
}

// Export singleton instance
export const materialRuntimeModule = new MaterialRuntimeModule();

/**
 * Plugin manifest for Material System.
 * 材质系统的插件清单。
 */
const manifest: ModuleManifest = {
    id: 'material-system',
    name: '@esengine/material-system',
    displayName: 'Material System',
    version: '1.0.0',
    description: '材质和着色器系统',
    category: 'Rendering',
    icon: 'Palette',
    isCore: true,
    defaultEnabled: true,
    isEngineModule: true,
    dependencies: ['core', 'asset-system'],
    exports: { other: ['Material', 'Shader', 'MaterialManager'] },
    requiresWasm: false
};

/**
 * Material System Plugin.
 * 材质系统插件。
 */
export const MaterialSystemPlugin: IPlugin = {
    manifest,
    runtimeModule: materialRuntimeModule as IRuntimeModule
};
