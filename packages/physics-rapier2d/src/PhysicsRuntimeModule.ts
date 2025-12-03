/**
 * 物理运行时模块
 *
 * 提供 Rapier2D 物理引擎的 ECS 集成
 */

import type { IScene, ServiceContainer } from '@esengine/ecs-framework';
import { ComponentRegistry } from '@esengine/ecs-framework';
import type { IRuntimeModule, IPlugin, ModuleManifest, SystemContext } from '@esengine/engine-core';
import { WasmLibraryLoaderFactory } from '@esengine/platform-common';
import type * as RAPIER from '@esengine/rapier2d';

import { Rigidbody2DComponent } from './components/Rigidbody2DComponent';
import { BoxCollider2DComponent } from './components/BoxCollider2DComponent';
import { CircleCollider2DComponent } from './components/CircleCollider2DComponent';
import { CapsuleCollider2DComponent } from './components/CapsuleCollider2DComponent';
import { PolygonCollider2DComponent } from './components/PolygonCollider2DComponent';
import { Physics2DSystem } from './systems/Physics2DSystem';
import { Physics2DService } from './services/Physics2DService';

// 注册 Rapier2D 加载器
import './loaders';

/**
 * 物理系统上下文扩展
 */
export interface PhysicsSystemContext extends SystemContext {
    /**
     * 物理系统实例
     */
    physicsSystem?: Physics2DSystem;

    /**
     * 物理世界实例
     */
    physics2DWorld?: any;

    /**
     * 物理配置
     */
    physicsConfig?: any;
}

/**
 * 物理运行时模块
 *
 * 负责：
 * 1. 加载并初始化 Rapier2D WASM 模块（跨平台）
 * 2. 注册物理组件
 * 3. 注册物理服务
 * 4. 创建物理系统
 *
 * @example
 * ```typescript
 * // 作为插件使用
 * runtimePluginManager.register(PhysicsPlugin);
 * runtimePluginManager.enable('@esengine/physics-rapier2d');
 *
 * // 插件会自动：
 * // 1. 检测平台并选择合适的加载器
 * // 2. 安装必要的 polyfills（如微信小游戏的 TextDecoder）
 * // 3. 加载 Rapier2D WASM 模块
 * // 4. 注册物理组件和系统
 * ```
 */
class PhysicsRuntimeModule implements IRuntimeModule {
    private _rapierModule: typeof RAPIER | null = null;
    private _physicsSystem: Physics2DSystem | null = null;

    /**
     * 初始化物理模块
     *
     * 使用平台适配的加载器加载 Rapier2D
     */
    async onInitialize(): Promise<void> {
        // 使用工厂创建平台对应的加载器
        const loader = WasmLibraryLoaderFactory.createLoader<typeof RAPIER>('rapier2d');

        // 获取平台信息
        const platformInfo = loader.getPlatformInfo();
        console.log(`[Physics] 平台: ${platformInfo.type}`);
        console.log(`[Physics] WASM 支持: ${platformInfo.supportsWasm}`);

        if (platformInfo.needsPolyfills.length > 0) {
            console.log(`[Physics] 需要 Polyfills: ${platformInfo.needsPolyfills.join(', ')}`);
        }

        // 检查平台支持
        if (!loader.isSupported()) {
            throw new Error(
                `[Physics] 当前平台不支持 Rapier2D: ${platformInfo.type}。` +
                '请检查 WebAssembly 支持情况。'
            );
        }

        // 加载 Rapier2D
        this._rapierModule = await loader.load();
        console.log('[Physics] Rapier2D 加载完成');
    }

    /**
     * 注册物理组件
     *
     * @param registry - 组件注册表
     */
    registerComponents(registry: typeof ComponentRegistry): void {
        registry.register(Rigidbody2DComponent);
        registry.register(BoxCollider2DComponent);
        registry.register(CircleCollider2DComponent);
        registry.register(CapsuleCollider2DComponent);
        registry.register(PolygonCollider2DComponent);
    }

    /**
     * 注册物理服务
     *
     * @param services - 服务容器
     */
    registerServices(services: ServiceContainer): void {
        services.registerSingleton(Physics2DService);
    }

    /**
     * 创建物理系统
     *
     * @param scene - 目标场景
     * @param context - 系统上下文
     */
    createSystems(scene: IScene, context: SystemContext): void {
        const physicsContext = context as PhysicsSystemContext;

        const physicsSystem = new Physics2DSystem({
            physics: physicsContext.physicsConfig,
            updateOrder: -1000
        });

        scene.addSystem(physicsSystem);
        this._physicsSystem = physicsSystem;

        if (this._rapierModule) {
            physicsSystem.initializeWithRapier(this._rapierModule);
        }

        physicsContext.physicsSystem = physicsSystem;
        physicsContext.physics2DWorld = physicsSystem.world;
    }

    /**
     * 销毁物理模块
     */
    onDestroy(): void {
        this._physicsSystem = null;
        this._rapierModule = null;
    }

    /**
     * 获取 Rapier 模块
     *
     * @returns Rapier 模块，如果未加载则返回 null
     */
    getRapierModule(): typeof RAPIER | null {
        return this._rapierModule;
    }

    /**
     * 获取物理系统
     *
     * @returns 物理系统，如果未创建则返回 null
     */
    getPhysicsSystem(): Physics2DSystem | null {
        return this._physicsSystem;
    }
}

/**
 * 模块清单
 */
const manifest: ModuleManifest = {
    id: 'physics-rapier2d',
    name: '@esengine/physics-rapier2d',
    displayName: 'Physics 2D (Rapier)',
    version: '1.0.0',
    description: '基于 Rapier2D 的确定性 2D 物理引擎（支持跨平台）',
    category: 'Physics',
    icon: 'Atom',
    isCore: false,
    defaultEnabled: false,
    isEngineModule: true,
    dependencies: ['core', 'math'],
    exports: { components: ['RigidBody2D'] },
    requiresWasm: true
};

/**
 * 物理插件
 */
export const PhysicsPlugin: IPlugin = {
    manifest,
    runtimeModule: new PhysicsRuntimeModule()
};

export { PhysicsRuntimeModule };
