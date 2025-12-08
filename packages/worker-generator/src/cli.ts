#!/usr/bin/env node

/**
 * Worker Generator CLI
 * 从 WorkerEntitySystem 子类生成 Worker 文件
 * Generate Worker files from WorkerEntitySystem subclasses
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs';
import { parseWorkerSystems } from './parser';
import { generateWorkerFiles } from './generator';
import type { GeneratorConfig } from './types';

const packageJson = require('../package.json');

const program = new Command();

program
    .name('esengine-worker-gen')
    .description('Generate Worker files from WorkerEntitySystem classes for WeChat Mini Game and other platforms')
    .version(packageJson.version);

program
    .option('-s, --src <dir>', 'Source directory to scan', './src')
    .option('-o, --out <dir>', 'Output directory for Worker files', './workers')
    .option('-w, --wechat', 'Generate WeChat Mini Game compatible code', false)
    .option('-m, --mapping', 'Generate worker-mapping.json file', true)
    .option('-t, --tsconfig <path>', 'Path to tsconfig.json')
    .option('-v, --verbose', 'Verbose output', false)
    .action((options) => {
        run(options);
    });

function run(options: {
    src: string;
    out: string;
    wechat: boolean;
    mapping: boolean;
    tsconfig?: string;
    verbose: boolean;
}) {
    console.log(chalk.cyan('\n🔧 ESEngine Worker Generator\n'));

    // 解析路径
    // Resolve paths
    const srcDir = path.resolve(process.cwd(), options.src);
    const outDir = path.resolve(process.cwd(), options.out);

    // 检查源目录是否存在
    // Check if source directory exists
    if (!fs.existsSync(srcDir)) {
        console.error(chalk.red(`Error: Source directory not found: ${srcDir}`));
        process.exit(1);
    }

    // 查找 tsconfig.json
    // Find tsconfig.json
    let tsConfigPath = options.tsconfig;
    if (!tsConfigPath) {
        const defaultTsConfig = path.join(process.cwd(), 'tsconfig.json');
        if (fs.existsSync(defaultTsConfig)) {
            tsConfigPath = defaultTsConfig;
        }
    }

    const config: GeneratorConfig = {
        srcDir,
        outDir,
        wechat: options.wechat,
        generateMapping: options.mapping,
        tsConfigPath,
        verbose: options.verbose,
    };

    console.log(chalk.gray(`Source directory: ${srcDir}`));
    console.log(chalk.gray(`Output directory: ${outDir}`));
    console.log(chalk.gray(`WeChat mode: ${options.wechat ? 'Yes' : 'No'}`));
    if (tsConfigPath) {
        console.log(chalk.gray(`TypeScript config: ${tsConfigPath}`));
    }
    console.log();

    // 解析源文件
    // Parse source files
    console.log(chalk.yellow('Scanning for WorkerEntitySystem classes...'));
    const systems = parseWorkerSystems(config);

    if (systems.length === 0) {
        console.log(chalk.yellow('\n⚠️  No WorkerEntitySystem subclasses found.'));
        console.log(chalk.gray('Make sure your classes:'));
        console.log(chalk.gray('  - Extend WorkerEntitySystem'));
        console.log(chalk.gray('  - Have a workerProcess method'));
        console.log(chalk.gray('  - Are in .ts files under the source directory'));
        return;
    }

    console.log(chalk.green(`\n✓ Found ${systems.length} WorkerEntitySystem class(es):`));
    for (const system of systems) {
        const configStatus = system.workerScriptPath
            ? chalk.green(`✓ workerScriptPath: '${system.workerScriptPath}'`)
            : chalk.yellow('⚠ No workerScriptPath configured');
        console.log(chalk.gray(`  - ${system.className}`));
        console.log(chalk.gray(`    ${path.relative(process.cwd(), system.filePath)}`));
        console.log(`    ${configStatus}`);
    }
    console.log();

    // 生成 Worker 文件
    // Generate Worker files
    console.log(chalk.yellow('Generating Worker files...'));
    const result = generateWorkerFiles(systems, config);

    // 输出结果
    // Output results
    console.log();
    if (result.success.length > 0) {
        console.log(chalk.green(`✓ Successfully generated ${result.success.length} Worker file(s):`));
        for (const item of result.success) {
            const relativePath = path.relative(process.cwd(), item.outputPath).replace(/\\/g, '/');
            if (item.configuredPath) {
                console.log(chalk.green(`  ✓ ${item.className} -> ${relativePath}`));
            } else {
                console.log(chalk.yellow(`  ⚠ ${item.className} -> ${relativePath} (需要配置 workerScriptPath)`));
            }
        }
    }

    if (result.errors.length > 0) {
        console.log(chalk.red(`\n✗ Failed to generate ${result.errors.length} Worker file(s):`));
        for (const item of result.errors) {
            console.log(chalk.red(`  - ${item.className}: ${item.error}`));
        }
    }

    // 提示未配置 workerScriptPath 的类
    // Remind about classes without workerScriptPath
    if (result.skipped.length > 0) {
        console.log(chalk.yellow('\n⚠️  以下类未配置 workerScriptPath，请在构造函数中添加配置:'));
        console.log(chalk.yellow('   The following classes need workerScriptPath configuration:\n'));
        for (const item of result.skipped) {
            console.log(chalk.white(`   // ${item.className}`));
            console.log(chalk.cyan(`   super(matcher, {`));
            console.log(chalk.cyan(`       workerScriptPath: '${item.suggestedPath}',`));
            console.log(chalk.cyan(`       // ... 其他配置`));
            console.log(chalk.cyan(`   });`));
            console.log();
        }
    }

    // 使用提示（只有当有已配置路径的成功项时）
    // Usage tips (only when there are success items with configured path)
    const configuredSuccess = result.success.filter(item => item.configuredPath);
    if (configuredSuccess.length > 0) {
        console.log(chalk.green('\n✅ 已按照代码中的 workerScriptPath 配置生成 Worker 文件！'));
        console.log(chalk.gray('   Worker files generated according to workerScriptPath in your code!'));
        console.log(chalk.gray('\n   下一步 | Next steps:'));
        console.log(chalk.gray('   1. 确保 game.json 配置了 workers 目录'));
        console.log(chalk.gray('      Ensure game.json has workers directory configured'));

        if (options.mapping) {
            console.log(chalk.gray('\n   已生成映射文件 | Mapping file generated:'));
            console.log(chalk.white(`   import mapping from '${path.relative(process.cwd(), outDir)}/worker-mapping.json'`));
        }
    }

    console.log();
}

program.parse();
