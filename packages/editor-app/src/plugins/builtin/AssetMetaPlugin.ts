/**
 * Asset Meta Plugin
 * 资产元数据插件
 *
 * Handles .meta file generation for project assets.
 * 处理项目资产的 .meta 文件生成。
 */

import type { ServiceContainer } from '@esengine/esengine';
import { createLogger } from '@esengine/esengine';
import type { IPlugin, IEditorModuleLoader, ModuleManifest } from '@esengine/editor-core';
import { AssetRegistryService } from '@esengine/editor-core';

const logger = createLogger('AssetMetaPlugin');

/**
 * Asset Meta Editor Module
 * 资产元数据编辑器模块
 */
class AssetMetaEditorModule implements IEditorModuleLoader {
    private _assetRegistry: AssetRegistryService | null = null;

    async install(services: ServiceContainer): Promise<void> {
        // 创建 AssetRegistryService 并初始化
        // Create AssetRegistryService and initialize
        this._assetRegistry = new AssetRegistryService();

        // 注册到服务容器，以便其他地方可以访问
        // Register to service container so other places can access it
        services.registerInstance(AssetRegistryService, this._assetRegistry);

        // 初始化服务（订阅 project:opened 事件）
        // Initialize service (subscribes to project:opened event)
        await this._assetRegistry.initialize();

        logger.info('AssetRegistryService initialized and registered');
    }

    async uninstall(): Promise<void> {
        if (this._assetRegistry) {
            this._assetRegistry.unloadProject();
            this._assetRegistry = null;
        }
        logger.info('Uninstalled');
    }

    async onEditorReady(): Promise<void> {
        logger.info('Editor is ready');
    }
}

const manifest: ModuleManifest = {
    id: '@esengine/asset-meta',
    name: '@esengine/asset-meta',
    displayName: 'Asset Meta',
    version: '1.0.0',
    description: 'Generates .meta files for project assets | 为项目资产生成 .meta 文件',
    category: 'Other',
    icon: 'FileJson',
    isCore: true,
    defaultEnabled: true,
    isEngineModule: false, // 不是引擎模块，不会被打包到 runtime
    canContainContent: false,
    dependencies: [],
    exports: {}
};

export const AssetMetaPlugin: IPlugin = {
    manifest,
    editorModule: new AssetMetaEditorModule()
};
