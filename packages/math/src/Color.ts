/**
 * Color utility class for game engine
 * 游戏引擎颜色工具类
 *
 * Provides color conversion, manipulation, and packing utilities.
 * 提供颜色转换、操作和打包工具。
 */

/**
 * RGBA color components
 * RGBA 颜色分量
 */
export interface RGBA {
    r: number;
    g: number;
    b: number;
    a: number;
}

/**
 * HSL color components
 * HSL 颜色分量
 */
export interface HSL {
    h: number;
    s: number;
    l: number;
}

/**
 * Color class for color manipulation and conversion
 * 颜色类，用于颜色操作和转换
 */
export class Color {
    /** Red component (0-255) | 红色分量 (0-255) */
    public r: number;
    /** Green component (0-255) | 绿色分量 (0-255) */
    public g: number;
    /** Blue component (0-255) | 蓝色分量 (0-255) */
    public b: number;
    /** Alpha component (0-1) | 透明度分量 (0-1) */
    public a: number;

    // ===== Predefined Colors | 预定义颜色 =====

    /** White (0xFFFFFF) | 白色 */
    static readonly WHITE = new Color(255, 255, 255);
    /** Black (0x000000) | 黑色 */
    static readonly BLACK = new Color(0, 0, 0);
    /** Red (0xFF0000) | 红色 */
    static readonly RED = new Color(255, 0, 0);
    /** Green (0x00FF00) | 绿色 */
    static readonly GREEN = new Color(0, 255, 0);
    /** Blue (0x0000FF) | 蓝色 */
    static readonly BLUE = new Color(0, 0, 255);
    /** Yellow (0xFFFF00) | 黄色 */
    static readonly YELLOW = new Color(255, 255, 0);
    /** Cyan (0x00FFFF) | 青色 */
    static readonly CYAN = new Color(0, 255, 255);
    /** Magenta (0xFF00FF) | 品红色 */
    static readonly MAGENTA = new Color(255, 0, 255);
    /** Transparent (0x00000000) | 透明 */
    static readonly TRANSPARENT = new Color(0, 0, 0, 0);
    /** Gray (0x808080) | 灰色 */
    static readonly GRAY = new Color(128, 128, 128);

    /**
     * Create a new Color instance
     * 创建新的 Color 实例
     */
    constructor(r: number = 255, g: number = 255, b: number = 255, a: number = 1) {
        this.r = Math.round(Math.max(0, Math.min(255, r)));
        this.g = Math.round(Math.max(0, Math.min(255, g)));
        this.b = Math.round(Math.max(0, Math.min(255, b)));
        this.a = Math.max(0, Math.min(1, a));
    }

    // ===== Factory Methods | 工厂方法 =====

    /**
     * Create color from hex string
     * 从十六进制字符串创建颜色
     * @param hex Hex string (e.g., "#FF0000", "#F00", "FF0000") | 十六进制字符串
     * @param alpha Optional alpha value (0-1) | 可选的透明度值
     */
    static fromHex(hex: string, alpha: number = 1): Color {
        const { r, g, b } = Color.hexToRgb(hex);
        return new Color(r, g, b, alpha);
    }

    /**
     * Create color from packed uint32 (0xRRGGBB or 0xAARRGGBB)
     * 从打包的 uint32 创建颜色
     * @param value Packed color value | 打包的颜色值
     * @param hasAlpha Whether value includes alpha | 是否包含透明度
     */
    static fromUint32(value: number, hasAlpha: boolean = false): Color {
        if (hasAlpha) {
            const a = ((value >> 24) & 0xFF) / 255;
            const r = (value >> 16) & 0xFF;
            const g = (value >> 8) & 0xFF;
            const b = value & 0xFF;
            return new Color(r, g, b, a);
        } else {
            const r = (value >> 16) & 0xFF;
            const g = (value >> 8) & 0xFF;
            const b = value & 0xFF;
            return new Color(r, g, b);
        }
    }

