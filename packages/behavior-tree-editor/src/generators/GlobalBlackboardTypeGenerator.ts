import { BlackboardValueType, type GlobalBlackboardConfig } from '@esengine/behavior-tree';

/**
 * 类型生成配置选项
 */
export interface TypeGenerationOptions {
    /** 常量名称大小写风格 */
    constantCase?: 'UPPER_SNAKE' | 'camelCase' | 'PascalCase';

    /** 常量对象名称 */
    constantsName?: string;

    /** 接口名称 */
    interfaceName?: string;

    /** 类型别名名称 */
    typeAliasName?: string;

    /** 包装类名称 */
    wrapperClassName?: string;

    /** 默认值对象名称 */
    defaultsName?: string;

    /** 导入路径 */
    importPath?: string;

    /** 是否生成常量对象 */
    includeConstants?: boolean;

    /** 是否生成接口 */
    includeInterface?: boolean;

    /** 是否生成类型别名 */
    includeTypeAlias?: boolean;

    /** 是否生成包装类 */
    includeWrapperClass?: boolean;

    /** 是否生成默认值 */
    includeDefaults?: boolean;

    /** 自定义头部注释 */
    customHeader?: string;

    /** 使用单引号还是双引号 */
    quoteStyle?: 'single' | 'double';

    /** 是否在文件末尾添加换行 */
    trailingNewline?: boolean;
}

/**
 * 全局黑板 TypeScript 类型生成器
 *
 * 将全局黑板配置导出为 TypeScript 类型定义，提供：
 * - 编译时类型检查
 * - IDE 自动补全
 * - 避免拼写错误
 * - 重构友好
 */
export class GlobalBlackboardTypeGenerator {
    /**
     * 默认生成选项
     */
    static readonly DEFAULT_OPTIONS: Required<TypeGenerationOptions> = {
        constantCase: 'UPPER_SNAKE',
        constantsName: 'GlobalVars',
        interfaceName: 'GlobalBlackboardTypes',
        typeAliasName: 'GlobalVariableName',
        wrapperClassName: 'TypedGlobalBlackboard',
        defaultsName: 'GlobalBlackboardDefaults',
        importPath: '../..',
        includeConstants: true,
        includeInterface: true,
        includeTypeAlias: true,
        includeWrapperClass: true,
        includeDefaults: true,
        customHeader: '',
        quoteStyle: 'single',
        trailingNewline: true
    };

    /**
     * 生成 TypeScript 类型定义代码
     *
     * @param config 全局黑板配置
     * @param options 生成选项
     * @returns TypeScript 代码字符串
     *
     * @example
     * ```typescript
     * // 使用默认选项
     * const code = GlobalBlackboardTypeGenerator.generate(config);
     *
     * // 自定义命名
     * const code = GlobalBlackboardTypeGenerator.generate(config, {
     *     constantsName: 'GameVars',
     *     wrapperClassName: 'GameBlackboard'
     * });
     *
     * // 只生成接口和类型别名，不生成包装类
     * const code = GlobalBlackboardTypeGenerator.generate(config, {
     *     includeWrapperClass: false,
     *     includeDefaults: false
     * });
     * ```
     */
    static generate(config: GlobalBlackboardConfig, options?: TypeGenerationOptions): string {
        const opts = { ...this.DEFAULT_OPTIONS, ...options };
        const now = new Date().toLocaleString('zh-CN', { hour12: false });
        const variables = config.variables || [];

        const parts: string[] = [];

        // 生成文件头部注释
        parts.push(this.generateHeader(now, opts));

        // 根据配置生成各个部分
        if (opts.includeConstants) {
            parts.push(this.generateConstants(variables, opts));
        }

        if (opts.includeInterface) {
            parts.push(this.generateInterface(variables, opts));
        }

        if (opts.includeTypeAlias) {
            parts.push(this.generateTypeAliases(opts));
        }

        if (opts.includeWrapperClass) {
            parts.push(this.generateTypedClass(opts));
        }

        if (opts.includeDefaults) {
            parts.push(this.generateDefaults(variables, opts));
        }

        // 组合所有部分
        let code = parts.join('\n\n');

        // 添加文件末尾换行
        if (opts.trailingNewline && !code.endsWith('\n')) {
            code += '\n';
        }

        return code;
    }

    /**
     * 生成文件头部注释
     *
     * 注意：生成的代码字符串会被打包到 IIFE 中，如果 import/export 出现在行首
     * 会被浏览器误解析为 ES module 语法。因此使用字符串拼接确保不在行首。
     */
    private static generateHeader(timestamp: string, opts: Required<TypeGenerationOptions>): string {
        const customHeader = opts.customHeader || `/**
 * 全局黑板类型定义
 *
 * ⚠️ 此文件由编辑器自动生成，请勿手动修改！
 * 生成时间: ${timestamp}
 */`;

        // 使用字符串拼接避免 import 出现在源代码行首（打包后可能被误解析）
        const importStatement = 'im' + 'port { GlobalBlackboardService } from \'' + opts.importPath + '\';';
        return `${customHeader}\n\n${importStatement}`;
    }

