import { readFileSync } from 'fs-extra';
import { join } from 'path';
import { createApp, App, defineComponent, ref, reactive, onMounted, onUnmounted } from 'vue';
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';

const panelDataMap = new WeakMap<any, App>();

/**
 * 游戏实例信息
 */
interface GameInstance {
    id: string;
    name: string;
    connectTime: number;
    lastUpdateTime: number;
    isActive: boolean;
    debugData?: any;
    ws?: WebSocket; // WebSocket连接
}

/**
 * 详细的调试信息接口
 */
interface DetailedDebugInfo {
    // 基础信息
    instanceId: string;
    instanceName: string;
    isRunning: boolean;
    frameworkLoaded: boolean;
    currentScene: string;
    uptime: number;
    
    // 性能信息
    performance: {
        frameTime: number;
        fps: number;
        averageFrameTime: number;
        minFrameTime: number;
        maxFrameTime: number;
        frameTimeHistory: number[];
        engineFrameTime: number;
        ecsPercentage: number;
    };
    
    // 内存信息
    memory: {
        totalMemory: number;
        usedMemory: number;
        freeMemory: number;
        entityMemory: number;
        componentMemory: number;
        systemMemory: number;
        pooledMemory: number;
        gcCollections: number;
    };
    
    // 实体信息
    entities: {
        total: number;
        active: number;
        inactive: number;
        pendingAdd: number;
        pendingRemove: number;
        entitiesPerArchetype: Array<{
            signature: string;
            count: number;
            memory: number;
        }>;
        topEntitiesByComponents: Array<{
            id: string;
            name: string;
            componentCount: number;
            memory: number;
        }>;
    };
    
    // 组件信息
    components: {
        totalTypes: number;
        totalInstances: number;
        componentStats: Array<{
            typeName: string;
            instanceCount: number;
            memoryPerInstance: number;
            totalMemory: number;
            poolSize: number;
            poolUtilization: number;
        }>;
    };
    
    // 系统信息
    systems: {
        total: number;
        systemStats: Array<{
            name: string;
            type: string;
            entityCount: number;
            averageExecutionTime: number;
            minExecutionTime: number;
            maxExecutionTime: number;
            executionTimeHistory: number[];
            memoryUsage: number;
            updateOrder: number;
            enabled: boolean;
            percentage: number;
        }>;
    };
    
    // 场景信息
    scenes: {
        currentScene: string;
        sceneMemory: number;
        sceneEntityCount: number;
        sceneSystemCount: number;
        sceneUptime: number;
    };
}

/**
 * ECS调试服务器
 * 作为服务端，接收多个游戏实例的连接
 */
class ECSDebugServer {
    private wss?: WebSocketServer;
    private port: number = 8080;
    private gameInstances = new Map<string, GameInstance>();
    private isRunning: boolean = false;

    constructor(port: number = 8080) {
        this.port = port;
    }

    async start(): Promise<boolean> {
        if (this.isRunning) return true;

        try {
            this.wss = new WebSocketServer({ port: this.port });
            
            this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
                const instanceId = this.generateInstanceId();
                const instance: GameInstance = {
                    id: instanceId,
                    name: `游戏实例-${instanceId.substring(0, 8)}`,
                    connectTime: Date.now(),
                    lastUpdateTime: Date.now(),
                    isActive: true,
                    debugData: null,
                    ws: ws
                };

                this.gameInstances.set(instanceId, instance);
                console.log(`[ECS Debug Server] New instance connected: ${instance.name}`);

                ws.on('message', (data: Buffer) => {
                    try {
                        const message = JSON.parse(data.toString());
                        this.handleMessage(instanceId, message);
                    } catch (error) {
                        console.error('[ECS Debug Server] Failed to parse message:', error);
                    }
                });

                ws.on('close', () => {
                    const instance = this.gameInstances.get(instanceId);
                    if (instance) {
                        instance.isActive = false;
                        console.log(`[ECS Debug Server] Instance disconnected: ${instance.name}`);
                    }
                });

                ws.on('error', (error: Error) => {
                    console.error(`[ECS Debug Server] WebSocket error for ${instanceId}:`, error);
                });

                // 发送连接确认
                this.sendToInstance(instanceId, {
                    type: 'connection_confirmed',
                    instanceId: instanceId,
                    serverTime: Date.now()
                });
            });

