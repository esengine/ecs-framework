import type { ComponentRegistry as ComponentRegistryType } from '@esengine/esengine';
import type { IRuntimeModule, IPlugin, ModuleManifest } from '@esengine/engine-core';
import { AudioSourceComponent } from './AudioSourceComponent';

class AudioRuntimeModule implements IRuntimeModule {
    registerComponents(registry: typeof ComponentRegistryType): void {
        registry.register(AudioSourceComponent);
    }
}

const manifest: ModuleManifest = {
    id: 'audio',
    name: '@esengine/audio',
    displayName: 'Audio',
    version: '1.0.0',
    description: '音频组件',
    category: 'Audio',
    isCore: false,
    defaultEnabled: true,
    isEngineModule: true,
    dependencies: ['core', 'asset-system'],
    exports: { components: ['AudioSourceComponent'] }
};

export const AudioPlugin: IPlugin = {
    manifest,
    runtimeModule: new AudioRuntimeModule()
};
