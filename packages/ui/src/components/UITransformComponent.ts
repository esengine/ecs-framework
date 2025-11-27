import { Component, ECSComponent, Property, Serializable, Serialize } from '@esengine/ecs-framework';

/**
 * 锚点预设
 * Anchor presets for common positioning scenarios
 */
export enum AnchorPreset {
    TopLeft = 'top-left',
    TopCenter = 'top-center',
    TopRight = 'top-right',
    MiddleLeft = 'middle-left',
    MiddleCenter = 'middle-center',
    MiddleRight = 'middle-right',
    BottomLeft = 'bottom-left',
    BottomCenter = 'bottom-center',
    BottomRight = 'bottom-right',
    StretchAll = 'stretch-all'
}

/**
 * UI 变换组件
 * UI Transform Component - Handles position, size, and hierarchy for UI elements
 *
 * 基于父元素的相对定位系统，支持锚点、轴心点和拉伸模式
 * Relative positioning system based on parent, supports anchors, pivots, and stretch modes
 */
@ECSComponent('UITransform')
@Serializable({ version: 1, typeId: 'UITransform' })
export class UITransformComponent extends Component {
    // ===== 位置 Position =====

    /**
     * 相对于锚点的 X 偏移
     * X offset relative to anchor point
     */
    @Serialize()
    @Property({ type: 'number', label: 'X' })
    public x: number = 0;

    /**
     * 相对于锚点的 Y 偏移
     * Y offset relative to anchor point
     */
    @Serialize()
    @Property({ type: 'number', label: 'Y' })
    public y: number = 0;

    // ===== 尺寸 Size =====

    /**
     * 宽度（像素或百分比，取决于 widthMode）
     * Width in pixels or percentage depending on widthMode
     */
    @Serialize()
    @Property({ type: 'number', label: 'Width', min: 0 })
    public width: number = 100;

    /**
     * 高度（像素或百分比，取决于 heightMode）
     * Height in pixels or percentage depending on heightMode
     */
    @Serialize()
    @Property({ type: 'number', label: 'Height', min: 0 })
    public height: number = 30;

    /**
     * 最小宽度限制
     * Minimum width constraint
     */
    @Serialize()
    @Property({ type: 'number', label: 'Min Width', min: 0 })
    public minWidth: number = 0;

    /**
     * 最大宽度限制（0 = 无限制）
     * Maximum width constraint (0 = no limit)
     */
    @Serialize()
    @Property({ type: 'number', label: 'Max Width', min: 0 })
    public maxWidth: number = 0;

    /**
     * 最小高度限制
     * Minimum height constraint
     */
    @Serialize()
    @Property({ type: 'number', label: 'Min Height', min: 0 })
    public minHeight: number = 0;

    /**
     * 最大高度限制（0 = 无限制）
     * Maximum height constraint (0 = no limit)
     */
    @Serialize()
    @Property({ type: 'number', label: 'Max Height', min: 0 })
    public maxHeight: number = 0;

    // ===== 锚点 Anchors =====

    /**
     * 锚点 X 最小值 (0-1)，相对于父元素
     * Anchor X minimum (0-1), relative to parent
     */
    @Serialize()
    @Property({ type: 'number', label: 'Anchor Min X', min: 0, max: 1, step: 0.01 })
    public anchorMinX: number = 0.5;

    /**
     * 锚点 Y 最小值 (0-1)，相对于父元素
     * Anchor Y minimum (0-1), relative to parent
     */
    @Serialize()
    @Property({ type: 'number', label: 'Anchor Min Y', min: 0, max: 1, step: 0.01 })
    public anchorMinY: number = 0.5;

    /**
     * 锚点 X 最大值 (0-1)，相对于父元素
     * Anchor X maximum (0-1), relative to parent
     */
    @Serialize()
    @Property({ type: 'number', label: 'Anchor Max X', min: 0, max: 1, step: 0.01 })
    public anchorMaxX: number = 0.5;

    /**
     * 锚点 Y 最大值 (0-1)，相对于父元素
     * Anchor Y maximum (0-1), relative to parent
     */
    @Serialize()
    @Property({ type: 'number', label: 'Anchor Max Y', min: 0, max: 1, step: 0.01 })
    public anchorMaxY: number = 0.5;

    // ===== 轴心 Pivot =====

    /**
     * 轴心点 X (0-1)，元素自身的旋转/缩放中心
     * Pivot X (0-1), element's own rotation/scale center
     */
    @Serialize()
    @Property({ type: 'number', label: 'Pivot X', min: 0, max: 1, step: 0.01 })
    public pivotX: number = 0.5;

    /**
     * 轴心点 Y (0-1)，元素自身的旋转/缩放中心
     * Pivot Y (0-1), element's own rotation/scale center
     */
    @Serialize()
    @Property({ type: 'number', label: 'Pivot Y', min: 0, max: 1, step: 0.01 })
    public pivotY: number = 0.5;

    // ===== 变换 Transform =====

    /**
     * 旋转角度（弧度）
     * Rotation angle in radians
     */
    @Serialize()
    @Property({ type: 'number', label: 'Rotation', step: 0.01 })
    public rotation: number = 0;

