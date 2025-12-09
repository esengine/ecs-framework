/**
 * Behavior Tree Editor Module
 * 行为树编辑器模块
 */

import type { ServiceContainer } from '@esengine/ecs-framework';
import { TransformComponent } from '@esengine/engine-core';
import {
    type IEditorModuleLoader,
    type IEditorPlugin,
    type PanelDescriptor,
    type EntityCreationTemplate,
    type FileCreationTemplate,
    type FileActionHandler,
    PanelPosition,
    CompilerRegistry,
    ICompilerRegistry,
    InspectorRegistry,
    IInspectorRegistry,
    MessageHub,
    IMessageHub,
    FileActionRegistry,
    IFileActionRegistry,
    IDialogService,
    IFileSystemService,
    type IDialog,
    type IFileSystem,
    createLogger,
    PluginAPI,
    LocaleService,
} from '@esengine/editor-runtime';

// Runtime imports from @esengine/behavior-tree package
import { BehaviorTreeRuntimeComponent, BehaviorTreeRuntimeModule } from '@esengine/behavior-tree';

// Editor components and services
import { BehaviorTreeService } from './services/BehaviorTreeService';
import { FileSystemService } from './services/FileSystemService';
import { BehaviorTreeServiceToken, type IBehaviorTreeService } from './tokens';
import { BehaviorTreeCompiler } from './compiler/BehaviorTreeCompiler';
import { BehaviorTreeNodeInspectorProvider } from './providers/BehaviorTreeNodeInspectorProvider';
import { BehaviorTreeEditorPanel } from './components/panels/BehaviorTreeEditorPanel';
import { useBehaviorTreeDataStore } from './stores';
import { createRootNode } from './domain/constants/RootNode';
import { PluginContext } from './PluginContext';

// Import manifest from local file
import { manifest } from './BehaviorTreePlugin';

// Import locale translations
import { en, zh, es } from './locales';

// 导入编辑器 CSS 样式（会被 vite 自动处理并注入到 DOM）
// Import editor CSS styles (automatically handled and injected by vite)
import './styles/BehaviorTreeNode.css';
import './components/panels/BehaviorTreeEditorPanel.css';

const logger = createLogger('BehaviorTreeEditorModule');

/**
 * Behavior Tree Editor Module
 * 行为树编辑器模块加载器
 */
export class BehaviorTreeEditorModule implements IEditorModuleLoader {
    private services?: ServiceContainer;
    private unsubscribers: Array<() => void> = [];

    async install(services: ServiceContainer): Promise<void> {
        this.services = services;

        // 设置插件上下文
        PluginContext.setServices(services);

        // 注册服务
        this.registerServices(services);

        // 注册编译器
        this.registerCompilers(services);

        // 注册节点检视器
        this.registerInspectorProviders(services);

        // 注册资产创建消息映射
        this.registerAssetCreationMappings(services);

        // 订阅创建资产消息
        this.subscribeToMessages(services);

        // 注册翻译 | Register translations
        this.registerTranslations(services);

        logger.info('BehaviorTree editor module installed');
    }

    private registerAssetCreationMappings(services: ServiceContainer): void {
        try {
            const fileActionRegistry = services.resolve<FileActionRegistry>(IFileActionRegistry);
            if (fileActionRegistry) {
                fileActionRegistry.registerAssetCreationMapping({
                    extension: '.btree',
                    createMessage: 'behavior-tree:create-asset'
                });
            }
        } catch (error) {
            logger.warn('FileActionRegistry not available:', error);
        }
    }

    private subscribeToMessages(services: ServiceContainer): void {
        try {
            const messageHub = services.resolve<MessageHub>(IMessageHub);
            if (messageHub) {
                const unsubscribe = messageHub.subscribe('behavior-tree:create-asset', async (payload: {
                    entityId?: string;
                    onChange?: (value: string | null) => void;
                }) => {
                    await this.handleCreateBehaviorTreeAsset(services, payload);
                });
                this.unsubscribers.push(unsubscribe);
            }
        } catch (error) {
            logger.warn('MessageHub not available:', error);
        }
    }

