import { Core, Entity, HierarchySystem, HierarchyComponent } from '@esengine/ecs-framework';
import { EntityStoreService, MessageHub } from '@esengine/editor-core';
import { TransformComponent } from '@esengine/engine-core';
import { TilemapComponent } from '@esengine/tilemap';
import { BaseCommand } from '../BaseCommand';

/**
 * Tilemap创建选项
 */
export interface TilemapCreationOptions {
    /** 地图宽度（瓦片数），默认10 */
    width?: number;
    /** 地图高度（瓦片数），默认10 */
    height?: number;
    /** 瓦片宽度（像素），默认32 */
    tileWidth?: number;
    /** 瓦片高度（像素），默认32 */
    tileHeight?: number;
    /** 渲染层级，默认0 */
    sortingOrder?: number;
    /** 初始Tileset源路径 */
    tilesetSource?: string;
}

/**
 * 创建带Tilemap组件的实体命令
 */
export class CreateTilemapEntityCommand extends BaseCommand {
    private entity: Entity | null = null;
    private entityId: number | null = null;

    constructor(
        private entityStore: EntityStoreService,
        private messageHub: MessageHub,
        private entityName: string,
        private parentEntity?: Entity,
        private options: TilemapCreationOptions = {}
    ) {
        super();
    }

    execute(): void {
        const scene = Core.scene;
        if (!scene) {
            throw new Error('场景未初始化');
        }

        this.entity = scene.createEntity(this.entityName);
        this.entityId = this.entity.id;

        // 添加 Transform 和 Hierarchy 组件
        this.entity.addComponent(new TransformComponent());
        this.entity.addComponent(new HierarchyComponent());

        // 创建并配置Tilemap组件
        const tilemapComponent = new TilemapComponent();

        // 应用配置选项
        const {
            width = 10,
            height = 10,
            tileWidth = 32,
            tileHeight = 32,
            sortingOrder = 0,
            tilesetSource
        } = this.options;

        tilemapComponent.tileWidth = tileWidth;
        tilemapComponent.tileHeight = tileHeight;
        tilemapComponent.sortingOrder = sortingOrder;

        // 初始化空白地图
        tilemapComponent.initializeEmpty(width, height);

        // 添加初始 Tileset
        if (tilesetSource) {
            tilemapComponent.addTileset(tilesetSource);
        }

        this.entity.addComponent(tilemapComponent);

        if (this.parentEntity) {
            const hierarchySystem = scene.getSystem(HierarchySystem);
            hierarchySystem?.setParent(this.entity, this.parentEntity);
        }

        this.entityStore.addEntity(this.entity, this.parentEntity);
        this.entityStore.selectEntity(this.entity);

        this.messageHub.publish('entity:added', { entity: this.entity });
        this.messageHub.publish('tilemap:created', {
            entity: this.entity,
            component: tilemapComponent
        });
    }

    undo(): void {
        if (!this.entity) return;

        this.entityStore.removeEntity(this.entity);
        this.entity.destroy();

        this.messageHub.publish('entity:removed', { entityId: this.entityId });

        this.entity = null;
    }

    getDescription(): string {
        return `创建Tilemap实体: ${this.entityName}`;
    }

    getCreatedEntity(): Entity | null {
        return this.entity;
    }
}
