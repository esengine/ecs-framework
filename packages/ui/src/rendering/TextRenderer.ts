/**
 * 文本渲染器
 * Text Renderer - Renders text to textures for WebGL
 *
 * 使用 Canvas 2D API 渲染文本到纹理
 * Uses Canvas 2D API to render text to textures
 */

export interface TextMeasurement {
    width: number;
    height: number;
    lines: string[];
    lineHeights: number[];
}

export interface TextRenderOptions {
    fontSize: number;
    fontFamily: string;
    fontWeight: string | number;
    italic: boolean;
    color: number;
    alpha: number;
    align: 'left' | 'center' | 'right';
    verticalAlign: 'top' | 'middle' | 'bottom';
    wordWrap: boolean;
    wrapWidth: number;
    lineHeight: number;
    letterSpacing: number;
    strokeWidth: number;
    strokeColor: number;
    shadowEnabled: boolean;
    shadowOffsetX: number;
    shadowOffsetY: number;
    shadowColor: number;
    shadowAlpha: number;
}

export class TextRenderer {
    private gl: WebGLRenderingContext;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private textureCache: Map<string, WebGLTexture> = new Map();

    constructor(gl: WebGLRenderingContext) {
        this.gl = gl;

        // 创建离屏 Canvas
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d')!;
    }

    /**
     * 测量文本尺寸
     * Measure text dimensions
     */
    public measureText(text: string, options: Partial<TextRenderOptions>): TextMeasurement {
        const opts = this.getDefaultOptions(options);
        this.setupContext(opts);

        let lines: string[];
        if (opts.wordWrap && opts.wrapWidth > 0) {
            lines = this.wrapText(text, opts.wrapWidth);
        } else {
            lines = text.split('\n');
        }

        const lineHeight = opts.fontSize * opts.lineHeight;
        let maxWidth = 0;

        for (const line of lines) {
            const metrics = this.ctx.measureText(line);
            maxWidth = Math.max(maxWidth, metrics.width);
        }

        return {
            width: maxWidth,
            height: lines.length * lineHeight,
            lines,
            lineHeights: lines.map(() => lineHeight)
        };
    }

    /**
     * 渲染文本到纹理
     * Render text to texture
     */
    public renderToTexture(
        text: string,
        options: Partial<TextRenderOptions>,
        width?: number,
        height?: number
    ): WebGLTexture | null {
        const opts = this.getDefaultOptions(options);
        const measurement = this.measureText(text, options);

        // 使用指定尺寸或测量尺寸
        const canvasWidth = Math.ceil(width ?? measurement.width) + opts.strokeWidth * 2;
        const canvasHeight = Math.ceil(height ?? measurement.height) + opts.strokeWidth * 2;

        if (canvasWidth <= 0 || canvasHeight <= 0) return null;

        // 调整 Canvas 尺寸
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;

        // 清除背景
        this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // 设置绘制样式
        this.setupContext(opts);

        // 计算起始位置
        const lineHeight = opts.fontSize * opts.lineHeight;
        let startY = opts.strokeWidth;

        if (opts.verticalAlign === 'middle') {
            startY = (canvasHeight - measurement.height) / 2;
        } else if (opts.verticalAlign === 'bottom') {
            startY = canvasHeight - measurement.height - opts.strokeWidth;
        }

        // 绘制每行
        for (let i = 0; i < measurement.lines.length; i++) {
            const line = measurement.lines[i]!;
            let x = opts.strokeWidth;

            if (opts.align === 'center') {
                const lineWidth = this.ctx.measureText(line).width;
                x = (canvasWidth - lineWidth) / 2;
            } else if (opts.align === 'right') {
                const lineWidth = this.ctx.measureText(line).width;
                x = canvasWidth - lineWidth - opts.strokeWidth;
            }

            const y = startY + (i + 0.8) * lineHeight;

            // 绘制阴影
            if (opts.shadowEnabled) {
                this.ctx.save();
                this.ctx.fillStyle = this.colorToCSS(opts.shadowColor, opts.shadowAlpha);
                this.ctx.fillText(line, x + opts.shadowOffsetX, y + opts.shadowOffsetY);
                this.ctx.restore();
            }

            // 绘制描边
            if (opts.strokeWidth > 0) {
                this.ctx.strokeStyle = this.colorToCSS(opts.strokeColor, opts.alpha);
                this.ctx.lineWidth = opts.strokeWidth;
                this.ctx.strokeText(line, x, y);
            }

            // 绘制文本
            this.ctx.fillStyle = this.colorToCSS(opts.color, opts.alpha);
            this.ctx.fillText(line, x, y);
        }

        // 创建纹理
        return this.createTextureFromCanvas();
    }

