import { Entity } from '../Entity';
import { ComponentType, ComponentRegistry } from '../Core/ComponentStorage';
import { BitMask64Utils, BitMask64Data } from './BigIntCompatibility';
import { SparseSet } from './SparseSet';
import { Pool } from '../../Utils/Pool/Pool';
import { IPoolable } from '../../Utils/Pool/IPoolable';

/**
 * 可池化的实体集合
 *
 * 实现IPoolable接口，支持对象池复用以减少内存分配开销。
 */
class PoolableEntitySet extends Set<Entity> implements IPoolable {
    constructor(..._args: unknown[]) {
        super();
    }

    reset(): void {
        this.clear();
    }
}

/**
 * 组件稀疏集合实现
 *
 * 结合通用稀疏集合和组件位掩码
 *
 * 存储结构：
 * - 稀疏集合存储实体
 * - 位掩码数组存储组件信息
 * - 组件类型映射表
 */
export class ComponentSparseSet {
    /**
     * 实体稀疏集合
     *
     * 存储所有拥有组件的实体，提供O(1)的实体操作。
     */
    private _entities: SparseSet<Entity>;

    /**
     * 组件位掩码数组
     *
     * 与实体稀疏集合的密集数组对应，存储每个实体的组件位掩码。
     * 数组索引与稀疏集合的密集数组索引一一对应。
     */
    private _componentMasks: BitMask64Data[] = [];

    /**
     * 组件类型到实体集合的映射
     *
     * 维护每个组件类型对应的实体集合，用于快速的单组件查询。
     */
    private _componentToEntities = new Map<ComponentType, PoolableEntitySet>();

    /**
     * 实体集合对象池
     *
     * 使用core库的Pool系统来管理PoolableEntitySet对象的复用。
     */
    private static _entitySetPool = Pool.getPool(PoolableEntitySet, 50, 512);

    constructor() {
        this._entities = new SparseSet<Entity>();
    }

    /**
     * 添加实体到组件索引
     *
     * 分析实体的组件组成，生成位掩码，并更新所有相关索引。
     *
     * @param entity 要添加的实体
     */
    public addEntity(entity: Entity): void {
        // 如果实体已存在，先移除旧数据
        if (this._entities.has(entity)) {
            this.removeEntity(entity);
        }

        const componentMask = BitMask64Utils.clone(BitMask64Utils.ZERO);
        const entityComponents = new Set<ComponentType>();

        // 分析实体组件并构建位掩码
        for (const component of entity.components) {
            const componentType = component.constructor as ComponentType;
            entityComponents.add(componentType);

            // 获取组件位掩码并合并
            const bitMask = ComponentRegistry.getBitMask(componentType);
            BitMask64Utils.orInPlace(componentMask, bitMask);
        }

        // 添加实体到稀疏集合
        this._entities.add(entity);
        const entityIndex = this._entities.getIndex(entity)!;

        // 确保位掩码数组有足够空间
        while (this._componentMasks.length <= entityIndex) {
            this._componentMasks.push(BitMask64Utils.clone(BitMask64Utils.ZERO));
        }
        this._componentMasks[entityIndex] = componentMask;

        // 更新组件类型到实体的映射
        this.updateComponentMappings(entity, entityComponents, true);
    }

    /**
     * 从组件索引中移除实体
     *
     * 清理实体相关的所有索引数据，保持数据结构的紧凑性。
     *
     * @param entity 要移除的实体
     */
    public removeEntity(entity: Entity): void {
        const entityIndex = this._entities.getIndex(entity);
        if (entityIndex === undefined) {
            return; // 实体不存在
        }

        // 获取实体的组件类型集合
        const entityComponents = this.getEntityComponentTypes(entity);

        // 更新组件类型到实体的映射
        this.updateComponentMappings(entity, entityComponents, false);

        // 从稀疏集合中移除实体
        this._entities.remove(entity);

        // 维护位掩码数组的紧凑性
        const lastIndex = this._componentMasks.length - 1;
        if (entityIndex !== lastIndex) {
            // 将最后一个位掩码移动到当前位置
            this._componentMasks[entityIndex] = this._componentMasks[lastIndex]!;
        }
        this._componentMasks.pop();
    }

