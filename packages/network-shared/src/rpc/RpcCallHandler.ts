import { createLogger } from '@esengine/ecs-framework';
import { EventEmitter } from '../utils/EventEmitter';
import { 
    RpcCallRequest, 
    RpcCallResponse, 
    RpcError, 
    RpcErrorType,
    RpcStats,
    RpcMethodMetadata
} from '../types/RpcTypes';
import { RpcMetadataManager } from './RpcMetadataManager';

/**
 * RPC调用统计信息
 */
interface CallStats {
    startTime: number;
    endTime?: number;
    duration?: number;
    success: boolean;
    error?: RpcError;
}

/**
 * 速率限制器
 */
interface RateLimiter {
    calls: number[];
    limit: number;
    window: number; // 时间窗口(毫秒)
}

/**
 * RPC调用处理器事件
 */
export interface RpcCallHandlerEvents {
    callStarted: (request: RpcCallRequest) => void;
    callCompleted: (request: RpcCallRequest, response: RpcCallResponse) => void;
    callFailed: (request: RpcCallRequest, error: RpcError) => void;
    rateLimitExceeded: (methodName: string, senderId: string) => void;
    permissionDenied: (methodName: string, senderId: string) => void;
}

/**
 * RPC调用处理器配置
 */
export interface RpcCallHandlerConfig {
    /** 最大并发调用数 */
    maxConcurrentCalls: number;
    /** 默认超时时间(毫秒) */
    defaultTimeout: number;
    /** 是否启用速率限制 */
    enableRateLimit: boolean;
    /** 是否启用权限检查 */
    enablePermissionCheck: boolean;
    /** 是否启用性能监控 */
    enablePerformanceMonitoring: boolean;
    /** 统计数据保留时间(毫秒) */
    statsRetentionTime: number;
}

/**
 * RPC调用处理器
 * 负责处理来自客户端的RPC调用请求
 */
export class RpcCallHandler extends EventEmitter {
    private logger = createLogger('RpcCallHandler');
    private config: RpcCallHandlerConfig;
    private metadataManager: RpcMetadataManager;
    
    /** 当前活跃的调用 */
    private activeCalls = new Map<string, CallStats>();
    
    /** 速率限制器 */
    private rateLimiters = new Map<string, RateLimiter>();
    
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
    
    /** 历史调用统计 */
    private callHistory: CallStats[] = [];
    
    /** 权限检查器 */
    private permissionChecker?: (methodName: string, senderId: string) => boolean;

    constructor(
        metadataManager: RpcMetadataManager,
        config: Partial<RpcCallHandlerConfig> = {}
    ) {
        super();
        
        this.metadataManager = metadataManager;
        this.config = {
            maxConcurrentCalls: 100,
            defaultTimeout: 30000,
            enableRateLimit: true,
            enablePermissionCheck: true,
            enablePerformanceMonitoring: true,
            statsRetentionTime: 300000, // 5分钟
            ...config
        };
    }

    /**
     * 设置权限检查器
     */
    public setPermissionChecker(checker: (methodName: string, senderId: string) => boolean): void {
        this.permissionChecker = checker;
    }

    /**
     * 处理RPC调用请求
     */
    public async handleCall<T extends readonly unknown[], R>(
        request: RpcCallRequest<T>
    ): Promise<RpcCallResponse<R>> {
        const startTime = Date.now();
        const callStats: CallStats = {
            startTime,
            success: false
        };
        
        this.activeCalls.set(request.callId, callStats);
        this.stats.pendingCalls++;
        this.emit('callStarted', request);
        
        try {
            // 1. 检查并发限制
            if (this.activeCalls.size > this.config.maxConcurrentCalls) {
                throw this.createError(
                    RpcErrorType.RATE_LIMITED,
                    `超过最大并发调用数限制: ${this.config.maxConcurrentCalls}`
                );
            }
            
            // 2. 获取方法元数据
            const metadata = this.metadataManager.getMethodMetadata(request.methodName);
            if (!metadata) {
                throw this.createError(
                    RpcErrorType.METHOD_NOT_FOUND,
                    `RPC方法不存在: ${request.methodName}`
                );
            }
            
            // 3. 验证方法调用
            const validation = this.metadataManager.validateMethodCall(
                request.methodName,
                Array.from(request.args),
                request.senderId
            );
            
            if (!validation.valid) {
                throw this.createError(
                    RpcErrorType.INVALID_ARGUMENTS,
                    validation.error || '参数验证失败'
                );
            }
            
            // 4. 权限检查
            if (this.config.enablePermissionCheck && !this.checkPermission(metadata, request.senderId)) {
                this.emit('permissionDenied', request.methodName, request.senderId);
                throw this.createError(
                    RpcErrorType.PERMISSION_DENIED,
                    `没有调用权限: ${request.methodName}`
                );
            }
            
            // 5. 速率限制检查
            if (this.config.enableRateLimit && !this.checkRateLimit(metadata, request.senderId)) {
                this.emit('rateLimitExceeded', request.methodName, request.senderId);
                throw this.createError(
                    RpcErrorType.RATE_LIMITED,
                    `调用频率超限: ${request.methodName}`
                );
            }
            
            // 6. 执行方法调用
            const handler = this.metadataManager.getMethodHandler(request.methodName);
            if (!handler) {
                throw this.createError(
                    RpcErrorType.SERVER_ERROR,
                    `方法处理器不存在: ${request.methodName}`
                );
            }
            
            // 创建带超时的Promise
            const timeout = request.options.timeout || metadata.options.timeout || this.config.defaultTimeout;
            const result = await this.executeWithTimeout(handler, request.args, timeout);
            
            // 7. 创建成功响应
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            callStats.endTime = endTime;
            callStats.duration = duration;
            callStats.success = true;
            
            const response: RpcCallResponse<R> = {
                callId: request.callId,
                success: true,
                result: result as R,
                timestamp: endTime,
                duration
            };
            
            this.updateStats(callStats);
            this.emit('callCompleted', request, response);
            
            return response;
            
        } catch (error) {
            // 8. 处理错误
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            const rpcError = error instanceof Error && 'type' in error 
                ? error as RpcError
                : this.createError(RpcErrorType.SERVER_ERROR, String(error));
            
            callStats.endTime = endTime;
            callStats.duration = duration;
            callStats.error = rpcError;
            
            const response: RpcCallResponse<R> = {
                callId: request.callId,
                success: false,
                error: rpcError,
                timestamp: endTime,
                duration
            };
            
            this.updateStats(callStats);
            this.emit('callFailed', request, rpcError);
            
            return response;
            
        } finally {
            // 9. 清理
            this.activeCalls.delete(request.callId);
            this.stats.pendingCalls--;
            this.addToHistory(callStats);
        }
    }

