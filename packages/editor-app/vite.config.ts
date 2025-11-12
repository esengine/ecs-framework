import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import fs from 'fs';
import path from 'path';

const host = process.env.TAURI_DEV_HOST;

const userProjectPathMap = new Map<string, string>();
const editorPackageMapping = new Map<string, string>();
const editorPackageVersions = new Map<string, string>();

function loadEditorPackages() {
  const packagesDir = path.resolve(__dirname, '..');
  if (!fs.existsSync(packagesDir)) {
    return;
  }

  const packageDirs = fs.readdirSync(packagesDir).filter(dir => {
    const stat = fs.statSync(path.join(packagesDir, dir));
    return stat.isDirectory();
  });

  for (const dir of packageDirs) {
    const packageJsonPath = path.join(packagesDir, dir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        if (packageJson.name && packageJson.name.startsWith('@esengine/')) {
          const mainFile = packageJson.module || packageJson.main;
          if (mainFile) {
            const entryPath = path.join(packagesDir, dir, mainFile);
            if (fs.existsSync(entryPath)) {
              editorPackageMapping.set(packageJson.name, entryPath);
            }
          }
          if (packageJson.version) {
            editorPackageVersions.set(packageJson.name, packageJson.version);
          }
        }
      } catch (e) {
        console.error(`[Vite] Failed to read package.json for ${dir}:`, e);
      }
    }
  }
}

loadEditorPackages();

