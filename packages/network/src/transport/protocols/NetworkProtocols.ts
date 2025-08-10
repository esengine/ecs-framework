/**
 * 网络库 TSRPC 协议定义
 * 定义所有网络消息的类型和结构
 */


/**
 * 客户端连接请求
 */
export interface ReqJoinRoom {
  /** 房间ID，可选 */
  roomId?: string;
  /** 客户端信息 */
  clientInfo?: {
    /** 客户端版本 */
    version: string;
    /** 客户端平台 */
    platform: string;
  };
}

/**
 * 客户端连接响应
 */
export interface ResJoinRoom {
  /** 分配的客户端ID */
  clientId: number;
  /** 房间ID */
  roomId: string;
  /** 服务端信息 */
  serverInfo: {
    /** 服务端版本 */
    version: string;
    /** 同步频率 */
    syncRate: number;
  };
}

/**
 * 网络消息广播
 */
export interface MsgNetworkMessage {
  /** 消息类型 */
  type: 'syncvar' | 'rpc';
  /** 网络对象ID */
  networkId: number;
  /** 消息数据 */
  data: any;
  /** 时间戳 */
  timestamp: number;
  /** 发送者客户端ID */
  senderId?: number;
}

/**
 * SyncVar 同步消息
 */
export interface MsgSyncVar {
  /** 网络对象ID */
  networkId: number;
  /** 组件类型名 */
  componentType: string;
  /** 属性名 */
  propertyName: string;
  /** 新的属性值 */
  value: any;
  /** 时间戳 */
  timestamp: number;
}

/**
 * RPC 调用消息
 */
export interface MsgRpcCall {
  /** 网络对象ID */
  networkId: number;
  /** 组件类型名 */
  componentType: string;
  /** 方法名 */
  methodName: string;
  /** 参数 */
  args: any[];
  /** 是否为客户端RPC */
  isClientRpc: boolean;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 网络对象生成通知
 */
export interface MsgNetworkObjectSpawn {
  /** 网络对象ID */
  networkId: number;
  /** 实体名称 */
  entityName: string;
  /** 所有者客户端ID */
  ownerId: number;
  /** 是否拥有权威 */
  hasAuthority: boolean;
  /** 初始组件数据 */
  components: Array<{
    /** 组件类型 */
    type: string;
    /** 组件数据 */
    data: any;
  }>;
}

/**
 * 网络对象销毁通知
 */
export interface MsgNetworkObjectDespawn {
  /** 网络对象ID */
  networkId: number;
}

/**
 * 客户端断开连接通知
 */
export interface MsgClientDisconnected {
  /** 断开连接的客户端ID */
  clientId: number;
  /** 断开原因 */
  reason?: string;
}

/**
 * 权威转移通知
 */
export interface MsgAuthorityChange {
  /** 网络对象ID */
  networkId: number;
  /** 新的权威所有者ID */
  newOwnerId: number;
  /** 是否拥有权威 */
  hasAuthority: boolean;
}

/**
 * 服务端状态查询请求
 */
export interface ReqServerStatus {}

/**
 * 服务端状态响应
 */
export interface ResServerStatus {
  /** 连接的客户端数量 */
  clientCount: number;
  /** 网络对象数量 */
  networkObjectCount: number;
  /** 服务器运行时间（毫秒） */
  uptime: number;
  /** 网络统计 */
  networkStats: {
    /** 发送的消息数 */
    messagesSent: number;
    /** 接收的消息数 */
    messagesReceived: number;
    /** 发送的字节数 */
    bytesSent: number;
    /** 接收的字节数 */
    bytesReceived: number;
  };
}

/**
 * 心跳请求
 */
export interface ReqPing {
  /** 客户端时间戳 */
  timestamp: number;
}

/**
 * 心跳响应
 */
export interface ResPing {
  /** 服务端时间戳 */
  serverTimestamp: number;
  /** 客户端时间戳（回传） */
  clientTimestamp: number;
}