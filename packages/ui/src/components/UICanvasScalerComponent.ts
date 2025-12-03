import { Component, ECSComponent, Property, Serializable, Serialize } from '@esengine/ecs-framework';

/**
 * 缩放模式
 * Scale mode for canvas
 */
export enum UIScaleMode {
    /**
     * 固定像素大小，不缩放
     * Constant pixel size, no scaling
     */
    ConstantPixelSize = 'constant-pixel-size',

    /**
     * 根据屏幕尺寸缩放（最常用）
     * Scale with screen size (most common)
     */
    ScaleWithScreenSize = 'scale-with-screen-size',

    /**
     * 根据物理尺寸缩放（基于 DPI）
     * Scale with physical size (DPI-based)
     */
    ConstantPhysicalSize = 'constant-physical-size'
}

/**
 * 屏幕匹配模式
 * Screen match mode for scaling calculation
 */
export enum UIScreenMatchMode {
    /**
     * 宽度优先 - 保持设计宽度，高度自适应
     * Match width - maintain design width, height adapts
     * 适合横屏游戏
     */
    MatchWidth = 'match-width',

    /**
     * 高度优先 - 保持设计高度，宽度自适应
     * Match height - maintain design height, width adapts
     * 适合竖屏游戏
     */
    MatchHeight = 'match-height',

    /**
     * 宽高混合 - 根据权重混合宽高缩放
     * Match width or height - blend between width and height scaling
     */
    MatchWidthOrHeight = 'match-width-or-height',

    /**
     * 扩展模式 - 保证设计分辨率内容完全显示，可能有黑边
     * Expand - ensure design resolution content is fully visible, may have letterbox
     */
    Expand = 'expand',

    /**
     * 收缩模式 - 填满屏幕，设计分辨率外的内容可能被裁剪
     * Shrink - fill screen, content outside design resolution may be cropped
     */
    Shrink = 'shrink'
}

/**
 * UI 画布缩放组件
 * UI Canvas Scaler Component - Handles UI scaling for different screen sizes
 *
 * 用于适配不同分辨率和屏幕方向的 UI 系统
 * Used to adapt UI system for different resolutions and screen orientations
 */
@ECSComponent('UICanvasScaler')
@Serializable({ version: 1, typeId: 'UICanvasScaler' })
export class UICanvasScalerComponent extends Component {
    // ===== 缩放模式 Scale Mode =====

    /**
     * 缩放模式
     * Scale mode
     */
    @Serialize()
    @Property({
        type: 'enum',
        label: 'Scale Mode',
        options: [
            { value: 'constant-pixel-size', label: 'Constant Pixel Size' },
            { value: 'scale-with-screen-size', label: 'Scale With Screen Size' },
            { value: 'constant-physical-size', label: 'Constant Physical Size' }
        ]
    })
    public scaleMode: UIScaleMode = UIScaleMode.ScaleWithScreenSize;

    // ===== 设计分辨率 Reference Resolution =====

    /**
     * 设计分辨率宽度
     * Reference resolution width
     */
    @Serialize()
    @Property({ type: 'number', label: 'Reference Width', min: 1 })
    public referenceWidth: number = 1920;

    /**
     * 设计分辨率高度
     * Reference resolution height
     */
    @Serialize()
    @Property({ type: 'number', label: 'Reference Height', min: 1 })
    public referenceHeight: number = 1080;

    // ===== 屏幕匹配 Screen Match =====

    /**
     * 屏幕匹配模式
     * Screen match mode
     */
    @Serialize()
    @Property({
        type: 'enum',
        label: 'Screen Match Mode',
        options: [
            { value: 'match-width', label: 'Match Width' },
            { value: 'match-height', label: 'Match Height' },
            { value: 'match-width-or-height', label: 'Match Width Or Height' },
            { value: 'expand', label: 'Expand' },
            { value: 'shrink', label: 'Shrink' }
        ]
    })
    public screenMatchMode: UIScreenMatchMode = UIScreenMatchMode.MatchWidthOrHeight;

    /**
     * 宽高匹配权重 (0=完全宽度, 1=完全高度)
     * Match weight between width and height (0=full width, 1=full height)
     * 仅在 MatchWidthOrHeight 模式下生效
     */
    @Serialize()
    @Property({ type: 'number', label: 'Match', min: 0, max: 1, step: 0.01 })
    public match: number = 0.5;

    // ===== 像素密度 Pixel Density =====

    /**
     * 缩放因子（ConstantPixelSize 模式）
     * Scale factor for ConstantPixelSize mode
     */
    @Serialize()
    @Property({ type: 'number', label: 'Scale Factor', min: 0.1, step: 0.1 })
    public scaleFactor: number = 1;

    /**
     * 参考 DPI（ConstantPhysicalSize 模式）
     * Reference DPI for ConstantPhysicalSize mode
     */
    @Serialize()
    @Property({ type: 'number', label: 'Reference DPI', min: 1 })
    public referenceDPI: number = 96;

    // ===== 计算结果 Computed Results =====

