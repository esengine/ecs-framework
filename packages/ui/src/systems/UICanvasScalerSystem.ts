import { EntitySystem, Matcher, Entity, ECSSystem } from '@esengine/ecs-framework';
import { UICanvasScalerComponent } from '../components/UICanvasScalerComponent';
import { UISafeAreaComponent } from '../components/UISafeAreaComponent';
import { UILayoutSystem } from './UILayoutSystem';

/**
 * 屏幕信息接口
 * Screen info interface
 */
export interface ScreenInfo {
    width: number;
    height: number;
    dpi: number;
    devicePixelRatio: number;
}

/**
 * UI 画布缩放系统
 * UI Canvas Scaler System - Manages canvas scaling and safe area adaptation
 *
 * 此系统应该在 UILayoutSystem 之前执行，以便在布局计算前更新画布尺寸
 * This system should execute before UILayoutSystem to update canvas size before layout calculation
 */
@ECSSystem('UICanvasScaler')
export class UICanvasScalerSystem extends EntitySystem {
    /**
     * 当前屏幕信息
     * Current screen info
     */
    private screenInfo: ScreenInfo = {
        width: 1920,
        height: 1080,
        dpi: 96,
        devicePixelRatio: 1
    };

    /**
     * UILayoutSystem 引用（用于更新画布尺寸）
     * Reference to UILayoutSystem (for updating canvas size)
     */
    private layoutSystem: UILayoutSystem | null = null;

    /**
     * 是否需要更新
     * Flag indicating update needed
     */
    private needsUpdate: boolean = true;

    /**
     * 上一次的屏幕尺寸（用于检测变化）
     * Previous screen size (for detecting changes)
     */
    private lastScreenWidth: number = 0;
    private lastScreenHeight: number = 0;

    constructor() {
        super(Matcher.empty().any(UICanvasScalerComponent, UISafeAreaComponent));
    }

    /**
     * 设置 UILayoutSystem 引用
     * Set UILayoutSystem reference
     */
    public setLayoutSystem(layoutSystem: UILayoutSystem): void {
        this.layoutSystem = layoutSystem;
    }

    /**
     * 更新屏幕信息
     * Update screen info
     */
    public updateScreenInfo(info: Partial<ScreenInfo>): void {
        if (info.width !== undefined) this.screenInfo.width = info.width;
        if (info.height !== undefined) this.screenInfo.height = info.height;
        if (info.dpi !== undefined) this.screenInfo.dpi = info.dpi;
        if (info.devicePixelRatio !== undefined) this.screenInfo.devicePixelRatio = info.devicePixelRatio;
        this.needsUpdate = true;
    }

    /**
     * 从浏览器自动检测屏幕信息
     * Auto-detect screen info from browser
     */
    public detectScreenInfo(): void {
        if (typeof window === 'undefined') return;

        this.screenInfo = {
            width: window.innerWidth,
            height: window.innerHeight,
            dpi: this.detectDPI(),
            devicePixelRatio: window.devicePixelRatio || 1
        };
        this.needsUpdate = true;
    }

    /**
     * 检测屏幕 DPI
     * Detect screen DPI using multiple methods
     *
     * 方法优先级：
     * 1. 使用 CSS 媒体查询检测（最准确）
     * 2. 通过 devicePixelRatio 估算
     * 3. 回退到标准 96 DPI
     */
    private detectDPI(): number {
        if (typeof window === 'undefined') return 96;

        // 方法1：使用 CSS 媒体查询二分查找实际 DPI
        // Method 1: Binary search using CSS media queries
        const dpiFromMediaQuery = this.detectDPIFromMediaQuery();
        if (dpiFromMediaQuery > 0) {
            return dpiFromMediaQuery;
        }

        // 方法2：通过创建临时元素测量
        // Method 2: Measure using temporary element
        const dpiFromElement = this.detectDPIFromElement();
        if (dpiFromElement > 0) {
            return dpiFromElement;
        }

        // 方法3：使用 devicePixelRatio 估算（假设基准 96 DPI）
        // Method 3: Estimate from devicePixelRatio (assuming 96 DPI baseline)
        const dpr = window.devicePixelRatio || 1;
        return Math.round(96 * dpr);
    }

    /**
     * 使用 CSS 媒体查询检测 DPI
     * Detect DPI using CSS media queries with binary search
     */
    private detectDPIFromMediaQuery(): number {
        if (typeof window.matchMedia !== 'function') return 0;

        // 常见 DPI 值快速检测
        // Quick check for common DPI values
        const commonDPIs = [72, 96, 120, 144, 160, 192, 216, 240, 288, 300, 326, 400, 458];
        for (const dpi of commonDPIs) {
            if (window.matchMedia(`(resolution: ${dpi}dpi)`).matches) {
                return dpi;
            }
        }

        // 二分查找精确 DPI
        // Binary search for exact DPI
        let low = 50;
        let high = 500;

        while (high - low > 1) {
            const mid = Math.floor((low + high) / 2);
            if (window.matchMedia(`(min-resolution: ${mid}dpi)`).matches) {
                low = mid;
            } else {
                high = mid;
            }
        }

        return low;
    }