    /**
     * Create color from HSL values
     * 从 HSL 值创建颜色
     * @param h Hue (0-360) | 色相
     * @param s Saturation (0-1) | 饱和度
     * @param l Lightness (0-1) | 亮度
     * @param a Alpha (0-1) | 透明度
     */
    static fromHSL(h: number, s: number, l: number, a: number = 1): Color {
        const { r, g, b } = Color.hslToRgb(h, s, l);
        return new Color(r, g, b, a);
    }

    /**
     * Create color from normalized float values (0-1)
     * 从归一化浮点值创建颜色 (0-1)
     */
    static fromFloat(r: number, g: number, b: number, a: number = 1): Color {
        return new Color(r * 255, g * 255, b * 255, a);
    }

    // ===== Conversion Methods | 转换方法 =====

    /**
     * Convert hex string to RGB
     * 将十六进制字符串转换为 RGB
     */
    static hexToRgb(hex: string): { r: number; g: number; b: number } {
        const colorHex = hex.replace('#', '');

        let r = 255, g = 255, b = 255;

        if (colorHex.length === 6) {
            r = parseInt(colorHex.substring(0, 2), 16);
            g = parseInt(colorHex.substring(2, 4), 16);
            b = parseInt(colorHex.substring(4, 6), 16);
        } else if (colorHex.length === 3) {
            r = parseInt(colorHex[0] + colorHex[0], 16);
            g = parseInt(colorHex[1] + colorHex[1], 16);
            b = parseInt(colorHex[2] + colorHex[2], 16);
        } else if (colorHex.length === 8) {
            // AARRGGBB format
            r = parseInt(colorHex.substring(2, 4), 16);
            g = parseInt(colorHex.substring(4, 6), 16);
            b = parseInt(colorHex.substring(6, 8), 16);
        }

        return { r, g, b };
    }

