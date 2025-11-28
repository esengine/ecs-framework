/**
 * Physics 2D Editor Module Entry
 * 2D 物理编辑器模块入口
 */

import type { ServiceContainer, Entity } from '@esengine/ecs-framework';
import { Core } from '@esengine/ecs-framework';
import type {
    IEditorModuleLoader,
    EntityCreationTemplate,
    ComponentAction
} from '@esengine/editor-core';
import {
    EntityStoreService,
    MessageHub,
    ComponentRegistry
} from '@esengine/editor-core';
import { TransformComponent } from '@esengine/ecs-components';

// Local imports
import { Rigidbody2DComponent } from '../components/Rigidbody2DComponent';
import { BoxCollider2DComponent } from '../components/BoxCollider2DComponent';
import { CircleCollider2DComponent } from '../components/CircleCollider2DComponent';
import { CapsuleCollider2DComponent } from '../components/CapsuleCollider2DComponent';
import { PolygonCollider2DComponent } from '../components/PolygonCollider2DComponent';
import { registerPhysics2DGizmos } from './gizmos/Physics2DGizmo';

/**
 * Physics 2D Editor Module
 * 2D 物理编辑器模块
 */
export class Physics2DEditorModule implements IEditorModuleLoader {
    async install(services: ServiceContainer): Promise<void> {
        // 注册组件到编辑器组件注册表
        // 组件检视器现在通过 @Property 装饰器自动生成
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
        // 清理资源
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

// Plugin exports
export { Physics2DPlugin } from './Physics2DPlugin';
export default physics2DEditorModule;
