/**
 * 快照系统类型定义
 * 
 * 提供世界状态的全量快照与恢复功能
 */

/**
 * 快照接口
 */
export interface Snapshot {
    /** 帧编号 */
    frame: number;
    /** RNG种子 */
    seed: number;
    /** 世界状态哈希签名 */
    worldSig: number;
    /** 世界状态字节镜像 */
    payload: ArrayBuffer;
}

/**
 * 快照配置
 */
export interface SnapshotConfig {
    /** 快照窗口大小（保留多少帧） */
    windowFrames: number;
    /** 是否启用压缩 */
    enableCompression?: boolean;
    /** 哈希算法类型 */
    hashAlgorithm?: 'fnv1a' | 'murmur3';
}