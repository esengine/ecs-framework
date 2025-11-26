import { Component, ECSComponent, Property, Serializable, Serialize } from '@esengine/ecs-framework';

/**
 * 渲染类型
 * Render types for different visual elements
 */
export enum UIRenderType {
    /** 纯色矩形 Solid color rectangle */
    Rect = 'rect',
    /** 图片 Image/Texture */
    Image = 'image',
    /** 九宫格图片 Nine-patch/Nine-slice image */
    NinePatch = 'ninepatch',
    /** 圆形 Circle */
    Circle = 'circle',
    /** 圆角矩形 Rounded rectangle */
    RoundedRect = 'rounded-rect'
}

/**
 * 边框样式
 * Border style configuration
 */
export interface UIBorderStyle {
    width: number;
    color: number;
    alpha: number;
}

/**
 * 阴影样式
 * Shadow style configuration
 */
export interface UIShadowStyle {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: number;
    alpha: number;
}

/**
 * UI 渲染组件
 * UI Render Component - Handles visual appearance of UI elements
 *
 * 定义元素的视觉属性，如颜色、纹理、边框等
 * Defines visual properties like color, texture, border, etc.
 */
@ECSComponent('UIRender')
@Serializable({ version: 1, typeId: 'UIRender' })
export class UIRenderComponent extends Component {
    /**
     * 渲染类型
     * Type of rendering
     */
    @Serialize()
    @Property({
        type: 'enum',
        label: 'Type',
        options: [
            { value: 'rect', label: 'Rectangle' },
            { value: 'image', label: 'Image' },
            { value: 'ninepatch', label: 'Nine Patch' },
            { value: 'circle', label: 'Circle' },
            { value: 'rounded-rect', label: 'Rounded Rect' }
        ]
    })
    public type: UIRenderType = UIRenderType.Rect;

    // ===== 颜色 Colors =====

    /**
     * 背景颜色 (0xRRGGBB)
     * Background color in hex format
     */
    @Serialize()
    @Property({ type: 'color', label: 'Background Color' })
    public backgroundColor: number = 0xFFFFFF;

    /**
     * 背景透明度 (0-1)
     * Background alpha
     */
    @Serialize()
    @Property({ type: 'number', label: 'Background Alpha', min: 0, max: 1, step: 0.01 })
    public backgroundAlpha: number = 1;

    /**
     * 是否填充背景
     * Whether to fill background
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Fill Background' })
    public fillBackground: boolean = true;

    // ===== 纹理 Texture =====

    /**
     * 纹理路径或 ID
     * Texture path or runtime ID
     */
    @Serialize()
    @Property({ type: 'asset', label: 'Texture', assetType: 'texture' })
    public texture: string | number | null = null;

    /**
     * 纹理 UV 坐标 (用于图集)
     * Texture UV coordinates (for atlas)
     */
    public textureUV: { u0: number; v0: number; u1: number; v1: number } | null = null;

    /**
     * 纹理色调 (0xRRGGBB)
     * Texture tint color
     */
    public textureTint: number = 0xFFFFFF;

    // ===== 九宫格 Nine-Patch =====

    /**
     * 九宫格边距 [top, right, bottom, left]
     * Nine-patch margins
     */
    public ninePatchMargins: [number, number, number, number] = [0, 0, 0, 0];

    // ===== 边框 Border =====

    /**
     * 边框宽度
     * Border width
     */
    @Property({ type: 'number', label: 'Border Width', min: 0 })
    public borderWidth: number = 0;

    /**
     * 边框颜色
     * Border color
     */
    @Property({ type: 'color', label: 'Border Color' })
    public borderColor: number = 0x000000;

    /**
     * 边框透明度
     * Border alpha
     */
    @Property({ type: 'number', label: 'Border Alpha', min: 0, max: 1, step: 0.01 })
    public borderAlpha: number = 1;

    /**
     * 圆角半径 [topLeft, topRight, bottomRight, bottomLeft]
     * Corner radius for each corner
     */
    public borderRadius: [number, number, number, number] = [0, 0, 0, 0];

