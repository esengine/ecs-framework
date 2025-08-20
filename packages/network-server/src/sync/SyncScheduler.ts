import { createLogger } from '@esengine/ecs-framework';
import { SyncBatch } from '@esengine/network-shared';
import { EventEmitter } from '@esengine/network-shared';

/**
 * 调度配置
 */
export interface SyncSchedulerConfig {
    /** 目标帧率 */
    targetFPS: number;
    /** 最大延迟(毫秒) */
    maxLatency: number;
    /** 带宽限制(字节/秒) */
    bandwidthLimit: number;
    /** 优先级权重 */
    priorityWeights: {
        high: number;
        medium: number;
        low: number;
    };
    /** 自适应调整间隔(毫秒) */
    adaptiveInterval: number;
    /** 是否启用自适应调整 */
    enableAdaptive: boolean;
}

/**
 * 调度任务
 */
interface ScheduledTask {
    id: string;
    batch: SyncBatch;
    clientId: string;
    priority: number;
    deadline: number;
    size: number;
    retryCount: number;
    createdAt: number;
}

/**
 * 客户端调度状态
 */
interface ClientScheduleState {
    clientId: string;
    bandwidth: {
        used: number;
        limit: number;
        resetTime: number;
    };
    latency: number;
    queueSize: number;
    lastSendTime: number;
    adaptiveRate: number;
}

/**
 * 调度统计
 */
interface SchedulerStats {
    totalTasks: number;
    completedTasks: number;
    droppedTasks: number;
    averageLatency: number;
    bandwidthUtilization: number;
    queueSizes: { [clientId: string]: number };
    adaptiveRates: { [clientId: string]: number };
}

/**
 * 同步调度器
 * 负责优化同步数据的发送时机和优先级
 */
export class SyncScheduler extends EventEmitter {
    private logger = createLogger('SyncScheduler');
    private config: SyncSchedulerConfig;
    
    /** 任务队列 */
    private taskQueue: ScheduledTask[] = [];
    private taskIdCounter = 0;
    
    /** 客户端状态 */
    private clientStates = new Map<string, ClientScheduleState>();
    
    /** 调度定时器 */
    private scheduleTimer: any = null;
    private adaptiveTimer: any = null;
    
    /** 统计信息 */
    private stats: SchedulerStats = {
        totalTasks: 0,
        completedTasks: 0,
        droppedTasks: 0,
        averageLatency: 0,
        bandwidthUtilization: 0,
        queueSizes: {},
        adaptiveRates: {}
    };
    
    /** 自适应调整历史 */
    private latencyHistory = new Map<string, number[]>();
    private bandwidthHistory = new Map<string, number[]>();

    constructor(config: Partial<SyncSchedulerConfig> = {}) {
        super();
        
        this.config = {
            targetFPS: 60,
            maxLatency: 100,
            bandwidthLimit: 1024 * 1024, // 1MB/s
            priorityWeights: {
                high: 3,
                medium: 2,
                low: 1
            },
            adaptiveInterval: 1000,
            enableAdaptive: true,
            ...config
        };
        
        this.startScheduler();
        
        if (this.config.enableAdaptive) {
            this.startAdaptiveAdjustment();
        }
    }

    /**
     * 添加客户端
     */
    public addClient(clientId: string, bandwidth: number = this.config.bandwidthLimit): void {
        const clientState: ClientScheduleState = {
            clientId,
            bandwidth: {
                used: 0,
                limit: bandwidth,
                resetTime: Date.now() + 1000
            },
            latency: 0,
            queueSize: 0,
            lastSendTime: 0,
            adaptiveRate: 1000 / this.config.targetFPS // 初始发送间隔
        };
        
        this.clientStates.set(clientId, clientState);
        this.latencyHistory.set(clientId, []);
        this.bandwidthHistory.set(clientId, []);
        
        this.logger.debug(`客户端 ${clientId} 已添加到调度器`);
    }

    /**
     * 移除客户端
     */
    public removeClient(clientId: string): void {
        this.clientStates.delete(clientId);
        this.latencyHistory.delete(clientId);
        this.bandwidthHistory.delete(clientId);
        
        // 移除该客户端的所有任务
        this.taskQueue = this.taskQueue.filter(task => task.clientId !== clientId);
        
        this.logger.debug(`客户端 ${clientId} 已从调度器移除`);
    }

