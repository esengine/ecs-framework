/**
 * Runtime Systems Configuration
 * 运行时系统配置
 */

import { Core, ComponentRegistry, ServiceContainer } from '@esengine/ecs-framework';
import type { IScene } from '@esengine/ecs-framework';
import { EngineBridge, EngineRenderSystem, CameraSystem } from '@esengine/ecs-engine-bindgen';
import { TransformComponent, SpriteAnimatorSystem, CoreRuntimeModule } from '@esengine/ecs-components';
import type { SystemContext, IPluginLoader, IRuntimeModuleLoader, PluginDescriptor } from '@esengine/ecs-components';
import { UIRuntimeModule, UIRenderDataProvider } from '@esengine/ui';
import { TilemapRuntimeModule, TilemapRenderingSystem } from '@esengine/tilemap';
import { BehaviorTreeRuntimeModule, BehaviorTreeExecutionSystem } from '@esengine/behavior-tree';

/**
 * 运行时系统集合
 */
export interface RuntimeSystems {
    cameraSystem: CameraSystem;
    animatorSystem?: SpriteAnimatorSystem;
    tilemapSystem?: TilemapRenderingSystem;
    behaviorTreeSystem?: BehaviorTreeExecutionSystem;
    renderSystem: EngineRenderSystem;
    uiRenderProvider?: UIRenderDataProvider;
}

/**
 * 运行时配置
 */
export interface RuntimeModuleConfig {
    /** 启用的插件 ID 列表，不指定则启用所有已注册插件 */
    enabledPlugins?: string[];
    /** 是否为编辑器模式 */
    isEditor?: boolean;
}

/**
 * 运行时插件管理器（简化版，用于独立运行时）
 * Runtime Plugin Manager (simplified, for standalone runtime)
 */
class RuntimePluginManager {
    private plugins: Map<string, IPluginLoader> = new Map();
    private enabledPlugins: Set<string> = new Set();
    private initialized = false;

    /**
     * 注册插件
     */
    register(plugin: IPluginLoader): void {
        const id = plugin.descriptor.id;
        if (this.plugins.has(id)) {
            return;
        }
        this.plugins.set(id, plugin);
        // 默认启用
        if (plugin.descriptor.enabledByDefault !== false) {
            this.enabledPlugins.add(id);
        }
    }

    /**
     * 启用插件
     */
    enable(pluginId: string): void {
        this.enabledPlugins.add(pluginId);
    }

    /**
     * 禁用插件
     */
    disable(pluginId: string): void {
        this.enabledPlugins.delete(pluginId);
    }

    /**
     * 加载配置
     */
    loadConfig(config: { enabledPlugins: string[] }): void {
        this.enabledPlugins.clear();
        for (const id of config.enabledPlugins) {
            this.enabledPlugins.add(id);
        }
        // 始终启用引擎插件
        for (const [id, plugin] of this.plugins) {
            if (plugin.descriptor.isEnginePlugin) {
                this.enabledPlugins.add(id);
            }
        }
    }

    /**
     * 初始化运行时（注册组件和服务）
     */
    async initializeRuntime(services: ServiceContainer): Promise<void> {
        if (this.initialized) {
            return;
        }

        // 注册组件
        for (const [id, plugin] of this.plugins) {
            if (!this.enabledPlugins.has(id)) continue;
            const runtimeModule = plugin.runtimeModule;
            if (runtimeModule) {
                try {
                    runtimeModule.registerComponents(ComponentRegistry);
                } catch (e) {
                    console.error(`Failed to register components for ${id}:`, e);
                }
            }
        }

        // 注册服务
        for (const [id, plugin] of this.plugins) {
            if (!this.enabledPlugins.has(id)) continue;
            const runtimeModule = plugin.runtimeModule;
            if (runtimeModule?.registerServices) {
                try {
                    runtimeModule.registerServices(services);
                } catch (e) {
                    console.error(`Failed to register services for ${id}:`, e);
                }
            }
        }

        // 调用初始化回调
        for (const [id, plugin] of this.plugins) {
            if (!this.enabledPlugins.has(id)) continue;
            const runtimeModule = plugin.runtimeModule;
            if (runtimeModule?.onInitialize) {
                try {
                    await runtimeModule.onInitialize();
                } catch (e) {
                    console.error(`Failed to initialize ${id}:`, e);
                }
            }
        }

        this.initialized = true;
    }

    /**
     * 为场景创建系统
     */
    createSystemsForScene(scene: IScene, context: SystemContext): void {
        for (const [id, plugin] of this.plugins) {
            if (!this.enabledPlugins.has(id)) continue;
            const runtimeModule = plugin.runtimeModule;
            if (runtimeModule?.createSystems) {
                try {
                    runtimeModule.createSystems(scene, context);
                } catch (e) {
                    console.error(`Failed to create systems for ${id}:`, e);
                }
            }
        }
    }

    /**
     * 获取所有已注册的插件
     */
    getPlugins(): IPluginLoader[] {
        return Array.from(this.plugins.values());
    }

    /**
     * 检查插件是否启用
     */
    isEnabled(pluginId: string): boolean {
        return this.enabledPlugins.has(pluginId);
    }

