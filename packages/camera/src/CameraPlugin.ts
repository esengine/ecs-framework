import type { ComponentRegistry as ComponentRegistryType, IScene } from '@esengine/ecs-framework';
import type { IRuntimeModule, IPlugin, ModuleManifest, SystemContext } from '@esengine/engine-core';
import { EngineBridgeToken } from '@esengine/engine-core';
import { CameraComponent } from './CameraComponent';
import { CameraSystem } from './CameraSystem';

class CameraRuntimeModule implements IRuntimeModule {
    registerComponents(registry: typeof ComponentRegistryType): void {
        registry.register(CameraComponent);
    }

    createSystems(scene: IScene, context: SystemContext): void {
        // 从服务注册表获取 EngineBridge | Get EngineBridge from service registry
        const bridge = context.services.get(EngineBridgeToken);
        if (!bridge) {
            console.warn('[CameraPlugin] EngineBridge not found, CameraSystem will not be created');
            return;
        }

        // 创建并添加 CameraSystem | Create and add CameraSystem
        const cameraSystem = new CameraSystem(bridge);
        scene.addSystem(cameraSystem);
    }
}

const manifest: ModuleManifest = {
    id: 'camera',
    name: '@esengine/camera',
    displayName: 'Camera',
    version: '1.0.0',
    description: '2D/3D 相机组件',
    category: 'Rendering',
    isCore: false,
    defaultEnabled: true,
    isEngineModule: true,
    dependencies: ['core', 'math'],
    exports: { components: ['CameraComponent'] }
};

export const CameraPlugin: IPlugin = {
    manifest,
    runtimeModule: new CameraRuntimeModule()
};
