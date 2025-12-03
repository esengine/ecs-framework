/**
 * Material class for managing rendering properties.
 * 用于管理渲染属性的材质类。
 */

import { BlendMode, CullMode, UniformType, UniformValue, MaterialDefinition } from './types';

/**
 * Material class that holds shader reference and uniform values.
 * 持有着色器引用和uniform值的材质类。
 */
export class Material {
    /** Material ID assigned by the engine | 引擎分配的材质ID */
    private _id: number = -1;

    /** Material name for debugging | 材质名称（用于调试） */
    public name: string;

    /** Shader ID to use | 使用的着色器ID */
    public shaderId: number;

    /** Blend mode | 混合模式 */
    public blendMode: BlendMode;

    /** Cull mode | 剔除模式 */
    public cullMode: CullMode;

    /** Depth test enabled | 是否启用深度测试 */
    public depthTest: boolean;

    /** Depth write enabled | 是否启用深度写入 */
    public depthWrite: boolean;

    /** Material uniform values | 材质uniform值 */
    private uniforms: Map<string, UniformValue> = new Map();

    /** Texture references by uniform name | 按uniform名称引用的纹理 */
    private textures: Map<string, string> = new Map();

    /** Whether the material needs to sync with engine | 材质是否需要与引擎同步 */
    private _dirty: boolean = true;

    constructor(name: string = 'Material', shaderId: number = 0) {
        this.name = name;
        this.shaderId = shaderId;
        this.blendMode = BlendMode.Alpha;
        this.cullMode = CullMode.None;
        this.depthTest = false;
        this.depthWrite = false;
    }

    /** Get the material ID | 获取材质ID */
    get id(): number {
        return this._id;
    }

    /** Set the material ID (called by MaterialManager) | 设置材质ID（由MaterialManager调用） */
    set id(value: number) {
        this._id = value;
    }

    /** Check if material is dirty | 检查材质是否为脏 */
    get dirty(): boolean {
        return this._dirty;
    }

    /** Mark material as clean | 标记材质为干净 */
    markClean(): void {
        this._dirty = false;
    }

    // ============= Uniform Setters =============
    // ============= Uniform设置方法 =============

    /**
     * Set a float uniform.
     * 设置浮点uniform。
     */
    setFloat(name: string, value: number): this {
        this.uniforms.set(name, { type: UniformType.Float, value });
        this._dirty = true;
        return this;
    }

    /**
     * Set a vec2 uniform.
     * 设置vec2 uniform。
     */
    setVec2(name: string, x: number, y: number): this {
        this.uniforms.set(name, { type: UniformType.Vec2, value: [x, y] });
        this._dirty = true;
        return this;
    }

    /**
     * Set a vec3 uniform.
     * 设置vec3 uniform。
     */
    setVec3(name: string, x: number, y: number, z: number): this {
        this.uniforms.set(name, { type: UniformType.Vec3, value: [x, y, z] });
        this._dirty = true;
        return this;
    }

    /**
     * Set a vec4 uniform.
     * 设置vec4 uniform。
     */
    setVec4(name: string, x: number, y: number, z: number, w: number): this {
        this.uniforms.set(name, { type: UniformType.Vec4, value: [x, y, z, w] });
        this._dirty = true;
        return this;
    }

    /**
     * Set a color uniform (RGBA, 0.0-1.0).
     * 设置颜色uniform（RGBA，0.0-1.0）。
     */
    setColor(name: string, r: number, g: number, b: number, a: number = 1.0): this {
        this.uniforms.set(name, { type: UniformType.Color, value: [r, g, b, a] });
        this._dirty = true;
        return this;
    }

    /**
     * Set an integer uniform.
     * 设置整数uniform。
     */
    setInt(name: string, value: number): this {
        this.uniforms.set(name, { type: UniformType.Int, value: Math.floor(value) });
        this._dirty = true;
        return this;
    }

    /**
     * Set a texture uniform.
     * 设置纹理uniform。
     */
    setTexture(name: string, texturePath: string): this {
        this.textures.set(name, texturePath);
        this._dirty = true;
        return this;
    }

    // ============= Uniform Getters =============
    // ============= Uniform获取方法 =============

    /**
     * Get a uniform value.
     * 获取uniform值。
     */
    getUniform(name: string): UniformValue | undefined {
        return this.uniforms.get(name);
    }

    /**
     * Get a texture path.
     * 获取纹理路径。
     */
    getTexture(name: string): string | undefined {
        return this.textures.get(name);
    }

    /**
     * Get all uniforms.
     * 获取所有uniform。
     */
    getUniforms(): Map<string, UniformValue> {
        return this.uniforms;
    }

    /**
     * Get all textures.
     * 获取所有纹理。
     */
    getTextures(): Map<string, string> {
        return this.textures;
    }

    // ============= Serialization =============
    // ============= 序列化 =============

    /**
     * Export to material definition.
     * 导出为材质定义。
     */
    toDefinition(): MaterialDefinition {
        const uniformsObj: Record<string, UniformValue> = {};
        for (const [key, value] of this.uniforms) {
            uniformsObj[key] = value;
        }

        const texturesObj: Record<string, string> = {};
        for (const [key, value] of this.textures) {
            texturesObj[key] = value;
        }

        return {
            name: this.name,
            shader: this.shaderId,
            blendMode: this.blendMode,
            cullMode: this.cullMode,
            depthTest: this.depthTest,
            depthWrite: this.depthWrite,
            uniforms: Object.keys(uniformsObj).length > 0 ? uniformsObj : undefined,
            textures: Object.keys(texturesObj).length > 0 ? texturesObj : undefined
        };
    }

    /**
     * Import from material definition.
     * 从材质定义导入。
     */
    static fromDefinition(def: MaterialDefinition): Material {
        const material = new Material(def.name, typeof def.shader === 'number' ? def.shader : 0);
        material.blendMode = def.blendMode ?? BlendMode.Alpha;
        material.cullMode = def.cullMode ?? CullMode.None;
        material.depthTest = def.depthTest ?? false;
        material.depthWrite = def.depthWrite ?? false;

        if (def.uniforms) {
            for (const [key, value] of Object.entries(def.uniforms)) {
                material.uniforms.set(key, value);
            }
        }

        if (def.textures) {
            for (const [key, value] of Object.entries(def.textures)) {
                material.textures.set(key, value);
            }
        }

        return material;
    }

    // ============= Static Factory Methods =============
    // ============= 静态工厂方法 =============

    /**
     * Create a default sprite material.
     * 创建默认精灵材质。
     */
    static sprite(): Material {
        return new Material('Sprite', 0);
    }

    /**
     * Create an additive (glow) material.
     * 创建加法（发光）材质。
     */
    static additive(): Material {
        const mat = new Material('Additive', 0);
        mat.blendMode = BlendMode.Additive;
        return mat;
    }

    /**
     * Create a multiply (shadow) material.
     * 创建乘法（阴影）材质。
     */
    static multiply(): Material {
        const mat = new Material('Multiply', 0);
        mat.blendMode = BlendMode.Multiply;
        return mat;
    }

    /**
     * Create an unlit/opaque material.
     * 创建无光照/不透明材质。
     */
    static unlit(): Material {
        const mat = new Material('Unlit', 0);
        mat.blendMode = BlendMode.None;
        return mat;
    }
}
