import { InputRecord, Recording, ReplayerState, SnapshotRef } from './RecorderTypes';
import { WorldAdapter, DecodeOptions } from './WorldAdapter';
import { createLogger, ILogger } from '../../../Utils/Logger';

/**
 * 输入回放处理函数类型
 */
export type InputHandler = (frame: number, playerId: number, payload: Uint8Array) => void;

/**
 * 回放进度回调函数类型
 */
export type ProgressCallback = (currentFrame: number, totalFrames: number) => void;

/**
 * 回放器配置选项
 */
export interface ReplayerOptions {
    /** 是否启用严格模式（要求输入按帧顺序处理） */
    strictMode?: boolean;
    /** 最大回放帧数限制 */
    maxFrames?: number;
    /** 进度回调函数 */
    onProgress?: ProgressCallback;
}

/**
 * 录制回放器
 * 负责加载快照并按录制数据回放输入事件
 */
export class Replayer {
    private _logger: ILogger;
    private _state: ReplayerState = ReplayerState.Uninitialized;
    private _adapter?: WorldAdapter;
    private _snapshot?: SnapshotRef;
    private _recording?: Recording;
    private _options: Required<ReplayerOptions>;
    private _currentFrame: number = 0;
    private _inputHandlers: InputHandler[] = [];

    constructor(adapter?: WorldAdapter, options: ReplayerOptions = {}) {
        this._logger = createLogger('Replayer');
        this._adapter = adapter;
        this._options = {
            strictMode: true,
            maxFrames: 100000,
            onProgress: () => {},
            ...options
        };
    }

    /**
     * 获取当前回放器状态
     */
    public get state(): ReplayerState {
        return this._state;
    }

    /**
     * 获取当前帧号
     */
    public get currentFrame(): number {
        return this._currentFrame;
    }

    /**
     * 获取录制信息
     */
    public get recordingInfo(): { seed: number; totalFrames: number; recordCount: number } | null {
        if (!this._recording) {
            return null;
        }

        const frames = this._recording.records.map(r => r.frame);
        return {
            seed: this._recording.seed,
            totalFrames: frames.length > 0 ? Math.max(...frames) : 0,
            recordCount: this._recording.records.length
        };
    }

    /**
     * 设置世界适配器
     * @param adapter 世界适配器实例
     */
    public setAdapter(adapter: WorldAdapter): void {
        this._adapter = adapter;
        this._logger.debug('设置世界适配器');
    }

    /**
     * 加载快照
     * @param snapshot 快照引用
     * @param decodeOptions 解码选项
     */
    public loadSnapshot(snapshot: SnapshotRef, decodeOptions?: DecodeOptions): void {
        if (!this._adapter) {
            throw new Error('未设置世界适配器');
        }

        // 复制快照确保不变性
        this._snapshot = snapshot;

        try {
            // 解码快照到世界状态
            this._adapter.decode(this._snapshot.payload, decodeOptions);
            this._currentFrame = this._snapshot.frame;
            this._state = ReplayerState.SnapshotLoaded;
            
            this._logger.info(`快照已加载 - 帧:${snapshot.frame}, 种子:${snapshot.seed}`);
        } catch (error) {
            this._logger.error('快照加载失败', error);
            throw error;
        }
    }

    /**
     * 设置录制数据
     * @param recording 录制数据
     */
    public setRecording(recording: Recording): void {
        if (this._state === ReplayerState.Uninitialized) {
            this._logger.warn('请先加载快照');
            return;
        }

        // 验证录制数据与快照的兼容性
        if (this._snapshot && this._snapshot.seed !== recording.seed) {
            if (this._options.strictMode) {
                throw new Error(`种子不匹配: 快照种子${this._snapshot.seed}, 录制种子${recording.seed}`);
            } else {
                this._logger.warn(`种子不匹配: 快照种子${this._snapshot.seed}, 录制种子${recording.seed}`);
            }
        }

        // 复制录制数据并排序
        this._recording = {
            seed: recording.seed,
            records: [...recording.records].sort((a, b) => {
                if (a.frame !== b.frame) {
                    return a.frame - b.frame;
                }
                return a.playerId - b.playerId;
            })
        };

        this._state = ReplayerState.Ready;
        this._logger.info(`录制数据已设置 - 种子:${recording.seed}, 记录数:${recording.records.length}`);
    }

    /**
     * 添加输入处理函数
     * @param handler 输入处理函数
     */
    public addInputHandler(handler: InputHandler): void {
        this._inputHandlers.push(handler);
    }

