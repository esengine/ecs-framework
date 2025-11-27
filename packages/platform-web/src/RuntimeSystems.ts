/**
 * Runtime Systems Configuration
 * 运行时系统配置
 */

import { Scene, Core, ModuleRegistry, type ModuleSystemContext } from '@esengine/ecs-framework';
import { EngineBridge, EngineRenderSystem, CameraSystem } from '@esengine/ecs-engine-bindgen';
import { TransformComponent, SpriteAnimatorSystem, CoreModule } from '@esengine/ecs-components';
import { UIModule, UIRenderDataProvider } from '@esengine/ui';
import { TilemapModule, TilemapRenderingSystem } from '@esengine/tilemap';
import { BehaviorTreeModule, BehaviorTreeExecutionSystem } from '@esengine/behavior-tree';

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
    /** 启用的模块 ID 列表，不指定则启用所有已注册模块 */
    enabledModules?: string[];
    /** 是否为编辑器模式 */
    isEditor?: boolean;
}

/**
 * 注册所有可用模块到 ModuleRegistry
 * 仅注册模块描述信息，不初始化组件和服务
 */
export function registerAvailableModules(): void {
    // 只有在还没注册时才注册
    if (ModuleRegistry.getPhase() !== 'none') {
        return;
    }

    ModuleRegistry.register(CoreModule);
    ModuleRegistry.register(UIModule);
    ModuleRegistry.register(TilemapModule);
    ModuleRegistry.register(BehaviorTreeModule);
}

/**
 * 初始化运行时（完整流程）
 * 用于独立游戏运行时，一次性完成所有初始化
 */
export async function initializeRuntime(
    coreInstance: typeof Core,
    config?: RuntimeModuleConfig
): Promise<void> {
    registerAvailableModules();

    if (config?.enabledModules) {
        ModuleRegistry.loadConfig({ enabledModules: config.enabledModules });
    } else {
        // 默认启用所有模块
        for (const module of ModuleRegistry.getModules()) {
            if (!module.isCore) {
                ModuleRegistry.enable(module.id);
            }
        }
    }

    await ModuleRegistry.initialize(coreInstance);
}

/**
 * 初始化模块（编辑器用）
 * 根据项目配置初始化已启用的模块
 *
 * @param coreInstance Core 实例
 * @param enabledModules 启用的模块 ID 列表
 * @param forceReinit 是否强制重新初始化
 */
export async function initializeModulesForProject(
    coreInstance: typeof Core,
    enabledModules: string[],
    forceReinit = false
): Promise<void> {
    // 确保模块已注册
    registerAvailableModules();

    // 加载项目的模块配置
    ModuleRegistry.loadConfig({ enabledModules });

    // 初始化模块（注册组件和服务）
    await ModuleRegistry.initialize(coreInstance, forceReinit);
}

/**
 * 创建运行时系统
 */
export function createRuntimeSystems(
    scene: Scene,
    bridge: EngineBridge,
    config?: RuntimeModuleConfig
): RuntimeSystems {
    const isEditor = config?.isEditor ?? false;

    const cameraSystem = new CameraSystem(bridge);
    scene.addSystem(cameraSystem);

    const renderSystem = new EngineRenderSystem(bridge, TransformComponent);

    const context: ModuleSystemContext = {
        core: Core,
        engineBridge: bridge,
        renderSystem,
        isEditor
    };

    ModuleRegistry.createSystemsForScene(scene, context);

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
