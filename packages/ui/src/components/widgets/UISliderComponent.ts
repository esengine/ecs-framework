import { Component, ECSComponent, Property, Serializable, Serialize } from '@esengine/esengine';

/**
 * 滑块方向
 * Slider orientation
 */
export enum UISliderOrientation {
    Horizontal = 'horizontal',
    Vertical = 'vertical'
}

/**
 * UI 滑块组件
 * UI Slider Component - Value slider with handle
 */
@ECSComponent('UISlider')
@Serializable({ version: 1, typeId: 'UISlider' })
export class UISliderComponent extends Component {
    // ===== 数值 Values =====

    /**
     * 当前值
     * Current value
     */
    @Serialize()
    @Property({ type: 'number', label: 'Value' })
    public value: number = 0;

    /**
     * 最小值
     * Minimum value
     */
    @Serialize()
    @Property({ type: 'number', label: 'Min Value' })
    public minValue: number = 0;

    /**
     * 最大值
     * Maximum value
     */
    @Serialize()
    @Property({ type: 'number', label: 'Max Value' })
    public maxValue: number = 100;

    /**
     * 步进值（0 = 连续）
     * Step value (0 = continuous)
     */
    @Serialize()
    @Property({ type: 'number', label: 'Step', min: 0 })
    public step: number = 0;

    /**
     * 目标值（用于动画）
     * Target value (for animation)
     */
    public targetValue: number = 0;

    /**
     * 显示值（动画插值后）
     * Display value (interpolated)
     */
    public displayValue: number = 0;

    // ===== 方向 Orientation =====

    /**
     * 滑块方向
     * Slider orientation
     */
    @Serialize()
    @Property({
        type: 'enum',
        label: 'Orientation',
        options: [
            { value: 'horizontal', label: 'Horizontal' },
            { value: 'vertical', label: 'Vertical' }
        ]
    })
    public orientation: UISliderOrientation = UISliderOrientation.Horizontal;

    // ===== 轨道样式 Track Style =====

    /**
     * 轨道颜色
     * Track color
     */
    @Serialize()
    @Property({ type: 'color', label: 'Track Color' })
    public trackColor: number = 0x444444;

    /**
     * 轨道透明度
     * Track alpha
     */
    @Serialize()
    @Property({ type: 'number', label: 'Track Alpha', min: 0, max: 1, step: 0.01 })
    public trackAlpha: number = 1;

    /**
     * 轨道高度（水平）或宽度（垂直）
     * Track thickness
     */
    @Serialize()
    @Property({ type: 'number', label: 'Track Thickness', min: 1 })
    public trackThickness: number = 4;

    /**
     * 轨道圆角
     * Track corner radius
     */
    @Serialize()
    @Property({ type: 'number', label: 'Track Radius', min: 0 })
    public trackRadius: number = 2;

    // ===== 填充样式 Fill Style =====

    /**
     * 填充颜色（已滑过的部分）
     * Fill color (passed portion)
     */
    @Serialize()
    @Property({ type: 'color', label: 'Fill Color' })
    public fillColor: number = 0x4A90D9;

    /**
     * 填充透明度
     * Fill alpha
     */
    @Serialize()
    @Property({ type: 'number', label: 'Fill Alpha', min: 0, max: 1, step: 0.01 })
    public fillAlpha: number = 1;

    // ===== 手柄样式 Handle Style =====

    /**
     * 手柄宽度
     * Handle width
     */
    @Serialize()
    @Property({ type: 'number', label: 'Handle Width', min: 1 })
    public handleWidth: number = 16;

    /**
     * 手柄高度
     * Handle height
     */
    @Serialize()
    @Property({ type: 'number', label: 'Handle Height', min: 1 })
    public handleHeight: number = 16;

    /**
     * 手柄颜色
     * Handle color
     */
    @Serialize()
    @Property({ type: 'color', label: 'Handle Color' })
    public handleColor: number = 0xFFFFFF;

    /**
     * 手柄悬停颜色
     * Handle hover color
     */
    @Serialize()
    @Property({ type: 'color', label: 'Handle Hover Color' })
    public handleHoverColor: number = 0xE0E0E0;

    /**
     * 手柄按下颜色
     * Handle pressed color
     */
    @Serialize()
    @Property({ type: 'color', label: 'Handle Pressed Color' })
    public handlePressedColor: number = 0xCCCCCC;

    /**
     * 手柄圆角
     * Handle corner radius
     */
    @Serialize()
    @Property({ type: 'number', label: 'Handle Radius', min: 0 })
    public handleRadius: number = 8;