    /**
     * Convert RGB to hex string
     * 将 RGB 转换为十六进制字符串
     */
    static rgbToHex(r: number, g: number, b: number): string {
        const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    /**
     * Convert HSL to RGB
     * 将 HSL 转换为 RGB
     */
    static hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
        h = ((h % 360) + 360) % 360 / 360;
        s = Math.max(0, Math.min(1, s));
        l = Math.max(0, Math.min(1, l));

        let r: number, g: number, b: number;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p: number, q: number, t: number) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    /**
     * Convert RGB to HSL
     * 将 RGB 转换为 HSL
     */
    static rgbToHsl(r: number, g: number, b: number): HSL {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0;
        let s = 0;
        const l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r:
                    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                    break;
                case g:
                    h = ((b - r) / d + 2) / 6;
                    break;
                case b:
                    h = ((r - g) / d + 4) / 6;
                    break;
            }
        }

        return { h: h * 360, s, l };
    }

    // ===== Packing Methods | 打包方法 =====

    /**
     * Pack color to uint32 (0xRRGGBB)
     * 打包颜色为 uint32 (0xRRGGBB)
     */
    static packRGB(r: number, g: number, b: number): number {
        return ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF);
    }

    /**
     * Pack color to uint32 (0xAARRGGBB)
     * 打包颜色为 uint32 (0xAARRGGBB)
     */
    static packARGB(r: number, g: number, b: number, a: number): number {
        const alpha = Math.round(a * 255);
        return ((alpha & 0xFF) << 24) | ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF);
    }

    /**
     * Pack color to uint32 for WebGL (0xAABBGGRR)
     * 打包颜色为 WebGL 格式的 uint32 (0xAABBGGRR)
     */
    static packABGR(r: number, g: number, b: number, a: number): number {
        const alpha = Math.round(a * 255);
        return ((alpha & 0xFF) << 24) | ((b & 0xFF) << 16) | ((g & 0xFF) << 8) | (r & 0xFF);
    }

    /**
     * Pack hex string and alpha to WebGL uint32 (0xAABBGGRR)
     * 将十六进制字符串和透明度打包为 WebGL 格式 uint32
     */
    static packHexAlpha(hex: string, alpha: number): number {
        const { r, g, b } = Color.hexToRgb(hex);
        return Color.packABGR(r, g, b, alpha);
    }

    /**
     * Unpack uint32 to RGBA (assumes 0xAARRGGBB)
     * 解包 uint32 为 RGBA (假设格式为 0xAARRGGBB)
     */
    static unpackARGB(value: number): RGBA {
        return {
            a: ((value >> 24) & 0xFF) / 255,
            r: (value >> 16) & 0xFF,
            g: (value >> 8) & 0xFF,
            b: value & 0xFF
        };
    }

    /**
     * Unpack uint32 to RGBA (assumes 0xAABBGGRR - WebGL format)
     * 解包 uint32 为 RGBA (假设格式为 0xAABBGGRR - WebGL 格式)
     */
    static unpackABGR(value: number): RGBA {
        return {
            a: ((value >> 24) & 0xFF) / 255,
            b: (value >> 16) & 0xFF,
            g: (value >> 8) & 0xFF,
            r: value & 0xFF
        };
    }

    // ===== Color Operations | 颜色操作 =====

    /**
     * Interpolate between two colors
     * 在两个颜色之间插值
     */
    static lerp(from: Color, to: Color, t: number): Color {
        t = Math.max(0, Math.min(1, t));
        return new Color(
            from.r + (to.r - from.r) * t,
            from.g + (to.g - from.g) * t,
            from.b + (to.b - from.b) * t,
            from.a + (to.a - from.a) * t
        );
    }

    /**
     * Interpolate between two packed uint32 colors (0xRRGGBB)
     * 在两个打包的 uint32 颜色之间插值
     */
    static lerpUint32(from: number, to: number, t: number): number {
        t = Math.max(0, Math.min(1, t));
        const fromR = (from >> 16) & 0xFF;
        const fromG = (from >> 8) & 0xFF;
        const fromB = from & 0xFF;
        const toR = (to >> 16) & 0xFF;
        const toG = (to >> 8) & 0xFF;
        const toB = to & 0xFF;

        const r = Math.round(fromR + (toR - fromR) * t);
        const g = Math.round(fromG + (toG - fromG) * t);
        const b = Math.round(fromB + (toB - fromB) * t);

        return (r << 16) | (g << 8) | b;
    }

    /**
     * Mix two colors
     * 混合两个颜色
     */
    static mix(color1: Color, color2: Color, ratio: number = 0.5): Color {
        return Color.lerp(color1, color2, ratio);
    }

    /**
     * Lighten a color
     * 使颜色变亮
     */
    static lighten(color: Color, amount: number): Color {
        const hsl = Color.rgbToHsl(color.r, color.g, color.b);
        hsl.l = Math.min(1, hsl.l + amount);
        const rgb = Color.hslToRgb(hsl.h, hsl.s, hsl.l);
        return new Color(rgb.r, rgb.g, rgb.b, color.a);
    }

    /**
     * Darken a color
     * 使颜色变暗
     */
    static darken(color: Color, amount: number): Color {
        const hsl = Color.rgbToHsl(color.r, color.g, color.b);
        hsl.l = Math.max(0, hsl.l - amount);
        const rgb = Color.hslToRgb(hsl.h, hsl.s, hsl.l);
        return new Color(rgb.r, rgb.g, rgb.b, color.a);
    }

    /**
     * Saturate a color
     * 增加颜色饱和度
     */
    static saturate(color: Color, amount: number): Color {
        const hsl = Color.rgbToHsl(color.r, color.g, color.b);
        hsl.s = Math.min(1, hsl.s + amount);
        const rgb = Color.hslToRgb(hsl.h, hsl.s, hsl.l);
        return new Color(rgb.r, rgb.g, rgb.b, color.a);
    }

    /**
     * Desaturate a color
     * 降低颜色饱和度
     */
    static desaturate(color: Color, amount: number): Color {
        const hsl = Color.rgbToHsl(color.r, color.g, color.b);
        hsl.s = Math.max(0, hsl.s - amount);
        const rgb = Color.hslToRgb(hsl.h, hsl.s, hsl.l);
        return new Color(rgb.r, rgb.g, rgb.b, color.a);
    }

    /**
     * Invert a color
     * 反转颜色
     */
    static invert(color: Color): Color {
        return new Color(255 - color.r, 255 - color.g, 255 - color.b, color.a);
    }

    /**
     * Convert color to grayscale
     * 将颜色转换为灰度
     */
    static grayscale(color: Color): Color {
        const gray = Math.round(0.299 * color.r + 0.587 * color.g + 0.114 * color.b);
        return new Color(gray, gray, gray, color.a);
    }

    /**
     * Get color luminance (perceived brightness)
     * 获取颜色亮度（感知亮度）
     */
    static luminance(color: Color): number {
        return (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255;
    }

    /**
     * Get contrast ratio between two colors
     * 获取两个颜色之间的对比度
     */
    static contrastRatio(color1: Color, color2: Color): number {
        const l1 = Color.luminance(color1);
        const l2 = Color.luminance(color2);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    // ===== Instance Methods | 实例方法 =====

    /**
     * Convert to hex string
     * 转换为十六进制字符串
     */
    toHex(): string {
        return Color.rgbToHex(this.r, this.g, this.b);
    }

    /**
     * Convert to hex string with alpha
     * 转换为带透明度的十六进制字符串
     */
    toHexAlpha(): string {
        const alphaHex = Math.round(this.a * 255).toString(16).padStart(2, '0');
        return `#${alphaHex}${this.toHex().slice(1)}`;
    }

    /**
     * Convert to CSS rgba string
     * 转换为 CSS rgba 字符串
     */
    toRgba(): string {
        return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
    }

    /**
     * Convert to CSS rgb string
     * 转换为 CSS rgb 字符串
     */
    toRgb(): string {
        return `rgb(${this.r}, ${this.g}, ${this.b})`;
    }

    /**
     * Convert to HSL
     * 转换为 HSL
     */
    toHSL(): HSL {
        return Color.rgbToHsl(this.r, this.g, this.b);
    }

    /**
     * Pack to uint32 (0xRRGGBB)
     * 打包为 uint32 (0xRRGGBB)
     */
    toUint32(): number {
        return Color.packRGB(this.r, this.g, this.b);
    }

    /**
     * Pack to uint32 with alpha (0xAARRGGBB)
     * 打包为带透明度的 uint32 (0xAARRGGBB)
     */
    toUint32Alpha(): number {
        return Color.packARGB(this.r, this.g, this.b, this.a);
    }

    /**
     * Pack to WebGL uint32 (0xAABBGGRR)
     * 打包为 WebGL 格式 uint32 (0xAABBGGRR)
     */
    toWebGL(): number {
        return Color.packABGR(this.r, this.g, this.b, this.a);
    }

    /**
     * Get normalized float array [r, g, b, a] (0-1)
     * 获取归一化浮点数组 [r, g, b, a] (0-1)
     */
    toFloatArray(): [number, number, number, number] {
        return [this.r / 255, this.g / 255, this.b / 255, this.a];
    }

    /**
     * Clone this color
     * 克隆此颜色
     */
    clone(): Color {
        return new Color(this.r, this.g, this.b, this.a);
    }

    /**
     * Set color values
     * 设置颜色值
     */
    set(r: number, g: number, b: number, a?: number): this {
        this.r = Math.round(Math.max(0, Math.min(255, r)));
        this.g = Math.round(Math.max(0, Math.min(255, g)));
        this.b = Math.round(Math.max(0, Math.min(255, b)));
        if (a !== undefined) {
            this.a = Math.max(0, Math.min(1, a));
        }
        return this;
    }

    /**
     * Copy from another color
     * 从另一个颜色复制
     */
    copy(other: Color): this {
        this.r = other.r;
        this.g = other.g;
        this.b = other.b;
        this.a = other.a;
        return this;
    }

    /**
     * Check equality with another color
     * 检查与另一个颜色是否相等
     */
    equals(other: Color): boolean {
        return this.r === other.r && this.g === other.g && this.b === other.b && this.a === other.a;
    }

    /**
     * String representation
     * 字符串表示
     */
    toString(): string {
        return `Color(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
    }
}
