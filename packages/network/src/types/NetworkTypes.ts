/**
 * 网络库类型定义
 * 
 * 基于核心库的类型系统，为网络功能提供特定的类型约束
 */

import { ComponentType, IComponent, Component } from '@esengine/ecs-framework';
import { SerializedData } from '../Serialization/SerializationTypes';

/**
 * 网络同步组件接口
 * 扩展核心组件接口，添加网络同步功能
 */
export interface INetworkSyncable extends IComponent {
    /**
     * 获取网络同步状态
     */
    getNetworkState(): Uint8Array;
    
    /**
     * 应用网络状态
     */
    applyNetworkState(data: Uint8Array): void;
    
    /**
     * 获取脏字段列表
     */
    getDirtyFields(): number[];
    
    /**
     * 标记为干净状态
     */
    markClean(): void;
    
    /**
     * 标记字段为脏状态
     */
    markFieldDirty(fieldNumber: number): void;
}

/**
 * 网络组件构造函数类型
 * 基于核心库的ComponentType，添加网络特性约束
 */
export type NetworkComponentType<T extends Component & INetworkSyncable = Component & INetworkSyncable> = ComponentType<T>;

/**
 * SyncVar值类型约束
 * 定义可以被SyncVar同步的值类型
 */
export type SyncVarValue = 
    | string 
    | number 
    | boolean 
    | null 
    | undefined
    | Date
    | Uint8Array
    | Record<string, unknown>
    | unknown[];


/**
 * SyncVar元数据接口
 * 用于类型安全的SyncVar配置
 */
export interface ISyncVarMetadata<T = SyncVarValue> {
    /** 属性名 */
    propertyKey: string;
    /** 字段编号 */
    fieldNumber: number;
    /** 配置选项 */
    options: ISyncVarOptions<T>;
}

/**
 * SyncVar选项接口
 */
export interface ISyncVarOptions<T = SyncVarValue> {
    /** Hook回调函数名 */
    hook?: string;
    /** 是否仅权威端可修改 */
    authorityOnly?: boolean;
    /** 节流时间（毫秒） */
    throttleMs?: number;
    /** 自定义序列化函数 */
    serializer?: (value: T) => Uint8Array;
    /** 自定义反序列化函数 */
    deserializer?: (data: Uint8Array) => T;
}

/**
 * 组件序列化目标类型
 * 约束可以被序列化的组件类型
 */
export type SerializationTarget = Component & INetworkSyncable & {
    readonly constructor: NetworkComponentType;
};

/**
 * 消息数据约束类型
 * 定义网络消息中可以传输的数据类型
 */
export type MessageData = 
    | Record<string, unknown>
    | Uint8Array
    | string
    | number
    | boolean
    | null;

/**
 * 网络消息基接口
 * 为所有网络消息提供类型安全的基础
 */
export interface INetworkMessage<TData extends MessageData = MessageData> {
    /** 消息类型 */
    readonly messageType: number;
    /** 消息数据 */
    readonly data: TData;
    /** 发送者ID */
    senderId?: string;
    /** 消息时间戳 */
    timestamp: number;
    /** 消息序列号 */
    sequence?: number;
    
    /** 序列化消息 */
    serialize(): Uint8Array;
    /** 反序列化消息 */
    deserialize(data: Uint8Array): void;
    /** 获取消息大小 */
    getSize(): number;
}

/**
 * SyncVar更新数据接口
 */
export interface ISyncVarFieldUpdate {
    /** 字段编号 */
    fieldNumber: number;
    /** 属性名 */
    propertyKey: string;
    /** 新值 */
    newValue: SyncVarValue;
    /** 旧值 */
    oldValue: SyncVarValue;
    /** 时间戳 */
    timestamp: number;
    /** 是否需要权限 */
    authorityOnly?: boolean;
}

/**
 * 快照数据接口
 */
export interface ISnapshotData {
    /** 组件类型名 */
    componentType: string;
    /** 序列化数据 */
    data: SerializedData;
    /** 组件ID */
    componentId: number;
    /** 是否启用 */
    enabled: boolean;
}