    /**
     * 查询包含指定组件的所有实体
     *
     * @param componentType 组件类型
     * @returns 包含该组件的实体集合
     */
    public queryByComponent(componentType: ComponentType): Set<Entity> {
        const entities = this._componentToEntities.get(componentType);
        return entities ? new Set(entities) : new Set<Entity>();
    }

    /**
     * 多组件查询（AND操作）
     *
     * 查找同时包含所有指定组件的实体。
     *
     * @param componentTypes 组件类型数组
     * @returns 满足条件的实体集合
     */
    public queryMultipleAnd(componentTypes: ComponentType[]): Set<Entity> {
        if (componentTypes.length === 0) {
            return new Set<Entity>();
        }

        if (componentTypes.length === 1) {
            return this.queryByComponent(componentTypes[0]!);
        }

        // 构建目标位掩码
        const targetMask = BitMask64Utils.clone(BitMask64Utils.ZERO);
        for (const componentType of componentTypes) {
            if (!ComponentRegistry.isRegistered(componentType)) {
                return new Set<Entity>(); // 未注册的组件类型，结果为空
            }
            const bitMask = ComponentRegistry.getBitMask(componentType);
            BitMask64Utils.orInPlace(targetMask, bitMask);
        }

        const result = ComponentSparseSet._entitySetPool.obtain();

        // 遍历所有实体，检查位掩码匹配
        this._entities.forEach((entity, index) => {
            const entityMask = this._componentMasks[index]!;
            if (BitMask64Utils.hasAll(entityMask, targetMask)) {
                result.add(entity);
            }
        });

        return result;
    }

    /**
     * 多组件查询（OR操作）
     *
     * 查找包含任意一个指定组件的实体。
     *
     * @param componentTypes 组件类型数组
     * @returns 满足条件的实体集合
     */
    public queryMultipleOr(componentTypes: ComponentType[]): Set<Entity> {
        if (componentTypes.length === 0) {
            return new Set<Entity>();
        }

        if (componentTypes.length === 1) {
            return this.queryByComponent(componentTypes[0]!);
        }

        // 构建目标位掩码
        const targetMask = BitMask64Utils.clone(BitMask64Utils.ZERO);
        for (const componentType of componentTypes) {
            if (ComponentRegistry.isRegistered(componentType)) {
                const bitMask = ComponentRegistry.getBitMask(componentType);
                BitMask64Utils.orInPlace(targetMask, bitMask);
            }
        }

        if (BitMask64Utils.equals(targetMask, BitMask64Utils.ZERO)) {
            return new Set<Entity>(); // 没有有效的组件类型
        }

        const result = ComponentSparseSet._entitySetPool.obtain();

        // 遍历所有实体，检查位掩码匹配
        this._entities.forEach((entity, index) => {
            const entityMask = this._componentMasks[index]!;
            if (BitMask64Utils.hasAny(entityMask, targetMask)) {
                result.add(entity);
            }
        });

        return result;
    }

    /**
     * 检查实体是否包含指定组件
     *
     * @param entity 实体
     * @param componentType 组件类型
     * @returns 是否包含该组件
     */
    public hasComponent(entity: Entity, componentType: ComponentType): boolean {
        const entityIndex = this._entities.getIndex(entity);
        if (entityIndex === undefined) {
            return false;
        }

        if (!ComponentRegistry.isRegistered(componentType)) {
            return false;
        }

        const entityMask = this._componentMasks[entityIndex]!;
        const componentMask = ComponentRegistry.getBitMask(componentType);

        return BitMask64Utils.hasAny(entityMask, componentMask);
    }

