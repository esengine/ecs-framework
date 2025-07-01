import { IEntityDebugData } from '../../Types';
import { Core } from '../../Core';
import { Entity } from '../../ECS/Entity';
import { Component } from '../../ECS/Component';

/**
 * 实体数据收集器
 */
export class EntityDataCollector {
    public collectEntityData(): IEntityDebugData {
        const scene = Core.scene;
        if (!scene) {
            return this.getEmptyEntityDebugData();
        }

        const entityList = (scene as any).entities;
        if (!entityList) {
            return this.getEmptyEntityDebugData();
        }

        let stats;
        try {
            stats = entityList.getStats ? entityList.getStats() : this.calculateFallbackEntityStats(entityList);
        } catch (error) {
            return {
                totalEntities: 0,
                activeEntities: 0,
                pendingAdd: 0,
                pendingRemove: 0,
                entitiesPerArchetype: [],
                topEntitiesByComponents: [],
                entityHierarchy: [],
                entityDetailsMap: {}
            };
        }

        const archetypeData = this.collectArchetypeData(scene);
        
        return {
            totalEntities: stats.totalEntities,
            activeEntities: stats.activeEntities,
            pendingAdd: stats.pendingAdd || 0,
            pendingRemove: stats.pendingRemove || 0,
            entitiesPerArchetype: archetypeData.distribution,
            topEntitiesByComponents: archetypeData.topEntities,
            entityHierarchy: [],
            entityDetailsMap: {}
        };
    }


    public getRawEntityList(): Array<{
        id: number;
        name: string;
        active: boolean;
        enabled: boolean;
        activeInHierarchy: boolean;
        componentCount: number;
        componentTypes: string[];
        parentId: number | null;
        childIds: number[];
        depth: number;
        tag: number;
        updateOrder: number;
    }> {
        const scene = Core.scene;
        if (!scene) return [];

        const entityList = (scene as any).entities;
        if (!entityList?.buffer) return [];

        return entityList.buffer.map((entity: Entity) => ({
            id: entity.id,
            name: entity.name || `Entity_${entity.id}`,
            active: entity.active !== false,
            enabled: entity.enabled !== false,
            activeInHierarchy: entity.activeInHierarchy !== false,
            componentCount: entity.components.length,
            componentTypes: entity.components.map((component: Component) => component.constructor.name),
            parentId: entity.parent?.id || null,
            childIds: entity.children?.map((child: Entity) => child.id) || [],
            depth: entity.getDepth ? entity.getDepth() : 0,
            tag: entity.tag || 0,
            updateOrder: entity.updateOrder || 0
        }));
    }


    public getEntityDetails(entityId: number): any {
        try {
            const scene = Core.scene;
            if (!scene) return null;

            const entityList = (scene as any).entities;
            if (!entityList?.buffer) return null;

            const entity = entityList.buffer.find((e: any) => e.id === entityId);
            if (!entity) return null;

            const baseDebugInfo = entity.getDebugInfo ?
                entity.getDebugInfo() :
                this.buildFallbackEntityInfo(entity);

            const componentDetails = this.extractComponentDetails(entity.components);

            return {
                ...baseDebugInfo,
                parentName: entity.parent?.name || null,
                components: componentDetails || [],
                componentCount: entity.components?.length || 0,
                componentTypes: entity.components?.map((comp: any) => comp.constructor.name) || []
            };
        } catch (error) {
            return {
                error: `获取实体详情失败: ${error instanceof Error ? error.message : String(error)}`,
                components: [],
                componentCount: 0,
                componentTypes: []
            };
        }
    }


