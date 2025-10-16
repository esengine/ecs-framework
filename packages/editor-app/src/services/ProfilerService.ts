import { invoke } from '@tauri-apps/api/core';
import { SettingsService } from './SettingsService';

export interface SystemPerformanceData {
  name: string;
  executionTime: number;
  entityCount: number;
  averageTime: number;
  percentage: number;
}

export interface RemoteEntity {
  id: number;
  name: string;
  enabled: boolean;
  active: boolean;
  activeInHierarchy: boolean;
  componentCount: number;
  componentTypes: string[];
  parentId: number | null;
  childIds: number[];
  depth: number;
  tag: number;
  updateOrder: number;
}

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

export interface ProfilerData {
  totalFrameTime: number;
  systems: SystemPerformanceData[];
  entityCount: number;
  componentCount: number;
  fps: number;
  entities?: RemoteEntity[];
}

type ProfilerDataListener = (data: ProfilerData) => void;

export class ProfilerService {
  private ws: WebSocket | null = null;
  private isServerRunning = false;
  private wsPort: string;
  private listeners: Set<ProfilerDataListener> = new Set();
  private currentData: ProfilerData | null = null;
  private checkServerInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor() {
    const settings = SettingsService.getInstance();
    this.wsPort = settings.get('profiler.port', '8080');

    this.startServerCheck();
    this.listenToSettingsChanges();
  }

  private listenToSettingsChanges(): void {
    window.addEventListener('settings:changed', ((event: CustomEvent) => {
      const newPort = event.detail['profiler.port'];
      if (newPort && newPort !== this.wsPort) {
        this.wsPort = newPort;
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

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public isServerActive(): boolean {
    return this.isServerRunning;
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

      // 如果服务器还没运行，自动启动它
      if (!status) {
        await this.startServer();
        return;
      }

      // 服务器启动了，尝试连接
      if (status && !this.ws) {
        this.connectToServer();
      }

      // 服务器从运行变为停止
      if (wasRunning && !status) {
        console.log('[ProfilerService] Server stopped');
        this.disconnect();
      }
    } catch (error) {
      this.isServerRunning = false;
    }
  }

  private async startServer(): Promise<void> {
    try {
      const port = parseInt(this.wsPort);
      await invoke<string>('start_profiler_server', { port });
      this.isServerRunning = true;
    } catch (error) {
      console.error('[ProfilerService] Failed to start server:', error);
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
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'debug_data' && message.data) {
            this.handleDebugData(message.data);
          } else if (message.type === 'get_raw_entity_list_response' && message.data) {
            this.handleRawEntityListResponse(message.data);
          } else if (message.type === 'get_entity_details_response' && message.data) {
            this.handleEntityDetailsResponse(message.data);
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

  private handleDebugData(debugData: any): void {
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

    // 请求完整的实体列表
    this.requestRawEntityList();
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
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('[ProfilerService] Error in listener:', error);
      }
    });
  }

  private disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  public destroy(): void {
    this.disconnect();

    if (this.checkServerInterval) {
      clearInterval(this.checkServerInterval);
      this.checkServerInterval = null;
    }

    this.listeners.clear();
    this.currentData = null;
  }
}
