/**
 * Canvas 2D Render System
 * Canvas 2D 渲染系统
 */

import { EntitySystem, Matcher, ECSSystem, Core } from '@esengine/ecs-framework';
import { TransformComponent } from '@esengine/engine-core';
import { SpriteComponent } from '@esengine/sprite';

@ECSSystem('Canvas2DRender', { updateOrder: 1000 })
export class Canvas2DRenderSystem extends EntitySystem {
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private textureCache = new Map<string, HTMLImageElement>();

    constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
        super(Matcher.empty());
        this.ctx = ctx;
        this.canvas = canvas;
    }

    async loadTexture(path: string): Promise<void> {
        if (this.textureCache.has(path)) return;

        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            const urlPath = `/asset?path=${encodeURIComponent(path)}`;

            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error(`Failed to load: ${path}`));
                img.src = urlPath;
            });

            this.textureCache.set(path, img);
        } catch (error) {
            console.warn('Texture load failed:', path, error);
        }
    }

    update(): void {
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (!Core.scene) return;

        for (const entity of Core.scene.entities.buffer) {
            if (!entity.enabled) continue;

            const transform = entity.getComponent(TransformComponent) as TransformComponent | null;
            const sprite = entity.getComponent(SpriteComponent) as SpriteComponent | null;

            if (!transform || !sprite) continue;

            this.ctx.save();

            // 使用世界变换（由 TransformSystem 计算，考虑父级变换）
            const x = (transform.worldPosition.x || 0) + this.canvas.width / 2;
            const y = this.canvas.height / 2 - (transform.worldPosition.y || 0);
            const width = (sprite.width || 64) * (transform.worldScale.x || 1);
            const height = (sprite.height || 64) * (transform.worldScale.y || 1);
            const rotation = -(transform.worldRotation.z || 0) * Math.PI / 180;

            this.ctx.translate(x, y);
            this.ctx.rotate(rotation);

            const texture = this.textureCache.get(sprite.textureGuid || '');
            if (texture) {
                this.ctx.drawImage(texture, -width / 2, -height / 2, width, height);
            } else {
                this.ctx.fillStyle = sprite.color || '#ffffff';
                this.ctx.fillRect(-width / 2, -height / 2, width, height);
            }

            this.ctx.restore();
        }
    }
}
