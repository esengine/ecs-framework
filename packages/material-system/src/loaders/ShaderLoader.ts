/**
 * Shader asset loader.
 * 着色器资产加载器。
 */

import {
    AssetType,
    IAssetContent,
    IAssetParseContext
} from '@esengine/asset-system';
import type { IAssetLoader, AssetContentType } from '@esengine/asset-system';
import { Shader } from '../Shader';
import type { ShaderDefinition } from '../types';

/**
 * Shader asset data structure.
 * 着色器资产数据结构。
 */
export interface IShaderAssetData {
    /** Shader instance. | 着色器实例。 */
    shader: Shader;
    /** Shader definition data. | 着色器定义数据。 */
    definition: ShaderDefinition;
}

/**
 * Shader file format.
 * 着色器文件格式。
 *
 * ```json
 * {
 *   "version": 1,
 *   "shader": {
 *     "name": "CustomShader",
 *     "vertexSource": "...",
 *     "fragmentSource": "...",
 *     "uniforms": { ... }
 *   }
 * }
 * ```
 */
export interface ShaderFileFormat {
    version: number;
    shader: ShaderDefinition;
}

/**
 * Shader file loader.
 * 着色器文件加载器。
 */
export class ShaderLoader implements IAssetLoader<IShaderAssetData> {
    readonly supportedType = AssetType.Shader;
    readonly supportedExtensions = ['.shader'];
    readonly contentType: AssetContentType = 'text';

    /**
     * Parse shader from content.
     * 从内容解析着色器。
     */
    async parse(content: IAssetContent, context: IAssetParseContext): Promise<IShaderAssetData> {
        if (!content.text) {
            throw new Error('Shader content is empty');
        }

        const data = JSON.parse(content.text) as ShaderFileFormat;

        if (!data.shader) {
            throw new Error('Invalid shader file: missing shader definition');
        }

        const shaderDef = data.shader;
        const shader = Shader.fromDefinition(shaderDef);

        return {
            shader,
            definition: shaderDef
        };
    }

    /**
     * Dispose shader asset.
     * 释放着色器资产。
     */
    dispose(_asset: IShaderAssetData): void {
        // Shader cleanup if needed.
    }
}
