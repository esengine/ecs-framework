/**
 * 连接状态管理器
 * 负责跟踪连接状态变化、状态变化通知和自动恢复逻辑
 */
import { createLogger, ITimer } from '@esengine/ecs-framework';
import { ConnectionState, IConnectionStats, EventEmitter } from '@esengine/network-shared';
import { NetworkTimerManager } from '../utils';

/**
 * 状态转换规则
 */
export interface StateTransitionRule {
    from: ConnectionState;
    to: ConnectionState;
    condition?: () => boolean;
    action?: () => void;
}

/**
 * 连接状态管理器配置
 */
export interface ConnectionStateManagerConfig {
    enableAutoRecovery: boolean;
    recoveryTimeout: number;
    maxRecoveryAttempts: number;
    stateTimeout: number;
    enableStateValidation: boolean;
    logStateChanges: boolean;
}

/**
 * 状态历史记录
 */
export interface StateHistoryEntry {
    state: ConnectionState;
    timestamp: number;
    duration?: number;
    reason?: string;
    metadata?: Record<string, any>;
}

/**
 * 状态统计信息
 */
export interface StateStats {
    currentState: ConnectionState;
    totalTransitions: number;
    stateHistory: StateHistoryEntry[];
    stateDurations: Record<ConnectionState, number[]>;
    averageStateDurations: Record<ConnectionState, number>;
    totalUptime: number;
    totalDowntime: number;
    connectionAttempts: number;
    successfulConnections: number;
    failedConnections: number;
}

/**
 * 连接状态管理器事件接口
 */
export interface ConnectionStateManagerEvents {
    stateChanged: (oldState: ConnectionState, newState: ConnectionState, reason?: string) => void;
    stateTimeout: (state: ConnectionState, duration: number) => void;
    recoveryStarted: (attempt: number) => void;
    recoverySucceeded: () => void;
    recoveryFailed: (maxAttemptsReached: boolean) => void;
    invalidTransition: (from: ConnectionState, to: ConnectionState) => void;
}

/**
 * 连接状态管理器
 */
export class ConnectionStateManager extends EventEmitter {
    private logger = createLogger('ConnectionStateManager');
    private config: ConnectionStateManagerConfig;
    private currentState: ConnectionState = ConnectionState.Disconnected;
    private previousState?: ConnectionState;
    private stateStartTime: number = Date.now();
    private stats: StateStats;
    
    // 状态管理
    private stateHistory: StateHistoryEntry[] = [];
    private transitionRules: StateTransitionRule[] = [];
    private stateTimeouts: Map<ConnectionState, ITimer> = new Map();
    
    // 恢复逻辑
    private recoveryAttempts = 0;
    private recoveryTimer?: ITimer;
    
    // Timer管理器使用静态的NetworkTimerManager
    private recoveryCallback?: () => Promise<void>;
    
    // 事件处理器
    private eventHandlers: Partial<ConnectionStateManagerEvents> = {};

    /**
     * 构造函数
     */
    constructor(config: Partial<ConnectionStateManagerConfig> = {}) {
        super();

        this.config = {
            enableAutoRecovery: true,
            recoveryTimeout: 5000,
            maxRecoveryAttempts: 3,
            stateTimeout: 30000,
            enableStateValidation: true,
            logStateChanges: true,
            ...config
        };

        this.stats = {
            currentState: this.currentState,
            totalTransitions: 0,
            stateHistory: [],
            stateDurations: {
                [ConnectionState.Disconnected]: [],
                [ConnectionState.Connecting]: [],
                [ConnectionState.Connected]: [],
                [ConnectionState.Reconnecting]: [],
                [ConnectionState.Failed]: []
            },
            averageStateDurations: {
                [ConnectionState.Disconnected]: 0,
                [ConnectionState.Connecting]: 0,
                [ConnectionState.Connected]: 0,
                [ConnectionState.Reconnecting]: 0,
                [ConnectionState.Failed]: 0
            },
            totalUptime: 0,
            totalDowntime: 0,
            connectionAttempts: 0,
            successfulConnections: 0,
            failedConnections: 0
        };

        this.initializeDefaultTransitionRules();
    }

