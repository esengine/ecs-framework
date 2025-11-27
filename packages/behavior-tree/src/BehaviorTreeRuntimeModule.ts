/**
 * Behavior Tree Runtime Module (Pure runtime, no editor dependencies)
 * 行为树运行时模块（纯运行时，无编辑器依赖）
 */

import type { IScene, ServiceContainer } from '@esengine/ecs-framework';
import { ComponentRegistry, Core } from '@esengine/ecs-framework';
import type { IRuntimeModuleLoader, SystemContext } from '@esengine/ecs-components';

import { BehaviorTreeRuntimeComponent } from './execution/BehaviorTreeRuntimeComponent';
import { BehaviorTreeExecutionSystem } from './execution/BehaviorTreeExecutionSystem';
import { BehaviorTreeAssetManager } from './execution/BehaviorTreeAssetManager';
import { GlobalBlackboardService } from './Services/GlobalBlackboardService';

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

        if (context.isEditor) {
            behaviorTreeSystem.enabled = false;
        }

        scene.addSystem(behaviorTreeSystem);
        context.behaviorTreeSystem = behaviorTreeSystem;
    }
}
