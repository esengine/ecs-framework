/**
 * 输入系统 - 将平台输入事件连接到 InputManager
 * Input System - Connects platform input events to InputManager
 *
 * 在 ECS 更新循环中运行，负责：
 * 1. 在帧开始时已经由事件驱动更新了 InputManager
 * 2. 在帧末清理临时状态（justPressed, justReleased 等）
 *
 * Runs in ECS update loop, responsible for:
 * 1. InputManager is already updated by events at frame start
 * 2. Clear temporary state at frame end (justPressed, justReleased, etc.)
 */

import { EntitySystem, Matcher, ECSSystem } from '@esengine/ecs-framework';
import type { Entity } from '@esengine/ecs-framework';
import type {
    IPlatformInputSubsystem,
    KeyboardEventInfo,
    MouseEventInfo,
    WheelEventInfo,
    TouchEvent
} from '@esengine/platform-common';
import { Input, InputManager } from './InputManager';

/**
 * 输入系统配置
 * Input system configuration
 */
export interface InputSystemConfig {
    /**
     * 输入管理器实例，默认使用全局 Input
     * Input manager instance, defaults to global Input
     */
    inputManager?: InputManager;

    /**
     * 是否在编辑器模式下禁用（防止与编辑器输入冲突）
     * Whether to disable in editor mode (prevent conflict with editor input)
     */
    disableInEditor?: boolean;
}

/**
 * 输入系统
 * Input System
 *
 * 处理平台输入事件并更新 InputManager 状态。
 * Handles platform input events and updates InputManager state.
 *
 * @example
 * ```typescript
 * // 在 GameRuntime 中注册
 * const inputSystem = new InputSystem({
 *     inputSubsystem: webInputSubsystem
 * });
 * scene.addSystem(inputSystem);
 *
 * // 在游戏系统中使用
 * import { Input, MouseButton } from '@esengine/engine-core';
 *
 * class PlayerSystem extends EntitySystem {
 *     protected process(entities: readonly Entity[]): void {
 *         if (Input.isKeyDown('KeyW')) {
 *             // 移动玩家
 *         }
 *     }
 * }
 * ```
 */
@ECSSystem('InputSystem', { updateOrder: -1000 }) // 最先更新 | Update first
export class InputSystem extends EntitySystem {
    private _inputManager: InputManager;
    private _inputSubsystem: IPlatformInputSubsystem | null = null;
    private _disableInEditor: boolean;
    private _isInitialized: boolean = false;

    constructor(config: InputSystemConfig = {}) {
        // 不匹配任何实体，只用于生命周期 | Match no entities, only for lifecycle
        super(Matcher.nothing());

        this._inputManager = config.inputManager ?? Input;
        this._disableInEditor = config.disableInEditor ?? false;
    }

    /**
     * 设置平台输入子系统
     * Set platform input subsystem
     *
     * @param subsystem 平台输入子系统 | Platform input subsystem
     */
    setInputSubsystem(subsystem: IPlatformInputSubsystem): void {
        // 如果已有子系统，先解绑 | Unbind if already has subsystem
        if (this._inputSubsystem && this._isInitialized) {
            this.unbindEvents();
        }

        this._inputSubsystem = subsystem;

        // 如果已初始化，立即绑定 | Bind immediately if initialized
        if (this._isInitialized) {
            this.bindEvents();
        }
    }

    /**
     * 获取输入管理器
     * Get input manager
     */
    get inputManager(): InputManager {
        return this._inputManager;
    }

    protected override onInitialize(): void {
        this._isInitialized = true;

        if (this._inputSubsystem) {
            this.bindEvents();
        }
    }