    /**
     * 调度同步任务
     */
    public schedule(batch: SyncBatch, clientId: string, priority: number = 5): string {
        const clientState = this.clientStates.get(clientId);
        if (!clientState) {
            this.logger.warn(`客户端 ${clientId} 不存在，无法调度任务`);
            return '';
        }
        
        const taskId = `task_${++this.taskIdCounter}`;
        const now = Date.now();
        
        const task: ScheduledTask = {
            id: taskId,
            batch,
            clientId,
            priority,
            deadline: now + this.config.maxLatency,
            size: this.estimateBatchSize(batch),
            retryCount: 0,
            createdAt: now
        };
        
        this.taskQueue.push(task);
        this.stats.totalTasks++;
        
        // 按优先级和截止时间排序
        this.sortTaskQueue();
        
        return taskId;
    }

    /**
     * 更新客户端延迟
     */
    public updateClientLatency(clientId: string, latency: number): void {
        const clientState = this.clientStates.get(clientId);
        if (clientState) {
            clientState.latency = latency;
            
            // 记录延迟历史
            const history = this.latencyHistory.get(clientId) || [];
            history.push(latency);
            
            // 保持最近50个记录
            if (history.length > 50) {
                history.shift();
            }
            
            this.latencyHistory.set(clientId, history);
        }
    }

    /**
     * 设置客户端带宽限制
     */
    public setClientBandwidth(clientId: string, bandwidth: number): void {
        const clientState = this.clientStates.get(clientId);
        if (clientState) {
            clientState.bandwidth.limit = bandwidth;
            this.logger.debug(`客户端 ${clientId} 带宽限制设置为: ${bandwidth} 字节/秒`);
        }
    }

    /**
     * 获取统计信息
     */
    public getStats(): SchedulerStats {
        // 更新队列大小统计
        for (const [clientId, clientState] of this.clientStates) {
            const clientTasks = this.taskQueue.filter(task => task.clientId === clientId);
            this.stats.queueSizes[clientId] = clientTasks.length;
            this.stats.adaptiveRates[clientId] = clientState.adaptiveRate;
        }
        
        return { ...this.stats };
    }

    /**
     * 清空任务队列
     */
    public clearQueue(): number {
        const count = this.taskQueue.length;
        this.taskQueue.length = 0;
        this.stats.droppedTasks += count;
        return count;
    }

    /**
     * 更新配置
     */
    public updateConfig(newConfig: Partial<SyncSchedulerConfig>): void {
        Object.assign(this.config, newConfig);
        
        if (newConfig.enableAdaptive !== undefined) {
            if (newConfig.enableAdaptive) {
                this.startAdaptiveAdjustment();
            } else {
                this.stopAdaptiveAdjustment();
            }
        }
    }

    /**
     * 销毁调度器
     */
    public destroy(): void {
        this.stopScheduler();
        this.stopAdaptiveAdjustment();
        this.taskQueue.length = 0;
        this.clientStates.clear();
        this.latencyHistory.clear();
        this.bandwidthHistory.clear();
        this.removeAllListeners();
    }

    /**
     * 启动调度器
     */
    private startScheduler(): void {
        if (this.scheduleTimer) {
            return;
        }
        
        const interval = 1000 / this.config.targetFPS;
        this.scheduleTimer = setInterval(() => {
            this.processTasks();
        }, interval);
    }

    /**
     * 停止调度器
     */
    private stopScheduler(): void {
        if (this.scheduleTimer) {
            clearInterval(this.scheduleTimer);
            this.scheduleTimer = null;
        }
    }

    /**
     * 启动自适应调整
     */
    private startAdaptiveAdjustment(): void {
        if (this.adaptiveTimer) {
            return;
        }
        
        this.adaptiveTimer = setInterval(() => {
            this.performAdaptiveAdjustment();
        }, this.config.adaptiveInterval);
    }

    /**
     * 停止自适应调整
     */
    private stopAdaptiveAdjustment(): void {
        if (this.adaptiveTimer) {
            clearInterval(this.adaptiveTimer);
            this.adaptiveTimer = null;
        }
    }

    /**
     * 处理任务队列
     */
    private processTasks(): void {
        const now = Date.now();
        const processedTasks: string[] = [];
        
        for (const task of this.taskQueue) {
            const clientState = this.clientStates.get(task.clientId);
            if (!clientState) {
                processedTasks.push(task.id);
                this.stats.droppedTasks++;
                continue;
            }
            
            // 检查截止时间
            if (now > task.deadline) {
                processedTasks.push(task.id);
                this.stats.droppedTasks++;
                this.logger.warn(`任务 ${task.id} 超时被丢弃`);
                continue;
            }
            
            // 检查发送间隔
            if (now - clientState.lastSendTime < clientState.adaptiveRate) {
                continue;
            }
            
            // 检查带宽限制
            if (!this.checkBandwidthLimit(clientState, task.size)) {
                continue;
            }
            
            // 发送任务
            this.sendTask(task, clientState);
            processedTasks.push(task.id);
            this.stats.completedTasks++;
        }
        
        // 移除已处理的任务
        this.taskQueue = this.taskQueue.filter(task => !processedTasks.includes(task.id));
    }

