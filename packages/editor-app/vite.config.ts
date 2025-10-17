import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { transformSync } from 'esbuild';

const host = process.env.TAURI_DEV_HOST;

const userProjectPathMap = new Map<string, string>();
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
            }
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
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.url?.startsWith('/@user-project/')) {
        const urlWithoutQuery = req.url.split('?')[0];
        const relativePath = decodeURIComponent(urlWithoutQuery.substring('/@user-project'.length));

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
          let content = fs.readFileSync(filePath, 'utf-8');

          editorPackageMapping.forEach((srcPath, packageName) => {
            const escapedPackageName = packageName.replace(/\//g, '\\/');
            const regex = new RegExp(`from\\s+['"]${escapedPackageName}['"]`, 'g');
            content = content.replace(
              regex,
              `from "/@fs/${srcPath.replace(/\\/g, '/')}"`
            );
          });

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
