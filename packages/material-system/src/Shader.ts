/**
 * Shader class for managing GLSL shaders.
 * 用于管理GLSL着色器的类。
 */

import { ShaderDefinition, UniformValue, UniformType } from './types';

/**
 * Shader class that holds vertex and fragment shader source.
 * 持有顶点和片段着色器源代码的着色器类。
 */
export class Shader {
    /** Shader ID assigned by the engine | 引擎分配的着色器ID */
    private _id: number = -1;

    /** Shader name for reference | 着色器名称用于引用 */
    public name: string;

    /** Vertex shader GLSL source | 顶点着色器GLSL源代码 */
    public vertexSource: string;

    /** Fragment shader GLSL source | 片段着色器GLSL源代码 */
    public fragmentSource: string;

    /** Shader uniforms with default values | 着色器uniform及其默认值 */
    private uniforms: Map<string, UniformValue> = new Map();

    /** Whether the shader has been compiled | 着色器是否已编译 */
    private _compiled: boolean = false;

    constructor(name: string, vertexSource: string, fragmentSource: string) {
        this.name = name;
        this.vertexSource = vertexSource;
        this.fragmentSource = fragmentSource;
    }

    /** Get the shader ID | 获取着色器ID */
    get id(): number {
        return this._id;
    }

    /** Set the shader ID (called by ShaderManager) | 设置着色器ID（由ShaderManager调用） */
    set id(value: number) {
        this._id = value;
    }

    /** Check if shader is compiled | 检查着色器是否已编译 */
    get compiled(): boolean {
        return this._compiled;
    }

    /** Mark shader as compiled | 标记着色器为已编译 */
    markCompiled(): void {
        this._compiled = true;
    }

    /**
     * Define a uniform with default value.
     * 定义带有默认值的uniform。
     */
    defineUniform(name: string, type: UniformType, defaultValue: number | number[] | string): this {
        this.uniforms.set(name, { type, value: defaultValue });
        return this;
    }

    /**
     * Get uniform definition.
     * 获取uniform定义。
     */
    getUniform(name: string): UniformValue | undefined {
        return this.uniforms.get(name);
    }

    /**
     * Get all uniform definitions.
     * 获取所有uniform定义。
     */
    getUniforms(): Map<string, UniformValue> {
        return this.uniforms;
    }

    /**
     * Export to shader definition.
     * 导出为着色器定义。
     */
    toDefinition(): ShaderDefinition {
        const uniformsObj: Record<string, UniformValue> = {};
        for (const [key, value] of this.uniforms) {
            uniformsObj[key] = value;
        }

        return {
            name: this.name,
            vertexSource: this.vertexSource,
            fragmentSource: this.fragmentSource,
            uniforms: Object.keys(uniformsObj).length > 0 ? uniformsObj : undefined
        };
    }

    /**
     * Import from shader definition.
     * 从着色器定义导入。
     */
    static fromDefinition(def: ShaderDefinition): Shader {
        const shader = new Shader(def.name, def.vertexSource, def.fragmentSource);

        if (def.uniforms) {
            for (const [key, value] of Object.entries(def.uniforms)) {
                shader.uniforms.set(key, value);
            }
        }

        return shader;
    }
}

// ============= Built-in Shaders =============
// ============= 内置着色器 =============

/**
 * Default sprite vertex shader source.
 * 默认精灵顶点着色器源代码。
 */
export const DEFAULT_VERTEX_SHADER = `#version 300 es
precision highp float;

// Vertex attributes | 顶点属性
layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_texCoord;
layout(location = 2) in vec4 a_color;

// Uniforms | 统一变量
uniform mat3 u_projection;

// Outputs to fragment shader | 输出到片段着色器
out vec2 v_texCoord;
out vec4 v_color;

void main() {
    // Apply projection matrix | 应用投影矩阵
    vec3 pos = u_projection * vec3(a_position, 1.0);
    gl_Position = vec4(pos.xy, 0.0, 1.0);

    // Pass through to fragment shader | 传递到片段着色器
    v_texCoord = a_texCoord;
    v_color = a_color;
}
`;

