import { IComponentDebugData } from '../../Types';
import { Core } from '../../Core';

/**
 * 组件数据收集器
 */
export class ComponentDataCollector {
    /**
     * 收集组件数据
     */
    public collectComponentData(): IComponentDebugData {
        const scene = Core.scene;
        if (!scene) {
            return {
                componentTypes: 0,
                componentInstances: 0,
                componentStats: []
            };
        }

        const entityList = (scene as any).entities;
        if (!entityList?.buffer) {
            return {
                componentTypes: 0,
                componentInstances: 0,
                componentStats: []
            };
        }

        const componentStats = new Map<string, { count: number; entities: number }>();
        let totalInstances = 0;

        entityList.buffer.forEach((entity: any) => {
            if (entity.components) {
                entity.components.forEach((component: any) => {
                    const typeName = component.constructor.name;
                    const stats = componentStats.get(typeName) || { count: 0, entities: 0 };
                    stats.count++;
                    totalInstances++;
                    componentStats.set(typeName, stats);
                });
            }
        });

        // 获取池利用率信息
        let poolUtilizations = new Map<string, number>();
        let poolSizes = new Map<string, number>();
        
        try {
            const { ComponentPoolManager } = require('../../ECS/Core/ComponentPool');
            const poolManager = ComponentPoolManager.getInstance();
            const poolStats = poolManager.getPoolStats();
            const utilizations = poolManager.getPoolUtilization();
            
            for (const [typeName, stats] of poolStats.entries()) {
                poolSizes.set(typeName, stats.maxSize);
            }
            
            for (const [typeName, util] of utilizations.entries()) {
                poolUtilizations.set(typeName, util.utilization);
            }
        } catch (error) {
            // 如果无法获取池信息，使用默认值
        }

        return {
            componentTypes: componentStats.size,
            componentInstances: totalInstances,
            componentStats: Array.from(componentStats.entries()).map(([typeName, stats]) => {
                const poolSize = poolSizes.get(typeName) || 0;
                const poolUtilization = poolUtilizations.get(typeName) || 0;
                const memoryPerInstance = this.calculateComponentMemorySize(typeName);
                
                return {
                    typeName,
                    instanceCount: stats.count,
                    memoryPerInstance: memoryPerInstance,
                    totalMemory: stats.count * memoryPerInstance,
                    poolSize: poolSize,
                    poolUtilization: poolUtilization,
                    averagePerEntity: stats.count / entityList.buffer.length
                };
            })
        };
    }

    /**
     * 计算组件实际内存大小
     */
    private calculateComponentMemorySize(typeName: string): number {
        const scene = Core.scene;
        if (!scene) return 32;
        
        const entityList = (scene as any).entities;
        if (!entityList?.buffer) return 32;
        
        try {
            // 找到第一个包含此组件的实体，分析组件大小
            for (const entity of entityList.buffer) {
                if (entity.components) {
                    const component = entity.components.find((c: any) => c.constructor.name === typeName);
                    if (component) {
                        return this.estimateObjectSize(component);
                    }
                }
            }
        } catch (error) {
            // 忽略错误，使用默认值
        }
        
        // 如果无法计算，返回基础大小
        return 32; // 基础对象开销
    }

    /**
     * 估算对象内存大小
     */
    private estimateObjectSize(obj: any, visited = new WeakSet(), depth = 0): number {
        if (obj === null || obj === undefined || depth > 50) return 0;
        if (visited.has(obj)) return 0;
        
        let size = 0;
        const type = typeof obj;
        
        switch (type) {
            case 'boolean':
                size = 1;
                break;
            case 'number':
                size = 8;
                break;
            case 'string':
                const stringSize = 24 + (obj.length * 2);
                size = Math.ceil(stringSize / 8) * 8;
                break;
            case 'object':
                visited.add(obj);
                
                if (Array.isArray(obj)) {
                    size = 40 + (obj.length * 8);
                    for (let i = 0; i < obj.length; i++) {
                        size += this.estimateObjectSize(obj[i], visited, depth + 1);
                    }
                } else {
                    size = 32;
                    const allKeys = [
                        ...Object.getOwnPropertyNames(obj),
                        ...Object.getOwnPropertySymbols(obj)
                    ];
                    
                    for (const key of allKeys) {
                        try {
                            if (typeof key === 'string' && (
                                key === 'constructor' || 
                                key === '__proto__' ||
                                key === 'entity' || key === '_entity'
                            )) {
                                continue;
                            }
                            
                            const descriptor = Object.getOwnPropertyDescriptor(obj, key);
                            if (!descriptor) continue;
                            
                            if (typeof key === 'string') {
                                size += 16 + (key.length * 2);
                            } else {
                                size += 24;
                            }
                            
                            if (descriptor.value !== undefined) {
                                size += this.estimateObjectSize(descriptor.value, visited, depth + 1);
                            }
                        } catch (error) {
                            continue;
                        }
                    }
                }
                break;
            default:
                size = 8;
        }
        
        return Math.ceil(size / 8) * 8;
    }
} 