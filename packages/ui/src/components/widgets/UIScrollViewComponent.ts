import { Component, ECSComponent, Property, Serializable, Serialize } from '@esengine/esengine';

/**
 * 滚动条可见性
 * Scrollbar visibility mode
 */
export enum UIScrollbarVisibility {
    /** 总是显示 Always visible */
    Always = 'always',
    /** 自动显示（内容超出时）Auto show when content exceeds */
    Auto = 'auto',
    /** 总是隐藏 Always hidden */
    Hidden = 'hidden'
}

/**
 * UI 滚动视图组件
 * UI ScrollView Component - Scrollable container
 */
@ECSComponent('UIScrollView')
@Serializable({ version: 1, typeId: 'UIScrollView' })
export class UIScrollViewComponent extends Component {
    // ===== 滚动位置 Scroll Position =====

    /**
     * 水平滚动位置
     * Horizontal scroll position
     */
    public scrollX: number = 0;

    /**
     * 垂直滚动位置
     * Vertical scroll position
     */
    public scrollY: number = 0;

    /**
     * 目标水平滚动位置（动画用）
     * Target horizontal scroll position (for animation)
     */
    public targetScrollX: number = 0;

    /**
     * 目标垂直滚动位置（动画用）
     * Target vertical scroll position (for animation)
     */
    public targetScrollY: number = 0;

    // ===== 内容尺寸 Content Size =====

    /**
     * 内容宽度
     * Content width
     */
    @Serialize()
    @Property({ type: 'number', label: 'Content Width', min: 0 })
    public contentWidth: number = 0;

    /**
     * 内容高度
     * Content height
     */
    @Serialize()
    @Property({ type: 'number', label: 'Content Height', min: 0 })
    public contentHeight: number = 0;

    // ===== 滚动配置 Scroll Configuration =====

    /**
     * 是否启用水平滚动
     * Whether horizontal scroll is enabled
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Horizontal Scroll' })
    public horizontalScroll: boolean = false;

    /**
     * 是否启用垂直滚动
     * Whether vertical scroll is enabled
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Vertical Scroll' })
    public verticalScroll: boolean = true;

    /**
     * 滚动条可见性
     * Scrollbar visibility mode
     */
    @Serialize()
    @Property({
        type: 'enum',
        label: 'Scrollbar Visibility',
        options: [
            { value: 'always', label: 'Always' },
            { value: 'auto', label: 'Auto' },
            { value: 'hidden', label: 'Hidden' }
        ]
    })
    public scrollbarVisibility: UIScrollbarVisibility = UIScrollbarVisibility.Auto;

    /**
     * 是否启用惯性滚动
     * Whether inertia scrolling is enabled
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Inertia' })
    public inertia: boolean = true;

    /**
     * 惯性减速率
     * Inertia deceleration rate
     */
    @Serialize()
    @Property({ type: 'number', label: 'Deceleration Rate', min: 0, max: 1, step: 0.001 })
    public decelerationRate: number = 0.135;

    /**
     * 是否启用弹性边界
     * Whether elastic bounds are enabled
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Elastic Bounds' })
    public elasticBounds: boolean = true;

    /**
     * 弹性系数
     * Elasticity coefficient
     */
    @Serialize()
    @Property({ type: 'number', label: 'Elasticity', min: 0, max: 1, step: 0.01 })
    public elasticity: number = 0.1;

    // ===== 滚动条样式 Scrollbar Style =====

    /**
     * 滚动条宽度
     * Scrollbar width
     */
    @Serialize()
    @Property({ type: 'number', label: 'Scrollbar Width', min: 1 })
    public scrollbarWidth: number = 8;

    /**
     * 滚动条颜色
     * Scrollbar color
     */
    @Serialize()
    @Property({ type: 'color', label: 'Scrollbar Color' })
    public scrollbarColor: number = 0x888888;

    /**
     * 滚动条透明度
     * Scrollbar alpha
     */
    @Serialize()
    @Property({ type: 'number', label: 'Scrollbar Alpha', min: 0, max: 1, step: 0.01 })
    public scrollbarAlpha: number = 0.5;

    /**
     * 滚动条悬停透明度
     * Scrollbar hover alpha
     */
    @Serialize()
    @Property({ type: 'number', label: 'Scrollbar Hover Alpha', min: 0, max: 1, step: 0.01 })
    public scrollbarHoverAlpha: number = 0.8;

    /**
     * 滚动条圆角
     * Scrollbar corner radius
     */
    @Serialize()
    @Property({ type: 'number', label: 'Scrollbar Radius', min: 0 })
    public scrollbarRadius: number = 4;

    /**
     * 滚动条轨道颜色
     * Scrollbar track color
     */
    @Serialize()
    @Property({ type: 'color', label: 'Scrollbar Track Color' })
    public scrollbarTrackColor: number = 0x333333;

    /**
     * 滚动条轨道透明度
     * Scrollbar track alpha
     */
    @Serialize()
    @Property({ type: 'number', label: 'Scrollbar Track Alpha', min: 0, max: 1, step: 0.01 })
    public scrollbarTrackAlpha: number = 0.3;

    // ===== 交互状态 Interaction State =====

    /**
     * 是否正在拖拽滚动
     * Whether currently dragging to scroll
     */
    public dragging: boolean = false;

    /**
     * 拖拽起始滚动位置 X
     * Drag start scroll X
     */
    public dragStartScrollX: number = 0;