    /**
     * 绑定平台输入事件
     * Bind platform input events
     */
    private bindEvents(): void {
        if (!this._inputSubsystem) return;

        const sub = this._inputSubsystem;

        // 键盘事件 | Keyboard events
        if (sub.onKeyDown) {
            sub.onKeyDown(this._handleKeyDown);
        }
        if (sub.onKeyUp) {
            sub.onKeyUp(this._handleKeyUp);
        }

        // 鼠标事件 | Mouse events
        if (sub.onMouseMove) {
            sub.onMouseMove(this._handleMouseMove);
        }
        if (sub.onMouseDown) {
            sub.onMouseDown(this._handleMouseDown);
        }
        if (sub.onMouseUp) {
            sub.onMouseUp(this._handleMouseUp);
        }
        if (sub.onWheel) {
            sub.onWheel(this._handleWheel);
        }

        // 触摸事件 | Touch events
        sub.onTouchStart(this._handleTouchStart);
        sub.onTouchMove(this._handleTouchMove);
        sub.onTouchEnd(this._handleTouchEnd);
        sub.onTouchCancel(this._handleTouchEnd); // 取消当作结束处理 | Treat cancel as end
    }

    /**
     * 解绑平台输入事件
     * Unbind platform input events
     */
    private unbindEvents(): void {
        if (!this._inputSubsystem) return;

        const sub = this._inputSubsystem;

        // 键盘事件 | Keyboard events
        if (sub.offKeyDown) {
            sub.offKeyDown(this._handleKeyDown);
        }
        if (sub.offKeyUp) {
            sub.offKeyUp(this._handleKeyUp);
        }

        // 鼠标事件 | Mouse events
        if (sub.offMouseMove) {
            sub.offMouseMove(this._handleMouseMove);
        }
        if (sub.offMouseDown) {
            sub.offMouseDown(this._handleMouseDown);
        }
        if (sub.offMouseUp) {
            sub.offMouseUp(this._handleMouseUp);
        }
        if (sub.offWheel) {
            sub.offWheel(this._handleWheel);
        }

        // 触摸事件 | Touch events
        sub.offTouchStart(this._handleTouchStart);
        sub.offTouchMove(this._handleTouchMove);
        sub.offTouchEnd(this._handleTouchEnd);
        sub.offTouchCancel(this._handleTouchEnd);
    }

    // ========== 事件处理函数 | Event handlers ==========
    // 使用箭头函数保持 this 绑定 | Use arrow functions to preserve this binding

    private _handleKeyDown = (event: KeyboardEventInfo): void => {
        this._inputManager.handleKeyDown(event);
    };

    private _handleKeyUp = (event: KeyboardEventInfo): void => {
        this._inputManager.handleKeyUp(event);
    };

    private _handleMouseMove = (event: MouseEventInfo): void => {
        this._inputManager.handleMouseMove(event);
    };

    private _handleMouseDown = (event: MouseEventInfo): void => {
        this._inputManager.handleMouseDown(event);
    };

    private _handleMouseUp = (event: MouseEventInfo): void => {
        this._inputManager.handleMouseUp(event);
    };

    private _handleWheel = (event: WheelEventInfo): void => {
        this._inputManager.handleWheel(event);
    };

    private _handleTouchStart = (event: TouchEvent): void => {
        this._inputManager.handleTouchStart(event.changedTouches);
    };

    private _handleTouchMove = (event: TouchEvent): void => {
        this._inputManager.handleTouchMove(event.changedTouches);
    };

    private _handleTouchEnd = (event: TouchEvent): void => {
        this._inputManager.handleTouchEnd(event.changedTouches);
    };

    // ========== 系统生命周期 | System lifecycle ==========

    protected override process(_entities: readonly Entity[]): void {
        // 不处理实体，仅用于生命周期 | No entity processing, only for lifecycle
    }

    protected override lateProcess(_entities: readonly Entity[]): void {
        // 在帧末清理临时状态 | Clear temporary state at end of frame
        this._inputManager.endFrame();
    }

    protected override onDestroy(): void {
        this.unbindEvents();
        this._inputManager.reset();
        this._isInitialized = false;
    }

    /**
     * 检查是否应该启用输入
     * Check if input should be enabled
     */
    protected override onCheckProcessing(): boolean {
        // 如果设置了编辑器模式禁用，检查场景是否在编辑器模式
        if (this._disableInEditor && this.scene?.isEditorMode) {
            return false;
        }
        return true;
    }
}
