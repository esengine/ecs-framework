#!/usr/bin/env node
/**
 * Copy Engine Modules Script
 * 复制引擎模块脚本
 *
 * Copies module.json and dist/index.js from each engine module package
 * to packages/editor-app/dist/engine/{moduleId}/ directory.
 * 将每个引擎模块包的 module.json 和 dist/index.js 复制到
 * packages/editor-app/dist/engine/{moduleId}/ 目录。
 *
 * This ensures the same directory structure is used in development and production.
 * 这确保开发和生产环境使用相同的目录结构。
 *
 * Usage:
 *   node scripts/copy-engine-modules.mjs
 *   pnpm run copy-modules
 *
 * Output structure:
 *   packages/editor-app/dist/
 *     engine/
 *       index.json          <- Module registry index
 *       sprite/
 *         module.json
 *         index.js
 *       tilemap/
 *         module.json
 *         index.js
 *       sprite-editor/
 *         index.js
 *       ...
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const packagesDir = path.join(rootDir, 'packages');
const outputDir = path.join(packagesDir, 'editor-app', 'dist', 'engine');

/**
 * Get all engine modules (packages with module.json)
 * 获取所有引擎模块（带 module.json 的包）
 */
function getEngineModules() {
    const modules = [];

    let packages;
    try {
        packages = fs.readdirSync(packagesDir);
    } catch {
        console.error(`[copy-modules] Error: Cannot read packages directory: ${packagesDir}`);
        return modules;
    }

    for (const pkg of packages) {
        const pkgDir = path.join(packagesDir, pkg);
        const moduleJsonPath = path.join(pkgDir, 'module.json');

        // Skip if not a directory
        try {
            if (!fs.statSync(pkgDir).isDirectory()) continue;
        } catch {
            continue;
        }

        // Skip if no module.json
        if (!fs.existsSync(moduleJsonPath)) continue;

        try {
            const moduleJson = JSON.parse(fs.readFileSync(moduleJsonPath, 'utf-8'));

            // Only include if isEngineModule is not explicitly false
            if (moduleJson.isEngineModule !== false) {
                modules.push({
                    id: moduleJson.id || pkg,
                    name: moduleJson.name || `@esengine/${pkg}`,
                    displayName: moduleJson.displayName || pkg,
                    packageDir: pkgDir,
                    moduleJsonPath,
                    distPath: path.join(pkgDir, 'dist', 'index.js'),
                    editorPackage: moduleJson.editorPackage,
                    isCore: moduleJson.isCore || false,
                    category: moduleJson.category || 'Other'
                });
            }
        } catch (err) {
            console.warn(`  ⚠ Warning: Failed to parse ${moduleJsonPath}: ${err.message}`);
        }
    }

    return modules;
}

/**
 * Copy a single runtime module to output directory
 * 将单个运行时模块复制到输出目录
 */
function copyModule(module) {
    const moduleOutputDir = path.join(outputDir, module.id);

    // Create output directory
    if (!fs.existsSync(moduleOutputDir)) {
        fs.mkdirSync(moduleOutputDir, { recursive: true });
    }

    // Copy module.json
    const destModuleJson = path.join(moduleOutputDir, 'module.json');
    fs.copyFileSync(module.moduleJsonPath, destModuleJson);

    // Copy dist/index.js if exists
    let hasRuntime = false;
    let sizeKB = 'N/A';

    if (fs.existsSync(module.distPath)) {
        const destIndexJs = path.join(moduleOutputDir, 'index.js');
        fs.copyFileSync(module.distPath, destIndexJs);

        // Also copy source map if exists
        const sourceMapPath = module.distPath + '.map';
        if (fs.existsSync(sourceMapPath)) {
            fs.copyFileSync(sourceMapPath, destIndexJs + '.map');
        }

        const stats = fs.statSync(module.distPath);
        sizeKB = (stats.size / 1024).toFixed(1);
        hasRuntime = true;
    }

    return { hasRuntime, sizeKB };
}

/**
 * Copy an editor package
 * 复制编辑器包
 */
function copyEditorPackage(editorPackageName) {
    // Extract package folder name from @esengine/xxx-editor
    const match = editorPackageName.match(/@esengine\/(.+)/);
    if (!match) return null;

    const pkgName = match[1];
    const pkgDir = path.join(packagesDir, pkgName);
    const distPath = path.join(pkgDir, 'dist', 'index.js');

    if (!fs.existsSync(distPath)) {
        return null;
    }

    const editorOutputDir = path.join(outputDir, pkgName);
    if (!fs.existsSync(editorOutputDir)) {
        fs.mkdirSync(editorOutputDir, { recursive: true });
    }

    const destIndexJs = path.join(editorOutputDir, 'index.js');
    fs.copyFileSync(distPath, destIndexJs);

    // Copy source map if exists
    const sourceMapPath = distPath + '.map';
    if (fs.existsSync(sourceMapPath)) {
        fs.copyFileSync(sourceMapPath, destIndexJs + '.map');
    }

    const stats = fs.statSync(distPath);
    return {
        name: pkgName,
        sizeKB: (stats.size / 1024).toFixed(1)
    };
}

/**
 * Main function
 */
function main() {
    console.log('\n📦 Copying engine modules to editor-app/dist/engine/\n');

    // Ensure editor-app/dist exists
    const editorDistDir = path.join(packagesDir, 'editor-app', 'dist');
    if (!fs.existsSync(editorDistDir)) {
        fs.mkdirSync(editorDistDir, { recursive: true });
    }

    // Clean and recreate output directory
    if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true });
    }
    fs.mkdirSync(outputDir, { recursive: true });

    // Get all engine modules
    const modules = getEngineModules();

    if (modules.length === 0) {
        console.log('  No engine modules found.\n');
        return;
    }

    // Collect editor packages
    const editorPackages = new Set();

    // Copy runtime modules
    console.log('Runtime modules:');
    const moduleInfos = [];

    for (const module of modules) {
        const { hasRuntime, sizeKB } = copyModule(module);

        if (hasRuntime) {
            console.log(`  ✓ ${module.id} (${sizeKB} KB)`);
        } else {
            console.log(`  ○ ${module.id} (config only)`);
        }

        moduleInfos.push({
            id: module.id,
            name: module.name,
            displayName: module.displayName,
            hasRuntime,
            editorPackage: module.editorPackage,
            isCore: module.isCore,
            category: module.category
        });

        if (module.editorPackage) {
            editorPackages.add(module.editorPackage);
        }
    }

    // Copy editor packages
    if (editorPackages.size > 0) {
        console.log('\nEditor packages:');
        for (const editorPkg of editorPackages) {
            const result = copyEditorPackage(editorPkg);
            if (result) {
                console.log(`  ✓ ${result.name} (${result.sizeKB} KB)`);
            } else {
                console.log(`  ⚠ ${editorPkg} (not built)`);
            }
        }
    }

    // Create index.json with all module info
    const indexData = {
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        modules: moduleInfos
    };

    fs.writeFileSync(
        path.join(outputDir, 'index.json'),
        JSON.stringify(indexData, null, 2)
    );

    console.log(`\n✅ Copied ${modules.length} modules to dist/engine/`);
    console.log(`   Index file: dist/engine/index.json\n`);
}

// Run
main();
