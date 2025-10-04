import { Entity } from '../Entity';
import { ComponentType } from './ComponentStorage';
import { BitMask64Data, BitMask64Utils, ComponentTypeManager } from "../Utils";
import { BitMaskHashMap } from "../Utils/BitMaskHashMap";

/**
 * 原型标识符
 */
export type ArchetypeId = BitMask64Data;

/**
 * 原型数据结构
 */
export interface Archetype {
    /** 原型唯一标识符 */
    id: ArchetypeId;
    /** 包含的组件类型 */
    componentTypes: ComponentType[];
    /** 属于该原型的实体集合 */
    entities: Set<Entity>;
}

/**
 * 原型查询结果
 */
export interface ArchetypeQueryResult {
    /** 匹配的原型列表 */
    archetypes: Archetype[];
    /** 所有匹配实体的总数 */
    totalEntities: number;
}

/**
 * Archetype系统
 * 
 * 根据实体的组件组合将实体分组到不同的原型中，提供高效的查询性能。
 */
export class ArchetypeSystem {
    /** 所有原型的映射表 */
    private _archetypes = new BitMaskHashMap<Archetype>();

    /** 实体到原型的映射 */
    private _entityToArchetype = new Map<Entity, Archetype>();

    /** 组件类型到原型的映射 */
    private _componentToArchetypes = new Map<ComponentType, Set<Archetype>>();

    /** 实体组件类型缓存 */
    private _entityComponentTypesCache = new Map<Entity, ComponentType[]>();

    /** 所有原型 */
    private _allArchetypes: Archetype[] = [];
    
    /**
     * 添加实体到原型系统
     */
    public addEntity(entity: Entity): void {
        const componentTypes = this.getEntityComponentTypes(entity);
        const archetypeId = this.generateArchetypeId(componentTypes);

        let archetype = this._archetypes.get(archetypeId);
        if (!archetype) {
            archetype = this.createArchetype(componentTypes);
        }

        archetype.entities.add(entity);
        this._entityToArchetype.set(entity, archetype);

        this.updateComponentIndexes(archetype, componentTypes, true);
    }
    
    /**
     * 从原型系统中移除实体
     */
    public removeEntity(entity: Entity): void {
        const archetype = this._entityToArchetype.get(entity);
        if (!archetype) return;

        archetype.entities.delete(entity);

        // 清理实体相关缓存
        this._entityComponentTypesCache.delete(entity);
        this._entityToArchetype.delete(entity);
    }

    /**
     * 更新实体的原型归属
     *
     * 当实体的组件组合发生变化时调用此方法，将实体从旧原型移动到新原型。
     * 如果新的组件组合对应的原型不存在，将自动创建新原型。
     *
     * @param entity 要更新的实体
     */
    public updateEntity(entity: Entity): void {
        const currentArchetype = this._entityToArchetype.get(entity);

        // 清理实体组件类型缓存，强制重新计算
        this._entityComponentTypesCache.delete(entity);
        const newComponentTypes = this.getEntityComponentTypes(entity);
        const newArchetypeId = this.generateArchetypeId(newComponentTypes);

        // 如果实体已在正确的原型中，无需更新
        if (currentArchetype && currentArchetype.id === newArchetypeId) {
            return;
        }

        // 从旧原型中移除实体
        if (currentArchetype) {
            currentArchetype.entities.delete(entity);
        }

        // 获取或创建新原型
        let newArchetype = this._archetypes.get(newArchetypeId);
        if (!newArchetype) {
            newArchetype = this.createArchetype(newComponentTypes);
        }

        // 将实体添加到新原型
        newArchetype.entities.add(entity);
        this._entityToArchetype.set(entity, newArchetype);

        // 更新组件索引
        if (currentArchetype) {
            this.updateComponentIndexes(currentArchetype, currentArchetype.componentTypes, false);
        }
        this.updateComponentIndexes(newArchetype, newComponentTypes, true);

    }
    
