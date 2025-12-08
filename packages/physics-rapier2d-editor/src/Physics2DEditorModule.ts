/**
 * Physics 2D Editor Module
 * 2D 物理编辑器模块
 */

import type { ServiceContainer, Entity } from '@esengine/esengine';
import { Core } from '@esengine/esengine';
import type {
    IEditorModuleLoader,
    EntityCreationTemplate,
    ComponentAction
} from '@esengine/editor-core';
import {
    EntityStoreService,
    MessageHub,
    ComponentRegistry,
    SettingsRegistry
} from '@esengine/editor-core';
import { TransformComponent } from '@esengine/engine-core';

// Import from @esengine/physics-rapier2d package
import {
    DEFAULT_PHYSICS_CONFIG,
    Rigidbody2DComponent,
    BoxCollider2DComponent,
    CircleCollider2DComponent,
    CapsuleCollider2DComponent,
    PolygonCollider2DComponent
} from '@esengine/physics-rapier2d';
import { Physics2DSystem } from '@esengine/physics-rapier2d/runtime';

// Local editor imports
import { registerPhysics2DGizmos } from './gizmos/Physics2DGizmo';
import { CollisionMatrixEditor } from './components/CollisionMatrixEditor';

/**
 * Physics 2D Editor Module
 * 2D 物理编辑器模块
 */
export class Physics2DEditorModule implements IEditorModuleLoader {
    private settingsListener: ((event: Event) => void) | null = null;

    async install(services: ServiceContainer): Promise<void> {
        // 注册物理设置到设置面板
        this.registerPhysicsSettings(services);

        // 监听设置变更
        this.setupSettingsListener();

        // 注册组件到编辑器组件注册表
        const componentRegistry = services.resolve(ComponentRegistry);
        if (componentRegistry) {
            componentRegistry.register({
                name: 'Rigidbody2D',
                type: Rigidbody2DComponent,
                category: 'components.category.physics',
                description: '2D rigidbody for physics simulation',
                icon: 'Box'
            });

            componentRegistry.register({
                name: 'BoxCollider2D',
                type: BoxCollider2DComponent,
                category: 'components.category.physics',
                description: '2D box collider shape',
                icon: 'Square'
            });

            componentRegistry.register({
                name: 'CircleCollider2D',
                type: CircleCollider2DComponent,
                category: 'components.category.physics',
                description: '2D circle collider shape',
                icon: 'Circle'
            });

            componentRegistry.register({
                name: 'CapsuleCollider2D',
                type: CapsuleCollider2DComponent,
                category: 'components.category.physics',
                description: '2D capsule collider shape',
                icon: 'Pill'
            });

            componentRegistry.register({
                name: 'PolygonCollider2D',
                type: PolygonCollider2DComponent,
                category: 'components.category.physics',
                description: '2D polygon collider shape',
                icon: 'Pentagon'
            });
        }

        // 注册 Physics Gizmos
        registerPhysics2DGizmos();
    }

    async uninstall(): Promise<void> {
        // 移除设置监听器
        if (this.settingsListener) {
            window.removeEventListener('settings:changed', this.settingsListener);
            this.settingsListener = null;
        }
    }

    /**
     * 设置变更监听器
     */
    private setupSettingsListener(): void {
        this.settingsListener = ((event: CustomEvent) => {
            const changedSettings = event.detail;

            // 检查是否有物理相关设置变更
            const physicsKeys = Object.keys(changedSettings).filter(k => k.startsWith('physics.'));
            if (physicsKeys.length === 0) return;

            this.applyPhysicsSettings(changedSettings);
        }) as EventListener;

        window.addEventListener('settings:changed', this.settingsListener);
    }

