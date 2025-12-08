# @esengine/build-config

ES Engine 统一构建配置包，提供标准化的 Vite 配置预设和共享插件。

## 快速开始

### 创建新包

使用脚手架工具快速创建新包：

```bash
# 交互式创建
node scripts/create-package.mjs

# 或指定参数
node scripts/create-package.mjs my-plugin --type plugin
```

### 包类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `runtime-only` | 纯运行时库，不含编辑器代码 | core, math, components |
| `plugin` | 插件包，同时有 runtime 和 editor 入口 | ui, tilemap, behavior-tree |
| `editor-only` | 纯编辑器包，仅用于编辑器 | editor-core, node-editor |

## 使用预设

### 1. runtime-only（纯运行时包）

```typescript
// vite.config.ts
import { runtimeOnlyPreset } from '@esengine/build-config/presets';

export default runtimeOnlyPreset({
    root: __dirname
});
```

目录结构：
```
packages/my-lib/
├── src/
│   └── index.ts          # 主入口
├── vite.config.ts
└── package.json
```

### 2. plugin（插件包）

```typescript
// vite.config.ts
import { pluginPreset } from '@esengine/build-config/presets';

export default pluginPreset({
    root: __dirname,
    hasCSS: true  // 如果有 CSS 文件
});
```

目录结构：
```
packages/my-plugin/
├── src/
│   ├── index.ts          # 主入口（导出全部）
│   ├── runtime.ts        # 运行时入口（不含 React!）
│   ├── MyRuntimeModule.ts
│   └── editor/
│       ├── index.ts      # 编辑器模块
│       └── MyPlugin.ts
├── plugin.json           # 插件描述文件
├── vite.config.ts
└── package.json
```

生成的 exports：
```json
{
    ".": "./dist/index.js",
    "./runtime": "./dist/runtime.js",
    "./editor": "./dist/editor/index.js",
    "./plugin.json": "./plugin.json"
}
```

### 3. editor-only（纯编辑器包）

```typescript
// vite.config.ts
import { editorOnlyPreset } from '@esengine/build-config/presets';

export default editorOnlyPreset({
    root: __dirname,
    hasReact: true,
    hasCSS: true
});
```

## 共享插件

### CSS 注入插件

将 CSS 内联到 JS 中，避免单独的 CSS 文件：

```typescript
import { cssInjectPlugin } from '@esengine/build-config/plugins';

export default defineConfig({
    plugins: [cssInjectPlugin()]
});
```

### 阻止编辑器代码泄漏

在运行时构建中检测并阻止编辑器代码被打包：

```typescript
import { blockEditorPlugin } from '@esengine/build-config/plugins';

export default defineConfig({
    plugins: [
        blockEditorPlugin({ bIsRuntimeBuild: true })
    ]
});
```

## Runtime vs Editor 分离规则

### ✅ runtime.ts 中可以：
- 导入 @esengine/ecs-framework
- 导入 @esengine/ecs-components
- 导入其他包的 `/runtime` 路径

### ❌ runtime.ts 中不能：
- 导入 `react`、`react-dom`
- 导入 `@esengine/editor-core`
- 导入 `lucide-react` 等 UI 库
- 导入任何包的 `/editor` 路径

### 示例

```typescript
// ✅ 正确
import { Core } from '@esengine/ecs-framework';
import { UIRuntimeModule } from '@esengine/ui/runtime';

// ❌ 错误 - 会把编辑器代码打包进来
import { UIPlugin } from '@esengine/ui';          // 主入口包含编辑器
import { UIPlugin } from '@esengine/ui/editor';   // 直接导入编辑器
import React from 'react';                        // React 不应在运行时
```

## 迁移现有包

### 从 Rollup 迁移到 Vite 预设

1. 安装依赖：
```bash
pnpm add -D @esengine/build-config vite vite-plugin-dts
```

2. 替换 `rollup.config.js` 为 `vite.config.ts`：
```typescript
import { pluginPreset } from '@esengine/build-config/presets';

export default pluginPreset({
    root: __dirname,
    hasCSS: true
});
```

3. 更新 `package.json` 的 scripts：
```json
{
    "scripts": {
        "build": "vite build",
        "build:watch": "vite build --watch"
    }
}
```

4. 删除旧的 rollup 配置和依赖。

## API 参考

### runtimeOnlyPreset(options)

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| root | string | - | 包根目录（必填） |
| entry | string | 'src/index.ts' | 入口文件 |
| external | (string\|RegExp)[] | [] | 额外的外部依赖 |
| viteConfig | Partial<UserConfig> | {} | 额外的 Vite 配置 |

### pluginPreset(options)

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| root | string | - | 包根目录（必填） |
| entries.main | string | 'src/index.ts' | 主入口 |
| entries.runtime | string | 'src/runtime.ts' | 运行时入口 |
| entries.editor | string | 'src/editor/index.ts' | 编辑器入口 |
| hasCSS | boolean | false | 是否包含 CSS |
| hasPluginJson | boolean | true | 是否导出 plugin.json |
| external | (string\|RegExp)[] | [] | 额外的外部依赖 |

### editorOnlyPreset(options)

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| root | string | - | 包根目录（必填） |
| entry | string | 'src/index.ts' | 入口文件 |
| hasReact | boolean | true | 是否包含 React |
| hasCSS | boolean | false | 是否包含 CSS |
| external | (string\|RegExp)[] | [] | 额外的外部依赖 |
