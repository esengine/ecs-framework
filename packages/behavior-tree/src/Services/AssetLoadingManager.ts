import { Entity, IService, createLogger } from '@esengine/ecs-framework';
import {
    LoadingState,
    LoadingTask,
    LoadingTaskHandle,
    LoadingOptions,
    LoadingProgress,
    TimeoutError,
    CircularDependencyError,
    EntityDestroyedError
} from './AssetLoadingTypes';

const logger = createLogger('AssetLoadingManager');

/**
 * 资产加载管理器
 *
 * 统一管理行为树资产的异步加载，提供：
 * - 超时检测和自动重试
 * - 循环引用检测
 * - 实体生命周期安全
 * - 加载状态追踪
 *
 * @example
 * ```typescript
 * const manager = new AssetLoadingManager();
 *
 * const handle = manager.startLoading(
 *     'patrol',
 *     parentEntity,
 *     () => assetLoader.loadBehaviorTree('patrol'),
 *     { timeoutMs: 5000, maxRetries: 3 }
 * );
 *
 * // 在系统的 process() 中轮询检查
 * const state = handle.getState();
 * if (state === LoadingState.Loaded) {
 *     const entity = await handle.promise;
 *     // 使用加载的实体
 * }
 * ```
 */
export class AssetLoadingManager implements IService {
    /** 正在进行的加载任务 */
    private tasks: Map<string, LoadingTask> = new Map();

    /** 加载栈（用于循环检测） */
    private loadingStack: Set<string> = new Set();

    /** 默认配置 */
    private defaultOptions: Required<Omit<LoadingOptions, 'parentAssetId'>> = {
        timeoutMs: 5000,
        maxRetries: 3,
        retryDelayBase: 100,
        maxRetryDelay: 2000
    };

    /**
     * 开始加载资产
     *
     * @param assetId 资产ID
     * @param parentEntity 父实体（用于生命周期检查）
     * @param loader 加载函数
     * @param options 加载选项
     * @returns 加载任务句柄
     */
    startLoading(
        assetId: string,
        parentEntity: Entity,
        loader: () => Promise<Entity>,
        options: LoadingOptions = {}
    ): LoadingTaskHandle {
        // 合并选项
        const finalOptions = {
            ...this.defaultOptions,
            ...options
        };

        // 循环引用检测
        if (options.parentAssetId) {
            if (this.detectCircularDependency(assetId, options.parentAssetId)) {
                const error = new CircularDependencyError(
                    `检测到循环引用: ${options.parentAssetId} → ${assetId}\n` +
                    `加载栈: ${Array.from(this.loadingStack).join(' → ')}`
                );
                logger.error(error.message);
                throw error;
            }
        }

        // 检查是否已有任务
        const existingTask = this.tasks.get(assetId);
        if (existingTask) {
            logger.debug(`资产 ${assetId} 已在加载中，返回现有任务`);
            return this.createHandle(existingTask);
        }

        // 创建新任务
        const task: LoadingTask = {
            assetId,
            promise: null as any, // 稍后设置
            startTime: Date.now(),
            lastRetryTime: 0,
            retryCount: 0,
            maxRetries: finalOptions.maxRetries,
            timeoutMs: finalOptions.timeoutMs,
            state: LoadingState.Pending,
            parentEntityId: parentEntity.id,
            parentEntity: parentEntity,
            parentAssetId: options.parentAssetId
        };

        // 添加到加载栈（循环检测）
        this.loadingStack.add(assetId);

        // 创建带超时和重试的Promise
        task.promise = this.loadWithTimeoutAndRetry(task, loader, finalOptions);
        task.state = LoadingState.Loading;

        this.tasks.set(assetId, task);

        logger.info(`开始加载资产: ${assetId}`, {
            timeoutMs: finalOptions.timeoutMs,
            maxRetries: finalOptions.maxRetries,
            parentAssetId: options.parentAssetId
        });

        return this.createHandle(task);
    }

