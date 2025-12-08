/**
 * Build Service.
 * 构建服务。
 *
 * Manages build pipelines and executes build tasks.
 * 管理构建管线和执行构建任务。
 */

import type { IService } from '@esengine/esengine';
import type {
    IBuildPipeline,
    IBuildPipelineRegistry,
    BuildPlatform,
    BuildConfig,
    BuildResult,
    BuildProgress
} from './IBuildPipeline';
import { BuildStatus } from './IBuildPipeline';

/**
 * Build task.
 * 构建任务。
 */
export interface BuildTask {
    /** Task ID | 任务 ID */
    id: string;
    /** Target platform | 目标平台 */
    platform: BuildPlatform;
    /** Build configuration | 构建配置 */
    config: BuildConfig;
    /** Current progress | 当前进度 */
    progress: BuildProgress;
    /** Start time | 开始时间 */
    startTime: Date;
    /** End time | 结束时间 */
    endTime?: Date;
    /** Abort controller | 中止控制器 */
    abortController: AbortController;
}

/**
 * Build Service.
 * 构建服务。
 *
 * Provides build pipeline registration and build task management.
 * 提供构建管线注册和构建任务管理。
 *
 * @example
 * ```typescript
 * const buildService = services.resolve(BuildService);
 *
 * // Register build pipeline | 注册构建管线
 * buildService.registerPipeline(new WebBuildPipeline());
 * buildService.registerPipeline(new WeChatBuildPipeline());
 *
 * // Execute build | 执行构建
 * const result = await buildService.build({
 *     platform: BuildPlatform.Web,
 *     outputPath: './dist',
 *     isRelease: true,
 *     sourceMap: false
 * }, (progress) => {
 *     console.log(`${progress.message} (${progress.progress}%)`);
 * });
 * ```
 */
export class BuildService implements IService, IBuildPipelineRegistry {
    private _pipelines = new Map<BuildPlatform, IBuildPipeline>();
    private _currentTask: BuildTask | null = null;
    private _taskHistory: BuildTask[] = [];
    private _maxHistorySize = 10;

    /**
     * Dispose service resources.
     * 释放服务资源。
     */
    dispose(): void {
        this.cancelBuild();
        this._pipelines.clear();
        this._taskHistory = [];
    }

    /**
     * Register build pipeline.
     * 注册构建管线。
     *
     * @param pipeline - Build pipeline instance | 构建管线实例
     */
    register(pipeline: IBuildPipeline): void {
        if (this._pipelines.has(pipeline.platform)) {
            console.warn(`[BuildService] Overwriting existing pipeline: ${pipeline.platform} | 覆盖已存在的构建管线: ${pipeline.platform}`);
        }
        this._pipelines.set(pipeline.platform, pipeline);
        console.log(`[BuildService] Registered pipeline: ${pipeline.displayName} | 注册构建管线: ${pipeline.displayName}`);
    }

    /**
     * Get build pipeline.
     * 获取构建管线。
     *
     * @param platform - Target platform | 目标平台
     * @returns Build pipeline, or undefined if not registered | 构建管线，如果未注册则返回 undefined
     */
    get(platform: BuildPlatform): IBuildPipeline | undefined {
        return this._pipelines.get(platform);
    }

    /**
     * Get all registered build pipelines.
     * 获取所有已注册的构建管线。
     *
     * @returns Build pipeline list | 构建管线列表
     */
    getAll(): IBuildPipeline[] {
        return Array.from(this._pipelines.values());
    }

    /**
     * Check if platform is registered.
     * 检查平台是否已注册。
     *
     * @param platform - Target platform | 目标平台
     * @returns Whether registered | 是否已注册
     */
    has(platform: BuildPlatform): boolean {
        return this._pipelines.has(platform);
    }

