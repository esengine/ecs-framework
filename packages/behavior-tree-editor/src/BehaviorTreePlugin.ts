import type { Core, ServiceContainer } from '@esengine/ecs-framework';
import { IEditorPlugin, EditorPluginCategory, CompilerRegistry } from '@esengine/editor-core';
import { BehaviorTreeService } from './services/BehaviorTreeService';
import { BehaviorTreeCompiler } from './compiler/BehaviorTreeCompiler';

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

    async install(_core: Core, services: ServiceContainer): Promise<void> {
        console.log('[BehaviorTreePlugin] Installing behavior tree editor plugin...');

        this.registerServices(services);
        this.registerCompilers(services);

        console.log('[BehaviorTreePlugin] Behavior tree editor plugin installed');
    }

    async uninstall(): Promise<void> {
        console.log('[BehaviorTreePlugin] Uninstalling behavior tree editor plugin...');
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
