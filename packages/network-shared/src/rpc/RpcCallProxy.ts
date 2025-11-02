import { createLogger } from '@esengine/ecs-framework';
import { EventEmitter } from '../utils/EventEmitter';
import {
    RpcCallRequest,
    RpcCallResponse,
    RpcError,
    RpcErrorType,
    RpcCallInfo,
    RpcCallStatus,
    RpcStats,
    RpcOptions,
    ClientRpcInvoker,
    ServerRpcInvoker
} from '../types/RpcTypes';
import { MessageType, RpcTarget } from '../types/NetworkTypes';

/**
 * 网络发送器接口
 */
export interface NetworkSender {
    sendMessage(message: object): Promise<void>;
}

/**
 * RPC调用代理事件
 */
export interface RpcCallProxyEvents {
    callSent: (request: RpcCallRequest) => void;
    responseReceived: (response: RpcCallResponse) => void;
    callTimeout: (callId: string) => void;
    callFailed: (callId: string, error: RpcError) => void;
    retryAttempt: (callId: string, attempt: number) => void;
}

/**
 * RPC调用代理配置
 */
export interface RpcCallProxyConfig {
    /** 默认超时时间(毫秒) */
    defaultTimeout: number;
    /** 最大重试次数 */
    maxRetries: number;
    /** 重试延迟基数(毫秒) */
    retryDelayBase: number;
    /** 重试延迟倍数 */
    retryDelayMultiplier: number;
    /** 最大重试延迟(毫秒) */
    maxRetryDelay: number;
    /** 是否启用离线队列 */
    enableOfflineQueue: boolean;
    /** 离线队列最大大小 */
    maxOfflineQueueSize: number;
    /** 调用ID生成器 */
    generateCallId?: () => string;
}

/**
 * RPC调用代理
 * 负责发送RPC调用并处理响应
 */
export class RpcCallProxy extends EventEmitter {
    private logger = createLogger('RpcCallProxy');
    private config: RpcCallProxyConfig;
    private networkSender: NetworkSender;

    /** 待处理的调用 */
    private pendingCalls = new Map<string, RpcCallInfo>();

    /** 离线队列 */
    private offlineQueue: RpcCallRequest[] = [];

    /** 是否在线 */
    private isOnline = true;

    /** 统计信息 */
    private stats: RpcStats = {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        averageResponseTime: 0,
        pendingCalls: 0,
        timeoutCalls: 0,
        retryCount: 0,
        lastUpdated: Date.now()
    };

    /** 重试定时器 */
    private retryTimers = new Map<string, ReturnType<typeof setTimeout>>();

