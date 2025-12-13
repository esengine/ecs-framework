/**
 * 运行时模式服务
 * Runtime Mode Service
 *
 * 提供统一的运行时模式查询接口，使第三方模块能够感知当前运行环境。
 * Provides unified runtime mode query interface for third-party modules to be aware of current runtime environment.
 *
 * 模式定义 | Mode Definitions:
 * - Editor 模式：编辑器环境，显示网格、Gizmos、坐标轴等
 * - Playing 模式：游戏运行中（Play 按钮已按下）
 * - Preview 模式：预览模式（场景预览但不是完整的游戏运行）
 *
 * @example
 * ```typescript
 * import { RuntimeModeToken, type IRuntimeMode } from '@esengine/ecs-framework';
 *
 * // 获取服务
 * const runtimeMode = context.services.get(RuntimeModeToken);
 *
 * // 检查当前模式
 * if (runtimeMode?.isEditor) {
 *     // 编辑器特定逻辑
 * }
 *
 * // 监听模式变化
 * const unsubscribe = runtimeMode?.onModeChanged((mode) => {
 *     console.log('Mode changed:', mode.isPlaying ? 'Playing' : 'Stopped');
 * });
 * ```
 */

import { createServiceToken } from './PluginServiceRegistry';

// ============================================================================
// 接口定义 | Interface Definitions
// ============================================================================

/**
 * 运行时模式接口
 * Runtime mode interface
 */
export interface IRuntimeMode {
    /**
     * 是否为编辑器模式
     * Whether in editor mode
     *
     * 编辑器模式下会显示网格、Gizmos、坐标轴指示器等辅助元素。
     * In editor mode, grid, gizmos, axis indicator and other helper elements are shown.
     */
    readonly isEditor: boolean;

    /**
     * 是否正在播放（游戏运行中）
     * Whether playing (game is running)
     *
     * 当用户点击 Play 按钮后为 true，点击 Stop 后为 false。
     * True after user clicks Play button, false after clicking Stop.
     */
    readonly isPlaying: boolean;

    /**
     * 是否为预览模式
     * Whether in preview mode
     *
     * 预览模式是编辑器中的场景预览，不是完整的游戏运行。
     * Preview mode is scene preview in editor, not full game runtime.
     */
    readonly isPreview: boolean;

    /**
     * 是否为独立运行时（非编辑器环境）
     * Whether in standalone runtime (non-editor environment)
     *
     * Web 构建、移动端等独立运行环境中为 true。
     * True in standalone runtime environments like web build, mobile, etc.
     */
    readonly isStandalone: boolean;

    /**
     * 订阅模式变化事件
     * Subscribe to mode change events
     *
     * @param callback 模式变化回调
     * @returns 取消订阅函数
     */
    onModeChanged(callback: (mode: IRuntimeMode) => void): () => void;
}

// ============================================================================
// 服务令牌 | Service Token
// ============================================================================

/**
 * 运行时模式服务令牌
 * Runtime mode service token
 */
export const RuntimeModeToken = createServiceToken<IRuntimeMode>('runtimeMode');

// ============================================================================
// 默认实现 | Default Implementation
// ============================================================================

/**
 * 模式变化回调类型
 * Mode change callback type
 */
type ModeChangeCallback = (mode: IRuntimeMode) => void;

/**
 * 运行时模式服务配置
 * Runtime mode service configuration
 */
export interface RuntimeModeConfig {
    /** 是否为编辑器模式 | Whether in editor mode */
    isEditor?: boolean;
    /** 是否正在播放 | Whether playing */
    isPlaying?: boolean;
    /** 是否为预览模式 | Whether in preview mode */
    isPreview?: boolean;
}

/**
 * 运行时模式服务默认实现
 * Default runtime mode service implementation
 */
export class RuntimeModeService implements IRuntimeMode {
    private _isEditor: boolean;
    private _isPlaying: boolean;
    private _isPreview: boolean;
    private _callbacks: Set<ModeChangeCallback> = new Set();

    /**
     * 创建运行时模式服务
     * Create runtime mode service
     *
     * @param config 初始配置
     */
    constructor(config: RuntimeModeConfig = {}) {
        this._isEditor = config.isEditor ?? false;
        this._isPlaying = config.isPlaying ?? false;
        this._isPreview = config.isPreview ?? false;
    }

    // ========== IRuntimeMode 实现 ==========

    get isEditor(): boolean {
        return this._isEditor;
    }

    get isPlaying(): boolean {
        return this._isPlaying;
    }

    get isPreview(): boolean {
        return this._isPreview;
    }

    get isStandalone(): boolean {
        return !this._isEditor;
    }

    onModeChanged(callback: ModeChangeCallback): () => void {
        this._callbacks.add(callback);
        return () => {
            this._callbacks.delete(callback);
        };
    }

    // ========== 设置方法（供运行时内部使用）==========

    /**
     * 设置编辑器模式
     * Set editor mode
     *
     * @internal
     */
    setEditorMode(isEditor: boolean): void {
        if (this._isEditor !== isEditor) {
            this._isEditor = isEditor;
            this._notifyChange();
        }
    }

    /**
     * 设置播放状态
     * Set playing state
     *
     * @internal
     */
    setPlaying(isPlaying: boolean): void {
        if (this._isPlaying !== isPlaying) {
            this._isPlaying = isPlaying;
            this._notifyChange();
        }
    }

    /**
     * 设置预览模式
     * Set preview mode
     *
     * @internal
     */
    setPreview(isPreview: boolean): void {
        if (this._isPreview !== isPreview) {
            this._isPreview = isPreview;
            this._notifyChange();
        }
    }

    /**
     * 批量更新模式
     * Batch update mode
     *
     * @internal
     */
    updateMode(config: RuntimeModeConfig): void {
        let changed = false;

        if (config.isEditor !== undefined && this._isEditor !== config.isEditor) {
            this._isEditor = config.isEditor;
            changed = true;
        }

        if (config.isPlaying !== undefined && this._isPlaying !== config.isPlaying) {
            this._isPlaying = config.isPlaying;
            changed = true;
        }

        if (config.isPreview !== undefined && this._isPreview !== config.isPreview) {
            this._isPreview = config.isPreview;
            changed = true;
        }

        if (changed) {
            this._notifyChange();
        }
    }

    /**
     * 通知模式变化
     * Notify mode change
     */
    private _notifyChange(): void {
        for (const callback of this._callbacks) {
            try {
                callback(this);
            } catch (error) {
                console.error('[RuntimeModeService] Callback error:', error);
            }
        }
    }

    /**
     * 释放资源
     * Dispose resources
     */
    dispose(): void {
        this._callbacks.clear();
    }
}

/**
 * 创建编辑器模式服务
 * Create editor mode service
 */
export function createEditorModeService(): RuntimeModeService {
    return new RuntimeModeService({
        isEditor: true,
        isPlaying: false,
        isPreview: false
    });
}

/**
 * 创建独立运行时模式服务
 * Create standalone runtime mode service
 */
export function createStandaloneModeService(): RuntimeModeService {
    return new RuntimeModeService({
        isEditor: false,
        isPlaying: true,
        isPreview: false
    });
}
