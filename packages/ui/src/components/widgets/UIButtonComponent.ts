import { Component, ECSComponent, Property, Serializable, Serialize } from '@esengine/ecs-framework';

/**
 * 按钮状态样式
 * Button state style configuration
 */
export interface UIButtonStyle {
    backgroundColor: number;
    backgroundAlpha: number;
    textColor: number;
    borderColor: number;
    borderWidth: number;
    texture?: string;
}

/**
 * 按钮显示模式
 * Button display mode
 */
export type UIButtonDisplayMode = 'color' | 'texture' | 'both';

/**
 * UI 按钮组件
 * UI Button Component - Button-specific state and callbacks
 */
@ECSComponent('UIButton')
@Serializable({ version: 1, typeId: 'UIButton' })
export class UIButtonComponent extends Component {
    /**
     * 按钮文本
     * Button label text
     */
    @Serialize()
    @Property({ type: 'string', label: 'Label' })
    public label: string = 'Button';

    // ===== 显示模式 Display Mode =====

    /**
     * 显示模式：纯颜色、纯纹理、或两者结合
     * Display mode: color only, texture only, or both
     */
    @Serialize()
    @Property({
        type: 'enum',
        label: 'Display Mode',
        options: ['color', 'texture', 'both']
    })
    public displayMode: UIButtonDisplayMode = 'color';

    // ===== 状态纹理 State Textures =====

    /**
     * 正常状态纹理
     * Normal state texture
     */
    @Serialize()
    @Property({ type: 'asset', label: 'Normal Texture', assetType: 'texture' })
    public normalTexture: string = '';

    /**
     * 悬停状态纹理
     * Hover state texture
     */
    @Serialize()
    @Property({ type: 'asset', label: 'Hover Texture', assetType: 'texture' })
    public hoverTexture: string = '';

    /**
     * 按下状态纹理
     * Pressed state texture
     */
    @Serialize()
    @Property({ type: 'asset', label: 'Pressed Texture', assetType: 'texture' })
    public pressedTexture: string = '';

    /**
     * 禁用状态纹理
     * Disabled state texture
     */
    @Serialize()
    @Property({ type: 'asset', label: 'Disabled Texture', assetType: 'texture' })
    public disabledTexture: string = '';

    // ===== 状态样式 State Styles =====

    /**
     * 正常状态颜色
     * Normal state background color
     */
    @Serialize()
    @Property({ type: 'color', label: 'Normal Color' })
    public normalColor: number = 0x4A90D9;

    /**
     * 悬停状态颜色
     * Hover state background color
     */
    @Serialize()
    @Property({ type: 'color', label: 'Hover Color' })
    public hoverColor: number = 0x5BA0E9;

    /**
     * 按下状态颜色
     * Pressed state background color
     */
    @Serialize()
    @Property({ type: 'color', label: 'Pressed Color' })
    public pressedColor: number = 0x3A80C9;

    /**
     * 禁用状态颜色
     * Disabled state background color
     */
    @Serialize()
    @Property({ type: 'color', label: 'Disabled Color' })
    public disabledColor: number = 0x888888;

    /**
     * 聚焦状态颜色
     * Focused state background color
     */
    @Serialize()
    @Property({ type: 'color', label: 'Focused Color' })
    public focusedColor: number = 0x4A90D9;

    /**
     * 文本颜色
     * Text color
     */
    @Serialize()
    @Property({ type: 'color', label: 'Text Color' })
    public textColor: number = 0xFFFFFF;

    /**
     * 禁用时文本颜色
     * Disabled text color
     */
    @Serialize()
    @Property({ type: 'color', label: 'Disabled Text Color' })
    public disabledTextColor: number = 0xCCCCCC;

    // ===== 动画 Animation =====

    /**
     * 颜色过渡时长（秒）
     * Color transition duration in seconds
     */
    @Serialize()
    @Property({ type: 'number', label: 'Transition Duration', min: 0, step: 0.01 })
    public transitionDuration: number = 0.1;

