import { Entity } from '@esengine/ecs-framework';

/**
 * 资产加载状态
 */
export enum LoadingState {
    /** 未开始 */
    Idle = 'idle',
    /** 即将开始 */
    Pending = 'pending',
    /** 加载中 */
    Loading = 'loading',
    /** 加载成功 */
    Loaded = 'loaded',
    /** 加载失败 */
    Failed = 'failed',
    /** 加载超时 */
    Timeout = 'timeout',
    /** 已取消 */
    Cancelled = 'cancelled'
}

/**
 * 加载任务
 */
export interface LoadingTask {
    /** 资产ID */
    assetId: string;

    /** 加载Promise */
    promise: Promise<Entity>;

    /** 开始时间 */
    startTime: number;

    /** 上次重试时间 */
    lastRetryTime: number;

    /** 当前重试次数 */
    retryCount: number;

    /** 最大重试次数 */
    maxRetries: number;

    /** 超时时间（毫秒） */
    timeoutMs: number;

    /** 当前状态 */
    state: LoadingState;

    /** 错误信息 */
    error?: Error;

    /** 父实体ID */
    parentEntityId: number;

    /** 父实体引用（需要在使用前检查isDestroyed） */
    parentEntity: Entity;

    /** 父资产ID（用于循环检测） */
    parentAssetId?: string;

    /** 加载结果（缓存） */
    result?: Entity;
}

/**
 * 加载任务句柄
 */
export interface LoadingTaskHandle {
    /** 资产ID */
    assetId: string;

    /** 获取当前状态 */
    getState(): LoadingState;

    /** 获取错误信息 */
    getError(): Error | undefined;

    /** 获取加载进度信息 */
    getProgress(): LoadingProgress;

    /** 取消加载 */
    cancel(): void;

    /** 加载Promise */
    promise: Promise<Entity>;
}

/**
 * 加载进度信息
 */
export interface LoadingProgress {
    /** 当前状态 */
    state: LoadingState;

    /** 已耗时（毫秒） */
    elapsedMs: number;

    /** 剩余超时时间（毫秒） */
    remainingTimeoutMs: number;

    /** 当前重试次数 */
    retryCount: number;

    /** 最大重试次数 */
    maxRetries: number;
}

/**
 * 加载选项
 */
export interface LoadingOptions {
    /** 超时时间（毫秒），默认5000 */
    timeoutMs?: number;

    /** 最大重试次数，默认3 */
    maxRetries?: number;

    /** 父资产ID（用于循环检测） */
    parentAssetId?: string;

    /** 重试延迟基数（毫秒），默认100 */
    retryDelayBase?: number;

    /** 最大重试延迟（毫秒），默认2000 */
    maxRetryDelay?: number;
}

/**
 * 超时错误
 */
export class TimeoutError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TimeoutError';
    }
}

/**
 * 循环依赖错误
 */
export class CircularDependencyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CircularDependencyError';
    }
}

/**
 * 实体已销毁错误
 */
export class EntityDestroyedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EntityDestroyedError';
    }
}
