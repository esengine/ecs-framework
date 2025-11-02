/**
 * 重连管理器
 * 负责管理客户端的自动重连逻辑
 */
import { createLogger, ITimer } from '@esengine/ecs-framework';
import { ConnectionState } from '@esengine/network-shared';
import { NetworkTimerManager } from '../utils';

/**
 * 重连配置
 */
export interface ReconnectionConfig {
    enabled: boolean;
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffFactor: number;
    jitterEnabled: boolean;
    resetAfterSuccess: boolean;
}

/**
 * 重连状态
 */
export interface ReconnectionState {
    isReconnecting: boolean;
    currentAttempt: number;
    nextAttemptTime?: number;
    lastAttemptTime?: number;
    totalAttempts: number;
    successfulReconnections: number;
}

/**
 * 重连事件接口
 */
export interface ReconnectionEvents {
    reconnectStarted: (attempt: number) => void;
    reconnectSucceeded: (attempt: number, duration: number) => void;
    reconnectFailed: (attempt: number, error: Error) => void;
    reconnectAborted: (reason: string) => void;
    maxAttemptsReached: () => void;
}

/**
 * 重连策略
 */
export enum ReconnectionStrategy {
    Exponential = 'exponential',
    Linear = 'linear',
    Fixed = 'fixed',
    Custom = 'custom'
}

/**
 * 重连管理器
 */
export class ReconnectionManager {
    private logger = createLogger('ReconnectionManager');
    private config: ReconnectionConfig;
    private state: ReconnectionState;
    private eventHandlers: Partial<ReconnectionEvents> = {};

    private reconnectTimer?: ITimer;
    private reconnectCallback?: () => Promise<void>;
    private abortController?: AbortController;

    // 策略相关
    private strategy: ReconnectionStrategy = ReconnectionStrategy.Exponential;
    private customDelayCalculator?: (attempt: number) => number;

    /**
     * 构造函数
     */
    constructor(config: Partial<ReconnectionConfig> = {}) {
        this.config = {
            enabled: true,
            maxAttempts: 10,
            initialDelay: 1000,     // 1秒
            maxDelay: 30000,        // 30秒
            backoffFactor: 2,       // 指数退避因子
            jitterEnabled: true,    // 启用抖动
            resetAfterSuccess: true, // 成功后重置计数
            ...config
        };

        this.state = {
            isReconnecting: false,
            currentAttempt: 0,
            totalAttempts: 0,
            successfulReconnections: 0
        };
    }

    /**
     * 设置重连回调
     */
    setReconnectCallback(callback: () => Promise<void>): void {
        this.reconnectCallback = callback;
    }

    /**
     * 开始重连
     */
    startReconnection(): void {
        if (!this.config.enabled) {
            this.logger.info('重连已禁用');
            return;
        }

        if (this.state.isReconnecting) {
            this.logger.warn('重连已在进行中');
            return;
        }

        if (!this.reconnectCallback) {
            this.logger.error('重连回调未设置');
            return;
        }

        // 检查是否达到最大重连次数
        if (this.state.currentAttempt >= this.config.maxAttempts) {
            this.logger.error(`已达到最大重连次数: ${this.config.maxAttempts}`);
            this.eventHandlers.maxAttemptsReached?.();
            return;
        }

        this.state.isReconnecting = true;
        this.state.currentAttempt++;
        this.state.totalAttempts++;

        const delay = this.calculateDelay();
        this.state.nextAttemptTime = Date.now() + delay;

        this.logger.info(`开始重连 (第 ${this.state.currentAttempt}/${this.config.maxAttempts} 次)，${delay}ms 后尝试`);

        this.eventHandlers.reconnectStarted?.(this.state.currentAttempt);

        // 设置重连定时器
        this.reconnectTimer = NetworkTimerManager.schedule(
            delay / 1000, // 转为秒
            false, // 不重复
            this,
            () => {
                this.performReconnection();
            }
        );
    }

    /**
     * 停止重连
     */
    stopReconnection(reason: string = '用户主动停止'): void {
        if (!this.state.isReconnecting) {
            return;
        }

        this.clearReconnectTimer();
        this.abortController?.abort();
        this.state.isReconnecting = false;
        this.state.nextAttemptTime = undefined;

        this.logger.info(`重连已停止: ${reason}`);
        this.eventHandlers.reconnectAborted?.(reason);
    }

    /**
     * 重连成功
     */
    onReconnectionSuccess(): void {
        if (!this.state.isReconnecting) {
            return;
        }

        const duration = this.state.lastAttemptTime ? Date.now() - this.state.lastAttemptTime : 0;

        this.logger.info(`重连成功 (第 ${this.state.currentAttempt} 次尝试，耗时 ${duration}ms)`);

        this.state.isReconnecting = false;
        this.state.successfulReconnections++;
        this.state.nextAttemptTime = undefined;

        // 是否重置重连计数
        if (this.config.resetAfterSuccess) {
            this.state.currentAttempt = 0;
        }

        this.clearReconnectTimer();
        this.eventHandlers.reconnectSucceeded?.(this.state.currentAttempt, duration);
    }