    /**
     * 查询包含指定组件组合的原型
     *
     * @param componentTypes 要查询的组件类型列表
     * @param operation 查询操作类型：'AND'（包含所有）或 'OR'（包含任意）
     * @returns 匹配的原型列表及实体总数
     */
    public queryArchetypes(componentTypes: ComponentType[], operation: 'AND' | 'OR' = 'AND'): ArchetypeQueryResult {

        const matchingArchetypes: Archetype[] = [];
        let totalEntities = 0;

        if (operation === 'AND') {
            // 生成查询的 BitMask
            const queryMask = this.generateArchetypeId(componentTypes);

            // 使用 BitMask 位运算快速判断原型是否包含所有指定组件
            for (const archetype of this._allArchetypes) {
                if (BitMask64Utils.hasAll(archetype.id, queryMask)) {
                    matchingArchetypes.push(archetype);
                    totalEntities += archetype.entities.size;
                }
            }
        } else {
            const foundArchetypes = new Set<Archetype>();
            
            for (const componentType of componentTypes) {
                const archetypes = this._componentToArchetypes.get(componentType);
                if (archetypes) {
                    for (const archetype of archetypes) {
                        foundArchetypes.add(archetype);
                    }
                }
            }
            
            for (const archetype of foundArchetypes) {
                matchingArchetypes.push(archetype);
                totalEntities += archetype.entities.size;
            }
        }
        
        return {
            archetypes: matchingArchetypes,
            totalEntities
        };
    }
    
    /**
     * 获取实体所属的原型
     */
    public getEntityArchetype(entity: Entity): Archetype | undefined {
        return this._entityToArchetype.get(entity);
    }
    
    /**
     * 获取所有原型
     */
    public getAllArchetypes(): Archetype[] {
        return this._allArchetypes.slice();
    }

    /**
     * 获取包含指定组件类型的所有实体
     */
    public getEntitiesByComponent(componentType: ComponentType): Entity[] {
        const archetypes = this._componentToArchetypes.get(componentType);
        if (!archetypes || archetypes.size === 0) {
            return [];
        }

        const entities: Entity[] = [];
        for (const archetype of archetypes) {
            for (const entity of archetype.entities) {
                entities.push(entity);
            }
        }
        return entities;
    }

    /**
     * 清空所有数据
     */
    public clear(): void {
        this._archetypes.clear();
        this._entityToArchetype.clear();
        this._componentToArchetypes.clear();
        this._entityComponentTypesCache.clear();
        this._allArchetypes = [];
    }

    /**
     * 更新所有原型数组
     */
    private updateAllArchetypeArrays(): void {
        this._allArchetypes = [];
        for (let archetype of this._archetypes.values()) {
            this._allArchetypes.push(archetype);
        }
    }

    /**
     * 获取实体的组件类型列表
     */
    private getEntityComponentTypes(entity: Entity): ComponentType[] {
        let componentTypes = this._entityComponentTypesCache.get(entity);
        if (!componentTypes) {
            componentTypes = entity.components.map(component => component.constructor as ComponentType);
            this._entityComponentTypesCache.set(entity, componentTypes);
        }
        return componentTypes;
    }
    
    /**
     * 生成原型ID
     */
    private generateArchetypeId(componentTypes: ComponentType[]): ArchetypeId {
        let entityBits = ComponentTypeManager.instance.getEntityBits(componentTypes);
        return entityBits.getValue();
    }
    
    /**
     * 创建新原型
     */
    private createArchetype(componentTypes: ComponentType[]): Archetype {
        const id = this.generateArchetypeId(componentTypes);
        
        const archetype: Archetype = {
            id,
            componentTypes: [...componentTypes],
            entities: new Set<Entity>()
        };
        // 存储原型ID - 原型
        this._archetypes.set(id,archetype);
        // 更新数组
        this.updateAllArchetypeArrays();
        return archetype;
    }
    
    /**
     * 更新组件索引
     */
    private updateComponentIndexes(archetype: Archetype, componentTypes: ComponentType[], add: boolean): void {
        for (const componentType of componentTypes) {
            let archetypes = this._componentToArchetypes.get(componentType);
            if (!archetypes) {
                archetypes = new Set();
                this._componentToArchetypes.set(componentType, archetypes);
            }
            
            if (add) {
                archetypes.add(archetype);
            } else {
                archetypes.delete(archetype);
                if (archetypes.size === 0) {
                    this._componentToArchetypes.delete(componentType);
                }
            }
        }
    }
    

}
