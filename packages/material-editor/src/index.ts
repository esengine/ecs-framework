/**
 * @esengine/material-editor
 *
 * Editor support for @esengine/material-system - file creation templates and material asset management
 *
 * 材质编辑器模块 - 提供材质文件创建功能
 * 注意：材质不是独立组件，而是作为渲染组件（如 SpriteComponent）的属性使用
 * 材质文件 (.mat) 的预览和编辑在 Inspector 中完成
 */

import type { ServiceContainer } from '@esengine/ecs-framework';
import { Core } from '@esengine/ecs-framework';
import type {
    IEditorModuleLoader,
    FileCreationTemplate,
    IEditorPlugin,
    ModuleManifest
} from '@esengine/editor-core';
import {
    MessageHub,
    FileActionRegistry,
    InspectorRegistry,
    IInspectorRegistry,
    IFileSystemService,
    LocaleService
} from '@esengine/editor-core';

// Import locale translations
import { en, zh, es } from './locales';

// Inspector provider
import { MaterialAssetInspectorProvider } from './providers/MaterialAssetInspectorProvider';

// Runtime imports from @esengine/material-system
import {
    MaterialRuntimeModule,
    BlendMode,
    BuiltInShaders
} from '@esengine/material-system';

// Editor components - for re-export only
import { MaterialEditorPanel } from './components/MaterialEditorPanel';
import { useMaterialEditorStore } from './stores/MaterialEditorStore';

// Import styles
import './styles/MaterialEditorPanel.css';

const DEFAULT_MATERIAL_TEMPLATE = {
    name: 'New Material',
    shader: BuiltInShaders.DefaultSprite,
    blendMode: BlendMode.Alpha,
    uniforms: {}
};

/**
 * Material Editor Module
 *
 * 提供：
 * - 材质文件 (.mat) 创建模板
 * - 着色器文件 (.shader) 创建模板
 * - 材质资产创建消息处理（用于 PropertyInspector 中的创建按钮）
 *
 * 注意：.mat 文件的预览和编辑在 Inspector 中完成，不需要单独的编辑器面板
 */
export class MaterialEditorModule implements IEditorModuleLoader {
    private inspectorProvider?: MaterialAssetInspectorProvider;

    async install(services: ServiceContainer): Promise<void> {
        // 注意：文件创建模板由 PluginManager.activatePluginEditor() 自动注册
        // 不要在这里手动注册，否则会重复
        // NOTE: File creation templates are auto-registered by PluginManager.activatePluginEditor()
        // Do not manually register here to avoid duplicates

        // Register asset creation mapping for .mat files
        const fileActionRegistry = services.resolve(FileActionRegistry);
        if (fileActionRegistry) {
            fileActionRegistry.registerAssetCreationMapping({
                extension: '.mat',
                createMessage: 'material:create',
                canCreate: true
            });
        }

        // Register Material Asset Inspector Provider
        const inspectorRegistry = services.resolve<InspectorRegistry>(IInspectorRegistry);
        if (inspectorRegistry) {
            this.inspectorProvider = new MaterialAssetInspectorProvider();

            // Set up save handler using file system service
            const fileSystem = services.tryResolve(IFileSystemService) as { writeFile(path: string, content: string): Promise<void> } | null;
            if (fileSystem) {
                this.inspectorProvider.setSaveHandler(async (path, content) => {
                    await fileSystem.writeFile(path, content);
                });
            }

            inspectorRegistry.register(this.inspectorProvider);
        }

        // Subscribe to material:create message
        const messageHub = services.resolve(MessageHub);
        if (messageHub) {
            messageHub.subscribe('material:create', async (payload: {
                entityId?: string;
                onChange?: (value: string | null) => void;
            }) => {
                await this.handleCreateMaterialAsset(payload);
            });
        }

        // Register translations
        this.registerTranslations(services);
    }

    /**
     * 注册插件翻译到 LocaleService
     * Register plugin translations to LocaleService
     */
    private registerTranslations(services: ServiceContainer): void {
        try {
            const localeService = services.tryResolve(LocaleService);
            if (localeService) {
                localeService.extendTranslations('material', { en, zh, es });
                console.info('[MaterialEditorModule] Translations registered');
            }
        } catch (error) {
            console.warn('[MaterialEditorModule] Failed to register translations:', error);
        }
    }