    /**
     * 计算后的缩放比例
     * Computed scale ratio
     */
    public computedScale: number = 1;

    /**
     * 计算后的画布宽度
     * Computed canvas width (in design units)
     */
    public computedCanvasWidth: number = 1920;

    /**
     * 计算后的画布高度
     * Computed canvas height (in design units)
     */
    public computedCanvasHeight: number = 1080;

    /**
     * 当前屏幕宽度
     * Current screen width
     */
    public screenWidth: number = 1920;

    /**
     * 当前屏幕高度
     * Current screen height
     */
    public screenHeight: number = 1080;

    /**
     * 当前设备 DPI
     * Current device DPI
     */
    public currentDPI: number = 96;

    /**
     * 是否需要重新计算
     * Flag indicating recalculation needed
     */
    public dirty: boolean = true;

    /**
     * 计算缩放比例
     * Calculate scale ratio based on current screen size
     */
    public calculateScale(screenWidth: number, screenHeight: number, dpi: number = 96): void {
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        this.currentDPI = dpi;

        switch (this.scaleMode) {
            case UIScaleMode.ConstantPixelSize:
                this.computedScale = this.scaleFactor;
                break;

            case UIScaleMode.ConstantPhysicalSize:
                this.computedScale = dpi / this.referenceDPI;
                break;

            case UIScaleMode.ScaleWithScreenSize:
                this.computedScale = this.calculateScreenScale(screenWidth, screenHeight);
                break;
        }

        // 计算画布逻辑尺寸 | Calculate logical canvas size
        this.computedCanvasWidth = screenWidth / this.computedScale;
        this.computedCanvasHeight = screenHeight / this.computedScale;

        this.dirty = false;
    }

    /**
     * 计算屏幕缩放比例
     * Calculate screen scale based on match mode
     */
    private calculateScreenScale(screenWidth: number, screenHeight: number): number {
        const widthScale = screenWidth / this.referenceWidth;
        const heightScale = screenHeight / this.referenceHeight;

        switch (this.screenMatchMode) {
            case UIScreenMatchMode.MatchWidth:
                return widthScale;

            case UIScreenMatchMode.MatchHeight:
                return heightScale;

            case UIScreenMatchMode.MatchWidthOrHeight:
                // 对数插值，提供更平滑的过渡
                // Logarithmic interpolation for smoother transition
                const logWidth = Math.log2(widthScale);
                const logHeight = Math.log2(heightScale);
                const logScale = logWidth + (logHeight - logWidth) * this.match;
                return Math.pow(2, logScale);

            case UIScreenMatchMode.Expand:
                // 取较小值，保证内容完全显示
                // Take smaller value to ensure content is fully visible
                return Math.min(widthScale, heightScale);

            case UIScreenMatchMode.Shrink:
                // 取较大值，填满屏幕
                // Take larger value to fill screen
                return Math.max(widthScale, heightScale);

            default:
                return 1;
        }
    }

    /**
     * 设置设计分辨率
     * Set reference resolution
     */
    public setReferenceResolution(width: number, height: number): this {
        this.referenceWidth = width;
        this.referenceHeight = height;
        this.dirty = true;
        return this;
    }

    /**
     * 设置缩放模式
     * Set scale mode
     */
    public setScaleMode(mode: UIScaleMode): this {
        this.scaleMode = mode;
        this.dirty = true;
        return this;
    }

    /**
     * 设置屏幕匹配模式
     * Set screen match mode
     */
    public setScreenMatchMode(mode: UIScreenMatchMode, match?: number): this {
        this.screenMatchMode = mode;
        if (match !== undefined) {
            this.match = match;
        }
        this.dirty = true;
        return this;
    }

    /**
     * 获取设计分辨率的宽高比
     * Get reference resolution aspect ratio
     */
    public getReferenceAspectRatio(): number {
        return this.referenceWidth / this.referenceHeight;
    }

    /**
     * 获取当前屏幕宽高比
     * Get current screen aspect ratio
     */
    public getScreenAspectRatio(): number {
        return this.screenWidth / this.screenHeight;
    }

    /**
     * 判断当前是否为横屏
     * Check if current orientation is landscape
     */
    public isLandscape(): boolean {
        return this.screenWidth > this.screenHeight;
    }

    /**
     * 判断当前是否为竖屏
     * Check if current orientation is portrait
     */
    public isPortrait(): boolean {
        return this.screenHeight > this.screenWidth;
    }

    /**
     * 将屏幕坐标转换为画布坐标
     * Convert screen coordinates to canvas coordinates
     */
    public screenToCanvas(screenX: number, screenY: number): { x: number; y: number } {
        return {
            x: screenX / this.computedScale,
            y: screenY / this.computedScale
        };
    }

    /**
     * 将画布坐标转换为屏幕坐标
     * Convert canvas coordinates to screen coordinates
     */
    public canvasToScreen(canvasX: number, canvasY: number): { x: number; y: number } {
        return {
            x: canvasX * this.computedScale,
            y: canvasY * this.computedScale
        };
    }
}