    public collectEntityDataWithMemory(): IEntityDebugData {
        const scene = Core.scene;
        if (!scene) {
            return this.getEmptyEntityDebugData();
        }

        const entityList = (scene as any).entities;
        if (!entityList) {
            return this.getEmptyEntityDebugData();
        }

        let stats;
        try {
            stats = entityList.getStats ? entityList.getStats() : this.calculateFallbackEntityStats(entityList);
        } catch (error) {
        return {
            totalEntities: 0,
            activeEntities: 0,
            pendingAdd: 0,
            pendingRemove: 0,
            entitiesPerArchetype: [],
            topEntitiesByComponents: [],
            entityHierarchy: [],
            entityDetailsMap: {}
        };
    }

        const archetypeData = this.collectArchetypeDataWithMemory(scene);
        
        return {
            totalEntities: stats.totalEntities,
            activeEntities: stats.activeEntities,
            pendingAdd: stats.pendingAdd || 0,
            pendingRemove: stats.pendingRemove || 0,
            entitiesPerArchetype: archetypeData.distribution,
            topEntitiesByComponents: archetypeData.topEntities,
            entityHierarchy: this.buildEntityHierarchyTree(entityList),
            entityDetailsMap: this.buildEntityDetailsMap(entityList)
        };
    }


    private collectArchetypeData(scene: any): {
        distribution: Array<{ signature: string; count: number; memory: number }>;
        topEntities: Array<{ id: string; name: string; componentCount: number; memory: number }>;
    } {
        if (scene && scene.archetypeSystem && typeof scene.archetypeSystem.getAllArchetypes === 'function') {
            return this.extractArchetypeStatistics(scene.archetypeSystem);
        }

        const entityContainer = { entities: scene.entities?.buffer || [] };
        return {
            distribution: this.getArchetypeDistributionFast(entityContainer),
            topEntities: this.getTopEntitiesByComponentsFast(entityContainer)
        };
    }

