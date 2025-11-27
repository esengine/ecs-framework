/**
 * Behavior Tree Module Loader
 * 行为树模块加载器
 *
 * 实现 IModuleLoader 接口，用于 ModuleRegistry
 */

import type { IModuleLoader, ModuleDescriptor, ModuleSystemContext } from '@esengine/ecs-framework';
import type { ComponentRegistry as ComponentRegistryType, Core as CoreType } from '@esengine/ecs-framework';
import type { Scene } from '@esengine/ecs-framework';
import { Core } from '@esengine/ecs-framework';

// Runtime
import { BehaviorTreeRuntimeComponent } from './Runtime/BehaviorTreeRuntimeComponent';
import { BehaviorTreeExecutionSystem } from './Runtime/BehaviorTreeExecutionSystem';
import { BehaviorTreeAssetManager } from './Runtime/BehaviorTreeAssetManager';

// Services
import { GlobalBlackboardService } from './Services/GlobalBlackboardService';

/**
 * BehaviorTree 模块描述
 */
const descriptor: ModuleDescriptor = {
    id: 'esengine.behavior-tree',
    name: 'Behavior Tree System',
    description: 'AI 行为树系统，支持可视化编辑',
    category: 'ai',
    version: '1.0.0',
    dependencies: ['esengine.core'],
    isCore: false,
    icon: 'GitBranch'
};

/**
 * BehaviorTree 模块加载器
 */
export const BehaviorTreeModule: IModuleLoader = {
    descriptor,

    registerComponents(registry: typeof ComponentRegistryType): void {
        registry.register(BehaviorTreeRuntimeComponent);
    },

    registerServices(core: typeof CoreType): void {
        if (!core.services.isRegistered(GlobalBlackboardService)) {
            core.services.registerSingleton(GlobalBlackboardService);
        }
        if (!core.services.isRegistered(BehaviorTreeAssetManager)) {
            core.services.registerSingleton(BehaviorTreeAssetManager);
        }
    },

    createSystems(scene: Scene, context: ModuleSystemContext): void {
        const behaviorTreeSystem = new BehaviorTreeExecutionSystem(Core);

        // 编辑器模式下默认禁用
        if (context.isEditor) {
            behaviorTreeSystem.enabled = false;
        }

        scene.addSystem(behaviorTreeSystem);
        context.behaviorTreeSystem = behaviorTreeSystem;
    }
};

export default BehaviorTreeModule;
