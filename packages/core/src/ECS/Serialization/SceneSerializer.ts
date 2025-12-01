/**
 * 场景序列化器
 *
 * 负责整个场景的序列化和反序列化，包括实体、组件等
 */

import type { IScene } from '../IScene';
import { Entity } from '../Entity';
import { ComponentType, ComponentRegistry } from '../Core/ComponentStorage';
import { EntitySerializer, SerializedEntity } from './EntitySerializer';
import { getComponentTypeName } from '../Decorators';
import { getSerializationMetadata } from './SerializationDecorators';
import { BinarySerializer } from '../../Utils/BinarySerializer';
import { HierarchySystem } from '../Systems/HierarchySystem';
import { HierarchyComponent } from '../Components/HierarchyComponent';

/**
 * 场景序列化格式
 */
export type SerializationFormat = 'json' | 'binary';

/**
 * 场景序列化策略
 */
export type DeserializationStrategy = 'merge' | 'replace';

/**
 * 版本迁移函数
 */
export type MigrationFunction = (
    oldVersion: number,
    newVersion: number,
    data: any
) => any;

/**
 * 场景序列化选项
 */
export interface SceneSerializationOptions {
    /**
     * 要序列化的组件类型列表
     * 如果未指定，则序列化所有可序列化的组件
     */
    components?: ComponentType[];

    /**
     * 是否序列化系统状态（当前不支持）
     */
    systems?: boolean;

    /**
     * 序列化格式
     */
    format?: SerializationFormat;

    /**
     * 是否美化JSON输出（仅在format='json'时有效）
     */
    pretty?: boolean;

    /**
     * 是否包含元数据（如序列化时间、版本等）
     */
    includeMetadata?: boolean;
}

/**
 * 场景反序列化选项
 */
export interface SceneDeserializationOptions {
    /**
     * 反序列化策略
     * - 'merge': 合并到现有场景
     * - 'replace': 替换现有场景内容
     */
    strategy?: DeserializationStrategy;

    /**
     * 版本迁移函数
     */
    migration?: MigrationFunction;

    /**
     * 是否保持原始实体ID
     */
    preserveIds?: boolean;

    /**
     * 组件类型注册表
     * 如果未提供，将尝试从全局注册表获取
     */
    componentRegistry?: Map<string, ComponentType>;
}

/**
 * 序列化后的场景数据
 */
export interface SerializedScene {
    /**
     * 场景名称
     */
    name: string;

    /**
     * 序列化版本
     */
    version: number;

    /**
     * 序列化时间戳
     */
    timestamp?: number;

    /**
     * 场景自定义数据
     *
     * 存储场景级别的配置和状态
     */
    sceneData?: Record<string, any>;

    /**
     * 实体列表
     */
    entities: SerializedEntity[];

    /**
     * 元数据
     */
    metadata?: {
        entityCount: number;
        componentTypeCount: number;
        serializationOptions?: SceneSerializationOptions;
    };

    /**
     * 组件类型注册信息
     */
    componentTypeRegistry: Array<{
        typeName: string;
        version: number;
    }>;
}

/**
 * 场景序列化器类
 */
export class SceneSerializer {
    /**
     * 当前序列化版本
     */
    private static readonly SERIALIZATION_VERSION = 1;

