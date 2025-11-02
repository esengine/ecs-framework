/**
 * 网络错误处理器
 * 提供统一的错误处理、分类和恢复策略
 */
import { createLogger } from '@esengine/ecs-framework';
import { NetworkErrorType, INetworkError } from '../types/NetworkTypes';

/**
 * 错误严重级别
 */
export enum ErrorSeverity {
    Low = 'low',           // 低级错误，可以忽略
    Medium = 'medium',     // 中级错误，需要记录但不影响功能
    High = 'high',         // 高级错误，影响功能但可以恢复
    Critical = 'critical'  // 严重错误，需要立即处理
}

/**
 * 错误恢复策略
 */
export enum RecoveryStrategy {
    Ignore = 'ignore',           // 忽略错误
    Retry = 'retry',            // 重试操作
    Reconnect = 'reconnect',    // 重新连接
    Restart = 'restart',        // 重启服务
    Escalate = 'escalate'       // 上报错误
}

/**
 * 错误处理配置
 */
export interface ErrorHandlerConfig {
    maxRetryAttempts: number;
    retryDelay: number;
    enableAutoRecovery: boolean;
    enableErrorReporting: boolean;
    errorReportingEndpoint?: string;
}

/**
 * 错误统计信息
 */
export interface ErrorStats {
    totalErrors: number;
    errorsByType: Record<NetworkErrorType, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recoveredErrors: number;
    unrecoveredErrors: number;
    lastError?: INetworkError;
}

/**
 * 错误处理事件
 */
export interface ErrorHandlerEvents {
    errorOccurred: (error: INetworkError, severity: ErrorSeverity) => void;
    errorRecovered: (error: INetworkError, strategy: RecoveryStrategy) => void;
    errorUnrecoverable: (error: INetworkError) => void;
    criticalError: (error: INetworkError) => void;
}

/**
 * 网络错误处理器
 */
export class ErrorHandler {
    private logger = createLogger('ErrorHandler');
    private config: ErrorHandlerConfig;
    private stats: ErrorStats;
    private eventHandlers: Partial<ErrorHandlerEvents> = {};

    // 错误恢复状态
    private retryAttempts: Map<string, number> = new Map();
    private pendingRecoveries: Set<string> = new Set();

    // 错误分类规则
    private severityRules: Map<NetworkErrorType, ErrorSeverity> = new Map();
    private recoveryRules: Map<NetworkErrorType, RecoveryStrategy> = new Map();

    /**
     * 构造函数
     */
    constructor(config: Partial<ErrorHandlerConfig> = {}) {
        this.config = {
            maxRetryAttempts: 3,
            retryDelay: 1000,
            enableAutoRecovery: true,
            enableErrorReporting: false,
            ...config
        };

        this.stats = {
            totalErrors: 0,
            errorsByType: {} as Record<NetworkErrorType, number>,
            errorsBySeverity: {} as Record<ErrorSeverity, number>,
            recoveredErrors: 0,
            unrecoveredErrors: 0
        };

        this.initializeDefaultRules();
    }

    /**
     * 处理错误
     */
    handleError(error: Error | INetworkError, context?: string): void {
        const networkError = this.normalizeError(error, context);
        const severity = this.classifyErrorSeverity(networkError);

        // 更新统计
        this.updateStats(networkError, severity);

        this.logger.error(`网络错误 [${severity}]: ${networkError.message}`, {
            type: networkError.type,
            code: networkError.code,
            details: networkError.details,
            context
        });

        // 触发错误事件
        this.eventHandlers.errorOccurred?.(networkError, severity);

        // 处理严重错误
        if (severity === ErrorSeverity.Critical) {
            this.eventHandlers.criticalError?.(networkError);
        }

        // 尝试自动恢复
        if (this.config.enableAutoRecovery) {
            this.attemptRecovery(networkError, severity);
        }

        // 错误报告
        if (this.config.enableErrorReporting) {
            this.reportError(networkError, severity);
        }
    }

    /**
     * 设置错误分类规则
     */
    setErrorSeverityRule(errorType: NetworkErrorType, severity: ErrorSeverity): void {
        this.severityRules.set(errorType, severity);
    }

    /**
     * 设置错误恢复策略
     */
    setRecoveryStrategy(errorType: NetworkErrorType, strategy: RecoveryStrategy): void {
        this.recoveryRules.set(errorType, strategy);
    }

    /**
     * 获取错误统计
     */
    getStats(): ErrorStats {
        return { ...this.stats };
    }

    /**
     * 重置统计信息
     */
    resetStats(): void {
        this.stats = {
            totalErrors: 0,
            errorsByType: {} as Record<NetworkErrorType, number>,
            errorsBySeverity: {} as Record<ErrorSeverity, number>,
            recoveredErrors: 0,
            unrecoveredErrors: 0
        };
        this.retryAttempts.clear();
        this.pendingRecoveries.clear();
    }