            this.isRunning = true;
            console.log(`[ECS Debug Server] Started on port ${this.port}`);
            return true;

        } catch (error) {
            console.error('[ECS Debug Server] Failed to start:', error);
            return false;
        }
    }

    stop(): void {
        if (this.wss) {
            this.wss.close();
            this.wss = undefined;
        }
        this.gameInstances.clear();
        this.isRunning = false;
        console.log('[ECS Debug Server] Stopped');
    }

    private generateInstanceId(): string {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    private handleMessage(instanceId: string, message: any): void {
        const instance = this.gameInstances.get(instanceId);
        if (!instance) return;

        switch (message.type) {
            case 'debug_data':
                instance.debugData = message.data;
                instance.lastUpdateTime = Date.now();
                break;
                
            case 'instance_info':
                if (message.name) {
                    instance.name = message.name;
                }
                break;
                
            case 'ping':
                this.sendToInstance(instanceId, { type: 'pong', timestamp: Date.now() });
                break;
        }
    }

    private sendToInstance(instanceId: string, message: any): void {
        const instance = this.gameInstances.get(instanceId);
        if (instance && instance.ws && instance.ws.readyState === 1) {
            instance.ws.send(JSON.stringify(message));
        }
    }

    get running(): boolean {
        return this.isRunning;
    }

    get instances(): GameInstance[] {
        return Array.from(this.gameInstances.values());
    }

    getInstance(instanceId: string): GameInstance | undefined {
        return this.gameInstances.get(instanceId);
    }

    getInstanceDebugData(instanceId: string): DetailedDebugInfo | null {
        const instance = this.gameInstances.get(instanceId);
        if (!instance || !instance.debugData) {
            return null;
        }

        return this.transformToDetailedDebugInfo(instance, instance.debugData);
    }

    private transformToDetailedDebugInfo(instance: GameInstance, rawData: any): DetailedDebugInfo {
        const uptime = (Date.now() - instance.connectTime) / 1000;
        
        // 计算系统性能数据，包括ECS占比
        const systemBreakdown = rawData.performance?.systemBreakdown || [];
        const systemPerformance = rawData.performance?.systemPerformance || [];
        
        // 创建系统名称到占比的映射
        const systemPercentageMap = new Map<string, number>();
        systemBreakdown.forEach((sys: any) => {
            systemPercentageMap.set(sys.systemName, sys.percentage || 0);
        });
        
        return {
            instanceId: instance.id,
            instanceName: instance.name,
            isRunning: rawData.isRunning || false,
            frameworkLoaded: rawData.frameworkLoaded || false,
            currentScene: rawData.currentScene || '未知',
            uptime: uptime,
            
            performance: {
                frameTime: rawData.performance?.frameTime || 0,
                fps: rawData.performance?.fps || 0,
                averageFrameTime: rawData.performance?.averageFrameTime || rawData.performance?.frameTime || 0,
                minFrameTime: rawData.performance?.minFrameTime || rawData.performance?.frameTime || 0,
                maxFrameTime: rawData.performance?.maxFrameTime || rawData.performance?.frameTime || 0,
                frameTimeHistory: rawData.performance?.frameTimeHistory || [],
                engineFrameTime: rawData.performance?.engineFrameTime || 0,
                ecsPercentage: rawData.performance?.ecsPercentage || 0
            },
            
            memory: {
                totalMemory: rawData.performance?.memoryDetails?.totalMemory || rawData.memory?.totalMemory || 512 * 1024 * 1024,
                usedMemory: rawData.performance?.memoryDetails?.usedMemory || (rawData.performance?.memoryUsage ? rawData.performance.memoryUsage * 1024 * 1024 : 0),
                freeMemory: rawData.performance?.memoryDetails?.freeMemory || 0,
                entityMemory: rawData.performance?.memoryDetails?.entities || rawData.memory?.entityMemory || 0,
                componentMemory: rawData.performance?.memoryDetails?.components || rawData.memory?.componentMemory || 0,
                systemMemory: rawData.performance?.memoryDetails?.systems || rawData.memory?.systemMemory || 0,
                pooledMemory: rawData.performance?.memoryDetails?.pooled || rawData.memory?.pooledMemory || 0,
                gcCollections: rawData.performance?.memoryDetails?.gcCollections || rawData.memory?.gcCollections || 0
            },
            
            entities: {
                total: rawData.entities?.totalEntities || 0,
                active: rawData.entities?.activeEntities || 0,
                inactive: (rawData.entities?.totalEntities || 0) - (rawData.entities?.activeEntities || 0),
                pendingAdd: rawData.entities?.pendingAdd || 0,
                pendingRemove: rawData.entities?.pendingRemove || 0,
                entitiesPerArchetype: rawData.entities?.entitiesPerArchetype || [],
                topEntitiesByComponents: rawData.entities?.topEntitiesByComponents || []
            },
            
            components: {
                totalTypes: rawData.components?.componentTypes || 0,
                totalInstances: rawData.components?.componentInstances || 0,
                componentStats: (rawData.components?.componentStats || []).map((comp: any) => ({
                    typeName: comp.typeName,
                    instanceCount: comp.instanceCount || 0,
                    memoryPerInstance: comp.memoryPerInstance || 0,
                    totalMemory: comp.totalMemory || (comp.instanceCount || 0) * (comp.memoryPerInstance || 0),
                    poolSize: comp.poolSize || 0,
                    poolUtilization: comp.poolSize > 0 ? (comp.instanceCount / comp.poolSize * 100) : 0
                }))
            },
            
            systems: {
                total: rawData.systems?.totalSystems || 0,
                systemStats: (rawData.systems?.systemsInfo || []).map((sys: any) => {
                    const systemName = sys.name;
                    const percentage = systemPercentageMap.get(systemName) || 0;
                    
                    return {
                        name: systemName,
                        type: sys.type || 'Unknown',
                        entityCount: sys.entityCount || 0,
                        averageExecutionTime: sys.executionTime || 0,
                        minExecutionTime: sys.minExecutionTime || sys.executionTime || 0,
                        maxExecutionTime: sys.maxExecutionTime || sys.executionTime || 0,
                        executionTimeHistory: sys.executionTimeHistory || [],
                        memoryUsage: sys.memoryUsage || 0,
                        updateOrder: sys.updateOrder || 0,
                        enabled: sys.enabled !== false,
                        percentage: percentage
                    };
                })
            },
            
            scenes: {
                currentScene: rawData.currentScene || '未知',
                sceneMemory: rawData.scenes?.sceneMemory || 0,
                sceneEntityCount: rawData.entities?.totalEntities || 0,
                sceneSystemCount: rawData.systems?.totalSystems || 0,
                sceneUptime: rawData.scenes?.sceneUptime || uptime
            }
        };
    }
}

