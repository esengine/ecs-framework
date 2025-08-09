/**
 * 网络错误处理系统
 */

import { ERROR_CODES, LOG_LEVELS } from '../constants/NetworkConstants';
import { NetworkErrorType, INetworkError, createNetworkError } from '../types/NetworkTypes';

/**
 * 错误处理器接口
 */
export interface IErrorHandler {
    /** 处理器名称 */
    readonly name: string;
    /** 是否可以处理该错误 */
    canHandle(error: INetworkError): boolean;
    /** 处理错误 */
    handle(error: INetworkError): Promise<boolean> | boolean;
    /** 优先级（数值越大优先级越高） */
    readonly priority: number;
}

/**
 * 错误处理选项
 */
export interface ErrorHandlingOptions {
    /** 是否自动重试 */
    autoRetry?: boolean;
    /** 最大重试次数 */
    maxRetries?: number;
    /** 重试延迟（毫秒） */
    retryDelay?: number;
    /** 是否记录错误日志 */
    logError?: boolean;
    /** 日志级别 */
    logLevel?: 'error' | 'warn' | 'info' | 'debug';
    /** 是否通知用户 */
    notifyUser?: boolean;
    /** 自定义处理函数 */
    customHandler?: ((error: INetworkError) => Promise<boolean> | boolean) | undefined;
}

/**
 * 错误统计信息
 */
export interface ErrorStats {
    /** 总错误数 */
    totalErrors: number;
    /** 按类型分组的错误数 */
    errorsByType: Map<NetworkErrorType, number>;
    /** 按错误代码分组的错误数 */
    errorsByCode: Map<string | number, number>;
    /** 最近的错误 */
    recentErrors: INetworkError[];
    /** 错误趋势（每小时） */
    hourlyTrend: number[];
}

/**
 * 网络错误处理器
 * 
 * 提供统一的错误处理、重试机制和错误统计功能
 */
export class NetworkErrorHandler {
    private static _instance: NetworkErrorHandler | null = null;
    private _handlers: IErrorHandler[] = [];
    private _stats: ErrorStats;
    private _options: Omit<Required<ErrorHandlingOptions>, 'customHandler'> & { customHandler?: (error: INetworkError) => Promise<boolean> | boolean };
    
    private readonly logger = {
        info: console.log,
        warn: console.warn,
        error: console.error,
        debug: console.debug
    };

    private constructor() {
        this._stats = {
            totalErrors: 0,
            errorsByType: new Map(),
            errorsByCode: new Map(),
            recentErrors: [],
            hourlyTrend: new Array(24).fill(0)
        };

        this._options = {
            autoRetry: true,
            maxRetries: 3,
            retryDelay: 1000,
            logError: true,
            logLevel: 'error' as const,
            notifyUser: false,
            customHandler: undefined
        };

        this.initializeDefaultHandlers();
    }

    public static get Instance(): NetworkErrorHandler {
        if (!NetworkErrorHandler._instance) {
            NetworkErrorHandler._instance = new NetworkErrorHandler();
        }
        return NetworkErrorHandler._instance;
    }

    /**
     * 处理网络错误
     */
    public async handleError(
        error: Error | INetworkError, 
        options?: Partial<ErrorHandlingOptions>
    ): Promise<boolean> {
        const networkError = this.ensureNetworkError(error);
        const handlingOptions = { ...this._options, ...options };

        // 更新统计信息
        this.updateStats(networkError);

        // 记录错误日志
        if (handlingOptions.logError) {
            this.logError(networkError, handlingOptions.logLevel);
        }

        // 执行自定义处理器
        if (handlingOptions.customHandler) {
            try {
                const handled = await handlingOptions.customHandler(networkError);
                if (handled) {
                    return true;
                }
            } catch (customError) {
                this.logger.error('自定义错误处理器失败:', customError);
            }
        }

        // 查找合适的处理器
        const handlers = this._handlers
            .filter(handler => handler.canHandle(networkError))
            .sort((a, b) => b.priority - a.priority);

        for (const handler of handlers) {
            try {
                const handled = await handler.handle(networkError);
                if (handled) {
                    this.logger.debug(`错误已被处理器 "${handler.name}" 处理`);
                    return true;
                }
            } catch (handlerError) {
                this.logger.error(`处理器 "${handler.name}" 执行失败:`, handlerError);
            }
        }

        // 自动重试机制
        if (handlingOptions.autoRetry && this.shouldRetry(networkError)) {
            return this.attemptRetry(networkError, handlingOptions);
        }

        // 通知用户
        if (handlingOptions.notifyUser) {
            this.notifyUser(networkError);
        }

        return false;
    }

    /**
     * 添加错误处理器
     */
    public addHandler(handler: IErrorHandler): void {
        this._handlers.push(handler);
        this._handlers.sort((a, b) => b.priority - a.priority);
        this.logger.debug(`添加错误处理器: ${handler.name} (优先级: ${handler.priority})`);
    }

    /**
     * 移除错误处理器
     */
    public removeHandler(name: string): boolean {
        const index = this._handlers.findIndex(handler => handler.name === name);
        if (index !== -1) {
            this._handlers.splice(index, 1);
            this.logger.debug(`移除错误处理器: ${name}`);
            return true;
        }
        return false;
    }

    /**
     * 设置默认处理选项
     */
    public setDefaultOptions(options: Partial<ErrorHandlingOptions>): void {
        this._options = { ...this._options, ...options };
    }

    /**
     * 获取错误统计信息
     */
    public getStats(): ErrorStats {
        return {
            totalErrors: this._stats.totalErrors,
            errorsByType: new Map(this._stats.errorsByType),
            errorsByCode: new Map(this._stats.errorsByCode),
            recentErrors: [...this._stats.recentErrors],
            hourlyTrend: [...this._stats.hourlyTrend]
        };
    }

