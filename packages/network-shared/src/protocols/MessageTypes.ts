/**
 * 网络消息协议定义
 */
import { MessageType, INetworkMessage, AuthorityType, SyncMode, RpcTarget } from '../types/NetworkTypes';

/**
 * 3D位置信息
 */
export interface Position3D {
  x: number;
  y: number;
  z?: number;
}

/**
 * 组件数据
 */
export interface ComponentData {
  type: string;
  data: any;
}

/**
 * 客户端信息
 */
export interface ClientInfo {
  name: string;
  version: string;
  platform: string;
}

/**
 * 服务器信息
 */
export interface ServerInfo {
  name: string;
  version: string;
  maxPlayers: number;
  currentPlayers: number;
}

/**
 * 玩家信息
 */
export interface PlayerInfo {
  playerId: string;
  playerName: string;
}

/**
 * 连接数据
 */
export interface ConnectData {
  clientVersion: string;
  protocolVersion: string;
  authToken?: string;
  clientInfo: ClientInfo;
}

/**
 * 连接响应数据
 */
export interface ConnectResponseData {
  success: boolean;
  clientId?: string;
  error?: string;
  serverInfo?: ServerInfo;
}

/**
 * 断开连接数据
 */
export interface DisconnectData {
  reason: string;
  code: number;
}

/**
 * 心跳数据
 */
export interface HeartbeatData {
  clientTime: number;
  serverTime?: number;
}

/**
 * RPC请求数据
 */
export interface RpcRequestData {
  callId: string;
  methodName: string;
  target: RpcTarget;
  args: any[];
  timeout?: number;
}

/**
 * 实体创建数据
 */
export interface EntityCreateData {
  entityId: string;
  entityType: string;
  ownerId: string;
  authority: AuthorityType;
  components: ComponentData[];
  position?: Position3D;
}

/**
 * 实体销毁数据
 */
export interface EntityDestroyData {
  entityId: string;
  reason?: string;
}

/**
 * 组件同步数据
 */
export interface ComponentSyncData {
  entityId: string;
  componentType: string;
  syncMode: SyncMode;
  data: any;
  timestamp: number;
}

/**
 * 状态同步数据
 */
export interface StateSyncData {
  entityId: string;
  stateData: any;
  timestamp: number;
}

/**
 * 聊天数据
 */
export interface ChatData {
  playerId: string;
  message: string;
  timestamp: number;
  playerInfo?: PlayerInfo;
}

/**
 * 加入房间数据
 */
export interface JoinRoomData {
  roomId: string;
  playerInfo: PlayerInfo;
}

/**
 * 离开房间数据
 */
export interface LeaveRoomData {
  roomId: string;
  reason?: string;
}

/**
 * 玩家加入数据
 */
export interface PlayerJoinedData {
  playerId: string;
  playerName: string;
  roomId: string;
}

/**
 * 玩家离开数据
 */
export interface PlayerLeftData {
  playerId: string;
  roomId: string;
  reason?: string;
}

/**
 * 自定义数据
 */
export interface CustomData {
  eventType: string;
  data: any;
  timestamp: number;
}

/**
 * 错误数据
 */
export interface ErrorData {
  code: string;
  message: string;
  details?: any;
  relatedMessageId?: string;
}

/**
 * 连接请求消息
 */
export interface IConnectMessage extends INetworkMessage {
  type: MessageType.CONNECT;
  data: ConnectData;
}

/**
 * 连接响应消息
 */
export interface IConnectResponseMessage extends INetworkMessage {
  type: MessageType.CONNECT;
  data: ConnectResponseData;
}

/**
 * 心跳消息
 */
export interface IHeartbeatMessage extends INetworkMessage {
  type: MessageType.HEARTBEAT;
  data: HeartbeatData;
}

/**
 * 同步变量消息
 */
export interface ISyncVarMessage extends INetworkMessage {
  type: MessageType.SYNC_VAR;
  data: {
    /** 网络实体ID */
    networkId: number;
    /** 组件类型名称 */
    componentType: string;
    /** 变化的属性 */
    changes: Record<string, any>;
    /** 同步模式 */
    syncMode: SyncMode;
    /** 时间戳 */
    timestamp: number;
  };
}

/**
 * 批量同步消息
 */
