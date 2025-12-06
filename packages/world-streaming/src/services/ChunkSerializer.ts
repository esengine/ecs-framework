import type { Entity, IScene } from '@esengine/ecs-framework';
import { TransformComponent } from '@esengine/engine-core';
import type { IChunkCoord, IChunkData, ISerializedEntity, IChunkBounds } from '../types';

/**
 * 区块序列化器接口
 *
 * Interface for chunk serialization/deserialization.
 */
export interface IChunkSerializer {
    serialize(coord: IChunkCoord, entities: Entity[], bounds: IChunkBounds): IChunkData;
    deserialize(data: IChunkData, scene: IScene): Entity[];
}

/**
 * 默认区块序列化器
 *
 * Default chunk serializer implementation.
 * Override for custom serialization logic.
 */
export class ChunkSerializer implements IChunkSerializer {
    private static readonly DATA_VERSION = 1;

    /**
     * 序列化区块
     *
     * Serialize entities within a chunk.
     */
    serialize(coord: IChunkCoord, entities: Entity[], bounds: IChunkBounds): IChunkData {
        const serializedEntities: ISerializedEntity[] = [];

        for (const entity of entities) {
            const transform = entity.getComponent(TransformComponent);
            if (!transform) continue;

            const serialized: ISerializedEntity = {
                name: entity.name,
                localPosition: {
                    x: transform.position.x - bounds.minX,
                    y: transform.position.y - bounds.minY
                },
                components: this.serializeComponents(entity)
            };

            serializedEntities.push(serialized);
        }

        return {
            coord,
            entities: serializedEntities,
            version: ChunkSerializer.DATA_VERSION
        };
    }

    /**
     * 反序列化区块
     *
     * Deserialize chunk data and create entities.
     */
    deserialize(data: IChunkData, scene: IScene): Entity[] {
        const entities: Entity[] = [];
        const bounds = this.calculateBounds(data.coord);

        for (const entityData of data.entities) {
            const entity = scene.createEntity(entityData.name);

            const transform = entity.getComponent(TransformComponent);
            if (transform) {
                transform.setPosition(
                    bounds.minX + entityData.localPosition.x,
                    bounds.minY + entityData.localPosition.y
                );
            }

            this.deserializeComponents(entity, entityData.components);
            entities.push(entity);
        }

        return entities;
    }

    /**
     * 序列化实体组件
     *
     * Serialize entity components.
     */
    protected serializeComponents(entity: Entity): Record<string, unknown> {
        const componentsData: Record<string, unknown> = {};

        for (const component of entity.components) {
            const componentName = component.constructor.name;

            if (this.shouldSerializeComponent(componentName)) {
                componentsData[componentName] = this.serializeComponent(component);
            }
        }

        return componentsData;
    }

    /**
     * 反序列化组件数据
     *
     * Deserialize component data to entity.
     */
    protected deserializeComponents(_entity: Entity, _components: Record<string, unknown>): void {
        // Override in subclass to handle specific component types
    }

    /**
     * 检查组件是否需要序列化
     *
     * Check if component should be serialized.
     */
    protected shouldSerializeComponent(componentName: string): boolean {
        const excludeList = ['TransformComponent', 'ChunkComponent', 'StreamingAnchorComponent'];
        return !excludeList.includes(componentName);
    }

    /**
     * 序列化单个组件
     *
     * Serialize a single component.
     */
    protected serializeComponent(component: unknown): unknown {
        if (typeof component === 'object' && component !== null && 'toJSON' in component) {
            return (component as { toJSON: () => unknown }).toJSON();
        }
        return {};
    }

    /**
     * 计算区块边界
     *
     * Calculate chunk bounds from coordinates.
     */
    private calculateBounds(coord: IChunkCoord, chunkSize: number = 512): IChunkBounds {
        return {
            minX: coord.x * chunkSize,
            minY: coord.y * chunkSize,
            maxX: (coord.x + 1) * chunkSize,
            maxY: (coord.y + 1) * chunkSize
        };
    }
}
