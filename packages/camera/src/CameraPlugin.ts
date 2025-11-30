import type { ComponentRegistry as ComponentRegistryType } from '@esengine/ecs-framework';
import type { IRuntimeModule, IPlugin, PluginDescriptor } from '@esengine/engine-core';
import { CameraComponent } from './CameraComponent';

class CameraRuntimeModule implements IRuntimeModule {
    registerComponents(registry: typeof ComponentRegistryType): void {
        registry.register(CameraComponent);
    }
}

const descriptor: PluginDescriptor = {
    id: '@esengine/camera',
    name: 'Camera',
    version: '1.0.0',
    description: '2D/3D 相机组件',
    category: 'core',
    enabledByDefault: true,
    isEnginePlugin: true
};

export const CameraPlugin: IPlugin = {
    descriptor,
    runtimeModule: new CameraRuntimeModule()
};
