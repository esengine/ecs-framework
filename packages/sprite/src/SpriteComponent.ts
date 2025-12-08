import type { AssetReference } from '@esengine/asset-system';
import { Component, ECSComponent, Property, Serializable, Serialize } from '@esengine/ecs-framework';

/**
 * Material property override value.
 * 材质属性覆盖值。
 *
 * Used to override specific uniform parameters on a per-instance basis
 * without creating a new material instance.
 * 用于在每个实例上覆盖特定的 uniform 参数，而无需创建新的材质实例。
 */
export interface MaterialPropertyOverride {
    /** Uniform type. | Uniform 类型。 */
    type: 'float' | 'vec2' | 'vec3' | 'vec4' | 'color' | 'int';
    /** Uniform value. | Uniform 值。 */
    value: number | number[];
}

/**
 * Material property overrides map.
 * 材质属性覆盖映射。
 */
export type MaterialOverrides = Record<string, MaterialPropertyOverride>;

/**
 * 精灵组件 - 管理2D图像渲染
 * Sprite component - manages 2D image rendering
 */
@ECSComponent('Sprite')
@Serializable({ version: 4, typeId: 'Sprite' })
export class SpriteComponent extends Component {
    /**
     * 纹理资产 GUID
     * Texture asset GUID
     *
     * Stores the unique identifier of the texture asset.
     * The actual file path is resolved at runtime via AssetDatabase.
     * 存储纹理资产的唯一标识符。
     * 实际文件路径在运行时通过 AssetDatabase 解析。
     */
    @Serialize()
    @Property({ type: 'asset', label: 'Texture', assetType: 'texture' })
    public textureGuid: string = '';

    /**
     * 纹理ID（运行时使用）
     * Texture ID for runtime rendering
     */
    public textureId: number = 0;

    /**
     * 资产引用（运行时，不序列化）
     * Asset reference (runtime only, not serialized)
     */
    private _assetReference?: AssetReference<HTMLImageElement>;

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

    /**
     * 材质资产 GUID（共享材质）
     * Material asset GUID (shared material)
     *
     * Multiple sprites can reference the same material file.
     * 多个精灵可以引用同一个材质文件。
     */
    @Serialize()
    @Property({ type: 'asset', label: 'Material', extensions: ['.mat'] })
    public materialGuid: string = '';

    /**
     * 材质属性覆盖（实例级别）
     * Material property overrides (instance level)
     *
     * Override specific uniform parameters without creating a new material.
     * 覆盖特定的 uniform 参数，无需创建新材质。
     */
    @Serialize()
    public materialOverrides: MaterialOverrides = {};

    /**
     * 是否使用独立材质实例
     * Whether to use an independent material instance
     *
     * When true, a copy of the shared material is created for this sprite.
     * Changes to this material won't affect other sprites using the same source.
     * 当为 true 时，会为此精灵创建共享材质的副本。
     * 对此材质的更改不会影响使用相同源的其他精灵。
     */
    @Serialize()
    @Property({ type: 'boolean', label: 'Use Instance Material' })
    public useInstanceMaterial: boolean = false;

    /**
     * 运行时材质ID（缓存）
     * Runtime material ID (cached)
     *
     * Cached material ID for rendering. Updated when material path changes.
     * 用于渲染的缓存材质ID。当材质路径更改时更新。
     */
    private _materialId: number = 0;

    /**
     * 独立材质实例（如果 useInstanceMaterial 为 true）
     * Independent material instance (if useInstanceMaterial is true)
     */
    private _instanceMaterial: unknown = null;

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

