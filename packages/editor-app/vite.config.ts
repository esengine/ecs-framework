import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import fs from 'fs';
import path from 'path';

function copyPluginModulesPlugin(): Plugin {
  const modulePaths = [
    { name: 'editor-runtime', path: path.resolve(__dirname, '../editor-runtime/dist') },
    { name: 'behavior-tree', path: path.resolve(__dirname, '../behavior-tree/dist') },
  ];

  /**
   * 递归复制目录中的 JS 文件
   */
  function copyJsFilesRecursively(srcDir: string, destDir: string, relativePath: string = '') {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        // 递归复制子目录
        const subDestDir = path.join(destDir, entry.name);
        if (!fs.existsSync(subDestDir)) {
          fs.mkdirSync(subDestDir, { recursive: true });
        }
        copyJsFilesRecursively(srcPath, subDestDir, relPath);
      } else if (entry.name.endsWith('.js')) {
        // 复制 JS 文件
        const destPath = path.join(destDir, entry.name);
        fs.copyFileSync(srcPath, destPath);
        console.log(`[copy-plugin-modules] Copied ${relPath}`);
      }
    }
  }

  return {
    name: 'copy-plugin-modules',
    writeBundle(options) {
      const outDir = options.dir || 'dist';
      const assetsDir = path.join(outDir, 'assets');

      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }

      for (const mod of modulePaths) {
        if (!fs.existsSync(mod.path)) {
          console.warn(`[copy-plugin-modules] ${mod.name} dist not found: ${mod.path}`);
          continue;
        }
        copyJsFilesRecursively(mod.path, assetsDir);
      }
    }
  };
}

/**
 * Plugin to copy engine modules after each build.
 * 每次构建后复制引擎模块的插件。
 */