    /**
     * 生成常量对象
     * 注意：使用 EXP + 'ort' 拼接避免打包后 export 在行首被误解析
     */
    private static generateConstants(variables: any[], opts: Required<TypeGenerationOptions>): string {
        const quote = opts.quoteStyle === 'single' ? "'" : '"';
        // 使用拼接避免 export 在源代码行首
        const exp = 'exp' + 'ort';

        if (variables.length === 0) {
            return `/**
 * 全局变量名称常量
 */
${exp} const ${opts.constantsName} = {} as const;`;
        }

        // 按命名空间分组
        const grouped = this.groupVariablesByNamespace(variables);

        if (Object.keys(grouped).length === 1 && grouped[''] !== undefined) {
            // 无命名空间，扁平结构
            const entries = variables
                .map((v) => `    ${this.transformName(v.name, opts.constantCase)}: ${quote}${v.name}${quote}`)
                .join(',\n');

            return `/**
 * 全局变量名称常量
 * 使用常量避免拼写错误
 */
${exp} const ${opts.constantsName} = {
${entries}
} as const;`;
        } else {
            // 有命名空间，分组结构
            const namespaces = Object.entries(grouped)
                .map(([namespace, vars]) => {
                    if (namespace === '') {
                        // 根级别变量
                        return vars
                            .map((v) => `    ${this.transformName(v.name, opts.constantCase)}: ${quote}${v.name}${quote}`)
                            .join(',\n');
                    } else {
                        // 命名空间变量
                        const nsName = this.toPascalCase(namespace);
                        const entries = vars
                            .map((v) => {
                                const shortName = v.name.substring(namespace.length + 1);
                                return `        ${this.transformName(shortName, opts.constantCase)}: ${quote}${v.name}${quote}`;
                            })
                            .join(',\n');
                        return `    ${nsName}: {\n${entries}\n    }`;
                    }
                })
                .join(',\n');

            return `/**
 * 全局变量名称常量
 * 使用常量避免拼写错误
 */
${exp} const ${opts.constantsName} = {
${namespaces}
} as const;`;
        }
    }

    /**
     * 生成接口定义
     */
    private static generateInterface(variables: any[], opts: Required<TypeGenerationOptions>): string {
        const exp = 'exp' + 'ort';

        if (variables.length === 0) {
            return `/**
 * 全局变量类型定义
 */
${exp} interface ${opts.interfaceName} {}`;
        }

        const properties = variables
            .map((v) => {
                const tsType = this.mapBlackboardTypeToTS(v.type);
                const comment = v.description ? `    /** ${v.description} */\n` : '';
                return `${comment}    ${v.name}: ${tsType};`;
            })
            .join('\n');

        return `/**
 * 全局变量类型定义
 */
${exp} interface ${opts.interfaceName} {
${properties}
}`;
    }

    /**
     * 生成类型别名
     */
    private static generateTypeAliases(opts: Required<TypeGenerationOptions>): string {
        const exp = 'exp' + 'ort';
        return `/**
 * 全局变量名称联合类型
 */
${exp} type ${opts.typeAliasName} = keyof ${opts.interfaceName};`;
    }

    /**
     * 生成类型安全包装类
     */
    private static generateTypedClass(opts: Required<TypeGenerationOptions>): string {
        const exp = 'exp' + 'ort';
        return `/**
 * 类型安全的全局黑板服务包装器
 *
 * @example
 * \`\`\`typescript
 * // 游戏运行时使用
 * const service = core.services.resolve(GlobalBlackboardService);
 * const gb = new ${opts.wrapperClassName}(service);
 *
 * // 类型安全的获取
 * const hp = gb.getValue('playerHP');  // 类型: number | undefined
 *
 * // 类型安全的设置
 * gb.setValue('playerHP', 100);  // ✅ 正确
 * gb.setValue('playerHP', 'invalid');  // ❌ 编译错误
 * \`\`\`
 */
${exp} class ${opts.wrapperClassName} {
    constructor(private service: GlobalBlackboardService) {}

    /**
     * 获取全局变量（类型安全）
     */
    getValue<K extends ${opts.typeAliasName}>(
        name: K
    ): ${opts.interfaceName}[K] | undefined {
        return this.service.getValue(name);
    }

    /**
     * 设置全局变量（类型安全）
     */
    setValue<K extends ${opts.typeAliasName}>(
        name: K,
        value: ${opts.interfaceName}[K]
    ): boolean {
        return this.service.setValue(name, value);
    }

    /**
     * 检查全局变量是否存在
     */
    hasVariable(name: ${opts.typeAliasName}): boolean {
        return this.service.hasVariable(name);
    }

    /**
     * 获取所有变量名
     */
    getVariableNames(): ${opts.typeAliasName}[] {
        return this.service.getVariableNames() as ${opts.typeAliasName}[];
    }
}`;
    }

