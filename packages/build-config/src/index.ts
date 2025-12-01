/**
 * @esengine/build-config
 *
 * 统一构建配置包，提供标准化的 Vite 配置预设和共享插件
 * Unified build configuration with standardized Vite presets and shared plugins
 *
 * @example
 * ```typescript
 * // 1. 纯运行时包 (core, math, components)
 * import { runtimeOnlyPreset } from '@esengine/build-config/presets';
 * export default runtimeOnlyPreset({ root: __dirname });
 *
 * // 2. 插件包 (ui, tilemap, behavior-tree)
 * import { pluginPreset } from '@esengine/build-config/presets';
 * export default pluginPreset({
 *     root: __dirname,
 *     hasCSS: true
 * });
 *
 * // 3. 纯编辑器包 (editor-core, node-editor)
 * import { editorOnlyPreset } from '@esengine/build-config/presets';
 * export default editorOnlyPreset({
 *     root: __dirname,
 *     hasReact: true
 * });
 * ```
 *
 * ## 包类型说明
 *
 * | 类型 | 说明 | 示例 |
 * |------|------|------|
 * | RuntimeOnly | 纯运行时库，不含编辑器代码 | core, math, components |
 * | Plugin | 插件包，同时有 runtime 和 editor 入口 | ui, tilemap, behavior-tree |
 * | EditorOnly | 纯编辑器包，仅用于编辑器 | editor-core, node-editor |
 *
 * ## 目录结构约定
 *
 * ### RuntimeOnly 包
 * ```
 * packages/my-lib/
 * ├── src/
 * │   └── index.ts          # 主入口
 * ├── vite.config.ts
 * └── package.json
 * ```
 *
 * ### Plugin 包
 * ```
 * packages/my-plugin/
 * ├── src/
 * │   ├── index.ts          # 主入口（编辑器环境）
 * │   ├── runtime.ts        # 运行时入口（不含 React）
 * │   └── editor/
 * │       └── index.ts      # 编辑器模块
 * ├── plugin.json           # 插件描述文件
 * ├── vite.config.ts
 * └── package.json
 * ```
 *
 * ### EditorOnly 包
 * ```
 * packages/my-editor-tool/
 * ├── src/
 * │   └── index.ts          # 主入口
 * ├── vite.config.ts
 * └── package.json
 * ```
 */

// Types
export { EPackageType, STANDARD_EXTERNALS, EDITOR_ONLY_EXTERNALS } from './types';
export type { PackageBuildConfig } from './types';

// Presets
export {
    runtimeOnlyPreset,
    pluginPreset,
    standaloneRuntimeConfig,
    editorOnlyPreset
} from './presets';
export type {
    RuntimeOnlyOptions,
    PluginPackageOptions,
    StandaloneRuntimeOptions,
    EditorOnlyOptions
} from './presets';

// Plugins
export { cssInjectPlugin, blockEditorPlugin } from './plugins';
export type { BlockEditorOptions } from './plugins';
