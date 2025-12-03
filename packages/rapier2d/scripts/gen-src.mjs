/**
 * Generate 2D-specific source code from rapier.js source.
 * 从 rapier.js 源码生成 2D 专用代码。
 *
 * This script:
 * 1. Copies TypeScript source from rapier.js/src.ts
 * 2. Removes #if DIM3 ... #endif blocks (keeps only 2D code)
 * 3. Overwrites raw.ts and init.ts with 2D-specific versions
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, cpSync, existsSync, renameSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(__dirname, '..');
const rapierRoot = join(packageRoot, '..', '..', 'thirdparty', 'rapier.js');
const srcTsDir = join(rapierRoot, 'src.ts');
const src2dDir = join(rapierRoot, 'rapier-compat', 'src2d');
const outputDir = join(packageRoot, 'src');

// Check if rapier.js exists
if (!existsSync(srcTsDir)) {
    console.error(`Error: rapier.js source not found at ${rapierRoot}`);
    console.error('Please clone https://github.com/esengine/rapier.js.git to thirdparty/rapier.js');
    process.exit(1);
}

/**
 * Remove #if DIM3 ... #endif blocks from source code
 */
function removeDim3Blocks(content) {
    // Remove lines between #if DIM3 and #endif (inclusive)
    const lines = content.split('\n');
    const result = [];
    let skipDepth = 0;

    for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('//#if DIM3') || trimmed.startsWith('// #if DIM3')) {
            skipDepth++;
            continue;
        }

        if (skipDepth > 0 && (trimmed.startsWith('//#endif') || trimmed.startsWith('// #endif'))) {
            skipDepth--;
            continue;
        }

        if (skipDepth === 0) {
            // Also remove #if DIM2 and its #endif (but keep the content)
            if (trimmed.startsWith('//#if DIM2') || trimmed.startsWith('// #if DIM2')) {
                continue;
            }
            if (trimmed.startsWith('//#endif') || trimmed.startsWith('// #endif')) {
                continue;
            }
            result.push(line);
        }
    }

    return result.join('\n');
}

/**
 * Process a single TypeScript file
 */
function processFile(srcPath, destPath) {
    const content = readFileSync(srcPath, 'utf-8');
    const processed = removeDim3Blocks(content);
    writeFileSync(destPath, processed);
}

/**
 * Recursively copy and process directory
 */
function processDirectory(srcDir, destDir) {
    mkdirSync(destDir, { recursive: true });

    const entries = readdirSync(srcDir, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = join(srcDir, entry.name);
        const destPath = join(destDir, entry.name);

        if (entry.isDirectory()) {
            processDirectory(srcPath, destPath);
        } else if (entry.name.endsWith('.ts')) {
            processFile(srcPath, destPath);
            console.log(`Processed: ${entry.name}`);
        }
    }
}

// Main
console.log('Generating 2D source code...');
console.log(`Source: ${srcTsDir}`);
console.log(`Output: ${outputDir}`);

// Step 1: Copy and process src.ts directory
processDirectory(srcTsDir, outputDir);

// Step 2: Overwrite with 2D-specific files (raw.ts, init.ts)
if (existsSync(src2dDir)) {
    const entries = readdirSync(src2dDir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.ts')) {
            const srcPath = join(src2dDir, entry.name);
            const destPath = join(outputDir, entry.name);
            cpSync(srcPath, destPath);
            console.log(`Overwrote: ${entry.name} (2D-specific)`);
        }
    }
}

// Step 3: Rename rapier.ts to index.ts
const rapierTs = join(outputDir, 'rapier.ts');
const indexTs = join(outputDir, 'index.ts');
if (existsSync(rapierTs)) {
    renameSync(rapierTs, indexTs);
    console.log('Renamed: rapier.ts -> index.ts');
}

console.log('Done!');