function copyEngineModulesPlugin(): Plugin {
  const packagesDir = path.resolve(__dirname, '..');

  function getEngineModules() {
    const modules: Array<{
      id: string;
      name: string;
      displayName: string;
      packageDir: string;
      moduleJsonPath: string;
      distPath: string;
      editorPackage?: string;
      isCore: boolean;
      category: string;
    }> = [];

    let packages: string[];
    try {
      packages = fs.readdirSync(packagesDir);
    } catch {
      return modules;
    }

    for (const pkg of packages) {
      const pkgDir = path.join(packagesDir, pkg);
      const moduleJsonPath = path.join(pkgDir, 'module.json');

      try {
        if (!fs.statSync(pkgDir).isDirectory()) continue;
      } catch {
        continue;
      }

      if (!fs.existsSync(moduleJsonPath)) continue;

      try {
        const moduleJson = JSON.parse(fs.readFileSync(moduleJsonPath, 'utf-8'));
        if (moduleJson.isEngineModule !== false) {
          // Use outputPath from module.json, default to "dist/index.js"
          const outputPath = moduleJson.outputPath || 'dist/index.js';
          const distPath = path.join(pkgDir, outputPath);

          modules.push({
            id: moduleJson.id || pkg,
            name: moduleJson.name || `@esengine/${pkg}`,
            displayName: moduleJson.displayName || pkg,
            packageDir: pkgDir,
            moduleJsonPath,
            distPath,
            editorPackage: moduleJson.editorPackage,
            isCore: moduleJson.isCore || false,
            category: moduleJson.category || 'Other'
          });
        }
      } catch {
        // Ignore parse errors
      }
    }

    return modules;
  }

  return {
    name: 'copy-engine-modules',
    writeBundle(options) {
      const outDir = options.dir || 'dist';
      const engineDir = path.join(outDir, 'engine');

      // Clean and recreate engine directory
      if (fs.existsSync(engineDir)) {
        fs.rmSync(engineDir, { recursive: true });
      }
      fs.mkdirSync(engineDir, { recursive: true });

      const modules = getEngineModules();
      const moduleInfos: Array<{
        id: string;
        name: string;
        displayName: string;
        hasRuntime: boolean;
        editorPackage?: string;
        isCore: boolean;
        category: string;
        jsSize?: number;
        requiresWasm?: boolean;
        wasmSize?: number;
        wasmFiles?: string[];
      }> = [];

      const editorPackages = new Set<string>();

      /**
       * Calculate total WASM file size in a directory.
       * 计算目录中 WASM 文件的总大小。
       */
      function getWasmSize(pkgDir: string): number {
        let totalSize = 0;
        const checkDirs = [
          pkgDir,
          path.join(pkgDir, 'pkg'),
          path.join(pkgDir, 'dist')
        ];

        for (const dir of checkDirs) {
          if (!fs.existsSync(dir)) continue;
          try {
            const files = fs.readdirSync(dir);
            for (const file of files) {
              if (file.endsWith('.wasm')) {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                totalSize += stat.size;
              }
            }
          } catch {
            // Ignore errors
          }
        }
        return totalSize;
      }

      console.log(`[copy-engine-modules] Copying ${modules.length} modules to dist/engine/`);

      for (const module of modules) {
        const moduleOutputDir = path.join(engineDir, module.id);
        fs.mkdirSync(moduleOutputDir, { recursive: true });

        // Read full module.json for additional fields
        // 读取完整 module.json 获取额外字段
        let moduleJson: Record<string, unknown> = {};
        try {
          moduleJson = JSON.parse(fs.readFileSync(module.moduleJsonPath, 'utf-8'));
        } catch {
          // Ignore parse errors
        }

        // Copy module.json
        fs.copyFileSync(module.moduleJsonPath, path.join(moduleOutputDir, 'module.json'));

        // Copy dist/index.js if exists
        let hasRuntime = false;
        let jsSize = 0;
        if (fs.existsSync(module.distPath)) {
          fs.copyFileSync(module.distPath, path.join(moduleOutputDir, 'index.js'));
          // Get JS file size
          jsSize = fs.statSync(module.distPath).size;
          // Copy source map if exists
          const sourceMapPath = module.distPath + '.map';
          if (fs.existsSync(sourceMapPath)) {
            fs.copyFileSync(sourceMapPath, path.join(moduleOutputDir, 'index.js.map'));
          }
          // Copy type definitions if exists
          // 复制类型定义文件（如果存在）
          // Handle both .js and .mjs extensions
          // 处理 .js 和 .mjs 两种扩展名
          const distDir = path.dirname(module.distPath);
          const dtsPath = path.join(distDir, 'index.d.ts');
          if (fs.existsSync(dtsPath)) {
            fs.copyFileSync(dtsPath, path.join(moduleOutputDir, 'index.d.ts'));
          }
          hasRuntime = true;

          // Copy additional included files (e.g., chunks)
          // 复制额外包含的文件（如 chunk）
          const includes = moduleJson.includes as string[] | undefined;
          if (includes && includes.length > 0) {
            const distDir = path.dirname(module.distPath);
            for (const pattern of includes) {
              // Convert glob pattern to regex
              const regexPattern = pattern
                .replace(/\\/g, '\\\\')
                .replace(/\./g, '\\.')
                .replace(/\*/g, '.*')
                .replace(/\?/g, '.');
              const regex = new RegExp(`^${regexPattern}$`);

              // Find matching files in dist directory
              if (fs.existsSync(distDir)) {
                const files = fs.readdirSync(distDir);
                for (const file of files) {
                  if (regex.test(file)) {
                    const srcFile = path.join(distDir, file);
                    const destFile = path.join(moduleOutputDir, file);
                    fs.copyFileSync(srcFile, destFile);
                    jsSize += fs.statSync(srcFile).size;
                    // Copy source map for included file if exists
                    const mapFile = srcFile + '.map';
                    if (fs.existsSync(mapFile)) {
                      fs.copyFileSync(mapFile, destFile + '.map');
                    }
                    console.log(`[copy-engine-modules] Copied include to ${module.id}/: ${file}`);
                  }
                }
              }
            }
          }
        }

        // Calculate WASM size and copy WASM files if module requires WASM
        // 如果模块需要 WASM，计算 WASM 大小并复制 WASM 文件
        const requiresWasm = moduleJson.requiresWasm === true;
        let wasmSize = 0;
        const copiedWasmFiles: string[] = [];
        if (requiresWasm) {
          wasmSize = getWasmSize(module.packageDir);
          if (wasmSize > 0) {
            console.log(`[copy-engine-modules] ${module.id}: WASM size = ${(wasmSize / 1024).toFixed(1)} KB`);
          }

          // Copy WASM files from wasmPaths defined in module.json
          // wasmPaths 现在是相对于源包目录的路径，如 "rapier_wasm2d_bg.wasm"
          // 需要找到实际的 WASM 文件并复制到输出的模块目录
          const wasmPaths = moduleJson.wasmPaths as string[] | undefined;
          if (wasmPaths && wasmPaths.length > 0) {
            for (const wasmRelPath of wasmPaths) {
              const wasmFileName = path.basename(wasmRelPath);

              // 查找源 WASM 文件的可能位置
              // wasmPaths 里配置的是相对路径，实际文件在源包里
              // 对于 @esengine/rapier2d，WASM 在 packages/rapier2d/pkg/ 下
              const possibleSrcPaths = [
                // 直接在包目录下（如果 wasmRelPath 就是文件名）
                path.join(module.packageDir, wasmRelPath),
                // 在包的 pkg 目录下（wasm-pack 输出）
                path.join(module.packageDir, 'pkg', wasmFileName),
                // 在包的 dist 目录下
                path.join(module.packageDir, 'dist', wasmFileName),
              ];

              // 对于依赖其他包 WASM 的情况，检查依赖包
              // 例如 physics-rapier2d 依赖 rapier2d 的 WASM
              const depMatch = moduleJson.name?.toString().match(/@esengine\/(.+)/);
              if (depMatch) {
                // 检查同名的依赖包（去掉 physics- 前缀）
                const baseName = depMatch[1].replace('physics-', '');
                possibleSrcPaths.push(
                  path.join(packagesDir, baseName, 'pkg', wasmFileName),
                  path.join(packagesDir, baseName, wasmFileName)
                );
              }

              let copied = false;
              for (const srcPath of possibleSrcPaths) {
                if (fs.existsSync(srcPath)) {
                  const destPath = path.join(moduleOutputDir, wasmFileName);
                  fs.copyFileSync(srcPath, destPath);
                  copiedWasmFiles.push(wasmFileName);
                  console.log(`[copy-engine-modules] Copied WASM to ${module.id}/: ${wasmFileName}`);
                  copied = true;
                  break;
                }
              }

              if (!copied) {
                console.warn(`[copy-engine-modules] WASM file not found: ${wasmRelPath} (tried ${possibleSrcPaths.length} paths)`);
              }
            }
          }

          // Copy pkg directory if exists (for WASM JS bindings like rapier2d)
          // 如果存在 pkg 目录则复制（用于 WASM JS 绑定如 rapier2d）
          // The JS and WASM files must be in the same directory for import.meta.url to work
          // JS 和 WASM 文件必须在同一目录才能让 import.meta.url 正常工作
          const pkgDir = path.join(module.packageDir, 'pkg');
          if (fs.existsSync(pkgDir)) {
            const pkgOutputDir = path.join(moduleOutputDir, 'pkg');
            fs.mkdirSync(pkgOutputDir, { recursive: true });
            const pkgFiles = fs.readdirSync(pkgDir);
            for (const file of pkgFiles) {
              // Copy both JS and WASM files to pkg directory
              // 将 JS 和 WASM 文件都复制到 pkg 目录
              if (file.endsWith('.js') || file.endsWith('.wasm')) {
                const srcFile = path.join(pkgDir, file);
                const destFile = path.join(pkgOutputDir, file);
                fs.copyFileSync(srcFile, destFile);
                console.log(`[copy-engine-modules] Copied pkg to ${module.id}/pkg/: ${file}`);
              }
            }
          }
        }

        moduleInfos.push({
          id: module.id,
          name: module.name,
          displayName: module.displayName,
          hasRuntime,
          editorPackage: module.editorPackage,
          isCore: module.isCore,
          category: module.category,
          // Only include jsSize if there's actual runtime code
          // 只有实际有运行时代码时才包含 jsSize
          jsSize: jsSize > 0 ? jsSize : undefined,
          requiresWasm: requiresWasm || undefined,
          wasmSize: wasmSize > 0 ? wasmSize : undefined,
          // WASM files that were copied to dist/wasm/
          // 复制到 dist/wasm/ 的 WASM 文件
          wasmFiles: copiedWasmFiles.length > 0 ? copiedWasmFiles : undefined
        });

        if (module.editorPackage) {
          editorPackages.add(module.editorPackage);
        }
      }

      // Copy editor packages
      for (const editorPkg of editorPackages) {
        const match = editorPkg.match(/@esengine\/(.+)/);
        if (!match) continue;

        const pkgName = match[1];
        const pkgDir = path.join(packagesDir, pkgName);
        const distPath = path.join(pkgDir, 'dist', 'index.js');

        if (!fs.existsSync(distPath)) continue;

        const editorOutputDir = path.join(engineDir, pkgName);
        fs.mkdirSync(editorOutputDir, { recursive: true });
        fs.copyFileSync(distPath, path.join(editorOutputDir, 'index.js'));

        const sourceMapPath = distPath + '.map';
        if (fs.existsSync(sourceMapPath)) {
          fs.copyFileSync(sourceMapPath, path.join(editorOutputDir, 'index.js.map'));
        }
      }

      // Create index.json
      const indexData = {
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        modules: moduleInfos
      };

      fs.writeFileSync(
        path.join(engineDir, 'index.json'),
        JSON.stringify(indexData, null, 2)
      );

      console.log(`[copy-engine-modules] Done! Created dist/engine/index.json`);
    }
  };
}

