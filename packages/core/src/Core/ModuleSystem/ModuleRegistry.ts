/**
 * Module System - Registry
 * 模块系统 - 注册表
 *
 * 支持：
 * - 模块的声明式注册
 * - 按需加载（懒加载）
 * - 依赖管理
 * - 项目级别的模块启用/禁用配置
 */

import { ComponentRegistry } from '../../ECS/Core/Storage';
import { Scene } from '../../ECS/Scene';
import { Core } from '../../Core';
import { createLogger } from '../../Utils/Logger';

const logger = createLogger('ModuleRegistry');

/**
 * 模块类别
 */
export type ModuleCategory = 'core' | 'rendering' | 'ui' | 'ai' | 'physics' | 'audio' | 'networking' | 'tools';

/**
 * 模块描述信息
 */
export interface ModuleDescriptor {
    /** 模块唯一标识 */
    id: string;
    /** 显示名称 */
    name: string;
    /** 模块描述 */
    description: string;
    /** 模块类别 */
    category: ModuleCategory;
    /** 模块版本 */
    version: string;
    /** 依赖的其他模块ID */
    dependencies?: string[];
    /** 是否为核心模块（不可禁用） */
    isCore?: boolean;
    /** 模块图标（用于编辑器显示） */
    icon?: string;
}

/**
 * 模块加载器接口
 * 每个模块需要实现此接口
 */
export interface IModuleLoader {
    /** 模块描述信息 */
    readonly descriptor: ModuleDescriptor;

    /**
     * 注册组件
     * 在模块启用时调用，注册该模块提供的所有组件
     */
    registerComponents(registry: typeof ComponentRegistry): void;

    /**
     * 注册服务
     * 在模块启用且 Core 初始化后调用
     */
    registerServices?(core: typeof Core): void;

    /**
     * 创建系统
     * 在场景创建时调用，返回该模块提供的系统实例
     */
    createSystems?(scene: Scene, context: ModuleSystemContext): void;

    /**
     * 模块初始化
     * 在所有组件和服务注册完成后调用
     */
    onInitialize?(): Promise<void>;

    /**
     * 模块销毁
     * 在模块被禁用或卸载时调用
     */
    onDestroy?(): void;
}

/**
 * 系统创建上下文
 * 提供创建系统所需的依赖
 */
export interface ModuleSystemContext {
    /** Core 实例 */
    core?: typeof Core;
    /** 引擎桥接 */
    engineBridge?: IEngineBridge;
    /** 渲染系统 */
    renderSystem?: IRenderSystem;
    /** 是否为编辑器模式 */
    isEditor?: boolean;
    /** 动画系统 */
    animatorSystem?: ISystem;
    /** 瓦片地图系统 */
    tilemapSystem?: ISystem;
    /** 行为树系统 */
    behaviorTreeSystem?: ISystem;
    /** UI 渲染数据提供者 */
    uiRenderProvider?: IRenderDataProvider;
}

/**
 * 引擎桥接接口
 */
export interface IEngineBridge {
    loadTexture(id: number, dataUrl: string): void;
}

/**
 * 渲染系统接口
 */
export interface IRenderSystem {
    addRenderDataProvider(provider: IRenderDataProvider): void;
}

/**
 * 渲染数据提供者接口
 */
export interface IRenderDataProvider {
    // 标记接口，具体方法由实现类定义
}

/**
 * 系统接口
 */
export interface ISystem {
    enabled: boolean;
}

/**
 * 模块状态
 */
export type ModuleState = 'unloaded' | 'loading' | 'loaded' | 'error';

/**
 * 已注册模块的运行时信息
 */
interface RegisteredModule {
    loader: IModuleLoader;
    state: ModuleState;
    error?: Error;
    enabled: boolean;
}

/**
 * 全局存储键名
 */
const GLOBAL_KEY = '__ESENGINE_MODULE_REGISTRY__';

/**
 * 模块注册阶段
 */
export type ModulePhase = 'none' | 'registered' | 'initialized' | 'systems_created';

/**
 * 获取或创建全局存储
 */
function getGlobalStorage(): {
    modules: Map<string, RegisteredModule>;
    initialized: boolean;
    enabledModules: Set<string>;
    phase: ModulePhase;
    currentScene: Scene | null;
    componentRegistry: typeof ComponentRegistry | null;
} {
    const globalObj = typeof window !== 'undefined' ? window : globalThis;
    if (!(globalObj as any)[GLOBAL_KEY]) {
        (globalObj as any)[GLOBAL_KEY] = {
            modules: new Map<string, RegisteredModule>(),
            initialized: false,
            enabledModules: new Set<string>(),
            phase: 'none' as ModulePhase,
            currentScene: null,
            componentRegistry: null
        };
    }
    return (globalObj as any)[GLOBAL_KEY];
}

/**
 * 模块注册表
 * 管理所有可用模块的注册和加载
 */
export class ModuleRegistry {
    private static get modules(): Map<string, RegisteredModule> {
        return getGlobalStorage().modules;
    }

    private static get initialized(): boolean {
        return getGlobalStorage().initialized;
    }

