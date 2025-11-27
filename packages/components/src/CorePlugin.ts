/**
 * Core Components Plugin
 * 核心组件插件
 *
 * 提供基础的 Transform、Sprite、Camera 等核心组件
 * 这是一个核心插件，不可禁用
 */

import type { ComponentRegistry as ComponentRegistryType, Scene, ServiceContainer } from '@esengine/ecs-framework';

// Components
import { TransformComponent } from './TransformComponent';
import { SpriteComponent } from './SpriteComponent';
import { SpriteAnimatorComponent } from './SpriteAnimatorComponent';
import { CameraComponent } from './CameraComponent';

// Systems
import { SpriteAnimatorSystem } from './systems/SpriteAnimatorSystem';


/**
 * 系统创建上下文
 */
export interface SystemContext {
    isEditor: boolean;
    engineBridge?: any;
    renderSystem?: any;
    [key: string]: any;
}

/**
 * 插件描述符类型
 */
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

/**
 * 运行时模块加载器接口
 */
export interface IRuntimeModuleLoader {
    registerComponents(registry: typeof ComponentRegistryType): void;
    registerServices?(services: ServiceContainer): void;
    createSystems?(scene: Scene, context: SystemContext): void;
    onInitialize?(): Promise<void>;
    onDestroy?(): void;
}

/**
 * 插件加载器接口
 */
export interface IPluginLoader {
    readonly descriptor: PluginDescriptor;
    readonly runtimeModule?: IRuntimeModuleLoader;
    readonly editorModule?: any;
}

/**
 * 核心组件运行时模块
 */
export class CoreRuntimeModule implements IRuntimeModuleLoader {
    registerComponents(registry: typeof ComponentRegistryType): void {
        registry.register(TransformComponent);
        registry.register(SpriteComponent);
        registry.register(SpriteAnimatorComponent);
        registry.register(CameraComponent);
    }

    createSystems(scene: Scene, context: SystemContext): void {
        const animatorSystem = new SpriteAnimatorSystem();

        if (context.isEditor) {
            animatorSystem.enabled = false;
        }

        scene.addSystem(animatorSystem);
        context.animatorSystem = animatorSystem;
    }
}

/**
 * 插件描述符
 */
const descriptor: PluginDescriptor = {
    id: '@esengine/ecs-components',
    name: 'Core Components',
    version: '1.0.0',
    description: 'Transform, Sprite, Camera 等核心组件',
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

/**
 * 核心组件插件
 */
export const CorePlugin: IPluginLoader = {
    descriptor,
    runtimeModule: new CoreRuntimeModule(),
};

export default CorePlugin;
