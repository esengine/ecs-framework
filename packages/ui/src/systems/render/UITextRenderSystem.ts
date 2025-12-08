/**
 * UI Text Render System
 * UI 文本渲染系统
 *
 * Renders UITextComponent entities by generating text textures
 * and submitting them to the shared UIRenderCollector.
 * 通过生成文本纹理并提交到共享的 UIRenderCollector 来渲染 UITextComponent 实体。
 */

import { EntitySystem, Matcher, Entity, ECSSystem } from '@esengine/ecs-framework';
import { UITransformComponent } from '../../components/UITransformComponent';
import { UITextComponent } from '../../components/UITextComponent';
import { getUIRenderCollector, registerCacheInvalidationCallback, unregisterCacheInvalidationCallback } from './UIRenderCollector';

/**
 * Text texture cache entry
 * 文本纹理缓存条目
 */
interface TextTextureCache {
    textureId: number;
    text: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: string | number;
    italic: boolean;
    color: number;
    alpha: number;
    align: string;
    verticalAlign: string;
    lineHeight: number;
    width: number;
    height: number;
    dataUrl: string;
}

/**
 * UI Text Render System
 * UI 文本渲染系统
 *
 * Handles rendering of text components by:
 * 1. Generating text textures using Canvas 2D
 * 2. Caching textures to avoid regeneration every frame
 * 3. Submitting texture render primitives to the collector
 *
 * 处理文本组件的渲染：
 * 1. 使用 Canvas 2D 生成文本纹理
 * 2. 缓存纹理以避免每帧重新生成
 * 3. 向收集器提交纹理渲染原语
 */
@ECSSystem('UITextRender', { updateOrder: 120 })
export class UITextRenderSystem extends EntitySystem {
    private textCanvas: HTMLCanvasElement | null = null;
    private textCtx: CanvasRenderingContext2D | null = null;
    private textTextureCache: Map<number, TextTextureCache> = new Map();
    private nextTextureId = 90000;
    private onTextureCreated: ((id: number, dataUrl: string) => void) | null = null;
    private cacheInvalidationBound: () => void;

    constructor() {
        super(Matcher.empty().all(UITransformComponent, UITextComponent));
        // Bind the method for cache invalidation callback
        this.cacheInvalidationBound = this.clearTextCache.bind(this);
    }

    /**
     * Called when system is added to scene
     * 系统添加到场景时调用
     */
    public override initialize(): void {
        super.initialize();
        // Register for cache invalidation events
        registerCacheInvalidationCallback(this.cacheInvalidationBound);
    }

    /**
     * Called when system is destroyed
     * 系统销毁时调用
     */
    protected override onDestroy(): void {
        super.onDestroy();
        // Unregister cache invalidation callback
        unregisterCacheInvalidationCallback(this.cacheInvalidationBound);
    }

    /**
     * Set callback for when a new text texture is created
     * 设置创建新文本纹理时的回调
     */
    setTextureCallback(callback: (id: number, dataUrl: string) => void): void {
        this.onTextureCreated = callback;
    }

    protected process(entities: readonly Entity[]): void {
        const collector = getUIRenderCollector();

        for (const entity of entities) {
            const transform = entity.getComponent(UITransformComponent)!;
            const text = entity.getComponent(UITextComponent)!;

            if (!transform.visible || !text.text) continue;

            const x = transform.worldX ?? transform.x;
            const y = transform.worldY ?? transform.y;
            // 使用世界缩放和旋转
            const scaleX = transform.worldScaleX ?? transform.scaleX;
            const scaleY = transform.worldScaleY ?? transform.scaleY;
            const rotation = transform.worldRotation ?? transform.rotation;
            const width = (transform.computedWidth ?? transform.width) * scaleX;
            const height = (transform.computedHeight ?? transform.height) * scaleY;
            const alpha = transform.worldAlpha ?? transform.alpha;
            const baseOrder = 100 + transform.zIndex;
            // 使用 transform 的 pivot 作为旋转/缩放中心
            const pivotX = transform.pivotX;
            const pivotY = transform.pivotY;
            // 渲染位置 = 左下角 + pivot 偏移
            const renderX = x + width * pivotX;
            const renderY = y + height * pivotY;

            // Generate or retrieve cached texture
            // 生成或获取缓存的纹理
            const textureId = this.getOrCreateTextTexture(
                entity.id, text, Math.ceil(width), Math.ceil(height)
            );

            if (textureId === null) continue;

            // Use pivot position with transform's pivot values
            // 使用 transform 的 pivot 值作为旋转中心
            collector.addRect(
                renderX, renderY,
                width, height,
                0xFFFFFF,  // White tint (color is baked into texture)
                alpha,
                baseOrder + 1,  // Text renders above background
                {
                    rotation,
                    pivotX,
                    pivotY,
                    textureId
                }
            );
        }
    }