/**
 * 默认调试信息
 */
const defaultDebugInfo: DetailedDebugInfo = {
    instanceId: '',
    instanceName: '未选择实例',
    isRunning: false,
    frameworkLoaded: false,
    currentScene: '未知',
    uptime: 0,
    performance: {
        frameTime: 0,
        fps: 0,
        averageFrameTime: 0,
        minFrameTime: 0,
        maxFrameTime: 0,
        frameTimeHistory: [],
        engineFrameTime: 0,
        ecsPercentage: 0
    },
    memory: {
        totalMemory: 0,
        usedMemory: 0,
        freeMemory: 0,
        entityMemory: 0,
        componentMemory: 0,
        systemMemory: 0,
        pooledMemory: 0,
        gcCollections: 0
    },
    entities: {
        total: 0,
        active: 0,
        inactive: 0,
        pendingAdd: 0,
        pendingRemove: 0,
        entitiesPerArchetype: [],
        topEntitiesByComponents: []
    },
    components: {
        totalTypes: 0,
        totalInstances: 0,
        componentStats: []
    },
    systems: {
        total: 0,
        systemStats: []
    },
    scenes: {
        currentScene: '未知',
        sceneMemory: 0,
        sceneEntityCount: 0,
        sceneSystemCount: 0,
        sceneUptime: 0
    }
};

// 全局调试服务器实例
let globalDebugServer: ECSDebugServer | null = null;

/**
 * 启动调试服务器
 */
async function ensureDebugServer(): Promise<ECSDebugServer> {
    if (!globalDebugServer) {
        globalDebugServer = new ECSDebugServer(8080);
    }
    
    if (!globalDebugServer.running) {
        await globalDebugServer.start();
    }
    
    return globalDebugServer;
}