    /**
     * X 轴缩放
     * Scale on X axis
     */
    @Serialize()
    @Property({ type: 'number', label: 'Scale X', step: 0.01 })
    public scaleX: number = 1;

    /**
     * Y 轴缩放
     * Scale on Y axis
     */
    @Serialize()
    @Property({ type: 'number', label: 'Scale Y', step: 0.01 })
    public scaleY: number = 1;

    // ===== 显示 Display =====

    /**
     * 是否可见
     * Visibility flag
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Visible' })
    public visible: boolean = true;

    /**
     * 渲染层级，值越大越靠前
     * Render order, higher values render on top
     */
    @Serialize()
    @Property({ type: 'integer', label: 'Z Index' })
    public zIndex: number = 0;

    /**
     * 透明度 (0-1)
     * Opacity (0-1)
     */
    @Serialize()
    @Property({ type: 'number', label: 'Alpha', min: 0, max: 1, step: 0.01 })
    public alpha: number = 1;

    // ===== 计算后的世界坐标（由 UILayoutSystem 填充）=====
    // Computed world coordinates (filled by UILayoutSystem)

    /**
     * 计算后的世界 X 坐标
     * Computed world X position
     */
    public worldX: number = 0;

    /**
     * 计算后的世界 Y 坐标
     * Computed world Y position
     */
    public worldY: number = 0;

    /**
     * 计算后的实际宽度
     * Computed actual width
     */
    public computedWidth: number = 0;

    /**
     * 计算后的实际高度
     * Computed actual height
     */
    public computedHeight: number = 0;

    /**
     * 计算后的世界透明度（考虑父元素透明度）
     * Computed world alpha (considering parent alpha)
     */
    public worldAlpha: number = 1;

    /**
     * 布局是否需要更新
     * Flag indicating layout needs update
     */
    public layoutDirty: boolean = true;

    /**
     * 设置锚点预设
     * Set anchor preset for quick positioning
     */
    public setAnchorPreset(preset: AnchorPreset): this {
        switch (preset) {
            case AnchorPreset.TopLeft:
                this.anchorMinX = 0; this.anchorMinY = 0;
                this.anchorMaxX = 0; this.anchorMaxY = 0;
                break;
            case AnchorPreset.TopCenter:
                this.anchorMinX = 0.5; this.anchorMinY = 0;
                this.anchorMaxX = 0.5; this.anchorMaxY = 0;
                break;
            case AnchorPreset.TopRight:
                this.anchorMinX = 1; this.anchorMinY = 0;
                this.anchorMaxX = 1; this.anchorMaxY = 0;
                break;
            case AnchorPreset.MiddleLeft:
                this.anchorMinX = 0; this.anchorMinY = 0.5;
                this.anchorMaxX = 0; this.anchorMaxY = 0.5;
                break;
            case AnchorPreset.MiddleCenter:
                this.anchorMinX = 0.5; this.anchorMinY = 0.5;
                this.anchorMaxX = 0.5; this.anchorMaxY = 0.5;
                break;
            case AnchorPreset.MiddleRight:
                this.anchorMinX = 1; this.anchorMinY = 0.5;
                this.anchorMaxX = 1; this.anchorMaxY = 0.5;
                break;
            case AnchorPreset.BottomLeft:
                this.anchorMinX = 0; this.anchorMinY = 1;
                this.anchorMaxX = 0; this.anchorMaxY = 1;
                break;
            case AnchorPreset.BottomCenter:
                this.anchorMinX = 0.5; this.anchorMinY = 1;
                this.anchorMaxX = 0.5; this.anchorMaxY = 1;
                break;
            case AnchorPreset.BottomRight:
                this.anchorMinX = 1; this.anchorMinY = 1;
                this.anchorMaxX = 1; this.anchorMaxY = 1;
                break;
            case AnchorPreset.StretchAll:
                this.anchorMinX = 0; this.anchorMinY = 0;
                this.anchorMaxX = 1; this.anchorMaxY = 1;
                break;
        }
        this.layoutDirty = true;
        return this;
    }

    /**
     * 设置位置
     * Set position
     */
    public setPosition(x: number, y: number): this {
        this.x = x;
        this.y = y;
        this.layoutDirty = true;
        return this;
    }

    /**
     * 设置尺寸
     * Set size
     */
    public setSize(width: number, height: number): this {
        this.width = width;
        this.height = height;
        this.layoutDirty = true;
        return this;
    }

    /**
     * 设置轴心点
     * Set pivot point
     */
    public setPivot(x: number, y: number): this {
        this.pivotX = x;
        this.pivotY = y;
        this.layoutDirty = true;
        return this;
    }

    /**
     * 检测点是否在元素内
     * Test if a point is inside this element
     */
    public containsPoint(worldX: number, worldY: number): boolean {
        return worldX >= this.worldX &&
               worldX <= this.worldX + this.computedWidth &&
               worldY >= this.worldY &&
               worldY <= this.worldY + this.computedHeight;
    }
}
