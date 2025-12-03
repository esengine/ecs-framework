/**
 * Material and shader types for ES Engine
 * ES引擎的材质和着色器类型
 */

/**
 * Blend modes for material rendering.
 * 材质渲染的混合模式。
 */
export enum BlendMode {
    /** No blending, fully opaque | 无混合，完全不透明 */
    None = 0,
    /** Standard alpha blending | 标准透明度混合 */
    Alpha = 1,
    /** Additive blending (good for glow effects) | 加法混合（适用于发光效果） */
    Additive = 2,
    /** Multiplicative blending (good for shadows) | 乘法混合（适用于阴影） */
    Multiply = 3,
    /** Screen blending (opposite of multiply) | 滤色混合（与乘法相反） */
    Screen = 4,
    /** Premultiplied alpha | 预乘透明度 */
    PremultipliedAlpha = 5
}

/**
 * Cull modes for material rendering.
 * 材质渲染的剔除模式。
 */
export enum CullMode {
    /** No face culling | 不剔除 */
    None = 0,
    /** Cull front faces | 剔除正面 */
    Front = 1,
    /** Cull back faces | 剔除背面 */
    Back = 2
}

/**
 * Uniform value types supported by the material system.
 * 材质系统支持的uniform值类型。
 */
export enum UniformType {
    Float = 'float',
    Vec2 = 'vec2',
    Vec3 = 'vec3',
    Vec4 = 'vec4',
    Color = 'color',
    Int = 'int',
    Mat3 = 'mat3',
    Mat4 = 'mat4',
    Sampler = 'sampler'
}

/**
 * Uniform value definition.
 * Uniform值定义。
 */
export interface UniformValue {
    type: UniformType;
    value: number | number[] | string;
}

/**
 * Shader definition.
 * 着色器定义。
 */
export interface ShaderDefinition {
    /** Shader name for reference | 着色器名称用于引用 */
    name: string;
    /** Vertex shader GLSL source | 顶点着色器GLSL源代码 */
    vertexSource: string;
    /** Fragment shader GLSL source | 片段着色器GLSL源代码 */
    fragmentSource: string;
    /** Shader uniforms with default values | 着色器uniform及其默认值 */
    uniforms?: Record<string, UniformValue>;
}

/**
 * Material definition.
 * 材质定义。
 */
export interface MaterialDefinition {
    /** Material name | 材质名称 */
    name: string;
    /** Shader ID or name to use | 使用的着色器ID或名称 */
    shader: number | string;
    /** Blend mode | 混合模式 */
    blendMode?: BlendMode;
    /** Cull mode | 剔除模式 */
    cullMode?: CullMode;
    /** Depth test enabled | 是否启用深度测试 */
    depthTest?: boolean;
    /** Depth write enabled | 是否启用深度写入 */
    depthWrite?: boolean;
    /** Material uniform values | 材质uniform值 */
    uniforms?: Record<string, UniformValue>;
    /** Texture references by uniform name | 按uniform名称引用的纹理 */
    textures?: Record<string, string>;
}

/**
 * Material asset data for serialization.
 * 用于序列化的材质资产数据。
 */
export interface MaterialAssetData {
    version: number;
    material: MaterialDefinition;
}

/**
 * Shader asset data for serialization.
 * 用于序列化的着色器资产数据。
 */
export interface ShaderAssetData {
    version: number;
    shader: ShaderDefinition;
}

/**
 * Built-in shader IDs.
 * 内置着色器ID。
 */
export const BuiltInShaders = {
    DefaultSprite: 0,
    Grayscale: 1,
    Tint: 2,
    Flash: 3,
    Outline: 4
} as const;

/**
 * Built-in material IDs.
 * 内置材质ID。
 */
export const BuiltInMaterials = {
    /** Default sprite material | 默认精灵材质 */
    Default: 0,
    /** Additive blend material | 加法混合材质 */
    Additive: 1,
    /** Multiply blend material | 乘法混合材质 */
    Multiply: 2,
    /** Unlit/opaque material | 无光照/不透明材质 */
    Unlit: 3
} as const;
