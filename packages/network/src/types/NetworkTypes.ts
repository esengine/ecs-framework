/**
 * 网络库核心类型定义
 */


/**
 * 网络连接状态
 */
export type NetworkConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

/**
 * 网络端类型
 */
export type NetworkSide = 'client' | 'server' | 'host';

/**
 * 网络消息类型
 */
export interface NetworkMessage {
  /** 消息类型 */
  type: string;
  /** 网络对象ID */
  networkId: number;
  /** 消息数据 */
  data: any;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 同步变量消息
 */
export interface SyncVarMessage extends NetworkMessage {
  type: 'syncvar';
  /** 组件类型名 */
  componentType: string;
  /** 属性名 */
  propertyName: string;
  /** 属性值 */
  value: any;
}

/**
 * RPC消息
 */
export interface RpcMessage extends NetworkMessage {
  type: 'rpc';
  /** RPC方法名 */
  methodName: string;
  /** RPC参数 */
  args: any[];
  /** 是否为客户端RPC */
  isClientRpc: boolean;
}

/**
 * 网络配置选项
 */
export interface NetworkConfig {
  /** 服务器端口 */
  port?: number;
  /** 服务器地址 */
  host?: string;
  /** 房间ID */
  roomId?: string;
  /** 最大连接数 */
  maxConnections?: number;
  /** 同步频率 (Hz) */
  syncRate?: number;
  /** 是否启用压缩 */
  compression?: boolean;
}

/**
 * 网络统计信息
 */
export interface NetworkStats {
  /** 连接数 */
  connectionCount: number;
  /** 发送的字节数 */
  bytesSent: number;
  /** 接收的字节数 */
  bytesReceived: number;
  /** 发送的消息数 */
  messagesSent: number;
  /** 接收的消息数 */
  messagesReceived: number;
  /** 平均延迟 (ms) */
  averageLatency: number;
}

/**
 * 网络事件处理器
 */
export interface NetworkEventHandlers {
  /** 连接建立 */
  onConnected: () => void;
  /** 连接断开 */
  onDisconnected: (reason?: string) => void;
  /** 客户端加入 */
  onClientConnected: (clientId: number) => void;
  /** 客户端离开 */
  onClientDisconnected: (clientId: number, reason?: string) => void;
  /** 发生错误 */
  onError: (error: Error) => void;
}

/**
 * 网络行为接口
 * 所有网络组件都需要实现此接口
 */
export interface INetworkBehaviour {
  /** 网络身份组件引用 */
  networkIdentity: any | null;
  /** 是否拥有权威 */
  hasAuthority: boolean;
  /** 是否为本地玩家 */
  isLocalPlayer: boolean;
  /** 是否在服务端 */
  isServer: boolean;
  /** 是否在客户端 */
  isClient: boolean;
}

/**
 * 同步变量元数据
 */
export interface SyncVarMetadata {
  /** 属性名 */
  propertyName: string;
  /** 是否仅权威端可修改 */
  authorityOnly: boolean;
  /** 变化回调函数名 */
  onChanged?: string;
}

/**
 * RPC元数据
 */
export interface RpcMetadata {
  /** 方法名 */
  methodName: string;
  /** 是否为客户端RPC */
  isClientRpc: boolean;
  /** 是否需要权威验证 */
  requiresAuthority: boolean;
}


/**
 * 网络连接信息
 */
export interface NetworkConnection {
  /** 连接ID */
  id: number;
  /** 连接状态 */
  state: NetworkConnectionState;
  /** 延迟 (ms) */
  latency: number;
  /** 最后活跃时间 */
  lastActivity: number;
}