    /**
     * Get available build platforms.
     * 获取可用的构建平台。
     *
     * Checks availability of each registered platform.
     * 检查每个已注册平台的可用性。
     *
     * @returns Available platforms and their status | 可用平台及其状态
     */
    async getAvailablePlatforms(): Promise<Array<{
        platform: BuildPlatform;
        displayName: string;
        description?: string;
        available: boolean;
        reason?: string;
    }>> {
        const results = [];

        for (const pipeline of this._pipelines.values()) {
            const availability = await pipeline.checkAvailability();
            results.push({
                platform: pipeline.platform,
                displayName: pipeline.displayName,
                description: pipeline.description,
                available: availability.available,
                reason: availability.reason
            });
        }

        return results;
    }

    /**
     * Execute build.
     * 执行构建。
     *
     * @param config - Build configuration | 构建配置
     * @param onProgress - Progress callback | 进度回调
     * @returns Build result | 构建结果
     */
    async build(
        config: BuildConfig,
        onProgress?: (progress: BuildProgress) => void
    ): Promise<BuildResult> {
        // Check if there's an ongoing build | 检查是否有正在进行的构建
        if (this._currentTask) {
            throw new Error('A build task is already in progress | 已有构建任务正在进行中');
        }

        // Get build pipeline | 获取构建管线
        const pipeline = this._pipelines.get(config.platform);
        if (!pipeline) {
            throw new Error(`Pipeline not found for platform ${config.platform} | 未找到平台 ${config.platform} 的构建管线`);
        }

        // Validate configuration | 验证配置
        const errors = pipeline.validateConfig(config);
        if (errors.length > 0) {
            throw new Error(`Invalid build configuration | 构建配置无效:\n${errors.join('\n')}`);
        }

        // Create build task | 创建构建任务
        const abortController = new AbortController();
        const task: BuildTask = {
            id: this._generateTaskId(),
            platform: config.platform,
            config,
            progress: {
                status: 'preparing' as BuildStatus,
                message: 'Preparing build... | 准备构建...',
                progress: 0,
                currentStep: 0,
                totalSteps: 0,
                warnings: []
            },
            startTime: new Date(),
            abortController
        };

        this._currentTask = task;

        try {
            // Execute build | 执行构建
            const result = await pipeline.build(
                config,
                (progress) => {
                    task.progress = progress;
                    onProgress?.(progress);
                },
                abortController.signal
            );

            // Update task status | 更新任务状态
            task.endTime = new Date();
            task.progress.status = result.success ? BuildStatus.Completed : BuildStatus.Failed;

            // Add to history | 添加到历史
            this._addToHistory(task);

            return result;
        } catch (error) {
            // Handle error | 处理错误
            task.endTime = new Date();
            task.progress.status = BuildStatus.Failed;
            task.progress.error = error instanceof Error ? error.message : String(error);

            this._addToHistory(task);

            return {
                success: false,
                platform: config.platform,
                outputPath: config.outputPath,
                duration: task.endTime.getTime() - task.startTime.getTime(),
                outputFiles: [],
                warnings: task.progress.warnings,
                error: task.progress.error
            };
        } finally {
            this._currentTask = null;
        }
    }

    /**
     * Cancel current build.
     * 取消当前构建。
     */
    cancelBuild(): void {
        if (this._currentTask) {
            this._currentTask.abortController.abort();
            this._currentTask.progress.status = BuildStatus.Cancelled;
            console.log('[BuildService] Build cancelled | 构建已取消');
        }
    }

    /**
     * Get current build task.
     * 获取当前构建任务。
     *
     * @returns Current task, or null if none | 当前任务，如果没有则返回 null
     */
    getCurrentTask(): BuildTask | null {
        return this._currentTask;
    }

    /**
     * Get build history.
     * 获取构建历史。
     *
     * @returns History task list (newest first) | 历史任务列表（最新的在前）
     */
    getHistory(): BuildTask[] {
        return [...this._taskHistory];
    }

    /**
     * Clear build history.
     * 清除构建历史。
     */
    clearHistory(): void {
        this._taskHistory = [];
    }

    /**
     * Generate task ID.
     * 生成任务 ID。
     */
    private _generateTaskId(): string {
        return `build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Add task to history.
     * 添加任务到历史。
     */
    private _addToHistory(task: BuildTask): void {
        this._taskHistory.unshift(task);
        if (this._taskHistory.length > this._maxHistorySize) {
            this._taskHistory.pop();
        }
    }
}
