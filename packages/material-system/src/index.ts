/**
 * Material System for ES Engine.
 * ES引擎材质系统。
 *
 * This system provides:
 * 该系统提供：
 *
 * - Material: Material definition class with shader and uniform parameters.
 *   材质定义类，包含着色器和 uniform 参数。
 * - Shader: Shader definition class with vertex and fragment shader code.
 *   着色器定义类，包含顶点和片段着色器代码。
 * - MaterialManager: Material asset manager.
 *   材质资产管理器。
 * - MaterialLoader: Asset loader for .mat files.
 *   .mat 文件的资产加载器。
 *
 * Note: Materials are not standalone components, but used as properties of
 * render components (such as SpriteComponent).
 * 注意：材质不是独立组件，而是作为渲染组件（如 SpriteComponent）的属性使用。
 *
 * @packageDocumentation
 */

// Types.
// 类型。
export * from './types';

// Core classes.
// 核心类。
export { Material } from './Material';
export {
    Shader,
    DEFAULT_VERTEX_SHADER,
    DEFAULT_FRAGMENT_SHADER,
    GRAYSCALE_FRAGMENT_SHADER,
    TINT_FRAGMENT_SHADER,
    FLASH_FRAGMENT_SHADER,
    OUTLINE_FRAGMENT_SHADER
} from './Shader';

// Manager.
// 管理器。
export { MaterialManager, getMaterialManager } from './MaterialManager';
export type { IEngineBridge } from './MaterialManager';

// Loaders.
// 加载器。
export { MaterialLoader } from './loaders/MaterialLoader';
export type { IMaterialAssetData } from './loaders/MaterialLoader';
export { ShaderLoader } from './loaders/ShaderLoader';
export type { IShaderAssetData, ShaderFileFormat } from './loaders/ShaderLoader';

// Runtime Module.
// 运行时模块。
export { MaterialRuntimeModule, materialRuntimeModule, MaterialSystemPlugin } from './MaterialSystemPlugin';
export type { IMaterialRuntimeModule } from './MaterialSystemPlugin';

// Service Tokens.
// 服务令牌。
export { MaterialManagerToken } from './tokens';
export type { IMaterialManager } from './tokens';
