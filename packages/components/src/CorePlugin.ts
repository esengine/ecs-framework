import type { ComponentRegistry as ComponentRegistryType, IScene, ServiceContainer } from '@esengine/ecs-framework';
import { TransformComponent } from '@esengine/engine-core';
import { CameraComponent } from '@esengine/camera';
import { TextComponent } from './TextComponent';
import { AudioSourceComponent } from './AudioSourceComponent';

export interface SystemContext {
    isEditor: boolean;
    engineBridge?: any;
    renderSystem?: any;
    [key: string]: any;
}

export interface PluginDescriptor {
    id: string;
    name: string;
    version: string;
    description?: string;
    category?: string;
    loadingPhase?: string;
    enabledByDefault?: boolean;
    canContainContent?: boolean;
    isEnginePlugin?: boolean;
    modules?: Array<{
        name: string;
        type: string;
        entry: string;
    }>;
    dependencies?: Array<{
        id: string;
        version?: string;
    }>;
    icon?: string;
}

export interface IRuntimeModuleLoader {
    registerComponents(registry: typeof ComponentRegistryType): void;
    registerServices?(services: ServiceContainer): void;
    createSystems?(scene: IScene, context: SystemContext): void;
    onSystemsCreated?(scene: IScene, context: SystemContext): void;
    onInitialize?(): Promise<void>;
    onDestroy?(): void;
}

export interface IPluginLoader {
    readonly descriptor: PluginDescriptor;
    readonly runtimeModule?: IRuntimeModuleLoader;
    readonly editorModule?: any;
}

export class CoreRuntimeModule implements IRuntimeModuleLoader {
    registerComponents(registry: typeof ComponentRegistryType): void {
        registry.register(TransformComponent);
        registry.register(CameraComponent);
        registry.register(TextComponent);
        registry.register(AudioSourceComponent);
    }

    createSystems(_scene: IScene, _context: SystemContext): void {
    }
}

const descriptor: PluginDescriptor = {
    id: '@esengine/ecs-components',
    name: 'Core Components',
    version: '1.0.0',
    description: 'Transform, Camera, Text, AudioSource 等核心组件',
    category: 'core',
    loadingPhase: 'preDefault',
    enabledByDefault: true,
    canContainContent: false,
    isEnginePlugin: true,
    modules: [
        {
            name: 'CoreRuntime',
            type: 'runtime',
            entry: './src/index.ts'
        }
    ],
    icon: 'Settings'
};

export const CorePlugin: IPluginLoader = {
    descriptor,
    runtimeModule: new CoreRuntimeModule(),
};

export default CorePlugin;
