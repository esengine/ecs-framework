/**
 * Core Module Loader
 * 核心模块加载器
 *
 * 提供基础的 Transform、Sprite、Camera 等核心组件
 * 这是一个核心模块，不可禁用
 */

import type { IModuleLoader, ModuleDescriptor, ModuleSystemContext } from '@esengine/ecs-framework';
import type { ComponentRegistry as ComponentRegistryType } from '@esengine/ecs-framework';
import type { Scene } from '@esengine/ecs-framework';

// Components
import { TransformComponent } from './TransformComponent';
import { SpriteComponent } from './SpriteComponent';
import { SpriteAnimatorComponent } from './SpriteAnimatorComponent';
import { CameraComponent } from './CameraComponent';

// Systems
import { SpriteAnimatorSystem } from './systems/SpriteAnimatorSystem';

/**
 * 核心模块描述
 */
const descriptor: ModuleDescriptor = {
    id: 'esengine.core',
    name: 'Core Components',
    description: '核心组件：Transform、Sprite、Camera 等基础组件',
    category: 'core',
    version: '1.0.0',
    dependencies: [],
    isCore: true,
    icon: 'Settings'
};

/**
 * 核心模块加载器
 */
export const CoreModule: IModuleLoader = {
    descriptor,

    registerComponents(registry: typeof ComponentRegistryType): void {
        registry.register(TransformComponent);
        registry.register(SpriteComponent);
        registry.register(SpriteAnimatorComponent);
        registry.register(CameraComponent);
    },

    createSystems(scene: Scene, context: ModuleSystemContext): void {
        const animatorSystem = new SpriteAnimatorSystem();

        if (context.isEditor) {
            animatorSystem.enabled = false;
        }

        scene.addSystem(animatorSystem);

        context.animatorSystem = animatorSystem;
    }
};

export default CoreModule;