const host = process.env.TAURI_DEV_HOST;
const wasmPackages: string[] = [];

/**
 * 检查包目录是否包含 WASM 文件
 */
function hasWasmFiles(dirPath: string): boolean {
  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      if (file.endsWith('.wasm')) return true;
      if (file === 'pkg') {
        const pkgPath = path.join(dirPath, file);
        const pkgFiles = fs.readdirSync(pkgPath);
        if (pkgFiles.some(f => f.endsWith('.wasm'))) return true;
      }
    }
  } catch {
    // Ignore errors
  }
  return false;
}

/**
 * 扫描 packages 目录检测 WASM 包
 */
function detectWasmPackages() {
  const packagesDir = path.resolve(__dirname, '..');
  if (!fs.existsSync(packagesDir)) return;

  const packageDirs = fs.readdirSync(packagesDir).filter(dir => {
    const stat = fs.statSync(path.join(packagesDir, dir));
    return stat.isDirectory();
  });

  for (const dir of packageDirs) {
    const packageJsonPath = path.join(packagesDir, dir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const packageName = packageJson.name;
        const packageDir = path.join(packagesDir, dir);

        if (packageName && hasWasmFiles(packageDir)) {
          wasmPackages.push(packageName);
          console.log(`[Vite] Detected WASM package: ${packageName}`);
        }
      } catch {
        // Ignore errors
      }
    }
  }

  // 扫描 node_modules
  const nodeModulesDir = path.resolve(__dirname, 'node_modules');
  if (fs.existsSync(nodeModulesDir)) {
    scanNodeModulesForWasm(nodeModulesDir);
  }
}