    /**
     * 应用物理设置到物理系统
     */
    private applyPhysicsSettings(settings: Record<string, unknown>): void {
        const scene = Core.scene;
        if (!scene) return;

        const physicsSystem = scene.getSystem(Physics2DSystem);
        if (!physicsSystem) return;

        const world = physicsSystem.world;
        if (!world) return;

        // 构建配置对象
        const gravityX = settings['physics.gravity.x'] as number | undefined;
        const gravityY = settings['physics.gravity.y'] as number | undefined;

        if (gravityX !== undefined || gravityY !== undefined) {
            const currentGravity = world.getGravity();
            world.updateConfig({
                gravity: {
                    x: gravityX ?? currentGravity.x,
                    y: gravityY ?? currentGravity.y
                }
            });
        }

        if (settings['physics.timestep'] !== undefined) {
            world.updateConfig({ timestep: settings['physics.timestep'] as number });
        }

        if (settings['physics.maxSubsteps'] !== undefined) {
            world.updateConfig({ maxSubsteps: settings['physics.maxSubsteps'] as number });
        }

        if (settings['physics.velocityIterations'] !== undefined) {
            world.updateConfig({ velocityIterations: settings['physics.velocityIterations'] as number });
        }

        if (settings['physics.positionIterations'] !== undefined) {
            world.updateConfig({ positionIterations: settings['physics.positionIterations'] as number });
        }

        if (settings['physics.allowSleep'] !== undefined) {
            world.updateConfig({ allowSleep: settings['physics.allowSleep'] as boolean });
        }
    }

    /**
     * 注册物理设置到设置面板
     */
    private registerPhysicsSettings(services: ServiceContainer): void {
        const settingsRegistry = services.tryResolve(SettingsRegistry);
        if (!settingsRegistry) {
            return;
        }

        settingsRegistry.registerCategory({
            id: 'physics',
            title: '物理',
            description: '2D 物理引擎配置',
            sections: [
                {
                    id: 'physics-world',
                    title: '物理世界',
                    description: '配置物理世界的基础参数',
                    settings: [
                        {
                            key: 'physics.gravity.x',
                            label: '重力 X',
                            type: 'number',
                            defaultValue: DEFAULT_PHYSICS_CONFIG.gravity.x,
                            description: '水平方向重力（通常为 0）',
                            step: 0.1
                        },
                        {
                            key: 'physics.gravity.y',
                            label: '重力 Y',
                            type: 'number',
                            defaultValue: DEFAULT_PHYSICS_CONFIG.gravity.y,
                            description: '垂直方向重力（负值向下）',
                            step: 0.1
                        },
                        {
                            key: 'physics.timestep',
                            label: '时间步长',
                            type: 'number',
                            defaultValue: DEFAULT_PHYSICS_CONFIG.timestep,
                            description: '固定物理更新时间步长（秒）',
                            min: 0.001,
                            max: 0.1,
                            step: 0.001
                        },
                        {
                            key: 'physics.maxSubsteps',
                            label: '最大子步数',
                            type: 'number',
                            defaultValue: DEFAULT_PHYSICS_CONFIG.maxSubsteps,
                            description: '每帧最大物理子步数',
                            min: 1,
                            max: 32,
                            step: 1
                        }
                    ]
                },
                {
                    id: 'physics-solver',
                    title: '求解器',
                    description: '配置物理求解器参数',
                    settings: [
                        {
                            key: 'physics.velocityIterations',
                            label: '速度迭代次数',
                            type: 'number',
                            defaultValue: DEFAULT_PHYSICS_CONFIG.velocityIterations,
                            description: '速度求解器迭代次数，越高越精确但性能开销越大',
                            min: 1,
                            max: 16,
                            step: 1
                        },
                        {
                            key: 'physics.positionIterations',
                            label: '位置迭代次数',
                            type: 'number',
                            defaultValue: DEFAULT_PHYSICS_CONFIG.positionIterations,
                            description: '位置求解器迭代次数，越高越精确但性能开销越大',
                            min: 1,
                            max: 16,
                            step: 1
                        }
                    ]
                },
                {
                    id: 'physics-behavior',
                    title: '行为',
                    description: '配置物理行为',
                    settings: [
                        {
                            key: 'physics.allowSleep',
                            label: '允许休眠',
                            type: 'boolean',
                            defaultValue: DEFAULT_PHYSICS_CONFIG.allowSleep,
                            description: '允许静止的刚体进入休眠状态以提高性能'
                        }
                    ]
                },
                {
                    id: 'physics-collision',
                    title: '碰撞层',
                    description: '配置碰撞层和碰撞矩阵',
                    settings: [
                        {
                            key: 'physics.collisionMatrix',
                            label: '碰撞矩阵',
                            type: 'collisionMatrix',
                            defaultValue: null,
                            description: '配置哪些层之间可以发生碰撞',
                            customRenderer: CollisionMatrixEditor
                        }
                    ]
                }
            ]
        });
    }