    private getArchetypeDistributionFast(entityContainer: any): Array<{ signature: string; count: number; memory: number }> {
        const distribution = new Map<string, { count: number; componentTypes: string[] }>();

        if (entityContainer && entityContainer.entities) {
            entityContainer.entities.forEach((entity: any) => {
                const componentTypes = entity.components?.map((comp: any) => comp.constructor.name) || [];
                const signature = componentTypes.length > 0 ? componentTypes.sort().join(', ') : '无组件';

                const existing = distribution.get(signature);
                if (existing) {
                    existing.count++;
                } else {
                    distribution.set(signature, { count: 1, componentTypes });
                }
            });
        }

        return Array.from(distribution.entries())
            .map(([signature, data]) => ({
                signature,
                count: data.count,
                memory: 0
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20);
    }

    private getTopEntitiesByComponentsFast(entityContainer: any): Array<{ id: string; name: string; componentCount: number; memory: number }> {
        if (!entityContainer || !entityContainer.entities) {
            return [];
        }

        return entityContainer.entities
            .map((entity: any) => ({
                id: entity.id.toString(),
                name: entity.name || `Entity_${entity.id}`,
                componentCount: entity.components?.length || 0,
                memory: 0
            }))
            .sort((a: any, b: any) => b.componentCount - a.componentCount)
            .slice(0, 10);
    }


    private collectArchetypeDataWithMemory(scene: any): {
        distribution: Array<{ signature: string; count: number; memory: number }>;
        topEntities: Array<{ id: string; name: string; componentCount: number; memory: number }>;
    } {
        if (scene && scene.archetypeSystem && typeof scene.archetypeSystem.getAllArchetypes === 'function') {
            return this.extractArchetypeStatisticsWithMemory(scene.archetypeSystem);
        }

        const entityContainer = { entities: scene.entities?.buffer || [] };
        return {
            distribution: this.getArchetypeDistributionWithMemory(entityContainer),
            topEntities: this.getTopEntitiesByComponentsWithMemory(entityContainer)
        };
    }


    private extractArchetypeStatistics(archetypeSystem: any): {
        distribution: Array<{ signature: string; count: number; memory: number }>;
        topEntities: Array<{ id: string; name: string; componentCount: number; memory: number }>;
    } {
        const archetypes = archetypeSystem.getAllArchetypes();
        const distribution: Array<{ signature: string; count: number; memory: number }> = [];
        const topEntities: Array<{ id: string; name: string; componentCount: number; memory: number }> = [];

        archetypes.forEach((archetype: any) => {
            const signature = archetype.componentTypes?.map((type: any) => type.name).join(',') || 'Unknown';
            const entityCount = archetype.entities?.length || 0;
            
            distribution.push({
                signature,
                count: entityCount,
                memory: 0
            });

            if (archetype.entities) {
                archetype.entities.slice(0, 5).forEach((entity: any) => {
                    topEntities.push({
                        id: entity.id.toString(),
                        name: entity.name || `Entity_${entity.id}`,
                        componentCount: entity.components?.length || 0,
                        memory: 0
                    });
                });
            }
        });

        distribution.sort((a, b) => b.count - a.count);
        topEntities.sort((a, b) => b.componentCount - a.componentCount);

        return { distribution, topEntities };
    }


    private extractArchetypeStatisticsWithMemory(archetypeSystem: any): {
        distribution: Array<{ signature: string; count: number; memory: number }>;
        topEntities: Array<{ id: string; name: string; componentCount: number; memory: number }>;
    } {
        const archetypes = archetypeSystem.getAllArchetypes();
        const distribution: Array<{ signature: string; count: number; memory: number }> = [];
        const topEntities: Array<{ id: string; name: string; componentCount: number; memory: number }> = [];

        archetypes.forEach((archetype: any) => {
            const signature = archetype.componentTypes?.map((type: any) => type.name).join(',') || 'Unknown';
            const entityCount = archetype.entities?.length || 0;

            let actualMemory = 0;
            if (archetype.entities && archetype.entities.length > 0) {
                const sampleSize = Math.min(5, archetype.entities.length);
                let sampleMemory = 0;
                
                for (let i = 0; i < sampleSize; i++) {
                    sampleMemory += this.estimateEntityMemoryUsage(archetype.entities[i]);
                }
                
                actualMemory = (sampleMemory / sampleSize) * entityCount;
            }

            distribution.push({
                signature,
                count: entityCount,
                memory: actualMemory
            });

            if (archetype.entities) {
                archetype.entities.slice(0, 5).forEach((entity: any) => {
                    topEntities.push({
                        id: entity.id.toString(),
                        name: entity.name || `Entity_${entity.id}`,
                        componentCount: entity.components?.length || 0,
                        memory: this.estimateEntityMemoryUsage(entity)
                    });
                });
            }
        });

        distribution.sort((a, b) => b.count - a.count);
        topEntities.sort((a, b) => b.componentCount - a.componentCount);

        return { distribution, topEntities };
    }


    private getArchetypeDistribution(entityContainer: any): Array<{ signature: string; count: number; memory: number }> {
        const distribution = new Map<string, number>();

        if (entityContainer && entityContainer.entities) {
            entityContainer.entities.forEach((entity: any) => {
                const signature = entity.componentMask?.toString() || '0';
                const existing = distribution.get(signature);
                distribution.set(signature, (existing || 0) + 1);
            });
        }

        return Array.from(distribution.entries())
            .map(([signature, count]) => ({ signature, count, memory: 0 }))
            .sort((a, b) => b.count - a.count);
    }

    private getArchetypeDistributionWithMemory(entityContainer: any): Array<{ signature: string; count: number; memory: number }> {
        const distribution = new Map<string, { count: number; memory: number; componentTypes: string[] }>();

        if (entityContainer && entityContainer.entities) {
            entityContainer.entities.forEach((entity: any) => {
                const componentTypes = entity.components?.map((comp: any) => comp.constructor.name) || [];
                const signature = componentTypes.length > 0 ? componentTypes.sort().join(', ') : '无组件';

                const existing = distribution.get(signature);
                let memory = this.estimateEntityMemoryUsage(entity);

                if (isNaN(memory) || memory < 0) {
                    memory = 0;
                }

                if (existing) {
                    existing.count++;
                    existing.memory += memory;
                } else {
                    distribution.set(signature, { count: 1, memory, componentTypes });
                }
            });
        }

        return Array.from(distribution.entries())
            .map(([signature, data]) => ({
                signature,
                count: data.count,
                memory: isNaN(data.memory) ? 0 : data.memory
            }))
            .sort((a, b) => b.count - a.count);
    }


    private getTopEntitiesByComponents(entityContainer: any): Array<{ id: string; name: string; componentCount: number; memory: number }> {
        if (!entityContainer || !entityContainer.entities) {
            return [];
        }

        return entityContainer.entities
            .map((entity: any) => ({
                id: entity.id.toString(),
                name: entity.name || `Entity_${entity.id}`,
                componentCount: entity.components?.length || 0,
                memory: 0
            }))
            .sort((a: any, b: any) => b.componentCount - a.componentCount);
    }


    private getTopEntitiesByComponentsWithMemory(entityContainer: any): Array<{ id: string; name: string; componentCount: number; memory: number }> {
        if (!entityContainer || !entityContainer.entities) {
            return [];
        }

        return entityContainer.entities
            .map((entity: any) => ({
                id: entity.id.toString(),
                name: entity.name || `Entity_${entity.id}`,
                componentCount: entity.components?.length || 0,
                memory: this.estimateEntityMemoryUsage(entity)
            }))
            .sort((a: any, b: any) => b.componentCount - a.componentCount);
    }


    private getEmptyEntityDebugData(): IEntityDebugData {
        return {
            totalEntities: 0,
            activeEntities: 0,
            pendingAdd: 0,
            pendingRemove: 0,
            entitiesPerArchetype: [],
            topEntitiesByComponents: [],
            entityHierarchy: [],
            entityDetailsMap: {}
        };
    }


    private calculateFallbackEntityStats(entityList: any): any {
        const allEntities = entityList.buffer || [];
        const activeEntities = allEntities.filter((entity: any) =>
            entity.enabled && !entity._isDestroyed
        );

        return {
            totalEntities: allEntities.length,
            activeEntities: activeEntities.length,
            pendingAdd: 0,
            pendingRemove: 0,
            averageComponentsPerEntity: activeEntities.length > 0 ?
                allEntities.reduce((sum: number, e: any) => sum + (e.components?.length || 0), 0) / activeEntities.length : 0
        };
    }

    public estimateEntityMemoryUsage(entity: any): number {
        try {
            let totalSize = 0;

            const entitySize = this.calculateObjectSize(entity, ['components', 'children', 'parent']);
            if (!isNaN(entitySize) && entitySize > 0) {
                totalSize += entitySize;
            }

            if (entity.components && Array.isArray(entity.components)) {
                entity.components.forEach((component: any) => {
                    const componentSize = this.calculateObjectSize(component, ['entity']);
                    if (!isNaN(componentSize) && componentSize > 0) {
                        totalSize += componentSize;
                    }
                });
            }

            return isNaN(totalSize) || totalSize < 0 ? 0 : totalSize;
        } catch (error) {
            return 0;
        }
    }

    public calculateObjectSize(obj: any, excludeKeys: string[] = []): number {
        if (!obj || typeof obj !== 'object') return 0;
        
        try {
        let size = 0;
        const visited = new WeakSet();
            const maxDepth = 3;

            const calculate = (item: any, depth: number = 0): number => {
                if (!item || typeof item !== 'object' || visited.has(item) || depth >= maxDepth) {
                    return 0;
                }
            visited.add(item);
            
            let itemSize = 0;
            
            try {
                    const keys = Object.keys(item);
                    for (let i = 0; i < Math.min(keys.length, 50); i++) {
                        const key = keys[i];
                    if (excludeKeys.includes(key)) continue;
                    
                    const value = item[key];
                        itemSize += key.length * 2;
                    
                    if (typeof value === 'string') {
                            itemSize += Math.min(value.length * 2, 1000);
                    } else if (typeof value === 'number') {
                        itemSize += 8;
                    } else if (typeof value === 'boolean') {
                        itemSize += 4;
                    } else if (typeof value === 'object' && value !== null) {
                            itemSize += calculate(value, depth + 1);
                        }
                    }
                } catch (error) {
                    return 0;
                }

                return isNaN(itemSize) ? 0 : itemSize;
            };

            size = calculate(obj);
            return isNaN(size) || size < 0 ? 0 : size;
        } catch (error) {
            return 0;
        }
    }


    private buildEntityHierarchyTree(entityList: { buffer?: Entity[] }): Array<{
        id: number;
        name: string;
        active: boolean;
        enabled: boolean;
        activeInHierarchy: boolean;
        componentCount: number;
        componentTypes: string[];
        parentId: number | null;
        children: any[];
        depth: number;
        tag: number;
        updateOrder: number;
    }> {
        if (!entityList?.buffer) return [];

        const rootEntities: any[] = [];


        entityList.buffer.forEach((entity: Entity) => {
            if (!entity.parent) {
                const hierarchyNode = this.buildEntityHierarchyNode(entity);
                rootEntities.push(hierarchyNode);
            }
        });

        // 按实体名称排序，提供一致的显示顺序
        rootEntities.sort((nodeA, nodeB) => {
            if (nodeA.name < nodeB.name) return -1;
            if (nodeA.name > nodeB.name) return 1;
            return nodeA.id - nodeB.id;
        });

        return rootEntities;
    }

    /**
     * 构建实体层次结构节点
     */
    private buildEntityHierarchyNode(entity: Entity): any {
        let node = {
            id: entity.id,
            name: entity.name || `Entity_${entity.id}`,
            active: entity.active !== false,
            enabled: entity.enabled !== false,
            activeInHierarchy: entity.activeInHierarchy !== false,
            componentCount: entity.components.length,
            componentTypes: entity.components.map((component: Component) => component.constructor.name),
            parentId: entity.parent?.id || null,
            children: [] as any[],
            depth: entity.getDepth ? entity.getDepth() : 0,
            tag: entity.tag || 0,
            updateOrder: entity.updateOrder || 0
        };

        // 递归构建子实体节点
        if (entity.children && entity.children.length > 0) {
            node.children = entity.children.map((child: Entity) => this.buildEntityHierarchyNode(child));
        }

        // 优先使用Entity的getDebugInfo方法
        if (typeof entity.getDebugInfo === 'function') {
            const debugInfo = entity.getDebugInfo();
            node = {
                ...node,
                ...debugInfo
            };
        }

        // 收集所有组件详细属性信息
        if (entity.components && entity.components.length > 0) {
            (node as any).componentDetails = this.extractComponentDetails(entity.components);
        }

        return node;
    }

    /**
     * 构建实体详情映射
     */
    private buildEntityDetailsMap(entityList: { buffer?: Entity[] }): Record<number, any> {
        if (!entityList?.buffer) return {};

        const entityDetailsMap: Record<number, any> = {};
        const entities = entityList.buffer;
        const batchSize = 100;
        
        for (let i = 0; i < entities.length; i += batchSize) {
            const batch = entities.slice(i, i + batchSize);
            
            batch.forEach((entity: Entity) => {
                const baseDebugInfo = entity.getDebugInfo ? 
                    entity.getDebugInfo() : 
                    this.buildFallbackEntityInfo(entity);

                const componentCacheStats = (entity as any).getComponentCacheStats ? 
                    (entity as any).getComponentCacheStats() : null;

                const componentDetails = this.extractComponentDetails(entity.components);

                entityDetailsMap[entity.id] = {
                    ...baseDebugInfo,
                    parentName: entity.parent?.name || null,
                    components: componentDetails,
                    componentTypes: baseDebugInfo.componentTypes || 
                        componentDetails.map((comp) => comp.typeName),
                    cachePerformance: componentCacheStats ? {
                        hitRate: componentCacheStats.cacheStats.hitRate,
                        size: componentCacheStats.cacheStats.size,
                        maxSize: componentCacheStats.cacheStats.maxSize
                    } : null
                };
            });
        }

        return entityDetailsMap;
    }

    /**
     * 构建实体基础信息
     */
    private buildFallbackEntityInfo(entity: Entity): any {
        return {
            name: entity.name || `Entity_${entity.id}`,
            id: entity.id,
            enabled: entity.enabled !== false,
            active: entity.active !== false,
            activeInHierarchy: entity.activeInHierarchy !== false,
            destroyed: entity.isDestroyed || false,
            componentCount: entity.components.length,
            componentTypes: entity.components.map((component: Component) => component.constructor.name),
            componentMask: entity.componentMask?.toString() || '0',
            parentId: entity.parent?.id || null,
            childCount: entity.children?.length || 0,
            childIds: entity.children.map((child: Entity) => child.id) || [],
            depth: entity.getDepth ? entity.getDepth() : 0,
            tag: entity.tag || 0,
            updateOrder: entity.updateOrder || 0
        };
    }

    /**
     * 提取组件详细信息
     */
    public extractComponentDetails(components: Component[]): Array<{
        typeName: string;
        properties: Record<string, any>;
    }> {
        return components.map((component: Component) => {
            let typeName = component.constructor.name;
            
            if (!typeName || typeName === 'Object' || typeName === 'Function') {
                try {
                    const { ComponentTypeManager } = require('../../ECS/Utils/ComponentTypeManager');
                    const typeManager = ComponentTypeManager.instance;
                    const componentType = component.constructor as any;
                    const typeId = typeManager.getTypeId(componentType);
                    typeName = typeManager.getTypeName(typeId);
                } catch (error) {
                    typeName = 'UnknownComponent';
                }
            }
            
            return {
                typeName: typeName,
                properties: {
                    _componentId: component.constructor.name,
                    _propertyCount: Object.keys(component).filter(key => !key.startsWith('_') && key !== 'entity').length,
                    _lazyLoad: true
                }
            };
        });
    }

    /**
     * 获取组件的完整属性信息（仅在需要时调用）
     */
    public getComponentProperties(entityId: number, componentIndex: number): Record<string, any> {
        try {
            const scene = Core.scene;
            if (!scene) return {};

            const entityList = (scene as any).entities;
            if (!entityList?.buffer) return {};

            const entity = entityList.buffer.find((e: any) => e.id === entityId);
            if (!entity || componentIndex >= entity.components.length) return {};

            const component = entity.components[componentIndex];
            const properties: Record<string, any> = {};

                const propertyKeys = Object.keys(component);
                propertyKeys.forEach(propertyKey => {
                    if (!propertyKey.startsWith('_') && propertyKey !== 'entity') {
                        const propertyValue = (component as any)[propertyKey];
                        if (propertyValue !== undefined && propertyValue !== null) {
                        properties[propertyKey] = this.formatPropertyValue(propertyValue);
                    }
                    }
                });

            return properties;
            } catch (error) {
            return { _error: '属性提取失败' };
            }
    }

    /**
     * 格式化属性值
     */
    private formatPropertyValue(value: any, depth: number = 0): any {
        if (value === null || value === undefined) {
            return value;
        }

        if (typeof value !== 'object') {
            if (typeof value === 'string' && value.length > 200) {
                return `[长字符串: ${value.length}字符] ${value.substring(0, 100)}...`;
            }
            return value;
        }

        if (depth === 0) {
            return this.formatObjectFirstLevel(value);
        } else {
            return this.createLazyLoadPlaceholder(value);
        }
    }

    /**
     * 格式化对象第一层
     */
    private formatObjectFirstLevel(obj: any): any {
        try {
            if (Array.isArray(obj)) {
                if (obj.length === 0) return [];

                if (obj.length > 10) {
                    const sample = obj.slice(0, 3).map(item => this.formatPropertyValue(item, 1));
                    return {
                        _isLazyArray: true,
                        _arrayLength: obj.length,
                        _sample: sample,
                        _summary: `数组[${obj.length}个元素]`
                    };
                }

                return obj.map(item => this.formatPropertyValue(item, 1));
            }

            const keys = Object.keys(obj);
            if (keys.length === 0) return {};

            const result: any = {};
            let processedCount = 0;
            const maxProperties = 15;

            for (const key of keys) {
                if (processedCount >= maxProperties) {
                    result._hasMoreProperties = true;
                    result._totalProperties = keys.length;
                    result._hiddenCount = keys.length - processedCount;
                    break;
                }

                if (key.startsWith('_') || key.startsWith('$') || typeof obj[key] === 'function') {
                    continue;
                }

                try {
                    const value = obj[key];
                    if (value !== null && value !== undefined) {
                        result[key] = this.formatPropertyValue(value, 1);
                        processedCount++;
                    }
                } catch (error) {
                    result[key] = `[访问失败: ${error instanceof Error ? error.message : String(error)}]`;
                    processedCount++;
                }
            }

            return result;
        } catch (error) {
            return `[对象解析失败: ${error instanceof Error ? error.message : String(error)}]`;
        }
    }

    /**
     * 创建懒加载占位符
     */
    private createLazyLoadPlaceholder(obj: any): any {
        try {
            const typeName = obj.constructor?.name || 'Object';
            const summary = this.getObjectSummary(obj, typeName);
        
        return {
                _isLazyObject: true,
                _typeName: typeName,
                _summary: summary,
                _objectId: this.generateObjectId(obj)
            };
        } catch (error) {
            return {
                _isLazyObject: true,
                _typeName: 'Unknown',
                _summary: `无法分析的对象: ${error instanceof Error ? error.message : String(error)}`,
                _objectId: Math.random().toString(36).substr(2, 9)
            };
        }
    }

    /**
     * 获取对象摘要信息
     */
    private getObjectSummary(obj: any, typeName: string): string {
        try {
            if (typeName.toLowerCase().includes('vec') || typeName.toLowerCase().includes('vector')) {
                if (obj.x !== undefined && obj.y !== undefined) {
                    const z = obj.z !== undefined ? obj.z : '';
                    return `${typeName}(${obj.x}, ${obj.y}${z ? ', ' + z : ''})`;
                }
            }

            if (typeName.toLowerCase().includes('color')) {
                if (obj.r !== undefined && obj.g !== undefined && obj.b !== undefined) {
                    const a = obj.a !== undefined ? obj.a : 1;
                    return `${typeName}(${obj.r}, ${obj.g}, ${obj.b}, ${a})`;
                }
            }

            if (typeName.toLowerCase().includes('node')) {
                const name = obj.name || obj._name || '未命名';
                return `${typeName}: ${name}`;
            }

            if (typeName.toLowerCase().includes('component')) {
                const nodeName = obj.node?.name || obj.node?._name || '';
                return `${typeName}${nodeName ? ` on ${nodeName}` : ''}`;
            }

            const keys = Object.keys(obj);
            if (keys.length === 0) {
                return `${typeName} (空对象)`;
            }

            return `${typeName} (${keys.length}个属性)`;
        } catch (error) {
            return `${typeName} (无法分析)`;
        }
    }

    /**
     * 生成对象ID
     */
    private generateObjectId(obj: any): string {
        try {
            if (obj.id !== undefined) return `obj_${obj.id}`;
            if (obj._id !== undefined) return `obj_${obj._id}`;
            if (obj.uuid !== undefined) return `obj_${obj.uuid}`;
            if (obj._uuid !== undefined) return `obj_${obj._uuid}`;

            return `obj_${Math.random().toString(36).substr(2, 9)}`;
        } catch {
            return `obj_${Math.random().toString(36).substr(2, 9)}`;
        }
    }

    /**
     * 展开懒加载对象（供调试面板调用）
     */
    public expandLazyObject(entityId: number, componentIndex: number, propertyPath: string): any {
        try {
            const scene = Core.scene;
            if (!scene) return null;

            const entityList = (scene as any).entities;
            if (!entityList?.buffer) return null;

            // 找到对应的实体
            const entity = entityList.buffer.find((e: any) => e.id === entityId);
            if (!entity) return null;

            // 找到对应的组件
            if (componentIndex >= entity.components.length) return null;
            const component = entity.components[componentIndex];

            // 根据属性路径找到对象
            const targetObject = this.getObjectByPath(component, propertyPath);
            if (!targetObject) return null;

            // 展开这个对象的第一层属性
            return this.formatObjectFirstLevel(targetObject);
        } catch (error) {
            return {
                error: `展开失败: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    /**
     * 根据路径获取对象
     */
    private getObjectByPath(root: any, path: string): any {
        if (!path) return root;

        const parts = path.split('.');
        let current = root;

        for (const part of parts) {
            if (current === null || current === undefined) return null;

            // 处理数组索引
            if (part.includes('[') && part.includes(']')) {
                const arrayName = part.substring(0, part.indexOf('['));
                const index = parseInt(part.substring(part.indexOf('[') + 1, part.indexOf(']')));

                if (arrayName) {
                    current = current[arrayName];
                }

                if (Array.isArray(current) && index >= 0 && index < current.length) {
                    current = current[index];
                } else {
                    return null;
                }
            } else {
                current = current[part];
            }
        }

        return current;
    }
} 