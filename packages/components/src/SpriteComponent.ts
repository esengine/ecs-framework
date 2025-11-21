import { Component, ECSComponent, Serializable, Serialize, Property } from '@esengine/ecs-framework';

/**
 * 精灵组件 - 管理2D图像渲染
 * Sprite component - manages 2D image rendering
 */
@ECSComponent('Sprite')
@Serializable({ version: 1, typeId: 'Sprite' })
export class SpriteComponent extends Component {
    /** 纹理路径或资源ID | Texture path or asset ID */
    @Serialize()
    @Property({ type: 'asset', label: 'Texture', fileExtension: '.png' })
    public texture: string = '';

    /**
     * 纹理ID（运行时使用）
     * Texture ID for runtime rendering
     */
    public textureId: number = 0;

    /**
     * 精灵宽度（像素）
     * Sprite width in pixels
     */
    @Serialize()
    @Property({
        type: 'number',
        label: 'Width',
        min: 0,
        actions: [{
            id: 'nativeSize',
            label: 'Native',
            tooltip: 'Set to texture native size',
            icon: 'Maximize2'
        }]
    })
    public width: number = 64;

    /**
     * 精灵高度（像素）
     * Sprite height in pixels
     */
    @Serialize()
    @Property({
        type: 'number',
        label: 'Height',
        min: 0,
        actions: [{
            id: 'nativeSize',
            label: 'Native',
            tooltip: 'Set to texture native size',
            icon: 'Maximize2'
        }]
    })
    public height: number = 64;

    /**
     * UV坐标 [u0, v0, u1, v1]
     * UV coordinates [u0, v0, u1, v1]
     * 默认为完整纹理 [0, 0, 1, 1]
     * Default is full texture [0, 0, 1, 1]
     */
    @Serialize()
    public uv: [number, number, number, number] = [0, 0, 1, 1];

    /** 颜色（十六进制）| Color (hex string) */
    @Serialize()
    @Property({ type: 'color', label: 'Color' })
    public color: string = '#ffffff';

    /** 透明度 (0-1) | Alpha (0-1) */
    @Serialize()
    @Property({ type: 'number', label: 'Alpha', min: 0, max: 1, step: 0.01 })
    public alpha: number = 1;

    /**
     * 原点X (0-1, 0.5为中心)
     * Origin point X (0-1, where 0.5 is center)
     */
    @Serialize()
    @Property({ type: 'number', label: 'Origin X', min: 0, max: 1, step: 0.01 })
    public originX: number = 0.5;

    /**
     * 原点Y (0-1, 0.5为中心)
     * Origin point Y (0-1, where 0.5 is center)
     */
    @Serialize()
    @Property({ type: 'number', label: 'Origin Y', min: 0, max: 1, step: 0.01 })
    public originY: number = 0.5;

    /**
     * 精灵是否可见
     * Whether sprite is visible
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Visible' })
    public visible: boolean = true;

    /** 是否水平翻转 | Flip sprite horizontally */
    @Serialize()
    @Property({ type: 'boolean', label: 'Flip X' })
    public flipX: boolean = false;

    /** 是否垂直翻转 | Flip sprite vertically */
    @Serialize()
    @Property({ type: 'boolean', label: 'Flip Y' })
    public flipY: boolean = false;

    /**
     * 渲染层级/顺序（越高越在上面）
     * Render layer/order (higher = rendered on top)
     */
    @Serialize()
    @Property({ type: 'integer', label: 'Sorting Order' })
    public sortingOrder: number = 0;

    /** 锚点X (0-1) - 别名为originX | Anchor X (0-1) - alias for originX */
    get anchorX(): number {
        return this.originX;
    }
    set anchorX(value: number) {
        this.originX = value;
    }

    /** 锚点Y (0-1) - 别名为originY | Anchor Y (0-1) - alias for originY */
    get anchorY(): number {
        return this.originY;
    }
    set anchorY(value: number) {
        this.originY = value;
    }

    constructor(texture: string = '') {
        super();
        this.texture = texture;
    }

    /**
     * 从精灵图集区域设置UV
     * Set UV from a sprite atlas region
     *
     * @param x - 区域X（像素）| Region X in pixels
     * @param y - 区域Y（像素）| Region Y in pixels
     * @param w - 区域宽度（像素）| Region width in pixels
     * @param h - 区域高度（像素）| Region height in pixels
     * @param atlasWidth - 图集总宽度 | Atlas total width
     * @param atlasHeight - 图集总高度 | Atlas total height
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
}
