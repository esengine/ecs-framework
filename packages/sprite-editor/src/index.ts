/**
 * @esengine/sprite-editor
 *
 * Editor support for @esengine/sprite - inspectors, field editors, and entity templates
 * 精灵编辑器支持 - 检视器、字段编辑器和实体模板
 */

import type { Entity, ServiceContainer } from '@esengine/ecs-framework';
import { Core } from '@esengine/ecs-framework';
import type {
    IEditorModuleLoader,
    EntityCreationTemplate,
    IEditorPlugin,
    ModuleManifest
} from '@esengine/editor-core';
import {
    EntityStoreService,
    MessageHub,
    ComponentRegistry,
    ComponentInspectorRegistry
} from '@esengine/editor-core';
import { TransformComponent } from '@esengine/engine-core';

// Runtime imports from @esengine/sprite
import {
    SpriteComponent,
    SpriteAnimatorComponent,
    SpriteRuntimeModule
} from '@esengine/sprite';

// Inspector
import { SpriteComponentInspector } from './SpriteComponentInspector';

// Export inspector
export { SpriteComponentInspector } from './SpriteComponentInspector';

/**
 * 精灵编辑器模块
 * Sprite Editor Module
 */
export class SpriteEditorModule implements IEditorModuleLoader {
    async install(services: ServiceContainer): Promise<void> {
        // 注册组件检查器 | Register component inspectors
        const componentInspectorRegistry = services.tryResolve(ComponentInspectorRegistry);
        if (componentInspectorRegistry) {
            componentInspectorRegistry.register(new SpriteComponentInspector());
        }

        // 注册 Sprite 组件到编辑器组件注册表 | Register Sprite components to editor component registry
        const componentRegistry = services.resolve(ComponentRegistry);
        if (componentRegistry) {
            const spriteComponents = [
                {
                    name: 'Sprite',
                    type: SpriteComponent,
                    category: 'components.category.rendering',
                    description: '2D sprite rendering component',
                    icon: 'Image'
                },
                {
                    name: 'SpriteAnimator',
                    type: SpriteAnimatorComponent,
                    category: 'components.category.rendering',
                    description: 'Sprite frame animation component',
                    icon: 'Film'
                },
            ];

            for (const comp of spriteComponents) {
                componentRegistry.register({
                    name: comp.name,
                    type: comp.type,
                    category: comp.category,
                    description: comp.description,
                    icon: comp.icon
                });
            }
        }
    }

    async uninstall(): Promise<void> {
        // Nothing to cleanup
    }

    getEntityCreationTemplates(): EntityCreationTemplate[] {
        return [
            // Sprite Entity
            {
                id: 'create-sprite',
                label: 'Sprite',
                icon: 'Image',
                category: 'rendering',
                order: 100,
                create: (): number => {
                    return this.createSpriteEntity('Sprite');
                }
            },

            // Animated Sprite Entity
            {
                id: 'create-animated-sprite',
                label: 'Animated Sprite',
                icon: 'Film',
                category: 'rendering',
                order: 101,
                create: (): number => {
                    return this.createSpriteEntity('AnimatedSprite', (entity) => {
                        const animator = new SpriteAnimatorComponent();
                        animator.autoPlay = true;
                        entity.addComponent(animator);
                    });
                }
            },
        ];
    }

    /**
     * 创建 Sprite 实体的辅助方法
     * Helper method to create Sprite entity
     */
    private createSpriteEntity(baseName: string, configure?: (entity: Entity) => void): number {
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

        // Add Transform component
        const transform = new TransformComponent();
        entity.addComponent(transform);

        // Add Sprite component
        const sprite = new SpriteComponent();
        entity.addComponent(sprite);

        if (configure) {
            configure(entity);
        }

        entityStore.addEntity(entity);
        messageHub.publish('entity:added', { entity });
        messageHub.publish('scene:modified', {});
        entityStore.selectEntity(entity);

        return entity.id;
    }
}

export const spriteEditorModule = new SpriteEditorModule();

/**
 * Sprite 插件清单
 * Sprite Plugin Manifest
 */
const manifest: ModuleManifest = {
    id: '@esengine/sprite',
    name: '@esengine/sprite',
    displayName: 'Sprite',
    version: '1.0.0',
    description: 'Sprite and animation components for 2D rendering',
    category: 'Rendering',
    isCore: false,
    defaultEnabled: true,
    isEngineModule: true,
    dependencies: ['engine-core'],
    exports: {
        components: ['SpriteComponent', 'SpriteAnimatorComponent'],
        systems: ['SpriteRenderSystem']
    }
};

/**
 * 完整的 Sprite 插件（运行时 + 编辑器）
 * Complete Sprite Plugin (runtime + editor)
 */
export const SpritePlugin: IEditorPlugin = {
    manifest,
    runtimeModule: new SpriteRuntimeModule(),
    editorModule: spriteEditorModule
};

export default spriteEditorModule;
