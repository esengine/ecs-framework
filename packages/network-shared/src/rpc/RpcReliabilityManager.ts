import { createLogger } from '@esengine/ecs-framework';
import { EventEmitter } from '../utils/EventEmitter';
import { RpcCallRequest, RpcCallResponse, RpcError, RpcErrorType } from '../types/RpcTypes';

/**
 * 重复调用记录
 */
interface DuplicateCallRecord {
    callId: string;
    methodName: string;
    senderId: string;
    firstCallTime: number;
    lastCallTime: number;
    callCount: number;
    response?: RpcCallResponse;
}

/**
 * 幂等性配置
 */
interface IdempotencyConfig {
    /** 是否启用幂等性检查 */
    enabled: boolean;
    /** 记录保留时间(毫秒) */
    recordRetentionTime: number;
    /** 最大记录数量 */
    maxRecords: number;
    /** 检查窗口时间(毫秒) */
    checkWindowTime: number;
}

/**
 * 顺序执行配置
 */
interface OrderedExecutionConfig {
    /** 是否启用顺序执行 */
    enabled: boolean;
    /** 最大等待时间(毫秒) */
    maxWaitTime: number;
    /** 队列最大大小 */
    maxQueueSize: number;
}

/**
 * 事务配置
 */
interface TransactionConfig {
    /** 是否启用事务支持 */
    enabled: boolean;
    /** 事务超时时间(毫秒) */
    transactionTimeout: number;
    /** 最大事务数量 */
    maxTransactions: number;
}

/**
 * RPC可靠性管理器配置
 */
export interface RpcReliabilityConfig {
    /** 幂等性配置 */
    idempotency: IdempotencyConfig;
    /** 顺序执行配置 */
    orderedExecution: OrderedExecutionConfig;
    /** 事务配置 */
    transaction: TransactionConfig;
}

/**
 * RPC可靠性管理器统计信息
 */
export interface RpcReliabilityStats {
    duplicateRecords: number;
    activeTransactions: number;
    totalQueuedCalls: number;
    processingQueues: number;
}

/**
 * 重复调用检查结果
 */
export interface DuplicateCallCheckResult {
    isDuplicate: boolean;
    response?: RpcCallResponse;
    shouldProcess: boolean;
}

/**
 * 事务信息
 */
interface TransactionInfo {
    transactionId: string;
    calls: RpcCallRequest[];
    startTime: number;
    status: 'pending' | 'committed' | 'rolledback';
    rollbackActions: Array<() => Promise<void>>;
}

/**
 * 顺序执行队列项
 */
interface OrderedQueueItem {
    request: RpcCallRequest;
    handler: () => Promise<RpcCallResponse>;
    resolve: (response: RpcCallResponse) => void;
    reject: (error: RpcError) => void;
    enqueuedAt: number;
}

/**
 * RPC可靠性管理器事件
 */
export interface RpcReliabilityManagerEvents {
    duplicateCallDetected: (record: DuplicateCallRecord) => void;
    transactionStarted: (transactionId: string) => void;
    transactionCommitted: (transactionId: string) => void;
    transactionRolledback: (transactionId: string, reason: string) => void;
    orderedCallQueued: (callId: string, queueSize: number) => void;
    orderedCallProcessed: (callId: string, waitTime: number) => void;
}

/**
 * RPC可靠性管理器
 * 提供重复检测、幂等性、顺序执行和事务支持
 */
export class RpcReliabilityManager extends EventEmitter {
    private logger = createLogger('RpcReliabilityManager');
    private config: RpcReliabilityConfig;
    
    /** 重复调用记录 */
    private duplicateRecords = new Map<string, DuplicateCallRecord>();
    
    /** 活跃事务 */
    private transactions = new Map<string, TransactionInfo>();
    
    /** 顺序执行队列（按发送者分组） */
    private orderedQueues = new Map<string, OrderedQueueItem[]>();
    
    /** 正在处理的有序调用 */
    private processingOrdered = new Set<string>();
    
    /** 清理定时器 */
    private cleanupTimer: ReturnType<typeof setInterval> | null = null;

    constructor(config: Partial<RpcReliabilityConfig> = {}) {
        super();
        
        this.config = {
            idempotency: {
                enabled: true,
                recordRetentionTime: 300000, // 5分钟
                maxRecords: 10000,
                checkWindowTime: 60000, // 1分钟
                ...config.idempotency
            },
            orderedExecution: {
                enabled: false,
                maxWaitTime: 30000,
                maxQueueSize: 1000,
                ...config.orderedExecution
            },
            transaction: {
                enabled: false,
                transactionTimeout: 60000,
                maxTransactions: 100,
                ...config.transaction
            }
        };
        
        this.startCleanupTimer();
    }