    /**
     * 设置事件处理器
     */
    on<K extends keyof ErrorHandlerEvents>(event: K, handler: ErrorHandlerEvents[K]): void {
        this.eventHandlers[event] = handler;
    }

    /**
     * 移除事件处理器
     */
    off<K extends keyof ErrorHandlerEvents>(event: K): void {
        delete this.eventHandlers[event];
    }

    /**
     * 更新配置
     */
    updateConfig(newConfig: Partial<ErrorHandlerConfig>): void {
        Object.assign(this.config, newConfig);
        this.logger.info('错误处理器配置已更新:', newConfig);
    }

    /**
     * 手动标记错误已恢复
     */
    markErrorRecovered(errorId: string): void {
        this.retryAttempts.delete(errorId);
        this.pendingRecoveries.delete(errorId);
        this.stats.recoveredErrors++;
    }

    /**
     * 检查错误是否可恢复
     */
    isRecoverable(errorType: NetworkErrorType): boolean {
        const strategy = this.recoveryRules.get(errorType);
        return strategy !== undefined && strategy !== RecoveryStrategy.Ignore;
    }

    /**
     * 标准化错误对象
     */
    private normalizeError(error: Error | INetworkError, context?: string): INetworkError {
        if ('type' in error && 'message' in error && 'timestamp' in error) {
            return error as INetworkError;
        }

        // 将普通Error转换为INetworkError
        return {
            type: this.determineErrorType(error),
            message: error.message || '未知错误',
            code: (error as any).code,
            details: {
                context,
                stack: error.stack,
                name: error.name
            },
            timestamp: Date.now()
        };
    }

    /**
     * 确定错误类型
     */
    private determineErrorType(error: Error): NetworkErrorType {
        const message = error.message.toLowerCase();

        if (message.includes('timeout')) {
            return NetworkErrorType.TIMEOUT;
        } else if (message.includes('connection')) {
            return NetworkErrorType.CONNECTION_LOST;
        } else if (message.includes('auth')) {
            return NetworkErrorType.AUTHENTICATION_FAILED;
        } else if (message.includes('permission')) {
            return NetworkErrorType.PERMISSION_DENIED;
        } else if (message.includes('rate') || message.includes('limit')) {
            return NetworkErrorType.RATE_LIMITED;
        } else if (message.includes('invalid') || message.includes('format')) {
            return NetworkErrorType.INVALID_MESSAGE;
        } else {
            return NetworkErrorType.UNKNOWN;
        }
    }

    /**
     * 分类错误严重程度
     */
    private classifyErrorSeverity(error: INetworkError): ErrorSeverity {
        // 使用自定义规则
        const customSeverity = this.severityRules.get(error.type);
        if (customSeverity) {
            return customSeverity;
        }

        // 默认分类规则
        switch (error.type) {
            case NetworkErrorType.CONNECTION_FAILED:
            case NetworkErrorType.CONNECTION_LOST:
                return ErrorSeverity.High;

            case NetworkErrorType.AUTHENTICATION_FAILED:
            case NetworkErrorType.PERMISSION_DENIED:
                return ErrorSeverity.Critical;

            case NetworkErrorType.TIMEOUT:
            case NetworkErrorType.RATE_LIMITED:
                return ErrorSeverity.Medium;

            case NetworkErrorType.INVALID_MESSAGE:
                return ErrorSeverity.Low;

            default:
                return ErrorSeverity.Medium;
        }
    }

    /**
     * 更新统计信息
     */
    private updateStats(error: INetworkError, severity: ErrorSeverity): void {
        this.stats.totalErrors++;
        this.stats.errorsByType[error.type] = (this.stats.errorsByType[error.type] || 0) + 1;
        this.stats.errorsBySeverity[severity] = (this.stats.errorsBySeverity[severity] || 0) + 1;
        this.stats.lastError = error;
    }

    /**
     * 尝试错误恢复
     */
    private attemptRecovery(error: INetworkError, severity: ErrorSeverity): void {
        const strategy = this.recoveryRules.get(error.type);
        if (!strategy || strategy === RecoveryStrategy.Ignore) {
            return;
        }

        const errorId = this.generateErrorId(error);

        // 检查是否已经在恢复中
        if (this.pendingRecoveries.has(errorId)) {
            return;
        }

        // 检查重试次数
        const retryCount = this.retryAttempts.get(errorId) || 0;
        if (retryCount >= this.config.maxRetryAttempts) {
            this.stats.unrecoveredErrors++;
            this.eventHandlers.errorUnrecoverable?.(error);
            return;
        }

        this.pendingRecoveries.add(errorId);
        this.retryAttempts.set(errorId, retryCount + 1);

        this.logger.info(`尝试错误恢复: ${strategy} (第 ${retryCount + 1} 次)`, {
            errorType: error.type,
            strategy
        });

        // 延迟执行恢复策略
        setTimeout(() => {
            this.executeRecoveryStrategy(error, strategy, errorId);
        }, this.config.retryDelay * (retryCount + 1));
    }

