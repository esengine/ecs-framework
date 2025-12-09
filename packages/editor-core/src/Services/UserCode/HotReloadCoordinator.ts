/**
 * Hot Reload Coordinator
 * 热更新协调器
 *
 * Coordinates the hot reload process to ensure safe code updates
 * without causing race conditions or inconsistent state.
 *
 * 协调热更新过程，确保代码更新安全，不会导致竞态条件或状态不一致。
 *
 * @example
 * ```typescript
 * const coordinator = new HotReloadCoordinator();
 * await coordinator.performHotReload(async () => {
 *     // Recompile and reload user code
 *     await userCodeService.compile(options);
 *     await userCodeService.load(outputPath, target);
 * });
 * ```
 */

import { createLogger } from '@esengine/ecs-framework';
import type { HotReloadEvent } from './IUserCodeService';

const logger = createLogger('HotReloadCoordinator');

/**
 * Hot reload phase enumeration
 * 热更新阶段枚举
 */
export const enum EHotReloadPhase {
    /** Idle state, no hot reload in progress | 空闲状态，没有热更新进行中 */
    Idle = 'idle',
    /** Preparing for hot reload, pausing systems | 准备热更新，暂停系统 */
    Preparing = 'preparing',
    /** Compiling user code | 编译用户代码 */
    Compiling = 'compiling',
    /** Loading new modules | 加载新模块 */
    Loading = 'loading',
    /** Updating component instances | 更新组件实例 */
    UpdatingInstances = 'updating-instances',
    /** Updating systems | 更新系统 */
    UpdatingSystems = 'updating-systems',
    /** Resuming systems | 恢复系统 */
    Resuming = 'resuming',
    /** Hot reload complete | 热更新完成 */
    Complete = 'complete',
    /** Hot reload failed | 热更新失败 */
    Failed = 'failed'
}

/**
 * Hot reload status interface
 * 热更新状态接口
 */
export interface IHotReloadStatus {
    /** Current phase | 当前阶段 */
    phase: EHotReloadPhase;
    /** Error message if failed | 失败时的错误信息 */
    error?: string;
    /** Timestamp when current phase started | 当前阶段开始时间戳 */
    startTime: number;
    /** Number of updated instances | 更新的实例数量 */
    updatedInstances?: number;
    /** Number of updated systems | 更新的系统数量 */
    updatedSystems?: number;
}

/**
 * Hot reload options
 * 热更新选项
 */
export interface IHotReloadOptions {
    /**
     * Timeout for hot reload process in milliseconds.
     * 热更新过程的超时时间（毫秒）。
     *
     * @default 30000
     */
    timeout?: number;

    /**
     * Whether to restore previous state on failure.
     * 失败时是否恢复到之前的状态。
     *
     * @default true
     */
    restoreOnFailure?: boolean;

    /**
     * Callback for phase changes.
     * 阶段变化回调。
     */
    onPhaseChange?: (phase: EHotReloadPhase) => void;
}

/**
 * Hot Reload Coordinator
 * 热更新协调器
 *
 * Manages the hot reload process lifecycle:
 * 1. Pause ECS update loop
 * 2. Execute hot reload tasks (compile, load, update)
 * 3. Resume ECS update loop
 *
 * 管理热更新过程生命周期：
 * 1. 暂停 ECS 更新循环
 * 2. 执行热更新任务（编译、加载、更新）
 * 3. 恢复 ECS 更新循环
 */
export class HotReloadCoordinator {
    private _status: IHotReloadStatus = {
        phase: EHotReloadPhase.Idle,
        startTime: 0
    };

    private _coreReference: any = null;
    private _previousPausedState: boolean = false;
    private _hotReloadPromise: Promise<void> | null = null;
    private _onPhaseChange?: (phase: EHotReloadPhase) => void;

    /**
     * Get current hot reload status.
     * 获取当前热更新状态。
     */
    public get status(): Readonly<IHotReloadStatus> {
        return { ...this._status };
    }

    /**
     * Check if hot reload is in progress.
     * 检查热更新是否进行中。
     */
    public get isInProgress(): boolean {
        return this._status.phase !== EHotReloadPhase.Idle &&
               this._status.phase !== EHotReloadPhase.Complete &&
               this._status.phase !== EHotReloadPhase.Failed;
    }

    /**
     * Initialize coordinator with Core reference.
     * 使用 Core 引用初始化协调器。
     *
     * @param coreModule - ECS Framework Core module | ECS 框架 Core 模块
     */
    public initialize(coreModule: any): void {
        this._coreReference = coreModule;
        logger.info('HotReloadCoordinator initialized');
    }