    /**
     * 重连失败
     */
    onReconnectionFailure(error: Error): void {
        if (!this.state.isReconnecting) {
            return;
        }

        this.logger.warn(`重连失败 (第 ${this.state.currentAttempt} 次尝试):`, error);

        this.eventHandlers.reconnectFailed?.(this.state.currentAttempt, error);

        // 检查是否还有重连机会
        if (this.state.currentAttempt >= this.config.maxAttempts) {
            this.logger.error('重连次数已用完');
            this.state.isReconnecting = false;
            this.eventHandlers.maxAttemptsReached?.();
        } else {
            // 继续下一次重连
            this.startReconnection();
        }
    }

    /**
     * 获取重连状态
     */
    getState(): ReconnectionState {
        return { ...this.state };
    }

    /**
     * 获取重连统计
     */
    getStats() {
        return {
            totalAttempts: this.state.totalAttempts,
            successfulReconnections: this.state.successfulReconnections,
            currentAttempt: this.state.currentAttempt,
            maxAttempts: this.config.maxAttempts,
            isReconnecting: this.state.isReconnecting,
            nextAttemptTime: this.state.nextAttemptTime,
            successRate: this.state.totalAttempts > 0 ?
                (this.state.successfulReconnections / this.state.totalAttempts) * 100 : 0
        };
    }

    /**
     * 更新配置
     */
    updateConfig(newConfig: Partial<ReconnectionConfig>): void {
        Object.assign(this.config, newConfig);
        this.logger.info('重连配置已更新:', newConfig);
    }

    /**
     * 设置重连策略
     */
    setStrategy(strategy: ReconnectionStrategy, customCalculator?: (attempt: number) => number): void {
        this.strategy = strategy;
        if (strategy === ReconnectionStrategy.Custom && customCalculator) {
            this.customDelayCalculator = customCalculator;
        }
        this.logger.info(`重连策略已设置为: ${strategy}`);
    }

    /**
     * 设置事件处理器
     */
    on<K extends keyof ReconnectionEvents>(event: K, handler: ReconnectionEvents[K]): void {
        this.eventHandlers[event] = handler;
    }

    /**
     * 移除事件处理器
     */
    off<K extends keyof ReconnectionEvents>(event: K): void {
        delete this.eventHandlers[event];
    }

    /**
     * 重置重连状态
     */
    reset(): void {
        this.stopReconnection('状态重置');
        this.state = {
            isReconnecting: false,
            currentAttempt: 0,
            totalAttempts: 0,
            successfulReconnections: 0
        };
        this.logger.info('重连状态已重置');
    }

    /**
     * 强制立即重连
     */
    forceReconnect(): void {
        if (this.state.isReconnecting) {
            this.clearReconnectTimer();
            this.performReconnection();
        } else {
            this.startReconnection();
        }
    }

    /**
     * 计算重连延迟
     */
    private calculateDelay(): number {
        let delay: number;

        switch (this.strategy) {
            case ReconnectionStrategy.Fixed:
                delay = this.config.initialDelay;
                break;

            case ReconnectionStrategy.Linear:
                delay = this.config.initialDelay * this.state.currentAttempt;
                break;

            case ReconnectionStrategy.Exponential:
                delay = this.config.initialDelay * Math.pow(this.config.backoffFactor, this.state.currentAttempt - 1);
                break;

            case ReconnectionStrategy.Custom:
                delay = this.customDelayCalculator ?
                    this.customDelayCalculator(this.state.currentAttempt) :
                    this.config.initialDelay;
                break;

            default:
                delay = this.config.initialDelay;
        }

        // 限制最大延迟
        delay = Math.min(delay, this.config.maxDelay);

        // 添加抖动以避免雷群效应
        if (this.config.jitterEnabled) {
            const jitter = delay * 0.1 * Math.random(); // 10%的随机抖动
            delay += jitter;
        }

        return Math.round(delay);
    }

    /**
     * 执行重连
     */
    private async performReconnection(): Promise<void> {
        if (!this.reconnectCallback || !this.state.isReconnecting) {
            return;
        }

        this.state.lastAttemptTime = Date.now();
        this.abortController = new AbortController();

        try {
            await this.reconnectCallback();
            // 重连回调成功，等待实际连接建立再调用 onReconnectionSuccess

        } catch (error) {
            this.onReconnectionFailure(error as Error);
        }
    }

    /**
     * 清除重连定时器
     */
    private clearReconnectTimer(): void {
        if (this.reconnectTimer) {
            this.reconnectTimer.stop();
            this.reconnectTimer = undefined;
        }
    }

    /**
     * 检查是否应该进行重连
     */
    shouldReconnect(reason?: string): boolean {
        if (!this.config.enabled) {
            return false;
        }

        if (this.state.currentAttempt >= this.config.maxAttempts) {
            return false;
        }

        // 可以根据断开原因决定是否重连
        if (reason) {
            const noReconnectReasons = ['user_disconnect', 'invalid_credentials', 'banned'];
            if (noReconnectReasons.includes(reason)) {
                return false;
            }
        }

        return true;
    }

    /**
     * 获取下次重连的倒计时
     */
    getTimeUntilNextAttempt(): number {
        if (!this.state.nextAttemptTime) {
            return 0;
        }
        return Math.max(0, this.state.nextAttemptTime - Date.now());
    }

    /**
     * 获取重连进度百分比
     */
    getProgress(): number {
        if (this.config.maxAttempts === 0) {
            return 0;
        }
        return (this.state.currentAttempt / this.config.maxAttempts) * 100;
    }
}
