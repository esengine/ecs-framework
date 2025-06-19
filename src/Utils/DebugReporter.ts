import { 
    IECSDebugConfig, 
    IECSDebugData, 
    IEntityDebugData, 
    ISystemDebugData, 
    IPerformanceDebugData, 
    IComponentDebugData, 
    ISceneDebugData 
} from '../types';
import { Core } from '../Core';
import { Time } from './Time';

/**
 * ECS调试报告器 - WebSocket模式
 * 
 * 负责收集ECS框架的运行时调试数据并通过WebSocket发送到调试服务器
 */
export class DebugReporter {
    private config: IECSDebugConfig;
    private core: Core;
    private timer?: any;
    private ws?: WebSocket;
    private lastFrameTime: number = 0;
    private frameCount: number = 0;
    private lastFpsTime: number = 0;
    private fps: number = 0;
    private sceneStartTime: number = 0;
    private isConnected: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private frameTimeHistory: number[] = [];
    private maxHistoryLength: number = 60; // 保存60帧的历史数据

    /**
     * 构造函数
     * @param core Core实例
     * @param config 调试配置
     */
    constructor(core: Core, config: IECSDebugConfig) {
        this.core = core;
        this.config = config;
        this.sceneStartTime = Date.now();
        
        // 确保性能监控器在调试模式下被启用
        if (this.config.enabled && this.config.channels.performance) {
            if (!this.core._performanceMonitor.isEnabled) {
                this.core._performanceMonitor.enable();
                console.log('[ECS Debug] Performance monitor enabled for debugging');
            }
        }
        
        if (this.config.enabled) {
            this.start();
        }
    }

    /**
     * 启动调试报告器
     */
    private start(): void {
        this.connectWebSocket();
    }

