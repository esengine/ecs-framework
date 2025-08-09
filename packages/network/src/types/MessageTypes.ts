/**
 * 消息类型枚举
 */
export enum MessageType {
    // 基础消息类型 (0-99)
    HEARTBEAT = 0,
    PING = 1,
    PONG = 2,
    ERROR = 3,
    
    // 连接管理 (100-199)
    CONNECT = 100,
    DISCONNECT = 101,
    RECONNECT = 102,
    AUTH = 103,
    
    // SyncVar消息 (200-299)
    SYNC_VAR_UPDATE = 200,
    SYNC_VAR_BATCH = 201,
    SYNC_VAR_REQUEST = 202,
    
    // 快照消息 (300-399)
    SNAPSHOT_FULL = 300,
    SNAPSHOT_INCREMENTAL = 301,
    SNAPSHOT_REQUEST = 302,
    
    // TSRPC消息 (400-499)
    TSRPC_CALL = 400,
    TSRPC_RESPONSE = 401,
    TSRPC_NOTIFICATION = 402,
    
    // 自定义消息 (500+)
    CUSTOM = 500
}

/**
 * 消息优先级
 */
export enum MessagePriority {
    CRITICAL = 0,    // 关键消息（连接、认证等）
    HIGH = 1,        // 高优先级（实时游戏数据）
    NORMAL = 2,      // 普通优先级（常规同步）
    LOW = 3,         // 低优先级（统计、日志等）
    BACKGROUND = 4   // 后台消息（清理、维护等）
}

/**
 * 网络消息基接口
 */
export interface INetworkMessage {
    readonly type: MessageType;
    readonly timestamp: number;
    readonly priority: MessagePriority;
    readonly sequenceNumber?: number;
    serialize(): Uint8Array;
}

/**
 * 消息头接口
 */
export interface MessageHeader {
    type: MessageType;
    size: number;
    timestamp: number;
    priority: MessagePriority;
    sequenceNumber?: number;
    checksum?: number;
}

/**
 * 心跳消息接口
 */
export interface IHeartbeatMessage extends INetworkMessage {
    readonly pingId: string;
    readonly payload?: Record<string, unknown>;
}

/**
 * SyncVar更新消息接口
 */
export interface ISyncVarMessage extends INetworkMessage {
    readonly networkId: string;
    readonly componentType: string;
    readonly fieldUpdates: SyncVarFieldUpdate[];
    readonly isFullSync: boolean;
    readonly senderId?: string;
}

/**
 * SyncVar字段更新
 */
export interface SyncVarFieldUpdate {
    readonly fieldNumber: number;
    readonly propertyKey: string;
    readonly newValue: unknown;
    readonly oldValue?: unknown;
    readonly timestamp: number;
    readonly authorityOnly: boolean;
}

/**
 * 错误消息接口
 */
export interface IErrorMessage extends INetworkMessage {
    readonly errorCode: string;
    readonly errorMessage: string;
    readonly errorData?: Record<string, unknown>;
    readonly originalMessageType?: MessageType;
}

/**
 * 快照消息接口
 */
export interface ISnapshotMessage extends INetworkMessage {
    readonly snapshotId: string;
    readonly snapshotType: 'full' | 'incremental';
    readonly entityData: EntitySnapshot[];
    readonly compressionType?: string;
}

/**
 * 实体快照数据
 */
export interface EntitySnapshot {
    readonly entityId: number;
    readonly components: ComponentSnapshot[];
    readonly timestamp: number;
}

/**
 * 组件快照数据
 */
export interface ComponentSnapshot {
    readonly componentType: string;
    readonly data: Uint8Array;
    readonly version?: string;
}

/**
 * TSRPC消息接口
 */
export interface ITsrpcMessage extends INetworkMessage {
    readonly method: string;
    readonly requestId?: string;
    readonly params?: Record<string, unknown>;
    readonly result?: unknown;
    readonly error?: TsrpcError;
}

/**
 * TSRPC错误
 */
export interface TsrpcError {
    readonly code: number;
    readonly message: string;
    readonly data?: unknown;
}

/**
 * 消息工厂接口
 */
export interface IMessageFactory {
    createMessage<T extends INetworkMessage>(
        type: MessageType,
        data: Record<string, unknown>
    ): T;
    
    deserializeMessage(data: Uint8Array): INetworkMessage | null;
    
    registerMessageType<T extends INetworkMessage>(
        type: MessageType,
        constructor: new (...args: unknown[]) => T
    ): void;
}

/**
 * 消息处理器接口
 */
export interface IMessageHandler<T extends INetworkMessage = INetworkMessage> {
    readonly messageType: MessageType;
    readonly priority: number;
    
    canHandle(message: INetworkMessage): message is T;
    handle(message: T, context?: MessageHandlerContext): Promise<void> | void;
}

/**
 * 消息处理上下文
 */
export interface MessageHandlerContext {
    readonly connectionId?: string;
    readonly senderId?: string;
    readonly timestamp: number;
    readonly metadata?: Record<string, unknown>;
}

/**
 * 消息统计接口
 */
export interface MessageStats {
    readonly totalSent: number;
    readonly totalReceived: number;
    readonly totalDropped: number;
    readonly averageSize: number;
    readonly messagesByType: Map<MessageType, number>;
    readonly messagesByPriority: Map<MessagePriority, number>;
}