/**
 * Default sprite fragment shader source.
 * 默认精灵片段着色器源代码。
 */
export const DEFAULT_FRAGMENT_SHADER = `#version 300 es
precision highp float;

// Inputs from vertex shader | 来自顶点着色器的输入
in vec2 v_texCoord;
in vec4 v_color;

// Texture sampler | 纹理采样器
uniform sampler2D u_texture;

// Output color | 输出颜色
out vec4 fragColor;

void main() {
    // Sample texture and multiply by vertex color | 采样纹理并乘以顶点颜色
    vec4 texColor = texture(u_texture, v_texCoord);
    fragColor = texColor * v_color;

    // Discard fully transparent pixels | 丢弃完全透明的像素
    if (fragColor.a < 0.01) {
        discard;
    }
}
`;

/**
 * Grayscale fragment shader for desaturation effect.
 * 灰度片段着色器用于去饱和效果。
 */
export const GRAYSCALE_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_texCoord;
in vec4 v_color;

uniform sampler2D u_texture;
uniform float u_grayscale; // 0.0 = full color, 1.0 = full grayscale

out vec4 fragColor;

void main() {
    vec4 texColor = texture(u_texture, v_texCoord);
    vec4 color = texColor * v_color;

    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    vec3 grayscaleColor = vec3(gray);

    fragColor = vec4(mix(color.rgb, grayscaleColor, u_grayscale), color.a);

    if (fragColor.a < 0.01) {
        discard;
    }
}
`;

/**
 * Color tint fragment shader.
 * 颜色着色片段着色器。
 */
export const TINT_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_texCoord;
in vec4 v_color;

uniform sampler2D u_texture;
uniform vec4 u_tintColor; // Tint color to apply

out vec4 fragColor;

void main() {
    vec4 texColor = texture(u_texture, v_texCoord);
    vec4 color = texColor * v_color;

    // Apply tint by multiplying RGB and keeping alpha
    fragColor = vec4(color.rgb * u_tintColor.rgb, color.a * u_tintColor.a);

    if (fragColor.a < 0.01) {
        discard;
    }
}
`;

/**
 * Flash/hit effect fragment shader.
 * 闪白/受击效果片段着色器。
 */
export const FLASH_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_texCoord;
in vec4 v_color;

uniform sampler2D u_texture;
uniform vec4 u_flashColor; // Flash color
uniform float u_flashAmount; // 0.0 = no flash, 1.0 = full flash

out vec4 fragColor;

void main() {
    vec4 texColor = texture(u_texture, v_texCoord);
    vec4 color = texColor * v_color;

    // Mix original color with flash color
    vec3 flashedColor = mix(color.rgb, u_flashColor.rgb, u_flashAmount);
    fragColor = vec4(flashedColor, color.a);

    if (fragColor.a < 0.01) {
        discard;
    }
}
`;

/**
 * Outline fragment shader.
 * 描边片段着色器。
 */
export const OUTLINE_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_texCoord;
in vec4 v_color;

uniform sampler2D u_texture;
uniform vec4 u_outlineColor;
uniform float u_outlineWidth;
uniform vec2 u_texelSize; // 1.0 / textureSize

out vec4 fragColor;

void main() {
    vec4 texColor = texture(u_texture, v_texCoord);
    vec4 color = texColor * v_color;

    // Check if this pixel should be outline
    if (color.a < 0.1) {
        // Sample neighbors
        float a = 0.0;
        for (float x = -1.0; x <= 1.0; x += 1.0) {
            for (float y = -1.0; y <= 1.0; y += 1.0) {
                vec2 offset = vec2(x, y) * u_texelSize * u_outlineWidth;
                a += texture(u_texture, v_texCoord + offset).a;
            }
        }

        if (a > 0.0) {
            fragColor = u_outlineColor;
            return;
        }
    }

    fragColor = color;

    if (fragColor.a < 0.01) {
        discard;
    }
}
`;
