/**
 * 客户端传输层抽象接口
 */

import { Emitter, ITimer, Core } from '@esengine/ecs-framework';
import { NetworkValue } from '@esengine/ecs-framework-network-shared';

/**
 * 客户端传输配置
 */
export interface ClientTransportConfig {
  /** 服务器地址 */
  host: string;
  /** 服务器端口 */
  port: number;
  /** 是否使用安全连接 */
  secure?: boolean;
  /** 连接超时时间(毫秒) */
  connectionTimeout?: number;
  /** 重连间隔(毫秒) */
  reconnectInterval?: number;
  /** 最大重连次数 */
  maxReconnectAttempts?: number;
  /** 心跳间隔(毫秒) */
  heartbeatInterval?: number;
  /** 消息队列最大大小 */
  maxQueueSize?: number;
}

/**
 * 连接状态
 */
export enum ConnectionState {
  /** 断开连接 */
  DISCONNECTED = 'disconnected',
  /** 连接中 */
  CONNECTING = 'connecting',
  /** 已连接 */
  CONNECTED = 'connected',
  /** 认证中 */
  AUTHENTICATING = 'authenticating',
  /** 已认证 */
  AUTHENTICATED = 'authenticated',
  /** 重连中 */
  RECONNECTING = 'reconnecting',
  /** 连接错误 */
  ERROR = 'error'
}

/**
 * 客户端消息
 */
export interface ClientMessage {
  /** 消息类型 */
  type: 'rpc' | 'syncvar' | 'system' | 'custom';
  /** 消息数据 */
  data: NetworkValue;
  /** 消息ID（用于响应匹配） */
  messageId?: string;
  /** 是否可靠传输 */
  reliable?: boolean;
  /** 时间戳 */
  timestamp?: number;
}

/**
 * 连接统计信息
 */
export interface ConnectionStats {
  /** 连接时间 */
  connectedAt: Date | null;
  /** 连接持续时间(毫秒) */
  connectionDuration: number;
  /** 发送消息数 */
  messagesSent: number;
  /** 接收消息数 */
  messagesReceived: number;
  /** 发送字节数 */
  bytesSent: number;
  /** 接收字节数 */
  bytesReceived: number;
  /** 重连次数 */
  reconnectCount: number;
  /** 丢失消息数 */
  messagesLost: number;
  /** 平均延迟(毫秒) */
  averageLatency: number;
}

/**
 * 客户端传输事件
 */
export interface ClientTransportEvents {
  /** 连接建立 */
  'connected': () => void;
  /** 连接断开 */
  'disconnected': (reason: string) => void;
  /** 连接状态变化 */
  'state-changed': (oldState: ConnectionState, newState: ConnectionState) => void;
  /** 收到消息 */
  'message': (message: ClientMessage) => void;
  /** 连接错误 */
  'error': (error: Error) => void;
  /** 重连开始 */
  'reconnecting': (attempt: number, maxAttempts: number) => void;
  /** 重连成功 */
  'reconnected': () => void;
  /** 重连失败 */
  'reconnect-failed': () => void;
  /** 延迟更新 */
  'latency-updated': (latency: number) => void;
}

/**
 * 客户端传输层抽象类
 */
export abstract class ClientTransport {
  protected config: ClientTransportConfig;
  protected state: ConnectionState = ConnectionState.DISCONNECTED;
  protected stats: ConnectionStats;
  protected messageQueue: ClientMessage[] = [];
  protected reconnectAttempts = 0;
  protected reconnectTimer: ITimer<any> | null = null;
  protected heartbeatTimer: ITimer<any> | null = null;
  private latencyMeasurements: number[] = [];
  private eventEmitter: Emitter<keyof ClientTransportEvents, any>;

  constructor(config: ClientTransportConfig) {
    this.eventEmitter = new Emitter<keyof ClientTransportEvents, any>();
    
    this.config = {
      secure: false,
      connectionTimeout: 10000, // 10秒
      reconnectInterval: 3000,   // 3秒
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,  // 30秒
      maxQueueSize: 1000,
      ...config
    };

    this.stats = {
      connectedAt: null,
      connectionDuration: 0,
      messagesSent: 0,
      messagesReceived: 0,
      bytesSent: 0,
      bytesReceived: 0,
      reconnectCount: 0,
      messagesLost: 0,
      averageLatency: 0
    };
  }

  /**
   * 连接到服务器
   */
  abstract connect(): Promise<void>;

  /**
   * 断开连接
   */
  abstract disconnect(): Promise<void>;

  /**
   * 发送消息
   */
  abstract sendMessage(message: ClientMessage): Promise<boolean>;

  /**
   * 获取当前连接状态
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.state === ConnectionState.CONNECTED || 
           this.state === ConnectionState.AUTHENTICATED;
  }

  /**
   * 获取连接统计信息
   */
  getStats(): ConnectionStats {
    if (this.stats.connectedAt) {
      this.stats.connectionDuration = Date.now() - this.stats.connectedAt.getTime();
    }
    return { ...this.stats };
  }

  /**
   * 获取配置
   */
  getConfig(): Readonly<ClientTransportConfig> {
    return this.config;
  }

