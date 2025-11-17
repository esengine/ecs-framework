import { singleton } from 'tsyringe';
import { Core } from '@esengine/ecs-framework';
import { CompilerRegistry, IEditorModule, IModuleContext, PanelPosition } from '@esengine/editor-core';
import { BehaviorTreeService } from './services/BehaviorTreeService';
import { BehaviorTreeCompiler } from './compiler/BehaviorTreeCompiler';
import { BehaviorTreeNodeInspectorProvider } from './providers/BehaviorTreeNodeInspectorProvider';
import { BehaviorTreeEditorPanel } from './components/panels/BehaviorTreeEditorPanel';

@singleton()
export class BehaviorTreeModule implements IEditorModule {
    readonly id = 'behavior-tree';
    readonly name = 'Behavior Tree Editor';
    readonly version = '1.0.0';

    async load(context: IModuleContext): Promise<void> {
        console.log('[BehaviorTreeModule] Loading behavior tree editor module...');

        this.registerServices(context);
        this.registerCompilers();
        this.registerInspectors(context);
        this.registerCommands(context);
        this.registerPanels(context);
        this.subscribeEvents(context);

        console.log('[BehaviorTreeModule] Behavior tree editor module loaded');
    }

    private registerServices(context: IModuleContext): void {
        context.container.register(BehaviorTreeService, { useClass: BehaviorTreeService });
        console.log('[BehaviorTreeModule] Services registered');
    }

    private registerCompilers(): void {
        const compilerRegistry = Core.services.resolve(CompilerRegistry);
        if (compilerRegistry) {
            const compiler = new BehaviorTreeCompiler();
            compilerRegistry.register(compiler);
            console.log('[BehaviorTreeModule] Compiler registered');
        }
    }

    private registerInspectors(context: IModuleContext): void {
        const provider = new BehaviorTreeNodeInspectorProvider();
        context.inspectorRegistry.register(provider);
        console.log('[BehaviorTreeModule] Inspector provider registered');
    }

    async unload(): Promise<void> {
        console.log('[BehaviorTreeModule] Unloading behavior tree editor module...');
    }

    private registerCommands(context: IModuleContext): void {
        context.commands.register({
            id: 'behavior-tree.new',
            label: 'New Behavior Tree',
            icon: 'file-plus',
            execute: async () => {
                const service = context.container.resolve(BehaviorTreeService);
                await service.createNew();
            }
        });

        context.commands.register({
            id: 'behavior-tree.open',
            label: 'Open Behavior Tree',
            icon: 'folder-open',
            execute: async () => {
                console.log('Open behavior tree');
            }
        });

        context.commands.register({
            id: 'behavior-tree.save',
            label: 'Save Behavior Tree',
            icon: 'save',
            keybinding: { key: 'S', ctrl: true },
            execute: async () => {
                console.log('Save behavior tree');
            }
        });
    }

    private registerPanels(context: IModuleContext): void {
        console.log('[BehaviorTreeModule] Registering panels...');

        context.panels.register({
            id: 'behavior-tree-editor',
            title: '行为树编辑器',
            icon: 'GitBranch',
            component: BehaviorTreeEditorPanel,
            position: PanelPosition.Center,
            defaultSize: 400,
            closable: true,
            isDynamic: true
        });

        console.log('[BehaviorTreeModule] Panel registered: behavior-tree-editor');
    }

    private subscribeEvents(_context: IModuleContext): void {
        // 文件加载由 BehaviorTreeEditorPanel 处理
    }
}
