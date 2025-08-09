import { Component, Entity } from '@esengine/ecs-framework';

/**
 * 网络环境类型
 */
export type NetworkEnvironmentType = 'server' | 'client' | 'hybrid';

/**
 * 连接状态类型
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

/**
 * 权限类型
 */
export enum AuthorityType {
    None = 'none',
    ReadOnly = 'readonly', 
    ReadWrite = 'readwrite',
    Full = 'full'
}

/**
 * 网络组件基接口
 */
export interface INetworkComponent extends Component {
    networkId?: string;
    hasNetworkAuthority?(): boolean;
    getNetworkState?(): Uint8Array;
    applyNetworkState?(data: Uint8Array): void;
    
    /** 允许通过字符串键访问属性 */
    [propertyKey: string]: unknown;
}

/**
 * 具有权限检查能力的组件
 */
export interface IAuthorizedComponent extends INetworkComponent {
    hasAuthority(context?: AuthorityContext): boolean;
    checkAuthority?(context?: AuthorityContext): boolean;
}

/**
 * 权限上下文
 */
export interface AuthorityContext {
    environment: NetworkEnvironmentType;
    networkId?: string;
    entityId?: number;
    clientId?: string;
    level: AuthorityType;
    timestamp: number;
    metadata?: Record<string, unknown>;
}

/**
 * 网络实体接口
 */
export interface INetworkEntity extends Entity {
    ownerId?: string;
    hasNetworkAuthority?(): boolean;
}

/**
 * 组件构造器类型
 */
export type ComponentConstructor<T extends Component = Component> = new (...args: unknown[]) => T;

/**
 * 网络组件构造器类型
 */
export type NetworkComponentConstructor<T extends INetworkComponent = INetworkComponent> = new (...args: unknown[]) => T;

/**
 * 事件处理器类型映射
 */
export interface NetworkEventHandlers {
    connected: () => void;
    disconnected: (reason?: string) => void;
    connecting: () => void;
    reconnecting: (attempt: number) => void;
    reconnected: () => void;
    connectError: (error: Error) => void;
    reconnectFailed: () => void;
    message: (data: Uint8Array) => void;
    error: (error: Error) => void;
}

/**
 * 类型安全的事件发射器接口
 */
export interface ITypedEventEmitter<TEvents extends Record<string, (...args: any[]) => void>> {
    on<K extends keyof TEvents>(event: K, handler: TEvents[K]): void;
    off<K extends keyof TEvents>(event: K, handler: TEvents[K]): void;
    emit<K extends keyof TEvents>(event: K, ...args: Parameters<TEvents[K]>): void;
}

/**
 * 网络统计接口
 */
export interface NetworkStats {
    connectionCount: number;
    totalConnections: number;
    uptime: number;
    bytesTransferred: number;
    messagesCount: number;
    errors: number;
}

/**
 * 性能指标接口
 */
export interface PerformanceMetrics {
    rtt: number;
    latency: number;
    jitter: number;
    packetLoss: number;
    bandwidth: number;
    connectionQuality: number;
}

/**
 * 类型守卫工具类
 */
export class TypeGuards {
    static isNetworkComponent(obj: unknown): obj is INetworkComponent {
        return obj !== null && 
               typeof obj === 'object' && 
               obj instanceof Component;
    }

    static isAuthorizedComponent(obj: unknown): obj is IAuthorizedComponent {
        return TypeGuards.isNetworkComponent(obj) && 
               typeof (obj as IAuthorizedComponent).hasAuthority === 'function';
    }

    static isNetworkEntity(obj: unknown): obj is INetworkEntity {
        return obj !== null && 
               typeof obj === 'object' && 
               obj instanceof Entity;
    }

    static isValidNetworkEnvironment(env: string): env is NetworkEnvironmentType {
        return ['server', 'client', 'hybrid'].includes(env);
    }

    static isValidConnectionState(state: string): state is ConnectionState {
        return ['disconnected', 'connecting', 'connected', 'reconnecting'].includes(state);
    }
}