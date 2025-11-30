/**
 * @esengine/camera-editor
 *
 * Editor support for @esengine/camera
 * 相机编辑器支持
 */

import type { Entity, ServiceContainer } from '@esengine/ecs-framework';
import { Core, TransformComponent } from '@esengine/ecs-framework';
import type {
    IEditorModuleLoader,
    EntityCreationTemplate
} from '@esengine/editor-core';
import {
    EntityStoreService,
    MessageHub,
    ComponentRegistry
} from '@esengine/editor-core';
import { CameraComponent } from '@esengine/camera';

export class CameraEditorModule implements IEditorModuleLoader {
    async install(services: ServiceContainer): Promise<void> {
        const componentRegistry = services.resolve(ComponentRegistry);
        if (componentRegistry) {
            componentRegistry.register({
                name: 'Camera',
                type: CameraComponent,
                category: 'components.category.rendering',
                description: 'Camera for 2D/3D rendering',
                icon: 'Camera'
            });
        }
    }

    async uninstall(): Promise<void> {
        // Nothing to cleanup
    }

    getEntityCreationTemplates(): EntityCreationTemplate[] {
        return [
            {
                id: 'create-camera',
                label: 'Camera',
                icon: 'Camera',
                category: 'rendering',
                order: 50,
                create: (): number => {
                    return this.createCameraEntity('Camera');
                }
            },
        ];
    }

    private createCameraEntity(baseName: string): number {
        const scene = Core.scene;
        if (!scene) {
            throw new Error('Scene not available');
        }

        const entityStore = Core.services.resolve(EntityStoreService);
        const messageHub = Core.services.resolve(MessageHub);

        if (!entityStore || !messageHub) {
            throw new Error('EntityStoreService or MessageHub not available');
        }

        const existingCount = entityStore.getAllEntities()
            .filter((e: Entity) => e.name.startsWith(baseName)).length;
        const entityName = existingCount > 0 ? `${baseName} ${existingCount + 1}` : baseName;

        const entity = scene.createEntity(entityName);

        const transform = new TransformComponent();
        entity.addComponent(transform);

        const camera = new CameraComponent();
        entity.addComponent(camera);

        entityStore.addEntity(entity);
        messageHub.publish('entity:added', { entity });
        messageHub.publish('scene:modified', {});
        entityStore.selectEntity(entity);

        return entity.id;
    }
}

export const cameraEditorModule = new CameraEditorModule();

export default cameraEditorModule;