    /**
     * 序列化场景
     *
     * @param scene 要序列化的场景
     * @param options 序列化选项
     * @returns 序列化后的数据（JSON字符串或二进制Uint8Array）
     */
    public static serialize(scene: IScene, options?: SceneSerializationOptions): string | Uint8Array {
        const opts: SceneSerializationOptions = {
            systems: false,
            format: 'json',
            pretty: true,
            includeMetadata: true,
            ...options
        };

        // 过滤实体和组件
        const entities = this.filterEntities(scene, opts);

        // 获取层级系统用于序列化子实体
        const hierarchySystem = scene.getSystem(HierarchySystem);

        // 序列化实体（传入 hierarchySystem 以正确序列化子实体）
        const serializedEntities = EntitySerializer.serializeEntities(entities, true, hierarchySystem ?? undefined);

        // 收集组件类型信息
        const componentTypeRegistry = this.buildComponentTypeRegistry(entities);

        // 序列化场景自定义数据
        const sceneData = this.serializeSceneData(scene.sceneData);

        // 构建序列化数据
        const serializedScene: SerializedScene = {
            name: scene.name,
            version: this.SERIALIZATION_VERSION,
            entities: serializedEntities,
            componentTypeRegistry
        };

        // 添加场景数据（如果有）
        if (sceneData && Object.keys(sceneData).length > 0) {
            serializedScene.sceneData = sceneData;
        }

        // 添加元数据
        if (opts.includeMetadata) {
            serializedScene.timestamp = Date.now();
            serializedScene.metadata = {
                entityCount: serializedEntities.length,
                componentTypeCount: componentTypeRegistry.length,
                serializationOptions: opts
            };
        }

        if (opts.format === 'json') {
            return opts.pretty
                ? JSON.stringify(serializedScene, null, 2)
                : JSON.stringify(serializedScene);
        } else {
            return BinarySerializer.encode(serializedScene);
        }
    }

    /**
     * 反序列化场景
     *
     * @param scene 目标场景
     * @param saveData 序列化的数据（JSON字符串或二进制Uint8Array）
     * @param options 反序列化选项
     */
    public static deserialize(
        scene: IScene,
        saveData: string | Uint8Array,
        options?: SceneDeserializationOptions
    ): void {
        const opts: SceneDeserializationOptions = {
            strategy: 'replace',
            preserveIds: false,
            ...options
        };

        let serializedScene: SerializedScene;
        try {
            if (typeof saveData === 'string') {
                serializedScene = JSON.parse(saveData);
            } else {
                serializedScene = BinarySerializer.decode(saveData) as SerializedScene;
            }
        } catch (error) {
            throw new Error(`Failed to parse save data: ${error}`);
        }

        // 版本迁移
        if (opts.migration && serializedScene.version !== this.SERIALIZATION_VERSION) {
            serializedScene = opts.migration(
                serializedScene.version,
                this.SERIALIZATION_VERSION,
                serializedScene
            );
        }

        // 构建组件注册表
        const componentRegistry = opts.componentRegistry || this.getGlobalComponentRegistry();

        // 根据策略处理场景
        if (opts.strategy === 'replace') {
            // 清空场景
            scene.destroyAllEntities();
        }

        // ID生成器
        const idGenerator = () => scene.identifierPool.checkOut();

        // 获取层级系统
        const hierarchySystem = scene.getSystem(HierarchySystem);

        // 反序列化实体
        const { rootEntities, allEntities } = EntitySerializer.deserializeEntities(
            serializedScene.entities,
            componentRegistry,
            idGenerator,
            opts.preserveIds || false,
            scene,
            hierarchySystem
        );

        // 将所有实体添加到场景（包括子实体）
        // 先添加根实体，再递归添加子实体
        for (const entity of rootEntities) {
            scene.addEntity(entity, true);
            this.addChildrenRecursively(entity, scene, hierarchySystem, allEntities);
        }

        // 统一清理缓存（批量操作完成后）
        scene.querySystem.clearCache();
        scene.clearSystemEntityCaches();

        // 反序列化场景自定义数据
        if (serializedScene.sceneData) {
            this.deserializeSceneData(serializedScene.sceneData, scene.sceneData);
        }

        // 调用所有组件的 onDeserialized 生命周期方法
        // Call onDeserialized lifecycle method on all components
        const deserializedPromises: Promise<void>[] = [];
        for (const entity of allEntities.values()) {
            this.callOnDeserializedForEntity(entity, deserializedPromises);
        }

        // 如果有异步的 onDeserialized，在后台执行
        if (deserializedPromises.length > 0) {
            Promise.all(deserializedPromises).catch(error => {
                console.error('Error in onDeserialized:', error);
            });
        }
    }