    /**
     * 带超时和重试的加载
     */
    private async loadWithTimeoutAndRetry(
        task: LoadingTask,
        loader: () => Promise<Entity>,
        options: Required<Omit<LoadingOptions, 'parentAssetId'>>
    ): Promise<Entity> {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= task.maxRetries; attempt++) {
            // 检查父实体是否还存在
            if (task.parentEntity.isDestroyed) {
                const error = new EntityDestroyedError(
                    `父实体已销毁，取消加载: ${task.assetId}`
                );
                task.state = LoadingState.Cancelled;
                this.cleanup(task.assetId);
                logger.warn(error.message);
                throw error;
            }

            try {
                task.retryCount = attempt;
                task.lastRetryTime = Date.now();

                logger.debug(`加载尝试 ${attempt + 1}/${task.maxRetries + 1}: ${task.assetId}`);

                // 使用超时包装
                const result = await this.withTimeout(
                    loader(),
                    task.timeoutMs,
                    `加载资产 ${task.assetId} 超时（${task.timeoutMs}ms）`
                );

                // 加载成功
                task.state = LoadingState.Loaded;
                task.result = result;
                this.cleanup(task.assetId);

                logger.info(`资产加载成功: ${task.assetId}`, {
                    attempts: attempt + 1,
                    elapsedMs: Date.now() - task.startTime
                });

                return result;

            } catch (error) {
                lastError = error as Error;

                // 记录错误类型
                if (error instanceof TimeoutError) {
                    task.state = LoadingState.Timeout;
                    logger.warn(`资产加载超时: ${task.assetId} (尝试 ${attempt + 1})`);
                } else if (error instanceof EntityDestroyedError) {
                    // 实体已销毁，不需要重试
                    throw error;
                } else {
                    logger.warn(`资产加载失败: ${task.assetId} (尝试 ${attempt + 1})`, error);
                }

                // 最后一次尝试失败
                if (attempt === task.maxRetries) {
                    task.state = LoadingState.Failed;
                    task.error = lastError;
                    this.cleanup(task.assetId);

                    logger.error(`资产加载最终失败: ${task.assetId}`, {
                        attempts: attempt + 1,
                        error: lastError.message
                    });

                    throw lastError;
                }

                // 计算重试延迟（指数退避）
                const delayMs = Math.min(
                    Math.pow(2, attempt) * options.retryDelayBase,
                    options.maxRetryDelay
                );

                logger.debug(`等待 ${delayMs}ms 后重试...`);
                await this.delay(delayMs);
            }
        }

        throw lastError!;
    }

    /**
     * Promise 超时包装
     */
    private withTimeout<T>(
        promise: Promise<T>,
        timeoutMs: number,
        message: string
    ): Promise<T> {
        let timeoutId: NodeJS.Timeout | number;

        const timeoutPromise = new Promise<T>((_, reject) => {
            timeoutId = setTimeout(() => {
                reject(new TimeoutError(message));
            }, timeoutMs);
        });

        return Promise.race([
            promise.then(result => {
                clearTimeout(timeoutId as any);
                return result;
            }),
            timeoutPromise
        ]).catch(error => {
            clearTimeout(timeoutId as any);
            throw error;
        });
    }

    /**
     * 循环依赖检测
     */
    private detectCircularDependency(assetId: string, parentAssetId: string): boolean {
        // 如果父资产正在加载中，说明有循环
        if (this.loadingStack.has(parentAssetId)) {
            return true;
        }

        // TODO: 更复杂的循环检测（检查完整的依赖链）
        // 当前只检测直接循环（A→B→A）
        // 未来可以检测间接循环（A→B→C→A）

        return false;
    }

    /**
     * 获取任务状态
     */
    getTaskState(assetId: string): LoadingState {
        return this.tasks.get(assetId)?.state ?? LoadingState.Idle;
    }

    /**
     * 获取任务
     */
    getTask(assetId: string): LoadingTask | undefined {
        return this.tasks.get(assetId);
    }

    /**
     * 取消加载
     */
    cancelLoading(assetId: string): void {
        const task = this.tasks.get(assetId);
        if (task) {
            task.state = LoadingState.Cancelled;
            this.cleanup(assetId);
            logger.info(`取消加载: ${assetId}`);
        }
    }

    /**
     * 清理任务
     */
    private cleanup(assetId: string): void {
        const task = this.tasks.get(assetId);
        if (task) {
            // 清除实体引用，帮助GC
            (task as any).parentEntity = null;
        }
        this.tasks.delete(assetId);
        this.loadingStack.delete(assetId);
    }

    /**
     * 延迟
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 创建任务句柄
     */
    private createHandle(task: LoadingTask): LoadingTaskHandle {
        return {
            assetId: task.assetId,

            getState: () => task.state,

            getError: () => task.error,

            getProgress: (): LoadingProgress => {
                const now = Date.now();
                const elapsed = now - task.startTime;
                const remaining = Math.max(0, task.timeoutMs - elapsed);

                return {
                    state: task.state,
                    elapsedMs: elapsed,
                    remainingTimeoutMs: remaining,
                    retryCount: task.retryCount,
                    maxRetries: task.maxRetries
                };
            },

            cancel: () => this.cancelLoading(task.assetId),

            promise: task.promise
        };
    }

    /**
     * 获取所有正在加载的资产
     */
    getLoadingAssets(): string[] {
        return Array.from(this.tasks.keys());
    }

    /**
     * 获取加载统计信息
     */
    getStats(): {
        totalTasks: number;
        loadingTasks: number;
        failedTasks: number;
        timeoutTasks: number;
    } {
        const tasks = Array.from(this.tasks.values());

        return {
            totalTasks: tasks.length,
            loadingTasks: tasks.filter(t => t.state === LoadingState.Loading).length,
            failedTasks: tasks.filter(t => t.state === LoadingState.Failed).length,
            timeoutTasks: tasks.filter(t => t.state === LoadingState.Timeout).length
        };
    }

    /**
     * 清空所有任务
     */
    clear(): void {
        logger.info('清空所有加载任务', this.getStats());
        this.tasks.clear();
        this.loadingStack.clear();
    }

    /**
     * 释放资源
     */
    dispose(): void {
        this.clear();
    }
}