    /**
     * 设置当前状态
     */
    setState(newState: ConnectionState, reason?: string, metadata?: Record<string, any>): boolean {
        if (this.currentState === newState) {
            return true;
        }

        // 验证状态转换
        if (this.config.enableStateValidation && !this.isValidTransition(this.currentState, newState)) {
            this.logger.warn(`无效的状态转换: ${this.currentState} -> ${newState}`);
            this.eventHandlers.invalidTransition?.(this.currentState, newState);
            return false;
        }

        const oldState = this.currentState;
        const now = Date.now();
        const duration = now - this.stateStartTime;

        // 更新状态历史
        this.updateStateHistory(oldState, duration, reason, metadata);

        // 清理旧状态的超时定时器
        this.clearStateTimeout(oldState);

        // 更新当前状态
        this.previousState = oldState;
        this.currentState = newState;
        this.stateStartTime = now;
        this.stats.currentState = newState;
        this.stats.totalTransitions++;

        // 更新连接统计
        this.updateConnectionStats(oldState, newState);

        if (this.config.logStateChanges) {
            this.logger.info(`连接状态变化: ${oldState} -> ${newState}${reason ? ` (${reason})` : ''}`);
        }

        // 设置新状态的超时定时器
        this.setStateTimeout(newState);

        // 处理自动恢复逻辑
        this.handleAutoRecovery(newState);

        // 触发事件
        this.eventHandlers.stateChanged?.(oldState, newState, reason);
        this.emit('stateChanged', oldState, newState, reason);

        return true;
    }

    /**
     * 获取当前状态
     */
    getState(): ConnectionState {
        return this.currentState;
    }

    /**
     * 获取上一个状态
     */
    getPreviousState(): ConnectionState | undefined {
        return this.previousState;
    }

    /**
     * 获取当前状态持续时间
     */
    getCurrentStateDuration(): number {
        return Date.now() - this.stateStartTime;
    }

    /**
     * 获取状态统计信息
     */
    getStats(): StateStats {
        this.updateCurrentStats();
        return {
            ...this.stats,
            stateHistory: [...this.stateHistory]
        };
    }

    /**
     * 重置统计信息
     */
    resetStats(): void {
        this.stats = {
            currentState: this.currentState,
            totalTransitions: 0,
            stateHistory: [],
            stateDurations: {
                [ConnectionState.Disconnected]: [],
                [ConnectionState.Connecting]: [],
                [ConnectionState.Connected]: [],
                [ConnectionState.Reconnecting]: [],
                [ConnectionState.Failed]: []
            },
            averageStateDurations: {
                [ConnectionState.Disconnected]: 0,
                [ConnectionState.Connecting]: 0,
                [ConnectionState.Connected]: 0,
                [ConnectionState.Reconnecting]: 0,
                [ConnectionState.Failed]: 0
            },
            totalUptime: 0,
            totalDowntime: 0,
            connectionAttempts: 0,
            successfulConnections: 0,
            failedConnections: 0
        };

        this.stateHistory.length = 0;
        this.recoveryAttempts = 0;
    }

    /**
     * 设置恢复回调
     */
    setRecoveryCallback(callback: () => Promise<void>): void {
        this.recoveryCallback = callback;
    }

    /**
     * 添加状态转换规则
     */
    addTransitionRule(rule: StateTransitionRule): void {
        this.transitionRules.push(rule);
    }