    /**
     * 获取实体的组件位掩码
     *
     * @param entity 实体
     * @returns 组件位掩码，如果实体不存在则返回undefined
     */
    public getEntityMask(entity: Entity): BitMask64Data | undefined {
        const entityIndex = this._entities.getIndex(entity);
        if (entityIndex === undefined) {
            return undefined;
        }
        return this._componentMasks[entityIndex];
    }

    /**
     * 获取所有实体
     *
     * @returns 所有实体的数组
     */
    public getAllEntities(): Entity[] {
        return this._entities.toArray();
    }

    /**
     * 获取实体数量
     */
    public get size(): number {
        return this._entities.size;
    }

    /**
     * 检查是否为空
     */
    public get isEmpty(): boolean {
        return this._entities.isEmpty;
    }

    /**
     * 遍历所有实体
     *
     * @param callback 遍历回调函数
     */
    public forEach(callback: (entity: Entity, mask: BitMask64Data, index: number) => void): void {
        this._entities.forEach((entity, index) => {
            callback(entity, this._componentMasks[index]!, index);
        });
    }

    /**
     * 清空所有数据
     */
    public clear(): void {
        this._entities.clear();
        this._componentMasks.length = 0;

        // 清理时将所有持有的实体集合返回到池中
        for (const entitySet of this._componentToEntities.values()) {
            ComponentSparseSet._entitySetPool.release(entitySet);
        }
        this._componentToEntities.clear();
    }

    /**
     * 获取内存使用统计
     */
    public getMemoryStats(): {
        entitiesMemory: number;
        masksMemory: number;
        mappingsMemory: number;
        totalMemory: number;
        } {
        const entitiesStats = this._entities.getMemoryStats();
        const masksMemory = this._componentMasks.length * 16; // 估计每个BigInt 16字节

        let mappingsMemory = this._componentToEntities.size * 16; // Map条目开销
        for (const entitySet of this._componentToEntities.values()) {
            mappingsMemory += entitySet.size * 8; // 每个实体引用8字节
        }

        return {
            entitiesMemory: entitiesStats.totalMemory,
            masksMemory,
            mappingsMemory,
            totalMemory: entitiesStats.totalMemory + masksMemory + mappingsMemory
        };
    }

    /**
     * 验证数据结构完整性
     */
    public validate(): boolean {
        // 检查稀疏集合的有效性
        if (!this._entities.validate()) {
            return false;
        }

        // 检查位掩码数组长度一致性
        if (this._componentMasks.length !== this._entities.size) {
            return false;
        }

        // 检查组件映射的一致性
        const allMappedEntities = new Set<Entity>();
        for (const entitySet of this._componentToEntities.values()) {
            for (const entity of entitySet) {
                allMappedEntities.add(entity);
            }
        }

        // 验证映射中的实体都在稀疏集合中
        for (const entity of allMappedEntities) {
            if (!this._entities.has(entity)) {
                return false;
            }
        }

        return true;
    }

    /**
     * 获取实体的组件类型集合
     */
    private getEntityComponentTypes(entity: Entity): Set<ComponentType> {
        const componentTypes = new Set<ComponentType>();
        for (const component of entity.components) {
            componentTypes.add(component.constructor as ComponentType);
        }
        return componentTypes;
    }

    /**
     * 更新组件类型到实体的映射
     */
    private updateComponentMappings(
        entity: Entity,
        componentTypes: Set<ComponentType>,
        add: boolean
    ): void {
        for (const componentType of componentTypes) {
            let entities = this._componentToEntities.get(componentType);

            if (add) {
                if (!entities) {
                    entities = ComponentSparseSet._entitySetPool.obtain();
                    this._componentToEntities.set(componentType, entities);
                }
                entities.add(entity);
            } else {
                if (entities) {
                    entities.delete(entity);
                    if (entities.size === 0) {
                        this._componentToEntities.delete(componentType);
                        ComponentSparseSet._entitySetPool.release(entities);
                    }
                }
            }
        }
    }

}