    /**
     * 发送任务
     */
    private sendTask(task: ScheduledTask, clientState: ClientScheduleState): void {
        const now = Date.now();
        
        // 更新客户端状态
        clientState.lastSendTime = now;
        clientState.bandwidth.used += task.size;
        
        // 记录带宽历史
        const bandwidthHistory = this.bandwidthHistory.get(task.clientId) || [];
        bandwidthHistory.push(task.size);
        
        if (bandwidthHistory.length > 50) {
            bandwidthHistory.shift();
        }
        
        this.bandwidthHistory.set(task.clientId, bandwidthHistory);
        
        // 发出事件
        this.emit('taskReady', task.batch, task.clientId);
        
        this.logger.debug(`任务 ${task.id} 已发送给客户端 ${task.clientId}`);
    }

    /**
     * 检查带宽限制
     */
    private checkBandwidthLimit(clientState: ClientScheduleState, taskSize: number): boolean {
        const now = Date.now();
        
        // 重置带宽计数器
        if (now >= clientState.bandwidth.resetTime) {
            clientState.bandwidth.used = 0;
            clientState.bandwidth.resetTime = now + 1000;
        }
        
        return clientState.bandwidth.used + taskSize <= clientState.bandwidth.limit;
    }

    /**
     * 估算批次大小
     */
    private estimateBatchSize(batch: SyncBatch): number {
        const propertyCount = Object.keys(batch.changes).length;
        return propertyCount * 50 + 200; // 基础开销 + 每个属性的估算大小
    }

    /**
     * 排序任务队列
     */
    private sortTaskQueue(): void {
        this.taskQueue.sort((a, b) => {
            // 首先按优先级排序
            const priorityDiff = b.priority - a.priority;
            if (priorityDiff !== 0) {
                return priorityDiff;
            }
            
            // 然后按截止时间排序
            return a.deadline - b.deadline;
        });
    }

    /**
     * 执行自适应调整
     */
    private performAdaptiveAdjustment(): void {
        for (const [clientId, clientState] of this.clientStates) {
            this.adjustClientRate(clientId, clientState);
        }
    }

    /**
     * 调整客户端发送频率
     */
    private adjustClientRate(clientId: string, clientState: ClientScheduleState): void {
        const latencyHistory = this.latencyHistory.get(clientId) || [];
        const bandwidthHistory = this.bandwidthHistory.get(clientId) || [];
        
        if (latencyHistory.length < 5) {
            return; // 数据不足，不进行调整
        }
        
        // 计算平均延迟
        const avgLatency = latencyHistory.reduce((sum, lat) => sum + lat, 0) / latencyHistory.length;
        
        // 计算带宽利用率
        const totalBandwidth = bandwidthHistory.reduce((sum, size) => sum + size, 0);
        const bandwidthUtilization = totalBandwidth / clientState.bandwidth.limit;
        
        // 根据延迟和带宽利用率调整发送频率
        let adjustment = 1;
        
        if (avgLatency > this.config.maxLatency) {
            // 延迟过高，降低发送频率
            adjustment = 1.2;
        } else if (avgLatency < this.config.maxLatency * 0.5) {
            // 延迟较低，可以提高发送频率
            adjustment = 0.9;
        }
        
        if (bandwidthUtilization > 0.9) {
            // 带宽利用率过高，降低发送频率
            adjustment *= 1.1;
        } else if (bandwidthUtilization < 0.5) {
            // 带宽利用率较低，可以提高发送频率
            adjustment *= 0.95;
        }
        
        // 应用调整
        clientState.adaptiveRate = Math.max(
            clientState.adaptiveRate * adjustment,
            1000 / (this.config.targetFPS * 2) // 最小间隔
        );
        
        clientState.adaptiveRate = Math.min(
            clientState.adaptiveRate,
            1000 // 最大间隔1秒
        );
        
        this.logger.debug(
            `客户端 ${clientId} 自适应调整: 延迟=${avgLatency.toFixed(1)}ms, ` +
            `带宽利用率=${(bandwidthUtilization * 100).toFixed(1)}%, ` +
            `新间隔=${clientState.adaptiveRate.toFixed(1)}ms`
        );
    }
}