    /**
     * 执行恢复策略
     */
    private executeRecoveryStrategy(
        error: INetworkError,
        strategy: RecoveryStrategy,
        errorId: string
    ): void {
        try {
            switch (strategy) {
                case RecoveryStrategy.Retry:
                    // 这里应该重试导致错误的操作
                    // 具体实现需要外部提供重试回调
                    break;

                case RecoveryStrategy.Reconnect:
                    // 这里应该触发重连
                    // 具体实现需要外部处理
                    break;

                case RecoveryStrategy.Restart:
                    // 这里应该重启相关服务
                    // 具体实现需要外部处理
                    break;

                case RecoveryStrategy.Escalate:
                    // 上报错误给上层处理
                    this.logger.error('错误需要上层处理:', error);
                    break;
            }

            this.pendingRecoveries.delete(errorId);
            this.eventHandlers.errorRecovered?.(error, strategy);

        } catch (recoveryError) {
            this.logger.error('错误恢复失败:', recoveryError);
            this.pendingRecoveries.delete(errorId);
        }
    }

    /**
     * 报告错误
     */
    private async reportError(error: INetworkError, severity: ErrorSeverity): Promise<void> {
        if (!this.config.errorReportingEndpoint) {
            return;
        }

        try {
            const report = {
                error,
                severity,
                timestamp: Date.now(),
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
                url: typeof window !== 'undefined' ? window.location.href : 'server'
            };

            // 发送错误报告
            await fetch(this.config.errorReportingEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(report)
            });

        } catch (reportError) {
            this.logger.error('发送错误报告失败:', reportError);
        }
    }

    /**
     * 生成错误ID
     */
    private generateErrorId(error: INetworkError): string {
        return `${error.type}-${error.code || 'no-code'}-${error.timestamp}`;
    }

    /**
     * 初始化默认规则
     */
    private initializeDefaultRules(): void {
        // 默认严重程度规则
        this.severityRules.set(NetworkErrorType.CONNECTION_FAILED, ErrorSeverity.High);
        this.severityRules.set(NetworkErrorType.CONNECTION_LOST, ErrorSeverity.High);
        this.severityRules.set(NetworkErrorType.AUTHENTICATION_FAILED, ErrorSeverity.Critical);
        this.severityRules.set(NetworkErrorType.PERMISSION_DENIED, ErrorSeverity.Critical);
        this.severityRules.set(NetworkErrorType.TIMEOUT, ErrorSeverity.Medium);
        this.severityRules.set(NetworkErrorType.RATE_LIMITED, ErrorSeverity.Medium);
        this.severityRules.set(NetworkErrorType.INVALID_MESSAGE, ErrorSeverity.Low);

        // 默认恢复策略
        this.recoveryRules.set(NetworkErrorType.CONNECTION_FAILED, RecoveryStrategy.Reconnect);
        this.recoveryRules.set(NetworkErrorType.CONNECTION_LOST, RecoveryStrategy.Reconnect);
        this.recoveryRules.set(NetworkErrorType.TIMEOUT, RecoveryStrategy.Retry);
        this.recoveryRules.set(NetworkErrorType.RATE_LIMITED, RecoveryStrategy.Retry);
        this.recoveryRules.set(NetworkErrorType.INVALID_MESSAGE, RecoveryStrategy.Ignore);
        this.recoveryRules.set(NetworkErrorType.AUTHENTICATION_FAILED, RecoveryStrategy.Escalate);
        this.recoveryRules.set(NetworkErrorType.PERMISSION_DENIED, RecoveryStrategy.Escalate);
    }

    /**
     * 获取错误趋势分析
     */
    getErrorTrends() {
        const totalErrors = this.stats.totalErrors;
        if (totalErrors === 0) {
            return { trend: 'stable', recommendation: '系统运行正常' };
        }

        const criticalRate = (this.stats.errorsBySeverity[ErrorSeverity.Critical] || 0) / totalErrors;
        const recoveryRate = this.stats.recoveredErrors / totalErrors;

        if (criticalRate > 0.1) {
            return { trend: 'critical', recommendation: '存在严重错误，需要立即处理' };
        } else if (recoveryRate < 0.5) {
            return { trend: 'degrading', recommendation: '错误恢复率偏低，建议检查恢复策略' };
        } else if (totalErrors > 100) {
            return { trend: 'high_volume', recommendation: '错误量较大，建议分析根本原因' };
        } else {
            return { trend: 'stable', recommendation: '错误处理正常' };
        }
    }
}
