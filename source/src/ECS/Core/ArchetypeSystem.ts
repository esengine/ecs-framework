import { Entity } from '../Entity';
import { ComponentType } from './ComponentStorage';

/**
 * 原型标识符
 */
export type ArchetypeId = string;

/**
 * 原型数据结构
 */
export interface Archetype {
    /** 原型唯一标识符 */
    id: ArchetypeId;
    /** 包含的组件类型 */
    componentTypes: ComponentType[];
    /** 属于该原型的实体列表 */
    entities: Entity[];
    /** 原型创建时间 */
    createdAt: number;
    /** 最后更新时间 */
    updatedAt: number;
}

/**
 * 原型查询结果
 */
export interface ArchetypeQueryResult {
    /** 匹配的原型列表 */
    archetypes: Archetype[];
    /** 所有匹配实体的总数 */
    totalEntities: number;
    /** 查询执行时间（毫秒） */
    executionTime: number;
    /** 是否使用了缓存 */
    fromCache: boolean;
}

/**
 * Archetype系统
 * 
 * 根据实体的组件组合将实体分组到不同的原型中，提供高效的查询性能。
 */
export class ArchetypeSystem {
    /** 所有原型的映射表 */
    private _archetypes = new Map<ArchetypeId, Archetype>();
    
    /** 实体到原型的映射 */
    private _entityToArchetype = new Map<Entity, Archetype>();
    
    /** 组件类型到原型的映射 */
    private _componentToArchetypes = new Map<ComponentType, Set<Archetype>>();
    
    /** 查询缓存 */
    private _queryCache = new Map<string, {
        result: ArchetypeQueryResult;
        timestamp: number;
    }>();
    
    private _cacheTimeout = 5000;
    private _maxCacheSize = 100;
    
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
        
        archetype.entities.push(entity);
        archetype.updatedAt = Date.now();
        this._entityToArchetype.set(entity, archetype);
        
        this.updateComponentIndexes(archetype, componentTypes, true);
        this.invalidateQueryCache();
    }
    
    /**
     * 从原型系统中移除实体
     */
    public removeEntity(entity: Entity): void {
        const archetype = this._entityToArchetype.get(entity);
        if (!archetype) return;
        
        const index = archetype.entities.indexOf(entity);
        if (index !== -1) {
            archetype.entities.splice(index, 1);
            archetype.updatedAt = Date.now();
        }
        
        this._entityToArchetype.delete(entity);
        this.invalidateQueryCache();
    }
    
    /**
     * 查询包含指定组件组合的原型
     */
    public queryArchetypes(componentTypes: ComponentType[], operation: 'AND' | 'OR' = 'AND'): ArchetypeQueryResult {
        const startTime = performance.now();
        
        const cacheKey = `${operation}:${componentTypes.map(t => t.name).sort().join(',')}`;
        
        // 检查缓存
        const cached = this._queryCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < this._cacheTimeout)) {
            return {
                ...cached.result,
                executionTime: performance.now() - startTime,
                fromCache: true
            };
        }
        
        const matchingArchetypes: Archetype[] = [];
        let totalEntities = 0;
        
        if (operation === 'AND') {
            for (const archetype of this._archetypes.values()) {
                if (this.archetypeContainsAllComponents(archetype, componentTypes)) {
                    matchingArchetypes.push(archetype);
                    totalEntities += archetype.entities.length;
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
                totalEntities += archetype.entities.length;
            }
        }
        
        const result: ArchetypeQueryResult = {
            archetypes: matchingArchetypes,
            totalEntities,
            executionTime: performance.now() - startTime,
            fromCache: false
        };
        
        // 缓存结果
        this._queryCache.set(cacheKey, {
            result,
            timestamp: Date.now()
        });
        
        return result;
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
        return Array.from(this._archetypes.values());
    }
    
    /**
     * 清空所有数据
     */
    public clear(): void {
        this._archetypes.clear();
        this._entityToArchetype.clear();
        this._componentToArchetypes.clear();
        this._queryCache.clear();
    }
    
    /**
     * 获取实体的组件类型列表
     */
    private getEntityComponentTypes(entity: Entity): ComponentType[] {
        return entity.components.map(component => component.constructor as ComponentType);
    }
    
    /**
     * 生成原型ID
     */
    private generateArchetypeId(componentTypes: ComponentType[]): ArchetypeId {
        return componentTypes
            .map(type => type.name)
            .sort()
            .join('|');
    }
    
    /**
     * 创建新原型
     */
    private createArchetype(componentTypes: ComponentType[]): Archetype {
        const id = this.generateArchetypeId(componentTypes);
        
        const archetype: Archetype = {
            id,
            componentTypes: [...componentTypes],
            entities: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        this._archetypes.set(id, archetype);
        return archetype;
    }
    
    /**
     * 检查原型是否包含所有指定组件
     */
    private archetypeContainsAllComponents(archetype: Archetype, componentTypes: ComponentType[]): boolean {
        for (const componentType of componentTypes) {
            if (!archetype.componentTypes.includes(componentType)) {
                return false;
            }
        }
        return true;
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
    
    /**
     * 使查询缓存失效
     */
    private invalidateQueryCache(): void {
        this._queryCache.clear();
    }
}
