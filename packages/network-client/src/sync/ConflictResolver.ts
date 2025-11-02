import { createLogger } from '@esengine/ecs-framework';
import { EventEmitter } from '@esengine/network-shared';

/**
 * 冲突类型
 */
export enum ConflictType {
    /** 位置冲突 */
    Position = 'position',
    /** 属性值冲突 */
    Property = 'property',
    /** 状态冲突 */
    State = 'state',
    /** 时间冲突 */
    Timing = 'timing'
}

/**
 * 冲突解决策略
 */
export enum ConflictResolutionStrategy {
    /** 服务端权威 */
    ServerAuthority = 'server_authority',
    /** 客户端预测 */
    ClientPrediction = 'client_prediction',
    /** 插值平滑 */
    Interpolation = 'interpolation',
    /** 回滚重放 */
    RollbackReplay = 'rollback_replay',
    /** 自定义逻辑 */
    Custom = 'custom'
}

/**
 * 冲突信息
 */
export interface ConflictInfo {
    instanceId: string;
    propertyKey: string;
    conflictType: ConflictType;
    localValue: any;
    serverValue: any;
    timestamp: number;
    severity: number; // 0-1, 1为最严重
}

/**
 * 解决结果
 */
export interface ResolutionResult {
    success: boolean;
    finalValue: any;
    strategy: ConflictResolutionStrategy;
    confidence: number; // 0-1, 1为最有信心
    rollbackRequired: boolean;
    interpolationTime?: number;
}

/**
 * 插值配置
 */
export interface InterpolationConfig {
    duration: number;
    easing: (t: number) => number;
    threshold: number;
}

/**
 * 回滚配置
 */
export interface RollbackConfig {
    maxFrames: number;
    timeWindow: number;
    priorityThreshold: number;
}

/**
 * 冲突解决器配置
 */
export interface ConflictResolverConfig {
    /** 默认解决策略 */
    defaultStrategy: ConflictResolutionStrategy;
    /** 冲突检测阈值 */
    conflictThreshold: number;
    /** 插值配置 */
    interpolation: InterpolationConfig;
    /** 回滚配置 */
    rollback: RollbackConfig;
    /** 是否启用自适应策略 */
    enableAdaptiveStrategy: boolean;
    /** 性能监控采样率 */
    performanceSampleRate: number;
}

/**
 * 策略性能统计
 */
interface StrategyPerformance {
    strategy: ConflictResolutionStrategy;
    successRate: number;
    averageTime: number;
    conflictCount: number;
    userSatisfaction: number;
}

/**
 * 冲突解决器
 * 负责处理客户端预测和服务端权威之间的冲突
 */
export class ConflictResolver extends EventEmitter {
    private logger = createLogger('ConflictResolver');
    private config: ConflictResolverConfig;

    /** 策略映射 */
    private strategyMap = new Map<string, ConflictResolutionStrategy>();

    /** 自定义解决器 */
    private customResolvers = new Map<string, (conflict: ConflictInfo) => ResolutionResult>();

    /** 性能统计 */
    private performance = new Map<ConflictResolutionStrategy, StrategyPerformance>();

    /** 冲突历史 */
    private conflictHistory: Array<{
        conflict: ConflictInfo;
        result: ResolutionResult;
        timestamp: number;
    }> = [];

    constructor(config: Partial<ConflictResolverConfig> = {}) {
        super();

        this.config = {
            defaultStrategy: ConflictResolutionStrategy.ServerAuthority,
            conflictThreshold: 0.1,
            interpolation: {
                duration: 100,
                easing: (t: number) => t * t * (3 - 2 * t), // smoothstep
                threshold: 0.01
            },
            rollback: {
                maxFrames: 60,
                timeWindow: 1000,
                priorityThreshold: 0.7
            },
            enableAdaptiveStrategy: true,
            performanceSampleRate: 0.1,
            ...config
        };

        this.initializePerformanceTracking();
    }

    /**
     * 检测冲突
     */
    public detectConflict(
        instanceId: string,
        propertyKey: string,
        localValue: any,
        serverValue: any,
        timestamp: number = Date.now()
    ): ConflictInfo | null {
        const conflictType = this.determineConflictType(propertyKey, localValue, serverValue);
        const severity = this.calculateConflictSeverity(localValue, serverValue);

        if (severity < this.config.conflictThreshold) {
            return null; // 差异太小，不算冲突
        }

        return {
            instanceId,
            propertyKey,
            conflictType,
            localValue,
            serverValue,
            timestamp,
            severity
        };
    }