    /**
     * 停止调试报告器
     */
    public stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = undefined;
        }

        this.isConnected = false;
    }

    /**
     * 更新配置
     * @param newConfig 新配置
     */
    public updateConfig(newConfig: IECSDebugConfig): void {
        const wasEnabled = this.config.enabled;
        const urlChanged = this.config.websocketUrl !== newConfig.websocketUrl;
        
        this.config = newConfig;

        // 根据配置启用或禁用性能监控器
        if (newConfig.enabled && newConfig.channels.performance) {
            if (!this.core._performanceMonitor.isEnabled) {
                this.core._performanceMonitor.enable();
                console.log('[ECS Debug] Performance monitor enabled for debugging');
            }
        }

        if (!newConfig.enabled && wasEnabled) {
            this.stop();
        } else if (newConfig.enabled && (!wasEnabled || urlChanged)) {
            this.stop();
            this.start();
        }
    }

    /**
     * 连接WebSocket
     */
    private connectWebSocket(): void {
        if (!this.config.websocketUrl) {
            console.error('[ECS Debug] WebSocket URL not provided');
            return;
        }

        try {
            this.ws = new WebSocket(this.config.websocketUrl);
            
            this.ws.onopen = () => {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.startDataStream();
                
                // 发送初始化消息
                this.send({
                    type: 'init',
                    data: {
                        frameworkVersion: this.getFrameworkVersion(),
                        timestamp: Date.now()
                    }
                });
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('[ECS Debug] Failed to parse message:', error);
                }
            };

            this.ws.onclose = (event) => {
                this.isConnected = false;
                
                if (this.timer) {
                    clearInterval(this.timer);
                    this.timer = null;
                }

                // 自动重连
                if (this.config.autoReconnect !== false && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);
                    setTimeout(() => this.connectWebSocket(), delay);
                }
            };

            this.ws.onerror = (error) => {
                console.error('[ECS Debug] WebSocket error:', error);
            };
        } catch (error) {
            console.error('[ECS Debug] Failed to create WebSocket:', error);
        }
    }

    /**
     * 启动数据流
     */
    private startDataStream(): void {
        const interval = this.config.updateInterval || 1000;

        this.timer = setInterval(() => {
            if (this.isConnected) {
                try {
                    const data = this.collectDebugData();
                    this.send({ type: 'debug_data', data });
                } catch (error) {
                    console.error('[ECS Debug] Failed to send debug data:', error);
                }
            }
        }, interval);
    }

    /**
     * 发送消息
     */
    private send(message: any): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }

    /**
     * 处理接收到的消息
     * @param message 消息内容
     */
    private handleMessage(message: any): void {
        switch (message.type) {
            case 'get_debug_data':
                const data = this.collectDebugData();
                this.send({ type: 'debug_data_response', data, requestId: message.requestId });
                break;
                
            case 'update_config':
                if (message.config) {
                    this.updateConfig(message.config);
                    this.send({ type: 'config_updated', success: true });
                }
                break;
                
            case 'ping':
                this.send({ type: 'pong', timestamp: Date.now() });
                break;
                
            default:
                console.warn('[ECS Debug] Unknown message type:', message.type);
        }
    }

    /**
     * 收集调试数据
     * @returns 调试数据对象
     */
    private collectDebugData(): IECSDebugData {
        const currentTime = Date.now();
        
        // 更新FPS计算
        this.updateFPS(currentTime);

        const data: IECSDebugData = {
            timestamp: currentTime,
            frameworkVersion: this.getFrameworkVersion(),
            isRunning: true,
            frameworkLoaded: true,
            currentScene: this.getCurrentSceneName()
        };

        // 根据配置收集不同类型的数据
        if (this.config.channels.entities) {
            data.entities = this.collectEntityData();
        }

        if (this.config.channels.systems) {
            data.systems = this.collectSystemData();
        }

        if (this.config.channels.performance) {
            data.performance = this.collectPerformanceData();
        }

        if (this.config.channels.components) {
            data.components = this.collectComponentData();
        }

        if (this.config.channels.scenes) {
            data.scenes = this.collectSceneData();
        }

        return data;
    }

    /**
     * 更新FPS计算
     */
    private updateFPS(currentTime: number): void {
        this.frameCount++;
        
        if (currentTime - this.lastFpsTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsTime = currentTime;
        }
    }

    /**
     * 获取框架版本
     */
    private getFrameworkVersion(): string {
        return '1.0.0';
    }

    /**
     * 获取当前场景名称
     */
    private getCurrentSceneName(): string {
        const scene = Core.scene;
        return scene ? (scene as any).name || 'Unnamed Scene' : 'No Scene';
    }

    /**
     * 收集实体数据
     */
    private collectEntityData(): IEntityDebugData {
        const scene = Core.scene;
        if (!scene) {
            return {
                totalEntities: 0,
                activeEntities: 0,
                pendingAdd: 0,
                pendingRemove: 0,
                entitiesPerArchetype: [],
                topEntitiesByComponents: []
            };
        }

        const entityList = (scene as any).entities;
        if (!entityList) {
            return {
                totalEntities: 0,
                activeEntities: 0,
                pendingAdd: 0,
                pendingRemove: 0,
                entitiesPerArchetype: [],
                topEntitiesByComponents: []
            };
        }

        const allEntities = entityList.buffer || [];
        const activeEntities = allEntities.filter((e: any) => e.enabled && !e._isDestroyed);
        
        return {
            totalEntities: allEntities.length,
            activeEntities: activeEntities.length,
            pendingAdd: entityList.toAdd?.length || 0,
            pendingRemove: entityList.toRemove?.length || 0,
            entitiesPerArchetype: this.getArchetypeDistribution({ entities: allEntities }),
            topEntitiesByComponents: this.getTopEntitiesByComponents({ entities: allEntities }),
            entityDetails: this.getEntityDetails({ entities: allEntities })
        };
    }

    /**
     * 获取实体详情
     */
    private getEntityDetails(entityContainer: any): Array<any> {
        if (!entityContainer.entities) return [];

        return entityContainer.entities.slice(0, 100).map((entity: any) => ({
            id: entity.id,
            name: entity.name || `Entity_${entity.id}`,
            tag: entity.tag,
            enabled: entity.enabled,
            componentCount: entity.components?.length || 0,
            components: entity.components?.map((c: any) => c.constructor.name) || []
        }));
    }

    /**
     * 收集系统数据
     */
    private collectSystemData(): ISystemDebugData {
        const scene = Core.scene;
        if (!scene) {
            return {
                totalSystems: 0,
                systemsInfo: []
            };
        }

        const entityProcessors = (scene as any).entityProcessors;
        if (!entityProcessors) {
            return {
                totalSystems: 0,
                systemsInfo: []
            };
        }

        const systems = entityProcessors.processors || [];
        
        // 获取性能监控数据
        const monitor = this.core._performanceMonitor;
        let systemStats: Map<string, any> = new Map();
        let systemData: Map<string, any> = new Map();
        
        if (monitor) {
            try {
                systemStats = monitor.getAllSystemStats();
                systemData = monitor.getAllSystemData();
            } catch (error) {
                // 忽略错误，使用空的Map
            }
        }
        
        return {
            totalSystems: systems.length,
            systemsInfo: systems.map((system: any) => {
                const systemName = system.systemName || system.constructor.name;
                const stats = systemStats.get(systemName);
                const data = systemData.get(systemName);
                
                return {
                    name: systemName,
                    type: system.constructor.name,
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

    /**
     * 收集性能数据
     */
    private collectPerformanceData(): IPerformanceDebugData {
        const frameTimeSeconds = Time.deltaTime;
        const engineFrameTimeMs = frameTimeSeconds * 1000;
        const currentFps = frameTimeSeconds > 0 ? Math.round(1 / frameTimeSeconds) : 0;
        
        const ecsPerformanceData = this.getECSPerformanceData();
        const ecsExecutionTimeMs = ecsPerformanceData.totalExecutionTime;
        const ecsPercentage = engineFrameTimeMs > 0 ? (ecsExecutionTimeMs / engineFrameTimeMs * 100) : 0;
        
        let memoryUsage = 0;
        if ((performance as any).memory) {
            memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
        }

        // 更新ECS执行时间历史记录
        this.frameTimeHistory.push(ecsExecutionTimeMs);
        if (this.frameTimeHistory.length > this.maxHistoryLength) {
            this.frameTimeHistory.shift();
        }
        
        // 计算ECS执行时间统计
        const history = this.frameTimeHistory.filter(t => t >= 0);
        const averageECSTime = history.length > 0 ? history.reduce((a, b) => a + b, 0) / history.length : ecsExecutionTimeMs;
        const minECSTime = history.length > 0 ? Math.min(...history) : ecsExecutionTimeMs;
        const maxECSTime = history.length > 0 ? Math.max(...history) : ecsExecutionTimeMs;

        return {
            frameTime: ecsExecutionTimeMs,
            engineFrameTime: engineFrameTimeMs,
            ecsPercentage: ecsPercentage,
            memoryUsage: memoryUsage,
            fps: currentFps,
            averageFrameTime: averageECSTime, // ECS平均执行时间
            minFrameTime: minECSTime, // ECS最短执行时间
            maxFrameTime: maxECSTime, // ECS最长执行时间
            frameTimeHistory: [...this.frameTimeHistory],
            systemPerformance: this.getSystemPerformance(),
            systemBreakdown: ecsPerformanceData.systemBreakdown,
            memoryDetails: this.getMemoryDetails()
        };
    }

    /**
     * 获取ECS框架整体性能数据
     */
    private getECSPerformanceData(): { totalExecutionTime: number; systemBreakdown: Array<any> } {
        const monitor = this.core._performanceMonitor;
        if (!monitor) {
            console.warn('[ECS Debug] Performance monitor not found');
            return { totalExecutionTime: 0, systemBreakdown: [] };
        }

        if (!monitor.isEnabled) {
            console.warn('[ECS Debug] Performance monitor is disabled. Enable it to see ECS performance data.');
            // 尝试启用性能监控器
            monitor.enable();
            return { totalExecutionTime: 0, systemBreakdown: [] };
        }

        try {
            let totalTime = 0;
            const systemBreakdown = [];
            
            const stats = monitor.getAllSystemStats();
            
            if (stats.size === 0) {
                console.log('[ECS Debug] No system performance data available yet. This is normal on first frames.');
                return { totalExecutionTime: 0, systemBreakdown: [] };
            }
            
            // 计算各系统的执行时间
            for (const [systemName, stat] of stats.entries()) {
                const systemTime = stat.averageTime || 0;
                
                totalTime += systemTime;
                systemBreakdown.push({
                    systemName: systemName,
                    executionTime: systemTime,
                    percentage: 0 // 后面计算
                });
            }
            
            // 计算各系统占ECS总时间的百分比
            systemBreakdown.forEach(system => {
                system.percentage = totalTime > 0 ? (system.executionTime / totalTime * 100) : 0;
            });
            
            // 按执行时间排序
            systemBreakdown.sort((a, b) => b.executionTime - a.executionTime);
            
            console.log(`[ECS Debug] Performance data: ${stats.size} systems, total time: ${totalTime.toFixed(2)}ms`);
            
            return {
                totalExecutionTime: totalTime,
                systemBreakdown: systemBreakdown
            };
        } catch (error) {
            console.error('[ECS Debug] Error getting ECS performance data:', error);
            return { totalExecutionTime: 0, systemBreakdown: [] };
        }
    }

    /**
     * 获取系统性能数据
     */
    private getSystemPerformance(): Array<any> {
        const monitor = this.core._performanceMonitor;
        if (!monitor) {
            return [];
        }

        try {
            const stats = monitor.getAllSystemStats();
            const systemData = monitor.getAllSystemData();
            
            return Array.from(stats.entries()).map(([systemName, stat]) => {
                const data = systemData.get(systemName);
                return {
                    systemName: systemName,
                    averageTime: stat.averageTime,
                    maxTime: stat.maxTime,
                    minTime: stat.minTime === Number.MAX_VALUE ? 0 : stat.minTime,
                    samples: stat.executionCount,
                    percentage: 0, // 在getECSPerformanceData中计算
                    entityCount: data?.entityCount || 0,
                    lastExecutionTime: data?.executionTime || 0
                };
            });
        } catch (error) {
            return [];
        }
    }

    /**
     * 获取内存详情
     */
    private getMemoryDetails(): any {
        const scene = Core.scene;
        if (!scene) {
            return {
                entities: 0,
                components: 0,
                systems: 0,
                pooled: 0,
                totalMemory: 0,
                usedMemory: 0,
                freeMemory: 0,
                gcCollections: 0
            };
        }

        try {
            let entityMemory = 0;
            let componentMemory = 0;
            let systemMemory = 0;
            let pooledMemory = 0;

            const entityManager = (scene as any).entityManager;
            if (entityManager?.entities) {
                // 计算实体和组件内存
                entityManager.entities.forEach((entity: any) => {
                    entityMemory += this.estimateObjectSize(entity);
                    
                    if (entity.components) {
                        entity.components.forEach((component: any) => {
                            componentMemory += this.estimateObjectSize(component);
                        });
                    }
                });
            } else {
                // 如果entityManager不存在，尝试从场景直接获取
                const entityList = (scene as any).entities;
                if (entityList?.buffer) {
                    entityList.buffer.forEach((entity: any) => {
                        entityMemory += this.estimateObjectSize(entity);
                        
                        if (entity.components) {
                            entity.components.forEach((component: any) => {
                                componentMemory += this.estimateObjectSize(component);
                            });
                        }
                    });
                }
            }

            // 计算系统内存
            const entitySystems = (scene as any).entitySystems;
            if (entitySystems?.systems) {
                entitySystems.systems.forEach((system: any) => {
                    systemMemory += this.estimateObjectSize(system);
                });
            } else {
                // 尝试从entityProcessors获取
                const entityProcessors = (scene as any).entityProcessors;
                if (entityProcessors?.processors) {
                    entityProcessors.processors.forEach((system: any) => {
                        systemMemory += this.estimateObjectSize(system);
                    });
                }
            }

            // 计算对象池内存
            try {
                const { ComponentPoolManager } = require('../ECS/Core/ComponentPool');
                const poolManager = ComponentPoolManager.getInstance();
                const poolStats = poolManager.getPoolStats();
                
                for (const [typeName, stats] of poolStats.entries()) {
                    // 估算每个组件实例的大小
                    const estimatedComponentSize = this.calculateComponentMemorySize(typeName);
                    pooledMemory += stats.available * estimatedComponentSize;
                }
            } catch (error) {
                // 如果无法访问ComponentPoolManager，使用估算值
                pooledMemory = 512 * 1024; // 512KB估算值
            }

            // 获取浏览器内存信息
            let totalMemory = 512 * 1024 * 1024;
            let usedMemory = entityMemory + componentMemory + systemMemory + pooledMemory;
            let gcCollections = 0;

            if ((performance as any).memory) {
                const perfMemory = (performance as any).memory;
                totalMemory = perfMemory.jsHeapSizeLimit || totalMemory;
                usedMemory = perfMemory.usedJSHeapSize || usedMemory;
            }

            return {
                entities: entityMemory,
                components: componentMemory,
                systems: systemMemory,
                pooled: pooledMemory,
                totalMemory: totalMemory,
                usedMemory: usedMemory,
                freeMemory: totalMemory - usedMemory,
                gcCollections: gcCollections
            };
        } catch (error) {
            return {
                entities: 0,
                components: 0,
                systems: 0,
                pooled: 0,
                totalMemory: 512 * 1024 * 1024,
                usedMemory: 0,
                freeMemory: 512 * 1024 * 1024,
                gcCollections: 0
            };
        }
    }

    /**
     * 收集组件数据
     */
    private collectComponentData(): IComponentDebugData {
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
            const { ComponentPoolManager } = require('../ECS/Core/ComponentPool');
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
     * 估算对象内存大小（字节）
     */
    private estimateObjectSize(obj: any, visited = new WeakSet(), depth = 0): number {
        // 防止无限递归：限制深度和检测循环引用
        if (obj === null || obj === undefined || depth > 10) return 0;
        if (visited.has(obj)) return 0; // 已访问过，避免循环引用
        
        let size = 0;
        const type = typeof obj;
        
        switch (type) {
            case 'boolean':
                size = 1;
                break;
            case 'number':
                size = 8; // JavaScript中数字都是64位浮点数
                break;
            case 'string':
                size = Math.min(obj.length * 2, 1024); // UTF-16编码，每字符2字节，限制最大1KB
                break;
            case 'object':
                visited.add(obj); // 标记为已访问
                
                if (Array.isArray(obj)) {
                    size = 24; // 数组基础开销
                    // 只处理前100个元素，避免大数组导致性能问题
                    const maxItems = Math.min(obj.length, 100);
                    for (let i = 0; i < maxItems; i++) {
                        size += this.estimateObjectSize(obj[i], visited, depth + 1);
                    }
                } else {
                    size = 24; // 对象基础开销
                    let propertyCount = 0;
                    
                    for (const key in obj) {
                        // 只处理前50个属性，避免复杂对象导致性能问题
                        if (propertyCount >= 50) break;
                        
                        if (obj.hasOwnProperty(key)) {
                            // 跳过一些可能导致问题的属性
                            if (key === 'scene' || key === 'parent' || key === 'children' || 
                                key === '_scene' || key === '_parent' || key === '_children' ||
                                key === 'entity' || key === '_entity') {
                                continue;
                            }
                            
                            try {
                                size += key.length * 2; // 属性名
                                size += this.estimateObjectSize(obj[key], visited, depth + 1); // 属性值
                                propertyCount++;
                            } catch (error) {
                                // 忽略访问错误的属性
                                continue;
                            }
                        }
                    }
                }
                break;
            default:
                size = 8; // 其他类型默认8字节
        }
        
        return Math.min(size, 10240); // 限制单个对象最大10KB
    }

    /**
     * 收集场景数据
     */
    private collectSceneData(): ISceneDebugData {
        const scene = Core.scene;
        if (!scene) {
            return {
                currentSceneName: 'No Scene',
                isInitialized: false,
                sceneRunTime: 0,
                sceneEntityCount: 0,
                sceneSystemCount: 0,
                sceneMemory: 0,
                sceneUptime: 0
            };
        }

        const currentTime = Date.now();
        const runTime = (currentTime - this.sceneStartTime) / 1000;

        const entityList = (scene as any).entities;
        const entityProcessors = (scene as any).entityProcessors;

        return {
            currentSceneName: (scene as any).name || 'Unnamed Scene',
            isInitialized: (scene as any)._didSceneBegin || false,
            sceneRunTime: runTime,
            sceneEntityCount: entityList?.buffer?.length || 0,
            sceneSystemCount: entityProcessors?.processors?.length || 0,
            sceneMemory: 0, // TODO: 计算实际场景内存
            sceneUptime: runTime
        };
    }

    /**
     * 手动触发数据收集
     * @returns 当前调试数据
     */
    public getDebugData(): IECSDebugData {
        return this.collectDebugData();
    }

    /**
     * 重置场景时间
     */
    public onSceneChanged(): void {
        this.sceneStartTime = Date.now();
        
        // 发送场景切换事件
        if (this.isConnected) {
            this.send({
                type: 'scene_changed',
                data: {
                    sceneName: this.getCurrentSceneName(),
                    timestamp: Date.now()
                }
            });
        }
    }

    /**
     * 获取连接状态
     */
    public get connected(): boolean {
        return this.isConnected;
    }

    /**
     * 手动重连
     */
    public reconnect(): void {
        if (this.ws) {
            this.ws.close();
        }
        this.reconnectAttempts = 0;
        this.connectWebSocket();
    }

    /**
     * 获取Archetype分布
     */
    private getArchetypeDistribution(entityContainer: any): Array<{ signature: string; count: number; memory: number }> {
        if (!entityContainer.entities) return [];

        const archetypes = new Map<string, { count: number; memory: number }>();
        
        entityContainer.entities.forEach((entity: any) => {
            const components = entity.components || [];
            const signature = components.map((c: any) => c.constructor.name).sort().join(',') || 'Empty';
            
            const existing = archetypes.get(signature) || { count: 0, memory: 0 };
            existing.count++;
            
            // 计算每个组件的实际内存大小
            let entityMemory = 0;
            components.forEach((component: any) => {
                entityMemory += this.estimateObjectSize(component);
            });
            existing.memory += entityMemory;
            
            archetypes.set(signature, existing);
        });

        return Array.from(archetypes.entries())
            .map(([signature, data]) => ({ signature, ...data }))
            .sort((a: any, b: any) => b.count - a.count)
            .slice(0, 10); // 只返回前10个
    }

    /**
     * 获取组件数量最多的实体
     */
    private getTopEntitiesByComponents(entityContainer: any): Array<{ id: string; name: string; componentCount: number; memory: number }> {
        if (!entityContainer.entities) return [];

        return entityContainer.entities
            .map((entity: any) => {
                const components = entity.components || [];
                let memory = 0;
                
                // 计算实际内存使用
                components.forEach((component: any) => {
                    memory += this.estimateObjectSize(component);
                });
                
                return {
                    id: entity.id?.toString() || 'unknown',
                    name: entity.name || `Entity_${entity.id}`,
                    componentCount: components.length,
                    memory: memory
                };
            })
            .sort((a: any, b: any) => b.componentCount - a.componentCount)
            .slice(0, 10); // 只返回前10个
    }
} 