import { Component, ECSComponent, Property, Serializable, Serialize } from '@esengine/esengine';

/**
 * 进度条方向
 * Progress bar direction
 */
export enum UIProgressDirection {
    /** 从左到右 Left to right */
    LeftToRight = 'left-to-right',
    /** 从右到左 Right to left */
    RightToLeft = 'right-to-left',
    /** 从下到上 Bottom to top */
    BottomToTop = 'bottom-to-top',
    /** 从上到下 Top to bottom */
    TopToBottom = 'top-to-bottom'
}

/**
 * 进度条填充模式
 * Progress bar fill mode
 */
export enum UIProgressFillMode {
    /** 水平填充 Horizontal fill */
    Horizontal = 'horizontal',
    /** 垂直填充 Vertical fill */
    Vertical = 'vertical',
    /** 圆形填充 Radial fill */
    Radial = 'radial'
}

/**
 * UI 进度条组件
 * UI ProgressBar Component - Progress indicator
 */
@ECSComponent('UIProgressBar')
@Serializable({ version: 1, typeId: 'UIProgressBar' })
export class UIProgressBarComponent extends Component {
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
     * 目标值（用于动画）
     * Target value (for animation)
     */
    public targetValue: number = 0;

    /**
     * 显示值（动画插值后的值）
     * Display value (interpolated for animation)
     */
    public displayValue: number = 0;

    // ===== 样式 Style =====

    /**
     * 填充颜色
     * Fill color
     */
    @Serialize()
    @Property({ type: 'color', label: 'Fill Color' })
    public fillColor: number = 0x4CAF50;

    /**
     * 填充透明度
     * Fill alpha
     */
    @Serialize()
    @Property({ type: 'number', label: 'Fill Alpha', min: 0, max: 1, step: 0.01 })
    public fillAlpha: number = 1;

    /**
     * 背景颜色
     * Background color
     */
    @Serialize()
    @Property({ type: 'color', label: 'Background Color' })
    public backgroundColor: number = 0x333333;

    /**
     * 背景透明度
     * Background alpha
     */
    @Serialize()
    @Property({ type: 'number', label: 'Background Alpha', min: 0, max: 1, step: 0.01 })
    public backgroundAlpha: number = 1;

    /**
     * 边框颜色
     * Border color
     */
    @Serialize()
    @Property({ type: 'color', label: 'Border Color' })
    public borderColor: number = 0x000000;

    /**
     * 边框宽度
     * Border width
     */
    @Serialize()
    @Property({ type: 'number', label: 'Border Width', min: 0 })
    public borderWidth: number = 0;

    /**
     * 圆角半径
     * Corner radius
     */
    @Serialize()
    @Property({ type: 'number', label: 'Corner Radius', min: 0 })
    public cornerRadius: number = 0;

    // ===== 方向和填充 Direction & Fill =====

    /**
     * 进度方向
     * Progress direction
     */
    @Serialize()
    @Property({
        type: 'enum',
        label: 'Direction',
        options: [
            { value: 'left-to-right', label: 'Left to Right' },
            { value: 'right-to-left', label: 'Right to Left' },
            { value: 'bottom-to-top', label: 'Bottom to Top' },
            { value: 'top-to-bottom', label: 'Top to Bottom' }
        ]
    })
    public direction: UIProgressDirection = UIProgressDirection.LeftToRight;

    /**
     * 填充模式
     * Fill mode
     */
    @Serialize()
    @Property({
        type: 'enum',
        label: 'Fill Mode',
        options: [
            { value: 'horizontal', label: 'Horizontal' },
            { value: 'vertical', label: 'Vertical' },
            { value: 'radial', label: 'Radial' }
        ]
    })
    public fillMode: UIProgressFillMode = UIProgressFillMode.Horizontal;

    // ===== 动画 Animation =====

    /**
     * 过渡时长（秒）
     * Transition duration in seconds
     */
    @Serialize()
    @Property({ type: 'number', label: 'Transition Duration', min: 0, step: 0.01 })
    public transitionDuration: number = 0.3;

    /**
     * 缓动函数
     * Easing function name
     */
    @Serialize()
    @Property({ type: 'string', label: 'Easing' })
    public easing: string = 'easeOut';

    // ===== 分段 Segments =====

    /**
     * 是否分段显示
     * Whether to show segments
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Show Segments' })
    public showSegments: boolean = false;

    /**
     * 分段数量
     * Number of segments
     */
    @Serialize()
    @Property({ type: 'integer', label: 'Segments', min: 1 })
    public segments: number = 10;

    /**
     * 分段间隙
     * Gap between segments
     */
    @Serialize()
    @Property({ type: 'number', label: 'Segment Gap', min: 0 })
    public segmentGap: number = 2;

    // ===== 渐变 Gradient =====

    /**
     * 是否使用渐变
     * Whether to use gradient fill
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Use Gradient' })
    public useGradient: boolean = false;

    /**
     * 渐变起始颜色
     * Gradient start color
     */
    @Serialize()
    @Property({ type: 'color', label: 'Gradient Start Color' })
    public gradientStartColor: number = 0x4CAF50;

    /**
     * 渐变结束颜色
     * Gradient end color
     */
    @Serialize()
    @Property({ type: 'color', label: 'Gradient End Color' })
    public gradientEndColor: number = 0x8BC34A;

    // ===== 文本 Text =====

    /**
     * 是否显示文本
     * Whether to show text
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Show Text' })
    public showText: boolean = false;

    /**
     * 文本格式（{value}, {percent}, {min}, {max}）
     * Text format template
     */
    @Serialize()
    @Property({ type: 'string', label: 'Text Format' })
    public textFormat: string = '{percent}%';

    /**
     * 文本颜色
     * Text color
     */
    @Serialize()
    @Property({ type: 'color', label: 'Text Color' })
    public textColor: number = 0xFFFFFF;

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
     * 获取格式化的文本
     * Get formatted text
     */
    public getFormattedText(): string {
        const percent = Math.round(this.getProgress() * 100);
        return this.textFormat
            .replace('{value}', this.displayValue.toFixed(0))
            .replace('{percent}', percent.toString())
            .replace('{min}', this.minValue.toString())
            .replace('{max}', this.maxValue.toString());
    }

    /**
     * 设置值（带动画）
     * Set value (with animation)
     */
    public setValue(value: number, animate: boolean = true): this {
        this.targetValue = Math.max(this.minValue, Math.min(this.maxValue, value));
        if (!animate) {
            this.value = this.targetValue;
            this.displayValue = this.targetValue;
        }
        return this;
    }

    /**
     * 设置颜色
     * Set colors
     */
    public setColors(fill: number, background: number): this {
        this.fillColor = fill;
        this.backgroundColor = background;
        return this;
    }

    /**
     * 设置渐变
     * Set gradient colors
     */
    public setGradient(startColor: number, endColor: number): this {
        this.useGradient = true;
        this.gradientStartColor = startColor;
        this.gradientEndColor = endColor;
        return this;
    }

    /**
     * 增加值
     * Increase value
     */
    public increase(amount: number = 1): this {
        return this.setValue(this.targetValue + amount);
    }

    /**
     * 减少值
     * Decrease value
     */
    public decrease(amount: number = 1): this {
        return this.setValue(this.targetValue - amount);
    }
}