module.exports = Editor.Panel.define({
    listeners: {
        show() { },
        hide() { },
    },
    template: `<div id="app"></div>`,
    style: readFileSync(join(__dirname, '../../../static/style/debug/index.css'), 'utf-8'),
    $: {
        app: '#app',
    },
    ready() {
        if (this.$.app) {
            const app = createApp(defineComponent({
                setup() {
                    const debugInfo = reactive<DetailedDebugInfo>({ ...defaultDebugInfo });
                    const gameInstances = ref<GameInstance[]>([]);
                    const selectedInstanceId = ref<string>('');
                    const isAutoRefresh = ref(true);
                    const refreshInterval = ref(100);
                    const lastUpdateTime = ref('');
                    const showComponentPoolHelp = ref(false);
                    
                    let intervalId: NodeJS.Timeout | null = null;
                    let debugServer: ECSDebugServer | null = null;

                    // 初始化调试服务器
                    const initializeServer = async () => {
                        try {
                            debugServer = await ensureDebugServer();
                        } catch (error) {
                            console.error('Failed to start debug server:', error);
                        }
                    };

                    // 更新游戏实例列表和调试信息
                    const updateDebugInfo = async () => {
                        if (!debugServer) return;

                        try {
                            // 更新实例列表
                            gameInstances.value = debugServer.instances;
                            
                            // 如果有选中的实例，更新其调试信息
                            if (selectedInstanceId.value) {
                                const detailedInfo = debugServer.getInstanceDebugData(selectedInstanceId.value);
                                if (detailedInfo) {
                                    Object.assign(debugInfo, detailedInfo);
                                } else {
                                    // 实例已断开，重置选择
                                    selectedInstanceId.value = '';
                                    Object.assign(debugInfo, defaultDebugInfo);
                                }
                            }
                            
                            lastUpdateTime.value = new Date().toLocaleTimeString();
                        } catch (error) {
                            console.error('Failed to update debug info:', error);
                        }
                    };

                    // 开始自动刷新
                    const startAutoRefresh = () => {
                        if (intervalId) clearInterval(intervalId);
                        
                        if (isAutoRefresh.value) {
                            intervalId = setInterval(updateDebugInfo, refreshInterval.value);
                        }
                    };

                    // 停止自动刷新
                    const stopAutoRefresh = () => {
                        if (intervalId) {
                            clearInterval(intervalId);
                            intervalId = null;
                        }
                    };

                    // 手动刷新
                    const manualRefresh = () => {
                        updateDebugInfo();
                    };

                    // 切换自动刷新
                    const toggleAutoRefresh = () => {
                        if (isAutoRefresh.value) {
                            startAutoRefresh();
                        } else {
                            stopAutoRefresh();
                        }
                    };

                    // 更改刷新间隔
                    const changeRefreshInterval = () => {
                        if (isAutoRefresh.value) {
                            startAutoRefresh();
                        }
                    };

                    // 实例选择改变
                    const onInstanceChanged = () => {
                        if (selectedInstanceId.value) {
                            updateDebugInfo();
                        } else {
                            Object.assign(debugInfo, defaultDebugInfo);
                        }
                    };

                    // 格式化运行时间
                    const formatUptime = (seconds: number): string => {
                        const hours = Math.floor(seconds / 3600);
                        const minutes = Math.floor((seconds % 3600) / 60);
                        const secs = Math.floor(seconds % 60);
                        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                    };

                    // 格式化内存大小
                    const formatMemory = (bytes: number): string => {
                        if (bytes < 1024) return bytes + ' B';
                        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
                        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
                        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
                    };

                    // 获取FPS颜色
                    const getFpsColor = (fps: number): string => {
                        if (fps >= 55) return 'good';
                        if (fps >= 30) return 'warning';
                        return 'critical';
                    };

                    // 获取内存颜色
                    const getMemoryColor = (percentage: number): string => {
                        if (percentage < 70) return 'good';
                        if (percentage < 85) return 'warning';
                        return 'critical';
                    };

                    // 获取ECS时间占比颜色
                    const getECSTimeColor = (percentage: number): string => {
                        if (!percentage) return 'good';
                        if (percentage <= 10) return 'good';     // ECS占用<=10%为绿色
                        if (percentage <= 30) return 'warning';  // ECS占用<=30%为黄色
                        return 'critical';                       // ECS占用>30%为红色
                    };

                    // 获取执行时间颜色
                    const getExecutionTimeColor = (time: number): string => {
                        if (time < 1) return 'good';  // <1ms为绿色
                        if (time < 5) return 'warning'; // <5ms为黄色
                        return 'critical';
                    };

                    // 打开文档链接  
                    const openDocumentation = (section: string): void => {
                        const urls: Record<string, string> = {
                            'component-pool': 'https://github.com/esengine/ecs-framework/tree/master/docs/component-design-guide.md#1-对象池优化',
                            'performance-optimization': 'https://github.com/esengine/ecs-framework/tree/master/docs/performance-optimization.md'
                        };
                        
                        const url = urls[section];
                        if (!url) return;

                        try {
                            // 在Cocos Creator扩展环境中，直接使用Electron的shell模块
                            const { shell } = require('electron');
                            shell.openExternal(url);
                        } catch (error) {
                            console.error('无法打开链接:', error);
                            // 如果失败，复制到剪贴板
                            copyUrlToClipboard(url);
                        }
                    };

                    // 复制链接到剪贴板的辅助函数
                    const copyUrlToClipboard = (url: string): void => {
                        try {
                            // 尝试使用现代的剪贴板API
                            if (navigator.clipboard && navigator.clipboard.writeText) {
                                navigator.clipboard.writeText(url).then(() => {
                                    console.log(`文档链接已复制到剪贴板: ${url}`);
                                    // 如果可能的话，显示用户友好的提示
                                    if (typeof alert !== 'undefined') {
                                        alert(`文档链接已复制到剪贴板，请在浏览器中粘贴访问:\n${url}`);
                                    }
                                }).catch(() => {
                                    fallbackCopyText(url);
                                });
                            } else {
                                fallbackCopyText(url);
                            }
                        } catch (error) {
                            fallbackCopyText(url);
                        }
                    };

                    // 备用的复制文本方法
                    const fallbackCopyText = (text: string): void => {
                        try {
                            // 创建临时的文本区域
                            const textArea = document.createElement('textarea');
                            textArea.value = text;
                            textArea.style.position = 'fixed';
                            textArea.style.left = '-999999px';
                            textArea.style.top = '-999999px';
                            document.body.appendChild(textArea);
                            textArea.focus();
                            textArea.select();
                            
                            const successful = document.execCommand('copy');
                            document.body.removeChild(textArea);
                            
                            if (successful) {
                                console.log(`文档链接已复制到剪贴板: ${text}`);
                                if (typeof alert !== 'undefined') {
                                    alert(`文档链接已复制到剪贴板，请在浏览器中粘贴访问:\n${text}`);
                                }
                            } else {
                                console.log(`请手动复制文档链接: ${text}`);
                                if (typeof alert !== 'undefined') {
                                    alert(`请手动复制文档链接:\n${text}`);
                                }
                            }
                        } catch (error) {
                            console.log(`请手动访问文档: ${text}`);
                            if (typeof alert !== 'undefined') {
                                alert(`请手动访问文档:\n${text}`);
                            }
                        }
                    };

                    // 组件挂载时初始化
                    onMounted(async () => {
                        await initializeServer();
                        updateDebugInfo();
                        startAutoRefresh();
                    });

                    // 组件卸载时清理
                    onUnmounted(() => {
                        stopAutoRefresh();
                    });

                    return {
                        debugInfo,
                        gameInstances,
                        selectedInstanceId,
                        isAutoRefresh,
                        refreshInterval,
                        lastUpdateTime,
                        showComponentPoolHelp,
                        manualRefresh,
                        toggleAutoRefresh,
                        changeRefreshInterval,
                        onInstanceChanged,
                        formatUptime,
                        formatMemory,
                        getFpsColor,
                        getMemoryColor,
                        getECSTimeColor,
                        getExecutionTimeColor,
                        openDocumentation
                    };
                },
                template: readFileSync(join(__dirname, '../../../static/template/debug/index.html'), 'utf-8'),
            }));

            app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('ui-');
            app.mount(this.$.app);
            panelDataMap.set(this, app);
        }
    },
    beforeClose() { },
    close() {
        const app = panelDataMap.get(this);
        if (app) {
            app.unmount();
            panelDataMap.delete(this);
        }
        
        // 关闭调试服务器
        if (globalDebugServer) {
            globalDebugServer.stop();
            globalDebugServer = null;
        }
    },
}); 