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