    /**
     * Get or create text texture
     * 获取或创建文本纹理
     */
    private getOrCreateTextTexture(
        entityId: number,
        text: UITextComponent,
        width: number,
        height: number
    ): number | null {
        const canvasData = this.getTextCanvas();
        if (!canvasData) return null;

        const { canvas, ctx } = canvasData;

        const cached = this.textTextureCache.get(entityId);

        // Check if we need to regenerate the texture
        // 检查是否需要重新生成纹理
        const needsUpdate = !cached ||
            cached.text !== text.text ||
            cached.fontSize !== text.fontSize ||
            cached.fontFamily !== text.fontFamily ||
            cached.fontWeight !== text.fontWeight ||
            cached.italic !== text.italic ||
            cached.color !== text.color ||
            cached.alpha !== text.alpha ||
            cached.align !== text.align ||
            cached.verticalAlign !== text.verticalAlign ||
            cached.lineHeight !== text.lineHeight ||
            cached.width !== width ||
            cached.height !== height;

        if (needsUpdate) {
            const canvasWidth = Math.max(1, width);
            const canvasHeight = Math.max(1, height);

            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            ctx.font = text.getCSSFont();
            ctx.fillStyle = text.getCSSColor();
            ctx.textBaseline = 'top';

            // Handle horizontal alignment
            // 处理水平对齐
            let textX = 0;
            if (text.align === 'center') {
                ctx.textAlign = 'center';
                textX = canvasWidth / 2;
            } else if (text.align === 'right') {
                ctx.textAlign = 'right';
                textX = canvasWidth;
            } else {
                ctx.textAlign = 'left';
                textX = 0;
            }

            // Handle vertical alignment
            // 处理垂直对齐
            const textHeight = text.fontSize * text.lineHeight;
            let textY = 0;

            if (text.verticalAlign === 'middle') {
                textY = (canvasHeight - textHeight) / 2;
            } else if (text.verticalAlign === 'bottom') {
                textY = canvasHeight - textHeight;
            }

            // Draw text (with or without word wrap)
            // 绘制文本（带或不带自动换行）
            if (text.wordWrap) {
                this.drawWrappedText(ctx, text.text, textX, textY, canvasWidth, text.fontSize * text.lineHeight);
            } else {
                ctx.fillText(text.text, textX, textY);
            }

            // Get or create texture ID
            // 获取或创建纹理 ID
            const textureId = cached?.textureId ?? this.nextTextureId++;

            const dataUrl = canvas.toDataURL('image/png');

            // Notify callback of new texture
            // 通知回调新纹理
            if (this.onTextureCreated) {
                this.onTextureCreated(textureId, dataUrl);
            }

            // Update cache
            // 更新缓存
            this.textTextureCache.set(entityId, {
                textureId,
                text: text.text,
                fontSize: text.fontSize,
                fontFamily: text.fontFamily,
                fontWeight: text.fontWeight,
                italic: text.italic,
                color: text.color,
                alpha: text.alpha,
                align: text.align,
                verticalAlign: text.verticalAlign,
                lineHeight: text.lineHeight,
                width,
                height,
                dataUrl
            });
        }

        return this.textTextureCache.get(entityId)?.textureId ?? null;
    }

    /**
     * Get or create text canvas
     * 获取或创建文本画布
     */
    private getTextCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
        if (!this.textCanvas) {
            this.textCanvas = document.createElement('canvas');
            this.textCtx = this.textCanvas.getContext('2d');
        }
        if (!this.textCtx) return null;
        return { canvas: this.textCanvas, ctx: this.textCtx };
    }

    /**
     * Draw text with word wrapping
     * 绘制带自动换行的文本
     */
    private drawWrappedText(
        ctx: CanvasRenderingContext2D,
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        lineHeight: number
    ): void {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for (const word of words) {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && line !== '') {
                ctx.fillText(line.trim(), x, currentY);
                line = word + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }

        if (line.trim()) {
            ctx.fillText(line.trim(), x, currentY);
        }
    }

    /**
     * Clear text texture cache
     * 清除文本纹理缓存
     */
    clearTextCache(): void {
        this.textTextureCache.clear();
    }

    /**
     * Clear cache for a specific entity
     * 清除特定实体的缓存
     */
    clearEntityTextCache(entityId: number): void {
        this.textTextureCache.delete(entityId);
    }

    /**
     * Dispose resources
     * 释放资源
     */
    dispose(): void {
        this.textCanvas = null;
        this.textCtx = null;
        this.textTextureCache.clear();
        this.onTextureCreated = null;
    }
}
