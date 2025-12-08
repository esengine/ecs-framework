import { Component, ECSComponent, Property, Serializable, Serialize } from '@esengine/esengine';

/**
 * 文本对齐方式
 * Text alignment options
 */
export type UITextAlign = 'left' | 'center' | 'right';

/**
 * 文本垂直对齐方式
 * Text vertical alignment options
 */
export type UITextVerticalAlign = 'top' | 'middle' | 'bottom';

/**
 * 文本溢出处理
 * Text overflow handling
 */
export type UITextOverflow = 'visible' | 'hidden' | 'ellipsis' | 'clip';

/**
 * 字体粗细
 * Font weight options
 */
export type UIFontWeight = 'normal' | 'bold' | 'lighter' | 'bolder' | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

/**
 * UI 文本组件
 * UI Text Component - Handles text rendering
 *
 * 定义文本内容和样式
 * Defines text content and style
 */
@ECSComponent('UIText')
@Serializable({ version: 1, typeId: 'UIText' })
export class UITextComponent extends Component {
    /**
     * 文本内容
     * Text content
     */
    @Serialize()
    @Property({ type: 'string', label: 'Text' })
    public text: string = '';

    // ===== 字体 Font =====

    /**
     * 字体大小（像素）
     * Font size in pixels
     */
    @Serialize()
    @Property({ type: 'number', label: 'Font Size', min: 1 })
    public fontSize: number = 14;

    /**
     * 字体族
     * Font family
     */
    @Serialize()
    @Property({ type: 'string', label: 'Font Family' })
    public fontFamily: string = 'Arial, sans-serif';

    /**
     * 字体粗细
     * Font weight
     */
    @Serialize()
    @Property({
        type: 'enum',
        label: 'Font Weight',
        options: [
            { value: 'normal', label: 'Normal' },
            { value: 'bold', label: 'Bold' },
            { value: 'lighter', label: 'Lighter' },
            { value: 'bolder', label: 'Bolder' }
        ]
    })
    public fontWeight: UIFontWeight = 'normal';

    /**
     * 是否斜体
     * Whether italic
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Italic' })
    public italic: boolean = false;

    // ===== 颜色 Color =====

    /**
     * 文本颜色 (0xRRGGBB)
     * Text color
     */
    @Serialize()
    @Property({ type: 'color', label: 'Color' })
    public color: number = 0x000000;

    /**
     * 文本透明度
     * Text alpha
     */
    @Serialize()
    @Property({ type: 'number', label: 'Alpha', min: 0, max: 1, step: 0.01 })
    public alpha: number = 1;

    // ===== 对齐 Alignment =====

    /**
     * 水平对齐
     * Horizontal alignment
     */
    @Serialize()
    @Property({
        type: 'enum',
        label: 'Align',
        options: [
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Center' },
            { value: 'right', label: 'Right' }
        ]
    })
    public align: UITextAlign = 'left';

    /**
     * 垂直对齐
     * Vertical alignment
     */
    @Serialize()
    @Property({
        type: 'enum',
        label: 'Vertical Align',
        options: [
            { value: 'top', label: 'Top' },
            { value: 'middle', label: 'Middle' },
            { value: 'bottom', label: 'Bottom' }
        ]
    })
    public verticalAlign: UITextVerticalAlign = 'middle';

    // ===== 换行 Wrapping =====

    /**
     * 是否自动换行
     * Whether to wrap text
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Word Wrap' })
    public wordWrap: boolean = false;

    /**
     * 换行宽度（0 = 使用父元素宽度）
     * Wrap width (0 = use parent width)
     */
    @Serialize()
    @Property({ type: 'number', label: 'Wrap Width', min: 0 })
    public wrapWidth: number = 0;

    /**
     * 行高（倍数，1 = 正常）
     * Line height multiplier
     */
    @Serialize()
    @Property({ type: 'number', label: 'Line Height', min: 0.1, step: 0.1 })
    public lineHeight: number = 1.2;

    /**
     * 字间距
     * Letter spacing
     */
    @Serialize()
    @Property({ type: 'number', label: 'Letter Spacing' })
    public letterSpacing: number = 0;

