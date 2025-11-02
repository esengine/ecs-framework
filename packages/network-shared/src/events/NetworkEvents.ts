/**
 * 网络事件类型枚举
 * 定义网络层中的所有事件类型
 */
export enum NetworkEventType {
    // 连接相关事件
    CONNECTION_ESTABLISHED = 'network:connection:established',
    CONNECTION_LOST = 'network:connection:lost',
    CONNECTION_ERROR = 'network:connection:error',
    CONNECTION_TIMEOUT = 'network:connection:timeout',
    RECONNECTION_STARTED = 'network:reconnection:started',
    RECONNECTION_SUCCEEDED = 'network:reconnection:succeeded',
    RECONNECTION_FAILED = 'network:reconnection:failed',

    // 网络身份相关事件
    IDENTITY_CREATED = 'network:identity:created',
    IDENTITY_DESTROYED = 'network:identity:destroyed',
    IDENTITY_OWNER_CHANGED = 'network:identity:owner:changed',
    IDENTITY_AUTHORITY_CHANGED = 'network:identity:authority:changed',
    IDENTITY_SYNC_ENABLED = 'network:identity:sync:enabled',
    IDENTITY_SYNC_DISABLED = 'network:identity:sync:disabled',
    IDENTITY_PROPERTY_CHANGED = 'network:identity:property:changed',
    IDENTITY_VISIBLE_CHANGED = 'network:identity:visible:changed',

    // 同步相关事件
    SYNC_STARTED = 'network:sync:started',
    SYNC_COMPLETED = 'network:sync:completed',
    SYNC_FAILED = 'network:sync:failed',
    SYNC_RATE_CHANGED = 'network:sync:rate:changed',
    SYNC_PRIORITY_CHANGED = 'network:sync:priority:changed',

    // RPC相关事件
    RPC_CALL_SENT = 'network:rpc:call:sent',
    RPC_CALL_RECEIVED = 'network:rpc:call:received',
    RPC_RESPONSE_SENT = 'network:rpc:response:sent',
    RPC_RESPONSE_RECEIVED = 'network:rpc:response:received',
    RPC_ERROR = 'network:rpc:error',
    RPC_TIMEOUT = 'network:rpc:timeout',

    // 消息相关事件
    MESSAGE_SENT = 'network:message:sent',
    MESSAGE_RECEIVED = 'network:message:received',
    MESSAGE_QUEUED = 'network:message:queued',
    MESSAGE_DROPPED = 'network:message:dropped',
    MESSAGE_RETRY = 'network:message:retry',
    MESSAGE_ACKNOWLEDGED = 'network:message:acknowledged',

    // 房间相关事件
    ROOM_JOINED = 'network:room:joined',
    ROOM_LEFT = 'network:room:left',
    ROOM_CREATED = 'network:room:created',
    ROOM_DESTROYED = 'network:room:destroyed',
    ROOM_PLAYER_JOINED = 'network:room:player:joined',
    ROOM_PLAYER_LEFT = 'network:room:player:left',

    // 客户端相关事件
    CLIENT_CONNECTED = 'network:client:connected',
    CLIENT_DISCONNECTED = 'network:client:disconnected',
    CLIENT_AUTHENTICATED = 'network:client:authenticated',
    CLIENT_KICKED = 'network:client:kicked',
    CLIENT_TIMEOUT = 'network:client:timeout',

    // 服务器相关事件
    SERVER_STARTED = 'network:server:started',
    SERVER_STOPPED = 'network:server:stopped',
    SERVER_ERROR = 'network:server:error',
    SERVER_OVERLOADED = 'network:server:overloaded',

    // 数据相关事件
    DATA_SYNCHRONIZED = 'network:data:synchronized',
    DATA_CONFLICT = 'network:data:conflict',
    DATA_CORRUPTED = 'network:data:corrupted',
    DATA_VALIDATED = 'network:data:validated',