    getInspectorProviders() {
        // 使用 @Property 装饰器自动生成检视器，不再需要自定义
        return [];
    }

    getEntityCreationTemplates(): EntityCreationTemplate[] {
        const createPhysicsEntity = (
            name: string,
            colliderType: 'box' | 'circle' | 'capsule',
            isStatic: boolean = false
        ): number => {
            const scene = Core.scene;
            if (!scene) {
                throw new Error('Scene not available');
            }

            const entityStore = Core.services.resolve(EntityStoreService);
            const messageHub = Core.services.resolve(MessageHub);

            if (!entityStore || !messageHub) {
                throw new Error('EntityStoreService or MessageHub not available');
            }

            const count = entityStore.getAllEntities()
                .filter((e: Entity) => e.name.startsWith(name)).length;
            const entityName = `${name} ${count + 1}`;

            const entity = scene.createEntity(entityName);
            entity.addComponent(new TransformComponent());

            const rb = new Rigidbody2DComponent();
            if (isStatic) {
                rb.bodyType = 2; // Static
            }
            entity.addComponent(rb);

            switch (colliderType) {
                case 'box':
                    entity.addComponent(new BoxCollider2DComponent());
                    break;
                case 'circle':
                    entity.addComponent(new CircleCollider2DComponent());
                    break;
                case 'capsule':
                    entity.addComponent(new CapsuleCollider2DComponent());
                    break;
            }

            entityStore.addEntity(entity);
            messageHub.publish('entity:added', { entity });
            messageHub.publish('scene:modified', {});
            entityStore.selectEntity(entity);

            return entity.id;
        };

        return [
            {
                id: 'create-physics-box',
                label: '物理方块',
                icon: 'Square',
                category: 'physics',
                order: 100,
                create: () => createPhysicsEntity('PhysicsBox', 'box')
            },
            {
                id: 'create-physics-circle',
                label: '物理圆球',
                icon: 'Circle',
                category: 'physics',
                order: 101,
                create: () => createPhysicsEntity('PhysicsBall', 'circle')
            },
            {
                id: 'create-physics-capsule',
                label: '物理胶囊',
                icon: 'Pill',
                category: 'physics',
                order: 102,
                create: () => createPhysicsEntity('PhysicsCapsule', 'capsule')
            },
            {
                id: 'create-static-platform',
                label: '静态平台',
                icon: 'Minus',
                category: 'physics',
                order: 110,
                create: () => createPhysicsEntity('Platform', 'box', true)
            },
            {
                id: 'create-static-ground',
                label: '地面',
                icon: 'AlignVerticalJustifyEnd',
                category: 'physics',
                order: 111,
                create: (): number => {
                    const scene = Core.scene;
                    if (!scene) {
                        throw new Error('Scene not available');
                    }

                    const entityStore = Core.services.resolve(EntityStoreService);
                    const messageHub = Core.services.resolve(MessageHub);

                    if (!entityStore || !messageHub) {
                        throw new Error('EntityStoreService or MessageHub not available');
                    }

                    const entity = scene.createEntity('Ground');
                    entity.addComponent(new TransformComponent());

                    const rb = new Rigidbody2DComponent();
                    rb.bodyType = 2; // Static
                    entity.addComponent(rb);

                    const collider = new BoxCollider2DComponent();
                    collider.width = 200;
                    collider.height = 10;
                    entity.addComponent(collider);

                    entityStore.addEntity(entity);
                    messageHub.publish('entity:added', { entity });
                    messageHub.publish('scene:modified', {});
                    entityStore.selectEntity(entity);

                    return entity.id;
                }
            }
        ];
    }

    getComponentActions(): ComponentAction[] {
        return [];
    }
}

export const physics2DEditorModule = new Physics2DEditorModule();