    /**
     * 当前显示颜色（动画插值用）
     * Current display color (for animation)
     */
    public currentColor: number = 0x4A90D9;

    /**
     * 目标颜色
     * Target color
     */
    public targetColor: number = 0x4A90D9;

    // ===== 回调 Callbacks =====

    /**
     * 点击回调
     * Click callback
     */
    public onClick?: () => void;

    /**
     * 长按回调
     * Long press callback
     */
    public onLongPress?: () => void;

    /**
     * 长按阈值（毫秒）
     * Long press threshold in milliseconds
     */
    @Serialize()
    @Property({ type: 'number', label: 'Long Press Threshold', min: 0 })
    public longPressThreshold: number = 500;

    /**
     * 长按计时器
     * Long press timer
     */
    public pressTimer: number = 0;

    /**
     * 是否已触发长按
     * Whether long press has been triggered
     */
    public longPressTriggered: boolean = false;

    // ===== 配置 Configuration =====

    /**
     * 是否禁用
     * Whether button is disabled
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Disabled' })
    public disabled: boolean = false;

    /**
     * 是否显示涟漪效果
     * Whether to show ripple effect
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Show Ripple' })
    public showRipple: boolean = false;

    /**
     * 涟漪颜色
     * Ripple color
     */
    @Serialize()
    @Property({ type: 'color', label: 'Ripple Color' })
    public rippleColor: number = 0xFFFFFF;

    /**
     * 涟漪透明度
     * Ripple alpha
     */
    @Serialize()
    @Property({ type: 'number', label: 'Ripple Alpha', min: 0, max: 1, step: 0.01 })
    public rippleAlpha: number = 0.3;

    /**
     * 获取当前应该显示的背景颜色
     * Get the background color that should be displayed based on state
     */
    public getStateColor(state: 'disabled' | 'pressed' | 'hovered' | 'focused' | 'normal'): number {
        if (this.disabled) return this.disabledColor;
        switch (state) {
            case 'pressed': return this.pressedColor;
            case 'hovered': return this.hoverColor;
            case 'focused': return this.focusedColor;
            default: return this.normalColor;
        }
    }

    /**
     * 获取当前应该显示的纹理
     * Get the texture that should be displayed based on state
     */
    public getStateTexture(state: 'disabled' | 'pressed' | 'hovered' | 'focused' | 'normal'): string {
        if (this.disabled && this.disabledTexture) return this.disabledTexture;
        switch (state) {
            case 'pressed': return this.pressedTexture || this.normalTexture;
            case 'hovered': return this.hoverTexture || this.normalTexture;
            case 'focused': return this.normalTexture;
            default: return this.normalTexture;
        }
    }

    /**
     * 是否使用纹理渲染
     * Whether to use texture for rendering
     */
    public useTexture(): boolean {
        return (this.displayMode === 'texture' || this.displayMode === 'both') && !!this.normalTexture;
    }

    /**
     * 是否使用颜色渲染
     * Whether to use color for rendering
     */
    public useColor(): boolean {
        return this.displayMode === 'color' || this.displayMode === 'both';
    }

    /**
     * 获取当前应该显示的文本颜色
     * Get the text color that should be displayed based on state
     */
    public getTextColor(): number {
        return this.disabled ? this.disabledTextColor : this.textColor;
    }

    /**
     * 设置颜色主题
     * Set color theme
     */
    public setColors(normal: number, hover: number, pressed: number, disabled?: number): this {
        this.normalColor = normal;
        this.hoverColor = hover;
        this.pressedColor = pressed;
        if (disabled !== undefined) this.disabledColor = disabled;
        this.currentColor = normal;
        this.targetColor = normal;
        return this;
    }

    /**
     * 设置纹理
     * Set textures for different states
     */
    public setTextures(normal: string, hover?: string, pressed?: string, disabled?: string): this {
        this.normalTexture = normal;
        if (hover) this.hoverTexture = hover;
        if (pressed) this.pressedTexture = pressed;
        if (disabled) this.disabledTexture = disabled;
        this.displayMode = 'texture';
        return this;
    }
}