    /**
     * 检查并处理重复调用
     */
    public checkDuplicateCall(request: RpcCallRequest): DuplicateCallCheckResult {
        if (!this.config.idempotency.enabled) {
            return { isDuplicate: false, shouldProcess: true };
        }
        
        const key = `${request.senderId}:${request.callId}`;
        const existing = this.duplicateRecords.get(key);
        const now = Date.now();
        
        if (existing) {
            // 更新重复调用记录
            existing.lastCallTime = now;
            existing.callCount++;
            
            this.emit('duplicateCallDetected', existing);
            
            // 如果已有响应，直接返回
            if (existing.response) {
                return {
                    isDuplicate: true,
                    response: existing.response,
                    shouldProcess: false
                };
            }
            
            // 如果在检查窗口内，认为是重复调用但还在处理中
            if (now - existing.firstCallTime < this.config.idempotency.checkWindowTime) {
                return {
                    isDuplicate: true,
                    shouldProcess: false
                };
            }
        }
        
        // 记录新的调用
        const record: DuplicateCallRecord = {
            callId: request.callId,
            methodName: request.methodName,
            senderId: request.senderId,
            firstCallTime: now,
            lastCallTime: now,
            callCount: 1
        };
        
        this.duplicateRecords.set(key, record);
        
        return { isDuplicate: false, shouldProcess: true };
    }

    /**
     * 记录调用响应（用于幂等性）
     */
    public recordCallResponse(request: RpcCallRequest, response: RpcCallResponse): void {
        if (!this.config.idempotency.enabled) {
            return;
        }
        
        const key = `${request.senderId}:${request.callId}`;
        const record = this.duplicateRecords.get(key);
        
        if (record) {
            record.response = response;
        }
    }

    /**
     * 处理有序调用
     */
    public async handleOrderedCall(
        request: RpcCallRequest,
        handler: () => Promise<RpcCallResponse>
    ): Promise<RpcCallResponse> {
        if (!this.config.orderedExecution.enabled) {
            return handler();
        }
        
        const senderId = request.senderId;
        
        return new Promise<RpcCallResponse>((resolve, reject) => {
            const queueItem: OrderedQueueItem = {
                request,
                handler,
                resolve,
                reject,
                enqueuedAt: Date.now()
            };
            
            // 获取或创建队列
            let queue = this.orderedQueues.get(senderId);
            if (!queue) {
                queue = [];
                this.orderedQueues.set(senderId, queue);
            }
            
            // 检查队列大小
            if (queue.length >= this.config.orderedExecution.maxQueueSize) {
                reject({
                    type: RpcErrorType.RATE_LIMITED,
                    message: '有序执行队列已满'
                });
                return;
            }
            
            queue.push(queueItem);
            this.emit('orderedCallQueued', request.callId, queue.length);
            
            // 如果没有正在处理的调用，开始处理
            if (!this.processingOrdered.has(senderId)) {
                this.processOrderedQueue(senderId);
            }
        });
    }

    /**
     * 开始事务
     */
    public startTransaction(transactionId: string): void {
        if (!this.config.transaction.enabled) {
            throw new Error('事务功能未启用');
        }
        
        if (this.transactions.has(transactionId)) {
            throw new Error(`事务已存在: ${transactionId}`);
        }
        
        if (this.transactions.size >= this.config.transaction.maxTransactions) {
            throw new Error('超过最大事务数量限制');
        }
        
        const transaction: TransactionInfo = {
            transactionId,
            calls: [],
            startTime: Date.now(),
            status: 'pending',
            rollbackActions: []
        };
        
        this.transactions.set(transactionId, transaction);
        this.emit('transactionStarted', transactionId);
        
        // 设置事务超时
        setTimeout(() => {
            if (this.transactions.has(transactionId)) {
                this.rollbackTransaction(transactionId, '事务超时');
            }
        }, this.config.transaction.transactionTimeout);
    }

    /**
     * 添加事务调用
     */
    public addTransactionCall(
        transactionId: string,
        request: RpcCallRequest,
        rollbackAction?: () => Promise<void>
    ): void {
        const transaction = this.transactions.get(transactionId);
        if (!transaction) {
            throw new Error(`事务不存在: ${transactionId}`);
        }
        
        if (transaction.status !== 'pending') {
            throw new Error(`事务状态无效: ${transaction.status}`);
        }
        
        transaction.calls.push(request);
        
        if (rollbackAction) {
            transaction.rollbackActions.push(rollbackAction);
        }
    }

    /**
     * 提交事务
     */
    public async commitTransaction(transactionId: string): Promise<void> {
        const transaction = this.transactions.get(transactionId);
        if (!transaction) {
            throw new Error(`事务不存在: ${transactionId}`);
        }
        
        if (transaction.status !== 'pending') {
            throw new Error(`事务状态无效: ${transaction.status}`);
        }
        
        transaction.status = 'committed';
        this.transactions.delete(transactionId);
        
        this.emit('transactionCommitted', transactionId);
        this.logger.info(`事务已提交: ${transactionId}，包含 ${transaction.calls.length} 个调用`);
    }