    /**
     * 拖拽起始滚动位置 Y
     * Drag start scroll Y
     */
    public dragStartScrollY: number = 0;

    /**
     * 滚动速度 X（用于惯性）
     * Scroll velocity X (for inertia)
     */
    public velocityX: number = 0;

    /**
     * 滚动速度 Y（用于惯性）
     * Scroll velocity Y (for inertia)
     */
    public velocityY: number = 0;

    /**
     * 水平滚动条是否被悬停
     * Whether horizontal scrollbar is hovered
     */
    public horizontalScrollbarHovered: boolean = false;

    /**
     * 垂直滚动条是否被悬停
     * Whether vertical scrollbar is hovered
     */
    public verticalScrollbarHovered: boolean = false;

    /**
     * 是否正在拖拽滚动条
     * Whether dragging scrollbar
     */
    public draggingScrollbar: boolean = false;

    // ===== 滚轮配置 Wheel Configuration =====

    /**
     * 滚轮滚动速度
     * Mouse wheel scroll speed
     */
    @Serialize()
    @Property({ type: 'number', label: 'Wheel Speed', min: 1 })
    public wheelSpeed: number = 40;

    /**
     * 是否平滑滚动
     * Whether to use smooth scrolling
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Smooth Scroll' })
    public smoothScroll: boolean = true;

    /**
     * 平滑滚动时长（秒）
     * Smooth scroll duration in seconds
     */
    @Serialize()
    @Property({ type: 'number', label: 'Smooth Scroll Duration', min: 0, step: 0.01 })
    public smoothScrollDuration: number = 0.2;

    /**
     * 获取最大水平滚动位置
     * Get maximum horizontal scroll position
     */
    public getMaxScrollX(viewportWidth: number): number {
        return Math.max(0, this.contentWidth - viewportWidth);
    }

    /**
     * 获取最大垂直滚动位置
     * Get maximum vertical scroll position
     */
    public getMaxScrollY(viewportHeight: number): number {
        return Math.max(0, this.contentHeight - viewportHeight);
    }

    /**
     * 设置滚动位置
     * Set scroll position
     */
    public setScroll(x: number, y: number, animate: boolean = true): this {
        this.targetScrollX = x;
        this.targetScrollY = y;
        if (!animate) {
            this.scrollX = x;
            this.scrollY = y;
        }
        return this;
    }

    /**
     * 滚动到顶部
     * Scroll to top
     */
    public scrollToTop(animate: boolean = true): this {
        return this.setScroll(this.scrollX, 0, animate);
    }

    /**
     * 滚动到底部
     * Scroll to bottom
     */
    public scrollToBottom(viewportHeight: number, animate: boolean = true): this {
        return this.setScroll(this.scrollX, this.getMaxScrollY(viewportHeight), animate);
    }

    /**
     * 滚动到指定位置（百分比）
     * Scroll to position by percentage
     */
    public scrollToPercent(percentX: number, percentY: number, viewportWidth: number, viewportHeight: number, animate: boolean = true): this {
        const x = this.getMaxScrollX(viewportWidth) * Math.max(0, Math.min(1, percentX));
        const y = this.getMaxScrollY(viewportHeight) * Math.max(0, Math.min(1, percentY));
        return this.setScroll(x, y, animate);
    }

    /**
     * 是否需要显示水平滚动条
     * Whether horizontal scrollbar should be visible
     */
    public needsHorizontalScrollbar(viewportWidth: number): boolean {
        if (!this.horizontalScroll) return false;
        if (this.scrollbarVisibility === UIScrollbarVisibility.Hidden) return false;
        if (this.scrollbarVisibility === UIScrollbarVisibility.Always) return true;
        return this.contentWidth > viewportWidth;
    }

    /**
     * 是否需要显示垂直滚动条
     * Whether vertical scrollbar should be visible
     */
    public needsVerticalScrollbar(viewportHeight: number): boolean {
        if (!this.verticalScroll) return false;
        if (this.scrollbarVisibility === UIScrollbarVisibility.Hidden) return false;
        if (this.scrollbarVisibility === UIScrollbarVisibility.Always) return true;
        return this.contentHeight > viewportHeight;
    }

    /**
     * 获取垂直滚动条手柄尺寸和位置
     * Get vertical scrollbar handle size and position
     */
    public getVerticalScrollbarMetrics(viewportHeight: number): { size: number; position: number } {
        const maxScroll = this.getMaxScrollY(viewportHeight);
        if (maxScroll <= 0) return { size: viewportHeight, position: 0 };

        const size = Math.max(20, (viewportHeight / this.contentHeight) * viewportHeight);
        const availableTrack = viewportHeight - size;
        const position = (this.scrollY / maxScroll) * availableTrack;

        return { size, position };
    }

    /**
     * 获取水平滚动条手柄尺寸和位置
     * Get horizontal scrollbar handle size and position
     */
    public getHorizontalScrollbarMetrics(viewportWidth: number): { size: number; position: number } {
        const maxScroll = this.getMaxScrollX(viewportWidth);
        if (maxScroll <= 0) return { size: viewportWidth, position: 0 };

        const size = Math.max(20, (viewportWidth / this.contentWidth) * viewportWidth);
        const availableTrack = viewportWidth - size;
        const position = (this.scrollX / maxScroll) * availableTrack;

        return { size, position };
    }
}