    // 性能相关事件
    BANDWIDTH_WARNING = 'network:bandwidth:warning',
    LATENCY_HIGH = 'network:latency:high',
    PACKET_LOSS_DETECTED = 'network:packet:loss:detected',
    PERFORMANCE_DEGRADED = 'network:performance:degraded'
}

/**
 * 网络事件优先级
 */
export enum NetworkEventPriority {
    LOW = 10,
    NORMAL = 20,
    HIGH = 30,
    CRITICAL = 40,
    EMERGENCY = 50
}

/**
 * 网络事件数据基础接口
 */
export interface NetworkEventData {
    timestamp: number;
    networkId?: number;
    clientId?: string;
    roomId?: string;
    [key: string]: any;
}

/**
 * 网络身份事件数据
 */
export interface NetworkIdentityEventData extends NetworkEventData {
    networkId: number;
    ownerId: string;
    oldValue?: any;
    newValue?: any;
}

/**
 * RPC事件数据
 */
export interface RpcEventData extends NetworkEventData {
    rpcId: string;
    methodName: string;
    parameters?: any[];
    result?: any;
    error?: string;
}

/**
 * 消息事件数据
 */
export interface MessageEventData extends NetworkEventData {
    messageId: string;
    messageType: string;
    payload: any;
    reliable: boolean;
    size: number;
}

/**
 * 连接事件数据
 */
export interface ConnectionEventData extends NetworkEventData {
    clientId: string;
    address?: string;
    reason?: string;
    reconnectAttempt?: number;
}

/**
 * 房间事件数据
 */
export interface RoomEventData extends NetworkEventData {
    roomId: string;
    playerId?: string;
    playerCount?: number;
    maxPlayers?: number;
}

/**
 * 性能事件数据
 */
export interface PerformanceEventData extends NetworkEventData {
    metric: string;
    value: number;
    threshold?: number;
    duration?: number;
}

/**
 * 网络事件工具类
 */
export class NetworkEventUtils {
    /**
     * 创建网络身份事件数据
     */
    static createIdentityEventData(
        networkId: number,
        ownerId: string,
        oldValue?: any,
        newValue?: any
    ): NetworkIdentityEventData {
        return {
            timestamp: Date.now(),
            networkId,
            ownerId,
            oldValue,
            newValue
        };
    }

    /**
     * 创建RPC事件数据
     */
    static createRpcEventData(
        rpcId: string,
        methodName: string,
        clientId?: string,
        parameters?: any[],
        result?: any,
        error?: string
    ): RpcEventData {
        return {
            timestamp: Date.now(),
            clientId,
            rpcId,
            methodName,
            parameters,
            result,
            error
        };
    }

    /**
     * 创建消息事件数据
     */
    static createMessageEventData(
        messageId: string,
        messageType: string,
        payload: any,
        reliable: boolean = true,
        clientId?: string
    ): MessageEventData {
        const size = JSON.stringify(payload).length;
        return {
            timestamp: Date.now(),
            clientId,
            messageId,
            messageType,
            payload,
            reliable,
            size
        };
    }

    /**
     * 创建连接事件数据
     */
    static createConnectionEventData(
        clientId: string,
        address?: string,
        reason?: string,
        reconnectAttempt?: number
    ): ConnectionEventData {
        return {
            timestamp: Date.now(),
            clientId,
            address,
            reason,
            reconnectAttempt
        };
    }

    /**
     * 创建房间事件数据
     */
    static createRoomEventData(
        roomId: string,
        playerId?: string,
        playerCount?: number,
        maxPlayers?: number
    ): RoomEventData {
        return {
            timestamp: Date.now(),
            roomId,
            playerId,
            playerCount,
            maxPlayers
        };
    }

    /**
     * 创建性能事件数据
     */
    static createPerformanceEventData(
        metric: string,
        value: number,
        threshold?: number,
        duration?: number,
        clientId?: string
    ): PerformanceEventData {
        return {
            timestamp: Date.now(),
            clientId,
            metric,
            value,
            threshold,
            duration
        };
    }
}
