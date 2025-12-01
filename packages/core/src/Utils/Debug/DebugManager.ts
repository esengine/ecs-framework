import { IECSDebugConfig, IECSDebugData } from '../../Types';
import { EntityDataCollector } from './EntityDataCollector';
import { SystemDataCollector } from './SystemDataCollector';
import { PerformanceDataCollector } from './PerformanceDataCollector';
import { ComponentDataCollector } from './ComponentDataCollector';
import { SceneDataCollector } from './SceneDataCollector';
import { AdvancedProfilerCollector } from './AdvancedProfilerCollector';
import { WebSocketManager } from './WebSocketManager';
import { Component } from '../../ECS/Component';
import { ComponentPoolManager } from '../../ECS/Core/ComponentPool';
import { Pool } from '../../Utils/Pool';
import { getComponentInstanceTypeName, getSystemInstanceTypeName } from '../../ECS/Decorators';
import type { IService } from '../../Core/ServiceContainer';
import type { IUpdatable } from '../../Types/IUpdatable';
import { SceneManager } from '../../ECS/SceneManager';
import { PerformanceMonitor } from '../PerformanceMonitor';
import { Injectable, InjectProperty, Updatable } from '../../Core/DI/Decorators';
import { DebugConfigService } from './DebugConfigService';
import { ProfilerSDK } from '../Profiler/ProfilerSDK';

/**
 * 调试管理器
 *
 * 整合所有调试数据收集器，负责收集和发送调试数据
 */
@Injectable()
@Updatable()
export class DebugManager implements IService, IUpdatable {
    private config!: IECSDebugConfig;
    private webSocketManager!: WebSocketManager;
    private entityCollector!: EntityDataCollector;
    private systemCollector!: SystemDataCollector;
    private performanceCollector!: PerformanceDataCollector;
    private componentCollector!: ComponentDataCollector;
    private sceneCollector!: SceneDataCollector;
    private advancedProfilerCollector!: AdvancedProfilerCollector;

    @InjectProperty(SceneManager)
    private sceneManager!: SceneManager;

    @InjectProperty(PerformanceMonitor)
    private performanceMonitor!: PerformanceMonitor;

    @InjectProperty(DebugConfigService)
    private configService!: DebugConfigService;