    /**
     * Perform a coordinated hot reload.
     * 执行协调的热更新。
     *
     * This method ensures the ECS loop is paused during hot reload
     * and properly resumed afterward, even if an error occurs.
     *
     * 此方法确保 ECS 循环在热更新期间暂停，并在之后正确恢复，即使发生错误。
     *
     * @param reloadTask - Async function that performs the actual reload | 执行实际重载的异步函数
     * @param options - Hot reload options | 热更新选项
     * @returns Promise that resolves when hot reload is complete | 热更新完成时解析的 Promise
     */
    public async performHotReload(
        reloadTask: () => Promise<HotReloadEvent | void>,
        options: IHotReloadOptions = {}
    ): Promise<HotReloadEvent | void> {
        // Prevent concurrent hot reloads | 防止并发热更新
        if (this._hotReloadPromise) {
            logger.warn('Hot reload already in progress, waiting for completion | 热更新已在进行中，等待完成');
            await this._hotReloadPromise;
        }

        const {
            timeout = 30000,
            restoreOnFailure = true,
            onPhaseChange
        } = options;

        this._onPhaseChange = onPhaseChange;
        this._status = {
            phase: EHotReloadPhase.Idle,
            startTime: Date.now()
        };

        let result: HotReloadEvent | void = undefined;

        this._hotReloadPromise = (async () => {
            try {
                // Phase 1: Prepare - Pause ECS | 阶段 1：准备 - 暂停 ECS
                this._setPhase(EHotReloadPhase.Preparing);
                this._pauseECS();

                // Create timeout promise | 创建超时 Promise
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => {
                        reject(new Error(`Hot reload timed out after ${timeout}ms | 热更新超时 ${timeout}ms`));
                    }, timeout);
                });

                // Phase 2-5: Execute reload task with timeout | 阶段 2-5：带超时执行重载任务
                this._setPhase(EHotReloadPhase.Compiling);
                result = await Promise.race([
                    reloadTask(),
                    timeoutPromise
                ]);

                // Phase 6: Resume ECS | 阶段 6：恢复 ECS
                this._setPhase(EHotReloadPhase.Resuming);
                this._resumeECS();

                // Phase 7: Complete | 阶段 7：完成
                this._setPhase(EHotReloadPhase.Complete);
                logger.info('Hot reload completed successfully | 热更新成功完成', {
                    duration: Date.now() - this._status.startTime
                });

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this._status.error = errorMessage;
                this._setPhase(EHotReloadPhase.Failed);

                logger.error('Hot reload failed | 热更新失败:', error);

                // Always resume ECS on failure | 失败时始终恢复 ECS
                if (restoreOnFailure) {
                    this._resumeECS();
                }

                throw error;
            } finally {
                this._hotReloadPromise = null;
            }
        })();

        await this._hotReloadPromise;
        return result;
    }

    /**
     * Update hot reload status with instance count.
     * 更新热更新状态的实例数量。
     *
     * @param instanceCount - Number of updated instances | 更新的实例数量
     */
    public reportInstanceUpdate(instanceCount: number): void {
        this._status.updatedInstances = instanceCount;
        this._setPhase(EHotReloadPhase.UpdatingInstances);
    }

    /**
     * Update hot reload status with system count.
     * 更新热更新状态的系统数量。
     *
     * @param systemCount - Number of updated systems | 更新的系统数量
     */
    public reportSystemUpdate(systemCount: number): void {
        this._status.updatedSystems = systemCount;
        this._setPhase(EHotReloadPhase.UpdatingSystems);
    }

    /**
     * Pause ECS update loop.
     * 暂停 ECS 更新循环。
     */
    private _pauseECS(): void {
        if (!this._coreReference) {
            logger.warn('Core reference not set, cannot pause ECS | Core 引用未设置，无法暂停 ECS');
            return;
        }

        // Store previous paused state to restore later | 存储之前的暂停状态以便后续恢复
        this._previousPausedState = this._coreReference.paused ?? false;

        // Pause ECS | 暂停 ECS
        this._coreReference.paused = true;

        logger.debug('ECS paused for hot reload | ECS 已暂停以进行热更新');
    }

    /**
     * Resume ECS update loop.
     * 恢复 ECS 更新循环。
     */
    private _resumeECS(): void {
        if (!this._coreReference) {
            logger.warn('Core reference not set, cannot resume ECS | Core 引用未设置，无法恢复 ECS');
            return;
        }

        // Restore previous paused state | 恢复之前的暂停状态
        this._coreReference.paused = this._previousPausedState;

        logger.debug('ECS resumed after hot reload | 热更新后 ECS 已恢复', {
            paused: this._coreReference.paused
        });
    }

    /**
     * Set current phase and notify listener.
     * 设置当前阶段并通知监听器。
     */
    private _setPhase(phase: EHotReloadPhase): void {
        this._status.phase = phase;

        if (this._onPhaseChange) {
            try {
                this._onPhaseChange(phase);
            } catch (error) {
                logger.warn('Error in phase change callback | 阶段变化回调错误:', error);
            }
        }

        logger.debug(`Hot reload phase: ${phase} | 热更新阶段: ${phase}`);
    }

    /**
     * Reset coordinator state.
     * 重置协调器状态。
     */
    public reset(): void {
        this._status = {
            phase: EHotReloadPhase.Idle,
            startTime: 0
        };
        this._hotReloadPromise = null;
        this._onPhaseChange = undefined;
    }
}
