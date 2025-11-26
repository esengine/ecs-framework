import { Core, Entity } from '@esengine/ecs-framework';
import { UITransformComponent } from '../components/UITransformComponent';
import { UIRenderComponent } from '../components/UIRenderComponent';
import { UITextComponent } from '../components/UITextComponent';
import { UIButtonComponent } from '../components/widgets/UIButtonComponent';

export interface UIRenderData {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    originX: number;
    originY: number;
    backgroundColor: number;
    backgroundAlpha: number;
    borderColor: number;
    borderWidth: number;
    cornerRadius: number;
    zIndex: number;
    visible: boolean;
    text?: {
        content: string;
        fontSize: number;
        fontFamily: string;
        color: number;
        alpha: number;
        align: string;
        verticalAlign: string;
    };
}

export interface ProviderRenderData {
    transforms: Float32Array;
    textureIds: Uint32Array;
    uvs: Float32Array;
    colors: Uint32Array;
    tileCount: number;
    sortingOrder: number;
    texturePath?: string;
}

export interface IRenderDataProvider {
    getRenderData(): readonly ProviderRenderData[];
}

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

export class UIRenderDataProvider implements IRenderDataProvider {
    private textCanvas: HTMLCanvasElement | null = null;
    private textCtx: CanvasRenderingContext2D | null = null;
    private textTextureCache: Map<number, TextTextureCache> = new Map();
    private nextTextureId = 90000;
    private onTextureCreated: ((id: number, dataUrl: string) => void) | null = null;

    setTextureCallback(callback: (id: number, dataUrl: string) => void): void {
        this.onTextureCreated = callback;
    }