const userProjectPlugin = () => ({
  name: 'user-project-middleware',
  resolveId(id: string, importer?: string) {
    if (id.startsWith('/@user-project/')) {
      return id;
    }

    // 处理从 /@user-project/ 模块导入的相对路径
    if (importer && importer.startsWith('/@user-project/')) {
      if (id.startsWith('./') || id.startsWith('../')) {
        const importerDir = path.dirname(importer.substring('/@user-project'.length));
        let resolvedPath = path.join(importerDir, id);
        resolvedPath = resolvedPath.replace(/\\/g, '/');

        // 尝试添加扩展名
        let projectPath: string | null = null;
        for (const [, p] of userProjectPathMap) {
          projectPath = p;
          break;
        }

        if (projectPath) {
          const possibleExtensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.js'];
          for (const ext of possibleExtensions) {
            const testPath = path.join(projectPath, resolvedPath + ext);
            if (fs.existsSync(testPath) && !fs.statSync(testPath).isDirectory()) {
              return '/@user-project' + (resolvedPath + ext).replace(/\\/g, '/');
            }
          }
        }

        return '/@user-project' + resolvedPath;
      }
    }

    return null;
  },
  load(id: string) {
    if (id.startsWith('/@user-project/')) {
      const relativePath = decodeURIComponent(id.substring('/@user-project'.length));

      let projectPath: string | null = null;
      for (const [, p] of userProjectPathMap) {
        projectPath = p;
        break;
      }

      if (!projectPath) {
        throw new Error('Project path not set. Please open a project first.');
      }

      const filePath = path.join(projectPath, relativePath);
      console.log('[Vite] Loading file:', id);
      console.log('[Vite] Resolved path:', filePath);

      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      if (fs.statSync(filePath).isDirectory()) {
        throw new Error(`Path is a directory: ${filePath}`);
      }

      let content = fs.readFileSync(filePath, 'utf-8');

      editorPackageMapping.forEach((srcPath, packageName) => {
        const escapedPackageName = packageName.replace(/\//g, '\\/');
        const regex = new RegExp(`from\\s+['"]${escapedPackageName}['"]`, 'g');
        content = content.replace(
          regex,
          `from "/@fs/${srcPath.replace(/\\/g, '/')}"`
        );
      });

      // 直接返回源码，让 Vite 的转换管道处理
      // Vite 已经正确配置了 TypeScript 和装饰器的转换
      return content;
    }
    return null;
  },
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {

      if (req.url === '/@ecs-framework-shim') {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end('export * from "/@fs/' + path.resolve(__dirname, '../core/src/index.ts').replace(/\\/g, '/') + '";');
        return;
      }

      if (req.url === '/@user-project-set-path') {
        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const { path: projectPath } = JSON.parse(body);
            userProjectPathMap.set('current', projectPath);
            res.statusCode = 200;
            res.end('OK');
          } catch (err) {
            res.statusCode = 400;
            res.end('Invalid request');
          }
        });
        return;
      }

      if (req.url === '/@plugin-generator') {
        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk.toString();
        });
        req.on('end', async () => {
          try {
            const { pluginName, pluginVersion, outputPath, includeExample } = JSON.parse(body);

            const pluginPath = path.join(outputPath, pluginName);

            if (fs.existsSync(pluginPath)) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Plugin directory already exists' }));
              return;
            }

            fs.mkdirSync(pluginPath, { recursive: true });
            fs.mkdirSync(path.join(pluginPath, 'src'), { recursive: true });
            if (includeExample) {
              fs.mkdirSync(path.join(pluginPath, 'src', 'nodes'), { recursive: true });
            }

            const coreVersion = editorPackageVersions.get('@esengine/ecs-framework') || '2.2.8';
            const editorCoreVersion = editorPackageVersions.get('@esengine/editor-core') || '1.0.0';
            const behaviorTreeVersion = editorPackageVersions.get('@esengine/behavior-tree') || '1.0.0';

            const packageJson = {
              name: pluginName,
              version: pluginVersion,
              description: `Behavior tree plugin for ${pluginName}`,
              main: 'dist/index.js',
              module: 'dist/index.js',
              types: 'dist/index.d.ts',
              exports: {
                '.': {
                  types: './dist/index.d.ts',
                  import: './dist/index.js',
                  development: {
                    types: './src/index.ts',
                    import: './src/index.ts'
                  }
                }
              },
              scripts: {
                clean: 'rimraf bin dist tsconfig.tsbuildinfo',
                prebuild: 'npm run clean',
                build: 'npm run build:tsc && npm run copy:css && npm run build:rollup',
                'build:tsc': 'tsc',
                'copy:css': 'node scripts/copy-css.js',
                'build:rollup': 'rollup -c',
                dev: 'rollup -c -w',
                watch: 'tsc --watch'
              },
              peerDependencies: {
                '@esengine/ecs-framework': `^${coreVersion}`,
                '@esengine/editor-core': `^${editorCoreVersion}`
              },
              dependencies: {
                '@esengine/behavior-tree': `^${behaviorTreeVersion}`
              },
              devDependencies: {
                'typescript': '^5.8.3',
                '@rollup/plugin-commonjs': '^28.0.1',
                '@rollup/plugin-node-resolve': '^15.3.0',
                'rollup': '^4.28.1',
                'rollup-plugin-copy': '^3.5.0',
                'rollup-plugin-dts': '^6.1.1',
                'rollup-plugin-postcss': '^4.0.2',
                'rimraf': '^6.0.1'
              }
            };
            fs.writeFileSync(
              path.join(pluginPath, 'package.json'),
              JSON.stringify(packageJson, null, 2)
            );

            const tsconfig = {
              compilerOptions: {
                target: 'ES2020',
                module: 'ESNext',
                moduleResolution: 'node',
                declaration: true,
                outDir: './dist',
                strict: true,
                esModuleInterop: true,
                skipLibCheck: true,
                forceConsistentCasingInFileNames: true,
                experimentalDecorators: true,
                emitDecoratorMetadata: true
              },
              include: ['src/**/*'],
              exclude: ['node_modules', 'dist']
            };
            fs.writeFileSync(
              path.join(pluginPath, 'tsconfig.json'),
              JSON.stringify(tsconfig, null, 2)
            );

            const pluginInstanceName = `${pluginName.replace(/-/g, '')}Plugin`;

            const indexTs = includeExample
              ? `import './nodes/ExampleAction';

export { ${pluginInstanceName} } from './plugin';
export * from './nodes/ExampleAction';

// 默认导出插件实例
import { ${pluginInstanceName} as pluginInstance } from './plugin';
export default pluginInstance;
`
              : `export { ${pluginInstanceName} } from './plugin';

// 默认导出插件实例
import { ${pluginInstanceName} as pluginInstance } from './plugin';
export default pluginInstance;
`;
            fs.writeFileSync(path.join(pluginPath, 'src', 'index.ts'), indexTs);

            const pluginTs = `import type { IEditorPlugin } from '@esengine/editor-core';
import { EditorPluginCategory } from '@esengine/editor-core';
import type { Core, ServiceContainer } from '@esengine/ecs-framework';
import { NodeTemplates } from '@esengine/behavior-tree';
import type { NodeTemplate } from '@esengine/behavior-tree';
import { t, setLocale } from './locales';

export class ${pluginName.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}Plugin implements IEditorPlugin {
    readonly name = '${pluginName}';
    readonly version = '${pluginVersion}';
    readonly category = EditorPluginCategory.Tool;

    get displayName(): string {
        return t('plugin.name');
    }

    get description(): string {
        return t('plugin.description');
    }

    setLocale(locale: string): void {
        setLocale(locale);
    }

    async install(core: Core, services: ServiceContainer): Promise<void> {
        console.log('[${pluginName}] Plugin installed');
    }

    async uninstall(): Promise<void> {
        console.log('[${pluginName}] Plugin uninstalled');
    }

    getNodeTemplates(): NodeTemplate[] {
        const templates = NodeTemplates.getAllTemplates();
        return templates.map(template => ({
            ...template,
            displayName: t(template.displayName),
            description: t(template.description),
            properties: template.properties?.map(prop => ({
                ...prop,
                label: t(prop.label),
                description: prop.description ? t(prop.description) : undefined
            }))
        }));
    }
}

export const ${pluginName.replace(/-/g, '')}Plugin = new ${pluginName.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}Plugin();
`;
            fs.writeFileSync(path.join(pluginPath, 'src', 'plugin.ts'), pluginTs);

            const localesDir = path.join(pluginPath, 'src', 'locales');
            if (!fs.existsSync(localesDir)) {
              fs.mkdirSync(localesDir, { recursive: true });
            }

            const localesIndexTs = `export type LocaleKey = 'zh' | 'en';

export const translations: Record<LocaleKey, Record<string, string>> = {
    zh: {
        'plugin.name': '${pluginName}',
        'plugin.description': '${pluginName} 行为树插件',
        'ExampleAction.name': '示例动作',
        'ExampleAction.description': '这是一个示例动作节点',
        'ExampleAction.message.label': '消息内容',
        'ExampleAction.message.description': '要打印的消息'
    },
    en: {
        'plugin.name': '${pluginName}',
        'plugin.description': 'Behavior tree plugin for ${pluginName}',
        'ExampleAction.name': 'Example Action',
        'ExampleAction.description': 'This is an example action node',
        'ExampleAction.message.label': 'Message',
        'ExampleAction.message.description': 'The message to print'
    }
};

let currentLocale: LocaleKey = 'zh';

export function setLocale(locale: string) {
    currentLocale = (locale === 'en' ? 'en' : 'zh') as LocaleKey;
}

export function t(key: string): string {
    return translations[currentLocale]?.[key] || translations['en']?.[key] || key;
}
`;
            fs.writeFileSync(path.join(localesDir, 'index.ts'), localesIndexTs);

            if (includeExample) {
              const exampleActionTs = `import { TaskStatus, NodeType } from '@esengine/behavior-tree';
import { INodeExecutor, NodeExecutionContext, BindingHelper, NodeExecutorMetadata } from '@esengine/behavior-tree';

/**
 * 示例动作执行器
 */
@NodeExecutorMetadata({
    implementationType: 'ExampleAction',
    nodeType: NodeType.Action,
    displayName: 'ExampleAction.name',
    description: 'ExampleAction.description',
    category: '自定义',
    configSchema: {
        message: {
            type: 'string',
            default: 'Hello from example action!',
            description: 'ExampleAction.message.description',
            supportBinding: true
        }
    }
})
export class ExampleAction implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const message = BindingHelper.getValue<string>(context, 'message', '');
        console.log('[ExampleAction]', message);
        return TaskStatus.Success;
    }
}
`;
              fs.writeFileSync(
                path.join(pluginPath, 'src', 'nodes', 'ExampleAction.ts'),
                exampleActionTs
              );
            }

            const readme = `# ${pluginName}

Behavior tree plugin for ${pluginName}

## Installation

\`\`\`bash
npm install
npm run build
\`\`\`

## Usage

在编辑器中加载此插件：

\`\`\`typescript
import { ${pluginName.replace(/-/g, '')}Plugin } from '${pluginName}';
import { EditorPluginManager } from '@esengine/editor-core';

// 在编辑器启动时注册插件
const pluginManager = Core.services.resolve(EditorPluginManager);
await pluginManager.installEditor(${pluginName.replace(/-/g, '')}Plugin);
\`\`\`

## 多语言支持

本插件内置中英文多语言支持，使用简单的 i18n key 方式。

### 设置语言

\`\`\`typescript
// 设置为中文
${pluginName.replace(/-/g, '')}Plugin.setLocale('zh');

// 设置为英文
${pluginName.replace(/-/g, '')}Plugin.setLocale('en');
\`\`\`

### 翻译文件结构

在 \`src/locales/index.ts\` 中，使用扁平化的 key-value 结构：

\`\`\`typescript
export const translations = {
    zh: {
        'plugin.name': '插件名称',
        'plugin.description': '插件描述',
        'NodeName.name': '节点显示名',
        'NodeName.description': '节点描述',
        'NodeName.property.label': '属性标签',
        'NodeName.property.description': '属性描述'
    },
    en: {
        'plugin.name': 'Plugin Name',
        // ...
    }
};
\`\`\`

### 在代码中使用

\`\`\`typescript
import { TaskStatus, NodeType } from '@esengine/behavior-tree';
import { INodeExecutor, NodeExecutionContext, BindingHelper, NodeExecutorMetadata } from '@esengine/behavior-tree';

@NodeExecutorMetadata({
    implementationType: 'YourNode',
    nodeType: NodeType.Action,
    displayName: 'YourNode.name',
    description: 'YourNode.description',
    category: '自定义',
    configSchema: {
        propertyName: {
            type: 'string',
            default: '',
            description: 'YourNode.propertyName.description',
            supportBinding: true
        }
    }
})
export class YourNode implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const propertyName = BindingHelper.getValue<string>(context, 'propertyName', '');
        // 执行逻辑
        return TaskStatus.Success;
    }
}
\`\`\`

## 目录结构

\`\`\`
${pluginName}/
├── src/
│   ├── locales/           # 多语言文件
│   │   └── index.ts
│   ├── nodes/             # 行为树节点
│   │   └── ExampleAction.ts
│   ├── plugin.ts          # 插件主类
│   └── index.ts           # 导出入口
├── package.json
├── tsconfig.json
└── README.md
\`\`\`
`;
            fs.writeFileSync(path.join(pluginPath, 'README.md'), readme);

            // 创建 scripts 目录并生成 copy-css.js
            const scriptsDir = path.join(pluginPath, 'scripts');
            fs.mkdirSync(scriptsDir, { recursive: true });

            const copyCssJs = `import { readdirSync, statSync, copyFileSync, mkdirSync } from 'fs';
import { join, dirname, relative } from 'path';

function copyCSS(srcDir, destDir) {
    const files = readdirSync(srcDir);

    for (const file of files) {
        const srcPath = join(srcDir, file);
        const stat = statSync(srcPath);

        if (stat.isDirectory()) {
            copyCSS(srcPath, destDir);
        } else if (file.endsWith('.css')) {
            const relativePath = relative('src', srcPath);
            const destPath = join(destDir, relativePath);

            mkdirSync(dirname(destPath), { recursive: true });
            copyFileSync(srcPath, destPath);
            console.log(\`Copied: \${relativePath}\`);
        }
    }
}

copyCSS('src', 'bin');
console.log('CSS files copied successfully!');
`;
            fs.writeFileSync(path.join(scriptsDir, 'copy-css.js'), copyCssJs);

            // 生成 rollup.config.cjs
            const rollupConfig = `const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const dts = require('rollup-plugin-dts').default;
const postcss = require('rollup-plugin-postcss');

// 忽略 CSS 导入的插件
const ignoreCss = () => ({
    name: 'ignore-css',
    resolveId(source) {
        if (source.endsWith('.css')) {
            return { id: source, external: true };
        }
        return null;
    }
});

const external = [
    'react',
    'react/jsx-runtime',
    'zustand',
    'zustand/middleware',
    'lucide-react',
    '@esengine/ecs-framework',
    '@esengine/editor-core',
    '@esengine/behavior-tree',
    'tsyringe',
    '@tauri-apps/api/core',
    '@tauri-apps/plugin-dialog'
];

module.exports = [
    // ES模块构建
    {
        input: 'bin/index.js',
        output: {
            file: 'dist/index.js',
            format: 'es',
            sourcemap: true,
            exports: 'named'
        },
        plugins: [
            resolve({
                extensions: ['.js', '.jsx']
            }),
            postcss({
                inject: true,
                minimize: false
            }),
            commonjs()
        ],
        external,
        onwarn(warning, warn) {
            if (warning.code === 'CIRCULAR_DEPENDENCY' || warning.code === 'THIS_IS_UNDEFINED') {
                return;
            }
            warn(warning);
        }
    },

    // 类型定义构建
    {
        input: 'bin/index.d.ts',
        output: {
            file: 'dist/index.d.ts',
            format: 'es'
        },
        plugins: [
            dts({
                respectExternal: true
            })
        ],
        external
    }
];
`;
            fs.writeFileSync(path.join(pluginPath, 'rollup.config.cjs'), rollupConfig);

            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, path: pluginPath }));
          } catch (err: any) {
            console.error('[Vite] Failed to generate plugin:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
        return;
      }

      next();
    });
  }
});

export default defineConfig({
  plugins: [
    ...react({
      tsDecorators: true,
    }),
    userProjectPlugin() as any
  ],
  clearScreen: false,
  server: {
    host: host || false,
    port: 5173,
    strictPort: true,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 5183,
        }
      : undefined,
    fs: {
      strict: false,
    },
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: 'es2021',
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});
