import { IEntityDebugData } from '../../types';
import { Core } from '../../Core';
import { Entity } from '../../ECS/Entity';
import { Component } from '../../ECS/Component';

/**
 * 实体数据收集器
 */
export class EntityDataCollector {
    /**
     * 收集实体数据
     */
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
            // console.warn('[ECS Debug] 获取实体统计失败:', error);
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

        // 利用ArchetypeSystem的缓存数据
        const archetypeData = this.collectArchetypeData(scene);
        
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

    /**
     * 获取空的实体数据
     */
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

    /**
     * 计算实体统计信息
     */
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

    /**
     * 收集原型数据
     */
    private collectArchetypeData(scene: any): {
        distribution: Array<{ signature: string; count: number; memory: number }>;
        topEntities: Array<{ id: string; name: string; componentCount: number; memory: number }>;
    } {
        // 利用ArchetypeSystem的缓存数据
        if (scene && scene.archetypeSystem && typeof scene.archetypeSystem.getAllArchetypes === 'function') {
            return this.extractArchetypeStatistics(scene.archetypeSystem);
        }

        // 回退到传统方法
        const entityContainer = { entities: scene.entities?.buffer || [] };
        return {
            distribution: this.getArchetypeDistribution(entityContainer),
            topEntities: this.getTopEntitiesByComponents(entityContainer)
        };
    }

    /**
     * 提取原型统计信息
     */
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
            
            // 计算实际内存使用量
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

            // 收集组件数量最多的实体
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

        // 按实体数量排序
        distribution.sort((a, b) => b.count - a.count);
        topEntities.sort((a, b) => b.componentCount - a.componentCount);

