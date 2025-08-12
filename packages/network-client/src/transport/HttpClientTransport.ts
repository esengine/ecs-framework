/**
 * HTTP 客户端传输实现
 * 
 * 支持 REST API 和长轮询
 */

import { Core, ITimer } from '@esengine/ecs-framework';
import { 
  ClientTransport, 
  ClientTransportConfig, 
  ConnectionState, 
  ClientMessage 
} from './ClientTransport';

/**
 * HTTP 客户端配置
 */
export interface HttpClientConfig extends ClientTransportConfig {
  /** API 路径前缀 */
  apiPrefix?: string;
  /** 请求超时时间(毫秒) */
  requestTimeout?: number;
  /** 长轮询超时时间(毫秒) */
  longPollTimeout?: number;
  /** 是否启用长轮询 */
  enableLongPolling?: boolean;
  /** 额外的请求头 */
  headers?: Record<string, string>;
  /** 认证令牌 */
  authToken?: string;
}

/**
 * HTTP 响应接口
 */
interface HttpResponse {
  success: boolean;
  data?: any;
  error?: string;
  messages?: ClientMessage[];
}

/**
 * HTTP 客户端传输
 */
export class HttpClientTransport extends ClientTransport {
  private connectionId: string | null = null;
  private longPollController: AbortController | null = null;
  private longPollRunning = false;
  private connectPromise: Promise<void> | null = null;
  private requestTimers: Set<ITimer<any>> = new Set();
  
  protected override config: HttpClientConfig;

  constructor(config: HttpClientConfig) {
    super(config);
    
    this.config = {
      apiPrefix: '/api',
      requestTimeout: 30000, // 30秒
      longPollTimeout: 25000, // 25秒
      enableLongPolling: true,
      headers: {
        'Content-Type': 'application/json'
      },
      ...config
    };
  }

  /**
   * 连接到服务器
   */
  async connect(): Promise<void> {
    if (this.state === ConnectionState.CONNECTING || 
        this.state === ConnectionState.CONNECTED) {
      return this.connectPromise || Promise.resolve();
    }

    this.setState(ConnectionState.CONNECTING);
    this.stopReconnect();

    this.connectPromise = this.performConnect();
    return this.connectPromise;
  }

