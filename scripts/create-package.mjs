#!/usr/bin/env node

/**
 * create-package - ES Engine 包脚手架工具
 *
 * 使用方法:
 *   node scripts/create-package.mjs <package-name> [options]
 *
 * 选项:
 *   --type, -t <type>     包类型: runtime-only | plugin | editor-only
 *   --scope, -s <scope>   npm scope (默认: @esengine)
 *   --external            外部模式，用于用户在自己项目中创建插件
 *
 * 示例:
 *   # 内部开发 (monorepo 内，使用 workspace:*)
 *   node scripts/create-package.mjs my-plugin --type plugin
 *
 *   # 外部用户 (独立项目，使用版本号)
 *   node scripts/create-package.mjs my-plugin --type plugin --external --scope @mycompany
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');
const TEMPLATES_DIR = path.join(PACKAGES_DIR, 'build-config', 'templates');

const PACKAGE_TYPES = {
    'runtime-only': {
        description: '纯运行时库 (不含编辑器代码)',
        examples: 'core, math, components'
    },
    'plugin': {
        description: '插件包 (同时包含 runtime 和 editor 模块)',
        examples: 'ui, tilemap, behavior-tree'
    },
    'editor-only': {
        description: '纯编辑器包 (仅用于编辑器)',
        examples: 'editor-core, node-editor'
    }
};

const CATEGORIES = [
    'core',
    'rendering',
    'physics',
    'ai',
    'ui',
    'audio',
    'input',
    'networking',
    'tools',
    'other'
];

// 默认 scope
const DEFAULT_SCOPE = '@esengine';

// ES Engine 核心包的最低版本要求
const ESENGINE_VERSION = '^2.0.0';

function parseArgs(args) {
    const result = {
        name: null,
        type: null,
        scope: null,
        bExternal: false  // 外部模式标记
    };

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--type' || args[i] === '-t') {
            result.type = args[i + 1];
            i++;
        } else if (args[i] === '--scope' || args[i] === '-s') {
            result.scope = args[i + 1];
            i++;
        } else if (args[i] === '--external' || args[i] === '-e') {
            result.bExternal = true;
        } else if (!args[i].startsWith('-')) {
            result.name = args[i];
        }
    }

    return result;
}

function createReadlineInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

async function question(rl, prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            resolve(answer.trim());
        });
    });
}

async function selectOption(rl, prompt, options) {
    console.log(prompt);
    options.forEach((opt, i) => {
        console.log(`  ${i + 1}. ${opt.label}${opt.description ? ` - ${opt.description}` : ''}`);
    });

    while (true) {
        const answer = await question(rl, '请选择 (输入数字): ');
        const index = parseInt(answer, 10) - 1;
        if (index >= 0 && index < options.length) {
            return options[index].value;
        }
        console.log('无效选择，请重试');
    }
}

function toPascalCase(str) {
    return str
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}

function processTemplate(content, variables) {
    let result = content;
    for (const [key, value] of Object.entries(variables)) {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return result;
}

function copyTemplateDir(srcDir, destDir, variables) {
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    const entries = fs.readdirSync(srcDir, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name);
        let destName = entry.name.replace('.template', '');

        // 处理文件名中的模板变量
        destName = processTemplate(destName, variables);

        const destPath = path.join(destDir, destName);

        if (entry.isDirectory()) {
            copyTemplateDir(srcPath, destPath, variables);
        } else {
            const content = fs.readFileSync(srcPath, 'utf-8');
            const processedContent = processTemplate(content, variables);
            fs.writeFileSync(destPath, processedContent, 'utf-8');
            console.log(`  创建: ${path.relative(PACKAGES_DIR, destPath)}`);
        }
    }
}

async function main() {
    console.log('\n🚀 ES Engine 包创建工具\n');

    const args = parseArgs(process.argv.slice(2));
    const rl = createReadlineInterface();

    try {
        // 0. 确定模式：内部 (monorepo) 还是外部 (独立项目)
        let bExternal = args.bExternal;
        if (!args.bExternal && !args.scope) {
            // 自动检测：如果在 monorepo 根目录运行，默认内部模式
            const bIsMonorepo = fs.existsSync(path.join(ROOT_DIR, 'pnpm-workspace.yaml'));
            if (!bIsMonorepo) {
                bExternal = true;
            }
        }

        // 1. 获取 scope
        let scope = args.scope;
        if (!scope) {
            if (bExternal) {
                // 外部模式必须指定 scope
                scope = await question(rl, 'npm scope (例如: @mycompany): ');
                if (!scope) {
                    console.error('❌ 外部模式必须指定 scope');
                    process.exit(1);
                }
            } else {
                scope = DEFAULT_SCOPE;
            }
        }
        // 确保 scope 以 @ 开头
        if (!scope.startsWith('@')) {
            scope = '@' + scope;
        }

        // 2. 获取包名
        let packageName = args.name;
        if (!packageName) {
            packageName = await question(rl, '包名 (例如: my-plugin): ');
        }

        if (!packageName || !/^[a-z][a-z0-9-]*$/.test(packageName)) {
            console.error('❌ 无效的包名，必须以小写字母开头，只能包含小写字母、数字和连字符');
            process.exit(1);
        }

        // 检查包是否已存在
        const packageDir = path.join(PACKAGES_DIR, packageName);
        if (fs.existsSync(packageDir)) {
            console.error(`❌ 包 ${packageName} 已存在`);
            process.exit(1);
        }

        // 3. 获取包类型
        let packageType = args.type;
        if (!packageType || !PACKAGE_TYPES[packageType]) {
            packageType = await selectOption(rl, '\n选择包类型:', [
                { value: 'runtime-only', label: 'runtime-only', description: PACKAGE_TYPES['runtime-only'].description },
                { value: 'plugin', label: 'plugin', description: PACKAGE_TYPES['plugin'].description },
                { value: 'editor-only', label: 'editor-only', description: PACKAGE_TYPES['editor-only'].description }
            ]);
        }

        // 4. 获取描述
        const description = await question(rl, '\n包描述: ') || `${packageName} package`;

        // 5. 获取显示名称
        const displayName = await question(rl, `\n显示名称 (默认: ${toPascalCase(packageName)}): `) || toPascalCase(packageName);

        // 6. 插件类型需要选择分类
        let category = 'other';
        if (packageType === 'plugin') {
            category = await selectOption(rl, '\n选择插件分类:', CATEGORIES.map(c => ({ value: c, label: c })));
        }

        const modeLabel = bExternal ? '外部 (npm install)' : '内部 (workspace:*)';
        console.log('\n📦 创建包...\n');
        console.log(`  模式: ${modeLabel}`);
        console.log(`  Scope: ${scope}`);
        console.log(`  Full name: ${scope}/${packageName}\n`);

        // 准备模板变量
        // 依赖版本：内部用 workspace:*，外部用具体版本
        const depVersion = bExternal ? ESENGINE_VERSION : 'workspace:*';

        const variables = {
            scope,
            name: packageName,
            fullName: `${scope}/${packageName}`,
            pascalName: toPascalCase(packageName),
            description,
            displayName,
            category,
            depVersion  // 用于 package.json 中的依赖版本
        };

        // 复制模板
        const templateDir = path.join(TEMPLATES_DIR, packageType);
        if (!fs.existsSync(templateDir)) {
            console.error(`❌ 模板目录不存在: ${templateDir}`);
            process.exit(1);
        }

        copyTemplateDir(templateDir, packageDir, variables);

        // 重命名特殊文件
        if (packageType === 'plugin') {
            // RuntimeModule.ts.template -> {name}RuntimeModule.ts
            const runtimeModuleSrc = path.join(packageDir, 'src', 'RuntimeModule.ts');
            const runtimeModuleDest = path.join(packageDir, 'src', `${toPascalCase(packageName)}RuntimeModule.ts`);
            if (fs.existsSync(runtimeModuleSrc)) {
                fs.renameSync(runtimeModuleSrc, runtimeModuleDest);
            }

            // Plugin.ts.template -> {name}Plugin.ts
            const pluginSrc = path.join(packageDir, 'src', 'editor', 'Plugin.ts');
            const pluginDest = path.join(packageDir, 'src', 'editor', `${toPascalCase(packageName)}Plugin.ts`);
            if (fs.existsSync(pluginSrc)) {
                fs.renameSync(pluginSrc, pluginDest);
            }
        }

        console.log('\n✅ 包创建成功!\n');
        console.log('下一步:');
        console.log(`  1. cd packages/${packageName}`);
        console.log(`  2. pnpm install`);
        console.log(`  3. 开始编写代码`);
        console.log(`  4. pnpm run build`);

        if (packageType === 'plugin') {
            console.log('\n插件开发提示:');
            console.log('  - runtime.ts: 纯运行时代码 (不能导入 React!)');
            console.log('  - editor/: 编辑器模块 (可以使用 React)');
            console.log('  - plugin.json: 插件描述文件');
        }

    } finally {
        rl.close();
    }
}

main().catch(console.error);
