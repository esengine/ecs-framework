import type { Core, ServiceContainer } from '@esengine/ecs-framework';
import {
    IEditorPlugin,
    EditorPluginCategory,
    CompilerRegistry,
    MessageHub,
    FileActionHandler
} from '@esengine/editor-core';
import { BehaviorTreeService } from './services/BehaviorTreeService';
import { BehaviorTreeCompiler } from './compiler/BehaviorTreeCompiler';
import { useTreeStore } from './stores/useTreeStore';

/**
 * Behavior Tree Editor Plugin
 */
export class BehaviorTreePlugin implements IEditorPlugin {
    readonly name = '@esengine/behavior-tree-editor';
    readonly version = '1.0.0';
    readonly displayName = 'Behavior Tree Editor';
    readonly category = EditorPluginCategory.Tool;
    readonly description = 'Visual behavior tree editor for game AI development';
    readonly icon = 'GitBranch';

    private core?: Core;
    private services?: ServiceContainer;
    private messageHub?: MessageHub;

    async install(core: Core, services: ServiceContainer): Promise<void> {
        console.log('[BehaviorTreePlugin] Installing behavior tree editor plugin...');

        this.core = core;
        this.services = services;
        this.messageHub = services.resolve(MessageHub);

        this.registerServices(services);
        this.registerCompilers(services);

        console.log('[BehaviorTreePlugin] Behavior tree editor plugin installed');
    }

    async uninstall(): Promise<void> {
        console.log('[BehaviorTreePlugin] Uninstalling behavior tree editor plugin...');
        this.core = undefined;
        this.services = undefined;
        this.messageHub = undefined;
    }

    registerFileActionHandlers(): FileActionHandler[] {
        return [
            {
                extensions: ['btree'],
                onDoubleClick: async (filePath: string) => {
                    console.log('[BehaviorTreePlugin] onDoubleClick called for:', filePath);

                    if (this.messageHub) {
                        const store = useTreeStore.getState();
                        store.setIsOpen(true);
                        store.setPendingFilePath(filePath);

                        const fileName = filePath.split(/[\\/]/).pop()?.replace('.btree', '') || '行为树';

                        await this.messageHub.publish('dynamic-panel:open', {
                            panelId: 'behavior-tree-editor',
                            title: fileName
                        });

                        await this.messageHub.publish('behavior-tree:load-file', {
                            filePath
                        });
                    } else {
                        console.error('[BehaviorTreePlugin] MessageHub is not available!');
                    }
                },
                onOpen: async (filePath: string) => {
                    if (this.messageHub) {
                        const store = useTreeStore.getState();
                        store.setIsOpen(true);
                        store.setPendingFilePath(filePath);

                        const fileName = filePath.split(/[\\/]/).pop()?.replace('.btree', '') || '行为树';

                        await this.messageHub.publish('dynamic-panel:open', {
                            panelId: 'behavior-tree-editor',
                            title: fileName
                        });

                        await this.messageHub.publish('behavior-tree:load-file', {
                            filePath
                        });
                    }
                }
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
}