    constructor(
        networkSender: NetworkSender,
        config: Partial<RpcCallProxyConfig> = {}
    ) {
        super();

        this.networkSender = networkSender;
        this.config = {
            defaultTimeout: 30000,
            maxRetries: 3,
            retryDelayBase: 1000,
            retryDelayMultiplier: 2,
            maxRetryDelay: 10000,
            enableOfflineQueue: true,
            maxOfflineQueueSize: 100,
            generateCallId: () => `rpc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...config
        };
    }

    /**
     * 客户端RPC调用器
     */
    public get clientRpc(): ClientRpcInvoker {
        return <TArgs extends readonly unknown[], TReturn>(
            methodName: string,
            args: TArgs,
            options?: Partial<RpcOptions>
        ): Promise<TReturn> => {
            return this.call(methodName, args, options);
        };
    }

    /**
     * 服务端RPC调用器（用于服务端调用客户端）
     */
    public get serverRpc(): ServerRpcInvoker {
        return <TArgs extends readonly unknown[], TReturn>(
            clientId: string,
            methodName: string,
            args: TArgs,
            options?: Partial<RpcOptions>
        ): Promise<TReturn> => {
            const callOptions = {
                ...options,
                target: RpcTarget.Client
            };
            return this.call(methodName, args, callOptions, clientId);
        };
    }

    /**
     * 发起RPC调用
     */
    public async call<TArgs extends readonly unknown[], TReturn>(
        methodName: string,
        args: TArgs,
        options: Partial<RpcOptions> = {},
        targetId?: string
    ): Promise<TReturn> {
        const callId = this.config.generateCallId!();
        const timeout = options.timeout || this.config.defaultTimeout;

        const request: RpcCallRequest<TArgs> = {
            callId,
            methodName,
            args,
            senderId: 'client', // 这应该从认证系统获取
            targetId,
            timestamp: Date.now(),
            options: {
                reliable: true,
                priority: 5,
                timeout,
                ...options
            }
        };

        // 创建Promise和调用信息
        return new Promise<TReturn>((resolve, reject) => {
            const callInfo: RpcCallInfo<TArgs> = {
                request,
                status: RpcCallStatus.PENDING,
                resolve: resolve as (value: unknown) => void,
                reject: (reason: RpcError) => reject(reason),
                retryCount: 0,
                createdAt: Date.now()
            };

            this.pendingCalls.set(callId, callInfo);
            this.stats.pendingCalls++;
            this.stats.totalCalls++;

            // 设置超时
            setTimeout(() => {
                this.handleTimeout(callId);
            }, timeout);

            // 发送调用
            this.sendCall(callInfo);
        });
    }

    /**
     * 处理RPC响应
     */
    public handleResponse(response: RpcCallResponse): void {
        const callInfo = this.pendingCalls.get(response.callId);
        if (!callInfo) {
            this.logger.warn(`收到未知调用的响应: ${response.callId}`);
            return;
        }

        // 清理定时器
        const timer = this.retryTimers.get(response.callId);
        if (timer) {
            clearTimeout(timer);
            this.retryTimers.delete(response.callId);
        }

        // 更新状态
        callInfo.status = response.success ? RpcCallStatus.COMPLETED : RpcCallStatus.FAILED;
        callInfo.completedAt = Date.now();

        // 更新统计
        if (response.success) {
            this.stats.successfulCalls++;
            this.updateAverageResponseTime(response.duration);
        } else {
            this.stats.failedCalls++;
        }

        this.stats.pendingCalls--;

        // 处理结果
        if (response.success) {
            callInfo.resolve!(response.result);
        } else {
            callInfo.reject!(response.error!);
            this.emit('callFailed', response.callId, response.error!);
        }

        // 清理
        this.pendingCalls.delete(response.callId);
        this.emit('responseReceived', response);
    }

    /**
     * 设置网络状态
     */
    public setOnlineStatus(online: boolean): void {
        const wasOnline = this.isOnline;
        this.isOnline = online;

        if (online && !wasOnline) {
            // 从离线状态恢复，处理离线队列
            this.processOfflineQueue();
        }
    }

    /**
     * 取消RPC调用
     */
    public cancelCall(callId: string): boolean {
        const callInfo = this.pendingCalls.get(callId);
        if (!callInfo) {
            return false;
        }

        // 清理定时器
        const timer = this.retryTimers.get(callId);
        if (timer) {
            clearTimeout(timer);
            this.retryTimers.delete(callId);
        }

        // 更新状态
        callInfo.status = RpcCallStatus.CANCELLED;

        // 拒绝Promise
        callInfo.reject!({
            type: RpcErrorType.CLIENT_ERROR,
            message: '调用被取消'
        });

        // 清理
        this.pendingCalls.delete(callId);
        this.stats.pendingCalls--;

        return true;
    }

    /**
     * 获取统计信息
     */
    public getStats(): RpcStats {
        this.stats.lastUpdated = Date.now();
        return { ...this.stats };
    }

    /**
     * 获取待处理的调用
     */
    public getPendingCalls(): RpcCallInfo[] {
        return Array.from(this.pendingCalls.values());
    }

    /**
     * 重置统计信息
     */
    public resetStats(): void {
        this.stats = {
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            averageResponseTime: 0,
            pendingCalls: this.pendingCalls.size,
            timeoutCalls: 0,
            retryCount: 0,
            lastUpdated: Date.now()
        };
    }

    /**
     * 更新配置
     */
    public updateConfig(newConfig: Partial<RpcCallProxyConfig>): void {
        Object.assign(this.config, newConfig);
    }

    /**
     * 销毁代理
     */
    public destroy(): void {
        // 取消所有待处理的调用
        const pendingCallIds = Array.from(this.pendingCalls.keys());
        for (const callId of pendingCallIds) {
            this.cancelCall(callId);
        }

        // 清理定时器
        for (const timer of this.retryTimers.values()) {
            clearTimeout(timer);
        }
        this.retryTimers.clear();

        // 清理队列
        this.offlineQueue.length = 0;

        this.removeAllListeners();
    }

    /**
     * 发送调用
     */
    private async sendCall<T extends readonly unknown[]>(callInfo: RpcCallInfo<T>): Promise<void> {
        try {
            // 检查网络状态
            if (!this.isOnline) {
                if (this.config.enableOfflineQueue) {
                    this.addToOfflineQueue(callInfo.request);
                } else {
                    throw new Error('网络不可用');
                }
                return;
            }

            // 构建网络消息
            const message = {
                type: MessageType.RPC_CALL,
                messageId: callInfo.request.callId,
                timestamp: Date.now(),
                senderId: callInfo.request.senderId,
                data: callInfo.request,
                reliable: callInfo.request.options.reliable,
                priority: callInfo.request.options.priority
            };

            // 发送消息
            await this.networkSender.sendMessage(message);

            callInfo.status = RpcCallStatus.SENT;
            callInfo.sentAt = Date.now();

            this.emit('callSent', callInfo.request);

        } catch (error) {
            this.logger.error(`发送RPC调用失败: ${callInfo.request.methodName}`, error);

            // 检查是否可以重试
            if (callInfo.retryCount < this.config.maxRetries) {
                this.scheduleRetry(callInfo);
            } else {
                this.handleCallFailure(callInfo, {
                    type: RpcErrorType.NETWORK_ERROR,
                    message: String(error)
                });
            }
        }
    }

    /**
     * 处理超时
     */
    private handleTimeout(callId: string): void {
        const callInfo = this.pendingCalls.get(callId);
        if (!callInfo || callInfo.status === RpcCallStatus.COMPLETED) {
            return;
        }

        // 检查是否可以重试
        if (callInfo.retryCount < this.config.maxRetries) {
            this.scheduleRetry(callInfo);
        } else {
            this.stats.timeoutCalls++;
            this.handleCallFailure(callInfo, {
                type: RpcErrorType.TIMEOUT,
                message: `调用超时: ${callInfo.request.options.timeout}ms`
            });
            this.emit('callTimeout', callId);
        }
    }

    /**
     * 安排重试
     */
    private scheduleRetry<T extends readonly unknown[]>(callInfo: RpcCallInfo<T>): void {
        callInfo.retryCount++;
        this.stats.retryCount++;

        // 计算延迟时间（指数退避）
        const baseDelay = this.config.retryDelayBase * Math.pow(this.config.retryDelayMultiplier, callInfo.retryCount - 1);
        const delay = Math.min(baseDelay, this.config.maxRetryDelay);

        callInfo.nextRetryTime = Date.now() + delay;

        this.emit('retryAttempt', callInfo.request.callId, callInfo.retryCount);

        const timer = setTimeout(() => {
            this.retryTimers.delete(callInfo.request.callId);
            this.sendCall(callInfo);
        }, delay);

        this.retryTimers.set(callInfo.request.callId, timer);
    }

    /**
     * 处理调用失败
     */
    private handleCallFailure<T extends readonly unknown[]>(callInfo: RpcCallInfo<T>, error: RpcError): void {
        callInfo.status = RpcCallStatus.FAILED;
        callInfo.completedAt = Date.now();

        callInfo.reject!(error);

        this.pendingCalls.delete(callInfo.request.callId);
        this.stats.pendingCalls--;
        this.stats.failedCalls++;

        this.emit('callFailed', callInfo.request.callId, error);
    }

    /**
     * 添加到离线队列
     */
    private addToOfflineQueue<T extends readonly unknown[]>(request: RpcCallRequest<T>): void {
        if (this.offlineQueue.length >= this.config.maxOfflineQueueSize) {
            // 移除最旧的请求
            this.offlineQueue.shift();
        }

        this.offlineQueue.push(request);
    }

    /**
     * 处理离线队列
     */
    private async processOfflineQueue(): Promise<void> {
        if (!this.isOnline || this.offlineQueue.length === 0) {
            return;
        }

        const queue = [...this.offlineQueue];
        this.offlineQueue.length = 0;

        for (const request of queue) {
            try {
                // 重新创建调用信息
                const callInfo: RpcCallInfo = {
                    request,
                    status: RpcCallStatus.PENDING,
                    retryCount: 0,
                    createdAt: Date.now()
                };

                this.pendingCalls.set(request.callId, callInfo);
                await this.sendCall(callInfo);

            } catch (error) {
                this.logger.error(`处理离线队列失败: ${request.methodName}`, error);
            }
        }
    }

    /**
     * 更新平均响应时间
     */
    private updateAverageResponseTime(responseTime: number): void {
        const totalResponses = this.stats.successfulCalls;
        const currentAverage = this.stats.averageResponseTime;

        this.stats.averageResponseTime =
            (currentAverage * (totalResponses - 1) + responseTime) / totalResponses;
    }
}