    private async handleCreateBehaviorTreeAsset(
        services: ServiceContainer,
        payload: { entityId?: string; onChange?: (value: string | null) => void }
    ): Promise<void> {
        try {
            const dialog = services.resolve<IDialog>(IDialogService);
            const fileSystem = services.resolve<IFileSystem>(IFileSystemService);
            const messageHub = services.resolve<MessageHub>(IMessageHub);

            if (!dialog || !fileSystem) {
                logger.error('Dialog or FileSystem service not available');
                return;
            }

            const filePath = await dialog.saveDialog({
                title: 'Create Behavior Tree Asset',
                filters: [{ name: 'Behavior Tree', extensions: ['btree'] }],
                defaultPath: 'new-behavior-tree.btree'
            });

            if (!filePath) {
                return;
            }

            // 获取默认行为树内容
            const templates = this.getFileCreationTemplates();
            const btreeTemplate = templates.find(t => t.extension === 'btree');
            const content = btreeTemplate
                ? await btreeTemplate.getContent(filePath.split(/[\\/]/).pop() || 'new-behavior-tree.btree')
                : '{}';

            await fileSystem.writeFile(filePath, content);

            if (payload.onChange) {
                payload.onChange(filePath);
            }

            // 打开行为树编辑器
            if (messageHub) {
                messageHub.publish('dynamic-panel:open', {
                    panelId: 'behavior-tree-editor',
                    title: `Behavior Tree - ${filePath.split(/[\\/]/).pop()}`
                });
            }

            logger.info('Created behavior tree asset:', filePath);
        } catch (error) {
            logger.error('Failed to create behavior tree asset:', error);
        }
    }

    async uninstall(): Promise<void> {
        // 清理订阅
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];

        if (this.services) {
            this.services.unregister(FileSystemService);
            this.services.unregister(BehaviorTreeServiceToken.id);
        }

        useBehaviorTreeDataStore.getState().reset();
        PluginContext.clear();
        this.services = undefined;

        logger.info('BehaviorTree editor module uninstalled');
    }

    private registerServices(services: ServiceContainer): void {
        // FileSystemService (BehaviorTreeService depends on it)
        if (services.isRegistered(FileSystemService)) {
            services.unregister(FileSystemService);
        }
        services.registerSingleton(FileSystemService);

        // BehaviorTreeService - 使用 ServiceToken.id (symbol) 注册
        // BehaviorTreeService - register with ServiceToken.id (symbol)
        // ServiceContainer 支持 symbol 作为 ServiceIdentifier
        // ServiceContainer supports symbol as ServiceIdentifier
        const tokenId = BehaviorTreeServiceToken.id;
        if (services.isRegistered(tokenId)) {
            services.unregister(tokenId);
        }
        const btService = new BehaviorTreeService();
        services.registerInstance(tokenId, btService);
    }

    private registerCompilers(services: ServiceContainer): void {
        try {
            const compilerRegistry = services.resolve<CompilerRegistry>(ICompilerRegistry);
            const compiler = new BehaviorTreeCompiler();
            compilerRegistry.register(compiler);
            logger.info('BehaviorTreeCompiler registered');
        } catch (error) {
            logger.error('Failed to register compiler:', error);
        }
    }

    /**
     * 注册插件翻译到 LocaleService
     * Register plugin translations to LocaleService
     */
    private registerTranslations(services: ServiceContainer): void {
        try {
            const localeService = services.tryResolve<LocaleService>(LocaleService);
            if (localeService) {
                localeService.extendTranslations('behaviorTree', { en, zh, es });
                logger.info('BehaviorTree translations registered');
            }
        } catch (error) {
            logger.warn('Failed to register translations:', error);
        }
    }

    private registerInspectorProviders(services: ServiceContainer): void {
        try {
            const inspectorRegistry = services.resolve<InspectorRegistry>(IInspectorRegistry);
            if (!inspectorRegistry) {
                logger.error('InspectorRegistry not found in services');
                return;
            }

            // 使用 Symbol 解析 MessageHub（跨包访问需要使用 Symbol）
            const messageHub = services.resolve<MessageHub>(IMessageHub);
            if (!messageHub) {
                logger.error('MessageHub not found in services');
                return;
            }

            const provider = new BehaviorTreeNodeInspectorProvider();
            provider.setMessageHub(messageHub);

            inspectorRegistry.register(provider);
            logger.info('BehaviorTreeNodeInspectorProvider registered');
        } catch (error) {
            logger.error('Failed to register inspector provider:', error);
        }
    }

    getPanels(): PanelDescriptor[] {
        return [
            {
                id: 'behavior-tree-editor',
                title: 'Behavior Tree Editor',
                position: PanelPosition.Center,
                closable: true,
                component: BehaviorTreeEditorPanel,
                order: 100,
                isDynamic: true
            }
        ];
    }

    getFileCreationTemplates(): FileCreationTemplate[] {
        return [{
            id: 'behavior-tree',
            label: 'Behavior Tree',
            extension: 'btree',
            icon: 'GitBranch',
            getContent: (fileName: string) => {
                const rootNode = createRootNode();
                const rootNodeData = {
                    id: rootNode.id,
                    type: rootNode.template.type,
                    displayName: rootNode.template.displayName,
                    data: rootNode.data,
                    position: {
                        x: rootNode.position.x,
                        y: rootNode.position.y
                    },
                    children: []
                };

                const emptyTree = {
                    name: fileName.replace('.btree', ''),
                    nodes: [rootNodeData],
                    connections: [],
                    variables: {}
                };

                return JSON.stringify(emptyTree, null, 2);
            }
        }];
    }

    getFileActionHandlers(): FileActionHandler[] {
        return [{
            extensions: ['btree'],
            onDoubleClick: async (filePath: string) => {
                if (this.services) {
                    // 使用 ServiceToken.id 解析服务
                    // Resolve service using ServiceToken.id
                    const service = this.services.resolve<IBehaviorTreeService>(BehaviorTreeServiceToken.id);
                    if (service) {
                        await service.loadFromFile(filePath);
                    }
                }
            }
        }];
    }

    getEntityCreationTemplates(): EntityCreationTemplate[] {
        return [{
            id: 'behavior-tree-entity',
            label: 'AI Entity',
            icon: 'GitBranch',
            category: 'other',
            order: 100,
            create: (_parentEntityId?: number): number => {
                const scene = PluginAPI.scene;
                const entityStore = PluginAPI.entityStore;
                const messageHub = PluginAPI.messageHub;

                // 统计现有 AI Entity 数量
                const aiEntityCount = entityStore.getAllEntities()
                    .filter((e: any) => e.name.startsWith('AI Entity')).length;
                const entityName = `AI Entity ${aiEntityCount + 1}`;

                // 创建实体
                const entity = scene.createEntity(entityName);

                // 添加 Transform 组件
                entity.addComponent(new TransformComponent());

                // 添加行为树运行时组件
                const btComponent = new BehaviorTreeRuntimeComponent();
                btComponent.autoStart = true;
                entity.addComponent(btComponent);

                // 注册到实体存储
                entityStore.addEntity(entity);

                // 发送通知
                messageHub.publish('entity:added', { entity });
                messageHub.publish('scene:modified', {});

                // 选中新创建的实体
                entityStore.selectEntity(entity);

                logger.info(`Created AI Entity: ${entity.id}`);
                return entity.id;
            }
        }];
    }
}

