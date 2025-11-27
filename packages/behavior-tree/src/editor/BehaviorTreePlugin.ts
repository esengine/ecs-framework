/**
 * Behavior Tree Unified Plugin
 * 行为树统一插件
 */

import type { IScene, ServiceContainer } from '@esengine/ecs-framework';
import { ComponentRegistry, Core } from '@esengine/ecs-framework';
import type {
    IPluginLoader,
    IRuntimeModuleLoader,
    PluginDescriptor,
    SystemContext
} from '@esengine/editor-runtime';

// Runtime imports
import { BehaviorTreeRuntimeComponent } from '../Runtime/BehaviorTreeRuntimeComponent';
import { BehaviorTreeExecutionSystem } from '../Runtime/BehaviorTreeExecutionSystem';
import { BehaviorTreeAssetManager } from '../Runtime/BehaviorTreeAssetManager';
import { GlobalBlackboardService } from '../Services/GlobalBlackboardService';

/**
 * 插件描述符
 */
export const descriptor: PluginDescriptor = {
    id: '@esengine/behavior-tree',
    name: 'Behavior Tree System',
    version: '1.0.0',
    description: 'AI 行为树系统，支持可视化编辑和运行时执行',
    category: 'ai',
    enabledByDefault: true,
    canContainContent: false,
    isEnginePlugin: false,
    modules: [
        {
            name: 'BehaviorTreeRuntime',
            type: 'runtime',
            loadingPhase: 'default',
            entry: './src/index.ts'
        },
        {
            name: 'BehaviorTreeEditor',
            type: 'editor',
            loadingPhase: 'default',
            entry: './src/editor/index.ts'
        }
    ],
    dependencies: [
        { id: '@esengine/core', version: '>=1.0.0' }
    ],
    icon: 'GitBranch'
};

/**
 * Behavior Tree Runtime Module
 * 行为树运行时模块
 */
export class BehaviorTreeRuntimeModule implements IRuntimeModuleLoader {
    registerComponents(registry: typeof ComponentRegistry): void {
        registry.register(BehaviorTreeRuntimeComponent);
    }

    registerServices(services: ServiceContainer): void {
        if (!services.isRegistered(GlobalBlackboardService)) {
            services.registerSingleton(GlobalBlackboardService);
        }
        if (!services.isRegistered(BehaviorTreeAssetManager)) {
            services.registerSingleton(BehaviorTreeAssetManager);
        }
    }

    createSystems(scene: IScene, context: SystemContext): void {
        const behaviorTreeSystem = new BehaviorTreeExecutionSystem(Core);

        // 编辑器模式下默认禁用
        if (context.isEditor) {
            behaviorTreeSystem.enabled = false;
        }

        scene.addSystem(behaviorTreeSystem);

        // 保存引用
        context.behaviorTreeSystem = behaviorTreeSystem;
    }
}

/**
 * Behavior Tree Plugin Loader
 * 行为树插件加载器
 *
 * 注意：editorModule 在 ./index.ts 中通过 createBehaviorTreePlugin() 设置
 */
export const BehaviorTreePlugin: IPluginLoader = {
    descriptor,
    runtimeModule: new BehaviorTreeRuntimeModule(),
    // editorModule 将在 index.ts 中设置
};

export default BehaviorTreePlugin;