  /**
   * 执行连接
   */
  private async performConnect(): Promise<void> {
    try {
      // 发送连接请求
      const response = await this.makeRequest('/connect', 'POST', {});
      
      if (response.success && response.data.connectionId) {
        this.connectionId = response.data.connectionId;
        this.setState(ConnectionState.CONNECTED);
        
        // 启动长轮询
        if (this.config.enableLongPolling) {
          this.startLongPolling();
        }
      } else {
        throw new Error(response.error || 'Connection failed');
      }
    } catch (error) {
      this.setState(ConnectionState.ERROR);
      throw error;
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    this.stopReconnect();
    this.stopLongPolling();

    if (this.connectionId) {
      try {
        await this.makeRequest('/disconnect', 'POST', {
          connectionId: this.connectionId
        });
      } catch (error) {
        // 忽略断开连接时的错误
      }
      
      this.connectionId = null;
    }

    this.setState(ConnectionState.DISCONNECTED);
    this.connectPromise = null;
  }

  /**
   * 发送消息
   */
  async sendMessage(message: ClientMessage): Promise<boolean> {
    if (!this.connectionId) {
      // 如果未连接，将消息加入队列
      if (this.state === ConnectionState.CONNECTING || 
          this.state === ConnectionState.RECONNECTING) {
        return this.queueMessage(message);
      }
      return false;
    }

    try {
      const response = await this.makeRequest('/send', 'POST', {
        connectionId: this.connectionId,
        message: {
          ...message,
          timestamp: message.timestamp || Date.now()
        }
      });

      if (response.success) {
        this.updateSendStats(message);
        return true;
      } else {
        console.error('Send message failed:', response.error);
        return false;
      }

    } catch (error) {
      this.handleError(error as Error);
      return false;
    }
  }

  /**
   * 启动长轮询
   */
  private startLongPolling(): void {
    if (this.longPollRunning || !this.connectionId) {
      return;
    }

    this.longPollRunning = true;
    this.performLongPoll();
  }

  /**
   * 停止长轮询
   */
  private stopLongPolling(): void {
    this.longPollRunning = false;
    
    if (this.longPollController) {
      this.longPollController.abort();
      this.longPollController = null;
    }
  }

  /**
   * 执行长轮询
   */
  private async performLongPoll(): Promise<void> {
    while (this.longPollRunning && this.connectionId) {
      try {
        this.longPollController = new AbortController();
        
        const response = await this.makeRequest('/poll', 'GET', {
          connectionId: this.connectionId
        }, {
          signal: this.longPollController.signal,
          timeout: this.config.longPollTimeout
        });

        if (response.success && response.messages && response.messages.length > 0) {
          // 处理接收到的消息
          for (const message of response.messages) {
            this.handleMessage(message);
          }
        }

        // 如果服务器指示断开连接
        if (response.data && response.data.disconnected) {
          this.handleServerDisconnect();
          break;
        }

      } catch (error) {
        if ((error as any).name === 'AbortError') {
          // 被主动取消，正常情况
          break;
        }

        console.warn('Long polling error:', (error as Error).message);
        
        // 如果是网络错误，尝试重连
        if (this.isNetworkError(error as Error)) {
          this.handleError(error as Error);
          break;
        }

        // 短暂等待后重试
        await this.delay(1000);
      }

      this.longPollController = null;
    }
  }

  /**
   * 处理服务器主动断开连接
   */
  private handleServerDisconnect(): void {
    this.connectionId = null;
    this.stopLongPolling();
    this.emit('disconnected', 'Server disconnect');
    
    if (this.reconnectAttempts < this.config.maxReconnectAttempts!) {
      this.startReconnect();
    } else {
      this.setState(ConnectionState.DISCONNECTED);
    }
  }

  /**
   * 发送 HTTP 请求
   */
  private async makeRequest(
    path: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    options: {
      signal?: AbortSignal;
      timeout?: number;
    } = {}
  ): Promise<HttpResponse> {
    const url = this.buildUrl(path);
    const headers = this.buildHeaders();
    
    const requestOptions: RequestInit = {
      method,
      headers,
      signal: options.signal
    };

    // 添加请求体
    if (method !== 'GET' && data) {
      requestOptions.body = JSON.stringify(data);
    } else if (method === 'GET' && data) {
      // GET 请求将数据作为查询参数
      const params = new URLSearchParams();
      Object.entries(data).forEach(([key, value]) => {
        params.append(key, String(value));
      });
      const separator = url.includes('?') ? '&' : '?';
      return this.fetchWithTimeout(`${url}${separator}${params}`, requestOptions, options.timeout);
    }

    return this.fetchWithTimeout(url, requestOptions, options.timeout);
  }

  /**
   * 带超时的 fetch 请求
   */
  private async fetchWithTimeout(
    url: string, 
    options: RequestInit, 
    timeout?: number
  ): Promise<HttpResponse> {
    const actualTimeout = timeout || this.config.requestTimeout!;
    
    const controller = new AbortController();
    let timeoutTimer: ITimer<any> | null = null;
    
    // 创建超时定时器
    timeoutTimer = Core.schedule(actualTimeout / 1000, false, this, () => {
      controller.abort();
      if (timeoutTimer) {
        this.requestTimers.delete(timeoutTimer);
      }
    });
    
    this.requestTimers.add(timeoutTimer);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: options.signal || controller.signal
      });

      // 清理定时器
      if (timeoutTimer) {
        timeoutTimer.stop();
        this.requestTimers.delete(timeoutTimer);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result as HttpResponse;

    } catch (error) {
      // 清理定时器
      if (timeoutTimer) {
        timeoutTimer.stop();
        this.requestTimers.delete(timeoutTimer);
      }
      throw error;
    }
  }

  /**
   * 构建请求URL
   */
  private buildUrl(path: string): string {
    const protocol = this.config.secure ? 'https' : 'http';
    const basePath = this.config.apiPrefix || '';
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    return `${protocol}://${this.config.host}:${this.config.port}${basePath}${cleanPath}`;
  }

  /**
   * 构建请求头
   */
  private buildHeaders(): Record<string, string> {
    const headers = { ...this.config.headers };
    
    if (this.config.authToken) {
      headers['Authorization'] = `Bearer ${this.config.authToken}`;
    }

    return headers;
  }

  /**
   * 检查是否为网络错误
   */
  private isNetworkError(error: Error): boolean {
    return error.message.includes('fetch') || 
           error.message.includes('network') ||
           error.message.includes('timeout') ||
           error.name === 'TypeError';
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      const timer = Core.schedule(ms / 1000, false, this, () => {
        this.requestTimers.delete(timer);
        resolve();
      });
      this.requestTimers.add(timer);
    });
  }

  /**
   * 设置认证令牌
   */
  setAuthToken(token: string): void {
    this.config.authToken = token;
  }

  /**
   * 获取连接ID
   */
  getConnectionId(): string | null {
    return this.connectionId;
  }

  /**
   * 检查是否支持 Fetch API
   */
  static isSupported(): boolean {
    return typeof fetch !== 'undefined';
  }

  /**
   * 销毁传输层
   */
  override destroy(): void {
    // 清理所有请求定时器
    this.requestTimers.forEach(timer => timer.stop());
    this.requestTimers.clear();
    
    this.disconnect();
    super.destroy();
  }
}