  /**
   * 设置状态
   */
  protected setState(newState: ConnectionState): void {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      this.eventEmitter.emit('state-changed', oldState, newState);
      
      // 特殊状态处理
      if (newState === ConnectionState.CONNECTED) {
        this.stats.connectedAt = new Date();
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.processMessageQueue();
        this.eventEmitter.emit('connected');
        
        if (oldState === ConnectionState.RECONNECTING) {
          this.eventEmitter.emit('reconnected');
        }
      } else if (newState === ConnectionState.DISCONNECTED) {
        this.stats.connectedAt = null;
        this.stopHeartbeat();
      }
    }
  }

  /**
   * 处理接收到的消息
   */
  protected handleMessage(message: ClientMessage): void {
    this.stats.messagesReceived++;
    
    if (message.data) {
      try {
        const messageSize = JSON.stringify(message.data).length;
        this.stats.bytesReceived += messageSize;
      } catch (error) {
        // 忽略序列化错误
      }
    }

    // 处理系统消息
    if (message.type === 'system') {
      this.handleSystemMessage(message);
      return;
    }

    this.eventEmitter.emit('message', message);
  }

  /**
   * 处理系统消息
   */
  protected handleSystemMessage(message: ClientMessage): void {
    const data = message.data as any;
    
    switch (data.action) {
      case 'ping':
        // 响应ping
        this.sendMessage({
          type: 'system',
          data: { action: 'pong', timestamp: data.timestamp }
        });
        break;
        
      case 'pong':
        // 计算延迟
        if (data.timestamp) {
          const latency = Date.now() - data.timestamp;
          this.updateLatency(latency);
        }
        break;
    }
  }

  /**
   * 处理连接错误
   */
  protected handleError(error: Error): void {
    console.error('Transport error:', error.message);
    this.eventEmitter.emit('error', error);
    
    if (this.isConnected()) {
      this.setState(ConnectionState.ERROR);
      this.startReconnect();
    }
  }

  /**
   * 开始重连
   */
  protected startReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
      this.eventEmitter.emit('reconnect-failed');
      return;
    }

    this.setState(ConnectionState.RECONNECTING);
    this.reconnectAttempts++;
    this.stats.reconnectCount++;

    this.eventEmitter.emit('reconnecting', this.reconnectAttempts, this.config.maxReconnectAttempts!);

    this.reconnectTimer = Core.schedule(this.config.reconnectInterval! / 1000, false, this, async () => {
      try {
        await this.connect();
      } catch (error) {
        this.startReconnect(); // 继续重连
      }
    });
  }

  /**
   * 停止重连
   */
  protected stopReconnect(): void {
    if (this.reconnectTimer) {
      this.reconnectTimer.stop();
      this.reconnectTimer = null;
    }
  }

  /**
   * 将消息加入队列
   */
  protected queueMessage(message: ClientMessage): boolean {
    if (this.messageQueue.length >= this.config.maxQueueSize!) {
      this.stats.messagesLost++;
      return false;
    }

    this.messageQueue.push(message);
    return true;
  }

  /**
   * 处理消息队列
   */
  protected async processMessageQueue(): Promise<void> {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift()!;
      await this.sendMessage(message);
    }
  }

  /**
   * 开始心跳
   */
  protected startHeartbeat(): void {
    if (this.config.heartbeatInterval && this.config.heartbeatInterval > 0) {
      this.heartbeatTimer = Core.schedule(this.config.heartbeatInterval / 1000, true, this, () => {
        this.sendHeartbeat();
      });
    }
  }

  /**
   * 停止心跳
   */
  protected stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      this.heartbeatTimer.stop();
      this.heartbeatTimer = null;
    }
  }

  /**
   * 发送心跳
   */
  protected sendHeartbeat(): void {
    this.sendMessage({
      type: 'system',
      data: { action: 'ping', timestamp: Date.now() }
    }).catch(() => {
      // 心跳发送失败，可能连接有问题
    });
  }

  /**
   * 更新延迟统计
   */
  protected updateLatency(latency: number): void {
    this.latencyMeasurements.push(latency);
    
    // 只保留最近的10个测量值
    if (this.latencyMeasurements.length > 10) {
      this.latencyMeasurements.shift();
    }

    // 计算平均延迟
    const sum = this.latencyMeasurements.reduce((a, b) => a + b, 0);
    this.stats.averageLatency = sum / this.latencyMeasurements.length;
    
    this.eventEmitter.emit('latency-updated', latency);
  }

  /**
   * 更新发送统计
   */
  protected updateSendStats(message: ClientMessage): void {
    this.stats.messagesSent++;
    
    if (message.data) {
      try {
        const messageSize = JSON.stringify(message.data).length;
        this.stats.bytesSent += messageSize;
      } catch (error) {
        // 忽略序列化错误
      }
    }
  }

  /**
   * 销毁传输层
   */
  destroy(): void {
    this.stopReconnect();
    this.stopHeartbeat();
    this.messageQueue = [];
  }

  /**
   * 类型安全的事件监听
   */
  on<K extends keyof ClientTransportEvents>(event: K, listener: ClientTransportEvents[K]): this {
    this.eventEmitter.addObserver(event, listener, this);
    return this;
  }

  /**
   * 移除事件监听
   */
  off<K extends keyof ClientTransportEvents>(event: K, listener: ClientTransportEvents[K]): this {
    this.eventEmitter.removeObserver(event, listener);
    return this;
  }

  /**
   * 类型安全的事件触发
   */
  emit<K extends keyof ClientTransportEvents>(event: K, ...args: Parameters<ClientTransportEvents[K]>): void {
    this.eventEmitter.emit(event, ...args);
  }
}