export interface ISyncBatchMessage extends INetworkMessage {
  type: MessageType.SYNC_BATCH;
  data: {
    /** 同步数据列表 */
    syncData: Array<{
      networkId: number;
      componentType: string;
      changes: Record<string, any>;
      syncMode: SyncMode;
    }>;
    /** 批次时间戳 */
    batchTimestamp: number;
  };
}

/**
 * RPC调用消息
 */
export interface IRpcCallMessage extends INetworkMessage {
  type: MessageType.RPC_CALL;
  data: {
    /** 网络实体ID */
    networkId: number;
    /** 组件类型名称 */
    componentType: string;
    /** 方法名 */
    methodName: string;
    /** 参数列表 */
    args: any[];
    /** 调用ID（用于响应匹配） */
    callId?: string;
    /** RPC目标 */
    target: RpcTarget;
    /** 是否需要响应 */
    expectResponse?: boolean;
    /** 超时时间 */
    timeout?: number;
  };
}

/**
 * RPC响应数据
 */
export interface RpcResponseData {
  /** 调用ID */
  callId: string;
  /** 是否成功 */
  success: boolean;
  /** 返回值 */
  result?: any;
  /** 错误信息 */
  error?: string;
}

/**
 * RPC响应消息
 */
export interface IRpcResponseMessage extends INetworkMessage {
  type: MessageType.RPC_RESPONSE;
  data: RpcResponseData;
}

/**
 * 实体创建消息
 */
export interface IEntityCreateMessage extends INetworkMessage {
  type: MessageType.ENTITY_CREATE;
  data: {
    /** 网络实体ID */
    networkId: number;
    /** 实体名称 */
    entityName: string;
    /** 拥有者ID */
    ownerId: string;
    /** 权限类型 */
    authority: AuthorityType;
    /** 初始组件数据 */
    components: ComponentData[];
    /** 位置信息 */
    position?: Position3D;
  };
}

/**
 * 实体销毁消息
 */
export interface IEntityDestroyMessage extends INetworkMessage {
  type: MessageType.ENTITY_DESTROY;
  data: {
    /** 网络实体ID */
    networkId: number;
    /** 销毁原因 */
    reason?: string;
  };
}

/**
 * 加入房间消息
 */
export interface IJoinRoomMessage extends INetworkMessage {
  type: MessageType.JOIN_ROOM;
  data: {
    /** 房间ID */
    roomId: string;
    /** 密码（如果需要） */
    password?: string;
    /** 玩家信息 */
    playerInfo?: {
      name: string;
      avatar?: string;
      customData?: Record<string, any>;
    };
  };
}

/**
 * 离开房间消息
 */
export interface ILeaveRoomMessage extends INetworkMessage {
  type: MessageType.LEAVE_ROOM;
  data: LeaveRoomData;
}

/**
 * 房间状态消息
 */
export interface IRoomStateMessage extends INetworkMessage {
  type: MessageType.ROOM_STATE;
  data: {
    /** 房间ID */
    roomId: string;
    /** 房间状态 */
    state: string;
    /** 玩家列表 */
    players: Array<{
      id: string;
      name: string;
      isHost: boolean;
      customData?: Record<string, any>;
    }>;
    /** 房间设置 */
    settings?: Record<string, any>;
  };
}

/**
 * 游戏事件消息
 */
export interface IGameEventMessage extends INetworkMessage {
  type: MessageType.GAME_EVENT;
  data: {
    /** 事件类型 */
    eventType: string;
    /** 事件数据 */
    eventData: any;
    /** 目标客户端 */
    target?: RpcTarget;
    /** 事件优先级 */
    priority?: number;
  };
}

/**
 * 错误消息
 */
export interface IErrorMessage extends INetworkMessage {
  type: MessageType.ERROR;
  data: ErrorData;
}

/**
 * 消息类型联合
 */
export type NetworkMessage = 
  | IConnectMessage
  | IConnectResponseMessage
  | IHeartbeatMessage
  | ISyncVarMessage
  | ISyncBatchMessage
  | IRpcCallMessage
  | IRpcResponseMessage
  | IEntityCreateMessage
  | IEntityDestroyMessage
  | IJoinRoomMessage
  | ILeaveRoomMessage
  | IRoomStateMessage
  | IGameEventMessage
  | IErrorMessage;