    /**
     * 移除输入处理函数
     * @param handler 要移除的处理函数
     */
    public removeInputHandler(handler: InputHandler): void {
        const index = this._inputHandlers.indexOf(handler);
        if (index >= 0) {
            this._inputHandlers.splice(index, 1);
        }
    }

    /**
     * 回放到指定帧
     * @param targetFrame 目标帧号（可选，默认回放所有）
     */
    public replayTo(targetFrame?: number): void {
        if (this._state !== ReplayerState.Ready) {
            throw new Error(`回放器状态错误: ${this._state}`);
        }

        if (!this._recording) {
            throw new Error('未设置录制数据');
        }

        this._state = ReplayerState.Replaying;
        
        // 确定实际目标帧
        const frames = this._recording.records.map(r => r.frame);
        const maxFrame = frames.length > 0 ? Math.max(...frames) : this._currentFrame;
        const actualTarget = targetFrame !== undefined ? 
            Math.min(targetFrame, maxFrame, this._currentFrame + this._options.maxFrames) : 
            Math.min(maxFrame, this._currentFrame + this._options.maxFrames);

        this._logger.info(`开始回放 - 从帧${this._currentFrame}到帧${actualTarget}`);

        try {
            // 找到需要处理的输入记录
            const relevantRecords = this._recording.records.filter(record => 
                record.frame > this._currentFrame && record.frame <= actualTarget
            );

            let processedCount = 0;
            const totalCount = relevantRecords.length;

            // 按帧顺序处理输入
            for (const record of relevantRecords) {
                this._currentFrame = Math.max(this._currentFrame, record.frame);
                
                // 调用所有输入处理函数
                for (const handler of this._inputHandlers) {
                    try {
                        handler(record.frame, record.playerId, record.payload);
                    } catch (error) {
                        this._logger.error(`输入处理失败 - 帧:${record.frame}, 玩家:${record.playerId}`, error);
                        if (this._options.strictMode) {
                            throw error;
                        }
                    }
                }

                processedCount++;
                
                // 触发进度回调
                if (processedCount % 10 === 0 || processedCount === totalCount) {
                    this._options.onProgress(processedCount, totalCount);
                }
            }

            this._currentFrame = actualTarget;
            this._state = actualTarget >= maxFrame ? ReplayerState.Completed : ReplayerState.Ready;
            
            this._logger.info(`回放完成 - 处理了${processedCount}条输入记录，当前帧:${this._currentFrame}`);

        } catch (error) {
            this._state = ReplayerState.Ready;
            this._logger.error('回放过程中发生错误', error);
            throw error;
        }
    }

    /**
     * 重置回放器到快照状态
     */
    public reset(): void {
        if (!this._snapshot) {
            this._logger.warn('没有快照可供重置');
            return;
        }

        if (!this._adapter) {
            throw new Error('未设置世界适配器');
        }

        try {
            // 重新加载快照
            this._adapter.decode(this._snapshot.payload);
            this._currentFrame = this._snapshot.frame;
            this._state = this._recording ? ReplayerState.Ready : ReplayerState.SnapshotLoaded;
            
            this._logger.info(`回放器已重置到快照状态 - 帧:${this._snapshot.frame}`);
        } catch (error) {
            this._logger.error('重置失败', error);
            throw error;
        }
    }

    /**
     * 获取指定帧范围内的输入记录
     * @param startFrame 起始帧
     * @param endFrame 结束帧
     * @returns 输入记录数组
     */
    public getInputsInRange(startFrame: number, endFrame: number): InputRecord[] {
        if (!this._recording) {
            return [];
        }

        return this._recording.records.filter(record => 
            record.frame >= startFrame && record.frame <= endFrame
        );
    }

    /**
     * 获取回放统计信息
     */
    public getStats(): {
        state: ReplayerState;
        currentFrame: number;
        snapshotFrame?: number;
        recordingInfo?: { seed: number; totalFrames: number; recordCount: number };
        progress?: { current: number; total: number; percentage: number };
    } {
        const stats: any = {
            state: this._state,
            currentFrame: this._currentFrame
        };

        if (this._snapshot) {
            stats.snapshotFrame = this._snapshot.frame;
        }

        const recordingInfo = this.recordingInfo;
        if (recordingInfo) {
            stats.recordingInfo = recordingInfo;
            
            if (this._snapshot) {
                const totalFrames = recordingInfo.totalFrames - this._snapshot.frame;
                const currentProgress = this._currentFrame - this._snapshot.frame;
                stats.progress = {
                    current: Math.max(0, currentProgress),
                    total: Math.max(0, totalFrames),
                    percentage: totalFrames > 0 ? (currentProgress / totalFrames) * 100 : 0
                };
            }
        }

        return stats;
    }
}