    private frameCounter: number = 0;
    private lastSendTime: number = 0;
    private sendInterval: number = 0;
    private isRunning: boolean = false;
    private originalConsole = {
        log: console.log.bind(console),
        debug: console.debug.bind(console),
        info: console.info.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console)
    };

    public onInitialize(): void {
        this.config = this.configService.getConfig();

        // 初始化数据收集器
        this.entityCollector = new EntityDataCollector();
        this.systemCollector = new SystemDataCollector();
        this.performanceCollector = new PerformanceDataCollector();
        this.componentCollector = new ComponentDataCollector();
        this.sceneCollector = new SceneDataCollector();
        this.advancedProfilerCollector = new AdvancedProfilerCollector();

        // 启用高级性能分析器
        ProfilerSDK.setEnabled(true);

        // 初始化WebSocket管理器
        this.webSocketManager = new WebSocketManager(
            this.config.websocketUrl,
            this.config.autoReconnect !== false
        );

        // 设置消息处理回调
        this.webSocketManager.setMessageHandler(this.handleMessage.bind(this));

        // 计算发送间隔（基于帧率）
        const debugFrameRate = this.config.debugFrameRate || 30;
        this.sendInterval = 1000 / debugFrameRate;

        // 拦截 console 日志
        this.interceptConsole();

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
     * 拦截 console 日志并转发到编辑器
     */
    private interceptConsole(): void {
        console.log = (...args: unknown[]) => {
            this.sendLog('info', this.formatLogMessage(args));
            this.originalConsole.log(...args);
        };

        console.debug = (...args: unknown[]) => {
            this.sendLog('debug', this.formatLogMessage(args));
            this.originalConsole.debug(...args);
        };

        console.info = (...args: unknown[]) => {
            this.sendLog('info', this.formatLogMessage(args));
            this.originalConsole.info(...args);
        };

        console.warn = (...args: unknown[]) => {
            this.sendLog('warn', this.formatLogMessage(args));
            this.originalConsole.warn(...args);
        };

        console.error = (...args: unknown[]) => {
            this.sendLog('error', this.formatLogMessage(args));
            this.originalConsole.error(...args);
        };
    }

    /**
     * 格式化日志消息
     */
    private formatLogMessage(args: unknown[]): string {
        return args.map((arg) => {
            if (typeof arg === 'string') return arg;
            if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
            if (arg === null) return 'null';
            if (arg === undefined) return 'undefined';
            if (typeof arg === 'object') {
                try {
                    return this.safeStringify(arg, 6);
                } catch {
                    return Object.prototype.toString.call(arg);
                }
            }
            return String(arg);
        }).join(' ');
    }

    /**
     * 安全的 JSON 序列化,支持循环引用和深度限制
     */
    private safeStringify(obj: any, maxDepth: number = 6): string {
        const seen = new WeakSet();

        const stringify = (value: any, depth: number): any => {
            if (value === null) return null;
            if (value === undefined) return undefined;
            if (typeof value !== 'object') return value;

            if (depth >= maxDepth) {
                return '[Max Depth Reached]';
            }

            if (seen.has(value)) {
                return '[Circular]';
            }

            seen.add(value);

            if (Array.isArray(value)) {
                const result = value.map((item) => stringify(item, depth + 1));
                seen.delete(value);
                return result;
            }

            const result: any = {};
            for (const key in value) {
                if (Object.prototype.hasOwnProperty.call(value, key)) {
                    result[key] = stringify(value[key], depth + 1);
                }
            }
            seen.delete(value);
            return result;
        };

        return JSON.stringify(stringify(obj, 0));
    }

    /**
     * 发送日志到编辑器
     */
    private sendLog(level: string, message: string): void {
        if (!this.webSocketManager.getConnectionStatus()) {
            return;
        }

        try {
            this.webSocketManager.send({
                type: 'log',
                data: {
                    level,
                    message,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            // 静默失败，避免递归日志
        }
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

    public update(_deltaTime?: number): void {
        if (!this.isRunning || !this.config.enabled) return;

        this.frameCounter++;
        const currentTime = Date.now();

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

                case 'get_advanced_profiler_data':
                    this.handleGetAdvancedProfilerDataRequest(message);
                    break;

                case 'set_profiler_selected_function':
                    this.handleSetProfilerSelectedFunction(message);
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

            const scene = this.sceneManager.currentScene;
            const expandedData = this.entityCollector.expandLazyObject(entityId, componentIndex, propertyPath, scene);

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

            const scene = this.sceneManager.currentScene;
            const properties = this.entityCollector.getComponentProperties(entityId, componentIndex, scene);

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

            const scene = this.sceneManager.currentScene;
            const rawEntityList = this.entityCollector.getRawEntityList(scene);

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

            const scene = this.sceneManager.currentScene;
            const entityDetails = this.entityCollector.getEntityDetails(entityId, scene);

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
     * 处理获取高级性能分析数据请求
     */
    private handleGetAdvancedProfilerDataRequest(message: any): void {
        try {
            const { requestId } = message;

            // 收集高级性能数据
            const advancedData = ProfilerSDK.isEnabled()
                ? this.advancedProfilerCollector.collectAdvancedData(this.performanceMonitor)
                : this.advancedProfilerCollector.collectFromLegacyMonitor(this.performanceMonitor);

            this.webSocketManager.send({
                type: 'get_advanced_profiler_data_response',
                requestId,
                data: advancedData
            });
        } catch (error) {
            this.webSocketManager.send({
                type: 'get_advanced_profiler_data_response',
                requestId: message.requestId,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    /**
     * 处理设置性能分析器选中函数请求
     */
    private handleSetProfilerSelectedFunction(message: any): void {
        try {
            const { functionName, requestId } = message;
            this.advancedProfilerCollector.setSelectedFunction(functionName || null);

            // 立即发送更新的数据，无需等待下一帧
            this.sendDebugData();

            this.webSocketManager.send({
                type: 'set_profiler_selected_function_response',
                requestId,
                success: true
            });
        } catch (error) {
            this.webSocketManager.send({
                type: 'set_profiler_selected_function_response',
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

        // 收集其他内存统计
        const baseMemoryInfo = this.collectBaseMemoryInfo();
        const scene = this.sceneManager.currentScene;

        // 使用专门的内存计算方法收集实体数据
        const entityData = this.entityCollector.collectEntityDataWithMemory(scene);
        const componentMemoryStats = scene?.entities ? this.collectComponentMemoryStats(scene.entities) : { totalMemory: 0, componentTypes: 0, totalInstances: 0, breakdown: [] };
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
    private collectBaseMemoryInfo(): {
        totalMemory: number;
        usedMemory: number;
        freeMemory: number;
        gcCollections: number;
        heapInfo: {
            totalJSHeapSize: number;
            usedJSHeapSize: number;
            jsHeapSizeLimit: number;
        } | null;
        detailedMemory?: unknown;
        } {
        const memoryInfo = {
            totalMemory: 0,
            usedMemory: 0,
            freeMemory: 0,
            gcCollections: 0,
            heapInfo: null as {
                totalJSHeapSize: number;
                usedJSHeapSize: number;
                jsHeapSizeLimit: number;
            } | null,
            detailedMemory: undefined as unknown
        };

        try {
            // 类型安全的performance memory访问
            const performanceWithMemory = performance as Performance & {
                memory?: {
                    jsHeapSizeLimit?: number;
                    usedJSHeapSize?: number;
                    totalJSHeapSize?: number;
                };
                measureUserAgentSpecificMemory?: () => Promise<unknown>;
            };

            if (performanceWithMemory.memory) {
                const perfMemory = performanceWithMemory.memory;
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
            if (performanceWithMemory.measureUserAgentSpecificMemory) {
                performanceWithMemory.measureUserAgentSpecificMemory().then((result: unknown) => {
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
     * 收集组件内存统计（仅用于内存快照）
     */
    private collectComponentMemoryStats(entityList: { buffer: Array<{ id: number; name?: string; destroyed?: boolean; components?: readonly Component[] }> }): {
        totalMemory: number;
        componentTypes: number;
        totalInstances: number;
        breakdown: Array<{
            typeName: string;
            instanceCount: number;
            totalMemory: number;
            averageMemory: number;
            percentage: number;
            largestInstances: Array<{
                entityId: number;
                entityName: string;
                memory: number;
            }>;
        }>;
    } {
        const componentStats = new Map<string, { count: number; totalMemory: number; instances: Array<{ entityId: number; entityName: string; memory: number }> }>();
        let totalComponentMemory = 0;

        // 首先统计组件类型和数量
        const componentTypeCounts = new Map<string, number>();
        for (const entity of entityList.buffer) {
            if (!entity || entity.destroyed || !entity.components) continue;

            for (const component of entity.components) {
                const typeName = getComponentInstanceTypeName(component);
                componentTypeCounts.set(typeName, (componentTypeCounts.get(typeName) || 0) + 1);
            }
        }

        // 为每种组件类型计算详细内存（只计算一次，然后乘以数量）
        for (const [typeName, count] of componentTypeCounts.entries()) {
            const detailedMemoryPerInstance = this.componentCollector.calculateDetailedComponentMemory(typeName);
            const totalMemoryForType = detailedMemoryPerInstance * count;
            totalComponentMemory += totalMemoryForType;

            // 收集该类型组件的实例信息（用于显示最大的几个实例）
            const instances: Array<{ entityId: number; entityName: string; memory: number }> = [];
            let instanceCount = 0;

            for (const entity of entityList.buffer) {
                if (!entity || entity.destroyed || !entity.components) continue;

                for (const component of entity.components) {
                    if (getComponentInstanceTypeName(component) === typeName) {
                        instances.push({
                            entityId: entity.id,
                            entityName: entity.name || `Entity_${entity.id}`,
                            memory: detailedMemoryPerInstance // 使用统一的详细计算结果
                        });
                        instanceCount++;

                        // 限制收集的实例数量，避免过多数据
                        if (instanceCount >= 100) break;
                    }
                }
                if (instanceCount >= 100) break;
            }

            componentStats.set(typeName, {
                count: count,
                totalMemory: totalMemoryForType,
                instances: instances.slice(0, 10) // 只保留前10个实例用于显示
            });
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

    private collectSystemMemoryStats(): {
        totalMemory: number;
        systemCount: number;
        breakdown: Array<{
            name: string;
            memory: number;
            enabled: boolean;
            updateOrder: number;
        }>;
        } {
        const scene = this.sceneManager.currentScene;
        let totalSystemMemory = 0;
        const systemBreakdown: Array<{
            name: string;
            memory: number;
            enabled: boolean;
            updateOrder: number;
        }> = [];

        try {
            const systems = scene?.systems;
            if (systems) {
                const systemTypeMemoryCache = new Map<string, number>();

                for (const system of systems) {
                    const systemTypeName = getSystemInstanceTypeName(system);

                    let systemMemory: number;
                    if (systemTypeMemoryCache.has(systemTypeName)) {
                        systemMemory = systemTypeMemoryCache.get(systemTypeName)!;
                    } else {
                        systemMemory = this.calculateQuickSystemSize(system);
                        systemTypeMemoryCache.set(systemTypeName, systemMemory);
                    }

                    totalSystemMemory += systemMemory;

                    systemBreakdown.push({
                        name: systemTypeName,
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

    private calculateQuickSystemSize(system: unknown): number {
        if (!system || typeof system !== 'object') return 64;

        let size = 128;

        try {
            const keys = Object.keys(system);
            for (let i = 0; i < Math.min(keys.length, 15); i++) {
                const key = keys[i];
                if (!key || key === 'entities' || key === 'scene' || key === 'constructor') continue;

                const value = (system as Record<string, unknown>)[key];
                size += key.length * 2;

                if (typeof value === 'string') {
                    size += Math.min(value.length * 2, 100);
                } else if (typeof value === 'number') {
                    size += 8;
                } else if (typeof value === 'boolean') {
                    size += 4;
                } else if (Array.isArray(value)) {
                    size += 40 + Math.min(value.length * 8, 200);
                } else if (typeof value === 'object' && value !== null) {
                    size += 64;
                }
            }
        } catch (error) {
            return 128;
        }

        return Math.max(size, 64);
    }

    /**
     * 收集对象池内存统计
     */
    private collectPoolMemoryStats(): {
        totalMemory: number;
        poolCount: number;
        breakdown: Array<{
            typeName: string;
            maxSize: number;
            currentSize: number;
            estimatedMemory: number;
            utilization: number;
            hitRate?: number;
        }>;
        } {
        let totalPoolMemory = 0;
        const poolBreakdown: Array<{
            typeName: string;
            maxSize: number;
            currentSize: number;
            estimatedMemory: number;
            utilization: number;
            hitRate?: number;
        }> = [];

        try {
            // 尝试获取组件池统计
            const poolManager = ComponentPoolManager.getInstance();
            const poolStats = poolManager.getPoolStats();

            for (const [typeName, stats] of poolStats.entries()) {
                const poolData = stats as { maxSize: number; currentSize?: number };
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
            const poolStats = Pool.getAllPoolStats();

            for (const [typeName, stats] of Object.entries(poolStats)) {
                const poolData = stats as {
                    maxSize: number;
                    size: number;
                    estimatedMemoryUsage: number;
                    hitRate: number;
                };
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
    private collectPerformanceStats(): {
        enabled: boolean;
        systemCount?: number;
        warnings?: unknown[];
        topSystems?: Array<{
            name: string;
            averageTime: number;
            maxTime: number;
            samples: number;
        }>;
        error?: string;
        } {
        try {
            if (!this.performanceMonitor) {
                return { enabled: false };
            }

            const stats = this.performanceMonitor.getAllSystemStats();
            const warnings = this.performanceMonitor.getPerformanceWarnings();

            return {
                enabled: (this.performanceMonitor as { enabled?: boolean }).enabled ?? false,
                systemCount: stats.size,
                warnings: warnings.slice(0, 10), // 最多10个警告
                topSystems: Array.from(stats.entries()).map((entry) => {
                    const [name, stat] = entry as [string, { averageTime: number; maxTime: number; executionCount: number }];
                    return {
                        name,
                        averageTime: stat.averageTime,
                        maxTime: stat.maxTime,
                        samples: stat.executionCount
                    };
                }).sort((a, b) => b.averageTime - a.averageTime).slice(0, 5)
            };
        } catch (error: unknown) {
            return { enabled: false, error: error instanceof Error ? error.message : String(error) };
        }
    }


    /**
     * 获取调试数据
     */
    public getDebugData(): IECSDebugData {
        const currentTime = Date.now();
        const scene = this.sceneManager.currentScene;

        const debugData: IECSDebugData = {
            timestamp: currentTime,
            frameworkVersion: '1.0.0', // 可以从package.json读取
            isRunning: this.isRunning,
            frameworkLoaded: true,
            currentScene: scene?.name || 'Unknown'
        };

        // 根据配置收集各种数据
        if (this.config.channels.entities) {
            debugData.entities = this.entityCollector.collectEntityData(scene);
        }

        if (this.config.channels.systems) {
            debugData.systems = this.systemCollector.collectSystemData(this.performanceMonitor, scene);
        }

        if (this.config.channels.performance) {
            debugData.performance = this.performanceCollector.collectPerformanceData(this.performanceMonitor);
        }

        if (this.config.channels.components) {
            debugData.components = this.componentCollector.collectComponentData(scene);
        }

        if (this.config.channels.scenes) {
            debugData.scenes = this.sceneCollector.collectSceneData(scene);
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

            // 收集高级性能数据（包含 callGraph）
            const isProfilerEnabled = ProfilerSDK.isEnabled();

            const advancedProfilerData = isProfilerEnabled
                ? this.advancedProfilerCollector.collectAdvancedData(this.performanceMonitor)
                : null;

            // 包装成调试面板期望的消息格式
            const message = {
                type: 'debug_data',
                data: debugData,
                advancedProfiler: advancedProfilerData
            };
            this.webSocketManager.send(message);
        } catch (error) {
            // console.error('[ECS Debug] 发送调试数据失败:', error);
        }
    }

    /**
     * 释放资源
     */
    public dispose(): void {
        this.stop();

        // 恢复原始 console 方法
        console.log = this.originalConsole.log;
        console.debug = this.originalConsole.debug;
        console.info = this.originalConsole.info;
        console.warn = this.originalConsole.warn;
        console.error = this.originalConsole.error;
    }
}
