import { Component, ECSComponent, Property, Serializable, Serialize } from '@esengine/ecs-framework';

/**
 * 安全区域边缘
 * Safe area edges configuration
 */
export interface SafeAreaInsets {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

/**
 * 安全区域适配模式
 * Safe area adaptation mode
 */
export enum SafeAreaMode {
    /**
     * 不适配安全区域
     * No safe area adaptation
     */
    None = 'none',

    /**
     * 仅适配顶部（刘海屏）
     * Adapt top only (notch)
     */
    Top = 'top',

    /**
     * 仅适配底部（Home 指示器）
     * Adapt bottom only (home indicator)
     */
    Bottom = 'bottom',

    /**
     * 适配顶部和底部
     * Adapt top and bottom
     */
    Vertical = 'vertical',

    /**
     * 适配左右（横屏刘海）
     * Adapt left and right (landscape notch)
     */
    Horizontal = 'horizontal',

    /**
     * 适配所有边缘
     * Adapt all edges
     */
    All = 'all'
}

/**
 * UI 安全区域组件
 * UI Safe Area Component - Handles safe area insets for notched/rounded screens
 *
 * 用于处理刘海屏、圆角屏、Home 指示器等设备特性
 * Used to handle device features like notch, rounded corners, home indicator
 */
@ECSComponent('UISafeArea')
@Serializable({ version: 1, typeId: 'UISafeArea' })
export class UISafeAreaComponent extends Component {
    /**
     * 安全区域适配模式
     * Safe area adaptation mode
     */
    @Serialize()
    @Property({
        type: 'enum',
        label: 'Mode',
        options: [
            { value: 'none', label: 'None' },
            { value: 'top', label: 'Top Only' },
            { value: 'bottom', label: 'Bottom Only' },
            { value: 'vertical', label: 'Vertical' },
            { value: 'horizontal', label: 'Horizontal' },
            { value: 'all', label: 'All' }
        ]
    })
    public mode: SafeAreaMode = SafeAreaMode.All;

    /**
     * 是否自动检测安全区域
     * Whether to auto-detect safe area from device
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Auto Detect' })
    public autoDetect: boolean = true;

    /**
     * 手动设置的安全区域内边距
     * Manually set safe area insets
     */
    @Serialize()
    @Property({ type: 'number', label: 'Manual Top', min: 0 })
    public manualTop: number = 0;

    @Serialize()
    @Property({ type: 'number', label: 'Manual Right', min: 0 })
    public manualRight: number = 0;

    @Serialize()
    @Property({ type: 'number', label: 'Manual Bottom', min: 0 })
    public manualBottom: number = 0;

    @Serialize()
    @Property({ type: 'number', label: 'Manual Left', min: 0 })
    public manualLeft: number = 0;

    /**
     * 额外的内边距（在安全区域基础上增加）
     * Extra padding (added on top of safe area)
     */
    @Serialize()
    @Property({ type: 'number', label: 'Extra Padding', min: 0 })
    public extraPadding: number = 0;

    // ===== 计算结果 Computed Results =====

    /**
     * 检测到的设备安全区域
     * Detected device safe area insets
     */
    public detectedInsets: SafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };

    /**
     * 最终应用的安全区域
     * Final applied safe area insets
     */
    public appliedInsets: SafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };

    /**
     * 是否需要重新计算
     * Flag indicating recalculation needed
     */
    public dirty: boolean = true;

    /**
     * 检测设备安全区域
     * Detect device safe area insets
     */
    public detectSafeArea(): void {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            this.detectedInsets = { top: 0, right: 0, bottom: 0, left: 0 };
            return;
        }

        // 使用 CSS 环境变量获取安全区域
        // Use CSS environment variables to get safe area
        const computedStyle = getComputedStyle(document.documentElement);

        this.detectedInsets = {
            top: this.parseSafeAreaValue(computedStyle.getPropertyValue('env(safe-area-inset-top)')),
            right: this.parseSafeAreaValue(computedStyle.getPropertyValue('env(safe-area-inset-right)')),
            bottom: this.parseSafeAreaValue(computedStyle.getPropertyValue('env(safe-area-inset-bottom)')),
            left: this.parseSafeAreaValue(computedStyle.getPropertyValue('env(safe-area-inset-left)'))
        };

        this.dirty = true;
    }

    /**
     * 解析安全区域值
     * Parse safe area value from CSS
     */
    private parseSafeAreaValue(value: string): number {
        if (!value || value === '') return 0;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }

    /**
     * 计算应用的安全区域
     * Calculate applied safe area based on mode and settings
     */
    public calculateAppliedInsets(): void {
        const baseInsets = this.autoDetect ? this.detectedInsets : {
            top: this.manualTop,
            right: this.manualRight,
            bottom: this.manualBottom,
            left: this.manualLeft
        };

        // 根据模式过滤边缘
        // Filter edges based on mode
        switch (this.mode) {
            case SafeAreaMode.None:
                this.appliedInsets = { top: 0, right: 0, bottom: 0, left: 0 };
                break;

            case SafeAreaMode.Top:
                this.appliedInsets = {
                    top: baseInsets.top + this.extraPadding,
                    right: 0,
                    bottom: 0,
                    left: 0
                };
                break;

            case SafeAreaMode.Bottom:
                this.appliedInsets = {
                    top: 0,
                    right: 0,
                    bottom: baseInsets.bottom + this.extraPadding,
                    left: 0
                };
                break;

            case SafeAreaMode.Vertical:
                this.appliedInsets = {
                    top: baseInsets.top + this.extraPadding,
                    right: 0,
                    bottom: baseInsets.bottom + this.extraPadding,
                    left: 0
                };
                break;

            case SafeAreaMode.Horizontal:
                this.appliedInsets = {
                    top: 0,
                    right: baseInsets.right + this.extraPadding,
                    bottom: 0,
                    left: baseInsets.left + this.extraPadding
                };
                break;

            case SafeAreaMode.All:
                this.appliedInsets = {
                    top: baseInsets.top + this.extraPadding,
                    right: baseInsets.right + this.extraPadding,
                    bottom: baseInsets.bottom + this.extraPadding,
                    left: baseInsets.left + this.extraPadding
                };
                break;
        }

        this.dirty = false;
    }

    /**
     * 更新安全区域（检测 + 计算）
     * Update safe area (detect + calculate)
     */
    public update(): void {
        if (this.autoDetect) {
            this.detectSafeArea();
        }
        this.calculateAppliedInsets();
    }

    /**
     * 设置模式
     * Set mode
     */
    public setMode(mode: SafeAreaMode): this {
        this.mode = mode;
        this.dirty = true;
        return this;
    }

    /**
     * 设置手动内边距
     * Set manual insets
     */
    public setManualInsets(insets: Partial<SafeAreaInsets>): this {
        if (insets.top !== undefined) this.manualTop = insets.top;
        if (insets.right !== undefined) this.manualRight = insets.right;
        if (insets.bottom !== undefined) this.manualBottom = insets.bottom;
        if (insets.left !== undefined) this.manualLeft = insets.left;
        this.dirty = true;
        return this;
    }

    /**
     * 获取内容区域（排除安全区域后的可用区域）
     * Get content rect (available area after excluding safe area)
     */
    public getContentRect(screenWidth: number, screenHeight: number): {
        x: number;
        y: number;
        width: number;
        height: number;
    } {
        return {
            x: this.appliedInsets.left,
            y: this.appliedInsets.top,
            width: screenWidth - this.appliedInsets.left - this.appliedInsets.right,
            height: screenHeight - this.appliedInsets.top - this.appliedInsets.bottom
        };
    }

    /**
     * 检查点是否在安全区域内
     * Check if point is within safe area
     */
    public isPointInSafeArea(x: number, y: number, screenWidth: number, screenHeight: number): boolean {
        return x >= this.appliedInsets.left &&
               x <= screenWidth - this.appliedInsets.right &&
               y >= this.appliedInsets.top &&
               y <= screenHeight - this.appliedInsets.bottom;
    }
}
