/**
 * Build Presets
 * 构建预设
 *
 * 提供不同类型包的标准化 Vite 配置
 */

export { runtimeOnlyPreset, type RuntimeOnlyOptions } from './runtime-only';
export { pluginPreset, standaloneRuntimeConfig, type PluginPackageOptions, type StandaloneRuntimeOptions } from './plugin';
export { editorOnlyPreset, type EditorOnlyOptions } from './editor-only';
