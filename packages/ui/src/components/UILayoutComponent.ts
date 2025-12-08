import { Component, ECSComponent, Property, Serializable, Serialize } from '@esengine/ecs-framework';

/**
 * 布局类型
 * Layout types for automatic child positioning
 */
export enum UILayoutType {
    /** 无自动布局 No automatic layout */
    None = 'none',
    /** 水平排列 Horizontal arrangement */
    Horizontal = 'horizontal',
    /** 垂直排列 Vertical arrangement */
    Vertical = 'vertical',
    /** 网格布局 Grid layout */
    Grid = 'grid',
    /** 流式布局 Flow/Wrap layout */
    Flow = 'flow'
}

/**
 * 主轴对齐方式
 * Main axis alignment
 */
export enum UIJustifyContent {
    /** 起始对齐 Align to start */
    Start = 'start',
    /** 居中 Center */
    Center = 'center',
    /** 末尾对齐 Align to end */
    End = 'end',
    /** 两端对齐 Space between */
    SpaceBetween = 'space-between',
    /** 均匀分布 Space around */
    SpaceAround = 'space-around',
    /** 平均分布 Space evenly */
    SpaceEvenly = 'space-evenly'
}

/**
 * 交叉轴对齐方式
 * Cross axis alignment
 */
export enum UIAlignItems {
    /** 起始对齐 Align to start */
    Start = 'start',
    /** 居中 Center */
    Center = 'center',
    /** 末尾对齐 Align to end */
    End = 'end',
    /** 拉伸 Stretch to fill */
    Stretch = 'stretch',
    /** 基线对齐 Baseline alignment */
    Baseline = 'baseline'
}

/**
 * 内边距
 * Padding configuration
 */
export interface UIPadding {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

/**
 * UI 布局组件
 * UI Layout Component - Defines automatic child layout behavior
 *
 * 类似 CSS Flexbox 的布局系统
 * Flexbox-like layout system
 */
@ECSComponent('UILayout')
@Serializable({ version: 1, typeId: 'UILayout' })
export class UILayoutComponent extends Component {
    /**
     * 布局类型
     * Layout type
     */
    @Serialize()
    @Property({
        type: 'enum',
        label: 'Type',
        options: [
            { value: 'none', label: 'None' },
            { value: 'horizontal', label: 'Horizontal' },
            { value: 'vertical', label: 'Vertical' },
            { value: 'grid', label: 'Grid' },
            { value: 'flow', label: 'Flow' }
        ]
    })
    public type: UILayoutType = UILayoutType.None;

    // ===== 间距 Spacing =====

    /**
     * 子元素间距
     * Gap between children
     */
    @Serialize()
    @Property({ type: 'number', label: 'Gap', min: 0 })
    public gap: number = 0;

    /**
     * 水平间距（Grid 布局）
     * Horizontal gap (for Grid layout)
     */
    @Serialize()
    @Property({ type: 'number', label: 'Gap X', min: 0 })
    public gapX: number = 0;

    /**
     * 垂直间距（Grid 布局）
     * Vertical gap (for Grid layout)
     */
    @Serialize()
    @Property({ type: 'number', label: 'Gap Y', min: 0 })
    public gapY: number = 0;

    /**
     * 内边距
     * Padding
     */
    @Serialize()
    @Property({ type: 'number', label: 'Padding Top', min: 0 })
    public paddingTop: number = 0;
    @Serialize()
    @Property({ type: 'number', label: 'Padding Right', min: 0 })
    public paddingRight: number = 0;
    @Serialize()
    @Property({ type: 'number', label: 'Padding Bottom', min: 0 })
    public paddingBottom: number = 0;
    @Serialize()
    @Property({ type: 'number', label: 'Padding Left', min: 0 })
    public paddingLeft: number = 0;

    // ===== 对齐 Alignment =====

    /**
     * 主轴对齐
     * Main axis alignment (justify-content)
     */
    @Serialize()
    @Property({
        type: 'enum',
        label: 'Justify Content',
        options: [
            { value: 'start', label: 'Start' },
            { value: 'center', label: 'Center' },
            { value: 'end', label: 'End' },
            { value: 'space-between', label: 'Space Between' },
            { value: 'space-around', label: 'Space Around' },
            { value: 'space-evenly', label: 'Space Evenly' }
        ]
    })
    public justifyContent: UIJustifyContent = UIJustifyContent.Start;

    /**
     * 交叉轴对齐
     * Cross axis alignment (align-items)
     */
    @Serialize()
    @Property({
        type: 'enum',
        label: 'Align Items',
        options: [
            { value: 'start', label: 'Start' },
            { value: 'center', label: 'Center' },
            { value: 'end', label: 'End' },
            { value: 'stretch', label: 'Stretch' },
            { value: 'baseline', label: 'Baseline' }
        ]
    })
    public alignItems: UIAlignItems = UIAlignItems.Start;