/**
 * 类型安全的组件工厂接口
 */
export interface IComponentFactory {
    /** 创建组件实例 */
    create<T extends Component & INetworkSyncable>(
        componentType: NetworkComponentType<T>,
        ...args: unknown[]
    ): T;
    
    /** 检查组件类型是否已注册 */
    isRegistered<T extends Component & INetworkSyncable>(
        componentType: NetworkComponentType<T>
    ): boolean;
    
    /** 获取组件类型名称 */
    getTypeName<T extends Component & INetworkSyncable>(
        componentType: NetworkComponentType<T>
    ): string;
}

/**
 * 网络性能指标接口
 */
export interface INetworkPerformanceMetrics {
    /** RTT（往返时间） */
    rtt: number;
    /** 带宽利用率 */
    bandwidth: number;
    /** 丢包率 */
    packetLoss: number;
    /** 抖动 */
    jitter: number;
    /** 连接质量评分 */
    quality: number;
    /** 最后更新时间 */
    lastUpdate: number;
}

/**
 * 序列化上下文接口
 * 为序列化过程提供上下文信息
 */
export interface ISerializationContext {
    /** 目标组件类型 */
    componentType: string;
    /** 序列化选项 */
    options?: {
        enableValidation?: boolean;
        compressionLevel?: number;
    };
}

/**
 * 类型守卫函数类型定义
 */
export type TypeGuard<T> = (value: unknown) => value is T;

/**
 * 常用类型守卫函数
 */
export const TypeGuards = {
    /** 检查是否为SyncVar值 */
    isSyncVarValue: ((value: unknown): value is SyncVarValue => {
        return value === null || 
               value === undefined ||
               typeof value === 'string' ||
               typeof value === 'number' ||
               typeof value === 'boolean' ||
               value instanceof Date ||
               value instanceof Uint8Array ||
               (typeof value === 'object' && value !== null);
    }) as TypeGuard<SyncVarValue>,
    
    /** 检查是否为网络消息数据 */
    isMessageData: ((value: unknown): value is MessageData => {
        return value === null ||
               typeof value === 'string' ||
               typeof value === 'number' ||
               typeof value === 'boolean' ||
               value instanceof Uint8Array ||
               (typeof value === 'object' && value !== null && !(value instanceof Date));
    }) as TypeGuard<MessageData>,
    
    /** 检查是否为序列化目标 */
    isSerializationTarget: ((value: unknown): value is SerializationTarget => {
        return typeof value === 'object' &&
               value !== null &&
               'getNetworkState' in value &&
               'applyNetworkState' in value &&
               typeof (value as { getNetworkState?: unknown }).getNetworkState === 'function';
    }) as TypeGuard<SerializationTarget>
} as const;

/**
 * 网络错误类型枚举
 */
export enum NetworkErrorType {
    CONNECTION_FAILED = 'CONNECTION_FAILED',
    SERIALIZATION_FAILED = 'SERIALIZATION_FAILED',
    DESERIALIZATION_FAILED = 'DESERIALIZATION_FAILED',
    SYNC_VAR_ERROR = 'SYNC_VAR_ERROR',
    MESSAGE_TIMEOUT = 'MESSAGE_TIMEOUT',
    INVALID_DATA = 'INVALID_DATA',
    PERMISSION_DENIED = 'PERMISSION_DENIED'
}

/**
 * 网络错误接口
 */
export interface INetworkError extends Error {
    readonly type: NetworkErrorType;
    readonly code?: string | number;
    readonly context?: Record<string, unknown>;
    readonly timestamp: number;
}

/**
 * 创建类型安全的网络错误
 */
export function createNetworkError(
    type: NetworkErrorType,
    message: string,
    context?: Record<string, unknown>
): INetworkError {
    const error = new Error(message) as INetworkError;
    Object.defineProperty(error, 'type', { value: type, writable: false });
    Object.defineProperty(error, 'context', { value: context, writable: false });
    Object.defineProperty(error, 'timestamp', { value: Date.now(), writable: false });
    return error;
}