/**
 * 网络传输层抽象接口
 */

import { EventEmitter } from 'events';
import { NetworkMessage, NetworkValue } from '@esengine/ecs-framework-network-shared';

/**
 * 传输层配置
 */
export interface TransportConfig {
  /** 服务器端口 */
  port: number;
  /** 主机地址 */
  host?: string;
  /** 最大连接数 */
  maxConnections?: number;
  /** 心跳间隔(毫秒) */
  heartbeatInterval?: number;
  /** 连接超时(毫秒) */
  connectionTimeout?: number;
}

/**
 * 客户端连接信息
 */
export interface ClientConnectionInfo {
  /** 连接ID */
  id: string;
  /** 客户端IP */
  remoteAddress?: string;
  /** 连接时间 */
  connectedAt: Date;
  /** 最后活跃时间 */
  lastActivity: Date;
  /** 用户数据 */
  userData?: Record<string, NetworkValue>;
}

/**
 * 网络消息包装
 */
export interface TransportMessage {
  /** 消息类型 */
  type: 'rpc' | 'syncvar' | 'system' | 'custom';
  /** 消息数据 */
  data: NetworkValue;
  /** 发送者ID */
  senderId?: string;
  /** 目标客户端ID(可选，用于单播) */
  targetId?: string;
  /** 是否可靠传输 */
  reliable?: boolean;
}

/**
 * 网络传输层事件
 */
export interface TransportEvents {
  /** 客户端连接 */
  'client-connected': (connectionInfo: ClientConnectionInfo) => void;
  /** 客户端断开连接 */
  'client-disconnected': (connectionId: string, reason?: string) => void;
  /** 收到消息 */
  'message': (connectionId: string, message: TransportMessage) => void;
  /** 传输错误 */
  'error': (error: Error, connectionId?: string) => void;
  /** 服务器启动 */
  'server-started': (config: TransportConfig) => void;
  /** 服务器关闭 */
  'server-stopped': () => void;
}

/**
 * 网络传输层抽象类
 */
export abstract class Transport extends EventEmitter {
  protected config: TransportConfig;
  protected isRunning = false;
  protected connections = new Map<string, ClientConnectionInfo>();

  constructor(config: TransportConfig) {
    super();
    this.config = config;
  }

  /**
   * 启动传输层服务
   */
  abstract start(): Promise<void>;

  /**
   * 停止传输层服务
   */
  abstract stop(): Promise<void>;

  /**
   * 发送消息给指定客户端
   */
  abstract sendToClient(connectionId: string, message: TransportMessage): Promise<boolean>;

  /**
   * 广播消息给所有客户端
   */
  abstract broadcast(message: TransportMessage, excludeId?: string): Promise<number>;

  /**
   * 广播消息给指定客户端列表
   */
  abstract sendToClients(connectionIds: string[], message: TransportMessage): Promise<number>;

  /**
   * 断开指定客户端连接
   */
  abstract disconnectClient(connectionId: string, reason?: string): Promise<void>;

  /**
   * 获取在线客户端数量
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * 获取所有连接信息
   */
  getConnections(): ClientConnectionInfo[] {
    return Array.from(this.connections.values());
  }

  /**
   * 获取指定连接信息
   */
  getConnection(connectionId: string): ClientConnectionInfo | undefined {
    return this.connections.get(connectionId);
  }

  /**
   * 检查连接是否存在
   */
  hasConnection(connectionId: string): boolean {
    return this.connections.has(connectionId);
  }

  /**
   * 服务器是否正在运行
   */
  isServerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * 获取传输层配置
   */
  getConfig(): TransportConfig {
    return { ...this.config };
  }

  /**
   * 更新客户端最后活跃时间
   */
  protected updateClientActivity(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.lastActivity = new Date();
    }
  }

  /**
   * 添加客户端连接
   */
  protected addConnection(connectionInfo: ClientConnectionInfo): void {
    this.connections.set(connectionInfo.id, connectionInfo);
    this.emit('client-connected', connectionInfo);
  }

  /**
   * 移除客户端连接
   */
  protected removeConnection(connectionId: string, reason?: string): void {
    if (this.connections.delete(connectionId)) {
      this.emit('client-disconnected', connectionId, reason);
    }
  }

  /**
   * 处理接收到的消息
   */
  protected handleMessage(connectionId: string, message: TransportMessage): void {
    this.updateClientActivity(connectionId);
    this.emit('message', connectionId, message);
  }

  /**
   * 处理传输错误
   */
  protected handleError(error: Error, connectionId?: string): void {
    this.emit('error', error, connectionId);
  }

  /**
   * 清理所有连接
   */
  protected clearConnections(): void {
    const connectionIds = Array.from(this.connections.keys());
    for (const id of connectionIds) {
      this.removeConnection(id, 'server-shutdown');
    }
  }

  /**
   * 类型安全的事件监听
   */
  override on<K extends keyof TransportEvents>(event: K, listener: TransportEvents[K]): this {
    return super.on(event, listener);
  }

  /**
   * 类型安全的事件触发
   */
  override emit<K extends keyof TransportEvents>(event: K, ...args: Parameters<TransportEvents[K]>): boolean {
    return super.emit(event, ...args);
  }
}