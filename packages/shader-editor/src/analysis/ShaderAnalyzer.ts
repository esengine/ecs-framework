/**
 * Shader Analyzer.
 * 着色器分析器。
 *
 * Parses GLSL shader code and extracts information about uniforms, attributes, varyings, and complexity.
 * 解析 GLSL 着色器代码并提取 uniforms、attributes、varyings 和复杂度信息。
 */

/**
 * Uniform variable info.
 * Uniform 变量信息。
 */
export interface UniformInfo {
    name: string;
    type: string;
    arraySize?: number;
    description?: string;
}

/**
 * Attribute variable info.
 * Attribute 变量信息。
 */
export interface AttributeInfo {
    name: string;
    type: string;
    location?: number;
}

/**
 * Varying variable info.
 * Varying 变量信息。
 */
export interface VaryingInfo {
    name: string;
    type: string;
    qualifier: 'in' | 'out';
}

/**
 * Shader complexity metrics.
 * 着色器复杂度指标。
 */
export interface ShaderComplexity {
    /** Total instruction count estimate. | 估计的总指令数。 */
    instructionCount: number;
    /** Texture sample count. | 纹理采样数。 */
    textureSamples: number;
    /** Branch count (if/else). | 分支数（if/else）。 */
    branches: number;
    /** Loop count. | 循环数。 */
    loops: number;
    /** Math operation count. | 数学运算数。 */
    mathOps: number;
    /** Complexity level. | 复杂度等级。 */
    level: 'low' | 'medium' | 'high' | 'very-high';
    /** Performance tips. | 性能建议。 */
    tips: string[];
}

/**
 * Shader analysis result.
 * 着色器分析结果。
 */
export interface ShaderAnalysis {
    /** GLSL version. | GLSL 版本。 */
    version: string;
    /** Precision. | 精度。 */
    precision: string;
    /** Uniforms. | 统一变量。 */
    uniforms: UniformInfo[];
    /** Attributes (vertex shader). | 属性（顶点着色器）。 */
    attributes: AttributeInfo[];
    /** Varyings (in/out). | 可变量（输入/输出）。 */
    varyings: VaryingInfo[];
    /** Complexity metrics. | 复杂度指标。 */
    complexity: ShaderComplexity;
    /** Syntax errors. | 语法错误。 */
    errors: string[];
    /** Warnings. | 警告。 */
    warnings: string[];
}

/**
 * GLSL type to size mapping.
 * GLSL 类型到大小的映射。
 */
const TYPE_SIZES: Record<string, number> = {
    'float': 1,
    'int': 1,
    'uint': 1,
    'bool': 1,
    'vec2': 2,
    'vec3': 3,
    'vec4': 4,
    'ivec2': 2,
    'ivec3': 3,
    'ivec4': 4,
    'uvec2': 2,
    'uvec3': 3,
    'uvec4': 4,
    'bvec2': 2,
    'bvec3': 3,
    'bvec4': 4,
    'mat2': 4,
    'mat3': 9,
    'mat4': 16,
    'sampler2D': 1,
    'samplerCube': 1,
    'sampler3D': 1,
};

/**
 * Shader Analyzer class.
 * 着色器分析器类。
 */
export class ShaderAnalyzer {
    /**
     * Analyze shader source code.
     * 分析着色器源代码。
     */
    analyze(source: string, isVertex: boolean = false): ShaderAnalysis {
        const result: ShaderAnalysis = {
            version: '',
            precision: '',
            uniforms: [],
            attributes: [],
            varyings: [],
            complexity: {
                instructionCount: 0,
                textureSamples: 0,
                branches: 0,
                loops: 0,
                mathOps: 0,
                level: 'low',
                tips: []
            },
            errors: [],
            warnings: []
        };

        try {
            // Remove comments for analysis.
            // 移除注释用于分析。
            const cleanSource = this.removeComments(source);

            // Parse version.
            // 解析版本。
            result.version = this.parseVersion(cleanSource);

            // Parse precision.
            // 解析精度。
            result.precision = this.parsePrecision(cleanSource);

            // Parse uniforms.
            // 解析 uniforms。
            result.uniforms = this.parseUniforms(cleanSource);

            // Parse attributes (vertex shader only).
            // 解析属性（仅顶点着色器）。
            if (isVertex) {
                result.attributes = this.parseAttributes(cleanSource);
            }

            // Parse varyings (in/out).
            // 解析可变量（输入/输出）。
            result.varyings = this.parseVaryings(cleanSource, isVertex);

            // Analyze complexity.
            // 分析复杂度。
            result.complexity = this.analyzeComplexity(cleanSource);

            // Check for common issues.
            // 检查常见问题。
            this.checkWarnings(cleanSource, result);

        } catch (error) {
            result.errors.push(`Analysis error: ${error}`);
        }

        return result;
    }