    /**
     * 调用实体所有组件的 onDeserialized 方法（不递归）
     */
    private static callOnDeserializedForEntity(
        entity: Entity,
        promises: Promise<void>[]
    ): void {
        for (const component of entity.components) {
            try {
                const result = component.onDeserialized();
                if (result instanceof Promise) {
                    promises.push(result);
                }
            } catch (error) {
                console.error(`Error calling onDeserialized on component ${component.constructor.name}:`, error);
            }
        }
    }

    /**
     * 递归添加实体的所有子实体到场景
     *
     * 修复反序列化时子实体丢失的问题：
     * EntitySerializer.deserialize会提前设置子实体的scene引用，
     * 导致Entity.addChild的条件判断(!child.scene)跳过scene.addEntity调用。
     * 因此需要在SceneSerializer中统一递归添加所有子实体。
     *
     * @param entity 父实体
     * @param scene 目标场景
     * @param hierarchySystem 层级系统
     */
    private static addChildrenRecursively(
        entity: Entity,
        scene: IScene,
        hierarchySystem?: HierarchySystem | null,
        childEntitiesMap?: Map<number, Entity>
    ): void {
        const hierarchy = entity.getComponent(HierarchyComponent);
        if (!hierarchy || hierarchy.childIds.length === 0) return;

        // 获取子实体
        // 注意：此时子实体还没有被添加到场景，所以不能用 scene.findEntityById
        // 需要从 childEntitiesMap 中查找（如果提供了的话）
        for (const childId of hierarchy.childIds) {
            // 尝试从 map 中获取，否则从场景获取（用于已添加的情况）
            const child = childEntitiesMap?.get(childId) ?? scene.findEntityById(childId);
            if (child) {
                scene.addEntity(child, true);  // 延迟缓存清理
                this.addChildrenRecursively(child, scene, hierarchySystem, childEntitiesMap);
            }
        }
    }

    /**
     * 序列化场景自定义数据
     *
     * 将 Map<string, any> 转换为普通对象
     */
    private static serializeSceneData(sceneData: Map<string, any>): Record<string, any> {
        const result: Record<string, any> = {};

        for (const [key, value] of sceneData) {
            result[key] = this.serializeValue(value);
        }

        return result;
    }

    /**
     * 反序列化场景自定义数据
     *
     * 将普通对象还原为 Map<string, any>
     */
    private static deserializeSceneData(
        data: Record<string, any>,
        targetMap: Map<string, any>
    ): void {
        targetMap.clear();

        for (const [key, value] of Object.entries(data)) {
            targetMap.set(key, this.deserializeValue(value));
        }
    }

    /**
     * 序列化单个值
     */
    private static serializeValue(value: any): any {
        if (value === null || value === undefined) {
            return value;
        }

        // 基本类型
        const type = typeof value;
        if (type === 'string' || type === 'number' || type === 'boolean') {
            return value;
        }

        // Date
        if (value instanceof Date) {
            return { __type: 'Date', value: value.toISOString() };
        }

        // Map
        if (value instanceof Map) {
            return { __type: 'Map', value: Array.from(value.entries()) };
        }

        // Set
        if (value instanceof Set) {
            return { __type: 'Set', value: Array.from(value) };
        }

        // 数组
        if (Array.isArray(value)) {
            return value.map((item) => this.serializeValue(item));
        }

        // 普通对象
        if (type === 'object') {
            const result: Record<string, any> = {};
            for (const key in value) {
                if (value.hasOwnProperty(key)) {
                    result[key] = this.serializeValue(value[key]);
                }
            }
            return result;
        }

        // 其他类型不序列化
        return undefined;
    }

