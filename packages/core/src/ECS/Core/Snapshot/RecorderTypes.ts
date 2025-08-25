/**
 * 输入记录结构
 */
export interface InputRecord {
    /** 帧号 */
    frame: number;
    /** 玩家ID */
    playerId: number;
    /** 输入数据负载 */
    payload: Uint8Array;
}

/**
 * 完整录制数据
 */
export interface Recording {
    /** 随机数种子 */
    seed: number;
    /** 输入记录列表 */
    records: InputRecord[];
}

/**
 * 录制器状态
 */
export enum RecorderState {
    /** 未开始 */
    Idle = 'Idle',
    /** 录制中 */
    Recording = 'Recording',
    /** 已停止 */
    Stopped = 'Stopped'
}

/**
 * 回放器状态
 */
export enum ReplayerState {
    /** 未初始化 */
    Uninitialized = 'Uninitialized',
    /** 已加载快照 */
    SnapshotLoaded = 'SnapshotLoaded',
    /** 已设置录制 */
    Ready = 'Ready',
    /** 回放中 */
    Replaying = 'Replaying',
    /** 回放完成 */
    Completed = 'Completed'
}

/**
 * 重导出已存在的快照引用类型
 */
export { SnapshotRef } from './SnapshotStore';