    /**
     * Remove comments from source.
     * 从源代码中移除注释。
     */
    private removeComments(source: string): string {
        // Remove single-line comments (non-greedy, stop at newline).
        // 移除单行注释（非贪婪，遇到换行停止）。
        let result = source.replace(/\/\/[^\n\r]*/g, '');
        // Remove multi-line comments.
        // 移除多行注释。
        result = result.replace(/\/\*[\s\S]*?\*\//g, '');
        return result;
    }

    /**
     * Parse GLSL version.
     * 解析 GLSL 版本。
     */
    private parseVersion(source: string): string {
        const match = source.match(/#version\s+(\d+\s*\w*)/);
        return match ? match[1].trim() : 'unknown';
    }

    /**
     * Parse precision qualifier.
     * 解析精度限定符。
     */
    private parsePrecision(source: string): string {
        const match = source.match(/precision\s+(lowp|mediump|highp)\s+float/);
        return match ? match[1] : 'not specified';
    }

    /**
     * Parse uniform declarations.
     * 解析 uniform 声明。
     */
    private parseUniforms(source: string): UniformInfo[] {
        const uniforms: UniformInfo[] = [];
        // Match: uniform type name; or uniform type name[size];
        const regex = /uniform\s+(\w+)\s+(\w+)(?:\[(\d+)\])?;/g;
        let match;

        while ((match = regex.exec(source)) !== null) {
            const info: UniformInfo = {
                name: match[2],
                type: match[1]
            };
            if (match[3]) {
                info.arraySize = parseInt(match[3], 10);
            }
            uniforms.push(info);
        }

        return uniforms;
    }

    /**
     * Parse attribute declarations.
     * 解析 attribute 声明。
     */
    private parseAttributes(source: string): AttributeInfo[] {
        const attributes: AttributeInfo[] = [];

        // GLSL 300 es style: layout(location = n) in type name;
        const layoutRegex = /layout\s*\(\s*location\s*=\s*(\d+)\s*\)\s*in\s+(\w+)\s+(\w+);/g;
        let match: RegExpExecArray | null;

        while ((match = layoutRegex.exec(source)) !== null) {
            attributes.push({
                name: match[3],
                type: match[2],
                location: parseInt(match[1], 10)
            });
        }

        // Old style: attribute type name; or in type name;
        const attrRegex = /(?:attribute|in)\s+(\w+)\s+(\w+);/g;
        let attrMatch: RegExpExecArray | null;
        while ((attrMatch = attrRegex.exec(source)) !== null) {
            // Skip if already added via layout.
            if (!attributes.find(a => a.name === attrMatch![2])) {
                attributes.push({
                    name: attrMatch[2],
                    type: attrMatch[1]
                });
            }
        }

        return attributes;
    }

    /**
     * Parse varying declarations (in/out).
     * 解析可变量声明（输入/输出）。
     */
    private parseVaryings(source: string, isVertex: boolean): VaryingInfo[] {
        const varyings: VaryingInfo[] = [];

        // Parse 'out' declarations.
        // 解析 'out' 声明。
        const outRegex = /(?<!layout\s*\([^)]*\)\s*)out\s+(\w+)\s+(\w+);/g;
        let match;

        while ((match = outRegex.exec(source)) !== null) {
            varyings.push({
                name: match[2],
                type: match[1],
                qualifier: 'out'
            });
        }

        // Parse 'in' declarations (skip attributes in vertex shader).
        // 解析 'in' 声明（跳过顶点着色器中的属性）。
        if (!isVertex) {
            const inRegex = /(?<!layout\s*\([^)]*\)\s*)in\s+(\w+)\s+(\w+);/g;
            while ((match = inRegex.exec(source)) !== null) {
                varyings.push({
                    name: match[2],
                    type: match[1],
                    qualifier: 'in'
                });
            }
        }

        return varyings;
    }

