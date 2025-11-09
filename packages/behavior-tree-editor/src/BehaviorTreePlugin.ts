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
        console.log('[BehaviorTreePlugin] Installing behavior tree editor plugin...');

        this.registerServices(services);
        this.registerCompilers(services);
        this.registerInspectors(services);
        this.registerFileActions(services);

        console.log('[BehaviorTreePlugin] Behavior tree editor plugin installed');
    }

    async uninstall(): Promise<void> {
        console.log('[BehaviorTreePlugin] Uninstalling behavior tree editor plugin...');
    }

    registerPanels(): PanelDescriptor[] {
        return [
            {
                id: 'behavior-tree-editor',
                title: 'Behavior Tree Editor',
                position: PanelPosition.Center,
                closable: true,
                component: BehaviorTreeEditorPanel,
                order: 100
            }
        ];
    }

    private registerServices(services: ServiceContainer): void {
        services.registerSingleton(BehaviorTreeService);
        console.log('[BehaviorTreePlugin] Services registered');
    }

    private registerCompilers(services: ServiceContainer): void {
        const compilerRegistry = services.resolve(CompilerRegistry);
        if (compilerRegistry) {
            const compiler = new BehaviorTreeCompiler();
            compilerRegistry.register(compiler);
            console.log('[BehaviorTreePlugin] Compiler registered');
        }
    }

    private registerInspectors(services: ServiceContainer): void {
        const inspectorRegistry = services.resolve(InspectorRegistry);
        if (inspectorRegistry) {
            const provider = new BehaviorTreeNodeInspectorProvider();
            inspectorRegistry.register(provider);
            console.log('[BehaviorTreePlugin] Inspector provider registered');
        }
    }

    private registerFileActions(services: ServiceContainer): void {
        const fileActionRegistry = services.resolve(FileActionRegistry);
        if (!fileActionRegistry) {
            console.warn('[BehaviorTreePlugin] FileActionRegistry not found');
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

        console.log('[BehaviorTreePlugin] File actions registered');
    }
}
