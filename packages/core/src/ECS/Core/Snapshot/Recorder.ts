import { InputRecord, Recording, RecorderState } from './RecorderTypes';
import { createLogger, ILogger } from '../../../Utils/Logger';

/**
 * 输入录制器
 * 负责记录游戏过程中的所有输入事件
 */
export class Recorder {
    private _logger: ILogger;
    private _state: RecorderState = RecorderState.Idle;
    private _seed: number = 0;
    private _records: InputRecord[] = [];
    private _startTime: number = 0;

    constructor() {
        this._logger = createLogger('Recorder');
    }

    /**
     * 获取当前录制器状态
     */
    public get state(): RecorderState {
        return this._state;
    }

    /**
     * 获取当前记录数量
     */
    public get recordCount(): number {
        return this._records.length;
    }

    /**
     * 获取录制持续时间（毫秒）
     */
    public get duration(): number {
        if (this._state === RecorderState.Idle) {
            return 0;
        }
        const now = Date.now();
        return now - this._startTime;
    }

    /**
     * 开始录制
     * @param seed 随机数种子
     */
    public start(seed: number): void {
        if (this._state !== RecorderState.Idle) {
            this._logger.warn(`录制器当前状态为${this._state}，无法开始录制`);
            return;
        }

        this._seed = seed;
        this._records = [];
        this._startTime = Date.now();
        this._state = RecorderState.Recording;
        
        this._logger.info(`开始录制，种子: ${seed}`);
    }

    /**
     * 记录输入事件
     * @param frame 帧号
     * @param playerId 玩家ID
     * @param payload 输入数据
     */
    public push(frame: number, playerId: number, payload: Uint8Array): void {
        if (this._state !== RecorderState.Recording) {
            this._logger.warn(`录制器未在录制状态，当前状态: ${this._state}`);
            return;
        }

        if (frame < 0) {
            this._logger.warn(`帧号不能为负数: ${frame}`);
            return;
        }

        if (playerId < 0) {
            this._logger.warn(`玩家ID不能为负数: ${playerId}`);
            return;
        }

        // 检查帧序是否合理（允许相同帧的多个输入，但不允许倒退）
        if (this._records.length > 0) {
            const lastFrame = this._records[this._records.length - 1].frame;
            if (frame < lastFrame) {
                this._logger.warn(`帧序倒退：当前帧${frame}，上一帧${lastFrame}`);
                return;
            }
        }

        // 复制payload确保数据不变性
        const record: InputRecord = {
            frame,
            playerId,
            payload: new Uint8Array(payload)
        };

        this._records.push(record);
        
        this._logger.debug(`记录输入 - 帧:${frame}, 玩家:${playerId}, 数据长度:${payload.length}`);
    }

    /**
     * 停止录制并返回录制结果
     * @returns 完整录制数据
     */
    public stop(): Recording {
        if (this._state !== RecorderState.Recording) {
            this._logger.warn(`录制器未在录制状态，当前状态: ${this._state}`);
            return { seed: 0, records: [] };
        }

        this._state = RecorderState.Stopped;
        
        // 按帧号和玩家ID排序确保一致性
        const sortedRecords = [...this._records].sort((a, b) => {
            if (a.frame !== b.frame) {
                return a.frame - b.frame;
            }
            return a.playerId - b.playerId;
        });

        const recording: Recording = {
            seed: this._seed,
            records: sortedRecords
        };

        const duration = this.duration;
        this._logger.info(`录制完成 - 种子:${this._seed}, 记录数:${sortedRecords.length}, 持续时间:${duration}ms`);

        return recording;
    }

    /**
     * 重置录制器到空闲状态
     */
    public reset(): void {
        this._state = RecorderState.Idle;
        this._seed = 0;
        this._records = [];
        this._startTime = 0;
        
        this._logger.debug('录制器已重置');
    }

    /**
     * 获取当前录制的统计信息
     */
    public getStats(): {
        state: RecorderState;
        seed: number;
        recordCount: number;
        duration: number;
        frameRange?: { min: number; max: number };
        playerIds?: number[];
    } {
        const stats = {
            state: this._state,
            seed: this._seed,
            recordCount: this._records.length,
            duration: this.duration
        };

        if (this._records.length > 0) {
            const frames = this._records.map(r => r.frame);
            const playerIds = [...new Set(this._records.map(r => r.playerId))].sort((a, b) => a - b);
            
            return {
                ...stats,
                frameRange: {
                    min: Math.min(...frames),
                    max: Math.max(...frames)
                },
                playerIds
            };
        }

        return stats;
    }
}