    /**
     * 解决冲突
     */
    public resolveConflict(conflict: ConflictInfo): ResolutionResult {
        const startTime = performance.now();

        // 选择解决策略
        const strategy = this.selectStrategy(conflict);

        // 执行解决
        let result: ResolutionResult;

        switch (strategy) {
            case ConflictResolutionStrategy.ServerAuthority:
                result = this.resolveWithServerAuthority(conflict);
                break;

            case ConflictResolutionStrategy.ClientPrediction:
                result = this.resolveWithClientPrediction(conflict);
                break;

            case ConflictResolutionStrategy.Interpolation:
                result = this.resolveWithInterpolation(conflict);
                break;

            case ConflictResolutionStrategy.RollbackReplay:
                result = this.resolveWithRollbackReplay(conflict);
                break;

            case ConflictResolutionStrategy.Custom:
                result = this.resolveWithCustomLogic(conflict);
                break;

            default:
                result = this.resolveWithServerAuthority(conflict);
        }

        result.strategy = strategy;

        // 记录性能
        const resolveTime = performance.now() - startTime;
        this.recordPerformance(strategy, result.success, resolveTime);

        // 记录历史
        this.conflictHistory.push({
            conflict,
            result,
            timestamp: Date.now()
        });

        // 清理旧历史
        if (this.conflictHistory.length > 1000) {
            this.conflictHistory.shift();
        }

        // 发出事件
        this.emit('conflictResolved', conflict, result);

        return result;
    }

    /**
     * 设置属性策略
     */
    public setPropertyStrategy(propertyKey: string, strategy: ConflictResolutionStrategy): void {
        this.strategyMap.set(propertyKey, strategy);
    }

    /**
     * 设置自定义解决器
     */
    public setCustomResolver(
        propertyKey: string,
        resolver: (conflict: ConflictInfo) => ResolutionResult
    ): void {
        this.customResolvers.set(propertyKey, resolver);
        this.strategyMap.set(propertyKey, ConflictResolutionStrategy.Custom);
    }

    /**
     * 获取性能统计
     */
    public getPerformanceStats(): Map<ConflictResolutionStrategy, StrategyPerformance> {
        return new Map(this.performance);
    }

    /**
     * 获取冲突历史
     */
    public getConflictHistory(limit: number = 100): Array<{
        conflict: ConflictInfo;
        result: ResolutionResult;
        timestamp: number;
    }> {
        return this.conflictHistory.slice(-limit);
    }

    /**
     * 重置统计
     */
    public resetStats(): void {
        this.performance.clear();
        this.conflictHistory.length = 0;
        this.initializePerformanceTracking();
    }

    /**
     * 更新配置
     */
    public updateConfig(newConfig: Partial<ConflictResolverConfig>): void {
        Object.assign(this.config, newConfig);
    }

    /**
     * 销毁解决器
     */
    public destroy(): void {
        this.strategyMap.clear();
        this.customResolvers.clear();
        this.performance.clear();
        this.conflictHistory.length = 0;
        this.removeAllListeners();
    }

    /**
     * 确定冲突类型
     */
    private determineConflictType(propertyKey: string, localValue: any, serverValue: any): ConflictType {
        if (propertyKey.includes('position') || propertyKey.includes('location')) {
            return ConflictType.Position;
        }

        if (propertyKey.includes('state') || propertyKey.includes('status')) {
            return ConflictType.State;
        }

        if (propertyKey.includes('time') || propertyKey.includes('timestamp')) {
            return ConflictType.Timing;
        }

        return ConflictType.Property;
    }

    /**
     * 计算冲突严重性
     */
    private calculateConflictSeverity(localValue: any, serverValue: any): number {
        if (typeof localValue === 'number' && typeof serverValue === 'number') {
            const diff = Math.abs(localValue - serverValue);
            const max = Math.max(Math.abs(localValue), Math.abs(serverValue), 1);
            return Math.min(diff / max, 1);
        }

        if (typeof localValue === 'object' && typeof serverValue === 'object') {
            // 简化的对象比较
            return localValue === serverValue ? 0 : 1;
        }

        return localValue === serverValue ? 0 : 1;
    }

    /**
     * 选择解决策略
     */
    private selectStrategy(conflict: ConflictInfo): ConflictResolutionStrategy {
        // 检查是否有属性特定策略
        const propertyStrategy = this.strategyMap.get(conflict.propertyKey);
        if (propertyStrategy) {
            return propertyStrategy;
        }

        // 自适应策略选择
        if (this.config.enableAdaptiveStrategy) {
            return this.selectAdaptiveStrategy(conflict);
        }

        return this.config.defaultStrategy;
    }