    /**
     * 重置
     */
    reset(): void {
        this.plugins.clear();
        this.enabledPlugins.clear();
        this.initialized = false;
    }
}

// 单例运行时插件管理器
const runtimePluginManager = new RuntimePluginManager();

/**
 * 创建运行时专用的插件加载器
 * Create runtime-only plugin loaders (without editor modules to avoid code splitting issues)
 */
function createRuntimeOnlyPlugin(
    descriptor: PluginDescriptor,
    runtimeModule: IRuntimeModuleLoader
): IPluginLoader {
    return {
        descriptor,
        runtimeModule,
        // No editor module for runtime builds
    };
}

// 运行时专用插件描述符 | Runtime-only plugin descriptors
const coreDescriptor: PluginDescriptor = {
    id: '@esengine/ecs-components',
    name: 'Core Components',
    version: '1.0.0',
    category: 'core',
    enabledByDefault: true,
    isEnginePlugin: true,
    modules: [{ name: 'CoreRuntime', type: 'runtime', entry: './src/index.ts' }]
};

const uiDescriptor: PluginDescriptor = {
    id: '@esengine/ui',
    name: 'UI System',
    version: '1.0.0',
    category: 'ui',
    enabledByDefault: true,
    isEnginePlugin: true,
    modules: [{ name: 'UIRuntime', type: 'runtime', entry: './src/index.ts' }]
};

const tilemapDescriptor: PluginDescriptor = {
    id: '@esengine/tilemap',
    name: 'Tilemap System',
    version: '1.0.0',
    category: 'rendering',
    enabledByDefault: true,
    isEnginePlugin: true,
    modules: [{ name: 'TilemapRuntime', type: 'runtime', entry: './src/index.ts' }]
};

const behaviorTreeDescriptor: PluginDescriptor = {
    id: '@esengine/behavior-tree',
    name: 'Behavior Tree',
    version: '1.0.0',
    category: 'ai',
    enabledByDefault: true,
    isEnginePlugin: true,
    modules: [{ name: 'BehaviorTreeRuntime', type: 'runtime', entry: './src/index.ts' }]
};

/**
 * 注册所有可用插件
 * 仅注册插件描述信息，不初始化组件和服务
 */
export function registerAvailablePlugins(): void {
    runtimePluginManager.register(createRuntimeOnlyPlugin(coreDescriptor, new CoreRuntimeModule()));
    runtimePluginManager.register(createRuntimeOnlyPlugin(uiDescriptor, new UIRuntimeModule()));
    runtimePluginManager.register(createRuntimeOnlyPlugin(tilemapDescriptor, new TilemapRuntimeModule()));
    runtimePluginManager.register(createRuntimeOnlyPlugin(behaviorTreeDescriptor, new BehaviorTreeRuntimeModule()));
}

/**
 * 初始化运行时（完整流程）
 * 用于独立游戏运行时，一次性完成所有初始化
 */
export async function initializeRuntime(
    coreInstance: typeof Core,
    config?: RuntimeModuleConfig
): Promise<void> {
    registerAvailablePlugins();

    if (config?.enabledPlugins) {
        runtimePluginManager.loadConfig({ enabledPlugins: config.enabledPlugins });
    } else {
        // 默认启用所有插件
        for (const plugin of runtimePluginManager.getPlugins()) {
            runtimePluginManager.enable(plugin.descriptor.id);
        }
    }

    await runtimePluginManager.initializeRuntime(coreInstance.services);
}

/**
 * 初始化插件（编辑器用）
 * 根据项目配置初始化已启用的插件
 *
 * @param coreInstance Core 实例
 * @param enabledPlugins 启用的插件 ID 列表
 */
export async function initializePluginsForProject(
    coreInstance: typeof Core,
    enabledPlugins: string[]
): Promise<void> {
    // 确保插件已注册
    registerAvailablePlugins();

    // 加载项目的插件配置
    runtimePluginManager.loadConfig({ enabledPlugins });

    // 初始化插件（注册组件和服务）
    await runtimePluginManager.initializeRuntime(coreInstance.services);
}

/**
 * 创建运行时系统
 */
export function createRuntimeSystems(
    scene: IScene,
    bridge: EngineBridge,
    config?: RuntimeModuleConfig
): RuntimeSystems {
    const isEditor = config?.isEditor ?? false;

    const cameraSystem = new CameraSystem(bridge);
    scene.addSystem(cameraSystem);

    const renderSystem = new EngineRenderSystem(bridge, TransformComponent);

    const context: SystemContext = {
        core: Core,
        engineBridge: bridge,
        renderSystem,
        isEditor
    };

    runtimePluginManager.createSystemsForScene(scene, context);

    scene.addSystem(renderSystem);

    return {
        cameraSystem,
        animatorSystem: context.animatorSystem as SpriteAnimatorSystem | undefined,
        tilemapSystem: context.tilemapSystem as TilemapRenderingSystem | undefined,
        behaviorTreeSystem: context.behaviorTreeSystem as BehaviorTreeExecutionSystem | undefined,
        renderSystem,
        uiRenderProvider: context.uiRenderProvider as UIRenderDataProvider | undefined
    };
}

