import { IECSDebugConfig, IECSDebugData } from '../../Types';
import { EntityDataCollector } from './EntityDataCollector';
import { SystemDataCollector } from './SystemDataCollector';
import { PerformanceDataCollector } from './PerformanceDataCollector';
import { ComponentDataCollector } from './ComponentDataCollector';
import { SceneDataCollector } from './SceneDataCollector';
import { WebSocketManager } from './WebSocketManager';
import { Core } from '../../Core';

/**
 * 调试管理器
 * 
 * 整合所有调试数据收集器，负责收集和发送调试数据
 */
export class DebugManager {
    private config: IECSDebugConfig;
    private webSocketManager: WebSocketManager;
    private entityCollector: EntityDataCollector;
    private systemCollector: SystemDataCollector;
    private performanceCollector: PerformanceDataCollector;
    private componentCollector: ComponentDataCollector;
    private sceneCollector: SceneDataCollector;

    private frameCounter: number = 0;
    private lastSendTime: number = 0;
    private sendInterval: number;
    private isRunning: boolean = false;

    constructor(core: Core, config: IECSDebugConfig) {
        this.config = config;

        // 初始化数据收集器
        this.entityCollector = new EntityDataCollector();
        this.systemCollector = new SystemDataCollector();
        this.performanceCollector = new PerformanceDataCollector();
        this.componentCollector = new ComponentDataCollector();
        this.sceneCollector = new SceneDataCollector();

        // 初始化WebSocket管理器
        this.webSocketManager = new WebSocketManager(
            config.websocketUrl,
            config.autoReconnect !== false
        );

        // 设置消息处理回调
        this.webSocketManager.setMessageHandler(this.handleMessage.bind(this));

        // 计算发送间隔（基于帧率）
        const debugFrameRate = config.debugFrameRate || 30;
        this.sendInterval = 1000 / debugFrameRate;

        this.start();
    }

    /**
     * 启动调试管理器
     */
    public start(): void {
        if (this.isRunning) return;

        this.isRunning = true;
        this.connectWebSocket();
    }

    /**
     * 停止调试管理器
     */
    public stop(): void {
        if (!this.isRunning) return;

        this.isRunning = false;
        this.webSocketManager.disconnect();
    }

    /**
     * 更新配置
     */
    public updateConfig(config: IECSDebugConfig): void {
        this.config = config;

        // 更新发送间隔
        const debugFrameRate = config.debugFrameRate || 30;
        this.sendInterval = 1000 / debugFrameRate;

        // 重新连接WebSocket（如果URL变化）
        if (this.webSocketManager && config.websocketUrl) {
            this.webSocketManager.disconnect();
            this.webSocketManager = new WebSocketManager(
                config.websocketUrl,
                config.autoReconnect !== false
            );
            this.webSocketManager.setMessageHandler(this.handleMessage.bind(this));
            this.connectWebSocket();
        }
    }

    /**
     * 帧更新回调
     */
    public onFrameUpdate(deltaTime: number): void {
        if (!this.isRunning || !this.config.enabled) return;

        this.frameCounter++;
        const currentTime = Date.now();

        // 基于配置的帧率发送数据
        if (currentTime - this.lastSendTime >= this.sendInterval) {
            this.sendDebugData();
            this.lastSendTime = currentTime;
        }
    }

    /**
     * 场景变更回调
     */
    public onSceneChanged(): void {
        // 场景变更时立即发送一次数据
        if (this.isRunning && this.config.enabled) {
            this.sendDebugData();
        }
    }

