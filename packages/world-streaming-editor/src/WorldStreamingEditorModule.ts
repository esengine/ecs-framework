/**
 * 世界流式加载编辑器模块
 * World Streaming Editor Module
 *
 * Registers chunk visualizer, inspector providers and tools for world streaming.
 */

import type { ServiceContainer, Entity } from '@esengine/ecs-framework';
import { Core } from '@esengine/ecs-framework';
import type {
    IEditorModuleLoader,
    PanelDescriptor,
    EntityCreationTemplate,
    ComponentInspectorProviderDef,
    IPlugin,
    ModuleManifest
} from '@esengine/editor-core';
import {
    PanelPosition,
    InspectorRegistry,
    EntityStoreService,
    MessageHub,
    ComponentRegistry
} from '@esengine/editor-core';
import { TransformComponent } from '@esengine/engine-core';
import {
    ChunkComponent,
    StreamingAnchorComponent,
    ChunkLoaderComponent,
    WorldStreamingModule
} from '@esengine/world-streaming';

import { ChunkLoaderInspectorProvider } from './providers/ChunkLoaderInspectorProvider';
import { StreamingAnchorInspectorProvider } from './providers/StreamingAnchorInspectorProvider';

import './styles/ChunkVisualizer.css';

/**
 * 世界流式加载编辑器模块
 * World Streaming Editor Module
 */
export class WorldStreamingEditorModule implements IEditorModuleLoader {
    async install(services: ServiceContainer): Promise<void> {
        const inspectorRegistry = services.resolve(InspectorRegistry);
        if (inspectorRegistry) {
            inspectorRegistry.register(new ChunkLoaderInspectorProvider());
            inspectorRegistry.register(new StreamingAnchorInspectorProvider());
        }

        const componentRegistry = services.resolve(ComponentRegistry);
        if (componentRegistry) {
            componentRegistry.register({
                name: 'ChunkLoader',
                type: ChunkLoaderComponent,
                category: 'components.category.streaming',
                description: 'Chunk-based world streaming controller',
                icon: 'Grid3X3'
            });

            componentRegistry.register({
                name: 'StreamingAnchor',
                type: StreamingAnchorComponent,
                category: 'components.category.streaming',
                description: 'Streaming anchor point (player/camera)',
                icon: 'Anchor'
            });

            componentRegistry.register({
                name: 'Chunk',
                type: ChunkComponent,
                category: 'components.category.streaming',
                description: 'Chunk entity marker',
                icon: 'Square'
            });
        }
    }

    async uninstall(): Promise<void> {
        // 清理 | Clean up
    }

    getPanels(): PanelDescriptor[] {
        return [];
    }

    getInspectorProviders(): ComponentInspectorProviderDef[] {
        return [
            {
                componentType: 'ChunkLoader',
                priority: 100,
                render: (component, entity, onChange) => {
                    const provider = new ChunkLoaderInspectorProvider();
                    return provider.render(
                        { entityId: String(entity.id), component },
                        { target: component, onChange }
                    );
                }
            },
            {
                componentType: 'StreamingAnchor',
                priority: 100,
                render: (component, entity, onChange) => {
                    const provider = new StreamingAnchorInspectorProvider();
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
                id: 'create-streaming-anchor',
                label: '创建流式锚点',
                icon: 'Anchor',
                category: 'streaming',
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

                    const anchorCount = entityStore.getAllEntities()
                        .filter((e: Entity) => e.name.startsWith('StreamingAnchor ')).length;
                    const entityName = `StreamingAnchor ${anchorCount + 1}`;

                    const entity = scene.createEntity(entityName);
                    entity.addComponent(new TransformComponent());
                    entity.addComponent(new StreamingAnchorComponent());

                    entityStore.addEntity(entity);
                    messageHub.publish('entity:added', { entity });
                    messageHub.publish('scene:modified', {});
                    entityStore.selectEntity(entity);

                    return entity.id;
                }
            },
            {
                id: 'create-chunk-loader',
                label: '创建区块加载器',
                icon: 'Grid3X3',
                category: 'streaming',
                order: 101,
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

                    const entity = scene.createEntity('ChunkLoader');
                    entity.addComponent(new ChunkLoaderComponent());

                    entityStore.addEntity(entity);
                    messageHub.publish('entity:added', { entity });
                    messageHub.publish('scene:modified', {});
                    entityStore.selectEntity(entity);

                    return entity.id;
                }
            }
        ];
    }

    getFileActionHandlers() {
        return [];
    }

    getFileCreationTemplates() {
        return [];
    }
}

export const worldStreamingEditorModule = new WorldStreamingEditorModule();

/**
 * 世界流式加载插件清单
 * World Streaming Plugin Manifest
 */
const manifest: ModuleManifest = {
    id: '@esengine/world-streaming',
    name: '@esengine/world-streaming',
    displayName: 'World Streaming',
    version: '1.0.0',
    description: 'Chunk-based world streaming for open world games',
    category: 'Other',
    isCore: false,
    defaultEnabled: true,
    isEngineModule: true,
    canContainContent: false,
    dependencies: ['engine-core'],
    exports: {
        components: ['ChunkComponent', 'StreamingAnchorComponent', 'ChunkLoaderComponent'],
        systems: ['ChunkStreamingSystem', 'ChunkCullingSystem'],
        other: ['ChunkManager']
    }
};

/**
 * 完整的世界流式加载插件（运行时 + 编辑器）
 * Complete World Streaming Plugin (runtime + editor)
 */
export const WorldStreamingPlugin: IPlugin = {
    manifest,
    runtimeModule: new WorldStreamingModule(),
    editorModule: worldStreamingEditorModule
};

export default worldStreamingEditorModule;