    /**
     * 移除状态转换规则
     */
    removeTransitionRule(from: ConnectionState, to: ConnectionState): boolean {
        const index = this.transitionRules.findIndex(rule => rule.from === from && rule.to === to);
        if (index >= 0) {
            this.transitionRules.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * 检查状态转换是否有效
     */
    isValidTransition(from: ConnectionState, to: ConnectionState): boolean {
        // 检查自定义转换规则
        const rule = this.transitionRules.find(r => r.from === from && r.to === to);
        if (rule) {
            return rule.condition ? rule.condition() : true;
        }

        // 默认转换规则
        return this.isDefaultValidTransition(from, to);
    }

    /**
     * 检查是否为连接状态
     */
    isConnected(): boolean {
        return this.currentState === ConnectionState.Connected;
    }

    /**
     * 检查是否为连接中状态
     */
    isConnecting(): boolean {
        return this.currentState === ConnectionState.Connecting || 
               this.currentState === ConnectionState.Reconnecting;
    }

    /**
     * 检查是否为断开连接状态
     */
    isDisconnected(): boolean {
        return this.currentState === ConnectionState.Disconnected ||
               this.currentState === ConnectionState.Failed;
    }

    /**
     * 手动触发恢复
     */
    triggerRecovery(): void {
        if (this.config.enableAutoRecovery && this.recoveryCallback) {
            this.startRecovery();
        }
    }

    /**
     * 停止自动恢复
     */
    stopRecovery(): void {
        if (this.recoveryTimer) {
            this.recoveryTimer.stop();
            this.recoveryTimer = undefined;
        }
        this.recoveryAttempts = 0;
    }

    /**
     * 设置事件处理器
     */
    override on<K extends keyof ConnectionStateManagerEvents>(event: K, handler: ConnectionStateManagerEvents[K]): this {
        this.eventHandlers[event] = handler;
        return super.on(event, handler as any);
    }

    /**
     * 移除事件处理器
     */
    override off<K extends keyof ConnectionStateManagerEvents>(event: K): this {
        delete this.eventHandlers[event];
        return super.off(event, this.eventHandlers[event] as any);
    }

    /**
     * 更新配置
     */
    updateConfig(newConfig: Partial<ConnectionStateManagerConfig>): void {
        Object.assign(this.config, newConfig);
        this.logger.info('连接状态管理器配置已更新:', newConfig);
    }

    /**
     * 销毁管理器
     */
    destroy(): void {
        this.stopRecovery();
        this.clearAllStateTimeouts();
        this.removeAllListeners();
    }

    /**
     * 初始化默认转换规则
     */
    private initializeDefaultTransitionRules(): void {
        // 连接尝试
        this.addTransitionRule({
            from: ConnectionState.Disconnected,
            to: ConnectionState.Connecting,
            action: () => this.stats.connectionAttempts++
        });

        // 连接成功
        this.addTransitionRule({
            from: ConnectionState.Connecting,
            to: ConnectionState.Connected,
            action: () => {
                this.stats.successfulConnections++;
                this.recoveryAttempts = 0; // 重置恢复计数
            }
        });

        // 连接失败
        this.addTransitionRule({
            from: ConnectionState.Connecting,
            to: ConnectionState.Failed,
            action: () => this.stats.failedConnections++
        });

        // 重连尝试
        this.addTransitionRule({
            from: ConnectionState.Failed,
            to: ConnectionState.Reconnecting,
            action: () => this.stats.connectionAttempts++
        });

        // 重连成功
        this.addTransitionRule({
            from: ConnectionState.Reconnecting,
            to: ConnectionState.Connected,
            action: () => {
                this.stats.successfulConnections++;
                this.recoveryAttempts = 0;
            }
        });
    }

    /**
     * 检查默认的有效转换
     */
    private isDefaultValidTransition(from: ConnectionState, to: ConnectionState): boolean {
        const validTransitions: Record<ConnectionState, ConnectionState[]> = {
            [ConnectionState.Disconnected]: [ConnectionState.Connecting],
            [ConnectionState.Connecting]: [ConnectionState.Connected, ConnectionState.Failed, ConnectionState.Disconnected],
            [ConnectionState.Connected]: [ConnectionState.Disconnected, ConnectionState.Failed, ConnectionState.Reconnecting],
            [ConnectionState.Reconnecting]: [ConnectionState.Connected, ConnectionState.Failed, ConnectionState.Disconnected],
            [ConnectionState.Failed]: [ConnectionState.Reconnecting, ConnectionState.Connecting, ConnectionState.Disconnected]
        };

        return validTransitions[from]?.includes(to) || false;
    }

    /**
     * 更新状态历史
     */
    private updateStateHistory(state: ConnectionState, duration: number, reason?: string, metadata?: Record<string, any>): void {
        const entry: StateHistoryEntry = {
            state,
            timestamp: this.stateStartTime,
            duration,
            reason,
            metadata
        };

        this.stateHistory.push(entry);
        
        // 限制历史记录数量
        if (this.stateHistory.length > 100) {
            this.stateHistory.shift();
        }

        // 更新状态持续时间统计
        this.stats.stateDurations[state].push(duration);
        if (this.stats.stateDurations[state].length > 50) {
            this.stats.stateDurations[state].shift();
        }

        // 计算平均持续时间
        const durations = this.stats.stateDurations[state];
        this.stats.averageStateDurations[state] = 
            durations.reduce((sum, d) => sum + d, 0) / durations.length;
    }

    /**
     * 更新连接统计
     */
    private updateConnectionStats(from: ConnectionState, to: ConnectionState): void {
        const now = Date.now();
        const duration = now - this.stateStartTime;

        // 更新在线/离线时间
        if (from === ConnectionState.Connected) {
            this.stats.totalUptime += duration;
        } else if (this.isConnected()) {
            // 进入连接状态
        }

        if (this.isDisconnected() && !this.wasDisconnected(from)) {
            // 进入断开状态，开始计算离线时间
        } else if (!this.isDisconnected() && this.wasDisconnected(from)) {
            // 离开断开状态
            this.stats.totalDowntime += duration;
        }
    }

    /**
     * 检查之前是否为断开状态
     */
    private wasDisconnected(state: ConnectionState): boolean {
        return state === ConnectionState.Disconnected || state === ConnectionState.Failed;
    }

    /**
     * 设置状态超时定时器
     */
    private setStateTimeout(state: ConnectionState): void {
        if (this.config.stateTimeout <= 0) {
            return;
        }

        const timeout = NetworkTimerManager.schedule(
            this.config.stateTimeout / 1000, // 转为秒
            false, // 不重复
            this,
            () => {
                const duration = this.getCurrentStateDuration();
                this.logger.warn(`状态超时: ${state}, 持续时间: ${duration}ms`);
                this.eventHandlers.stateTimeout?.(state, duration);
            }
        );

        this.stateTimeouts.set(state, timeout);
    }

    /**
     * 清理状态超时定时器
     */
    private clearStateTimeout(state: ConnectionState): void {
        const timeout = this.stateTimeouts.get(state);
        if (timeout) {
            timeout.stop();
            this.stateTimeouts.delete(state);
        }
    }

    /**
     * 清理所有状态超时定时器
     */
    private clearAllStateTimeouts(): void {
        for (const timeout of this.stateTimeouts.values()) {
            timeout.stop();
        }
        this.stateTimeouts.clear();
    }

    /**
     * 处理自动恢复逻辑
     */
    private handleAutoRecovery(newState: ConnectionState): void {
        if (!this.config.enableAutoRecovery) {
            return;
        }

        // 检查是否需要开始恢复
        if (newState === ConnectionState.Failed || newState === ConnectionState.Disconnected) {
            if (this.previousState === ConnectionState.Connected || this.previousState === ConnectionState.Connecting) {
                this.startRecovery();
            }
        }
    }

    /**
     * 开始恢复过程
     */
    private startRecovery(): void {
        if (this.recoveryAttempts >= this.config.maxRecoveryAttempts) {
            this.logger.warn(`已达到最大恢复尝试次数: ${this.config.maxRecoveryAttempts}`);
            this.eventHandlers.recoveryFailed?.(true);
            return;
        }

        if (!this.recoveryCallback) {
            this.logger.error('恢复回调未设置');
            return;
        }

        this.recoveryAttempts++;
        
        this.logger.info(`开始自动恢复 (第 ${this.recoveryAttempts} 次)`);
        this.eventHandlers.recoveryStarted?.(this.recoveryAttempts);

        this.recoveryTimer = NetworkTimerManager.schedule(
            this.config.recoveryTimeout / 1000, // 转为秒
            false, // 不重复
            this,
            async () => {
                try {
                    await this.recoveryCallback!();
                    this.eventHandlers.recoverySucceeded?.();
                } catch (error) {
                    this.logger.error(`自动恢复失败 (第 ${this.recoveryAttempts} 次):`, error);
                    this.eventHandlers.recoveryFailed?.(false);
                    
                    // 继续尝试恢复
                    this.startRecovery();
                }
            }
        );
    }

    /**
     * 更新当前统计信息
     */
    private updateCurrentStats(): void {
        const now = Date.now();
        const currentDuration = now - this.stateStartTime;
        
        if (this.currentState === ConnectionState.Connected) {
            this.stats.totalUptime += currentDuration - (this.stats.totalUptime > 0 ? 0 : currentDuration);
        }
    }

    /**
     * 获取状态可读名称
     */
    getStateDisplayName(state?: ConnectionState): string {
        const stateNames: Record<ConnectionState, string> = {
            [ConnectionState.Disconnected]: '已断开',
            [ConnectionState.Connecting]: '连接中',
            [ConnectionState.Connected]: '已连接',
            [ConnectionState.Reconnecting]: '重连中',
            [ConnectionState.Failed]: '连接失败'
        };
        
        return stateNames[state || this.currentState];
    }

    /**
     * 获取连接质量评级
     */
    getConnectionQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
        const successRate = this.stats.connectionAttempts > 0 ? 
            this.stats.successfulConnections / this.stats.connectionAttempts : 0;
        
        const averageConnectedTime = this.stats.averageStateDurations[ConnectionState.Connected];
        
        if (successRate > 0.9 && averageConnectedTime > 60000) { // 成功率>90%且平均连接时间>1分钟
            return 'excellent';
        } else if (successRate > 0.7 && averageConnectedTime > 30000) {
            return 'good';
        } else if (successRate > 0.5 && averageConnectedTime > 10000) {
            return 'fair';
        } else {
            return 'poor';
        }
    }
}