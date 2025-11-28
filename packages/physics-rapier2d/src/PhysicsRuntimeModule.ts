/**
 * Physics 2D Runtime Module
 * 2D 物理运行时模块
 *
 * 提供确定性 2D 物理模拟功能
 */

import type { IScene, ServiceContainer } from '@esengine/ecs-framework';
import { ComponentRegistry } from '@esengine/ecs-framework';
import type { IRuntimeModuleLoader, SystemContext } from '@esengine/ecs-components';
import * as RAPIER from '@dimforge/rapier2d-compat';

// Components
import { Rigidbody2DComponent } from './components/Rigidbody2DComponent';
import { BoxCollider2DComponent } from './components/BoxCollider2DComponent';
import { CircleCollider2DComponent } from './components/CircleCollider2DComponent';
import { CapsuleCollider2DComponent } from './components/CapsuleCollider2DComponent';
import { PolygonCollider2DComponent } from './components/PolygonCollider2DComponent';

// Systems
import { Physics2DSystem } from './systems/Physics2DSystem';

// Services
import { Physics2DService } from './services/Physics2DService';

/**
 * Physics 2D Runtime Module
 * 2D 物理运行时模块
 *
 * 实现 IRuntimeModuleLoader 接口，提供：
 * - 物理组件注册
 * - 物理系统创建
 * - Rapier2D 初始化
 */
export class PhysicsRuntimeModule implements IRuntimeModuleLoader {
    private _rapierModule: typeof RAPIER | null = null;
    private _physicsSystem: Physics2DSystem | null = null;

    /**
     * 初始化模块
     * 异步初始化 Rapier2D WASM 模块
     */
    async onInitialize(): Promise<void> {
        // 初始化 Rapier2D WASM
        await RAPIER.init();
        this._rapierModule = RAPIER;
    }

    /**
     * 注册组件
     */
    registerComponents(registry: typeof ComponentRegistry): void {
        registry.register(Rigidbody2DComponent);
        registry.register(BoxCollider2DComponent);
        registry.register(CircleCollider2DComponent);
        registry.register(CapsuleCollider2DComponent);
        registry.register(PolygonCollider2DComponent);
    }

    /**
     * 注册服务
     */
    registerServices?(services: ServiceContainer): void {
        // 注册物理服务
        services.registerSingleton(Physics2DService);
    }

    /**
     * 创建系统
     */
    createSystems(scene: IScene, context: SystemContext): void {
        // 创建物理系统
        const physicsSystem = new Physics2DSystem({
            physics: context.physicsConfig,
            updateOrder: -1000 // 在其他系统之前运行
        });

        scene.addSystem(physicsSystem);
        this._physicsSystem = physicsSystem;

        // 如果 Rapier 已加载，初始化物理系统
        if (this._rapierModule) {
            physicsSystem.initializeWithRapier(this._rapierModule);
        }

        // 导出到上下文供其他系统使用
        context.physicsSystem = physicsSystem;
        context.physics2DWorld = physicsSystem.world;
    }

    /**
     * 销毁模块
     */
    onDestroy(): void {
        this._physicsSystem = null;
        this._rapierModule = null;
    }

    /**
     * 获取 Rapier 模块
     */
    getRapierModule(): typeof RAPIER | null {
        return this._rapierModule;
    }

    /**
     * 获取物理系统
     */
    getPhysicsSystem(): Physics2DSystem | null {
        return this._physicsSystem;
    }
}

/**
 * 默认导出模块实例
 */
export default new PhysicsRuntimeModule();