    /**
     * @param textureGuidOrPath - Texture GUID or path (for backward compatibility)
     */
    constructor(textureGuidOrPath: string = '') {
        super();
        // Support both GUID and path for backward compatibility
        this.textureGuid = textureGuidOrPath;
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

    /**
     * 设置资产引用
     * Set asset reference
     */
    setAssetReference(reference: AssetReference<HTMLImageElement>): void {
        // 释放旧引用 / Release old reference
        if (this._assetReference) {
            this._assetReference.release();
        }
        this._assetReference = reference;
        if (reference) {
            this.textureGuid = reference.guid;
        }
    }

    /**
     * 获取资产引用
     * Get asset reference
     */
    getAssetReference(): AssetReference<HTMLImageElement> | undefined {
        return this._assetReference;
    }

    /**
     * 异步加载纹理
     * Load texture asynchronously
     */
    async loadTextureAsync(): Promise<void> {
        if (this._assetReference) {
            try {
                const result = await this._assetReference.loadAsync();
                // 检查返回值是否包含 textureId 属性（ITextureAsset 类型）
                // Check if result has textureId property (ITextureAsset type)
                if (result && typeof result === 'object' && 'textureId' in result) {
                    this.textureId = (result as { textureId: number }).textureId;
                }
            } catch (error) {
                console.error('Failed to load texture:', error);
            }
        }
    }

    /**
     * 获取纹理 GUID
     * Get texture GUID
     */
    getTextureSource(): string {
        return this.textureGuid;
    }

    // ============= Material Override Methods =============
    // ============= 材质覆盖方法 =============

    /**
     * 获取材质ID
     * Get material ID
     *
     * # Returns | 返回
     * The cached material ID for rendering.
     * 用于渲染的缓存材质ID。
     */
    getMaterialId(): number {
        return this._materialId;
    }

    /**
     * 设置材质ID
     * Set material ID
     *
     * # Arguments | 参数
     * * `id` - Material ID from MaterialManager. | 来自 MaterialManager 的材质ID。
     */
    setMaterialId(id: number): void {
        this._materialId = id;
    }

    /**
     * 设置浮点覆盖值
     * Set float override value
     *
     * # Arguments | 参数
     * * `name` - Uniform name. | Uniform 名称。
     * * `value` - Float value. | 浮点值。
     */
    setOverrideFloat(name: string, value: number): this {
        this.materialOverrides[name] = { type: 'float', value };
        return this;
    }

    /**
     * 设置 vec2 覆盖值
     * Set vec2 override value
     *
     * # Arguments | 参数
     * * `name` - Uniform name. | Uniform 名称。
     * * `x` - X component. | X 分量。
     * * `y` - Y component. | Y 分量。
     */
    setOverrideVec2(name: string, x: number, y: number): this {
        this.materialOverrides[name] = { type: 'vec2', value: [x, y] };
        return this;
    }

    /**
     * 设置 vec3 覆盖值
     * Set vec3 override value
     *
     * # Arguments | 参数
     * * `name` - Uniform name. | Uniform 名称。
     * * `x` - X component. | X 分量。
     * * `y` - Y component. | Y 分量。
     * * `z` - Z component. | Z 分量。
     */
    setOverrideVec3(name: string, x: number, y: number, z: number): this {
        this.materialOverrides[name] = { type: 'vec3', value: [x, y, z] };
        return this;
    }

    /**
     * 设置 vec4 覆盖值
     * Set vec4 override value
     *
     * # Arguments | 参数
     * * `name` - Uniform name. | Uniform 名称。
     * * `x` - X component. | X 分量。
     * * `y` - Y component. | Y 分量。
     * * `z` - Z component. | Z 分量。
     * * `w` - W component. | W 分量。
     */
    setOverrideVec4(name: string, x: number, y: number, z: number, w: number): this {
        this.materialOverrides[name] = { type: 'vec4', value: [x, y, z, w] };
        return this;
    }

    /**
     * 设置颜色覆盖值
     * Set color override value
     *
     * # Arguments | 参数
     * * `name` - Uniform name. | Uniform 名称。
     * * `r` - Red component (0-1). | 红色分量 (0-1)。
     * * `g` - Green component (0-1). | 绿色分量 (0-1)。
     * * `b` - Blue component (0-1). | 蓝色分量 (0-1)。
     * * `a` - Alpha component (0-1). | 透明度分量 (0-1)。
     */
    setOverrideColor(name: string, r: number, g: number, b: number, a: number = 1.0): this {
        this.materialOverrides[name] = { type: 'color', value: [r, g, b, a] };
        return this;
    }

    /**
     * 设置整数覆盖值
     * Set integer override value
     *
     * # Arguments | 参数
     * * `name` - Uniform name. | Uniform 名称。
     * * `value` - Integer value. | 整数值。
     */
    setOverrideInt(name: string, value: number): this {
        this.materialOverrides[name] = { type: 'int', value: Math.floor(value) };
        return this;
    }

    /**
     * 获取覆盖值
     * Get override value
     *
     * # Arguments | 参数
     * * `name` - Uniform name. | Uniform 名称。
     *
     * # Returns | 返回
     * Override value or undefined if not set.
     * 覆盖值，如果未设置则返回 undefined。
     */
    getOverride(name: string): MaterialPropertyOverride | undefined {
        return this.materialOverrides[name];
    }

    /**
     * 移除覆盖值
     * Remove override value
     *
     * # Arguments | 参数
     * * `name` - Uniform name to remove. | 要移除的 Uniform 名称。
     */
    removeOverride(name: string): this {
        delete this.materialOverrides[name];
        return this;
    }

    /**
     * 清除所有覆盖值
     * Clear all override values
     */
    clearOverrides(): this {
        this.materialOverrides = {};
        return this;
    }

    /**
     * 检查是否有覆盖值
     * Check if there are any overrides
     *
     * # Returns | 返回
     * True if there are any material overrides.
     * 如果有任何材质覆盖则返回 true。
     */
    hasOverrides(): boolean {
        return Object.keys(this.materialOverrides).length > 0;
    }

    /**
     * 组件销毁时调用
     * Called when component is destroyed
     */
    onDestroy(): void {
        // 释放资产引用 / Release asset reference
        if (this._assetReference) {
            this._assetReference.release();
            this._assetReference = undefined;
        }
        // 清理材质覆盖 / Clear material overrides
        this.materialOverrides = {};
        this._instanceMaterial = null;
    }
}
