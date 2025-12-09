import { ISystemDebugData } from '../../Types';
import { getSystemInstanceTypeName } from '../../ECS/Decorators';
import { IScene } from '../../ECS/IScene';

/**
 * 系统数据收集器
 * System data collector
 *
 * 收集系统的调试信息，通过公共接口访问数据。
 * Collects system debug information through public interfaces.
 */
export class SystemDataCollector {
    /**
     * 收集系统数据
     * Collect system data
     *
     * @param performanceMonitor 性能监视器实例 | Performance monitor instance
     * @param scene 场景实例 | Scene instance
     */
    public collectSystemData(performanceMonitor: any, scene?: IScene | null): ISystemDebugData {
        if (!scene) {
            return {
                totalSystems: 0,
                systemsInfo: []
            };
        }

        // 使用公共接口 | Use public interface
        const systems = scene.systems || [];

        // 获取性能监控数据
        let systemStats: Map<string, any> = new Map();
        let systemData: Map<string, any> = new Map();

        if (performanceMonitor) {
            try {
                systemStats = performanceMonitor.getAllSystemStats();
                systemData = performanceMonitor.getAllSystemData();
            } catch (error) {
                // 忽略错误，使用空的Map
            }
        }

        return {
            totalSystems: systems.length,
            systemsInfo: systems.map((system: any) => {
                const systemName = system.systemName || getSystemInstanceTypeName(system);
                const stats = systemStats.get(systemName);
                const data = systemData.get(systemName);

                return {
                    name: systemName,
                    type: getSystemInstanceTypeName(system),
                    entityCount: system.entities?.length || 0,
                    executionTime: stats?.averageTime || data?.executionTime || 0,
                    minExecutionTime: stats?.minTime === Number.MAX_VALUE ? 0 : (stats?.minTime || 0),
                    maxExecutionTime: stats?.maxTime || 0,
                    executionTimeHistory: stats?.recentTimes || [],
                    updateOrder: system.updateOrder || 0,
                    enabled: system.enabled !== false,
                    lastUpdateTime: data?.lastUpdateTime || 0
                };
            })
        };
    }
}
