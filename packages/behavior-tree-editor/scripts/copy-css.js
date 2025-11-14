import { readdirSync, statSync, copyFileSync, mkdirSync } from 'fs';
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
            console.log(`Copied: ${relativePath}`);
        }
    }
}

copyCSS('src', 'bin');
console.log('CSS files copied successfully!');
