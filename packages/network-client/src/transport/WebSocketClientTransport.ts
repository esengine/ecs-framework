/**
 * WebSocket 客户端传输实现
 */

import { Core, ITimer } from '@esengine/ecs-framework';
import { 
  ClientTransport, 
  ClientTransportConfig, 
  ConnectionState, 
  ClientMessage 
} from './ClientTransport';

/**
 * WebSocket 客户端配置
 */
export interface WebSocketClientConfig extends ClientTransportConfig {
  /** WebSocket 路径 */
  path?: string;
  /** 协议列表 */
  protocols?: string | string[];
  /** 额外的请求头 */
  headers?: Record<string, string>;
  /** 是否启用二进制消息 */
  binaryType?: 'blob' | 'arraybuffer';
  /** WebSocket 扩展 */
  extensions?: any;
}

/**
 * WebSocket 客户端传输
 */
export class WebSocketClientTransport extends ClientTransport {
  private websocket: WebSocket | null = null;
  private connectionPromise: Promise<void> | null = null;
  private connectionTimeoutTimer: ITimer<any> | null = null;
  
  protected override config: WebSocketClientConfig;

  constructor(config: WebSocketClientConfig) {
    super(config);
    
    this.config = {
      path: '/ws',
      protocols: [],
      headers: {},
      binaryType: 'arraybuffer',
      ...config
    };
  }

  /**
   * 连接到服务器
   */
  async connect(): Promise<void> {
    if (this.state === ConnectionState.CONNECTING || 
        this.state === ConnectionState.CONNECTED) {
      return this.connectionPromise || Promise.resolve();
    }

    this.setState(ConnectionState.CONNECTING);
    this.stopReconnect(); // 停止任何正在进行的重连

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        // 构建WebSocket URL
        const protocol = this.config.secure ? 'wss' : 'ws';
        const url = `${protocol}://${this.config.host}:${this.config.port}${this.config.path}`;

        // 创建WebSocket连接
        this.websocket = new WebSocket(url, this.config.protocols);
        
        if (this.config.binaryType) {
          this.websocket.binaryType = this.config.binaryType;
        }

        // 设置连接超时
        this.connectionTimeoutTimer = Core.schedule(this.config.connectionTimeout! / 1000, false, this, () => {
          if (this.websocket && this.websocket.readyState === WebSocket.CONNECTING) {
            this.websocket.close();
            reject(new Error('Connection timeout'));
          }
        });

        // WebSocket 事件处理
        this.websocket.onopen = () => {
          if (this.connectionTimeoutTimer) {
            this.connectionTimeoutTimer.stop();
            this.connectionTimeoutTimer = null;
          }
          this.setState(ConnectionState.CONNECTED);
          resolve();
        };

        this.websocket.onclose = (event) => {
          if (this.connectionTimeoutTimer) {
            this.connectionTimeoutTimer.stop();
            this.connectionTimeoutTimer = null;
          }
          this.handleClose(event.code, event.reason);
          
          if (this.state === ConnectionState.CONNECTING) {
            reject(new Error(`Connection failed: ${event.reason || 'Unknown error'}`));
          }
        };

        this.websocket.onerror = (event) => {
          if (this.connectionTimeoutTimer) {
            this.connectionTimeoutTimer.stop();
            this.connectionTimeoutTimer = null;
          }
          const error = new Error('WebSocket error');
          this.handleError(error);
          
          if (this.state === ConnectionState.CONNECTING) {
            reject(error);
          }
        };

        this.websocket.onmessage = (event) => {
          this.handleWebSocketMessage(event);
        };

      } catch (error) {
        this.setState(ConnectionState.ERROR);
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    this.stopReconnect();
    
    if (this.websocket) {
      // 设置状态为断开连接，避免触发重连
      this.setState(ConnectionState.DISCONNECTED);
      
      if (this.websocket.readyState === WebSocket.OPEN || 
          this.websocket.readyState === WebSocket.CONNECTING) {
        this.websocket.close(1000, 'Client disconnect');
      }
      
      this.websocket = null;
    }

    this.connectionPromise = null;
  }

  /**
   * 发送消息
   */
  async sendMessage(message: ClientMessage): Promise<boolean> {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      // 如果未连接，将消息加入队列
      if (this.state === ConnectionState.CONNECTING || 
          this.state === ConnectionState.RECONNECTING) {
        return this.queueMessage(message);
      }
      return false;
    }

    try {
      // 序列化消息
      const serialized = JSON.stringify({
        ...message,
        timestamp: message.timestamp || Date.now()
      });

      // 发送消息
      this.websocket.send(serialized);
      this.updateSendStats(message);
      
      return true;

    } catch (error) {
      this.handleError(error as Error);
      return false;
    }
  }

  /**
   * 处理 WebSocket 消息
   */
  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      let data: string;
      
      if (event.data instanceof ArrayBuffer) {
        // 处理二进制数据
        data = new TextDecoder().decode(event.data);
      } else if (event.data instanceof Blob) {
        // Blob 需要异步处理
        event.data.text().then(text => {
          this.processMessage(text);
        });
        return;
      } else {
        // 字符串数据
        data = event.data;
      }

      this.processMessage(data);

    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }

  /**
   * 处理消息内容
   */
  private processMessage(data: string): void {
    try {
      const message: ClientMessage = JSON.parse(data);
      this.handleMessage(message);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }

  /**
   * 处理连接关闭
   */
  private handleClose(code: number, reason: string): void {
    this.websocket = null;
    this.connectionPromise = null;

    const wasConnected = this.isConnected();
    
    // 根据关闭代码决定是否重连
    if (code === 1000) {
      // 正常关闭，不重连
      this.setState(ConnectionState.DISCONNECTED);
      this.emit('disconnected', reason || 'Normal closure');
    } else if (wasConnected && this.reconnectAttempts < this.config.maxReconnectAttempts!) {
      // 异常关闭，尝试重连
      this.emit('disconnected', reason || `Abnormal closure (${code})`);
      this.startReconnect();
    } else {
      // 达到最大重连次数或其他情况
      this.setState(ConnectionState.DISCONNECTED);
      this.emit('disconnected', reason || `Connection lost (${code})`);
    }
  }

  /**
   * 获取 WebSocket 就绪状态
   */
  getReadyState(): number {
    return this.websocket?.readyState ?? WebSocket.CLOSED;
  }

  /**
   * 获取 WebSocket 实例
   */
  getWebSocket(): WebSocket | null {
    return this.websocket;
  }

  /**
   * 检查是否支持 WebSocket
   */
  static isSupported(): boolean {
    return typeof WebSocket !== 'undefined';
  }

  /**
   * 销毁传输层
   */
  override destroy(): void {
    if (this.connectionTimeoutTimer) {
      this.connectionTimeoutTimer.stop();
      this.connectionTimeoutTimer = null;
    }
    this.disconnect();
    super.destroy();
  }
}