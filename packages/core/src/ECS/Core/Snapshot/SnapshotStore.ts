/**
 * 快照存储系统
 * 
 * 管理世界状态快照的存储和检索
 */

import { Snapshot, SnapshotConfig } from './SnapshotTypes';
import { WorldAdapter } from './WorldAdapter';
import { createLogger } from '../../../Utils/Logger';

/**
 * 快照引用实现
 */
export class SnapshotRef implements Snapshot {
    constructor(
        public frame: number,
        public seed: number,
        public worldSig: number,
        public payload: ArrayBuffer,
    ) {}

    /**
     * 获取快照大小（字节）
     */
    public get size(): number {
        return this.payload.byteLength;
    }

    /**
     * 获取快照的调试信息
     */
    public getDebugInfo(): {
        frame: number;
        seed: number;
        worldSig: string;
        size: number;
        timestamp?: number;
    } {
        return {
            frame: this.frame,
            seed: this.seed,
            worldSig: `0x${this.worldSig.toString(16).padStart(8, '0')}`,
            size: this.size
        };
    }

    /**
     * 验证快照完整性
     */
    public validate(): boolean {
        return this.payload && this.payload.byteLength > 0 && this.frame >= 0;
    }
}

/**
 * 快照存储系统
 */
export class SnapshotStore {
    private _logger = createLogger('SnapshotStore');
    private _ring: (SnapshotRef | null)[];
    private _head = 0;
    private _config: SnapshotConfig;
    private _adapter?: WorldAdapter;
    private _totalSnapshots = 0;
    private _totalBytes = 0;

    constructor(config: SnapshotConfig, adapter?: WorldAdapter) {
        this._config = { ...config };
        this._adapter = adapter;
        this._ring = new Array(config.windowFrames).fill(null);
        this._logger.debug(`快照存储初始化: 窗口大小=${config.windowFrames}`);
    }

    /**
     * 设置世界适配器
     */
    public setAdapter(adapter: WorldAdapter): void {
        this._adapter = adapter;
    }

    /**
     * 获取配置
     */
    public get config(): Readonly<SnapshotConfig> {
        return this._config;
    }

    /**
     * 捕获当前帧快照
     */
    public capture(frame: number, seed: number = 0): SnapshotRef | null {
        if (!this._adapter) {
            this._logger.error('未设置世界适配器，无法捕获快照');
            return null;
        }

        try {
            const startTime = performance.now();
            
            const buf = this._adapter.encode();
            const sig = this._adapter.signature();
            const snap = new SnapshotRef(frame, seed, sig, buf);

            if (!snap.validate()) {
                this._logger.error('快照验证失败');
                return null;
            }

            // 存储到环形缓冲区
            const oldSnap = this._ring[this._head];
            if (oldSnap) {
                this._totalBytes -= oldSnap.size;
            }

            this._ring[this._head] = snap;
            this._head = (this._head + 1) % this._config.windowFrames;
            
            this._totalSnapshots++;
            this._totalBytes += snap.size;

            const duration = performance.now() - startTime;
            this._logger.debug(
                `快照捕获完成: 帧=${frame}, 签名=0x${sig.toString(16)}, ` +
                `大小=${snap.size}字节, 耗时=${duration.toFixed(2)}ms`
            );

            return snap;
        } catch (error) {
            this._logger.error('捕获快照失败:', error);
            return null;
        }
    }

    /**
     * 查找最接近指定帧的快照
     */
    public findNearest(frame: number): SnapshotRef | null {
        let best: SnapshotRef | null = null;
        
        for (const snap of this._ring) {
            if (!snap) continue;
            
            if (snap.frame <= frame && (!best || snap.frame > best.frame)) {
                best = snap;
            }
        }

        if (best) {
            this._logger.debug(`找到最近快照: 目标帧=${frame}, 快照帧=${best.frame}`);
        } else {
            this._logger.debug(`未找到快照: 目标帧=${frame}`);
        }

        return best;
    }

    /**
     * 查找确切帧的快照
     */
    public findExact(frame: number): SnapshotRef | null {
        for (const snap of this._ring) {
            if (snap && snap.frame === frame) {
                return snap;
            }
        }
        return null;
    }

    /**
     * 恢复快照
     */
    public restore(snap: SnapshotRef): boolean {
        if (!this._adapter) {
            this._logger.error('未设置世界适配器，无法恢复快照');
            return false;
        }

        if (!snap.validate()) {
            this._logger.error('快照无效，无法恢复');
            return false;
        }

        try {
            const startTime = performance.now();
            
            this._adapter.decode(snap.payload);
            
            // 验证恢复后的状态
            const currentSig = this._adapter.signature();
            if (currentSig !== snap.worldSig) {
                this._logger.warn(
                    `快照恢复后签名不匹配: 期望=0x${snap.worldSig.toString(16)}, ` +
                    `实际=0x${currentSig.toString(16)}`
                );
            }

            const duration = performance.now() - startTime;
            this._logger.debug(
                `快照恢复完成: 帧=${snap.frame}, 耗时=${duration.toFixed(2)}ms`
            );

            return true;
        } catch (error) {
            this._logger.error('恢复快照失败:', error);
            return false;
        }
    }

    /**
     * 获取所有快照
     */
    public getAllSnapshots(): SnapshotRef[] {
        return this._ring.filter(snap => snap !== null) as SnapshotRef[];
    }

    /**
     * 获取快照数量
     */
    public get count(): number {
        return this._ring.filter(snap => snap !== null).length;
    }

    /**
     * 获取存储统计信息
     */
    public getStats(): {
        windowSize: number;
        currentCount: number;
        totalSnapshots: number;
        totalBytes: number;
        averageSize: number;
        oldestFrame: number | null;
        newestFrame: number | null;
    } {
        const snapshots = this.getAllSnapshots();
        const frames = snapshots.map(s => s.frame).sort((a, b) => a - b);

        return {
            windowSize: this._config.windowFrames,
            currentCount: snapshots.length,
            totalSnapshots: this._totalSnapshots,
            totalBytes: this._totalBytes,
            averageSize: snapshots.length > 0 ? this._totalBytes / snapshots.length : 0,
            oldestFrame: frames.length > 0 ? frames[0] : null,
            newestFrame: frames.length > 0 ? frames[frames.length - 1] : null
        };
    }

    /**
     * 清空所有快照
     */
    public clear(): void {
        this._ring.fill(null);
        this._head = 0;
        this._totalBytes = 0;
        this._logger.debug('快照存储已清空');
    }

    /**
     * 验证存储完整性
     */
    public validate(): boolean {
        let isValid = true;

        for (const snap of this._ring) {
            if (snap && !snap.validate()) {
                this._logger.warn(`发现无效快照: 帧=${snap.frame}`);
                isValid = false;
            }
        }

        return isValid;
    }
}