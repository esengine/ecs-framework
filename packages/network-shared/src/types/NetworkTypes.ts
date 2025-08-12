/**
 * 网络库核心类型定义
 */

// 通用类型定义
export type NetworkValue = string | number | boolean | NetworkValue[] | { [key: string]: NetworkValue };
export type SerializableObject = Record<string, NetworkValue>;
export type Constructor<T = {}> = new (...args: unknown[]) => T;
export type MethodDecorator<T = unknown> = (target: unknown, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void;

// 装饰器目标类型 - 使用更灵活的定义
export interface DecoratorTarget extends Record<string, unknown> {
  constructor: Constructor;
}

// 网络数据类型约束
export interface SerializedData {
  type: string;
  data: Uint8Array;
  checksum?: string;
}

// RPC参数类型
export type RpcParameterType = NetworkValue;
export type RpcReturnType = NetworkValue | void | Promise<NetworkValue | void>;

// 序列化模式接口 - 使用泛型支持特定类型
export interface SerializationSchema<T = NetworkValue> {
  serialize: (obj: T) => Uint8Array;
  deserialize: (data: Uint8Array) => T;
  getSize?: (obj: T) => number;
}

/**
 * 网络端类型
 */
export type NetworkSide = 'client' | 'server' | 'host';

/**
 * 网络连接状态
 */
export type NetworkConnectionState = 
  | 'disconnected'
  | 'connecting' 
  | 'connected'
  | 'disconnecting'
  | 'reconnecting'
  | 'failed';

/**
 * 网络消息类型
 */
export type NetworkMessageType = 
  | 'syncvar'
  | 'client-rpc'
  | 'server-rpc' 
  | 'spawn'
  | 'destroy'
  | 'ownership'
  | 'scene-change'
  | 'snapshot'
  | 'ping'
  | 'custom';

/**
 * 网络配置
 */
export interface NetworkConfig {
  /** 端口号 */
  port: number;
  /** 主机地址 */
  host: string;
  /** 最大连接数 */
  maxConnections: number;
  /** 同步频率 (Hz) */
  syncRate: number;
  /** 快照频率 (Hz) */
  snapshotRate: number;
  /** 是否启用压缩 */
  compression: boolean;
  /** 是否启用加密 */
  encryption: boolean;
  /** 网络超时时间 (ms) */
  timeout: number;
  /** 重连尝试次数 */
  maxReconnectAttempts: number;
  /** 重连间隔 (ms) */
  reconnectInterval: number;
}

/**
 * 网络统计信息
 */
export interface NetworkStats {
  /** 连接数量 */
  connectionCount: number;
  /** 已发送字节数 */
  bytesSent: number;
  /** 已接收字节数 */
  bytesReceived: number;
  /** 已发送消息数 */
  messagesSent: number;
  /** 已接收消息数 */
  messagesReceived: number;
  /** 平均延迟 (ms) */
  averageLatency: number;
  /** 丢包率 (%) */
  packetLoss: number;
  /** 带宽使用率 (bytes/s) */
  bandwidth: number;
}

/**
 * 网络消息基类
 */
export interface NetworkMessage {
  /** 消息类型 */
  type: NetworkMessageType;
  /** 网络对象ID */
  networkId: number;
  /** 消息数据 */
  data: SerializableObject;
  /** 时间戳 */
  timestamp: number;
  /** 消息ID */
  messageId?: string;
  /** 发送者ID */
  senderId?: number;
  /** 接收者ID (可选，用于定向发送) */
  targetId?: number;
  /** 是否可靠传输 */
  reliable?: boolean;
  /** 优先级 */
  priority?: number;
}

/**
 * SyncVar 消息
 */
export interface SyncVarMessage extends NetworkMessage {
  type: 'syncvar';
  /** 组件类型名 */
  componentType: string;
  /** 属性名 */
  propertyName: string;
  /** 属性值 */
  value: NetworkValue;
  /** 变化类型 */
  changeType?: 'set' | 'add' | 'remove' | 'clear';
}

/**
 * RPC 消息
 */
export interface RpcMessage extends NetworkMessage {
  type: 'client-rpc' | 'server-rpc';
  /** 组件类型名 */
  componentType: string;
  /** 方法名 */
  methodName: string;
  /** 参数列表 */
  args: RpcParameterType[];
  /** RPC ID (用于响应) */
  rpcId?: string;
  /** 是否需要响应 */
  requiresResponse?: boolean;
}

/**
 * 对象生成消息
 */
export interface SpawnMessage extends NetworkMessage {
  type: 'spawn';
  /** 预制体名称或ID */
  prefabName: string;
  /** 生成位置 */
  position?: { x: number; y: number; z?: number };
  /** 生成旋转 */
  rotation?: { x: number; y: number; z: number; w: number };
  /** 所有者ID */
  ownerId: number;
  /** 初始数据 */
  initData?: SerializableObject;
}

/**
 * 对象销毁消息
 */
export interface DestroyMessage extends NetworkMessage {
  type: 'destroy';
  /** 销毁原因 */
  reason?: string;
}

/**
 * 所有权转移消息
 */
export interface OwnershipMessage extends NetworkMessage {
  type: 'ownership';
  /** 新所有者ID */
  newOwnerId: number;
  /** 旧所有者ID */
  oldOwnerId: number;
}

/**
 * 快照消息
 */
export interface SnapshotMessage extends NetworkMessage {
  type: 'snapshot';
  /** 快照ID */
  snapshotId: number;
  /** 快照数据 */
  snapshot: SerializableObject;
  /** 包含的网络对象ID列表 */
  networkIds: number[];
}

/**
 * SyncVar 元数据
 */
export interface SyncVarMetadata {
  /** 属性名 */
  propertyName: string;
  /** 是否仅权威端可修改 */
  authorityOnly: boolean;
  /** 变化回调函数名 */
  onChanged?: string;
  /** 序列化类型 */
  serializeType?: string;
  /** 是否使用增量同步 */
  deltaSync?: boolean;
  /** 同步优先级 */
  priority?: number;
}

/**
 * RPC 元数据
 */
export interface RpcMetadata {
  /** 方法名 */
  methodName: string;
  /** RPC 类型 */
  rpcType: 'client-rpc' | 'server-rpc';
  /** 是否需要权限验证 */
  requiresAuth?: boolean;
  /** 是否可靠传输 */
  reliable?: boolean;
  /** 是否需要响应 */
  requiresResponse?: boolean;
}

/**
 * 网络组件元数据
 */
export interface NetworkComponentMetadata {
  /** 组件类型名 */
  componentType: string;
  /** SyncVar 列表 */
  syncVars: SyncVarMetadata[];
  /** RPC 列表 */
  rpcs: RpcMetadata[];
  /** 是否自动生成协议 */
  autoGenerateProtocol?: boolean;
}

/**
 * 网络对象接口
 */
export interface INetworkObject {
  /** 网络ID */
  networkId: number;
  /** 所有者客户端ID */
  ownerId: number;
  /** 是否拥有权威 */
  hasAuthority: boolean;
  /** 是否为本地对象 */
  isLocal: boolean;
  /** 网络组件列表 */
  networkComponents: INetworkComponent[];
}

/**
 * 网络组件接口
 */
export interface INetworkComponent {
  /** 网络对象引用 */
  networkObject: INetworkObject | null;
  /** 网络ID */
  networkId: number;
  /** 是否拥有权威 */
  hasAuthority: boolean;
  /** 组件类型名 */
  componentType: string;
}

/**
 * 网络传输层接口
 */
export interface INetworkTransport {
  /** 启动服务端 */
  startServer(config: NetworkConfig): Promise<void>;
  /** 连接到服务端 */
  connectToServer(host: string, port: number): Promise<void>;
  /** 断开连接 */
  disconnect(): Promise<void>;
  /** 发送消息 */
  sendMessage(message: NetworkMessage, targetId?: number): Promise<void>;
  /** 广播消息 */
  broadcastMessage(message: NetworkMessage, excludeIds?: number[]): Promise<void>;
  /** 设置消息处理器 */
  onMessage(handler: (message: NetworkMessage, fromId?: number) => void): void;
  /** 设置连接事件处理器 */
  onConnection(handler: (clientId: number, isConnected: boolean) => void): void;
}

/**
 * 序列化器接口
 */
export interface INetworkSerializer {
  /** 序列化对象 */
  serialize(obj: NetworkValue, type?: string): Uint8Array;
  /** 反序列化对象 */
  deserialize<T extends NetworkValue = NetworkValue>(data: Uint8Array, type?: string): T;
  /** 注册类型 */
  registerType<T = NetworkValue>(typeName: string, typeSchema: SerializationSchema<T>): void;
  /** 获取序列化后的大小 */
  getSerializedSize(obj: NetworkValue, type?: string): number;
}

/**
 * 网络事件处理器
 */
export interface NetworkEventHandlers {
  /** 连接成功 */
  onConnected?: () => void;
  /** 连接断开 */
  onDisconnected?: (reason?: string) => void;
  /** 客户端连接 */
  onClientConnected?: (clientId: number) => void;
  /** 客户端断开 */
  onClientDisconnected?: (clientId: number, reason?: string) => void;
  /** 网络错误 */
  onError?: (error: Error) => void;
  /** 延迟变化 */
  onLatencyUpdate?: (latency: number) => void;
}

/**
 * 网络调试信息
 */
export interface NetworkDebugInfo {
  /** 连接信息 */
  connections: {
    [clientId: number]: {
      id: number;
      address: string;
      latency: number;
      connected: boolean;
      lastSeen: number;
    };
  };
  /** 网络对象列表 */
  networkObjects: {
    [networkId: number]: {
      id: number;
      ownerId: number;
      componentTypes: string[];
      syncVarCount: number;
      rpcCount: number;
    };
  };
  /** 统计信息 */
  stats: NetworkStats;
}