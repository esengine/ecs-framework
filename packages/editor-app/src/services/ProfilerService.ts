import { invoke } from '@tauri-apps/api/core';
import { SettingsService } from './SettingsService';
import { LogLevel } from '@esengine/ecs-framework';
import type {
    IProfilerService,
    ProfilerData,
    SystemPerformanceData,
    RemoteEntity,
    AdvancedProfilerDataPayload
} from './tokens';

export interface RemoteComponentDetail {
  typeName: string;
  properties: Record<string, any>;
}

export interface RemoteEntityDetails {
  id: number;
  name: string;
  enabled: boolean;
  active: boolean;
  activeInHierarchy: boolean;
  scene: string;
  sceneName: string;
  sceneType: string;
  componentCount: number;
  componentTypes: string[];
  components: RemoteComponentDetail[];
  parentName: string | null;
}

type ProfilerDataListener = (data: ProfilerData) => void;
type AdvancedProfilerDataListener = (data: AdvancedProfilerDataPayload) => void;

export class ProfilerService implements IProfilerService {
    private ws: WebSocket | null = null;
    private isServerRunning = false;
    private wsPort: number;
    private listeners: Set<ProfilerDataListener> = new Set();
    private advancedListeners: Set<AdvancedProfilerDataListener> = new Set();
    private currentData: ProfilerData | null = null;
    private lastRawData: AdvancedProfilerDataPayload | null = null;
    private checkServerInterval: NodeJS.Timeout | null = null;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private clientIdMap: Map<string, string> = new Map();
    private autoStart: boolean;

    constructor() {
        const settings = SettingsService.getInstance();
        this.wsPort = settings.get('profiler.port', 8080);
        this.autoStart = settings.get('profiler.autoStart', true);

        this.startServerCheck();
        this.listenToSettingsChanges();

        // 如果设置了自动启动，则启动服务器
        if (this.autoStart) {
            this.manualStartServer();
        }
    }

    private listenToSettingsChanges(): void {
        window.addEventListener('settings:changed', ((event: CustomEvent) => {
            const newPort = event.detail['profiler.port'];
            if (newPort !== undefined && Number(newPort) !== this.wsPort) {
                console.log(`[ProfilerService] Port changed from ${this.wsPort} to ${newPort}`);
                this.wsPort = Number(newPort);
                this.reconnectWithNewPort();
            }
        }) as EventListener);
    }

    private async reconnectWithNewPort(): Promise<void> {
        this.disconnect();

        if (this.checkServerInterval) {
            clearInterval(this.checkServerInterval);
            this.checkServerInterval = null;
        }

        try {
            await invoke('stop_profiler_server');
            this.isServerRunning = false;
        } catch (error) {
            console.error('[ProfilerService] Failed to stop server:', error);
        }

        this.startServerCheck();
    }

    public subscribe(listener: ProfilerDataListener): () => void {
        this.listeners.add(listener);

        // 如果已有数据，立即发送给新订阅者
        if (this.currentData) {
            listener(this.currentData);
        }

        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * 订阅高级性能数据（用于 AdvancedProfiler 组件）
     */
    public subscribeAdvanced(listener: AdvancedProfilerDataListener): () => void {
        this.advancedListeners.add(listener);

        // 如果已有数据，立即发送给新订阅者
        if (this.lastRawData) {
            listener(this.lastRawData);
        }

        return () => {
            this.advancedListeners.delete(listener);
        };
    }

    /**
     * 请求高级性能分析数据
     */
    public requestAdvancedProfilerData(): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }

