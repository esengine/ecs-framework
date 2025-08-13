/**
 * 网络层核心类型定义
 */

/**
 * 网络消息类型枚举
 */
export enum MessageType {
  // 连接管理
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  HEARTBEAT = 'heartbeat',
  
  // 数据同步
  SYNC_VAR = 'sync_var',
  SYNC_BATCH = 'sync_batch',
  SYNC_SNAPSHOT = 'sync_snapshot',
  
  // RPC调用
  RPC_CALL = 'rpc_call',
  RPC_RESPONSE = 'rpc_response',
  
  // 实体管理
  ENTITY_CREATE = 'entity_create',
  ENTITY_DESTROY = 'entity_destroy',
  ENTITY_UPDATE = 'entity_update',
  
  // 房间管理
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  ROOM_STATE = 'room_state',
  
  // 游戏事件
  GAME_EVENT = 'game_event',
  
  // 系统消息
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

/**
 * 网络消息基础接口
 */
export interface INetworkMessage {
  /** 消息类型 */
  type: MessageType;
  /** 消息唯一ID */
  messageId: string;
  /** 时间戳 */
  timestamp: number;
  /** 发送者ID */
  senderId: string;
  /** 消息数据 */
  data: any;
  /** 是否可靠传输 */
  reliable?: boolean;
  /** 消息优先级 */
  priority?: number;
}

/**
 * 同步权限类型
 */
export enum AuthorityType {
  /** 服务端权限 */
  Server = 'server',
  /** 客户端权限 */
  Client = 'client',
  /** 共享权限 */
  Shared = 'shared'
}

/**
 * 网络作用域
 */
export enum NetworkScope {
  /** 全局可见 */
  Global = 'global',
  /** 房间内可见 */
  Room = 'room',
  /** 仅拥有者可见 */
  Owner = 'owner',
  /** 附近玩家可见 */
  Nearby = 'nearby',
  /** 自定义作用域 */
  Custom = 'custom'
}

/**
 * 同步模式
 */
export enum SyncMode {
  /** 同步给所有客户端 */
  All = 'all',
  /** 只同步给拥有者 */
  Owner = 'owner',
  /** 同步给除拥有者外的客户端 */
  Others = 'others',
  /** 同步给附近的客户端 */
  Nearby = 'nearby',
  /** 自定义同步逻辑 */
  Custom = 'custom'
}

/**
 * RPC目标
 */
export enum RpcTarget {
  /** 服务端 */
  Server = 'server',
  /** 客户端 */
  Client = 'client',
  /** 所有客户端 */
  All = 'all',
  /** 除发送者外的客户端 */
  Others = 'others',
  /** 拥有者客户端 */
  Owner = 'owner',
  /** 附近的客户端 */
  Nearby = 'nearby'
}

/**
 * 客户端信息
 */
export interface IClientInfo {
  /** 客户端ID */
  id: string;
  /** 客户端名称 */
  name: string;
  /** 加入时间 */
  joinTime: number;
  /** 是否已认证 */
  authenticated: boolean;
  /** 延迟（毫秒） */
  latency?: number;
  /** 自定义数据 */
  userData?: Record<string, any>;
}

/**
 * 房间信息
 */
export interface IRoomInfo {
  /** 房间ID */
  id: string;
  /** 房间名称 */
  name: string;
  /** 当前玩家数量 */
  playerCount: number;
  /** 最大玩家数量 */
  maxPlayers: number;
  /** 房间状态 */
  state: RoomState;
  /** 自定义数据 */
  metadata?: Record<string, any>;
}

/**
 * 房间状态
 */
export enum RoomState {
  /** 等待中 */
  Waiting = 'waiting',
  /** 游戏中 */
  Playing = 'playing',
  /** 已暂停 */
  Paused = 'paused',
  /** 已结束 */
  Finished = 'finished'
}

/**
 * 网络统计信息
 */
export interface INetworkStats {
  /** 总发送字节数 */
  bytesSent: number;
  /** 总接收字节数 */
  bytesReceived: number;
  /** 发送消息数 */
  messagesSent: number;
  /** 接收消息数 */
  messagesReceived: number;
  /** 平均延迟 */
  averageLatency: number;
  /** 丢包率 */
  packetLoss: number;
  /** 连接时长 */
  connectionTime: number;
}

/**
 * 向量2D
 */
export interface IVector2 {
  x: number;
  y: number;
}

/**
 * 向量3D
 */
export interface IVector3 extends IVector2 {
  z: number;
}

/**
 * 四元数
 */
export interface IQuaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

/**
 * 变换信息
 */
export interface ITransform {
  position: IVector3;
  rotation: IQuaternion;
  scale: IVector3;
}

/**
 * 网络错误类型
 */
export enum NetworkErrorType {
  CONNECTION_FAILED = 'connection_failed',
  CONNECTION_LOST = 'connection_lost',
  AUTHENTICATION_FAILED = 'authentication_failed',
  PERMISSION_DENIED = 'permission_denied',
  RATE_LIMITED = 'rate_limited',
  INVALID_MESSAGE = 'invalid_message',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

/**
 * 网络错误信息
 */
export interface INetworkError {
  type: NetworkErrorType;
  message: string;
  code?: number;
  details?: any;
  timestamp: number;
}