    /**
     * 处理来自调试面板的消息
     */
    private handleMessage(message: any): void {
        try {
            switch (message.type) {
                case 'capture_memory_snapshot':
                    this.handleMemorySnapshotRequest();
                    break;

                case 'config_update':
                    if (message.config) {
                        this.updateConfig({ ...this.config, ...message.config });
                    }
                    break;

                case 'expand_lazy_object':
                    this.handleExpandLazyObjectRequest(message);
                    break;

                case 'get_component_properties':
                    this.handleGetComponentPropertiesRequest(message);
                    break;

                case 'get_raw_entity_list':
                    this.handleGetRawEntityListRequest(message);
                    break;

                case 'get_entity_details':
                    this.handleGetEntityDetailsRequest(message);
                    break;

                case 'ping':
                    this.webSocketManager.send({
                        type: 'pong',
                        timestamp: Date.now()
                    });
                    break;

                default:
                    // 未知消息类型，忽略
                    break;
            }
        } catch (error) {
            // console.error('[ECS Debug] 处理消息失败:', error);
            if (message.requestId) {
                this.webSocketManager.send({
                    type: 'error_response',
                    requestId: message.requestId,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
    }

    /**
     * 处理展开懒加载对象请求
     */
    private handleExpandLazyObjectRequest(message: any): void {
        try {
            const { entityId, componentIndex, propertyPath, requestId } = message;
            
            if (entityId === undefined || componentIndex === undefined || !propertyPath) {
                this.webSocketManager.send({
                    type: 'expand_lazy_object_response',
                    requestId,
                    error: '缺少必要参数'
                });
                return;
            }

            const expandedData = this.entityCollector.expandLazyObject(entityId, componentIndex, propertyPath);
            
            this.webSocketManager.send({
                type: 'expand_lazy_object_response',
                requestId,
                data: expandedData
            });
        } catch (error) {
            this.webSocketManager.send({
                type: 'expand_lazy_object_response',
                requestId: message.requestId,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    /**
     * 处理获取组件属性请求
     */
    private handleGetComponentPropertiesRequest(message: any): void {
        try {
            const { entityId, componentIndex, requestId } = message;
            
            if (entityId === undefined || componentIndex === undefined) {
                this.webSocketManager.send({
                    type: 'get_component_properties_response',
                    requestId,
                    error: '缺少必要参数'
                });
                return;
            }

            const properties = this.entityCollector.getComponentProperties(entityId, componentIndex);
            
            this.webSocketManager.send({
                type: 'get_component_properties_response',
                requestId,
                data: properties
            });
        } catch (error) {
            this.webSocketManager.send({
                type: 'get_component_properties_response',
                requestId: message.requestId,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    /**
     * 处理获取原始实体列表请求
     */
    private handleGetRawEntityListRequest(message: any): void {
        try {
            const { requestId } = message;
            
            const rawEntityList = this.entityCollector.getRawEntityList();
            
            this.webSocketManager.send({
                type: 'get_raw_entity_list_response',
                requestId,
                data: rawEntityList
            });
        } catch (error) {
            this.webSocketManager.send({
                type: 'get_raw_entity_list_response',
                requestId: message.requestId,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    /**
     * 处理获取实体详情请求
     */
    private handleGetEntityDetailsRequest(message: any): void {
        try {
            const { entityId, requestId } = message;
            
            if (entityId === undefined) {
                this.webSocketManager.send({
                    type: 'get_entity_details_response',
                    requestId,
                    error: '缺少实体ID参数'
                });
                return;
            }

            const entityDetails = this.entityCollector.getEntityDetails(entityId);
            
            this.webSocketManager.send({
                type: 'get_entity_details_response',
                requestId,
                data: entityDetails
            });
        } catch (error) {
            this.webSocketManager.send({
                type: 'get_entity_details_response',
                requestId: message.requestId,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }





    /**
     * 处理内存快照请求
     */
    private handleMemorySnapshotRequest(): void {
        try {
            const memorySnapshot = this.captureMemorySnapshot();
            this.webSocketManager.send({
                type: 'memory_snapshot_response',
                data: memorySnapshot
            });
        } catch (error) {
            this.webSocketManager.send({
                type: 'memory_snapshot_error',
                error: error instanceof Error ? error.message : '内存快照捕获失败'
            });
        }
    }

    /**
     * 捕获内存快照
     */
    private captureMemorySnapshot(): any {
        const timestamp = Date.now();

        // 使用专门的内存计算方法收集实体数据
        const entityData = this.entityCollector.collectEntityDataWithMemory();

        // 收集其他内存统计
        const baseMemoryInfo = this.collectBaseMemoryInfo();
        const componentMemoryStats = this.collectComponentMemoryStats((Core.scene as any)?.entities);
        const systemMemoryStats = this.collectSystemMemoryStats();
        const poolMemoryStats = this.collectPoolMemoryStats();
        const performanceStats = this.collectPerformanceStats();

        // 计算总内存使用量
        const totalEntityMemory = entityData.entitiesPerArchetype.reduce((sum, arch) => sum + arch.memory, 0);

        return {
            timestamp,
            version: '2.0',
            summary: {
                totalEntities: entityData.totalEntities,
                totalMemoryUsage: baseMemoryInfo.usedMemory,
                totalMemoryLimit: baseMemoryInfo.totalMemory,
                memoryUtilization: (baseMemoryInfo.usedMemory / baseMemoryInfo.totalMemory * 100),
                gcCollections: baseMemoryInfo.gcCollections,
                entityMemory: totalEntityMemory,
                componentMemory: componentMemoryStats.totalMemory,
                systemMemory: systemMemoryStats.totalMemory,
                poolMemory: poolMemoryStats.totalMemory
            },
            baseMemory: baseMemoryInfo,
            entities: {
                totalMemory: totalEntityMemory,
                entityCount: entityData.totalEntities,
                archetypes: entityData.entitiesPerArchetype,
                largestEntities: entityData.topEntitiesByComponents
            },
            components: componentMemoryStats,
            systems: systemMemoryStats,
            pools: poolMemoryStats,
            performance: performanceStats
        };
    }

    /**
     * 收集基础内存信息
     */
    private collectBaseMemoryInfo(): any {
        const memoryInfo: any = {
            totalMemory: 0,
            usedMemory: 0,
            freeMemory: 0,
            gcCollections: 0,
            heapInfo: null
        };

        try {
            if ((performance as any).memory) {
                const perfMemory = (performance as any).memory;
                memoryInfo.totalMemory = perfMemory.jsHeapSizeLimit || 512 * 1024 * 1024;
                memoryInfo.usedMemory = perfMemory.usedJSHeapSize || 0;
                memoryInfo.freeMemory = memoryInfo.totalMemory - memoryInfo.usedMemory;
                memoryInfo.heapInfo = {
                    totalJSHeapSize: perfMemory.totalJSHeapSize || 0,
                    usedJSHeapSize: perfMemory.usedJSHeapSize || 0,
                    jsHeapSizeLimit: perfMemory.jsHeapSizeLimit || 0
                };
            } else {
                memoryInfo.totalMemory = 512 * 1024 * 1024;
                memoryInfo.freeMemory = 512 * 1024 * 1024;
            }

            // 尝试获取GC信息
            if ((performance as any).measureUserAgentSpecificMemory) {
                // 这是一个实验性API，可能不可用
                (performance as any).measureUserAgentSpecificMemory().then((result: any) => {
                    memoryInfo.detailedMemory = result;
                }).catch(() => {
                    // 忽略错误
                });
            }
        } catch (error) {
            // 使用默认值
        }

        return memoryInfo;
    }



    /**
     * 收集组件内存统计
     */
    private collectComponentMemoryStats(entityList: any): any {
        const componentStats = new Map<string, { count: number; totalMemory: number; instances: any[] }>();
        let totalComponentMemory = 0;

        for (const entity of entityList.buffer) {
            if (!entity || entity.destroyed || !entity.components) continue;

            for (const component of entity.components) {
                const typeName = component.constructor.name;
                const componentMemory = this.entityCollector.calculateObjectSize(component, ['entity']);
                totalComponentMemory += componentMemory;

                if (!componentStats.has(typeName)) {
                    componentStats.set(typeName, { count: 0, totalMemory: 0, instances: [] });
                }

                const stats = componentStats.get(typeName)!;
                stats.count++;
                stats.totalMemory += componentMemory;
                stats.instances.push({
                    entityId: entity.id,
                    entityName: entity.name || `Entity_${entity.id}`,
                    memory: componentMemory
                });
            }
        }

        const componentBreakdown = Array.from(componentStats.entries()).map(([typeName, stats]) => ({
            typeName,
            instanceCount: stats.count,
            totalMemory: stats.totalMemory,
            averageMemory: stats.totalMemory / stats.count,
            percentage: totalComponentMemory > 0 ? (stats.totalMemory / totalComponentMemory * 100) : 0,
            largestInstances: stats.instances.sort((a, b) => b.memory - a.memory).slice(0, 3)
        })).sort((a, b) => b.totalMemory - a.totalMemory);

        return {
            totalMemory: totalComponentMemory,
            componentTypes: componentStats.size,
            totalInstances: Array.from(componentStats.values()).reduce((sum, stats) => sum + stats.count, 0),
            breakdown: componentBreakdown
        };
    }

    /**
     * 收集系统内存统计
     */
    private collectSystemMemoryStats(): any {
        const scene = Core.scene;
        let totalSystemMemory = 0;
        const systemBreakdown: any[] = [];

        try {
            const entityProcessors = (scene as any).entityProcessors;
            if (entityProcessors && entityProcessors.processors) {
                for (const system of entityProcessors.processors) {
                    const systemMemory = this.entityCollector.calculateObjectSize(system);
                    totalSystemMemory += systemMemory;

                    systemBreakdown.push({
                        name: system.constructor.name,
                        memory: systemMemory,
                        enabled: system.enabled !== false,
                        updateOrder: system.updateOrder || 0
                    });
                }
            }
        } catch (error) {
            // 忽略错误
        }

        return {
            totalMemory: totalSystemMemory,
            systemCount: systemBreakdown.length,
            breakdown: systemBreakdown.sort((a, b) => b.memory - a.memory)
        };
    }

    /**
     * 收集对象池内存统计
     */
    private collectPoolMemoryStats(): any {
        let totalPoolMemory = 0;
        const poolBreakdown: any[] = [];

        try {
            // 尝试获取组件池统计
            const { ComponentPoolManager } = require('../../ECS/Core/ComponentPool');
            const poolManager = ComponentPoolManager.getInstance();
            const poolStats = poolManager.getPoolStats();

            for (const [typeName, stats] of poolStats.entries()) {
                const poolData = stats as any; // 类型断言
                const poolMemory = poolData.maxSize * 32; // 估算每个对象32字节
                totalPoolMemory += poolMemory;

                poolBreakdown.push({
                    typeName,
                    maxSize: poolData.maxSize,
                    currentSize: poolData.currentSize || 0,
                    estimatedMemory: poolMemory,
                    utilization: poolData.currentSize ? (poolData.currentSize / poolData.maxSize * 100) : 0
                });
            }
        } catch (error) {
            // 如果无法获取池信息，使用默认值
        }

        try {
            // 尝试获取通用对象池统计
            const { Pool } = require('../../Utils/Pool');
            const poolStats = Pool.getStats();

            for (const [typeName, stats] of Object.entries(poolStats)) {
                const poolData = stats as any; // 类型断言
                totalPoolMemory += poolData.estimatedMemoryUsage;
                poolBreakdown.push({
                    typeName: `Pool_${typeName}`,
                    maxSize: poolData.maxSize,
                    currentSize: poolData.size,
                    estimatedMemory: poolData.estimatedMemoryUsage,
                    utilization: poolData.size / poolData.maxSize * 100,
                    hitRate: poolData.hitRate * 100
                });
            }
        } catch (error) {
            // 忽略错误
        }

        return {
            totalMemory: totalPoolMemory,
            poolCount: poolBreakdown.length,
            breakdown: poolBreakdown.sort((a, b) => b.estimatedMemory - a.estimatedMemory)
        };
    }

    /**
     * 收集性能统计信息
     */
    private collectPerformanceStats(): any {
        try {
            const performanceMonitor = (Core.Instance as any)._performanceMonitor;
            if (!performanceMonitor) {
                return { enabled: false };
            }

            const stats = performanceMonitor.getAllSystemStats();
            const warnings = performanceMonitor.getPerformanceWarnings();

                         return {
                enabled: performanceMonitor.enabled,
                systemCount: stats.size,
                warnings: warnings.slice(0, 10), // 最多10个警告
                topSystems: Array.from(stats.entries() as any).map((entry: any) => {
                    const [name, stat] = entry;
                    return {
                        name,
                        averageTime: stat.averageTime,
                        maxTime: stat.maxTime,
                        samples: stat.executionCount
                    };
                }).sort((a: any, b: any) => b.averageTime - a.averageTime).slice(0, 5)
            };
        } catch (error: any) {
            return { enabled: false, error: error.message };
        }
    }

    /**
     * 获取内存大小分类
     */
    private getMemorySizeCategory(memoryBytes: number): string {
        if (memoryBytes < 1024) return '< 1KB';
        if (memoryBytes < 10 * 1024) return '1-10KB';
        if (memoryBytes < 100 * 1024) return '10-100KB';
        if (memoryBytes < 1024 * 1024) return '100KB-1MB';
        return '> 1MB';
    }

    /**
     * 获取调试数据
     */
    public getDebugData(): IECSDebugData {
        const currentTime = Date.now();
        const scene = Core.scene;

        const debugData: IECSDebugData = {
            timestamp: currentTime,
            frameworkVersion: '1.0.0', // 可以从package.json读取
            isRunning: this.isRunning,
            frameworkLoaded: true,
            currentScene: scene?.name || 'Unknown'
        };

        // 根据配置收集各种数据
        if (this.config.channels.entities) {
            debugData.entities = this.entityCollector.collectEntityData();
        }

        if (this.config.channels.systems) {
            const performanceMonitor = (Core.Instance as any)._performanceMonitor;
            debugData.systems = this.systemCollector.collectSystemData(performanceMonitor);
        }

        if (this.config.channels.performance) {
            const performanceMonitor = (Core.Instance as any)._performanceMonitor;
            debugData.performance = this.performanceCollector.collectPerformanceData(performanceMonitor);
        }

        if (this.config.channels.components) {
            debugData.components = this.componentCollector.collectComponentData();
        }

        if (this.config.channels.scenes) {
            debugData.scenes = this.sceneCollector.collectSceneData();
        }

        return debugData;
    }

    /**
     * 连接WebSocket
     */
    private async connectWebSocket(): Promise<void> {
        try {
            await this.webSocketManager.connect();
            // console.log('[ECS Debug] 调试管理器已连接到调试服务器');
        } catch (error) {
            // console.warn('[ECS Debug] 无法连接到调试服务器:', error);
        }
    }

    /**
     * 发送调试数据
     */
    private sendDebugData(): void {
        if (!this.webSocketManager.getConnectionStatus()) {
            return;
        }

        try {
            const debugData = this.getDebugData();
            // 包装成调试面板期望的消息格式
            const message = {
                type: 'debug_data',
                data: debugData
            };
            this.webSocketManager.send(message);
        } catch (error) {
            // console.error('[ECS Debug] 发送调试数据失败:', error);
        }
    }
} 