#!/usr/bin/env node
/**
 * Update module.json files with actual bundle sizes from dist/index.js
 *
 * Run after build to update estimatedSize in module.json files
 * Usage: node scripts/update-module-sizes.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packagesDir = path.resolve(__dirname, '../packages');

function updateModuleSizes() {
    const packages = fs.readdirSync(packagesDir);
    let updated = 0;
    let skipped = 0;

    for (const pkg of packages) {
        const pkgDir = path.join(packagesDir, pkg);
        const moduleJsonPath = path.join(pkgDir, 'module.json');
        const distIndexPath = path.join(pkgDir, 'dist', 'index.js');

        // Skip if no module.json
        if (!fs.existsSync(moduleJsonPath)) {
            continue;
        }

        // Skip if no dist/index.js
        if (!fs.existsSync(distIndexPath)) {
            console.log(`  Skip ${pkg}: no dist/index.js`);
            skipped++;
            continue;
        }

        try {
            // Get actual file size
            const stat = fs.statSync(distIndexPath);
            const actualSize = stat.size;

            // Read module.json - use file descriptor to avoid race condition
            const fd = fs.openSync(moduleJsonPath, 'r+');
            try {
                const content = fs.readFileSync(fd, 'utf-8');
                const moduleJson = JSON.parse(content);
                const oldSize = moduleJson.estimatedSize;

                // Update if different
                if (oldSize !== actualSize) {
                    moduleJson.estimatedSize = actualSize;
                    const newContent = JSON.stringify(moduleJson, null, 2) + '\n';
                    fs.ftruncateSync(fd, 0);
                    fs.writeSync(fd, newContent, 0, 'utf-8');
                    const oldKB = oldSize ? (oldSize / 1024).toFixed(1) : 'N/A';
                    const newKB = (actualSize / 1024).toFixed(1);
                    console.log(`  ${pkg}: ${oldKB} KB -> ${newKB} KB`);
                    updated++;
                }
            } finally {
                fs.closeSync(fd);
            }
        } catch (err) {
            console.error(`  Error processing ${pkg}:`, err.message);
        }
    }

    console.log(`\nUpdated ${updated} modules, skipped ${skipped}`);
}

console.log('Updating module sizes from dist/index.js...\n');
updateModuleSizes();
