import type { IScene, ServiceContainer } from '@esengine/ecs-framework';
import { ComponentRegistry, Core } from '@esengine/ecs-framework';
import type { IRuntimeModule, IPlugin, PluginDescriptor, SystemContext } from '@esengine/engine-core';
import type { AssetManager } from '@esengine/asset-system';

import { BehaviorTreeRuntimeComponent } from './execution/BehaviorTreeRuntimeComponent';
import { BehaviorTreeExecutionSystem } from './execution/BehaviorTreeExecutionSystem';
import { BehaviorTreeAssetManager } from './execution/BehaviorTreeAssetManager';
import { GlobalBlackboardService } from './Services/GlobalBlackboardService';
import { BehaviorTreeLoader } from './loaders/BehaviorTreeLoader';
import { BehaviorTreeAssetType } from './index';

export interface BehaviorTreeSystemContext extends SystemContext {
    behaviorTreeSystem?: BehaviorTreeExecutionSystem;
    assetManager?: AssetManager;
}

class BehaviorTreeRuntimeModule implements IRuntimeModule {
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
        const btContext = context as BehaviorTreeSystemContext;

        if (!this._loaderRegistered && btContext.assetManager) {
            btContext.assetManager.registerLoader(BehaviorTreeAssetType, new BehaviorTreeLoader());
            this._loaderRegistered = true;
        }

        const behaviorTreeSystem = new BehaviorTreeExecutionSystem(Core);

        if (btContext.assetManager) {
            behaviorTreeSystem.setAssetManager(btContext.assetManager);
        }

        if (btContext.isEditor) {
            behaviorTreeSystem.enabled = false;
        }

        scene.addSystem(behaviorTreeSystem);
        btContext.behaviorTreeSystem = behaviorTreeSystem;
    }
}

const descriptor: PluginDescriptor = {
    id: '@esengine/behavior-tree',
    name: 'Behavior Tree',
    version: '1.0.0',
    description: 'AI behavior tree system',
    category: 'ai',
    enabledByDefault: false,
    isEnginePlugin: true
};

export const BehaviorTreePlugin: IPlugin = {
    descriptor,
    runtimeModule: new BehaviorTreeRuntimeModule()
};

export { BehaviorTreeRuntimeModule };