    // ===== 溢出 Overflow =====

    /**
     * 文本溢出处理
     * Text overflow handling
     */
    @Property({
        type: 'enum',
        label: 'Overflow',
        options: [
            { value: 'visible', label: 'Visible' },
            { value: 'hidden', label: 'Hidden' },
            { value: 'ellipsis', label: 'Ellipsis' },
            { value: 'clip', label: 'Clip' }
        ]
    })
    public overflow: UITextOverflow = 'visible';

    /**
     * 最大显示行数（0 = 无限制）
     * Maximum number of lines (0 = unlimited)
     */
    @Property({ type: 'integer', label: 'Max Lines', min: 0 })
    public maxLines: number = 0;

    // ===== 装饰 Decoration =====

    /**
     * 下划线
     * Underline
     */
    @Property({ type: 'boolean', label: 'Underline' })
    public underline: boolean = false;

    /**
     * 删除线
     * Strikethrough
     */
    @Property({ type: 'boolean', label: 'Strikethrough' })
    public strikethrough: boolean = false;

    // ===== 描边 Stroke =====

    /**
     * 描边宽度
     * Stroke width
     */
    @Property({ type: 'number', label: 'Stroke Width', min: 0 })
    public strokeWidth: number = 0;

    /**
     * 描边颜色
     * Stroke color
     */
    @Property({ type: 'color', label: 'Stroke Color' })
    public strokeColor: number = 0x000000;

    // ===== 阴影 Shadow =====

    /**
     * 文本阴影启用
     * Text shadow enabled
     */
    @Property({ type: 'boolean', label: 'Shadow' })
    public shadowEnabled: boolean = false;

    /**
     * 阴影 X 偏移
     * Shadow X offset
     */
    public shadowOffsetX: number = 1;

    /**
     * 阴影 Y 偏移
     * Shadow Y offset
     */
    public shadowOffsetY: number = 1;

    /**
     * 阴影颜色
     * Shadow color
     */
    public shadowColor: number = 0x000000;

    /**
     * 阴影透明度
     * Shadow alpha
     */
    public shadowAlpha: number = 0.5;

    // ===== 计算属性 Computed =====

    /**
     * 计算后的文本行（由渲染系统填充）
     * Computed text lines (filled by render system)
     */
    public computedLines: string[] = [];

    /**
     * 计算后的文本宽度
     * Computed text width
     */
    public computedWidth: number = 0;

    /**
     * 计算后的文本高度
     * Computed text height
     */
    public computedHeight: number = 0;

    /**
     * 文本是否需要重新计算
     * Whether text needs recomputation
     */
    public dirty: boolean = true;

    /**
     * 设置文本
     * Set text content
     */
    public setText(text: string): this {
        if (this.text !== text) {
            this.text = text;
            this.dirty = true;
        }
        return this;
    }

    /**
     * 设置字体
     * Set font properties
     */
    public setFont(size: number, family?: string, weight?: UIFontWeight): this {
        this.fontSize = size;
        if (family !== undefined) this.fontFamily = family;
        if (weight !== undefined) this.fontWeight = weight;
        this.dirty = true;
        return this;
    }

    /**
     * 设置颜色
     * Set text color
     */
    public setColor(color: number, alpha: number = 1): this {
        this.color = color;
        this.alpha = alpha;
        return this;
    }

    /**
     * 获取 CSS 字体字符串
     * Get CSS font string
     */
    public getCSSFont(): string {
        const style = this.italic ? 'italic ' : '';
        const weight = typeof this.fontWeight === 'number' ? this.fontWeight : this.fontWeight;
        return `${style}${weight} ${this.fontSize}px ${this.fontFamily}`;
    }

    /**
     * 获取颜色的 CSS 字符串
     * Get color as CSS string
     */
    public getCSSColor(): string {
        const r = (this.color >> 16) & 0xFF;
        const g = (this.color >> 8) & 0xFF;
        const b = this.color & 0xFF;
        return `rgba(${r}, ${g}, ${b}, ${this.alpha})`;
    }
}
