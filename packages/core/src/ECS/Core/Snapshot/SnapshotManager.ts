/**
 * 快照管理器
 * 
 * 提供高级的快照管理功能
 */

import { SnapshotConfig } from './SnapshotTypes';
import { SnapshotStore, SnapshotRef } from './SnapshotStore';
import { WorldAdapter } from './WorldAdapter';
import { SceneWorldAdapter } from './SceneWorldAdapter';
import { Scene } from '../../Scene';
import { createLogger } from '../../../Utils/Logger';
import { GlobalRNG } from '../../../Utils/PRNG/GlobalRNG';

/**
 * 快照管理器选项
 */
export interface SnapshotManagerOptions extends SnapshotConfig {
    /** 自动快照间隔（帧数） */
    autoSnapshotInterval?: number;
    /** 是否启用自动快照 */
    enableAutoSnapshot?: boolean;
    /** 最大存储大小（字节） */
    maxStorageBytes?: number;
}

/**
 * 快照恢复结果
 */
export interface RestoreResult {
    /** 是否成功 */
    success: boolean;
    /** 恢复的快照 */
    snapshot?: SnapshotRef;
    /** 错误信息 */
    error?: string;
    /** 恢复耗时（毫秒） */
    duration?: number;
}

/**
 * 快照管理器
 */
export class SnapshotManager {
    private _logger = createLogger('SnapshotManager');
    private _store: SnapshotStore;
    private _adapter: WorldAdapter;
    private _options: SnapshotManagerOptions;
    private _scene: Scene;
    private _currentFrame = 0;
    private _lastAutoSnapshot = 0;
    private _isEnabled = true;

    constructor(scene: Scene, options: SnapshotManagerOptions = { windowFrames: 60 }) {
        this._scene = scene;
        const defaultOptions: SnapshotManagerOptions = {
            windowFrames: 60,
            autoSnapshotInterval: 10,
            enableAutoSnapshot: false,
            maxStorageBytes: 100 * 1024 * 1024, // 100MB
        };
        
        this._options = { ...defaultOptions, ...options };

        this._adapter = new SceneWorldAdapter(scene);
        this._store = new SnapshotStore(this._options, this._adapter);
        
        this._logger.debug('快照管理器初始化完成', this._options);
    }

    /**
     * 启用快照系统
     */
    public enable(): void {
        this._isEnabled = true;
        this._logger.debug('快照系统已启用');
    }

    /**
     * 禁用快照系统
     */
    public disable(): void {
        this._isEnabled = false;
        this._logger.debug('快照系统已禁用');
    }

    /**
     * 是否启用
     */
    public get enabled(): boolean {
        return this._isEnabled;
    }

    /**
     * 获取当前帧
     */
    public get currentFrame(): number {
        return this._currentFrame;
    }

    /**
     * 设置当前帧
     */
    public setCurrentFrame(frame: number): void {
        this._currentFrame = frame;
    }

    /**
     * 更新快照管理器（通常在帧末调用）
     */
    public update(): void {
        if (!this._isEnabled) return;

        this._currentFrame++;

        // 自动快照
        if (this._options.enableAutoSnapshot && this._options.autoSnapshotInterval) {
            if (this._currentFrame - this._lastAutoSnapshot >= this._options.autoSnapshotInterval) {
                this.capture(this._currentFrame);
                this._lastAutoSnapshot = this._currentFrame;
            }
        }

        // 检查存储大小限制
        this._checkStorageLimit();
    }

    /**
     * 捕获当前帧快照
     */
    public capture(frame?: number): SnapshotRef | null {
        if (!this._isEnabled) {
            this._logger.warn('快照系统已禁用');
            return null;
        }

        const targetFrame = frame ?? this._currentFrame;
        const seed = GlobalRNG.getGlobalSeed().valueOf() & 0xFFFFFFFF;
        
        return this._store.capture(targetFrame, seed);
    }

    /**
     * 恢复到指定帧
     */
    public restore(frame: number): RestoreResult {
        if (!this._isEnabled) {
            return {
                success: false,
                error: '快照系统已禁用'
            };
        }

        const startTime = performance.now();
        
        const snapshot = this._store.findNearest(frame);
        if (!snapshot) {
            return {
                success: false,
                error: `未找到帧 ${frame} 的快照`
            };
        }

        const success = this._store.restore(snapshot);
        const duration = performance.now() - startTime;

        if (success) {
            this._currentFrame = snapshot.frame;
            this._logger.info(`已恢复到帧 ${snapshot.frame}`);
        }

        return {
            success,
            snapshot: success ? snapshot : undefined,
            error: success ? undefined : '快照恢复失败',
            duration
        };
    }

    /**
     * 恢复精确帧快照
     */
    public restoreExact(frame: number): RestoreResult {
        if (!this._isEnabled) {
            return {
                success: false,
                error: '快照系统已禁用'
            };
        }

        const startTime = performance.now();
        
        const snapshot = this._store.findExact(frame);
        if (!snapshot) {
            return {
                success: false,
                error: `未找到帧 ${frame} 的精确快照`
            };
        }

        const success = this._store.restore(snapshot);
        const duration = performance.now() - startTime;

        if (success) {
            this._currentFrame = snapshot.frame;
        }

        return {
            success,
            snapshot: success ? snapshot : undefined,
            error: success ? undefined : '快照恢复失败',
            duration
        };
    }

    /**
     * 获取快照存储
     */
    public get store(): SnapshotStore {
        return this._store;
    }

    /**
     * 获取世界适配器
     */
    public get adapter(): WorldAdapter {
        return this._adapter;
    }

    /**
     * 获取所有快照
     */
    public getAllSnapshots(): SnapshotRef[] {
        return this._store.getAllSnapshots();
    }

    /**
     * 获取快照统计
     */
    public getStats(): {
        enabled: boolean;
        currentFrame: number;
        snapshotCount: number;
        totalBytes: number;
        storeStats: ReturnType<SnapshotStore['getStats']>;
    } {
        return {
            enabled: this._isEnabled,
            currentFrame: this._currentFrame,
            snapshotCount: this._store.count,
            totalBytes: this._store.getStats().totalBytes,
            storeStats: this._store.getStats()
        };
    }

    /**
     * 清空所有快照
     */
    public clear(): void {
        this._store.clear();
        this._lastAutoSnapshot = 0;
        this._logger.info('所有快照已清空');
    }

    /**
     * 验证快照完整性
     */
    public validate(): boolean {
        return this._store.validate();
    }

    /**
     * 设置自动快照
     */
    public setAutoSnapshot(enabled: boolean, interval?: number): void {
        this._options.enableAutoSnapshot = enabled;
        if (interval !== undefined) {
            this._options.autoSnapshotInterval = interval;
        }
        
        this._logger.debug(`自动快照: ${enabled ? '启用' : '禁用'}, 间隔: ${this._options.autoSnapshotInterval}帧`);
    }

    /**
     * 检查存储大小限制
     */
    private _checkStorageLimit(): void {
        if (!this._options.maxStorageBytes) return;

        const stats = this._store.getStats();
        if (stats.totalBytes > this._options.maxStorageBytes) {
            this._logger.warn(
                `快照存储超出限制: ${stats.totalBytes}/${this._options.maxStorageBytes}字节, ` +
                '考虑减少窗口大小或增加存储限制'
            );
        }
    }
}