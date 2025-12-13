import { Component, ECSComponent, Property, Serializable, Serialize } from '@esengine/ecs-framework';

/**
 * 光标类型
 * Cursor types for interactive elements
 */
export type UICursorType =
    | 'default'
    | 'pointer'
    | 'text'
    | 'move'
    | 'not-allowed'
    | 'grab'
    | 'grabbing'
    | 'ew-resize'
    | 'ns-resize'
    | 'nesw-resize'
    | 'nwse-resize';

/**
 * UI 交互组件
 * UI Interactable Component - Handles input interaction state
 *
 * 管理元素的交互状态（悬停、按下、焦点等）
 * Manages element interaction state (hover, pressed, focus, etc.)
 */
@ECSComponent('UIInteractable')
@Serializable({ version: 1, typeId: 'UIInteractable' })
export class UIInteractableComponent extends Component {
    /**
     * 是否启用交互
     * Whether interaction is enabled
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Enabled' })
    public enabled: boolean = true;

    /**
     * 是否阻止事件冒泡
     * Whether to block event propagation
     *
     * 默认为 false，事件会传递给下层元素。
     * 设置为 true 时，该元素会阻止事件传递。
     *
     * Default is false, events propagate to elements below.
     * Set to true to prevent event propagation.
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Block Events' })
    public blockEvents: boolean = false;

    // ===== 状态 State (由 UIInputSystem 更新) =====

    /**
     * 是否被鼠标悬停
     * Whether mouse is hovering over this element
     */
    public hovered: boolean = false;

    /**
     * 是否被按下
     * Whether element is being pressed
     */
    public pressed: boolean = false;

    /**
     * 是否获得焦点
     * Whether element has focus
     */
    public focused: boolean = false;

    /**
     * 是否被拖拽
     * Whether element is being dragged
     */
    public dragging: boolean = false;

    // ===== 配置 Configuration =====

    /**
     * 是否可以获得焦点
     * Whether element can receive focus
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Focusable' })
    public focusable: boolean = false;

    /**
     * 是否可以被拖拽
     * Whether element can be dragged
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Draggable' })
    public draggable: boolean = false;

    /**
     * Tab 索引（用于键盘导航）
     * Tab index for keyboard navigation
     */
    @Serialize()
    @Property({ type: 'integer', label: 'Tab Index' })
    public tabIndex: number = 0;

    /**
     * 光标类型
     * Cursor type when hovering
     */
    @Serialize()
    @Property({
        type: 'enum',
        label: 'Cursor',
        options: [
            { value: 'default', label: 'Default' },
            { value: 'pointer', label: 'Pointer' },
            { value: 'text', label: 'Text' },
            { value: 'move', label: 'Move' },
            { value: 'not-allowed', label: 'Not Allowed' },
            { value: 'grab', label: 'Grab' },
            { value: 'grabbing', label: 'Grabbing' }
        ]
    })
    public cursor: UICursorType = 'pointer';

    /**
     * 悬停延迟（毫秒，用于 tooltip）
     * Hover delay in ms (for tooltips)
     */
    @Serialize()
    @Property({ type: 'number', label: 'Hover Delay', min: 0 })
    public hoverDelay: number = 0;

    /**
     * 悬停计时器
     * Internal hover timer
     */
    public hoverTimer: number = 0;

    /**
     * 是否悬停足够长时间
     * Whether hovered long enough (past hoverDelay)
     */
    public hoverReady: boolean = false;

    // ===== 事件回调 Event Callbacks =====

    /**
     * 点击回调
     * Click callback
     */
    public onClick?: () => void;

    /**
     * 双击回调
     * Double-click callback
     */
    public onDoubleClick?: () => void;

    /**
     * 鼠标进入回调
     * Mouse enter callback
     */
    public onMouseEnter?: () => void;

    /**
     * 鼠标离开回调
     * Mouse leave callback
     */
    public onMouseLeave?: () => void;

    /**
     * 按下回调
     * Press down callback
     */
    public onPressDown?: () => void;

    /**
     * 释放回调
     * Press up callback
     */
    public onPressUp?: () => void;

    /**
     * 获得焦点回调
     * Focus callback
     */
    public onFocus?: () => void;

    /**
     * 失去焦点回调
     * Blur callback
     */
    public onBlur?: () => void;

    /**
     * 拖拽开始回调
     * Drag start callback
     */
    public onDragStart?: (x: number, y: number) => void;

    /**
     * 拖拽中回调
     * Drag move callback
     */
    public onDragMove?: (x: number, y: number, deltaX: number, deltaY: number) => void;

    /**
     * 拖拽结束回调
     * Drag end callback
     */
    public onDragEnd?: (x: number, y: number) => void;

    /**
     * 获取当前交互状态名称（用于样式切换）
     * Get current interaction state name (for style switching)
     */
    public getState(): 'disabled' | 'pressed' | 'hovered' | 'focused' | 'normal' {
        if (!this.enabled) return 'disabled';
        if (this.pressed) return 'pressed';
        if (this.hovered) return 'hovered';
        if (this.focused) return 'focused';
        return 'normal';
    }

    /**
     * 重置所有状态
     * Reset all interaction states
     */
    public resetState(): void {
        this.hovered = false;
        this.pressed = false;
        this.focused = false;
        this.dragging = false;
        this.hoverTimer = 0;
        this.hoverReady = false;
    }
}