    /**
     * 回滚事务
     */
    public async rollbackTransaction(transactionId: string, reason: string): Promise<void> {
        const transaction = this.transactions.get(transactionId);
        if (!transaction) {
            throw new Error(`事务不存在: ${transactionId}`);
        }
        
        if (transaction.status !== 'pending') {
            return; // 已经处理过
        }
        
        transaction.status = 'rolledback';
        
        // 执行回滚操作
        for (const rollbackAction of transaction.rollbackActions.reverse()) {
            try {
                await rollbackAction();
            } catch (error) {
                this.logger.error(`回滚操作失败: ${transactionId}`, error);
            }
        }
        
        this.transactions.delete(transactionId);
        
        this.emit('transactionRolledback', transactionId, reason);
        this.logger.warn(`事务已回滚: ${transactionId}，原因: ${reason}`);
    }

    /**
     * 获取事务信息
     */
    public getTransaction(transactionId: string): TransactionInfo | undefined {
        return this.transactions.get(transactionId);
    }

    /**
     * 获取统计信息
     */
    public getStats(): RpcReliabilityStats {
        let totalQueuedCalls = 0;
        for (const queue of this.orderedQueues.values()) {
            totalQueuedCalls += queue.length;
        }
        
        return {
            duplicateRecords: this.duplicateRecords.size,
            activeTransactions: this.transactions.size,
            totalQueuedCalls,
            processingQueues: this.processingOrdered.size
        };
    }

    /**
     * 更新配置
     */
    public updateConfig(newConfig: Partial<RpcReliabilityConfig>): void {
        if (newConfig.idempotency) {
            Object.assign(this.config.idempotency, newConfig.idempotency);
        }
        if (newConfig.orderedExecution) {
            Object.assign(this.config.orderedExecution, newConfig.orderedExecution);
        }
        if (newConfig.transaction) {
            Object.assign(this.config.transaction, newConfig.transaction);
        }
    }

    /**
     * 销毁管理器
     */
    public destroy(): void {
        // 停止清理定时器
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
        
        // 回滚所有活跃事务
        const transactionIds = Array.from(this.transactions.keys());
        for (const transactionId of transactionIds) {
            this.rollbackTransaction(transactionId, '管理器销毁').catch(error => {
                this.logger.error(`销毁时回滚事务失败: ${transactionId}`, error);
            });
        }
        
        // 清理队列
        for (const queue of this.orderedQueues.values()) {
            for (const item of queue) {
                item.reject({
                    type: RpcErrorType.CLIENT_ERROR,
                    message: '服务关闭'
                });
            }
        }
        
        this.duplicateRecords.clear();
        this.transactions.clear();
        this.orderedQueues.clear();
        this.processingOrdered.clear();
        
        this.removeAllListeners();
    }

    /**
     * 处理有序队列
     */
    private async processOrderedQueue(senderId: string): Promise<void> {
        this.processingOrdered.add(senderId);
        
        try {
            const queue = this.orderedQueues.get(senderId);
            if (!queue || queue.length === 0) {
                return;
            }
            
            while (queue.length > 0) {
                const item = queue.shift()!;
                const waitTime = Date.now() - item.enqueuedAt;
                
                // 检查等待时间是否超限
                if (waitTime > this.config.orderedExecution.maxWaitTime) {
                    item.reject({
                        type: RpcErrorType.TIMEOUT,
                        message: `有序执行等待超时: ${waitTime}ms`
                    });
                    continue;
                }
                
                try {
                    const response = await item.handler();
                    item.resolve(response);
                    
                    this.emit('orderedCallProcessed', item.request.callId, waitTime);
                    
                } catch (error) {
                    item.reject(error as RpcError);
                }
            }
            
        } finally {
            this.processingOrdered.delete(senderId);
            
            // 如果队列还有新的项目，继续处理
            const queue = this.orderedQueues.get(senderId);
            if (queue && queue.length > 0) {
                setImmediate(() => this.processOrderedQueue(senderId));
            }
        }
    }

    /**
     * 开始清理定时器
     */
    private startCleanupTimer(): void {
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, 60000); // 每分钟清理一次
    }

    /**
     * 清理过期数据
     */
    private cleanup(): void {
        const now = Date.now();
        
        // 清理过期的重复调用记录
        if (this.config.idempotency.enabled) {
            for (const [key, record] of this.duplicateRecords) {
                if (now - record.lastCallTime > this.config.idempotency.recordRetentionTime) {
                    this.duplicateRecords.delete(key);
                }
            }
            
            // 限制记录数量
            if (this.duplicateRecords.size > this.config.idempotency.maxRecords) {
                const sortedRecords = Array.from(this.duplicateRecords.entries())
                    .sort(([,a], [,b]) => a.lastCallTime - b.lastCallTime);
                
                const keepCount = Math.floor(this.config.idempotency.maxRecords * 0.8);
                
                for (let i = 0; i < sortedRecords.length - keepCount; i++) {
                    this.duplicateRecords.delete(sortedRecords[i][0]);
                }
            }
        }
        
        // 清理空的有序队列
        for (const [senderId, queue] of this.orderedQueues) {
            if (queue.length === 0 && !this.processingOrdered.has(senderId)) {
                this.orderedQueues.delete(senderId);
            }
        }
    }
}