    private static set initialized(value: boolean) {
        getGlobalStorage().initialized = value;
    }

    private static get enabledModules(): Set<string> {
        return getGlobalStorage().enabledModules;
    }

    private static get phase(): ModulePhase {
        return getGlobalStorage().phase;
    }

    private static set phase(value: ModulePhase) {
        getGlobalStorage().phase = value;
    }

    private static get currentScene(): Scene | null {
        return getGlobalStorage().currentScene;
    }

    private static set currentScene(value: Scene | null) {
        getGlobalStorage().currentScene = value;
    }

    /**
     * 获取当前模块系统阶段
     */
    static getPhase(): ModulePhase {
        return this.phase;
    }

    /**
     * 检查是否已初始化组件和服务
     */
    static isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * 设置 ComponentRegistry 实例
     *
     * 用于解决多打包实例导致 ComponentRegistry 不共享的问题。
     * 调用方（如 editor-app）可以传入自己持有的 ComponentRegistry 实例，
     * 确保所有模块使用同一个注册表。
     *
     * @param registry 要使用的 ComponentRegistry 实例
     */
    static setComponentRegistry(registry: typeof ComponentRegistry): void {
        getGlobalStorage().componentRegistry = registry;
    }

    /**
     * 获取 ComponentRegistry 实例
     * 优先返回外部设置的实例，否则返回默认导入的实例
     */
    private static getComponentRegistry(): typeof ComponentRegistry {
        return getGlobalStorage().componentRegistry || ComponentRegistry;
    }

    /**
     * 注册模块加载器
     * 仅注册模块描述信息，不初始化
     */
    static register(loader: IModuleLoader): void {
        const { id } = loader.descriptor;

        if (this.modules.has(id)) {
            logger.warn(`Module '${id}' is already registered, skipping`);
            return;
        }

        this.modules.set(id, {
            loader,
            state: 'unloaded',
            enabled: loader.descriptor.isCore ?? false // 核心模块默认启用
        });

        // 更新阶段
        if (this.phase === 'none') {
            this.phase = 'registered';
        }

        logger.debug(`Registered module: ${id}`);
    }

    /**
     * 启用模块
     */
    static enable(moduleId: string): boolean {
        const module = this.modules.get(moduleId);
        if (!module) {
            logger.error(`Module '${moduleId}' not found`);
            return false;
        }

        // 检查依赖
        const deps = module.loader.descriptor.dependencies || [];
        for (const depId of deps) {
            if (!this.isEnabled(depId)) {
                logger.error(`Cannot enable '${moduleId}': dependency '${depId}' is not enabled`);
                return false;
            }
        }

        module.enabled = true;
        this.enabledModules.add(moduleId);
        logger.info(`Enabled module: ${moduleId}`);
        return true;
    }

    /**
     * 禁用模块
     */
    static disable(moduleId: string): boolean {
        const module = this.modules.get(moduleId);
        if (!module) {
            logger.error(`Module '${moduleId}' not found`);
            return false;
        }

        if (module.loader.descriptor.isCore) {
            logger.error(`Cannot disable core module: ${moduleId}`);
            return false;
        }

        // 检查是否有其他模块依赖此模块
        for (const [id, m] of this.modules) {
            if (m.enabled && m.loader.descriptor.dependencies?.includes(moduleId)) {
                logger.error(`Cannot disable '${moduleId}': module '${id}' depends on it`);
                return false;
            }
        }

        module.enabled = false;
        this.enabledModules.delete(moduleId);
        logger.info(`Disabled module: ${moduleId}`);
        return true;
    }

    /**
     * 检查模块是否启用
     */
    static isEnabled(moduleId: string): boolean {
        return this.modules.get(moduleId)?.enabled ?? false;
    }

    /**
     * 获取所有已注册模块的描述信息
     */
    static getModules(): Array<ModuleDescriptor & { enabled: boolean; state: ModuleState }> {
        return Array.from(this.modules.entries()).map(([_, m]) => ({
            ...m.loader.descriptor,
            enabled: m.enabled,
            state: m.state
        }));
    }

    /**
     * 获取指定类别的模块
     */
    static getModulesByCategory(category: ModuleCategory): Array<ModuleDescriptor & { enabled: boolean }> {
        return this.getModules().filter(m => m.category === category);
    }

    /**
     * 加载配置
     * 从项目配置文件加载模块启用状态
     */
    static loadConfig(config: { enabledModules: string[] }): void {
        // 先禁用所有非核心模块
        for (const [, module] of this.modules) {
            if (!module.loader.descriptor.isCore) {
                module.enabled = false;
            }
        }

        // 启用配置中指定的模块
        for (const moduleId of config.enabledModules) {
            this.enable(moduleId);
        }
    }

    /**
     * 导出配置
     * 导出当前模块启用状态，用于保存到项目配置
     */
    static exportConfig(): { enabledModules: string[] } {
        return {
            enabledModules: Array.from(this.enabledModules)
        };
    }

