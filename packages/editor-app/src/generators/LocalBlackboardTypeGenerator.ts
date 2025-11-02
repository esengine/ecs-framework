/**
 * 局部黑板变量信息
 */
export interface LocalBlackboardVariable {
    name: string;
    type: string;
    value: any;
}

/**
 * 局部黑板类型生成配置
 */
export interface LocalTypeGenerationOptions {
    /** 行为树名称 */
    behaviorTreeName: string;

    /** 是否生成常量枚举 */
    includeConstants?: boolean;

    /** 是否生成默认值 */
    includeDefaults?: boolean;

    /** 是否生成辅助函数 */
    includeHelpers?: boolean;

    /** 使用单引号还是双引号 */
    quoteStyle?: 'single' | 'double';
}

/**
 * 局部黑板 TypeScript 类型生成器
 *
 * 为行为树的局部黑板变量生成类型安全的 TypeScript 定义
 */
export class LocalBlackboardTypeGenerator {
    /**
     * 生成局部黑板的 TypeScript 类型定义
     *
     * @param variables 黑板变量列表
     * @param options 生成配置
     * @returns TypeScript 代码
     */
    static generate(
        variables: Record<string, any>,
        options: LocalTypeGenerationOptions
    ): string {
        const opts = {
            includeConstants: true,
            includeDefaults: true,
            includeHelpers: true,
            quoteStyle: 'single' as const,
            ...options
        };

        const quote = opts.quoteStyle === 'single' ? "'" : '"';
        const now = new Date().toLocaleString('zh-CN', { hour12: false });
        const treeName = opts.behaviorTreeName;
        const interfaceName = `${this.toPascalCase(treeName)}Blackboard`;
        const constantsName = `${this.toPascalCase(treeName)}Vars`;
        const defaultsName = `${this.toPascalCase(treeName)}Defaults`;

        const parts: string[] = [];

        // 文件头部注释
        parts.push(`/**
 * 行为树黑板变量类型定义
 *
 * 行为树: ${treeName}
 * ⚠️ 此文件由编辑器自动生成，请勿手动修改！
 * 生成时间: ${now}
 */`);

        const varEntries = Object.entries(variables);

        // 如果没有变量
        if (varEntries.length === 0) {
            parts.push(`\n/**
 * 黑板变量类型定义（空）
 */
export interface ${interfaceName} {}`);
            return parts.join('\n') + '\n';
        }

        // 生成常量枚举
        if (opts.includeConstants) {
            const constants = varEntries
                .map(([name]) => `    ${this.toConstantName(name)}: ${quote}${name}${quote}`)
                .join(',\n');

            parts.push(`\n/**
 * 黑板变量名称常量
 * 使用常量避免拼写错误
 *
 * @example
 * \`\`\`typescript
 * // 使用常量代替字符串
 * const hp = blackboard.getValue(${constantsName}.PLAYER_HP);  // ✅ 类型安全
 * const hp = blackboard.getValue('playerHP');  // ❌ 容易拼写错误
 * \`\`\`
 */
export const ${constantsName} = {
${constants}
} as const;`);
        }

        // 生成类型接口
        const interfaceProps = varEntries
            .map(([name, value]) => {
                const tsType = this.inferType(value);
                return `    ${name}: ${tsType};`;
            })
            .join('\n');

        parts.push(`\n/**
 * 黑板变量类型定义
 */
export interface ${interfaceName} {
${interfaceProps}
}`);

        // 生成变量名联合类型
        parts.push(`\n/**
 * 黑板变量名称联合类型
 */
export type ${this.toPascalCase(treeName)}VariableName = keyof ${interfaceName};`);

        // 生成默认值
        if (opts.includeDefaults) {
            const defaultProps = varEntries
                .map(([name, value]) => {
                    const formattedValue = this.formatValue(value, opts.quoteStyle);
                    return `    ${name}: ${formattedValue}`;
                })
                .join(',\n');

            parts.push(`\n/**
 * 黑板变量默认值
 *
 * 可用于初始化行为树黑板
 *
 * @example
 * \`\`\`typescript
 * // 创建行为树时使用默认值
 * const blackboard = { ...${defaultsName} };
 * const tree = new BehaviorTree(rootNode, blackboard);
 * \`\`\`
 */
export const ${defaultsName}: ${interfaceName} = {
${defaultProps}
};`);
        }

        // 生成辅助函数
        if (opts.includeHelpers) {
            parts.push(`\n/**
 * 创建类型安全的黑板访问器
 *
 * @example
 * \`\`\`typescript
 * const blackboard = create${this.toPascalCase(treeName)}Blackboard();
 *
 * // 类型安全的访问
 * const hp = blackboard.playerHP;  // 类型: number
 * blackboard.playerHP = 100;  // ✅ 正确
 * blackboard.playerHP = 'invalid';  // ❌ 编译错误
 * \`\`\`
 */
export function create${this.toPascalCase(treeName)}Blackboard(
    initialValues?: Partial<${interfaceName}>
): ${interfaceName} {
    return { ...${defaultsName}, ...initialValues };
}

/**
 * 类型守卫：检查变量名是否有效
 */
export function is${this.toPascalCase(treeName)}Variable(
    name: string
): name is ${this.toPascalCase(treeName)}VariableName {
    return name in ${defaultsName};
}`);
        }

        return parts.join('\n') + '\n';
    }

    /**
     * 推断 TypeScript 类型
     */
    private static inferType(value: any): string {
        if (value === null || value === undefined) {
            return 'any';
        }

        const type = typeof value;

        switch (type) {
            case 'number':
                return 'number';
            case 'string':
                return 'string';
            case 'boolean':
                return 'boolean';
            case 'object':
                if (Array.isArray(value)) {
                    if (value.length === 0) {
                        return 'any[]';
                    }
                    const elementType = this.inferType(value[0]);
                    return `${elementType}[]`;
                }
                // 检查是否是 Vector2 或 Vector3
                if ('x' in value && 'y' in value) {
                    if ('z' in value) {
                        return '{ x: number; y: number; z: number }';
                    }
                    return '{ x: number; y: number }';
                }
                return 'any';
            default:
                return 'any';
        }
    }

    /**
     * 格式化值为 TypeScript 字面量
     */
    private static formatValue(value: any, quoteStyle: 'single' | 'double'): string {
        if (value === null) {
            return 'null';
        }
        if (value === undefined) {
            return 'undefined';
        }

        const quote = quoteStyle === 'single' ? "'" : '"';
        const type = typeof value;

        switch (type) {
            case 'string':
                const escaped = value
                    .replace(/\\/g, '\\\\')
                    .replace(quoteStyle === 'single' ? /'/g : /"/g,
                        quoteStyle === 'single' ? "\\'" : '\\"');
                return `${quote}${escaped}${quote}`;
            case 'number':
            case 'boolean':
                return String(value);
            case 'object':
                if (Array.isArray(value)) {
                    if (value.length === 0) {
                        return '[]';
                    }
                    const items = value.map((v) => this.formatValue(v, quoteStyle)).join(', ');
                    return `[${items}]`;
                }
                // Vector2/Vector3
                if ('x' in value && 'y' in value) {
                    if ('z' in value) {
                        return `{ x: ${value.x}, y: ${value.y}, z: ${value.z} }`;
                    }
                    return `{ x: ${value.x}, y: ${value.y} }`;
                }
                // 普通对象
                return '{}';
            default:
                return 'undefined';
        }
    }

    /**
     * 转换为 UPPER_SNAKE_CASE
     */
    private static toConstantName(name: string): string {
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
}
