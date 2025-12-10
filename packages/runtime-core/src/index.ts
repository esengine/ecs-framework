export {
    RuntimePluginManager,
    runtimePluginManager,
    type SystemContext,
    type ModuleManifest,
    type IRuntimeModule,
    type IPlugin
} from './PluginManager';

export {
    createPlugin,
    registerPlugin,
    initializeRuntime,
    createSystemsForScene,
    resetRuntime,
    type RuntimeConfig
} from './RuntimeBootstrap';

export {
    loadPlugin,
    loadEnabledPlugins,
    registerStaticPlugin,
    getLoadedPlugins,
    resetPluginLoader,
    type PluginPackageInfo,
    type PluginConfig,
    type ProjectPluginConfig
} from './PluginLoader';

export {
    BUILTIN_PLUGIN_PACKAGES,
    createDefaultProjectConfig,
    mergeProjectConfig,
    createProjectConfigFromEnabledList,
    type ProjectConfig
} from './ProjectConfig';

// Platform Adapter
export {
    DefaultPathResolver,
    type IPlatformAdapter,
    type IPathResolver,
    type PlatformCapabilities,
    type PlatformAdapterConfig
} from './IPlatformAdapter';

// Game Runtime
export {
    GameRuntime,
    createGameRuntime,
    type GameRuntimeConfig,
    type RuntimeState
} from './GameRuntime';

// Platform Adapters
export {
    BrowserPlatformAdapter,
    BrowserPathResolver,
    type BrowserPlatformConfig,
    EditorPlatformAdapter,
    EditorPathResolver,
    type EditorPlatformConfig
} from './adapters';

// Browser File System Service
export {
    BrowserFileSystemService,
    createBrowserFileSystem,
    type BrowserFileSystemOptions
} from './services/BrowserFileSystemService';

// Re-export catalog types from asset-system (canonical source)
// 从 asset-system 重新导出目录类型（规范来源）
export type {
    IAssetCatalog,
    IAssetCatalogEntry,
    IAssetBundleInfo,
    AssetLoadStrategy
} from '@esengine/asset-system';

// Re-export Input System from engine-core for convenience
export {
    Input,
    InputManager,
    InputSystem,
    MouseButton,
    type InputSystemConfig,
    type KeyState,
    type MouseButtonState,
    type Vector2,
    type KeyboardEventInfo,
    type MouseEventInfo,
    type WheelEventInfo,
    type TouchInfo,
    type TouchEvent
} from '@esengine/engine-core';

// Re-export Plugin Service Registry from engine-core
export {
    PluginServiceRegistry,
    createServiceToken,
    TransformTypeToken,
    type ServiceToken
} from '@esengine/engine-core';

// Re-export service tokens from their respective modules
export {
    EngineBridgeToken,
    RenderSystemToken,
    EngineIntegrationToken,
    type IEngineBridge,
    type IRenderSystem,
    type IRenderDataProvider,
    type IEngineIntegration
} from '@esengine/ecs-engine-bindgen';

export {
    AssetManagerToken,
    type IAssetManager,
    type IAssetLoadResult
} from '@esengine/asset-system';
