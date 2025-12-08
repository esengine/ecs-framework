/**
 * 插件系统核心类型定义
 * Plugin system core type definitions
 *
 * 这是运行时插件类型的唯一定义源。
 * 编辑器类型在 editor-core 中扩展这些类型。
 *
 * This is the single source of truth for runtime plugin types.
 * Editor types extend these in editor-core.
 *
 * @see docs/architecture/plugin-system-design.md
 */

import type { ComponentRegistry as ComponentRegistryType, IScene, ServiceContainer } from '@esengine/ecs-framework';
import { TransformComponent } from './TransformComponent';
import type { ModuleManifest } from './ModuleManifest';

// 从本地模块导入服务令牌系统（确保 tsup 生成的类型以 engine-core 为源）
// Import service token system from local module (ensures tsup generates types with engine-core as source)
import {
    PluginServiceRegistry,
    createServiceToken,
    TransformTypeToken,
    type ServiceToken
} from './PluginServiceRegistry';

// 导出服务令牌系统 | Export service token system
export {
    PluginServiceRegistry,
    createServiceToken,
    TransformTypeToken,
    type ServiceToken
};

// 重新导出 IEditorModuleBase（供编辑器插件使用）| Re-export for editor plugins
export type { IEditorModuleBase } from '@esengine/plugin-types';

// ============================================================================
// 加载阶段 | Loading Phase
// ============================================================================

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
 *
 * 包含运行时配置和插件服务注册表。
 * Contains runtime configuration and plugin service registry.
 *
 * @example
 * ```typescript
 * // 导入需要的 Token | Import needed tokens
 * import { Physics2DQueryToken } from '@esengine/physics-rapier2d';
 * import { AssetManagerToken } from '@esengine/asset-system';
 *
 * // 注册服务 | Register service
 * context.services.register(Physics2DQueryToken, physicsSystem);
 *
 * // 获取服务（可选）| Get service (optional)
 * const physics = context.services.get(Physics2DQueryToken);
 *
 * // 获取服务（必需）| Get service (required)
 * const physics = context.services.require(Physics2DQueryToken);
 * ```
 */
export interface SystemContext {
    /** 是否为编辑器模式 | Is editor mode */
    readonly isEditor: boolean;

    /**
     * 插件服务注册表
     * Plugin service registry
     *
     * 用于跨插件共享服务。
     * For sharing services between plugins.
     */
    readonly services: PluginServiceRegistry;
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
 * 使用泛型允许编辑器模块使用更具体的类型。
 *
 * This is the unified type that all plugin packages export.
 * Uses generics to allow editor modules to use more specific types.
 *
 * @example
 * ```typescript
 * // 纯运行时插件 | Pure runtime plugin
 * const MyPlugin: IPlugin = {
 *     manifest,
 *     runtimeModule: new MyRuntimeModule()
 * };
 *
 * // 编辑器插件（在 editor-core 中定义 IEditorPlugin）
 * // Editor plugin (IEditorPlugin defined in editor-core)
 * const MyEditorPlugin: IEditorPlugin = {
 *     manifest,
 *     runtimeModule: new MyRuntimeModule(),
 *     editorModule: new MyEditorModule()
 * };
 * ```
 */
export interface IPlugin<TEditorModule = unknown> {
    /** 模块清单 | Module manifest */
    readonly manifest: ModuleManifest;
    /** 运行时模块（可选） | Runtime module (optional) */
    readonly runtimeModule?: IRuntimeModule;
    /**
     * 编辑器模块（可选）
     * Editor module (optional)
     *
     * 泛型参数允许 editor-core 使用 IEditorModuleLoader 类型。
     * Generic parameter allows editor-core to use IEditorModuleLoader type.
     */
    readonly editorModule?: TEditorModule;
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
