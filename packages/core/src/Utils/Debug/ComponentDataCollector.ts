import { IComponentDebugData } from '../../Types';
import { ComponentPoolManager } from '../../ECS/Core/ComponentPool';
import { getComponentInstanceTypeName } from '../../ECS/Decorators';
import { IScene } from '../../ECS/IScene';

/**
 * 组件数据收集器
 */
export class ComponentDataCollector {
    private static componentSizeCache = new Map<string, number>();

    /**
     * 收集组件数据（轻量版，不计算实际内存大小）
     * @param scene 场景实例
     */
    public collectComponentData(scene?: IScene | null): IComponentDebugData {
        if (!scene) {
            return {
                componentTypes: 0,
                componentInstances: 0,
                componentStats: []
            };
        }

        const entityList = scene.entities;
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
                    const typeName = getComponentInstanceTypeName(component);
                    const stats = componentStats.get(typeName) || { count: 0, entities: 0 };
                    stats.count++;
                    totalInstances++;
                    componentStats.set(typeName, stats);
                });
            }
        });

        // 获取池利用率信息
        const poolUtilizations = new Map<string, number>();
        const poolSizes = new Map<string, number>();

        try {
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
                // 使用预估的基础内存大小，避免每帧计算
                const memoryPerInstance = this.getEstimatedComponentSize(typeName, scene);

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
     * 获取组件类型的估算内存大小（基于预设值，不进行实际计算）
     */
    private getEstimatedComponentSize(typeName: string, scene?: IScene | null): number {
        if (ComponentDataCollector.componentSizeCache.has(typeName)) {
            return ComponentDataCollector.componentSizeCache.get(typeName)!;
        }

        if (!scene) return 64;

        const entityList = scene.entities;
        if (!entityList?.buffer) return 64;

        let calculatedSize = 64;

        try {
            for (const entity of entityList.buffer) {
                if (entity.components) {
                    const component = entity.components.find((c: any) => getComponentInstanceTypeName(c) === typeName);
                    if (component) {
                        calculatedSize = this.calculateQuickObjectSize(component);
                        break;
                    }
                }
            }
        } catch (error) {
            calculatedSize = 64;
        }

        ComponentDataCollector.componentSizeCache.set(typeName, calculatedSize);
        return calculatedSize;
    }

    private calculateQuickObjectSize(obj: any): number {
        if (!obj || typeof obj !== 'object') return 8;

        let size = 32;
        const visited = new WeakSet();

        const calculate = (item: any, depth: number = 0): number => {
            if (!item || typeof item !== 'object' || visited.has(item) || depth > 3) {
                return 0;
            }
            visited.add(item);

            let itemSize = 0;

            try {
                const keys = Object.keys(item);
                for (let i = 0; i < Math.min(keys.length, 20); i++) {
                    const key = keys[i];
                    if (!key || key === 'entity' || key === '_entity' || key === 'constructor') continue;

                    const value = item[key];
                    itemSize += key.length * 2;

                    if (typeof value === 'string') {
                        itemSize += Math.min(value.length * 2, 200);
                    } else if (typeof value === 'number') {
                        itemSize += 8;
                    } else if (typeof value === 'boolean') {
                        itemSize += 4;
                    } else if (typeof value === 'object' && value !== null) {
                        itemSize += calculate(value, depth + 1);
                    }
                }
            } catch (error) {
                return 32;
            }

            return itemSize;
        };

        size += calculate(obj);
        return Math.max(size, 32);
    }

    /**
     * 为内存快照功能提供的详细内存计算
     * 只在用户主动请求内存快照时调用
     * @param typeName 组件类型名称
     * @param scene 场景实例
     */
    public calculateDetailedComponentMemory(typeName: string, scene?: IScene | null): number {
        if (!scene) return this.getEstimatedComponentSize(typeName, scene);

        const entityList = scene.entities;
        if (!entityList?.buffer) return this.getEstimatedComponentSize(typeName, scene);

        try {
            // 找到第一个包含此组件的实体，分析组件大小
            for (const entity of entityList.buffer) {
                if (entity.components) {
                    const component = entity.components.find((c: any) => getComponentInstanceTypeName(c) === typeName);
                    if (component) {
                        return this.estimateObjectSize(component);
                    }
                }
            }
        } catch (error) {
            // 忽略错误，使用估算值
        }

        return this.getEstimatedComponentSize(typeName, scene);
    }

    /**
     * 估算对象内存大小（仅用于内存快照）
     * 优化版本：减少递归深度，提高性能
     */
    private estimateObjectSize(obj: any, visited = new WeakSet(), depth = 0): number {
        if (obj === null || obj === undefined || depth > 10) return 0;
        if (visited.has(obj)) return 0;

        let size = 0;
        const type = typeof obj;

        switch (type) {
            case 'boolean':
                size = 4;
                break;
            case 'number':
                size = 8;
                break;
            case 'string':
                size = 24 + Math.min(obj.length * 2, 1000);
                break;
            case 'object':
                visited.add(obj);

                if (Array.isArray(obj)) {
                    size = 40 + (obj.length * 8);
                    const maxElements = Math.min(obj.length, 50);
                    for (let i = 0; i < maxElements; i++) {
                        size += this.estimateObjectSize(obj[i], visited, depth + 1);
                    }
                } else {
                    size = 32;

                    try {
                        const ownKeys = Object.getOwnPropertyNames(obj);
                        const maxProps = Math.min(ownKeys.length, 30);

                        for (let i = 0; i < maxProps; i++) {
                            const key = ownKeys[i];
                            if (!key) continue;

                            if (key === 'constructor' ||
                                key === '__proto__' ||
                                key === 'entity' ||
                                key === '_entity' ||
                                key.startsWith('_cc_') ||
                                key.startsWith('__')) {
                                continue;
                            }

                            try {
                                size += 16 + (key.length * 2);

                                const value = obj[key];
                                if (value !== undefined && value !== null) {
                                    size += this.estimateObjectSize(value, visited, depth + 1);
                                }
                            } catch (error) {
                                continue;
                            }
                        }
                    } catch (error) {
                        size = 128;
                    }
                }
                break;
            default:
                size = 8;
        }

        return Math.ceil(size / 8) * 8;
    }

    public static clearCache(): void {
        ComponentDataCollector.componentSizeCache.clear();
    }
}