    /**
     * 手柄边框宽度
     * Handle border width
     */
    @Serialize()
    @Property({ type: 'number', label: 'Handle Border Width', min: 0 })
    public handleBorderWidth: number = 0;

    /**
     * 手柄边框颜色
     * Handle border color
     */
    @Serialize()
    @Property({ type: 'color', label: 'Handle Border Color' })
    public handleBorderColor: number = 0x000000;

    /**
     * 手柄阴影
     * Handle shadow enabled
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Handle Shadow' })
    public handleShadow: boolean = true;

    // ===== 交互状态 Interaction State =====

    /**
     * 手柄是否被悬停
     * Whether handle is hovered
     */
    public handleHovered: boolean = false;

    /**
     * 是否正在拖拽
     * Whether currently dragging
     */
    public dragging: boolean = false;

    /**
     * 拖拽起始值
     * Drag start value
     */
    public dragStartValue: number = 0;

    /**
     * 拖拽起始位置
     * Drag start position
     */
    public dragStartPosition: number = 0;

    // ===== 动画 Animation =====

    /**
     * 过渡时长（秒）
     * Transition duration in seconds
     */
    @Serialize()
    @Property({ type: 'number', label: 'Transition Duration', min: 0, step: 0.01 })
    public transitionDuration: number = 0.1;

    // ===== 刻度 Ticks =====

    /**
     * 是否显示刻度
     * Whether to show ticks
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Show Ticks' })
    public showTicks: boolean = false;

    /**
     * 刻度数量（不包括首尾）
     * Number of ticks (excluding ends)
     */
    @Serialize()
    @Property({ type: 'integer', label: 'Tick Count', min: 0 })
    public tickCount: number = 4;

    /**
     * 刻度颜色
     * Tick color
     */
    @Serialize()
    @Property({ type: 'color', label: 'Tick Color' })
    public tickColor: number = 0x666666;

    /**
     * 刻度大小
     * Tick size
     */
    @Serialize()
    @Property({ type: 'number', label: 'Tick Size', min: 1 })
    public tickSize: number = 4;

    // ===== 文本 Text =====

    /**
     * 是否显示值文本
     * Whether to show value text
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Show Value' })
    public showValue: boolean = false;

    /**
     * 值文本格式
     * Value text format
     */
    @Serialize()
    @Property({ type: 'string', label: 'Value Format' })
    public valueFormat: string = '{value}';

    /**
     * 小数位数
     * Decimal places
     */
    @Serialize()
    @Property({ type: 'integer', label: 'Decimal Places', min: 0 })
    public decimalPlaces: number = 0;

    // ===== 回调 Callbacks =====

    /**
     * 值改变回调
     * Value change callback
     */
    public onChange?: (value: number) => void;

    /**
     * 拖拽开始回调
     * Drag start callback
     */
    public onDragStart?: (value: number) => void;

    /**
     * 拖拽结束回调
     * Drag end callback
     */
    public onDragEnd?: (value: number) => void;

    /**
     * 获取进度百分比 (0-1)
     * Get progress as percentage (0-1)
     */
    public getProgress(): number {
        const range = this.maxValue - this.minValue;
        if (range <= 0) return 0;
        return Math.max(0, Math.min(1, (this.displayValue - this.minValue) / range));
    }

    /**
     * 从百分比设置值
     * Set value from percentage
     */
    public setProgress(progress: number): this {
        const range = this.maxValue - this.minValue;
        return this.setValue(this.minValue + range * Math.max(0, Math.min(1, progress)));
    }

    /**
     * 设置值
     * Set value
     */
    public setValue(value: number, animate: boolean = true): this {
        let newValue = Math.max(this.minValue, Math.min(this.maxValue, value));

        // 应用步进
        if (this.step > 0) {
            newValue = Math.round((newValue - this.minValue) / this.step) * this.step + this.minValue;
        }

        this.targetValue = newValue;
        if (!animate) {
            this.value = newValue;
            this.displayValue = newValue;
        }

        return this;
    }

    /**
     * 获取格式化的值文本
     * Get formatted value text
     */
    public getFormattedValue(): string {
        const formattedValue = this.displayValue.toFixed(this.decimalPlaces);
        return this.valueFormat.replace('{value}', formattedValue);
    }

    /**
     * 计算手柄位置（归一化 0-1）
     * Calculate handle position (normalized 0-1)
     */
    public getHandlePosition(): number {
        return this.getProgress();
    }

    /**
     * 获取当前手柄颜色
     * Get current handle color based on state
     */
    public getCurrentHandleColor(): number {
        if (this.dragging) return this.handlePressedColor;
        if (this.handleHovered) return this.handleHoverColor;
        return this.handleColor;
    }
}
