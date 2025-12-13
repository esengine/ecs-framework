import type { IScene, ServiceContainer } from '@esengine/ecs-framework';
import { ComponentRegistry } from '@esengine/ecs-framework';
import type { IRuntimeModule, IRuntimePlugin, ModuleManifest, SystemContext } from '@esengine/engine-core';
import { AssetManagerToken } from '@esengine/asset-system';

import { BehaviorTreeRuntimeComponent } from './execution/BehaviorTreeRuntimeComponent';
import { BehaviorTreeExecutionSystem } from './execution/BehaviorTreeExecutionSystem';
import { BehaviorTreeAssetManager } from './execution/BehaviorTreeAssetManager';
import { GlobalBlackboardService } from './Services/GlobalBlackboardService';
import { BehaviorTreeLoader } from './loaders/BehaviorTreeLoader';
import { BehaviorTreeAssetType } from './index';
import { BehaviorTreeSystemToken } from './tokens';

// 重新导出 tokens | Re-export tokens
export { BehaviorTreeSystemToken } from './tokens';

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
        // 从服务注册表获取依赖 | Get dependencies from service registry
        const assetManager = context.services.get(AssetManagerToken);

        if (!this._loaderRegistered && assetManager) {
            assetManager.registerLoader(BehaviorTreeAssetType, new BehaviorTreeLoader());
            this._loaderRegistered = true;
        }

        // 使用 context.services 中的 ECS 服务容器
        // Use ECS service container from context.services
        const ecsServices = (context as { ecsServices?: ServiceContainer }).ecsServices;
        const behaviorTreeSystem = new BehaviorTreeExecutionSystem(ecsServices);

        if (assetManager) {
            behaviorTreeSystem.setAssetManager(assetManager);
        }

        if (context.isEditor) {
            behaviorTreeSystem.enabled = false;
        }

        scene.addSystem(behaviorTreeSystem);

        // 注册服务到服务注册表 | Register service to service registry
        context.services.register(BehaviorTreeSystemToken, behaviorTreeSystem);
    }
}

const manifest: ModuleManifest = {
    id: 'behavior-tree',
    name: '@esengine/behavior-tree',
    displayName: 'Behavior Tree',
    version: '1.0.0',
    description: 'AI behavior tree system',
    category: 'AI',
    icon: 'GitBranch',
    isCore: false,
    defaultEnabled: false,
    isEngineModule: true,
    canContainContent: true,
    dependencies: ['core'],
    exports: { components: ['BehaviorTreeComponent'] },
    editorPackage: '@esengine/behavior-tree-editor'
};

export const BehaviorTreePlugin: IRuntimePlugin = {
    manifest,
    runtimeModule: new BehaviorTreeRuntimeModule()
};

export { BehaviorTreeRuntimeModule };