    /**
     * 重置统计信息
     */
    public resetStats(): void {
        this._stats = {
            totalErrors: 0,
            errorsByType: new Map(),
            errorsByCode: new Map(),
            recentErrors: [],
            hourlyTrend: new Array(24).fill(0)
        };
    }

    /**
     * 创建网络错误
     */
    public createError(
        type: NetworkErrorType,
        message: string,
        context?: Record<string, unknown>
    ): INetworkError {
        return createNetworkError(type, message, context);
    }

    /**
     * 初始化默认错误处理器
     */
    private initializeDefaultHandlers(): void {
        // 连接错误处理器
        this.addHandler({
            name: 'connection-error-handler',
            priority: 80,
            canHandle: (error) => error.type === NetworkErrorType.CONNECTION_FAILED,
            handle: (error) => {
                this.logger.warn('连接失败，尝试重新连接:', error.message);
                return false; // 让重试机制处理
            }
        });

        // 序列化错误处理器
        this.addHandler({
            name: 'serialization-error-handler',
            priority: 70,
            canHandle: (error) => 
                error.type === NetworkErrorType.SERIALIZATION_FAILED || 
                error.type === NetworkErrorType.DESERIALIZATION_FAILED,
            handle: (error) => {
                this.logger.error('序列化/反序列化失败:', error.message);
                // 序列化错误通常不需要重试
                return true;
            }
        });

        // 权限错误处理器
        this.addHandler({
            name: 'permission-error-handler',
            priority: 60,
            canHandle: (error) => error.type === NetworkErrorType.PERMISSION_DENIED,
            handle: (error) => {
                this.logger.warn('权限被拒绝:', error.message);
                // 权限错误不应该重试
                return true;
            }
        });

        // 默认错误处理器
        this.addHandler({
            name: 'default-error-handler',
            priority: 0,
            canHandle: () => true,
            handle: (error) => {
                this.logger.error('未处理的网络错误:', error.message, error.context);
                return false;
            }
        });
    }

    /**
     * 确保错误是NetworkError类型
     */
    private ensureNetworkError(error: Error | INetworkError): INetworkError {
        if ('type' in error && 'timestamp' in error) {
            return error as INetworkError;
        }

        // 转换普通错误为网络错误
        return createNetworkError(
            NetworkErrorType.INVALID_DATA,
            error.message,
            { originalError: error.name }
        );
    }

    /**
     * 更新错误统计
     */
    private updateStats(error: INetworkError): void {
        this._stats.totalErrors++;

        // 按类型统计
        const typeCount = this._stats.errorsByType.get(error.type) || 0;
        this._stats.errorsByType.set(error.type, typeCount + 1);

        // 按错误代码统计
        if (error.code !== undefined) {
            const codeCount = this._stats.errorsByCode.get(error.code) || 0;
            this._stats.errorsByCode.set(error.code, codeCount + 1);
        }

        // 记录最近错误（保留最近100个）
        this._stats.recentErrors.push(error);
        if (this._stats.recentErrors.length > 100) {
            this._stats.recentErrors.shift();
        }

        // 更新小时趋势
        const currentHour = new Date().getHours();
        this._stats.hourlyTrend[currentHour]++;
    }

    /**
     * 记录错误日志
     */
    private logError(error: INetworkError, level: 'error' | 'warn' | 'info' | 'debug'): void {
        const logMessage = `[${error.type}] ${error.message}`;
        const logData = {
            error: error.message,
            type: error.type,
            code: error.code,
            context: error.context,
            timestamp: new Date(error.timestamp).toISOString()
        };

        switch (level) {
            case 'error':
                this.logger.error(logMessage, logData);
                break;
            case 'warn':
                this.logger.warn(logMessage, logData);
                break;
            case 'info':
                this.logger.info(logMessage, logData);
                break;
            case 'debug':
                this.logger.debug(logMessage, logData);
                break;
        }
    }

    /**
     * 判断是否应该重试
     */
    private shouldRetry(error: INetworkError): boolean {
        // 这些错误类型不应该重试
        const noRetryTypes = [
            NetworkErrorType.PERMISSION_DENIED,
            NetworkErrorType.SERIALIZATION_FAILED,
            NetworkErrorType.DESERIALIZATION_FAILED
        ];

        return !noRetryTypes.includes(error.type);
    }

    /**
     * 尝试重试
     */
    private async attemptRetry(
        error: INetworkError, 
        options: Omit<Required<ErrorHandlingOptions>, 'customHandler'> & { customHandler?: (error: INetworkError) => Promise<boolean> | boolean }
    ): Promise<boolean> {
        for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
            this.logger.info(`重试处理错误 (${attempt}/${options.maxRetries}):`, error.message);
            
            // 等待重试延迟
            await new Promise(resolve => setTimeout(resolve, options.retryDelay * attempt));
            
            try {
                // 这里应该有具体的重试逻辑，取决于错误类型
                // 目前返回false表示重试失败
                return false;
            } catch (retryError) {
                this.logger.error(`重试失败 (${attempt}):`, retryError);
            }
        }

        this.logger.error(`重试${options.maxRetries}次后仍然失败:`, error.message);
        return false;
    }

    /**
     * 通知用户
     */
    private notifyUser(error: INetworkError): void {
        // 这里可以实现用户通知逻辑
        // 例如显示弹窗、发送邮件等
        console.warn(`用户通知: ${error.message}`);
    }
}

/**
 * 错误处理器单例实例
 */
export const ErrorHandler = NetworkErrorHandler.Instance;