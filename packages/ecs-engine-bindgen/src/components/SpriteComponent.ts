/**
 * Sprite component for ECS entities.
 * 用于ECS实体的精灵组件。
 */

import { Component, ECSComponent } from '@esengine/ecs-framework';

/**
 * Sprite component data.
 * 精灵组件数据。
 *
 * Attach this component to entities that should be rendered as sprites.
 * 将此组件附加到应作为精灵渲染的实体。
 *
 * @example
 * ```typescript
 * const entity = scene.createEntity('player');
 * entity.addComponent(SpriteComponent);
 * const sprite = entity.getComponent(SpriteComponent);
 * sprite.textureId = 1;
 * sprite.width = 64;
 * sprite.height = 64;
 * ```
 */
@ECSComponent('Sprite')
export class SpriteComponent extends Component {
    /**
     * Texture ID for this sprite.
     * 此精灵的纹理ID。
     */
    textureId: number = 0;

    /**
     * Sprite width in pixels.
     * 精灵宽度（像素）。
     */
    width: number = 0;

    /**
     * Sprite height in pixels.
     * 精灵高度（像素）。
     */
    height: number = 0;

    /**
     * UV coordinates [u0, v0, u1, v1].
     * UV坐标。
     * Default is full texture [0, 0, 1, 1].
     * 默认为完整纹理。
     */
    uv: [number, number, number, number] = [0, 0, 1, 1];

    /**
     * Packed RGBA color (0xAABBGGRR format for WebGL).
     * 打包的RGBA颜色。
     * Default is white (0xFFFFFFFF).
     * 默认为白色。
     */
    color: number = 0xFFFFFFFF;

    /**
     * Origin point X (0-1, where 0.5 is center).
     * 原点X（0-1，0.5为中心）。
     */
    originX: number = 0.5;

    /**
     * Origin point Y (0-1, where 0.5 is center).
     * 原点Y（0-1，0.5为中心）。
     */
    originY: number = 0.5;

    /**
     * Whether sprite is visible.
     * 精灵是否可见。
     */
    visible: boolean = true;

    /**
     * Render layer/order (higher = rendered on top).
     * 渲染层级/顺序（越高越在上面）。
     */
    layer: number = 0;

    /**
     * Flip sprite horizontally.
     * 水平翻转精灵。
     */
    flipX: boolean = false;

    /**
     * Flip sprite vertically.
     * 垂直翻转精灵。
     */
    flipY: boolean = false;

    /**
     * Set UV from a sprite atlas region.
     * 从精灵图集区域设置UV。
     *
     * @param x - Region X in pixels | 区域X（像素）
     * @param y - Region Y in pixels | 区域Y（像素）
     * @param w - Region width in pixels | 区域宽度（像素）
     * @param h - Region height in pixels | 区域高度（像素）
     * @param atlasWidth - Atlas total width | 图集总宽度
     * @param atlasHeight - Atlas total height | 图集总高度
     */
    setAtlasRegion(
        x: number,
        y: number,
        w: number,
        h: number,
        atlasWidth: number,
        atlasHeight: number
    ): void {
        this.uv = [
            x / atlasWidth,
            y / atlasHeight,
            (x + w) / atlasWidth,
            (y + h) / atlasHeight
        ];
        this.width = w;
        this.height = h;
    }

    /**
     * Set color from RGBA values (0-255).
     * 从RGBA值设置颜色（0-255）。
     *
     * @param r - Red | 红色
     * @param g - Green | 绿色
     * @param b - Blue | 蓝色
     * @param a - Alpha | 透明度
     */
    setColorRGBA(r: number, g: number, b: number, a: number = 255): void {
        this.color = ((a & 0xFF) << 24) | ((b & 0xFF) << 16) | ((g & 0xFF) << 8) | (r & 0xFF);
    }

    /**
     * Set color from hex value (0xRRGGBB or 0xRRGGBBAA).
     * 从十六进制值设置颜色。
     *
     * @param hex - Hex color value | 十六进制颜色值
     */
    setColorHex(hex: number): void {
        if (hex > 0xFFFFFF) {
            // 0xRRGGBBAA format
            const r = (hex >> 24) & 0xFF;
            const g = (hex >> 16) & 0xFF;
            const b = (hex >> 8) & 0xFF;
            const a = hex & 0xFF;
            this.color = (a << 24) | (b << 16) | (g << 8) | r;
        } else {
            // 0xRRGGBB format
            const r = (hex >> 16) & 0xFF;
            const g = (hex >> 8) & 0xFF;
            const b = hex & 0xFF;
            this.color = (0xFF << 24) | (b << 16) | (g << 8) | r;
        }
    }
}