    // ===== 阴影 Shadow =====

    /**
     * 是否启用阴影
     * Whether shadow is enabled
     */
    @Property({ type: 'boolean', label: 'Shadow Enabled' })
    public shadowEnabled: boolean = false;

    /**
     * 阴影 X 偏移
     * Shadow X offset
     */
    @Property({ type: 'number', label: 'Shadow Offset X' })
    public shadowOffsetX: number = 0;

    /**
     * 阴影 Y 偏移
     * Shadow Y offset
     */
    @Property({ type: 'number', label: 'Shadow Offset Y' })
    public shadowOffsetY: number = 2;

    /**
     * 阴影模糊半径
     * Shadow blur radius
     */
    @Property({ type: 'number', label: 'Shadow Blur', min: 0 })
    public shadowBlur: number = 4;

    /**
     * 阴影颜色
     * Shadow color
     */
    @Property({ type: 'color', label: 'Shadow Color' })
    public shadowColor: number = 0x000000;

    /**
     * 阴影透明度
     * Shadow alpha
     */
    @Property({ type: 'number', label: 'Shadow Alpha', min: 0, max: 1, step: 0.01 })
    public shadowAlpha: number = 0.3;

    // ===== 渐变 Gradient =====

    /**
     * 渐变类型
     * Gradient type
     */
    public gradientType: 'none' | 'linear' | 'radial' = 'none';

    /**
     * 渐变角度（线性渐变）
     * Gradient angle for linear gradient
     */
    public gradientAngle: number = 0;

    /**
     * 渐变颜色停止点 [[position, color, alpha], ...]
     * Gradient color stops
     */
    public gradientStops: Array<[number, number, number]> = [];

    /**
     * 设置纯色背景
     * Set solid color background
     */
    public setColor(color: number, alpha: number = 1): this {
        this.backgroundColor = color;
        this.backgroundAlpha = alpha;
        this.fillBackground = true;
        return this;
    }

    /**
     * 设置图片
     * Set image texture
     */
    public setImage(texture: string | number): this {
        this.type = UIRenderType.Image;
        this.texture = texture;
        return this;
    }

    /**
     * 设置九宫格
     * Set nine-patch image
     */
    public setNinePatch(texture: string | number, margins: [number, number, number, number]): this {
        this.type = UIRenderType.NinePatch;
        this.texture = texture;
        this.ninePatchMargins = margins;
        return this;
    }

    /**
     * 设置边框
     * Set border style
     */
    public setBorder(width: number, color: number, alpha: number = 1): this {
        this.borderWidth = width;
        this.borderColor = color;
        this.borderAlpha = alpha;
        return this;
    }

    /**
     * 设置圆角
     * Set corner radius (uniform or per-corner)
     */
    public setCornerRadius(radius: number | [number, number, number, number]): this {
        if (typeof radius === 'number') {
            this.borderRadius = [radius, radius, radius, radius];
        } else {
            this.borderRadius = radius;
        }
        const hasRadius = typeof radius === 'number' ? radius > 0 : radius.some(r => r > 0);
        if (hasRadius) {
            this.type = UIRenderType.RoundedRect;
        }
        return this;
    }

    /**
     * 设置阴影
     * Set shadow style
     */
    public setShadow(offsetX: number, offsetY: number, blur: number, color: number, alpha: number = 0.3): this {
        this.shadowEnabled = true;
        this.shadowOffsetX = offsetX;
        this.shadowOffsetY = offsetY;
        this.shadowBlur = blur;
        this.shadowColor = color;
        this.shadowAlpha = alpha;
        return this;
    }

    /**
     * 设置线性渐变
     * Set linear gradient
     */
    public setLinearGradient(angle: number, stops: Array<[number, number, number]>): this {
        this.gradientType = 'linear';
        this.gradientAngle = angle;
        this.gradientStops = stops;
        return this;
    }
}