    /**
     * 使用临时元素测量 DPI
     * Detect DPI by measuring a temporary element
     */
    private detectDPIFromElement(): number {
        if (typeof document === 'undefined') return 0;

        try {
            // 创建一个 1 英寸的元素
            // Create a 1-inch element
            const div = document.createElement('div');
            div.style.cssText = 'position:absolute;left:-9999px;width:1in;height:1in;';
            document.body.appendChild(div);

            const dpi = div.offsetWidth;
            document.body.removeChild(div);

            // 验证结果合理性
            // Validate result is reasonable
            if (dpi >= 50 && dpi <= 600) {
                return dpi;
            }
        } catch {
            // 忽略错误
        }

        return 0;
    }

    /**
     * 获取当前屏幕信息
     * Get current screen info
     */
    public getScreenInfo(): Readonly<ScreenInfo> {
        return this.screenInfo;
    }

    /**
     * 获取当前缩放比例（从第一个 CanvasScaler 组件）
     * Get current scale (from first CanvasScaler component)
     */
    public getCurrentScale(): number {
        for (const entity of this.entities) {
            const scaler = entity.getComponent(UICanvasScalerComponent);
            if (scaler) {
                return scaler.computedScale;
            }
        }
        return 1;
    }

    /**
     * 获取当前安全区域内边距（从第一个 SafeArea 组件）
     * Get current safe area insets (from first SafeArea component)
     */
    public getCurrentSafeAreaInsets(): { top: number; right: number; bottom: number; left: number } {
        for (const entity of this.entities) {
            const safeArea = entity.getComponent(UISafeAreaComponent);
            if (safeArea) {
                return { ...safeArea.appliedInsets };
            }
        }
        return { top: 0, right: 0, bottom: 0, left: 0 };
    }

    protected process(entities: readonly Entity[]): void {
        // 检测屏幕尺寸变化
        // Detect screen size changes
        if (this.screenInfo.width !== this.lastScreenWidth ||
            this.screenInfo.height !== this.lastScreenHeight) {
            this.needsUpdate = true;
            this.lastScreenWidth = this.screenInfo.width;
            this.lastScreenHeight = this.screenInfo.height;
        }

        if (!this.needsUpdate) return;

        let finalCanvasWidth = this.screenInfo.width;
        let finalCanvasHeight = this.screenInfo.height;

        // 处理 CanvasScaler 组件
        // Process CanvasScaler components
        for (const entity of entities) {
            const scaler = entity.getComponent(UICanvasScalerComponent);
            if (scaler) {
                scaler.calculateScale(
                    this.screenInfo.width,
                    this.screenInfo.height,
                    this.screenInfo.dpi
                );

                finalCanvasWidth = scaler.computedCanvasWidth;
                finalCanvasHeight = scaler.computedCanvasHeight;
                // scaler.computedScale is stored in the component for other uses
                break; // 只使用第一个 CanvasScaler | Only use the first CanvasScaler
            }
        }

        // 处理 SafeArea 组件
        // Process SafeArea components
        for (const entity of entities) {
            const safeArea = entity.getComponent(UISafeAreaComponent);
            if (safeArea) {
                safeArea.update();
                // 安全区域已更新，UI 元素通过锚点适配
                // Safe area updated, UI elements adapt via anchors
            }
        }

        // 更新 UILayoutSystem 的画布尺寸
        // Update UILayoutSystem canvas size
        if (this.layoutSystem) {
            this.layoutSystem.setCanvasSize(finalCanvasWidth, finalCanvasHeight);
        }

        this.needsUpdate = false;
    }

    /**
     * 将屏幕坐标转换为画布坐标
     * Convert screen coordinates to canvas coordinates
     */
    public screenToCanvas(screenX: number, screenY: number): { x: number; y: number } {
        const scale = this.getCurrentScale();
        return {
            x: screenX / scale,
            y: screenY / scale
        };
    }

    /**
     * 将画布坐标转换为屏幕坐标
     * Convert canvas coordinates to screen coordinates
     */
    public canvasToScreen(canvasX: number, canvasY: number): { x: number; y: number } {
        const scale = this.getCurrentScale();
        return {
            x: canvasX * scale,
            y: canvasY * scale
        };
    }

    /**
     * 强制更新
     * Force update
     */
    public forceUpdate(): void {
        this.needsUpdate = true;
    }

    /**
     * 添加窗口大小变化监听器
     * Add window resize listener
     */
    public addResizeListener(): () => void {
        if (typeof window === 'undefined') return () => {};

        const handler = () => {
            this.detectScreenInfo();
        };

        window.addEventListener('resize', handler);
        window.addEventListener('orientationchange', handler);

        // 返回清理函数
        return () => {
            window.removeEventListener('resize', handler);
            window.removeEventListener('orientationchange', handler);
        };
    }
}
