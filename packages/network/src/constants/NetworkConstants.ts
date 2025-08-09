/**
 * 网络库常量定义
 */

/**
 * 网络配置常量
 */
export const NETWORK_CONFIG = {
    /** 默认连接超时时间 (ms) */
    DEFAULT_CONNECTION_TIMEOUT: 10000,
    /** 默认心跳间隔 (ms) */
    DEFAULT_HEARTBEAT_INTERVAL: 5000,
    /** 默认心跳超时时间 (ms) */
    DEFAULT_HEARTBEAT_TIMEOUT: 10000,
    /** 默认最大重连次数 */
    DEFAULT_MAX_RECONNECT_ATTEMPTS: 5,
    /** 默认重连延迟 (ms) */
    DEFAULT_RECONNECT_DELAY: 1000,
    /** 默认最大连续丢包数 */
    DEFAULT_MAX_CONSECUTIVE_LOSS: 3,
    /** 默认心跳包大小 (bytes) */
    DEFAULT_HEARTBEAT_PACKET_SIZE: 64,
    /** 默认RTT历史记录大小 */
    DEFAULT_RTT_HISTORY_SIZE: 50
} as const;

/**
 * SyncVar配置常量
 */
export const SYNCVAR_CONFIG = {
    /** 默认SyncVar缓存超时 (ms) */
    DEFAULT_CACHE_TIMEOUT: 5000,
    /** 默认同步频率限制 (ms) */
    DEFAULT_THROTTLE_MS: 50,
    /** 最大字段编号 */
    MAX_FIELD_NUMBER: 65535,
    /** 最小字段编号 */
    MIN_FIELD_NUMBER: 1
} as const;

/**
 * 消息配置常量
 */
export const MESSAGE_CONFIG = {
    /** 默认消息序列号范围 */
    MAX_SEQUENCE_NUMBER: 4294967295, // 2^32 - 1
    /** 消息头部最大大小 (bytes) */
    MAX_HEADER_SIZE: 256,
    /** 消息体最大大小 (bytes) */
    MAX_PAYLOAD_SIZE: 1048576, // 1MB
    /** 默认消息超时时间 (ms) */
    DEFAULT_MESSAGE_TIMEOUT: 30000,
    /** 批处理消息最大数量 */
    MAX_BATCH_SIZE: 100
} as const;

/**
 * 序列化配置常量
 */
export const SERIALIZATION_CONFIG = {
    /** 默认压缩级别 */
    DEFAULT_COMPRESSION_LEVEL: 6,
    /** 启用压缩的最小数据大小 (bytes) */
    MIN_COMPRESSION_SIZE: 1024,
    /** 序列化缓冲区初始大小 (bytes) */
    INITIAL_BUFFER_SIZE: 4096,
    /** 序列化缓冲区最大大小 (bytes) */
    MAX_BUFFER_SIZE: 16777216 // 16MB
} as const;

/**
 * TSRPC配置常量
 */
export const TSRPC_CONFIG = {
    /** 默认服务器URL */
    DEFAULT_SERVER_URL: 'ws://localhost:3000',
    /** 默认超时时间 (ms) */
    DEFAULT_TIMEOUT: 30000,
    /** 默认心跳配置 */
    DEFAULT_HEARTBEAT: {
        interval: 10000,
        timeout: 5000
    },
    /** 默认连接池配置 */
    DEFAULT_POOL_CONFIG: {
        minConnections: 1,
        maxConnections: 10,
        idleTimeout: 300000 // 5分钟
    }
} as const;

/**
 * 权限配置常量
 */
export const AUTHORITY_CONFIG = {
    /** 权限优先级范围 */
    MIN_PRIORITY: 0,
    MAX_PRIORITY: 1000,
    /** 默认权限规则优先级 */
    DEFAULT_RULE_PRIORITY: 50,
    /** 服务端权限优先级 */
    SERVER_AUTHORITY_PRIORITY: 100,
    /** 网络身份权限优先级 */
    NETWORK_IDENTITY_PRIORITY: 80,
    /** 组件自定义权限优先级 */
    COMPONENT_CUSTOM_PRIORITY: 60,
    /** 实体所有者权限优先级 */
    ENTITY_OWNER_PRIORITY: 50,
    /** 默认拒绝规则优先级 */
    DEFAULT_DENY_PRIORITY: 0
} as const;

/**
 * 性能监控配置常量
 */
export const PERFORMANCE_CONFIG = {
    /** 性能统计收集间隔 (ms) */
    STATS_COLLECTION_INTERVAL: 1000,
    /** 性能数据保留时间 (ms) */
    STATS_RETENTION_TIME: 300000, // 5分钟
    /** 警告阈值 */
    WARNING_THRESHOLDS: {
        /** RTT警告阈值 (ms) */
        RTT: 200,
        /** 丢包率警告阈值 */
        PACKET_LOSS: 0.05, // 5%
        /** 抖动警告阈值 (ms) */
        JITTER: 50,
        /** CPU使用率警告阈值 */
        CPU_USAGE: 0.8, // 80%
        /** 内存使用率警告阈值 */
        MEMORY_USAGE: 0.8 // 80%
    }
} as const;

/**
 * 错误代码常量
 */
export const ERROR_CODES = {
    // 连接错误 (1000-1099)
    CONNECTION_FAILED: 1000,
    CONNECTION_TIMEOUT: 1001,
    CONNECTION_REFUSED: 1002,
    CONNECTION_LOST: 1003,
    
    // 序列化错误 (1100-1199)
    SERIALIZATION_FAILED: 1100,
    DESERIALIZATION_FAILED: 1101,
    INVALID_DATA_FORMAT: 1102,
    
    // SyncVar错误 (1200-1299)
    SYNCVAR_INIT_FAILED: 1200,
    SYNCVAR_METADATA_MISSING: 1201,
    SYNCVAR_TYPE_MISMATCH: 1202,
    SYNCVAR_AUTHORITY_DENIED: 1203,
    
    // 消息错误 (1300-1399)
    MESSAGE_TIMEOUT: 1300,
    MESSAGE_TOO_LARGE: 1301,
    MESSAGE_INVALID_TYPE: 1302,
    MESSAGE_SEQUENCE_ERROR: 1303,
    
    // TSRPC错误 (1400-1499)
    TSRPC_CALL_FAILED: 1400,
    TSRPC_METHOD_NOT_FOUND: 1401,
    TSRPC_INVALID_PARAMS: 1402,
    TSRPC_SERVER_ERROR: 1403,
    
    // 权限错误 (1500-1599)
    PERMISSION_DENIED: 1500,
    INVALID_AUTHORITY: 1501,
    AUTHORITY_CHECK_FAILED: 1502
} as const;

/**
 * 日志级别常量
 */
export const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
    TRACE: 4
} as const;

/**
 * 环境类型常量
 */
export const ENVIRONMENTS = {
    SERVER: 'server',
    CLIENT: 'client',
    HYBRID: 'hybrid'
} as const;

/**
 * 网络事件名称常量
 */
export const NETWORK_EVENTS = {
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    RECONNECTING: 'reconnecting',
    RECONNECTED: 'reconnected',
    CONNECT_ERROR: 'connectError',
    RECONNECT_FAILED: 'reconnectFailed',
    MESSAGE: 'message',
    ERROR: 'error',
    HEARTBEAT: 'heartbeat',
    PERFORMANCE_WARNING: 'performanceWarning'
} as const;

