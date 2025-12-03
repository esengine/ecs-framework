/**
 * 插件系统核心类型定义
 * Plugin system core type definitions
 *
 * 这是插件类型的唯一定义源，editor-core 重新导出并扩展这些类型。
 * This is the single source of truth for plugin types. editor-core re-exports and extends them.
 */

import type { ComponentRegistry as ComponentRegistryType, IScene, ServiceContainer } from '@esengine/ecs-framework';
import { TransformComponent } from './TransformComponent';
import type { ModuleManifest } from './ModuleManifest';

/**
 * 加载阶段 - 控制插件模块的加载顺序
 * Loading phase - controls the loading order of plugin modules
 */
export type LoadingPhase =
    | 'earliest'      // 最早加载（核心模块） | Earliest (core modules)
    | 'preDefault'    // 默认之前 | Before default
    | 'default'       // 默认阶段 | Default phase
    | 'postDefault'   // 默认之后 | After default
    | 'postEngine';   // 引擎初始化后 | After engine init

// ============================================================================
// 系统上下文 | System Context
// ============================================================================

/**
 * 系统创建上下文
 * System creation context
 */
export interface SystemContext {
    /** 是否为编辑器模式 | Is editor mode */
    isEditor: boolean;
    /** 引擎桥接（如有） | Engine bridge (if available) */
    engineBridge?: any;
    /** 渲染系统（如有） | Render system (if available) */
    renderSystem?: any;
    /** 其他已创建的系统引用 | Other created system references */
    [key: string]: any;
}

// ============================================================================
// 运行时模块 | Runtime Module
// ============================================================================

/**
 * 运行时模块接口
 * Runtime module interface
 */
export interface IRuntimeModule {
    /**
     * 注册组件到 ComponentRegistry
     * Register components to ComponentRegistry
     */
    registerComponents?(registry: typeof ComponentRegistryType): void;

    /**
     * 注册服务到 ServiceContainer
     * Register services to ServiceContainer
     */
    registerServices?(services: ServiceContainer): void;

    /**
     * 为场景创建系统
     * Create systems for scene
     */
    createSystems?(scene: IScene, context: SystemContext): void;

    /**
     * 所有系统创建完成后调用
     * Called after all systems are created
     */
    onSystemsCreated?(scene: IScene, context: SystemContext): void;

    /**
     * 模块初始化完成回调
     * Module initialization complete callback
     */
    onInitialize?(): Promise<void>;

    /**
     * 模块销毁回调
     * Module destroy callback
     */
    onDestroy?(): void;
}

// ============================================================================
// 插件接口 | Plugin Interface
// ============================================================================

/**
 * 插件接口
 * Plugin interface
 *
 * 这是所有插件包导出的统一类型。
 * This is the unified type that all plugin packages export.
 */
export interface IPlugin {
    /** 模块清单 | Module manifest */
    readonly manifest: ModuleManifest;
    /** 运行时模块（可选） | Runtime module (optional) */
    readonly runtimeModule?: IRuntimeModule;
    /** 编辑器模块（可选，类型为 any 以避免循环依赖） | Editor module (optional, typed as any to avoid circular deps) */
    readonly editorModule?: any;
}

// ============================================================================
// Engine Core 插件 | Engine Core Plugin
// ============================================================================

class EngineRuntimeModule implements IRuntimeModule {
    registerComponents(registry: typeof ComponentRegistryType): void {
        registry.register(TransformComponent);
    }
}

const manifest: ModuleManifest = {
    id: 'engine-core',
    name: '@esengine/engine-core',
    displayName: 'Engine Core',
    description: 'Transform 等核心组件',
    version: '1.0.0',
    category: 'Core',
    icon: 'Box',
    isCore: true,
    defaultEnabled: true,
    isEngineModule: true,
    dependencies: ['core', 'math'],
    exports: {
        components: ['TransformComponent', 'HierarchyComponent'],
        systems: ['TransformSystem', 'HierarchySystem']
    }
};

export const EnginePlugin: IPlugin = {
    manifest,
    runtimeModule: new EngineRuntimeModule()
};