        try {
            const request = {
                type: 'get_advanced_profiler_data',
                requestId: `advanced_profiler_${Date.now()}`
            };
            this.ws.send(JSON.stringify(request));
        } catch (error) {
            console.error('[ProfilerService] Failed to request advanced profiler data:', error);
        }
    }

    /**
     * 设置性能分析器选中的函数（用于调用关系视图）
     */
    public setProfilerSelectedFunction(functionName: string | null): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }

        try {
            const request = {
                type: 'set_profiler_selected_function',
                requestId: `set_function_${Date.now()}`,
                functionName
            };
            this.ws.send(JSON.stringify(request));
        } catch (error) {
            console.error('[ProfilerService] Failed to set selected function:', error);
        }
    }

    public isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    public isServerActive(): boolean {
        return this.isServerRunning;
    }

    /**
   * 手动启动服务器
   */
    public async manualStartServer(): Promise<void> {
        await this.startServer();
    }

    /**
   * 手动停止服务器
   */
    public async manualStopServer(): Promise<void> {
        try {
            await invoke('stop_profiler_server');
            this.isServerRunning = false;
            this.disconnect();
        } catch (error) {
            console.error('[ProfilerService] Failed to stop server:', error);
        }
    }

    private startServerCheck(): void {
        this.checkServerStatus();
        this.checkServerInterval = setInterval(() => {
            this.checkServerStatus();
        }, 2000);
    }

    private async checkServerStatus(): Promise<void> {
        try {
            const status = await invoke<boolean>('get_profiler_status');
            const wasRunning = this.isServerRunning;
            this.isServerRunning = status;

            // 服务器启动了，尝试连接
            if (status && !this.ws) {
                this.connectToServer();
            }

            // 服务器从运行变为停止
            if (wasRunning && !status) {
                this.disconnect();
            }
        } catch (error) {
            this.isServerRunning = false;
        }
    }

    private async startServer(): Promise<void> {
        try {
            console.log(`[ProfilerService] Starting server on port ${this.wsPort}`);
            await invoke<string>('start_profiler_server', { port: this.wsPort });
            this.isServerRunning = true;
        } catch (error) {
            // Ignore "already running" error - it's expected in some cases
            const errorMessage = String(error);
            if (!errorMessage.includes('already running')) {
                console.error('[ProfilerService] Failed to start server:', error);
            }
        }
    }

    private connectToServer(): void {
        if (this.ws) return;

        try {
            const ws = new WebSocket(`ws://localhost:${this.wsPort}`);

            ws.onopen = () => {
                this.notifyListeners(this.createEmptyData());
            };

            ws.onclose = () => {
                this.ws = null;

                // 通知监听器连接已断开
                if (this.currentData) {
                    this.notifyListeners(this.currentData);
                }

                // 如果服务器还在运行，尝试重连
                if (this.isServerRunning && !this.reconnectTimeout) {
                    this.reconnectTimeout = setTimeout(() => {
                        this.reconnectTimeout = null;
                        this.connectToServer();
                    }, 3000);
                }
            };

            ws.onerror = (error) => {
                console.error('[ProfilerService] WebSocket error:', error);
                this.ws = null;

                // 通知监听器连接出错
                if (this.currentData) {
                    this.notifyListeners(this.currentData);
                }
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type === 'debug_data' && message.data) {
                        this.handleDebugData(message.data, message.advancedProfiler);
                    } else if (message.type === 'get_raw_entity_list_response' && message.data) {
                        this.handleRawEntityListResponse(message.data);
                    } else if (message.type === 'get_entity_details_response' && message.data) {
                        this.handleEntityDetailsResponse(message.data);
                    } else if (message.type === 'get_advanced_profiler_data_response' && message.data) {
                        this.handleAdvancedProfilerData(message.data);
                    } else if (message.type === 'log' && message.data) {
                        this.handleRemoteLog(message.data);
                    }
                } catch (error) {
                    console.error('[ProfilerService] Failed to parse message:', error);
                }
            };

            this.ws = ws;
        } catch (error) {
            console.error('[ProfilerService] Failed to create WebSocket:', error);
        }
    }

    public requestEntityDetails(entityId: number): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }

        try {
            const request = {
                type: 'get_entity_details',
                requestId: `entity_details_${entityId}_${Date.now()}`,
                entityId
            };
            this.ws.send(JSON.stringify(request));
        } catch (error) {
            console.error('[ProfilerService] Failed to request entity details:', error);
        }
    }

    private handleDebugData(debugData: any, advancedProfiler?: any): void {
        const performance = debugData.performance;
        if (!performance) return;

        const totalFrameTime = performance.frameTime || 0;
        const fps = totalFrameTime > 0 ? Math.round(1000 / totalFrameTime) : 0;

        let systems: SystemPerformanceData[] = [];
        if (performance.systemPerformance && Array.isArray(performance.systemPerformance)) {
            systems = performance.systemPerformance
                .map((sys: any) => ({
                    name: sys.systemName,
                    executionTime: sys.lastExecutionTime || sys.averageTime || 0,
                    entityCount: sys.entityCount || 0,
                    averageTime: sys.averageTime || 0,
                    percentage: 0
                }))
                .sort((a: SystemPerformanceData, b: SystemPerformanceData) =>
                    b.executionTime - a.executionTime
                );

            const totalTime = performance.frameTime || 1;
            systems.forEach((sys: SystemPerformanceData) => {
                sys.percentage = (sys.executionTime / totalTime) * 100;
            });
        }

        const entityCount = debugData.entities?.totalEntities || debugData.entities?.totalCount || 0;
        const componentTypes = debugData.components?.types || [];
        const componentCount = componentTypes.length;

        this.currentData = {
            totalFrameTime,
            systems,
            entityCount,
            componentCount,
            fps,
            entities: []
        };

        this.notifyListeners(this.currentData);

        // 如果有高级性能数据，优先使用它
        if (advancedProfiler) {
            this.lastRawData = {
                advancedProfiler
            };
        } else {
            // 否则使用传统数据
            this.lastRawData = {
                performance: debugData.performance,
                systems: {
                    systemsInfo: systems.map(sys => ({
                        name: sys.name,
                        executionTime: sys.executionTime,
                        entityCount: sys.entityCount,
                        averageTime: sys.averageTime
                    }))
                }
            };
        }
        this.notifyAdvancedListeners(this.lastRawData);

        // 请求完整的实体列表
        this.requestRawEntityList();
    }

    private handleAdvancedProfilerData(data: any): void {
        this.lastRawData = {
            advancedProfiler: data
        };
        this.notifyAdvancedListeners(this.lastRawData);
    }

    private requestRawEntityList(): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }

        try {
            const request = {
                type: 'get_raw_entity_list',
                requestId: `entity_list_${Date.now()}`
            };
            this.ws.send(JSON.stringify(request));
        } catch (error) {
            console.error('[ProfilerService] Failed to request entity list:', error);
        }
    }

    private handleRawEntityListResponse(data: any): void {
        if (!data || !Array.isArray(data)) {
            return;
        }

        const entities: RemoteEntity[] = data.map((e: any) => ({
            id: e.id,
            name: e.name || `Entity ${e.id}`,
            enabled: e.enabled !== false,
            active: e.active !== false,
            activeInHierarchy: e.activeInHierarchy !== false,
            componentCount: e.componentCount || 0,
            componentTypes: e.componentTypes || [],
            parentId: e.parentId || null,
            childIds: e.childIds || [],
            depth: e.depth || 0,
            tag: e.tag || 0,
            updateOrder: e.updateOrder || 0
        }));

        if (this.currentData) {
            this.currentData.entities = entities;
            this.notifyListeners(this.currentData);
        }
    }

    private handleEntityDetailsResponse(data: any): void {
        if (!data) {
            return;
        }

        const entityDetails: RemoteEntityDetails = {
            id: data.id,
            name: data.name || `Entity ${data.id}`,
            enabled: data.enabled !== false,
            active: data.active !== false,
            activeInHierarchy: data.activeInHierarchy !== false,
            scene: data.scene || '',
            sceneName: data.sceneName || '',
            sceneType: data.sceneType || '',
            componentCount: data.componentCount || 0,
            componentTypes: data.componentTypes || [],
            components: data.components || [],
            parentName: data.parentName || null
        };

        window.dispatchEvent(new CustomEvent('profiler:entity-details', {
            detail: entityDetails
        }));
    }

    private handleRemoteLog(data: any): void {
        if (!data) {
            return;
        }

        const levelMap: Record<string, LogLevel> = {
            'debug': LogLevel.Debug,
            'info': LogLevel.Info,
            'warn': LogLevel.Warn,
            'error': LogLevel.Error,
            'fatal': LogLevel.Fatal
        };

        const level = levelMap[data.level?.toLowerCase() || 'info'] || LogLevel.Info;

        let message = data.message || '';
        if (typeof message === 'object') {
            try {
                message = JSON.stringify(message, null, 2);
            } catch {
                message = String(message);
            }
        }

        const clientId = data.clientId || data.client_id || 'unknown';

        window.dispatchEvent(new CustomEvent('profiler:remote-log', {
            detail: {
                level,
                message,
                timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
                clientId
            }
        }));
    }

    private createEmptyData(): ProfilerData {
        return {
            totalFrameTime: 0,
            systems: [],
            entityCount: 0,
            componentCount: 0,
            fps: 0
        };
    }

    private notifyListeners(data: ProfilerData): void {
        this.listeners.forEach((listener) => {
            try {
                listener(data);
            } catch (error) {
                console.error('[ProfilerService] Error in listener:', error);
            }
        });
    }

    private notifyAdvancedListeners(data: AdvancedProfilerDataPayload): void {
        this.advancedListeners.forEach((listener) => {
            try {
                listener(data);
            } catch (error) {
                console.error('[ProfilerService] Error in advanced listener:', error);
            }
        });
    }

    private disconnect(): void {
        const hadConnection = this.ws !== null;

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        // 如果有连接且手动断开，通知监听器
        if (hadConnection && this.currentData) {
            this.notifyListeners(this.currentData);
        }
    }

    public destroy(): void {
        this.disconnect();

        if (this.checkServerInterval) {
            clearInterval(this.checkServerInterval);
            this.checkServerInterval = null;
        }

        this.listeners.clear();
        this.advancedListeners.clear();
        this.currentData = null;
        this.lastRawData = null;
    }
}
