/**
 * Worker 生成器类型定义
 * Type definitions for Worker generator
 */

/**
 * 提取的 WorkerEntitySystem 信息
 * Extracted WorkerEntitySystem information
 */
export interface WorkerSystemInfo {
    /** 类名 | Class name */
    className: string;
    /** 源文件路径 | Source file path */
    filePath: string;
    /** workerProcess 方法体 | workerProcess method body */
    workerProcessBody: string;
    /** workerProcess 参数名 | workerProcess parameter names */
    workerProcessParams: {
        entities: string;
        deltaTime: string;
        config: string;
    };
    /** getSharedArrayBufferProcessFunction 方法体（可选）| getSharedArrayBufferProcessFunction body (optional) */
    sharedBufferProcessBody?: string;
    /** entityDataSize 值（如果是字面量）| entityDataSize value (if literal) */
    entityDataSize?: number;
    /** 用户配置的 workerScriptPath（从构造函数中提取）| User configured workerScriptPath */
    workerScriptPath?: string;
}

/**
 * 生成器配置
 * Generator configuration
 */
export interface GeneratorConfig {
    /** 源代码目录 | Source directory */
    srcDir: string;
    /** 输出目录 | Output directory */
    outDir: string;
    /** 是否使用微信小游戏格式 | Whether to use WeChat Mini Game format */
    wechat?: boolean;
    /** 是否生成映射文件 | Whether to generate mapping file */
    generateMapping?: boolean;
    /** TypeScript 配置文件路径 | TypeScript config file path */
    tsConfigPath?: string;
    /** 是否详细输出 | Verbose output */
    verbose?: boolean;
}

/**
 * 生成结果
 * Generation result
 */
export interface GenerationResult {
    /** 成功生成的文件 | Successfully generated files */
    success: Array<{
        className: string;
        outputPath: string;
        /** 用户配置的路径（如果有）| User configured path (if any) */
        configuredPath?: string;
    }>;
    /** 失败的类 | Failed classes */
    errors: Array<{
        className: string;
        filePath: string;
        error: string;
    }>;
    /** 需要用户配置 workerScriptPath 的类 | Classes that need workerScriptPath configuration */
    skipped: Array<{
        className: string;
        suggestedPath: string;
        reason: string;
    }>;
}

/**
 * Worker 脚本映射
 * Worker script mapping
 */
export interface WorkerScriptMapping {
    /** 生成时间 | Generation timestamp */
    generatedAt: string;
    /** 映射表：类名 -> Worker 文件路径 | Mapping: class name -> Worker file path */
    mappings: Record<string, string>;
}