    /**
     * Analyze shader complexity.
     * 分析着色器复杂度。
     */
    private analyzeComplexity(source: string): ShaderComplexity {
        const complexity: ShaderComplexity = {
            instructionCount: 0,
            textureSamples: 0,
            branches: 0,
            loops: 0,
            mathOps: 0,
            level: 'low',
            tips: []
        };

        // Count texture samples.
        // 统计纹理采样。
        const textureCalls = source.match(/texture\s*\(/g) || [];
        complexity.textureSamples = textureCalls.length;

        // Count branches.
        // 统计分支。
        const ifStatements = source.match(/\bif\s*\(/g) || [];
        const ternary = source.match(/\?/g) || [];
        complexity.branches = ifStatements.length + ternary.length;

        // Count loops.
        // 统计循环。
        const forLoops = source.match(/\bfor\s*\(/g) || [];
        const whileLoops = source.match(/\bwhile\s*\(/g) || [];
        complexity.loops = forLoops.length + whileLoops.length;

        // Count math operations.
        // 统计数学运算。
        const mathFuncs = [
            'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
            'pow', 'exp', 'log', 'sqrt', 'inversesqrt',
            'abs', 'floor', 'ceil', 'fract', 'mod',
            'min', 'max', 'clamp', 'mix', 'step', 'smoothstep',
            'length', 'distance', 'dot', 'cross', 'normalize', 'reflect', 'refract'
        ];
        for (const func of mathFuncs) {
            const matches = source.match(new RegExp(`\\b${func}\\s*\\(`, 'g')) || [];
            complexity.mathOps += matches.length;
        }

        // Estimate instruction count.
        // 估计指令数。
        const lines = source.split('\n').filter(l => l.trim() && !l.trim().startsWith('//'));
        complexity.instructionCount = lines.length +
            complexity.textureSamples * 4 +
            complexity.mathOps * 2 +
            complexity.branches * 2;

        // Determine complexity level.
        // 确定复杂度等级。
        if (complexity.instructionCount > 200 || complexity.textureSamples > 8 || complexity.loops > 3) {
            complexity.level = 'very-high';
        } else if (complexity.instructionCount > 100 || complexity.textureSamples > 4 || complexity.loops > 1) {
            complexity.level = 'high';
        } else if (complexity.instructionCount > 50 || complexity.textureSamples > 2) {
            complexity.level = 'medium';
        } else {
            complexity.level = 'low';
        }

        // Generate tips.
        // 生成建议。
        if (complexity.textureSamples > 4) {
            complexity.tips.push('Consider reducing texture samples for better performance.');
        }
        if (complexity.loops > 2) {
            complexity.tips.push('Nested loops can significantly impact performance.');
        }
        if (complexity.branches > 5) {
            complexity.tips.push('Many branches can cause performance issues on some GPUs.');
        }
        if (source.includes('discard')) {
            complexity.tips.push('Using discard can prevent early-z optimization.');
        }

        return complexity;
    }

    /**
     * Check for common issues and warnings.
     * 检查常见问题和警告。
     */
    private checkWarnings(source: string, result: ShaderAnalysis): void {
        // Check for missing precision.
        // 检查缺少精度。
        if (result.precision === 'not specified') {
            result.warnings.push('No precision qualifier specified. Consider adding "precision highp float;"');
        }

        // Check for unused uniforms.
        // 检查未使用的 uniforms。
        for (const uniform of result.uniforms) {
            const usageRegex = new RegExp(`\\b${uniform.name}\\b`, 'g');
            const matches = source.match(usageRegex) || [];
            if (matches.length <= 1) { // Only the declaration.
                result.warnings.push(`Uniform "${uniform.name}" may be unused.`);
            }
        }

        // Check for expensive operations in loops.
        // 检查循环中的昂贵操作。
        if (result.complexity.loops > 0 && result.complexity.textureSamples > 0) {
            // Simple heuristic: if we have loops and texture samples, warn.
            result.warnings.push('Texture sampling in loops can be expensive.');
        }
    }

    /**
     * Get type size in floats.
     * 获取类型大小（以 float 为单位）。
     */
    getTypeSize(type: string): number {
        return TYPE_SIZES[type] || 1;
    }

    /**
     * Calculate total uniform buffer size.
     * 计算 uniform 缓冲区总大小。
     */
    calculateUniformBufferSize(uniforms: UniformInfo[]): number {
        let size = 0;
        for (const uniform of uniforms) {
            const typeSize = this.getTypeSize(uniform.type);
            const count = uniform.arraySize || 1;
            size += typeSize * count;
        }
        return size;
    }
}

// Export singleton instance.
// 导出单例实例。
export const shaderAnalyzer = new ShaderAnalyzer();