    /**
     * 初始化所有已启用的模块
     * 注册组件和服务
     *
     * @param core Core 实例
     * @param forceReinit 是否强制重新初始化（用于项目切换时）
     */
    static async initialize(core?: typeof Core, forceReinit = false): Promise<void> {
        if (this.initialized && !forceReinit) {
            logger.warn('ModuleRegistry already initialized');
            return;
        }

        // 如果是重新初始化，先清理旧状态
        if (forceReinit && this.initialized) {
            this.uninitializeModules();
        }

        // 按依赖顺序排序模块
        const sortedModules = this.topologicalSort();

        const enabledModuleIds = sortedModules.filter(id => this.modules.get(id)?.enabled);
        logger.info(`Initializing ${enabledModuleIds.length} enabled modules: ${enabledModuleIds.join(', ')}`);

        for (const moduleId of sortedModules) {
            const module = this.modules.get(moduleId)!;
            if (!module.enabled) {
                logger.debug(`Skipping disabled module: ${moduleId}`);
                continue;
            }

            try {
                module.state = 'loading';

                // 注册组件 - 使用 getComponentRegistry() 获取正确的实例
                module.loader.registerComponents(this.getComponentRegistry());

                // 注册服务（如果提供了 Core）
                if (core && module.loader.registerServices) {
                    module.loader.registerServices(core);
                }

                // 初始化模块
                if (module.loader.onInitialize) {
                    await module.loader.onInitialize();
                }

                module.state = 'loaded';
                logger.info(`Loaded module: ${moduleId}`);
            } catch (error) {
                module.state = 'error';
                module.error = error as Error;
                logger.error(`Failed to load module '${moduleId}':`, error);
            }
        }

        this.initialized = true;
        this.phase = 'initialized';
    }

    /**
     * 反初始化模块（清理组件注册等）
     * 用于项目切换时
     */
    private static uninitializeModules(): void {
        const sortedModules = this.topologicalSort().reverse(); // 反向顺序销毁

        for (const moduleId of sortedModules) {
            const module = this.modules.get(moduleId);
            if (!module || module.state === 'unloaded') continue;

            try {
                // 调用模块的销毁回调
                if (module.loader.onDestroy) {
                    module.loader.onDestroy();
                }

                module.state = 'unloaded';
                logger.debug(`Uninitialized module: ${moduleId}`);
            } catch (error) {
                logger.error(`Failed to uninitialize module '${moduleId}':`, error);
            }
        }

        this.initialized = false;
        this.phase = 'registered';
    }

    /**
     * 为场景创建系统
     */
    static createSystemsForScene(scene: Scene, context: ModuleSystemContext): void {
        if (!this.initialized) {
            logger.error('ModuleRegistry not initialized. Call initialize() first.');
            return;
        }

        const sortedModules = this.topologicalSort();
        const enabledModuleIds = sortedModules.filter(id => {
            const m = this.modules.get(id);
            return m?.enabled && m.state === 'loaded';
        });

        logger.info(`Creating systems for ${enabledModuleIds.length} enabled modules: ${enabledModuleIds.join(', ')}`);

        for (const moduleId of sortedModules) {
            const module = this.modules.get(moduleId);
            if (!module) {
                logger.warn(`Module '${moduleId}' not found in registry`);
                continue;
            }

            if (!module.enabled || module.state !== 'loaded') {
                logger.debug(`Skipping module '${moduleId}': enabled=${module.enabled}, state=${module.state}`);
                continue;
            }

            if (module.loader.createSystems) {
                try {
                    module.loader.createSystems(scene, context);
                    logger.info(`Created systems for module: ${moduleId}`);
                } catch (error) {
                    logger.error(`Failed to create systems for module '${moduleId}':`, error);
                }
            }
        }

        this.currentScene = scene;
        this.phase = 'systems_created';
    }

    /**
     * 清理当前场景的模块系统
     * 用于项目关闭或切换时
     */
    static clearSceneSystems(): void {
        if (this.currentScene) {
            logger.info('Clearing module systems from scene');
            // 场景系统的清理由场景自己管理
            this.currentScene = null;
        }
        this.phase = this.initialized ? 'initialized' : 'registered';
    }

    /**
     * 拓扑排序，确保依赖顺序
     */
    private static topologicalSort(): string[] {
        const result: string[] = [];
        const visited = new Set<string>();
        const visiting = new Set<string>();

        const visit = (moduleId: string) => {
            if (visited.has(moduleId)) return;
            if (visiting.has(moduleId)) {
                throw new Error(`Circular dependency detected involving module: ${moduleId}`);
            }

            visiting.add(moduleId);

            const module = this.modules.get(moduleId);
            if (module) {
                for (const depId of module.loader.descriptor.dependencies || []) {
                    visit(depId);
                }
            }

            visiting.delete(moduleId);
            visited.add(moduleId);
            result.push(moduleId);
        };

        for (const moduleId of this.modules.keys()) {
            visit(moduleId);
        }

        return result;
    }

    /**
     * 重置注册表（主要用于测试）
     */
    static reset(): void {
        for (const module of this.modules.values()) {
            if (module.loader.onDestroy) {
                module.loader.onDestroy();
            }
        }
        this.modules.clear();
        this.enabledModules.clear();
        this.initialized = false;
        this.phase = 'none';
        this.currentScene = null;
    }
}
