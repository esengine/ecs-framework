import type { Core, ServiceContainer } from '@esengine/ecs-framework';
import {
    IEditorPlugin,
    EditorPluginCategory,
    CompilerRegistry,
    InspectorRegistry,
    FileActionRegistry,
    PanelPosition,
    type FileCreationTemplate,
    type FileActionHandler,
    type PanelDescriptor
} from '@esengine/editor-core';
import { BehaviorTreeService } from './services/BehaviorTreeService';
import { BehaviorTreeCompiler } from './compiler/BehaviorTreeCompiler';
import { BehaviorTreeNodeInspectorProvider } from './providers/BehaviorTreeNodeInspectorProvider';
import { BehaviorTreeEditorPanel } from './components/panels/BehaviorTreeEditorPanel';
import { createElement } from 'react';
import { GitBranch } from 'lucide-react';

export class BehaviorTreePlugin implements IEditorPlugin {
    readonly name = '@esengine/behavior-tree-editor';
    readonly version = '1.0.0';
    readonly displayName = 'Behavior Tree Editor';
    readonly category = EditorPluginCategory.Tool;
    readonly description = 'Visual behavior tree editor for game AI development';
    readonly icon = 'GitBranch';

    async install(core: Core, services: ServiceContainer): Promise<void> {
        this.registerServices(services);
        this.registerCompilers(services);
        this.registerInspectors(services);
        this.registerFileActions(services);
    }

    async uninstall(): Promise<void> {
        // 清理插件资源
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
        services.registerSingleton(BehaviorTreeService);
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
        const fileActionRegistry = services.resolve(FileActionRegistry);
        if (!fileActionRegistry) {
            return;
        }

        const creationTemplate: FileCreationTemplate = {
            label: 'Behavior Tree',
            extension: 'btree',
            defaultFileName: 'NewBehaviorTree',
            icon: createElement(GitBranch, { size: 16 }),
            createContent: (fileName: string) => {
                const emptyTree = {
                    name: fileName.replace('.btree', ''),
                    nodes: [],
                    connections: [],
                    variables: {}
                };

                return JSON.stringify(emptyTree, null, 2);
            }
        };

        fileActionRegistry.registerCreationTemplate(creationTemplate);

        const actionHandler: FileActionHandler = {
            extensions: ['btree'],
            onDoubleClick: async (filePath: string) => {
                const service = services.resolve(BehaviorTreeService);
                if (service) {
                    await service.loadFromFile(filePath);
                }
            }
        };

        fileActionRegistry.registerActionHandler(actionHandler);
    }
}
