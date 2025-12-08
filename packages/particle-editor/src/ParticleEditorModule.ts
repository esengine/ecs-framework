/**
 * 粒子编辑器模块
 * Particle Editor Module
 *
 * Registers file handlers, panels, and templates for .particle files.
 */

import type { ServiceContainer, Entity } from '@esengine/ecs-framework';
import { Core } from '@esengine/ecs-framework';
import type {
    IEditorModuleLoader,
    PanelDescriptor,
    EntityCreationTemplate,
    ComponentInspectorProviderDef,
    FileActionHandler,
    FileCreationTemplate,
    IEditorPlugin,
    ModuleManifest
} from '@esengine/editor-core';
import {
    PanelPosition,
    InspectorRegistry,
    EntityStoreService,
    MessageHub,
    ComponentRegistry,
    FileActionRegistry
} from '@esengine/editor-core';
import { TransformComponent } from '@esengine/engine-core';
import {
    ParticleSystemComponent,
    ParticleRuntimeModule,
    createDefaultParticleAsset
} from '@esengine/particle';

import { ParticleEditorPanel } from './panels/ParticleEditorPanel';
import { ParticleInspectorProvider } from './providers/ParticleInspectorProvider';
import { useParticleEditorStore } from './stores/ParticleEditorStore';
import { registerParticleGizmo, unregisterParticleGizmo } from './gizmos/ParticleGizmo';

// 导入编辑器 CSS 样式（会被 vite 自动处理并注入到 DOM）
// Import editor CSS styles (automatically handled and injected by vite)
import './styles/ParticleEditor.css';

/**
 * 粒子编辑器模块
 * Particle Editor Module
 */
export class ParticleEditorModule implements IEditorModuleLoader {
    private _assetsRefreshUnsubscribe: (() => void) | null = null;

    async install(services: ServiceContainer): Promise<void> {
        // 注册检视器提供者 | Register inspector provider
        const inspectorRegistry = services.resolve(InspectorRegistry);
        if (inspectorRegistry) {
            inspectorRegistry.register(new ParticleInspectorProvider());
        }

        // 注册组件到编辑器组件注册表 | Register to editor component registry
        const componentRegistry = services.resolve(ComponentRegistry);
        if (componentRegistry) {
            componentRegistry.register({
                name: 'ParticleSystem',
                type: ParticleSystemComponent,
                category: 'components.category.effects',
                description: 'Particle system for 2D visual effects',
                icon: 'Sparkles'
            });
        }

        // 注册资产创建消息映射 | Register asset creation message mappings
        const fileActionRegistry = services.resolve(FileActionRegistry);
        if (fileActionRegistry) {
            fileActionRegistry.registerAssetCreationMapping({
                extension: '.particle',
                createMessage: 'particle:create-asset'
            });
        }

        // 注册 Gizmo | Register gizmo
        registerParticleGizmo();

        // 监听资产刷新事件，当 .particle 文件保存时重新加载所有粒子组件
        // Listen for assets refresh event to reload particle components when .particle files are saved
        const messageHub = services.resolve(MessageHub);
        if (messageHub) {
            this._assetsRefreshUnsubscribe = messageHub.subscribe('assets:refresh', () => {
                this._reloadAllParticleAssets();
            });
        }
    }

    async uninstall(): Promise<void> {
        // 取消订阅事件 | Unsubscribe events
        if (this._assetsRefreshUnsubscribe) {
            this._assetsRefreshUnsubscribe();
            this._assetsRefreshUnsubscribe = null;
        }

        // 取消注册 Gizmo | Unregister gizmo
        unregisterParticleGizmo();
    }

    /**
     * 重新加载所有粒子资产
     * Reload all particle assets
     *
     * 当资产文件变化时调用，强制所有粒子组件重新加载资产。
     * Called when asset files change, forcing all particle components to reload.
     */
    private _reloadAllParticleAssets(): void {
        const scene = Core.scene;
        if (!scene) return;

        // 遍历所有带有 ParticleSystemComponent 的实体
        // Iterate all entities with ParticleSystemComponent
        scene.entities.forEach((entity: Entity) => {
            const particle = entity.getComponent(ParticleSystemComponent) as ParticleSystemComponent | null;
            if (particle && particle.particleAssetGuid) {
                // 异步重新加载资产 | Async reload asset
                particle.reloadAsset().then((success: boolean) => {
                    if (success) {
                        console.log(`[ParticleEditorModule] Reloaded particle asset for entity: ${entity.name}`);
                        // 标记需要重建并重新播放 | Mark dirty and replay
                        particle.markDirty();
                        if (particle.isPlaying) {
                            particle.stop(true);
                            particle.play();
                        }
                    }
                });
            }
        });
    }

