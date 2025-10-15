import { invoke } from '@tauri-apps/api/core';

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
  components: string[];
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
  private wsPort = '8080';
  private listeners: Set<ProfilerDataListener> = new Set();
  private currentData: ProfilerData | null = null;
  private checkServerInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor() {
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
      const result = await invoke<string>('start_profiler_server', { port });
      console.log('[ProfilerService]', result);
      this.isServerRunning = true;
    } catch (error) {
      console.error('[ProfilerService] Failed to start server:', error);
    }
  }

  private connectToServer(): void {
    if (this.ws) return;

    try {
      console.log(`[ProfilerService] Connecting to ws://localhost:${this.wsPort}`);
      const ws = new WebSocket(`ws://localhost:${this.wsPort}`);

      ws.onopen = () => {
        console.log('[ProfilerService] Connected to profiler server');
        this.notifyListeners(this.createEmptyData());
      };

      ws.onclose = () => {
        console.log('[ProfilerService] Disconnected from profiler server');
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

    const entityCount = debugData.entities?.totalCount || 0;
    const componentTypes = debugData.components?.types || [];
    const componentCount = componentTypes.length;

    // 解析实体列表
    console.log('[ProfilerService] debugData.entities:', debugData.entities);
    let entities: RemoteEntity[] = [];

    // 尝试从 topEntitiesByComponents 获取实体列表
    if (debugData.entities?.topEntitiesByComponents && Array.isArray(debugData.entities.topEntitiesByComponents)) {
      console.log('[ProfilerService] Found topEntitiesByComponents, length:', debugData.entities.topEntitiesByComponents.length);
      entities = debugData.entities.topEntitiesByComponents.map((e: any) => ({
        id: parseInt(e.id) || 0,
        name: e.name || `Entity ${e.id}`,
        enabled: true, // topEntitiesByComponents doesn't have enabled flag, assume true
        components: [] // componentCount is provided but not component names
      }));
      console.log('[ProfilerService] Parsed entities from topEntitiesByComponents:', entities.length);
    }
    // 尝试从 entities 获取实体列表（旧格式兼容）
    else if (debugData.entities?.entities && Array.isArray(debugData.entities.entities)) {
      console.log('[ProfilerService] Found entities array, length:', debugData.entities.entities.length);
      entities = debugData.entities.entities.map((e: any) => ({
        id: e.id,
        name: e.name || `Entity ${e.id}`,
        enabled: e.enabled !== false,
        components: e.components || []
      }));
      console.log('[ProfilerService] Parsed entities:', entities.length);
    } else {
      console.log('[ProfilerService] No entities array found');
    }

    this.currentData = {
      totalFrameTime,
      systems,
      entityCount,
      componentCount,
      fps,
      entities
    };

    this.notifyListeners(this.currentData);
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
