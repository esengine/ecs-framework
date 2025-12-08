/**
 * @esengine/shader-editor
 *
 * Shader editor with code editing, analysis, and preview.
 * 着色器编辑器，支持代码编辑、分析和预览。
 */

import type { ServiceContainer } from '@esengine/ecs-framework';
import type {
    IEditorModuleLoader,
    IEditorPlugin,
    ModuleManifest,
    IFileSystem
} from '@esengine/editor-core';
import {
    InspectorRegistry,
    IInspectorRegistry,
    IFileSystemService
} from '@esengine/editor-core';

// Components
import { useShaderEditorStore } from './stores/ShaderEditorStore';
import { ShaderAssetInspectorProvider } from './providers/ShaderAssetInspectorProvider';

// Import styles
import './styles/ShaderInspector.css';

// Re-exports
export { useShaderEditorStore, createDefaultShaderData } from './stores/ShaderEditorStore';
export type { ShaderData, ShaderEditorState } from './stores/ShaderEditorStore';
export { ShaderAnalyzer, shaderAnalyzer } from './analysis/ShaderAnalyzer';
export type {
    ShaderAnalysis,
    ShaderComplexity,
    UniformInfo,
    AttributeInfo,
    VaryingInfo
} from './analysis/ShaderAnalyzer';
export { ShaderAssetInspectorProvider } from './providers/ShaderAssetInspectorProvider';

/**
 * Shader Editor Module.
 * 着色器编辑器模块。
 */
export class ShaderEditorModule implements IEditorModuleLoader {
    private unsubscribers: Array<() => void> = [];
    private inspectorProvider?: ShaderAssetInspectorProvider;

    async install(services: ServiceContainer): Promise<void> {
        // Register Shader Asset Inspector Provider.
        // 注册着色器资产检视器提供者。
        const inspectorRegistry = services.resolve<InspectorRegistry>(IInspectorRegistry);
        if (inspectorRegistry) {
            this.inspectorProvider = new ShaderAssetInspectorProvider();

            // Set up save handler.
            // 设置保存处理器。
            const fileSystem = services.tryResolve<IFileSystem>(IFileSystemService);
            if (fileSystem) {
                this.inspectorProvider.setSaveHandler(async (path, content) => {
                    await fileSystem.writeFile(path, content);
                });
            }

            inspectorRegistry.register(this.inspectorProvider);
        }
    }

    async uninstall(): Promise<void> {
        // Clean up subscriptions.
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];
        // Reset store.
        useShaderEditorStore.getState().reset();
    }

}

export const shaderEditorModule = new ShaderEditorModule();

/**
 * Shader Editor Plugin Manifest.
 * 着色器编辑器插件清单。
 */
const manifest: ModuleManifest = {
    id: '@esengine/shader-editor',
    name: '@esengine/shader-editor',
    displayName: 'Shader Editor',
    version: '1.0.0',
    description: 'Shader code editing with analysis and preview',
    category: 'Rendering',
    isCore: true,
    defaultEnabled: true,
    isEngineModule: true,
    dependencies: ['material-system'],
    exports: {
        other: ['ShaderAnalyzer']
    }
};

/**
 * Shader Editor Plugin (editor only, no runtime).
 * 着色器编辑器插件（仅编辑器，无运行时）。
 */
export const ShaderEditorPlugin: IEditorPlugin = {
    manifest,
    editorModule: shaderEditorModule
};

export default shaderEditorModule;