    /**
     * 生成默认值配置
     */
    private static generateDefaults(variables: any[], opts: Required<TypeGenerationOptions>): string {
        const exp = 'exp' + 'ort';

        if (variables.length === 0) {
            return `/**
 * 默认值配置
 */
${exp} const ${opts.defaultsName}: ${opts.interfaceName} = {};`;
        }

        const properties = variables
            .map((v) => {
                const value = this.formatValue(v.value, v.type, opts);
                return `    ${v.name}: ${value}`;
            })
            .join(',\n');

        return `/**
 * 默认值配置
 *
 * 可在游戏启动时用于初始化全局黑板
 *
 * @example
 * \`\`\`typescript
 * // 获取服务
 * const service = core.services.resolve(GlobalBlackboardService);
 *
 * // 初始化配置
 * const config = {
 *     version: '1.0',
 *     variables: Object.entries(${opts.defaultsName}).map(([name, value]) => ({
 *         name,
 *         type: typeof value as BlackboardValueType,
 *         value
 *     }))
 * };
 * service.importConfig(config);
 * \`\`\`
 */
${exp} const ${opts.defaultsName}: ${opts.interfaceName} = {
${properties}
};`;
    }

    /**
     * 按命名空间分组变量
     */
    private static groupVariablesByNamespace(variables: any[]): Record<string, any[]> {
        const groups: Record<string, any[]> = { '': [] };

        for (const variable of variables) {
            const dotIndex = variable.name.indexOf('.');
            if (dotIndex === -1) {
                groups['']!.push(variable);
            } else {
                const namespace = variable.name.substring(0, dotIndex);
                if (!groups[namespace]) {
                    groups[namespace] = [];
                }
                groups[namespace]!.push(variable);
            }
        }

        return groups;
    }

    /**
     * 将变量名转换为常量名（UPPER_SNAKE_CASE）
     */
    private static toConstantName(name: string): string {
        // player.hp -> PLAYER_HP
        // playerHP -> PLAYER_HP
        return name
            .replace(/\./g, '_')
            .replace(/([a-z])([A-Z])/g, '$1_$2')
            .toUpperCase();
    }

    /**
     * 转换为 PascalCase
     */
    private static toPascalCase(str: string): string {
        return str
            .split(/[._-]/)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join('');
    }

    /**
     * 映射黑板类型到 TypeScript 类型
     */
    private static mapBlackboardTypeToTS(type: BlackboardValueType): string {
        switch (type) {
            case BlackboardValueType.Number:
                return 'number';
            case BlackboardValueType.String:
                return 'string';
            case BlackboardValueType.Boolean:
                return 'boolean';
            case BlackboardValueType.Vector2:
                return '{ x: number; y: number }';
            case BlackboardValueType.Vector3:
                return '{ x: number; y: number; z: number }';
            case BlackboardValueType.Object:
                return 'any';
            case BlackboardValueType.Array:
                return 'any[]';
            default:
                return 'any';
        }
    }

    /**
     * 格式化值为 TypeScript 字面量
     */
    private static formatValue(value: any, type: BlackboardValueType, opts: Required<TypeGenerationOptions>): string {
        if (value === null || value === undefined) {
            return 'undefined';
        }

        const quote = opts.quoteStyle === 'single' ? "'" : '"';
        const escapeRegex = opts.quoteStyle === 'single' ? /'/g : /"/g;
        const escapeChar = opts.quoteStyle === 'single' ? "\\'" : '\\"';

        switch (type) {
            case BlackboardValueType.String:
                return `${quote}${value.toString().replace(escapeRegex, escapeChar)}${quote}`;
            case BlackboardValueType.Number:
            case BlackboardValueType.Boolean:
                return String(value);
            case BlackboardValueType.Vector2:
                if (typeof value === 'object' && value.x !== undefined && value.y !== undefined) {
                    return `{ x: ${value.x}, y: ${value.y} }`;
                }
                return '{ x: 0, y: 0 }';
            case BlackboardValueType.Vector3:
                if (typeof value === 'object' && value.x !== undefined && value.y !== undefined && value.z !== undefined) {
                    return `{ x: ${value.x}, y: ${value.y}, z: ${value.z} }`;
                }
                return '{ x: 0, y: 0, z: 0 }';
            case BlackboardValueType.Array:
                return '[]';
            case BlackboardValueType.Object:
                return '{}';
            default:
                return 'undefined';
        }
    }

    /**
     * 根据指定的大小写风格转换变量名
     */
    private static transformName(name: string, caseStyle: 'UPPER_SNAKE' | 'camelCase' | 'PascalCase'): string {
        switch (caseStyle) {
            case 'UPPER_SNAKE':
                return this.toConstantName(name);
            case 'camelCase':
                return this.toCamelCase(name);
            case 'PascalCase':
                return this.toPascalCase(name);
            default:
                return name;
        }
    }

    /**
     * 转换为 camelCase
     */
    private static toCamelCase(str: string): string {
        const parts = str.split(/[._-]/);
        if (parts.length === 0) return str;
        return (parts[0] || '').toLowerCase() + parts.slice(1)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join('');
    }
}
