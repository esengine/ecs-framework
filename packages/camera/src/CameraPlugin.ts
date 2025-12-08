import type { ComponentRegistry as ComponentRegistryType } from '@esengine/esengine';
import type { IRuntimeModule, IPlugin, ModuleManifest } from '@esengine/engine-core';
import { CameraComponent } from './CameraComponent';

class CameraRuntimeModule implements IRuntimeModule {
    registerComponents(registry: typeof ComponentRegistryType): void {
        registry.register(CameraComponent);
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