    private getTextCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
        if (!this.textCanvas) {
            this.textCanvas = document.createElement('canvas');
            this.textCtx = this.textCanvas.getContext('2d');
        }
        if (!this.textCtx) return null;
        return { canvas: this.textCanvas, ctx: this.textCtx };
    }

    getRenderData(): readonly ProviderRenderData[] {
        const scene = Core.scene;
        if (!scene) return [];

        const uiEntities: Entity[] = [];
        for (const entity of scene.entities.buffer) {
            if (entity.hasComponent(UITransformComponent)) {
                uiEntities.push(entity);
            }
        }

        if (uiEntities.length === 0) return [];

        uiEntities.sort((a, b) => {
            const ta = a.getComponent(UITransformComponent);
            const tb = b.getComponent(UITransformComponent);
            return (ta?.zIndex ?? 0) - (tb?.zIndex ?? 0);
        });

        const renderDataList: ProviderRenderData[] = [];

        for (const entity of uiEntities) {
            const transform = entity.getComponent(UITransformComponent);
            const render = entity.getComponent(UIRenderComponent);
            const text = entity.getComponent(UITextComponent);
            const button = entity.getComponent(UIButtonComponent);

            if (!transform || !transform.visible) continue;

            const width = transform.width * transform.scaleX;
            const height = transform.height * transform.scaleY;
            const centerX = transform.x + width * transform.pivotX;
            const centerY = transform.y + height * transform.pivotY;

            // Button with texture support
            if (button && button.useTexture()) {
                const texture = button.getStateTexture('normal');
                if (texture) {
                    const transforms = new Float32Array(7);
                    transforms[0] = centerX;
                    transforms[1] = centerY;
                    transforms[2] = transform.rotation;
                    transforms[3] = width;
                    transforms[4] = height;
                    transforms[5] = transform.pivotX;
                    transforms[6] = transform.pivotY;

                    const colors = new Uint32Array(1);
                    const a = Math.round(transform.alpha * 255);
                    colors[0] = ((a & 0xFF) << 24) | (0xFF << 16) | (0xFF << 8) | 0xFF;

                    renderDataList.push({
                        transforms,
                        textureIds: new Uint32Array([0]),
                        uvs: new Float32Array([0, 0, 1, 1]),
                        colors,
                        tileCount: 1,
                        sortingOrder: 100 + transform.zIndex,
                        texturePath: texture
                    });
                }
            }

            // Background color rendering (for buttons in 'color' or 'both' mode, or regular UI elements)
            const shouldRenderColor = button
                ? button.useColor() && render && render.backgroundAlpha > 0
                : render && render.backgroundAlpha > 0;

            if (shouldRenderColor && render) {
                const transforms = new Float32Array(7);
                transforms[0] = centerX;
                transforms[1] = centerY;
                transforms[2] = transform.rotation;
                transforms[3] = width;
                transforms[4] = height;
                transforms[5] = transform.pivotX;
                transforms[6] = transform.pivotY;

                const colors = new Uint32Array(1);
                const bgColor = button ? button.currentColor : render.backgroundColor;
                const r = (bgColor >> 16) & 0xFF;
                const g = (bgColor >> 8) & 0xFF;
                const b = bgColor & 0xFF;
                const a = Math.round(render.backgroundAlpha * transform.alpha * 255);
                colors[0] = ((a & 0xFF) << 24) | ((b & 0xFF) << 16) | ((g & 0xFF) << 8) | (r & 0xFF);

                renderDataList.push({
                    transforms,
                    textureIds: new Uint32Array([0]),
                    uvs: new Float32Array([0, 0, 1, 1]),
                    colors,
                    tileCount: 1,
                    sortingOrder: 100 + transform.zIndex
                });
            }

            if (text && text.text) {
                const textRenderData = this.createTextRenderData(
                    entity.id,
                    text,
                    centerX,
                    centerY,
                    width,
                    height,
                    transform
                );
                if (textRenderData) {
                    renderDataList.push(textRenderData);
                }
            }
        }

        return renderDataList;
    }

    private createTextRenderData(
        entityId: number,
        text: UITextComponent,
        centerX: number,
        centerY: number,
        width: number,
        height: number,
        transform: UITransformComponent
    ): ProviderRenderData | null {
        const canvasData = this.getTextCanvas();
        if (!canvasData) return null;

        const { canvas, ctx } = canvasData;

        const cacheKey = entityId;
        const cached = this.textTextureCache.get(cacheKey);

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
            cached.width !== Math.ceil(width) ||
            cached.height !== Math.ceil(height);

        if (needsUpdate) {
            const canvasWidth = Math.max(1, Math.ceil(width));
            const canvasHeight = Math.max(1, Math.ceil(height));

            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            ctx.font = text.getCSSFont();
            ctx.fillStyle = text.getCSSColor();
            ctx.textBaseline = 'top';

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

            const metrics = ctx.measureText(text.text);
            const textHeight = text.fontSize * text.lineHeight;
            let textY = 0;

            if (text.verticalAlign === 'middle') {
                textY = (canvasHeight - textHeight) / 2;
            } else if (text.verticalAlign === 'bottom') {
                textY = canvasHeight - textHeight;
            }

            if (text.wordWrap) {
                this.drawWrappedText(ctx, text.text, textX, textY, canvasWidth, text.fontSize * text.lineHeight);
            } else {
                ctx.fillText(text.text, textX, textY);
            }

            const textureId = cached?.textureId ?? this.nextTextureId++;

            const dataUrl = canvas.toDataURL('image/png');

            if (this.onTextureCreated) {
                this.onTextureCreated(textureId, dataUrl);
            }

            this.textTextureCache.set(cacheKey, {
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
                width: canvasWidth,
                height: canvasHeight,
                dataUrl
            });
        }

        const cachedData = this.textTextureCache.get(cacheKey);
        if (!cachedData) return null;

        const transforms = new Float32Array(7);
        transforms[0] = centerX;
        transforms[1] = centerY;
        transforms[2] = transform.rotation;
        transforms[3] = width;
        transforms[4] = height;
        transforms[5] = transform.pivotX;
        transforms[6] = transform.pivotY;

        const colors = new Uint32Array(1);
        const a = Math.round(transform.alpha * 255);
        colors[0] = ((a & 0xFF) << 24) | (0xFF << 16) | (0xFF << 8) | 0xFF;

        return {
            transforms,
            textureIds: new Uint32Array([cachedData.textureId]),
            uvs: new Float32Array([0, 0, 1, 1]),
            colors,
            tileCount: 1,
            sortingOrder: 101 + transform.zIndex
        };
    }

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

    collectUIRenderData(): UIRenderData[] {
        const scene = Core.scene;
        if (!scene) return [];

        const result: UIRenderData[] = [];

        for (const entity of scene.entities.buffer) {
            const transform = entity.getComponent(UITransformComponent);
            if (!transform || !transform.visible) continue;

            const render = entity.getComponent(UIRenderComponent);
            const text = entity.getComponent(UITextComponent);

            const data: UIRenderData = {
                x: transform.x,
                y: transform.y,
                width: transform.width * transform.scaleX,
                height: transform.height * transform.scaleY,
                rotation: transform.rotation,
                originX: transform.pivotX,
                originY: transform.pivotY,
                backgroundColor: render?.backgroundColor ?? 0,
                backgroundAlpha: (render?.backgroundAlpha ?? 0) * transform.alpha,
                borderColor: render?.borderColor ?? 0,
                borderWidth: render?.borderWidth ?? 0,
                cornerRadius: render?.borderRadius?.[0] ?? 0,
                zIndex: transform.zIndex,
                visible: transform.visible
            };

            if (text && text.text) {
                data.text = {
                    content: text.text,
                    fontSize: text.fontSize,
                    fontFamily: text.fontFamily,
                    color: text.color,
                    alpha: text.alpha,
                    align: text.align,
                    verticalAlign: text.verticalAlign
                };
            }

            result.push(data);
        }

        result.sort((a, b) => a.zIndex - b.zIndex);

        return result;
    }

    clearTextCache(): void {
        this.textTextureCache.clear();
    }

    dispose(): void {
        this.textCanvas = null;
        this.textCtx = null;
        this.textTextureCache.clear();
        this.onTextureCreated = null;
    }
}