// Create the complete plugin with editor module
export const BehaviorTreePlugin: IEditorPlugin = {
    manifest,
    runtimeModule: new BehaviorTreeRuntimeModule(),
    editorModule: new BehaviorTreeEditorModule(),
};

export { BehaviorTreeRuntimeModule };

// Re-exports for editor functionality
export { PluginContext } from './PluginContext';
export { BehaviorTreeEditorPanel } from './components/panels/BehaviorTreeEditorPanel';
export * from './services/BehaviorTreeService';
export * from './tokens';
export * from './providers/BehaviorTreeNodeInspectorProvider';

export * from './domain';
export * from './application/commands/tree';
export * from './application/use-cases';
export * from './application/services/BlackboardManager';
export * from './application/services/ExecutionController';
export * from './application/services/GlobalBlackboardService';
export * from './application/interfaces/IExecutionHooks';
export * from './application/state/BehaviorTreeDataStore';
export * from './hooks';
export * from './stores';
export type { EditorConfig } from './types';
export * from './infrastructure/factories/NodeFactory';
export * from './infrastructure/serialization/BehaviorTreeSerializer';
export * from './infrastructure/validation/BehaviorTreeValidator';
export * from './infrastructure/events/EditorEventBus';
export * from './infrastructure/services/NodeRegistryService';
export * from './utils/BehaviorTreeExecutor';
export * from './utils/DOMCache';
export * from './utils/portUtils';
export * from './utils/RuntimeLoader';
export * from './compiler/BehaviorTreeCompiler';
export {
    ICON_MAP,
    ROOT_NODE_TEMPLATE,
    DEFAULT_EDITOR_CONFIG
} from './config/editorConstants';
export * from './interfaces/IEditorExtensions';
