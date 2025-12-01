import type { ComponentRegistry as ComponentRegistryType } from '@esengine/ecs-framework';
import type { IRuntimeModule, IPlugin, PluginDescriptor } from '@esengine/engine-core';
import { AudioSourceComponent } from './AudioSourceComponent';

class AudioRuntimeModule implements IRuntimeModule {
    registerComponents(registry: typeof ComponentRegistryType): void {
        registry.register(AudioSourceComponent);
    }
}

const descriptor: PluginDescriptor = {
    id: '@esengine/audio',
    name: 'Audio',
    version: '1.0.0',
    description: '音频组件',
    category: 'audio',
    enabledByDefault: true,
    isEnginePlugin: true
};

export const AudioPlugin: IPlugin = {
    descriptor,
    runtimeModule: new AudioRuntimeModule()
};
