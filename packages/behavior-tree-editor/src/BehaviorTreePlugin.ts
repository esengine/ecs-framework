import type { Core, ServiceContainer } from '@esengine/ecs-framework';
import {
    IEditorPlugin,
    EditorPluginCategory,
    CompilerRegistry,
    InspectorRegistry,
    PanelPosition,
    type FileCreationTemplate,
    type FileActionHandler,
    type PanelDescriptor
} from '@esengine/editor-core';
import { BehaviorTreeService } from './services/BehaviorTreeService';
import { FileSystemService } from './services/FileSystemService';
import { BehaviorTreeCompiler } from './compiler/BehaviorTreeCompiler';
import { BehaviorTreeNodeInspectorProvider } from './providers/BehaviorTreeNodeInspectorProvider';
import { BehaviorTreeEditorPanel } from './components/panels/BehaviorTreeEditorPanel';
import { useBehaviorTreeDataStore } from './stores';
import { createElement } from 'react';
import { GitBranch } from 'lucide-react';
import { createRootNode } from './domain/constants/RootNode';
import type { IService, ServiceType } from '@esengine/ecs-framework';

export class BehaviorTreePlugin implements IEditorPlugin {
    readonly name = '@esengine/behavior-tree-editor';
    readonly version = '1.0.0';
    readonly displayName = 'Behavior Tree Editor';
    readonly category = EditorPluginCategory.Tool;
    readonly description = 'Visual behavior tree editor for game AI development';
    readonly icon = 'GitBranch';

    private services?: ServiceContainer;
    private registeredServices: Set<ServiceType<IService>> = new Set();
    private fileActionHandler?: FileActionHandler;
    private fileCreationTemplate?: FileCreationTemplate;

    async install(core: Core, services: ServiceContainer): Promise<void> {
        this.services = services;
        this.registerServices(services);
        this.registerCompilers(services);
        this.registerInspectors(services);
        this.registerFileActions(services);
    }

    async uninstall(): Promise<void> {
        if (this.services) {
            for (const serviceType of this.registeredServices) {
                this.services.unregister(serviceType);
            }
        }

        this.registeredServices.clear();
        useBehaviorTreeDataStore.getState().reset();
        this.services = undefined;
    }

    registerPanels(): PanelDescriptor[] {
        return [
            {
                id: 'behavior-tree-editor',
                title: 'Behavior Tree Editor',
                position: PanelPosition.Center,
                closable: true,
                component: BehaviorTreeEditorPanel,
                order: 100,
                isDynamic: true  // 标记为动态面板
            }
        ];
    }

    private registerServices(services: ServiceContainer): void {
        // 先注册 FileSystemService（BehaviorTreeService 依赖它）
        if (services.isRegistered(FileSystemService)) {
            services.unregister(FileSystemService);
        }
        services.registerSingleton(FileSystemService);
        this.registeredServices.add(FileSystemService);

        // 再注册 BehaviorTreeService
        if (services.isRegistered(BehaviorTreeService)) {
            services.unregister(BehaviorTreeService);
        }
        services.registerSingleton(BehaviorTreeService);
        this.registeredServices.add(BehaviorTreeService);
    }

    private registerCompilers(services: ServiceContainer): void {
        const compilerRegistry = services.resolve(CompilerRegistry);
        if (compilerRegistry) {
            const compiler = new BehaviorTreeCompiler();
            compilerRegistry.register(compiler);
        }
    }

    private registerInspectors(services: ServiceContainer): void {
        const inspectorRegistry = services.resolve(InspectorRegistry);
        if (inspectorRegistry) {
            const provider = new BehaviorTreeNodeInspectorProvider();
            inspectorRegistry.register(provider);
        }
    }

    private registerFileActions(services: ServiceContainer): void {
        this.fileCreationTemplate = {
            label: 'Behavior Tree',
            extension: 'btree',
            defaultFileName: 'NewBehaviorTree',
            icon: createElement(GitBranch, { size: 16 }),
            createContent: (fileName: string) => {
                // 创建根节点
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
        };

        this.fileActionHandler = {
            extensions: ['btree'],
            onDoubleClick: async (filePath: string) => {
                const service = services.resolve(BehaviorTreeService);
                if (service) {
                    await service.loadFromFile(filePath);
                }
            }
        };
    }

    registerFileActionHandlers(): FileActionHandler[] {
        return this.fileActionHandler ? [this.fileActionHandler] : [];
    }

    registerFileCreationTemplates(): FileCreationTemplate[] {
        return this.fileCreationTemplate ? [this.fileCreationTemplate] : [];
    }
}