        return { distribution, topEntities };
    }

    /**
     * 计算实体内存使用量
     */
    public estimateEntityMemoryUsage(entity: any): number {
        const startTime = performance.now();
        
        let totalSize = 0;
        
        // 计算实体基础大小
        totalSize += this.calculateObjectSize(entity, ['components', 'children', 'parent']);
        
        // 计算组件大小
        if (entity.components) {
            entity.components.forEach((component: any) => {
                totalSize += this.calculateObjectSize(component, ['entity']);
            });
        }
        
        // 记录计算耗时
        const executionTime = performance.now() - startTime;
        if (executionTime > 1) {
            // console.debug(`[ECS Debug] 实体${entity.id}内存计算耗时: ${executionTime.toFixed(2)}ms`);
        }
        
        return totalSize;
    }

    /**
     * 计算对象大小
     */
    public calculateObjectSize(obj: any, excludeKeys: string[] = []): number {
        if (!obj || typeof obj !== 'object') return 0;
        
        let size = 0;
        const visited = new WeakSet();
        
        const calculate = (item: any): number => {
            if (!item || typeof item !== 'object' || visited.has(item)) return 0;
            visited.add(item);
            
            let itemSize = 0;
            
            try {
                for (const key in item) {
                    if (excludeKeys.includes(key)) continue;
                    
                    const value = item[key];
                    itemSize += key.length * 2; // key size
                    
                    if (typeof value === 'string') {
                        itemSize += value.length * 2;
                    } else if (typeof value === 'number') {
                        itemSize += 8;
                    } else if (typeof value === 'boolean') {
                        itemSize += 4;
                    } else if (typeof value === 'object' && value !== null) {
                        itemSize += calculate(value);
                    }
                }
            } catch (error) {
                // 忽略无法访问的属性
            }
            
            return itemSize;
        };
        
        return calculate(obj);
    }

    /**
     * 构建实体层次结构树
     */
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

        // 直接遍历实体缓冲区，只收集根实体
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
        
        // 批量处理实体，减少函数调用开销
        const entities = entityList.buffer;
        const batchSize = 50;
        
        for (let i = 0; i < entities.length; i += batchSize) {
            const batch = entities.slice(i, i + batchSize);
            
            batch.forEach((entity: Entity) => {
                // 优先使用Entity的getDebugInfo方法
                const baseDebugInfo = entity.getDebugInfo ? 
                    entity.getDebugInfo() : 
                    this.buildFallbackEntityInfo(entity);

                // 利用组件缓存统计信息
                const componentCacheStats = (entity as any).getComponentCacheStats ? 
                    (entity as any).getComponentCacheStats() : null;

                const componentDetails = this.extractComponentDetails(entity.components);

                // 构建完整的实体详情对象
                entityDetailsMap[entity.id] = {
                    ...baseDebugInfo,
                    parentName: entity.parent?.name || null,
                    components: componentDetails,
                    componentTypes: baseDebugInfo.componentTypes || 
                        componentDetails.map((comp) => comp.typeName),
                    // 添加缓存性能信息
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
    private extractComponentDetails(components: Component[]): Array<{
        typeName: string;
        properties: Record<string, any>;
    }> {
        return components.map((component: Component) => {
            // 获取组件类型名称，优先使用constructor.name
            let typeName = component.constructor.name;
            
            // 如果constructor.name为空或者是通用名称，尝试其他方法
            if (!typeName || typeName === 'Object' || typeName === 'Function') {
                // 尝试从类型管理器获取
                try {
                    const { ComponentTypeManager } = require('../../ECS/Utils/ComponentTypeManager');
                    const typeManager = ComponentTypeManager.instance;
                    const componentType = component.constructor as any;
                    const typeId = typeManager.getTypeId(componentType);
                    typeName = typeManager.getTypeName(typeId);
                } catch (error) {
                    // 如果类型管理器不可用，使用默认名称
                    typeName = 'UnknownComponent';
                }
            }
            
            const componentDetail = {
                typeName: typeName,
                properties: {} as Record<string, any>
            };

            // 安全地提取组件属性
            try {
                const propertyKeys = Object.keys(component);
                propertyKeys.forEach(propertyKey => {
                    // 跳过私有属性和实体引用，避免循环引用
                    if (!propertyKey.startsWith('_') && propertyKey !== 'entity') {
                        const propertyValue = (component as any)[propertyKey];
                        if (propertyValue !== undefined && propertyValue !== null) {
                            componentDetail.properties[propertyKey] = this.formatPropertyValue(propertyValue);
                        }
                    }
                });
            } catch (error) {
                componentDetail.properties['_extractionError'] = '属性提取失败';
            }

            return componentDetail;
        });
    }

    /**
     * 格式化属性值
     */
    private formatPropertyValue(value: any, depth: number = 0): any {
        // 防止无限递归，限制最大深度
        if (depth > 5) {
            return value?.toString() || 'null';
        }

        if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
                // 对于数组，总是返回完整数组，让前端决定如何显示
                return value.map(item => this.formatPropertyValue(item, depth + 1));
            } else {
                // 通用对象处理：提取所有可枚举属性，不限制数量
                try {
                    const keys = Object.keys(value);
                    if (keys.length === 0) {
                        return {};
                    }
                    
                    const result: any = {};
                    keys.forEach(key => {
                        const propValue = value[key];
                        // 避免循环引用和函数属性
                        if (propValue !== value && typeof propValue !== 'function') {
                            try {
                                result[key] = this.formatPropertyValue(propValue, depth + 1);
                            } catch (error) {
                                // 如果属性访问失败，记录错误信息
                                result[key] = `[访问失败: ${error instanceof Error ? error.message : String(error)}]`;
                            }
                        }
                    });
                    return result;
                } catch (error) {
                    return `[对象解析失败: ${error instanceof Error ? error.message : String(error)}]`;
                }
            }
        }
        return value;
    }

    /**
     * 获取Archetype分布
     */
    private getArchetypeDistribution(entityContainer: any): Array<{ signature: string; count: number; memory: number }> {
        const distribution = new Map<string, { count: number; memory: number }>();

        if (entityContainer && entityContainer.entities) {
            entityContainer.entities.forEach((entity: any) => {
                const signature = entity.componentMask?.toString() || '0';
                const existing = distribution.get(signature);
                const memory = this.estimateEntityMemoryUsage(entity);
            
                if (existing) {
                    existing.count++;
                    existing.memory += memory;
                } else {
                    distribution.set(signature, { count: 1, memory });
                }
            });
        }
        
        return Array.from(distribution.entries())
            .map(([signature, data]) => ({ signature, ...data }))
            .sort((a, b) => b.count - a.count);
    }

    /**
     * 获取组件数量最多的实体
     */
    private getTopEntitiesByComponents(entityContainer: any): Array<{ id: string; name: string; componentCount: number; memory: number }> {
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

    /**
     * 提取实体详细信息
     */
    private extractEntityDetails(entity: any): any {
        const components = entity.components || [];
        const componentDetails = this.extractComponentDetails(components);
        
        // 格式化组件掩码为更可读的形式
        const componentMask = entity.componentMask || entity._componentMask || 0;
        const componentMaskBinary = componentMask.toString(2).padStart(32, '0');
        const componentMaskHex = '0x' + componentMask.toString(16).toUpperCase().padStart(8, '0');
        
        // 生成组件掩码的可读描述
        const maskDescription = this.generateComponentMaskDescription(componentMask, components);
        
        return {
            id: entity.id,
            name: entity.name || `Entity_${entity.id}`,
            active: entity.active !== false,
            enabled: entity.enabled !== false,
            activeInHierarchy: entity.activeInHierarchy !== false,
            updateOrder: entity.updateOrder || 0,
            tag: entity.tag || '未分配',
            depth: entity.depth || 0,
            componentMask: componentMask,
            componentMaskHex: componentMaskHex,
            componentMaskBinary: componentMaskBinary,
            componentMaskDescription: maskDescription,
            componentCount: components.length,
            components: componentDetails,
            
            // 层次关系信息
            parentId: entity.parent?.id || null,
            parentName: entity.parent?.name || null,
            childCount: entity.children?.length || 0,
            childIds: entity.children?.map((child: any) => child.id).slice(0, 10) || [], // 最多显示10个子实体ID
            
            // 内存信息
            estimatedMemory: this.estimateEntityMemoryUsage(entity),
            
            // 额外的调试信息
            destroyed: entity.destroyed || false,
            scene: entity.scene?.name || '未知场景',
            transform: this.extractTransformInfo(entity),
            
            // 实体状态描述
            statusDescription: this.generateEntityStatusDescription(entity)
        };
    }

    /**
     * 生成组件掩码的可读描述
     */
    private generateComponentMaskDescription(mask: number, components: any[]): string {
        if (mask === 0) {
            return '无组件';
        }
        
        if (components.length === 0) {
            return `掩码值: ${mask} (组件信息不可用)`;
        }
        
        const componentNames = components.map(c => c.constructor.name);
        if (componentNames.length <= 3) {
            return `包含: ${componentNames.join(', ')}`;
        } else {
            return `包含: ${componentNames.slice(0, 3).join(', ')} 等${componentNames.length}个组件`;
        }
    }

    /**
     * 生成实体状态描述
     */
    private generateEntityStatusDescription(entity: any): string {
        const statuses = [];
        
        if (entity.destroyed) {
            statuses.push('已销毁');
        } else {
            if (entity.active === false) {
                statuses.push('非活跃');
            }
            if (entity.enabled === false) {
                statuses.push('已禁用');
            }
            if (entity.activeInHierarchy === false) {
                statuses.push('层次非活跃');
            }
            if (statuses.length === 0) {
                statuses.push('正常运行');
            }
        }
        
        return statuses.join(', ');
    }

    /**
     * 提取变换信息
     */
    private extractTransformInfo(entity: any): any {
        try {
            // 尝试获取Transform组件或position/rotation/scale信息
            const transform = entity.transform || entity.getComponent?.('Transform') || null;
            
            if (transform) {
                return {
                    position: this.formatVector3(transform.position || transform.localPosition),
                    rotation: this.formatVector3(transform.rotation || transform.localRotation),
                    scale: this.formatVector3(transform.scale || transform.localScale),
                    worldPosition: this.formatVector3(transform.worldPosition),
                };
            }
            
            // 如果没有Transform组件，检查是否有直接的位置信息
            if (entity.position || entity.x !== undefined) {
                return {
                    position: this.formatVector3({
                        x: entity.x || entity.position?.x || 0,
                        y: entity.y || entity.position?.y || 0,
                        z: entity.z || entity.position?.z || 0
                    })
                };
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * 格式化Vector3对象
     */
    private formatVector3(vector: any): string | null {
        if (!vector) return null;
        
        try {
            const x = typeof vector.x === 'number' ? vector.x.toFixed(2) : '0.00';
            const y = typeof vector.y === 'number' ? vector.y.toFixed(2) : '0.00';
            const z = typeof vector.z === 'number' ? vector.z.toFixed(2) : '0.00';
            
            return `(${x}, ${y}, ${z})`;
        } catch (error) {
            return vector.toString();
        }
    }
} 