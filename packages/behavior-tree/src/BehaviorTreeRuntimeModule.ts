/**
 * Behavior Tree Runtime Module (Pure runtime, no editor dependencies)
 * 行为树运行时模块（纯运行时，无编辑器依赖）
 */

import type { IScene, ServiceContainer } from '@esengine/ecs-framework';
import { ComponentRegistry, Core } from '@esengine/ecs-framework';
import type { IRuntimeModuleLoader, SystemContext } from '@esengine/ecs-components';
import type { AssetManager } from '@esengine/asset-system';

import { BehaviorTreeRuntimeComponent } from './execution/BehaviorTreeRuntimeComponent';
import { BehaviorTreeExecutionSystem } from './execution/BehaviorTreeExecutionSystem';
import { BehaviorTreeAssetManager } from './execution/BehaviorTreeAssetManager';
import { GlobalBlackboardService } from './Services/GlobalBlackboardService';
import { BehaviorTreeLoader } from './loaders/BehaviorTreeLoader';
import { BehaviorTreeAssetType } from './index';

/**
 * Behavior Tree Runtime Module
 * 行为树运行时模块
 */
export class BehaviorTreeRuntimeModule implements IRuntimeModuleLoader {
    private _loaderRegistered = false;

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
        // 注册行为树加载器到 AssetManager
        // Register behavior tree loader to AssetManager
        const assetManager = context.assetManager as AssetManager | undefined;
        console.log('[BehaviorTreeRuntimeModule] createSystems called, assetManager:', assetManager ? 'exists' : 'null');

        if (!this._loaderRegistered && assetManager) {
            assetManager.registerLoader(BehaviorTreeAssetType, new BehaviorTreeLoader());
            this._loaderRegistered = true;
            console.log('[BehaviorTreeRuntimeModule] Registered BehaviorTreeLoader for type:', BehaviorTreeAssetType);
        }

        const behaviorTreeSystem = new BehaviorTreeExecutionSystem(Core);

        // 设置 AssetManager 引用
        // Set AssetManager reference
        if (assetManager) {
            behaviorTreeSystem.setAssetManager(assetManager);
            console.log('[BehaviorTreeRuntimeModule] Set assetManager on behaviorTreeSystem');
        } else {
            console.warn('[BehaviorTreeRuntimeModule] assetManager is null, cannot set on behaviorTreeSystem');
        }

        if (context.isEditor) {
            behaviorTreeSystem.enabled = false;
        }

        scene.addSystem(behaviorTreeSystem);
        context.behaviorTreeSystem = behaviorTreeSystem;
    }
}
