import { IEntityDebugData } from '../../Types';
import { Entity } from '../../ECS/Entity';
import { Component } from '../../ECS/Component';
import { getComponentInstanceTypeName } from '../../ECS/Decorators';
import { IScene } from '../../ECS/IScene';
import { HierarchyComponent } from '../../ECS/Components/HierarchyComponent';
import { HierarchySystem } from '../../ECS/Systems/HierarchySystem';

/**
 * 实体数据收集器
 * Entity data collector
 *
 * 收集实体的调试信息，通过公共接口访问数据。
 * Collects entity debug information through public interfaces.
 */
export class EntityDataCollector {
    /**
     * 收集实体数据
     * Collect entity data
     *
     * @param scene 场景实例 | Scene instance
     */
    public collectEntityData(scene?: IScene | null): IEntityDebugData {
        if (!scene) {
            return this.getEmptyEntityDebugData();
        }

        // 使用公共接口 | Use public interface
        const entityList = scene.entities;
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

    /**
     * 获取原始实体列表
     * Get raw entity list
     *
     * @param scene 场景实例 | Scene instance
     */
    public getRawEntityList(scene?: IScene | null): Array<{
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
        if (!scene) return [];

        // 使用公共接口 | Use public interface
        const entityList = scene.entities;
        if (!entityList?.buffer) return [];

        const hierarchySystem = scene.getSystem(HierarchySystem);

        return entityList.buffer.map((entity: Entity) => {
            const hierarchy = entity.getComponent(HierarchyComponent);
            const bActiveInHierarchy = hierarchySystem?.isActiveInHierarchy(entity) ?? entity.active;
            const depth = hierarchySystem?.getDepth(entity) ?? 0;

            return {
                id: entity.id,
                name: entity.name || `Entity_${entity.id}`,
                active: entity.active !== false,
                enabled: entity.enabled !== false,
                activeInHierarchy: bActiveInHierarchy,
                componentCount: entity.components.length,
                componentTypes: entity.components.map((component: Component) => getComponentInstanceTypeName(component)),
                parentId: hierarchy?.parentId ?? null,
                childIds: hierarchy?.childIds ?? [],
                depth,
                tag: entity.tag || 0,
                updateOrder: entity.updateOrder || 0
            };
        });
    }

    /**
     * 获取实体详细信息
     * @param entityId 实体ID
     * @param scene 场景实例
     */
    public getEntityDetails(entityId: number, scene?: IScene | null): any {
        try {
            if (!scene) return null;

            const entityList = scene.entities;
            if (!entityList?.buffer) return null;

            const entity = entityList.buffer.find((e: any) => e.id === entityId);
            if (!entity) return null;

            // 使用 HierarchySystem 获取父实体
            // Use HierarchySystem to get parent entity
            const hierarchySystem = scene.getSystem(HierarchySystem);
            const parent = hierarchySystem?.getParent(entity);
            const parentName = parent?.name ?? null;

            const baseDebugInfo = entity.getDebugInfo
                ? entity.getDebugInfo()
                : this.buildFallbackEntityInfo(entity, scene, hierarchySystem);

            const componentDetails = this.extractComponentDetails(entity.components);

            const sceneInfo = this.getSceneInfo(scene);

            return {
                ...baseDebugInfo,
                scene: sceneInfo.name,
                sceneName: sceneInfo.name,
                sceneType: sceneInfo.type,
                parentName,
                components: componentDetails || [],
                componentCount: entity.components?.length || 0,
                componentTypes: entity.components?.map((comp: any) => getComponentInstanceTypeName(comp)) || []
            };
        } catch (error) {
            return {
                error: `获取实体详情失败: ${error instanceof Error ? error.message : String(error)}`,
                scene: '获取失败',
                components: [],
                componentCount: 0,
                componentTypes: []
            };
        }
    }

    private getSceneInfo(scene: any): { name: string; type: string } {
        let sceneName = '当前场景';
        let sceneType = 'Scene';

        try {
            if (scene.name && typeof scene.name === 'string' && scene.name.trim()) {
                sceneName = scene.name.trim();
            } else if (scene.constructor && scene.constructor.name) {
                sceneName = scene.constructor.name;
                sceneType = scene.constructor.name;
            } else if (scene._name && typeof scene._name === 'string' && scene._name.trim()) {
                sceneName = scene._name.trim();
            } else {
                const sceneClassName = Object.getPrototypeOf(scene)?.constructor?.name;
                if (sceneClassName && sceneClassName !== 'Object') {
                    sceneName = sceneClassName;
                    sceneType = sceneClassName;
                }
            }
        } catch (error) {
            sceneName = '场景名获取失败';
        }

        return { name: sceneName, type: sceneType };
    }

    /**
     * 收集实体数据（包含内存信息）
     * @param scene 场景实例
     */
    public collectEntityDataWithMemory(scene?: IScene | null): IEntityDebugData {
        if (!scene) {
            return this.getEmptyEntityDebugData();
        }

        const entityList = scene.entities;
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
            entityHierarchy: this.buildEntityHierarchyTree(entityList, scene),
            entityDetailsMap: this.buildEntityDetailsMap(entityList, scene)
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

    private getArchetypeDistributionFast(
        entityContainer: any
    ): Array<{ signature: string; count: number; memory: number }> {
        const distribution = new Map<string, { count: number; componentTypes: string[] }>();

        if (entityContainer && entityContainer.entities) {
            entityContainer.entities.forEach((entity: any) => {
                const componentTypes = entity.components?.map((comp: any) => getComponentInstanceTypeName(comp)) || [];
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

    private getTopEntitiesByComponentsFast(
        entityContainer: any
    ): Array<{ id: string; name: string; componentCount: number; memory: number }> {
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
                archetype.entities.forEach((entity: any) => {
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
                archetype.entities.forEach((entity: any) => {
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

    private getArchetypeDistributionWithMemory(
        entityContainer: any
    ): Array<{ signature: string; count: number; memory: number }> {
        const distribution = new Map<string, { count: number; memory: number; componentTypes: string[] }>();

        if (entityContainer && entityContainer.entities) {
            entityContainer.entities.forEach((entity: any) => {
                const componentTypes = entity.components?.map((comp: any) => getComponentInstanceTypeName(comp)) || [];
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

    private getTopEntitiesByComponentsWithMemory(
        entityContainer: any
    ): Array<{ id: string; name: string; componentCount: number; memory: number }> {
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
        const activeEntities = allEntities.filter((entity: any) => entity.enabled && !entity.isDestroyed);

        return {
            totalEntities: allEntities.length,
            activeEntities: activeEntities.length,
            pendingAdd: 0,
            pendingRemove: 0,
            averageComponentsPerEntity:
                activeEntities.length > 0
                    ? allEntities.reduce((sum: number, e: any) => sum + (e.components?.length || 0), 0) /
                      activeEntities.length
                    : 0
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

        const visited = new WeakSet();
        const maxDepth = 2;

        const calculate = (item: any, depth: number = 0): number => {
            if (!item || typeof item !== 'object' || depth >= maxDepth) {
                return 0;
            }

            if (visited.has(item)) return 0;
            visited.add(item);

            let itemSize = 32;

            try {
                const keys = Object.keys(item);
                const maxKeys = Math.min(keys.length, 20);

                for (let i = 0; i < maxKeys; i++) {
                    const key = keys[i];
                    if (
                        !key ||
                        excludeKeys.includes(key) ||
                        key === 'constructor' ||
                        key === '__proto__' ||
                        key.startsWith('_cc_') ||
                        key.startsWith('__')
                    ) {
                        continue;
                    }

                    const value = item[key];
                    itemSize += key.length * 2;

                    if (typeof value === 'string') {
                        itemSize += Math.min(value.length * 2, 200);
                    } else if (typeof value === 'number') {
                        itemSize += 8;
                    } else if (typeof value === 'boolean') {
                        itemSize += 4;
                    } else if (Array.isArray(value)) {
                        itemSize += 40 + Math.min(value.length * 8, 160);
                    } else if (typeof value === 'object' && value !== null) {
                        itemSize += calculate(value, depth + 1);
                    }
                }
            } catch (error) {
                return 64;
            }

            return itemSize;
        };

        try {
            const size = calculate(obj);
            return Math.max(size, 32);
        } catch (error) {
            return 64;
        }
    }

    private buildEntityHierarchyTree(
        entityList: { buffer?: Entity[] },
        scene?: IScene | null
    ): Array<{
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

        const hierarchySystem = scene?.getSystem(HierarchySystem);
        const rootEntities: any[] = [];

        entityList.buffer.forEach((entity: Entity) => {
            const hierarchy = entity.getComponent(HierarchyComponent);
            const bHasNoParent = hierarchy?.parentId === null || hierarchy?.parentId === undefined;
            if (bHasNoParent) {
                const hierarchyNode = this.buildEntityHierarchyNode(entity, hierarchySystem);
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
    private buildEntityHierarchyNode(entity: Entity, hierarchySystem?: HierarchySystem | null): any {
        const hierarchy = entity.getComponent(HierarchyComponent);
        const bActiveInHierarchy = hierarchySystem?.isActiveInHierarchy(entity) ?? entity.active;
        const depth = hierarchySystem?.getDepth(entity) ?? 0;

        let node = {
            id: entity.id,
            name: entity.name || `Entity_${entity.id}`,
            active: entity.active !== false,
            enabled: entity.enabled !== false,
            activeInHierarchy: bActiveInHierarchy,
            componentCount: entity.components.length,
            componentTypes: entity.components.map((component: Component) => getComponentInstanceTypeName(component)),
            parentId: hierarchy?.parentId ?? null,
            children: [] as any[],
            depth,
            tag: entity.tag || 0,
            updateOrder: entity.updateOrder || 0
        };

        // 递归构建子实体节点
        if (hierarchySystem) {
            const children = hierarchySystem.getChildren(entity);
            if (children.length > 0) {
                node.children = children.map((child: Entity) => this.buildEntityHierarchyNode(child, hierarchySystem));
            }
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
    private buildEntityDetailsMap(entityList: { buffer?: Entity[] }, scene?: IScene | null): Record<number, any> {
        if (!entityList?.buffer) return {};

        const hierarchySystem = scene?.getSystem(HierarchySystem);
        const entityDetailsMap: Record<number, any> = {};
        const entities = entityList.buffer;
        const batchSize = 100;

        for (let i = 0; i < entities.length; i += batchSize) {
            const batch = entities.slice(i, i + batchSize);

            batch.forEach((entity: Entity) => {
                const baseDebugInfo = entity.getDebugInfo
                    ? entity.getDebugInfo()
                    : this.buildFallbackEntityInfo(entity, scene, hierarchySystem);

                const componentCacheStats = (entity as any).getComponentCacheStats
                    ? (entity as any).getComponentCacheStats()
                    : null;

                const componentDetails = this.extractComponentDetails(entity.components);

                // 获取父实体名称
                const parent = hierarchySystem?.getParent(entity);
                const parentName = parent?.name ?? null;

                entityDetailsMap[entity.id] = {
                    ...baseDebugInfo,
                    parentName,
                    components: componentDetails,
                    componentTypes: baseDebugInfo.componentTypes || componentDetails.map((comp) => comp.typeName),
                    cachePerformance: componentCacheStats
                        ? {
                            hitRate: componentCacheStats.cacheStats.hitRate,
                            size: componentCacheStats.cacheStats.size,
                            maxSize: componentCacheStats.cacheStats.maxSize
                        }
                        : null
                };
            });
        }

        return entityDetailsMap;
    }

    /**
     * 构建实体基础信息
     */
    private buildFallbackEntityInfo(
        entity: Entity,
        scene?: IScene | null,
        hierarchySystem?: HierarchySystem | null
    ): any {
        const sceneInfo = this.getSceneInfo(scene);
        const hierarchy = entity.getComponent(HierarchyComponent);
        const bActiveInHierarchy = hierarchySystem?.isActiveInHierarchy(entity) ?? entity.active;
        const depth = hierarchySystem?.getDepth(entity) ?? 0;

        return {
            name: entity.name || `Entity_${entity.id}`,
            id: entity.id,
            enabled: entity.enabled !== false,
            active: entity.active !== false,
            activeInHierarchy: bActiveInHierarchy,
            destroyed: entity.isDestroyed || false,
            scene: sceneInfo.name,
            sceneName: sceneInfo.name,
            sceneType: sceneInfo.type,
            componentCount: entity.components.length,
            componentTypes: entity.components.map((component: Component) => getComponentInstanceTypeName(component)),
            componentMask: entity.componentMask?.toString() || '0',
            parentId: hierarchy?.parentId ?? null,
            childCount: hierarchy?.childIds?.length ?? 0,
            childIds: hierarchy?.childIds ?? [],
            depth,
            tag: entity.tag || 0,
            updateOrder: entity.updateOrder || 0
        };
    }

    /**
     * 提取组件详细信息
     */
    public extractComponentDetails(components: readonly Component[]): Array<{
        typeName: string;
        properties: Record<string, any>;
    }> {
        return components.map((component: Component) => {
            const typeName = getComponentInstanceTypeName(component);
            const properties: Record<string, any> = {};

            try {
                const propertyKeys = Object.keys(component);
                propertyKeys.forEach((propertyKey) => {
                    if (!propertyKey.startsWith('_') && propertyKey !== 'entity' && propertyKey !== 'constructor') {
                        const propertyValue = (component as any)[propertyKey];
                        if (propertyValue !== undefined && propertyValue !== null) {
                            properties[propertyKey] = this.formatPropertyValue(propertyValue);
                        }
                    }
                });

                // 如果没有找到任何属性，添加一些调试信息
                if (Object.keys(properties).length === 0) {
                    properties['_info'] = '该组件没有公开属性';
                    properties['_componentId'] = getComponentInstanceTypeName(component);
                }
            } catch (error) {
                properties['_error'] = '属性提取失败';
                properties['_componentId'] = getComponentInstanceTypeName(component);
            }

            return {
                typeName: typeName,
                properties: properties
            };
        });
    }

    /**
     * 获取组件的完整属性信息（仅在需要时调用）
     * @param entityId 实体ID
     * @param componentIndex 组件索引
     * @param scene 场景实例
     */
    public getComponentProperties(
        entityId: number,
        componentIndex: number,
        scene?: IScene | null
    ): Record<string, any> {
        try {
            if (!scene) return {};

            const entityList = scene.entities;
            if (!entityList?.buffer) return {};

            const entity = entityList.buffer.find((e: any) => e.id === entityId);
            if (!entity || componentIndex >= entity.components.length) return {};

            const component = entity.components[componentIndex];
            if (!component) return {};
            const properties: Record<string, any> = {};

            const propertyKeys = Object.keys(component);
            propertyKeys.forEach((propertyKey) => {
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
                    const sample = obj.slice(0, 3).map((item) => this.formatPropertyValue(item, 1));
                    return {
                        _isLazyArray: true,
                        _arrayLength: obj.length,
                        _sample: sample,
                        _summary: `数组[${obj.length}个元素]`
                    };
                }

                return obj.map((item) => this.formatPropertyValue(item, 1));
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
     * @param entityId 实体ID
     * @param componentIndex 组件索引
     * @param propertyPath 属性路径
     * @param scene 场景实例
     */
    public expandLazyObject(
        entityId: number,
        componentIndex: number,
        propertyPath: string,
        scene?: IScene | null
    ): any {
        try {
            if (!scene) return null;

            const entityList = scene.entities;
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