function scanNodeModulesForWasm(nodeModulesDir: string) {
  try {
    const entries = fs.readdirSync(nodeModulesDir);
    for (const entry of entries) {
      if (entry.startsWith('.')) continue;

      const entryPath = path.join(nodeModulesDir, entry);
      const stat = fs.statSync(entryPath);
      if (!stat.isDirectory()) continue;

      if (entry.startsWith('@')) {
        const scopedPackages = fs.readdirSync(entryPath);
        for (const scopedPkg of scopedPackages) {
          const scopedPath = path.join(entryPath, scopedPkg);
          if (fs.statSync(scopedPath).isDirectory()) {
            if (!wasmPackages.includes(`${entry}/${scopedPkg}`) && hasWasmFiles(scopedPath)) {
              wasmPackages.push(`${entry}/${scopedPkg}`);
              console.log(`[Vite] Detected WASM package in node_modules: ${entry}/${scopedPkg}`);
            }
          }
        }
      } else {
        if (!wasmPackages.includes(entry) && hasWasmFiles(entryPath)) {
          wasmPackages.push(entry);
          console.log(`[Vite] Detected WASM package in node_modules: ${entry}`);
        }
      }
    }
  } catch {
    // Ignore errors
  }
}

detectWasmPackages();

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
    ...react({
      tsDecorators: true,
    }),
    copyPluginModulesPlugin(),
    copyEngineModulesPlugin(),
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
  esbuild: {
    // 保留类名和函数名，用于跨包插件服务匹配
    keepNames: true,
  },
  optimizeDeps: {
    include: ['tslib', 'react', 'react-dom', 'zustand', 'lucide-react'],
    exclude: wasmPackages,
  },
});