    /**
     * 反序列化单个值
     */
    private static deserializeValue(value: any): any {
        if (value === null || value === undefined) {
            return value;
        }

        // 基本类型
        const type = typeof value;
        if (type === 'string' || type === 'number' || type === 'boolean') {
            return value;
        }

        // 处理特殊类型标记
        if (type === 'object' && value.__type) {
            switch (value.__type) {
                case 'Date':
                    return new Date(value.value);
                case 'Map':
                    return new Map(value.value);
                case 'Set':
                    return new Set(value.value);
            }
        }

        // 数组
        if (Array.isArray(value)) {
            return value.map((item) => this.deserializeValue(item));
        }

        // 普通对象
        if (type === 'object') {
            const result: Record<string, any> = {};
            for (const key in value) {
                if (value.hasOwnProperty(key)) {
                    result[key] = this.deserializeValue(value[key]);
                }
            }
            return result;
        }

        return value;
    }

    /**
     * 过滤要序列化的实体和组件
     */
    private static filterEntities(scene: IScene, options: SceneSerializationOptions): Entity[] {
        const entities = Array.from(scene.entities.buffer);

        // 如果指定了组件类型过滤
        if (options.components && options.components.length > 0) {
            const componentTypeSet = new Set(options.components);

            // 只返回拥有指定组件的实体
            return entities.filter((entity) => {
                return Array.from(entity.components).some((component) =>
                    componentTypeSet.has(component.constructor as ComponentType)
                );
            });
        }

        return entities;
    }

    /**
     * 构建组件类型注册表
     */
    private static buildComponentTypeRegistry(
        entities: Entity[]
    ): Array<{ typeName: string; version: number }> {
        const registry = new Map<string, number>();

        for (const entity of entities) {
            for (const component of entity.components) {
                const componentType = component.constructor as ComponentType;
                const typeName = getComponentTypeName(componentType);
                const metadata = getSerializationMetadata(component);

                if (metadata && !registry.has(typeName)) {
                    registry.set(typeName, metadata.options.version);
                }
            }
        }

        return Array.from(registry.entries()).map(([typeName, version]) => ({
            typeName,
            version
        }));
    }

    /**
     * 获取全局组件注册表
     *
     * 从所有已注册的组件类型构建注册表
     */
    private static getGlobalComponentRegistry(): Map<string, ComponentType> {
        return ComponentRegistry.getAllComponentNames() as Map<string, ComponentType>;
    }

    /**
     * 验证保存数据的有效性
     *
     * @param saveData 序列化的数据
     * @returns 验证结果
     */
    public static validate(saveData: string): {
        valid: boolean;
        version?: number;
        errors?: string[];
    } {
        const errors: string[] = [];

        try {
            const data = JSON.parse(saveData);

            if (!data.version) {
                errors.push('Missing version field');
            }

            if (!data.entities || !Array.isArray(data.entities)) {
                errors.push('Missing or invalid entities field');
            }

            if (!data.componentTypeRegistry || !Array.isArray(data.componentTypeRegistry)) {
                errors.push('Missing or invalid componentTypeRegistry field');
            }

            return {
                valid: errors.length === 0,
                version: data.version,
                ...(errors.length > 0 && { errors })
            };
        } catch (error) {
            return {
                valid: false,
                errors: [`JSON parse error: ${error}`]
            };
        }
    }

    /**
     * 获取保存数据的信息（不完全反序列化）
     *
     * @param saveData 序列化的数据
     * @returns 保存数据的元信息
     */
    public static getInfo(saveData: string): {
        name: string;
        version: number;
        timestamp?: number;
        entityCount: number;
        componentTypeCount: number;
    } | null {
        try {
            const data: SerializedScene = JSON.parse(saveData);

            return {
                name: data.name,
                version: data.version,
                ...(data.timestamp !== undefined && { timestamp: data.timestamp }),
                entityCount: data.metadata?.entityCount || data.entities.length,
                componentTypeCount: data.componentTypeRegistry.length
            };
        } catch (error) {
            return null;
        }
    }
}
