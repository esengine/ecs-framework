import type { IScene, ServiceContainer } from '@esengine/ecs-framework';
import { ComponentRegistry } from '@esengine/ecs-framework';
import type { IRuntimeModule, IPlugin, PluginDescriptor, SystemContext } from '@esengine/engine-core';
import * as RAPIER from '@dimforge/rapier2d-compat';

import { Rigidbody2DComponent } from './components/Rigidbody2DComponent';
import { BoxCollider2DComponent } from './components/BoxCollider2DComponent';
import { CircleCollider2DComponent } from './components/CircleCollider2DComponent';
import { CapsuleCollider2DComponent } from './components/CapsuleCollider2DComponent';
import { PolygonCollider2DComponent } from './components/PolygonCollider2DComponent';
import { Physics2DSystem } from './systems/Physics2DSystem';
import { Physics2DService } from './services/Physics2DService';

export interface PhysicsSystemContext extends SystemContext {
    physicsSystem?: Physics2DSystem;
    physics2DWorld?: any;
    physicsConfig?: any;
}

class PhysicsRuntimeModule implements IRuntimeModule {
    private _rapierModule: typeof RAPIER | null = null;
    private _physicsSystem: Physics2DSystem | null = null;

    async onInitialize(): Promise<void> {
        await RAPIER.init();
        this._rapierModule = RAPIER;
    }

    registerComponents(registry: typeof ComponentRegistry): void {
        registry.register(Rigidbody2DComponent);
        registry.register(BoxCollider2DComponent);
        registry.register(CircleCollider2DComponent);
        registry.register(CapsuleCollider2DComponent);
        registry.register(PolygonCollider2DComponent);
    }

    registerServices(services: ServiceContainer): void {
        services.registerSingleton(Physics2DService);
    }

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

    onDestroy(): void {
        this._physicsSystem = null;
        this._rapierModule = null;
    }

    getRapierModule(): typeof RAPIER | null {
        return this._rapierModule;
    }

    getPhysicsSystem(): Physics2DSystem | null {
        return this._physicsSystem;
    }
}

const descriptor: PluginDescriptor = {
    id: '@esengine/physics-rapier2d',
    name: 'Physics 2D',
    version: '1.0.0',
    description: 'Deterministic 2D physics with Rapier2D',
    category: 'physics',
    enabledByDefault: true,
    isEnginePlugin: true
};

export const PhysicsPlugin: IPlugin = {
    descriptor,
    runtimeModule: new PhysicsRuntimeModule()
};

export { PhysicsRuntimeModule };