    /**
     * 自适应策略选择
     */
    private selectAdaptiveStrategy(conflict: ConflictInfo): ConflictResolutionStrategy {
        const strategies = Array.from(this.performance.keys());

        if (strategies.length === 0) {
            return this.config.defaultStrategy;
        }

        // 根据冲突类型和性能选择最佳策略
        let bestStrategy = this.config.defaultStrategy;
        let bestScore = 0;

        for (const strategy of strategies) {
            const perf = this.performance.get(strategy)!;

            // 计算策略得分：成功率 * 用户满意度 / 平均时间
            const score = (perf.successRate * perf.userSatisfaction) / Math.max(perf.averageTime, 1);

            if (score > bestScore) {
                bestScore = score;
                bestStrategy = strategy;
            }
        }

        return bestStrategy;
    }

    /**
     * 服务端权威解决
     */
    private resolveWithServerAuthority(conflict: ConflictInfo): ResolutionResult {
        return {
            success: true,
            finalValue: conflict.serverValue,
            strategy: ConflictResolutionStrategy.ServerAuthority,
            confidence: 1.0,
            rollbackRequired: false
        };
    }

    /**
     * 客户端预测解决
     */
    private resolveWithClientPrediction(conflict: ConflictInfo): ResolutionResult {
        // 如果冲突严重性较低，保持客户端值
        const keepClient = conflict.severity < 0.5;

        return {
            success: true,
            finalValue: keepClient ? conflict.localValue : conflict.serverValue,
            strategy: ConflictResolutionStrategy.ClientPrediction,
            confidence: keepClient ? 0.7 : 0.9,
            rollbackRequired: !keepClient
        };
    }

    /**
     * 插值解决
     */
    private resolveWithInterpolation(conflict: ConflictInfo): ResolutionResult {
        if (typeof conflict.localValue !== 'number' || typeof conflict.serverValue !== 'number') {
            // 非数值类型，回退到服务端权威
            return this.resolveWithServerAuthority(conflict);
        }

        // 检查差异是否足够大需要插值
        const diff = Math.abs(conflict.localValue - conflict.serverValue);
        if (diff < this.config.interpolation.threshold) {
            return {
                success: true,
                finalValue: conflict.serverValue,
                strategy: ConflictResolutionStrategy.Interpolation,
                confidence: 1.0,
                rollbackRequired: false
            };
        }

        return {
            success: true,
            finalValue: conflict.serverValue,
            strategy: ConflictResolutionStrategy.Interpolation,
            confidence: 0.8,
            rollbackRequired: false,
            interpolationTime: this.config.interpolation.duration
        };
    }

    /**
     * 回滚重放解决
     */
    private resolveWithRollbackReplay(conflict: ConflictInfo): ResolutionResult {
        // 检查是否满足回滚条件
        const shouldRollback = conflict.severity >= this.config.rollback.priorityThreshold;

        return {
            success: true,
            finalValue: conflict.serverValue,
            strategy: ConflictResolutionStrategy.RollbackReplay,
            confidence: shouldRollback ? 0.9 : 0.6,
            rollbackRequired: shouldRollback
        };
    }

    /**
     * 自定义逻辑解决
     */
    private resolveWithCustomLogic(conflict: ConflictInfo): ResolutionResult {
        const customResolver = this.customResolvers.get(conflict.propertyKey);

        if (!customResolver) {
            this.logger.warn(`未找到属性 ${conflict.propertyKey} 的自定义解决器，使用服务端权威`);
            return this.resolveWithServerAuthority(conflict);
        }

        try {
            return customResolver(conflict);
        } catch (error) {
            this.logger.error('自定义解决器执行失败:', error);
            return this.resolveWithServerAuthority(conflict);
        }
    }

    /**
     * 初始化性能跟踪
     */
    private initializePerformanceTracking(): void {
        const strategies = Object.values(ConflictResolutionStrategy);

        for (const strategy of strategies) {
            this.performance.set(strategy, {
                strategy,
                successRate: 1.0,
                averageTime: 1.0,
                conflictCount: 0,
                userSatisfaction: 0.8
            });
        }
    }

    /**
     * 记录性能
     */
    private recordPerformance(strategy: ConflictResolutionStrategy, success: boolean, time: number): void {
        const perf = this.performance.get(strategy);
        if (!perf) {
            return;
        }

        // 更新统计（使用滑动平均）
        const alpha = 0.1; // 学习率

        perf.conflictCount++;
        perf.successRate = perf.successRate * (1 - alpha) + (success ? 1 : 0) * alpha;
        perf.averageTime = perf.averageTime * (1 - alpha) + time * alpha;

        // 用户满意度基于成功率和时间
        perf.userSatisfaction = Math.max(0, perf.successRate - (time / 100) * 0.1);
    }
}