    // ===== 网格配置 Grid Configuration =====

    /**
     * 网格列数
     * Number of columns (Grid layout)
     */
    @Serialize()
    @Property({ type: 'integer', label: 'Columns', min: 1 })
    public columns: number = 1;

    /**
     * 网格行数（0 = 自动）
     * Number of rows (Grid layout, 0 = auto)
     */
    @Serialize()
    @Property({ type: 'integer', label: 'Rows', min: 0 })
    public rows: number = 0;

    /**
     * 网格单元格宽度（0 = 自动）
     * Grid cell width (0 = auto)
     */
    @Serialize()
    @Property({ type: 'number', label: 'Cell Width', min: 0 })
    public cellWidth: number = 0;

    /**
     * 网格单元格高度（0 = 自动）
     * Grid cell height (0 = auto)
     */
    @Serialize()
    @Property({ type: 'number', label: 'Cell Height', min: 0 })
    public cellHeight: number = 0;

    // ===== 流式布局配置 Flow Configuration =====

    /**
     * 是否换行
     * Whether to wrap items
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Wrap' })
    public wrap: boolean = false;

    /**
     * 换行时的行间距
     * Gap between wrapped rows
     */
    @Serialize()
    @Property({ type: 'number', label: 'Wrap Gap', min: 0 })
    public wrapGap: number = 0;

    // ===== 方向 Direction =====

    /**
     * 是否反转方向
     * Whether to reverse direction
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Reverse' })
    public reverse: boolean = false;

    // ===== 尺寸控制 Size Control =====

    /**
     * 是否根据内容调整自身尺寸
     * Whether to fit size to content
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Fit Content' })
    public fitContent: boolean = false;

    /**
     * 内容最小宽度
     * Minimum content width
     */
    @Serialize()
    @Property({ type: 'number', label: 'Content Min Width', min: 0 })
    public contentMinWidth: number = 0;

    /**
     * 内容最小高度
     * Minimum content height
     */
    @Serialize()
    @Property({ type: 'number', label: 'Content Min Height', min: 0 })
    public contentMinHeight: number = 0;

    /**
     * 设置布局类型
     * Set layout type
     */
    public setType(type: UILayoutType): this {
        this.type = type;
        return this;
    }

    /**
     * 设置间距
     * Set gap
     */
    public setGap(gap: number, gapY?: number): this {
        this.gap = gap;
        this.gapX = gap;
        this.gapY = gapY ?? gap;
        return this;
    }

    /**
     * 设置内边距
     * Set padding (uniform or per-side)
     */
    public setPadding(padding: number | UIPadding): this {
        if (typeof padding === 'number') {
            this.paddingTop = padding;
            this.paddingRight = padding;
            this.paddingBottom = padding;
            this.paddingLeft = padding;
        } else {
            this.paddingTop = padding.top;
            this.paddingRight = padding.right;
            this.paddingBottom = padding.bottom;
            this.paddingLeft = padding.left;
        }
        return this;
    }

    /**
     * 设置对齐方式
     * Set alignment
     */
    public setAlignment(justify: UIJustifyContent, align: UIAlignItems): this {
        this.justifyContent = justify;
        this.alignItems = align;
        return this;
    }

    /**
     * 设置网格配置
     * Set grid configuration
     */
    public setGrid(columns: number, cellWidth?: number, cellHeight?: number): this {
        this.type = UILayoutType.Grid;
        this.columns = columns;
        if (cellWidth !== undefined) this.cellWidth = cellWidth;
        if (cellHeight !== undefined) this.cellHeight = cellHeight;
        return this;
    }

    /**
     * 获取有效的水平间距
     * Get effective horizontal gap
     */
    public getHorizontalGap(): number {
        return this.gapX || this.gap;
    }

    /**
     * 获取有效的垂直间距
     * Get effective vertical gap
     */
    public getVerticalGap(): number {
        return this.gapY || this.gap;
    }

    /**
     * 获取内容区域起始 X
     * Get content area start X
     */
    public getContentStartX(): number {
        return this.paddingLeft;
    }

    /**
     * 获取内容区域起始 Y
     * Get content area start Y
     */
    public getContentStartY(): number {
        return this.paddingTop;
    }

    /**
     * 获取内边距水平总和
     * Get total horizontal padding
     */
    public getHorizontalPadding(): number {
        return this.paddingLeft + this.paddingRight;
    }

    /**
     * 获取内边距垂直总和
     * Get total vertical padding
     */
    public getVerticalPadding(): number {
        return this.paddingTop + this.paddingBottom;
    }
}