    async uninstall(): Promise<void> {
        // Reset store state
        useMaterialEditorStore.getState().reset();
    }

    getFileCreationTemplates(): FileCreationTemplate[] {
        return [
            {
                id: 'create-material',
                label: 'Material',
                extension: 'mat',
                icon: 'Palette',
                category: 'Rendering',
                getContent: (fileName: string): string => {
                    const materialName = fileName.replace(/\.mat$/i, '');
                    return JSON.stringify(
                        {
                            ...DEFAULT_MATERIAL_TEMPLATE,
                            name: materialName
                        },
                        null,
                        2
                    );
                }
            },
            {
                id: 'create-shader',
                label: 'Shader',
                extension: 'shader',
                icon: 'Code',
                category: 'Rendering',
                getContent: (fileName: string): string => {
                    const shaderName = fileName.replace(/\.shader$/i, '');
                    return JSON.stringify(
                        {
                            version: 1,
                            shader: {
                                name: shaderName,
                                vertexSource: `#version 300 es
precision highp float;

in vec2 a_position;
in vec2 a_texCoord;
in vec4 a_color;

uniform mat4 u_projection;
uniform mat4 u_view;

out vec2 v_texCoord;
out vec4 v_color;

void main() {
    gl_Position = u_projection * u_view * vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
    v_color = a_color;
}`,
                                fragmentSource: `#version 300 es
precision highp float;

in vec2 v_texCoord;
in vec4 v_color;

uniform sampler2D u_texture;

out vec4 fragColor;

void main() {
    vec4 texColor = texture(u_texture, v_texCoord);
    fragColor = texColor * v_color;
}`
                            }
                        },
                        null,
                        2
                    );
                }
            }
        ];
    }

    /**
     * Handle create material asset request
     */
    private async handleCreateMaterialAsset(
        payload: { entityId?: string; onChange?: (value: string | null) => void }
    ): Promise<void> {
        // Import dialog and file system services dynamically
        const { IDialogService, IFileSystemService } = await import('@esengine/editor-core');
        type IDialog = { saveDialog(options: any): Promise<string | null> };
        type IFileSystem = { writeFile(path: string, content: string): Promise<void> };

        const dialog = Core.services.tryResolve(IDialogService) as IDialog | null;
        const fileSystem = Core.services.tryResolve(IFileSystemService) as IFileSystem | null;

        if (!dialog || !fileSystem) {
            console.error('[MaterialEditorModule] Dialog or FileSystem service not available');
            return;
        }

        const filePath = await dialog.saveDialog({
            title: 'Create Material Asset',
            filters: [{ name: 'Material', extensions: ['mat'] }],
            defaultPath: 'new-material.mat'
        });

        if (!filePath) {
            return;
        }

        const materialName = filePath.split(/[\\/]/).pop()?.replace(/\.mat$/i, '') || 'New Material';
        const materialData = {
            ...DEFAULT_MATERIAL_TEMPLATE,
            name: materialName
        };

        await fileSystem.writeFile(filePath, JSON.stringify(materialData, null, 2));

        if (payload.onChange) {
            payload.onChange(filePath);
        }
    }
}

export const materialEditorModule = new MaterialEditorModule();

// Re-exports
export { MaterialEditorPanel } from './components/MaterialEditorPanel';
export { useMaterialEditorStore, createDefaultMaterialData } from './stores/MaterialEditorStore';
export type { MaterialEditorState } from './stores/MaterialEditorStore';
export { useMaterialLocale, translateMaterial } from './hooks/useMaterialLocale';

/**
 * Material Plugin Manifest
 */
const manifest: ModuleManifest = {
    id: '@esengine/material-system',
    name: '@esengine/material-system',
    displayName: 'Material System',
    version: '1.0.0',
    description: 'Material and shader system for custom rendering effects',
    category: 'Rendering',
    isCore: true,
    defaultEnabled: true,
    isEngineModule: true,
    canContainContent: true,
    dependencies: ['engine-core'],
    exports: {
        components: ['MaterialComponent'],
        other: ['Material', 'Shader', 'BlendMode']
    }
};

/**
 * Complete Material Plugin (runtime + editor)
 */
export const MaterialPlugin: IEditorPlugin = {
    manifest,
    runtimeModule: new MaterialRuntimeModule(),
    editorModule: materialEditorModule
};

export default materialEditorModule;
