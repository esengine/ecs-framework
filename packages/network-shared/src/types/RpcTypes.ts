import { RpcTarget } from './NetworkTypes';

/**
 * RPC调用配置
 */
export interface RpcOptions {
    /** 是否可靠传输 */
    reliable?: boolean;
    /** 调用优先级 0-10，10为最高 */
    priority?: number;
    /** 调用目标 */
    target?: RpcTarget;
    /** 超时时间(毫秒) */
    timeout?: number;
    /** 是否需要身份验证 */
    requireAuth?: boolean;
    /** 调用频率限制(每秒) */
    rateLimit?: number;
}

/**
 * RPC方法元数据
 */
export interface RpcMethodMetadata {
    /** 方法名 */
    methodName: string;
    /** 所属类名 */
    className: string;
    /** 是否为服务端RPC */
    isServerRpc: boolean;
    /** RPC配置 */
    options: RpcOptions;
    /** 参数类型 */
    paramTypes: string[];
    /** 返回值类型 */
    returnType: string;
}

/**
 * RPC调用请求
 */
export interface RpcCallRequest<T extends readonly unknown[] = readonly unknown[]> {
    /** 调用ID */
    callId: string;
    /** 方法名 */
    methodName: string;
    /** 调用参数 */
    args: T;
    /** 发送者ID */
    senderId: string;
    /** 目标ID(可选，用于特定客户端调用) */
    targetId?: string;
    /** 调用时间戳 */
    timestamp: number;
    /** 调用配置 */
    options: RpcOptions;
}

/**
 * RPC调用响应
 */
export interface RpcCallResponse<T = unknown> {
    /** 调用ID */
    callId: string;
    /** 是否成功 */
    success: boolean;
    /** 返回值 */
    result?: T;
    /** 错误信息 */
    error?: RpcError;
    /** 响应时间戳 */
    timestamp: number;
    /** 处理时长(毫秒) */
    duration: number;
}

/**
 * RPC错误类型
 */
export enum RpcErrorType {
    /** 方法不存在 */
    METHOD_NOT_FOUND = 'method_not_found',
    /** 参数无效 */
    INVALID_ARGUMENTS = 'invalid_arguments',
    /** 权限不足 */
    PERMISSION_DENIED = 'permission_denied',
    /** 调用超时 */
    TIMEOUT = 'timeout',
    /** 速率限制 */
    RATE_LIMITED = 'rate_limited',
    /** 网络错误 */
    NETWORK_ERROR = 'network_error',
    /** 服务端错误 */
    SERVER_ERROR = 'server_error',
    /** 客户端错误 */
    CLIENT_ERROR = 'client_error',
    /** 未知错误 */
    UNKNOWN = 'unknown'
}

/**
 * RPC错误信息
 */
export interface RpcError {
    /** 错误类型 */
    type: RpcErrorType;
    /** 错误消息 */
    message: string;
    /** 错误代码 */
    code?: number;
    /** 详细信息 */
    details?: Record<string, unknown>;
    /** 堆栈信息 */
    stack?: string;
}

/**
 * RPC调用状态
 */
export enum RpcCallStatus {
    /** 待发送 */
    PENDING = 'pending',
    /** 已发送 */
    SENT = 'sent',
    /** 处理中 */
    PROCESSING = 'processing',
    /** 已完成 */
    COMPLETED = 'completed',
    /** 已失败 */
    FAILED = 'failed',
    /** 已超时 */
    TIMEOUT = 'timeout',
    /** 已取消 */
    CANCELLED = 'cancelled'
}

/**
 * RPC调用信息
 */
export interface RpcCallInfo<T extends readonly unknown[] = readonly unknown[]> {
    /** 调用请求 */
    request: RpcCallRequest<T>;
    /** 调用状态 */
    status: RpcCallStatus;
    /** Promise解析器 */
    resolve?: (value: unknown) => void;
    /** Promise拒绝器 */
    reject?: (reason: RpcError) => void;
    /** 重试次数 */
    retryCount: number;
    /** 下次重试时间 */
    nextRetryTime?: number;
    /** 创建时间 */
    createdAt: number;
    /** 发送时间 */
    sentAt?: number;
    /** 完成时间 */
    completedAt?: number;
}

/**
 * RPC统计信息
 */
export interface RpcStats {
    /** 总调用次数 */
    totalCalls: number;
    /** 成功调用次数 */
    successfulCalls: number;
    /** 失败调用次数 */
    failedCalls: number;
    /** 平均响应时间(毫秒) */
    averageResponseTime: number;
    /** 当前等待中的调用数 */
    pendingCalls: number;
    /** 超时调用次数 */
    timeoutCalls: number;
    /** 重试次数 */
    retryCount: number;
    /** 最后更新时间 */
    lastUpdated: number;
}

/**
 * RPC方法签名类型
 */
export type RpcMethod<TArgs extends readonly unknown[] = readonly unknown[], TReturn = unknown> =
    (...args: TArgs) => Promise<TReturn>;

/**
 * RPC方法注册表类型
 */
export type RpcMethodRegistry = Map<string, {
    metadata: RpcMethodMetadata;
    handler: RpcMethod;
}>;

/**
 * 客户端RPC调用接口类型
 */
export type ClientRpcInvoker = <TArgs extends readonly unknown[], TReturn>(
    methodName: string,
    args: TArgs,
    options?: Partial<RpcOptions>
) => Promise<TReturn>;

/**
 * 服务端RPC调用接口类型
 */
export type ServerRpcInvoker = <TArgs extends readonly unknown[], TReturn>(
    clientId: string,
    methodName: string,
    args: TArgs,
    options?: Partial<RpcOptions>
) => Promise<TReturn>;