    /**
     * 从缓存获取或创建纹理
     * Get from cache or create texture
     */
    public getOrCreateTexture(
        text: string,
        options: Partial<TextRenderOptions>,
        width?: number,
        height?: number
    ): WebGLTexture | null {
        const cacheKey = this.getCacheKey(text, options, width, height);

        if (this.textureCache.has(cacheKey)) {
            return this.textureCache.get(cacheKey)!;
        }

        const texture = this.renderToTexture(text, options, width, height);
        if (texture) {
            this.textureCache.set(cacheKey, texture);
        }

        return texture;
    }

    /**
     * 清除纹理缓存
     * Clear texture cache
     */
    public clearCache(): void {
        for (const texture of this.textureCache.values()) {
            this.gl.deleteTexture(texture);
        }
        this.textureCache.clear();
    }

    /**
     * 从缓存移除指定纹理
     * Remove specific texture from cache
     */
    public invalidateCache(text: string, options: Partial<TextRenderOptions>): void {
        const cacheKey = this.getCacheKey(text, options);
        const texture = this.textureCache.get(cacheKey);
        if (texture) {
            this.gl.deleteTexture(texture);
            this.textureCache.delete(cacheKey);
        }
    }

    private getDefaultOptions(options: Partial<TextRenderOptions>): TextRenderOptions {
        return {
            fontSize: options.fontSize ?? 14,
            fontFamily: options.fontFamily ?? 'Arial, sans-serif',
            fontWeight: options.fontWeight ?? 'normal',
            italic: options.italic ?? false,
            color: options.color ?? 0x000000,
            alpha: options.alpha ?? 1,
            align: options.align ?? 'left',
            verticalAlign: options.verticalAlign ?? 'top',
            wordWrap: options.wordWrap ?? false,
            wrapWidth: options.wrapWidth ?? 0,
            lineHeight: options.lineHeight ?? 1.2,
            letterSpacing: options.letterSpacing ?? 0,
            strokeWidth: options.strokeWidth ?? 0,
            strokeColor: options.strokeColor ?? 0x000000,
            shadowEnabled: options.shadowEnabled ?? false,
            shadowOffsetX: options.shadowOffsetX ?? 1,
            shadowOffsetY: options.shadowOffsetY ?? 1,
            shadowColor: options.shadowColor ?? 0x000000,
            shadowAlpha: options.shadowAlpha ?? 0.5
        };
    }

    private setupContext(opts: TextRenderOptions): void {
        const style = opts.italic ? 'italic ' : '';
        const weight = opts.fontWeight;
        this.ctx.font = `${style}${weight} ${opts.fontSize}px ${opts.fontFamily}`;
        this.ctx.textBaseline = 'top';
    }

    private wrapText(text: string, maxWidth: number): string[] {
        const lines: string[] = [];
        const paragraphs = text.split('\n');

        for (const paragraph of paragraphs) {
            const words = paragraph.split(' ');
            let currentLine = '';

            for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                const metrics = this.ctx.measureText(testLine);

                if (metrics.width > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }

            if (currentLine) {
                lines.push(currentLine);
            }
        }

        return lines;
    }

    private colorToCSS(color: number, alpha: number): string {
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    private createTextureFromCanvas(): WebGLTexture | null {
        const gl = this.gl;
        const texture = gl.createTexture();
        if (!texture) return null;

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.canvas);

        // 设置纹理参数
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        return texture;
    }

    private getCacheKey(text: string, options: Partial<TextRenderOptions>, width?: number, height?: number): string {
        return JSON.stringify({ text, options, width, height });
    }

    public dispose(): void {
        this.clearCache();
    }
}