    getPanels(): PanelDescriptor[] {
        return [
            {
                id: 'particle-editor',
                title: 'Particle Editor',
                position: PanelPosition.Center,
                closable: true,
                component: ParticleEditorPanel,
                isDynamic: true
            }
        ];
    }

    getInspectorProviders(): ComponentInspectorProviderDef[] {
        return [
            {
                componentType: 'ParticleSystem',
                priority: 100,
                render: (component, entity, onChange) => {
                    const provider = new ParticleInspectorProvider();
                    return provider.render(
                        { entityId: String(entity.id), component },
                        { target: component, onChange }
                    );
                }
            }
        ];
    }

    getEntityCreationTemplates(): EntityCreationTemplate[] {
        return [
            {
                id: 'create-particle-entity',
                label: '创建粒子效果',
                icon: 'Sparkles',
                category: 'effects',
                order: 100,
                create: (): number => {
                    const scene = Core.scene;
                    if (!scene) {
                        throw new Error('Scene not available');
                    }

                    const entityStore = Core.services.resolve(EntityStoreService);
                    const messageHub = Core.services.resolve(MessageHub);

                    if (!entityStore || !messageHub) {
                        throw new Error('EntityStoreService or MessageHub not available');
                    }

                    const particleCount = entityStore.getAllEntities()
                        .filter((e: Entity) => e.name.startsWith('ParticleSystem ')).length;
                    const entityName = `ParticleSystem ${particleCount + 1}`;

                    const entity = scene.createEntity(entityName);
                    entity.addComponent(new TransformComponent());
                    entity.addComponent(new ParticleSystemComponent());

                    entityStore.addEntity(entity);
                    messageHub.publish('entity:added', { entity });
                    messageHub.publish('scene:modified', {});
                    entityStore.selectEntity(entity);

                    return entity.id;
                }
            }
        ];
    }

    getFileActionHandlers(): FileActionHandler[] {
        return [
            {
                extensions: ['particle', 'json'],
                onDoubleClick: (filePath: string) => {
                    // 只处理 .particle 和 .particle.json 文件
                    // Only handle .particle and .particle.json files
                    const lowerPath = filePath.toLowerCase();
                    if (!lowerPath.endsWith('.particle') && !lowerPath.endsWith('.particle.json')) {
                        return;
                    }

                    // 先设置待打开的文件路径到 store
                    // Set pending file path to store first
                    useParticleEditorStore.getState().setPendingFilePath(filePath);

                    const messageHub = Core.services.resolve(MessageHub);
                    if (messageHub) {
                        // 打开粒子编辑器面板（面板挂载后会从 store 读取 pendingFilePath）
                        // Open particle editor panel (panel will read pendingFilePath from store after mount)
                        messageHub.publish('dynamic-panel:open', {
                            panelId: 'particle-editor',
                            title: `Particle Editor - ${filePath.split(/[\\/]/).pop()}`
                        });
                    }
                }
            }
        ];
    }

    getFileCreationTemplates(): FileCreationTemplate[] {
        return [
            {
                id: 'create-particle',
                label: 'Particle Effect',
                extension: 'particle',
                icon: 'Sparkles',
                category: 'effects',
                getContent: (fileName: string) => {
                    const assetData = createDefaultParticleAsset(fileName.replace('.particle', ''));
                    return JSON.stringify(assetData, null, 2);
                }
            }
        ];
    }
}

export const particleEditorModule = new ParticleEditorModule();

/**
 * 粒子插件清单
 * Particle Plugin Manifest
 */
const manifest: ModuleManifest = {
    id: '@esengine/particle',
    name: '@esengine/particle',
    displayName: 'Particle System',
    version: '1.0.0',
    description: 'Particle system for 2D visual effects',
    category: 'Rendering',
    isCore: false,
    defaultEnabled: true,
    isEngineModule: true,
    canContainContent: true,
    dependencies: ['engine-core'],
    exports: {
        components: ['ParticleSystemComponent'],
        systems: ['ParticleUpdateSystem'],
        loaders: ['ParticleLoader']
    }
};

/**
 * 完整的粒子插件（运行时 + 编辑器）
 * Complete Particle Plugin (runtime + editor)
 */
export const ParticlePlugin: IEditorPlugin = {
    manifest,
    runtimeModule: new ParticleRuntimeModule(),
    editorModule: particleEditorModule
};

export default particleEditorModule;
