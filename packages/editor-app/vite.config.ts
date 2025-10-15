import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { transformSync } from 'esbuild';
import JSON5 from 'json5';

const host = process.env.TAURI_DEV_HOST;

const userProjectPathMap = new Map<string, string>();
const userProjectDependencies = new Map<string, Set<string>>();
const cocosEnginePaths = new Map<string, string>();
const allowedPaths = new Set<string>();

const editorPackageMapping = new Map<string, string>();

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
              console.log(`[Vite] Mapped ${packageJson.name} -> ${entryPath}`);
            }
          }
        }
      } catch (e) {
        console.error(`[Vite] Failed to read package.json for ${dir}:`, e);
      }
    }
  }

  console.log(`[Vite] Loaded ${editorPackageMapping.size} editor packages`);
}

loadEditorPackages();

function loadCocosEnginePath(projectPath: string) {
  try {
    const tsconfigPath = path.join(projectPath, 'tsconfig.json');
    if (!fs.existsSync(tsconfigPath)) {
      console.log('[Vite] No tsconfig.json found in user project');
      return;
    }

    const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf-8');
    const tsconfig = JSON5.parse(tsconfigContent);

    if (tsconfig.extends) {
      const extendedPath = path.join(projectPath, tsconfig.extends);
      if (fs.existsSync(extendedPath)) {
        const extendedContent = fs.readFileSync(extendedPath, 'utf-8');
        const extendedConfig = JSON5.parse(extendedContent);

        if (extendedConfig.compilerOptions?.paths?.['db://internal/*']) {
          const cocosInternalPaths = extendedConfig.compilerOptions.paths['db://internal/*'];
          if (cocosInternalPaths && cocosInternalPaths.length > 0) {
            let cocosEnginePath = cocosInternalPaths[0];
            cocosEnginePath = cocosEnginePath.replace(/[\/\\]\*$/, '');
            cocosEnginePath = cocosEnginePath.replace(/[\/\\]editor[\/\\]assets$/, '');

            const exportsBasePath = path.join(cocosEnginePath, 'exports', 'base.ts');
            if (fs.existsSync(exportsBasePath)) {
              cocosEnginePaths.set(projectPath, exportsBasePath);
              allowedPaths.add(cocosEnginePath);
              console.log(`[Vite] Found Cocos Creator engine at: ${exportsBasePath}`);
              console.log(`[Vite] Added Cocos engine path to allowed paths: ${cocosEnginePath}`);
            } else {
              console.log(`[Vite] Cocos engine base.ts not found at: ${exportsBasePath}`);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('[Vite] Failed to load Cocos engine path:', error);
  }
}

function loadUserProjectDependencies(projectPath: string) {
  try {
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.log('[Vite] No package.json found in user project');
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const deps = new Set<string>();

    if (packageJson.dependencies) {
      Object.keys(packageJson.dependencies).forEach(dep => deps.add(dep));
    }
    if (packageJson.devDependencies) {
      Object.keys(packageJson.devDependencies).forEach(dep => deps.add(dep));
    }

    userProjectDependencies.set(projectPath, deps);
    console.log(`[Vite] Loaded ${deps.size} dependencies from user project`);

    loadCocosEnginePath(projectPath);
  } catch (error) {
    console.error('[Vite] Failed to load user project dependencies:', error);
  }
}

const userProjectPlugin = () => ({
  name: 'user-project-middleware',
  configureServer(server: any) {
    allowedPaths.add(path.resolve(__dirname, '..'));

    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.url?.startsWith('/@user-project/')) {
        console.log('[Vite] Received request:', req.url);
        const urlWithoutQuery = req.url.split('?')[0];
        const relativePath = decodeURIComponent(urlWithoutQuery.substring('/@user-project'.length));
        console.log('[Vite] Resolved relative path:', relativePath);

        let projectPath: string | null = null;

        for (const [, path] of userProjectPathMap) {
          projectPath = path;
          break;
        }

        if (!projectPath) {
          res.statusCode = 503;
          res.end('Project path not set. Please open a project first.');
          return;
        }

        const filePath = path.join(projectPath, relativePath);
        console.log('[Vite] Looking for file:', filePath);
        console.log('[Vite] File exists:', fs.existsSync(filePath));

        if (!fs.existsSync(filePath)) {
          console.error('[Vite] File not found:', filePath);
          res.statusCode = 404;
          res.end(`File not found: ${filePath}`);
          return;
        }

        if (fs.statSync(filePath).isDirectory()) {
          res.statusCode = 400;
          res.end(`Path is a directory: ${filePath}`);
          return;
        }

        try {
          console.log('[Vite] Reading and transforming file:', filePath);
          let content = fs.readFileSync(filePath, 'utf-8');

          editorPackageMapping.forEach((srcPath, packageName) => {
            const escapedPackageName = packageName.replace(/\//g, '\\/');
            const regex = new RegExp(`from\\s+['"]${escapedPackageName}['"]`, 'g');
            content = content.replace(
              regex,
              `from "/@fs/${srcPath.replace(/\\/g, '/')}"`
            );
          });

          const deps = userProjectDependencies.get(projectPath);
          if (deps) {
            deps.forEach(dep => {
              if (editorPackageMapping.has(dep)) {
                return;
              }

              const depPath = path.join(projectPath, 'node_modules', dep);
              if (fs.existsSync(depPath)) {
                const packageJsonPath = path.join(depPath, 'package.json');
                if (fs.existsSync(packageJsonPath)) {
                  try {
                    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
                    const mainFile = pkg.module || pkg.main || 'index.js';
                    const entryPath = path.join(depPath, mainFile);

                    if (fs.existsSync(entryPath)) {
                      const escapedDep = dep.replace(/\//g, '\\/').replace(/@/g, '\\@');
                      const regex = new RegExp(`from\\s+['"]${escapedDep}['"]`, 'g');
                      content = content.replace(
                        regex,
                        `from "/@fs/${entryPath.replace(/\\/g, '/')}"`
                      );
                    }
                  } catch (e) {
                    // 忽略解析错误
                  }
                }
              }
            });
          }

          content = content.replace(
            /from\s+['"]cc['"]/g,
            'from "/@cocos-shim"'
          );

          const fileDir = path.dirname(filePath);
          const relativeImportRegex = /from\s+['"](\.\.?\/[^'"]+)['"]/g;
          content = content.replace(relativeImportRegex, (match, importPath) => {
            if (importPath.match(/\.(ts|js|tsx|jsx)$/)) {
              return match;
            }

            const possibleExtensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.js'];
            for (const ext of possibleExtensions) {
              const resolvedPath = path.join(fileDir, importPath + ext);
              if (fs.existsSync(resolvedPath)) {
                const normalizedImport = (importPath + ext).replace(/\\/g, '/');
                return match.replace(importPath, normalizedImport);
              }
            }

            return match;
          });

          const result = transformSync(content, {
            loader: 'ts',
            format: 'esm',
            target: 'es2020',
            sourcemap: 'inline',
            sourcefile: filePath,
          });

          console.log('[Vite] Successfully transformed file:', filePath);
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cache-Control', 'no-cache');
          res.end(result.code);
        } catch (err: any) {
          console.error('[Vite] Failed to transform TypeScript:', err);
          res.statusCode = 500;
          res.end(`Failed to compile: ${err.message}`);
        }
        return;
      }

      if (req.url === '/@ecs-framework-shim') {
        let projectPath: string | null = null;
        for (const [, p] of userProjectPathMap) {
          projectPath = p;
          break;
        }

        if (projectPath) {
          const userFrameworkPath = path.join(projectPath, 'node_modules', '@esengine', 'ecs-framework', 'bin', 'index.js');
          if (fs.existsSync(userFrameworkPath)) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end('export * from "/@fs/' + userFrameworkPath.replace(/\\/g, '/') + '";');
            return;
          }
        }

        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end('export * from "/@fs/' + path.resolve(__dirname, '../core/src/index.ts').replace(/\\/g, '/') + '";');
        return;
      }

      if (req.url === '/@cocos-shim') {
        console.log('[Vite] Using Cocos Creator fallback shim (editor environment)');
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(`
          export default {};
          export class Node {}
          export class Component {}
          export class Vec2 {
            constructor(x = 0, y = 0) { this.x = x; this.y = y; }
            static distance(a, b) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }
            length() { return Math.sqrt(this.x ** 2 + this.y ** 2); }
            normalize() { const len = this.length(); if (len > 0) { this.x /= len; this.y /= len; } return this; }
            set(x, y) { this.x = x; this.y = y; return this; }
          }
          export class Vec3 {
            constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
            static distance(a, b) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2); }
            length() { return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2); }
            normalize() { const len = this.length(); if (len > 0) { this.x /= len; this.y /= len; this.z /= len; } return this; }
            set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
          }
          export class Color { constructor(r = 255, g = 255, b = 255, a = 255) { this.r = r; this.g = g; this.b = b; this.a = a; } }
          export class Quat { constructor(x = 0, y = 0, z = 0, w = 1) { this.x = x; this.y = y; this.z = z; this.w = w; } }
          export function tween() { return { to() { return this; }, call() { return this; }, start() {} }; }
          export function v3(x, y, z) { return new Vec3(x, y, z); }
        `);
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
            allowedPaths.add(projectPath);
            loadUserProjectDependencies(projectPath);
            console.log('[Vite] User project path set to:', projectPath);
            res.statusCode = 200;
            res.end('OK');
          } catch (err) {
            res.statusCode = 400;
            res.end('Invalid request');
          }
        });
        return;
      }

      next();
    });
  }
});

export default defineConfig({
  plugins: [react(), userProjectPlugin()],
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
