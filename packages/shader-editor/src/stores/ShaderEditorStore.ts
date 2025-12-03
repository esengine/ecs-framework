/**
 * Shader Editor Store.
 * 着色器编辑器状态存储。
 */

import { create } from 'zustand';

/**
 * Shader data structure.
 * 着色器数据结构。
 */
export interface ShaderData {
    version: string;
    name: string;
    vertex: string;
    fragment: string;
}

/**
 * Shader editor state.
 * 着色器编辑器状态。
 */
export interface ShaderEditorState {
    /** Current file path. | 当前文件路径。 */
    filePath: string | null;
    /** Shader data. | 着色器数据。 */
    shaderData: ShaderData | null;
    /** Whether data has been modified. | 数据是否已修改。 */
    isDirty: boolean;

    /** Set file path. | 设置文件路径。 */
    setFilePath: (path: string | null) => void;
    /** Set shader data. | 设置着色器数据。 */
    setShaderData: (data: ShaderData | null) => void;
    /** Set dirty flag. | 设置修改标志。 */
    setDirty: (dirty: boolean) => void;
    /** Reset state. | 重置状态。 */
    reset: () => void;
}

/**
 * Create default shader data.
 * 创建默认着色器数据。
 */
export function createDefaultShaderData(name: string = 'New Shader'): ShaderData {
    return {
        version: '1.0',
        name,
        vertex: `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_texCoord;
layout(location = 2) in vec4 a_color;

uniform mat3 u_projection;

out vec2 v_texCoord;
out vec4 v_color;

void main() {
    vec3 pos = u_projection * vec3(a_position, 1.0);
    gl_Position = vec4(pos.xy, 0.0, 1.0);
    v_texCoord = a_texCoord;
    v_color = a_color;
}`,
        fragment: `#version 300 es
precision highp float;

in vec2 v_texCoord;
in vec4 v_color;

uniform sampler2D u_texture;

out vec4 fragColor;

void main() {
    vec4 texColor = texture(u_texture, v_texCoord);
    fragColor = texColor * v_color;

    if (fragColor.a < 0.01) {
        discard;
    }
}`
    };
}

/**
 * Shader editor store.
 * 着色器编辑器存储。
 */
export const useShaderEditorStore = create<ShaderEditorState>((set) => ({
    filePath: null,
    shaderData: null,
    isDirty: false,

    setFilePath: (path) => set({ filePath: path }),
    setShaderData: (data) => set({ shaderData: data }),
    setDirty: (dirty) => set({ isDirty: dirty }),
    reset: () => set({
        filePath: null,
        shaderData: null,
        isDirty: false
    })
}));