    /**
     * 获取统计信息
     */
    public getStats(): RpcStats {
        this.stats.lastUpdated = Date.now();
        return { ...this.stats };
    }

    /**
     * 获取当前活跃调用数
     */
    public getActiveCalls(): number {
        return this.activeCalls.size;
    }

    /**
     * 获取方法调用历史
     */
    public getCallHistory(methodName?: string, limit: number = 100): CallStats[] {
        let history = [...this.callHistory];
        
        if (methodName) {
            // 这里需要扩展CallStats接口来包含methodName
            // 暂时返回所有历史
        }
        
        return history.slice(-limit);
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
            pendingCalls: this.activeCalls.size,
            timeoutCalls: 0,
            retryCount: 0,
            lastUpdated: Date.now()
        };
        
        this.callHistory.length = 0;
        this.rateLimiters.clear();
    }

    /**
     * 更新配置
     */
    public updateConfig(newConfig: Partial<RpcCallHandlerConfig>): void {
        Object.assign(this.config, newConfig);
    }

    /**
     * 销毁处理器
     */
    public destroy(): void {
        this.activeCalls.clear();
        this.rateLimiters.clear();
        this.callHistory.length = 0;
        this.removeAllListeners();
    }

    /**
     * 检查权限
     */
    private checkPermission(metadata: RpcMethodMetadata, senderId: string): boolean {
        // 如果方法不需要认证，直接通过
        if (!metadata.options.requireAuth) {
            return true;
        }
        
        // 使用自定义权限检查器
        if (this.permissionChecker) {
            return this.permissionChecker(metadata.methodName, senderId);
        }
        
        // 默认：需要认证但没有检查器，拒绝访问
        return false;
    }

    /**
     * 检查速率限制
     */
    private checkRateLimit(metadata: RpcMethodMetadata, senderId: string): boolean {
        const rateLimit = metadata.options.rateLimit;
        if (!rateLimit) {
            return true;
        }
        
        const key = `${senderId}:${metadata.methodName}`;
        let limiter = this.rateLimiters.get(key);
        
        if (!limiter) {
            limiter = {
                calls: [],
                limit: rateLimit,
                window: 60000 // 1分钟窗口
            };
            this.rateLimiters.set(key, limiter);
        }
        
        const now = Date.now();
        
        // 清理过期的调用记录
        limiter.calls = limiter.calls.filter(time => now - time < limiter.window);
        
        // 检查是否超限
        if (limiter.calls.length >= limiter.limit) {
            return false;
        }
        
        // 记录本次调用
        limiter.calls.push(now);
        return true;
    }

    /**
     * 执行带超时的方法调用
     */
    private async executeWithTimeout(
        handler: Function,
        args: readonly unknown[],
        timeout: number
    ): Promise<unknown> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(this.createError(
                    RpcErrorType.TIMEOUT,
                    `方法调用超时: ${timeout}ms`
                ));
            }, timeout);
            
            Promise.resolve(handler(...args))
                .then(result => {
                    clearTimeout(timer);
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timer);
                    reject(error);
                });
        });
    }

    /**
     * 创建RPC错误
     */
    private createError(type: RpcErrorType, message: string, code?: number): RpcError {
        return {
            type,
            message,
            code
        };
    }

    /**
     * 更新统计信息
     */
    private updateStats(callStats: CallStats): void {
        this.stats.totalCalls++;
        
        if (callStats.success) {
            this.stats.successfulCalls++;
        } else {
            this.stats.failedCalls++;
            
            if (callStats.error?.type === RpcErrorType.TIMEOUT) {
                this.stats.timeoutCalls++;
            }
        }
        
        // 更新平均响应时间
        if (callStats.duration !== undefined) {
            const totalTime = this.stats.averageResponseTime * (this.stats.totalCalls - 1) + callStats.duration;
            this.stats.averageResponseTime = totalTime / this.stats.totalCalls;
        }
    }

    /**
     * 添加到历史记录
     */
    private addToHistory(callStats: CallStats): void {
        if (!this.config.enablePerformanceMonitoring) {
            return;
        }
        
        this.callHistory.push(callStats);
        
        // 清理过期的历史记录
        const cutoffTime = Date.now() - this.config.statsRetentionTime;
        this.callHistory = this.callHistory.filter(stats => stats.startTime > cutoffTime);
        
        // 限制历史记录数量
        if (this.callHistory.length > 10000) {
            this.callHistory = this.callHistory.slice(-5000);
        }
    }
}