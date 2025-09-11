/**
 * 传输层接口定义
 */

/**
 * 传输层抽象接口
 */
export interface ITransport {
  /**
   * 启动传输层
   * @param port - 端口号
   * @param host - 主机地址
   */
  start(port: number, host?: string): Promise<void>;

  /**
   * 停止传输层
   */
  stop(): Promise<void>;

  /**
   * 发送数据到指定客户端
   * @param clientId - 客户端ID
   * @param data - 数据
   */
  send(clientId: string, data: ArrayBuffer | string): void;

  /**
   * 广播数据到所有客户端
   * @param data - 数据
   * @param exclude - 排除的客户端ID列表
   */
  broadcast(data: ArrayBuffer | string, exclude?: string[]): void;

  /**
   * 监听客户端连接事件
   * @param handler - 处理函数
   */
  onConnect(handler: (clientInfo: ITransportClientInfo) => void): void;

  /**
   * 监听客户端断开事件
   * @param handler - 处理函数
   */
  onDisconnect(handler: (clientId: string, reason?: string) => void): void;

  /**
   * 监听消息接收事件
   * @param handler - 处理函数
   */
  onMessage(handler: (clientId: string, data: ArrayBuffer | string) => void): void;

  /**
   * 监听错误事件
   * @param handler - 处理函数
   */
  onError(handler: (error: Error) => void): void;

  /**
   * 获取连接的客户端数量
   */
  getClientCount(): number;

  /**
   * 检查客户端是否连接
   * @param clientId - 客户端ID
   */
  isClientConnected(clientId: string): boolean;

  /**
   * 断开指定客户端
   * @param clientId - 客户端ID
   * @param reason - 断开原因
   */
  disconnectClient(clientId: string, reason?: string): void;
}

/**
 * 客户端传输层接口
 */
export interface IClientTransport {
  /**
   * 连接到服务器
   * @param url - 服务器URL
   * @param options - 连接选项
   */
  connect(url: string, options?: IConnectionOptions): Promise<void>;

  /**
   * 断开连接
   * @param reason - 断开原因
   */
  disconnect(reason?: string): Promise<void>;

  /**
   * 发送数据到服务器
   * @param data - 数据
   */
  send(data: ArrayBuffer | string): void;

  /**
   * 监听服务器消息
   * @param handler - 处理函数
   */
  onMessage(handler: (data: ArrayBuffer | string) => void): void;

  /**
   * 监听连接状态变化
   * @param handler - 处理函数
   */
  onConnectionStateChange(handler: (state: ConnectionState) => void): void;

  /**
   * 监听错误事件
   * @param handler - 处理函数
   */
  onError(handler: (error: Error) => void): void;

  /**
   * 获取连接状态
   */
  getConnectionState(): ConnectionState;

  /**
   * 获取连接统计信息
   */
  getStats(): IConnectionStats;
}

/**
 * 传输层客户端信息
 */
export interface ITransportClientInfo {
  /** 客户端ID */
  id: string;
  /** 远程地址 */
  remoteAddress: string;
  /** 连接时间 */
  connectTime: number;
  /** 用户代理 */
  userAgent?: string;
  /** 自定义头信息 */
  headers?: Record<string, string>;
}

/**
 * 连接选项
 */
export interface IConnectionOptions {
  /** 连接超时时间（毫秒） */
  timeout?: number;
  /** 重连间隔（毫秒） */
  reconnectInterval?: number;
  /** 最大重连次数 */
  maxReconnectAttempts?: number;
  /** 是否自动重连 */
  autoReconnect?: boolean;
  /** 自定义头信息 */
  headers?: Record<string, string>;
  /** 协议版本 */
  protocolVersion?: string;
}

/**
 * 连接状态
 */
export enum ConnectionState {
  /** 断开连接 */
  Disconnected = 'disconnected',
  /** 连接中 */
  Connecting = 'connecting',
  /** 已连接 */
  Connected = 'connected',
  /** 重连中 */
  Reconnecting = 'reconnecting',
  /** 连接失败 */
  Failed = 'failed'
}

/**
 * 连接统计信息
 */
export interface IConnectionStats {
  /** 连接状态 */
  state: ConnectionState;
  /** 连接时间 */
  connectTime?: number;
  /** 断开时间 */
  disconnectTime?: number;
  /** 重连次数 */
  reconnectCount: number;
  /** 发送字节数 */
  bytesSent: number;
  /** 接收字节数 */
  bytesReceived: number;
  /** 发送消息数 */
  messagesSent: number;
  /** 接收消息数 */
  messagesReceived: number;
  /** 延迟（毫秒） */
  latency?: number;
}

/**
 * SSL配置
 */
export interface SSLConfig {
  enabled: boolean;
  cert?: string;
  key?: string;
}

/**
 * 传输层配置
 */
export interface ITransportConfig {
  /** 端口号 */
  port: number;
  /** 主机地址 */
  host?: string;
  /** 最大连接数 */
  maxConnections?: number;
  /** 心跳间隔（毫秒） */
  heartbeatInterval?: number;
  /** 连接超时时间（毫秒） */
  connectionTimeout?: number;
  /** 消息最大大小（字节） */
  maxMessageSize?: number;
  /** 是否启用压缩 */
  compression?: boolean;
  /** SSL配置 */
  ssl?: SSLConfig;
}