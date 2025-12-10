/**
 * Build File System Service.
 * 构建文件系统服务。
 *
 * Provides file operations for build pipelines via Tauri commands.
 * 通过 Tauri 命令为构建管线提供文件操作。
 */

import { invoke } from '@tauri-apps/api/core';

/**
 * Bundle options.
 * 打包选项。
 */
export interface BundleOptions {
    /** Entry files | 入口文件 */
    entryPoints: string[];
    /** Output directory | 输出目录 */
    outputDir: string;
    /** Output format (esm or iife) | 输出格式 */
    format: 'esm' | 'iife';
    /** Bundle name | 打包名称 */
    bundleName: string;
    /** Whether to minify | 是否压缩 */
    minify: boolean;
    /** Whether to generate source map | 是否生成 source map */
    sourceMap: boolean;
    /** External dependencies | 外部依赖 */
    external: string[];
    /** Project root for resolving imports | 项目根目录 */
    projectRoot: string;
    /** Define replacements | 宏定义替换 */
    define?: Record<string, string>;
    /**
     * Module alias mappings.
     * 模块别名映射。
     *
     * Maps package names to actual file paths for bundling.
     * Used in single-bundle mode to resolve @esengine/* imports.
     * 将包名映射到实际文件路径以进行打包。
     * 在单包模式下用于解析 @esengine/* 导入。
     */
    alias?: Record<string, string>;
    /**
     * Global name for IIFE format.
     * IIFE 格式的全局变量名。
     *
     * Assigns exports to window.{globalName}.
     * 将导出赋值给 window.{globalName}。
     */
    globalName?: string;
    /**
     * Files to inject at the start of bundle.
     * 在打包开始时注入的文件。
     *
     * Used to inject shims that map external imports to global variables.
     * 用于注入将外部导入映射到全局变量的 shim。
     */
    inject?: string[];
    /**
     * Banner code to prepend to bundle.
     * 添加到打包文件开头的代码。
     */
    banner?: string;
}

/**
 * Bundle result.
 * 打包结果。
 */
export interface BundleResult {
    /** Whether bundling succeeded | 是否打包成功 */
    success: boolean;
    /** Output file path | 输出文件路径 */
    outputFile?: string;
    /** Output file size in bytes | 输出文件大小 */
    outputSize?: number;
    /** Error message if failed | 失败时的错误信息 */
    error?: string;
    /** Warnings | 警告 */
    warnings: string[];
}

/**
 * Build File System Service.
 * 构建文件系统服务。
 */
export class BuildFileSystemService {
    /**
     * Prepare build directory (clean and recreate).
     * 准备构建目录（清理并重建）。
     *
     * @param outputPath - Output directory path | 输出目录路径
     */
    async prepareBuildDirectory(outputPath: string): Promise<void> {
        await invoke('prepare_build_directory', { outputPath });
    }

    /**
     * Copy directory recursively.
     * 递归复制目录。
     *
     * @param src - Source directory | 源目录
     * @param dst - Destination directory | 目标目录
     * @param patterns - File patterns to include (e.g. ["*.png", "*.json"]) | 要包含的文件模式
     * @returns Number of files copied | 复制的文件数量
     */
    async copyDirectory(
        src: string,
        dst: string,
        patterns?: string[]
    ): Promise<number> {
        return await invoke('copy_directory', { src, dst, patterns });
    }

    /**
     * Bundle scripts using esbuild.
     * 使用 esbuild 打包脚本。
     *
     * @param options - Bundle options | 打包选项
     * @returns Bundle result | 打包结果
     */
    async bundleScripts(options: BundleOptions): Promise<BundleResult> {
        return await invoke('bundle_scripts', { options });
    }

    /**
     * Generate HTML file.
     * 生成 HTML 文件。
     *
     * @param outputPath - Output file path | 输出文件路径
     * @param title - Page title | 页面标题
     * @param scripts - Script paths to include | 要包含的脚本路径
     * @param bodyContent - Custom body content | 自定义 body 内容
     */
    async generateHtml(
        outputPath: string,
        title: string,
        scripts: string[],
        bodyContent?: string
    ): Promise<void> {
        await invoke('generate_html', { outputPath, title, scripts, bodyContent });
    }

    /**
     * Get file size.
     * 获取文件大小。
     *
     * @param filePath - File path | 文件路径
     * @returns File size in bytes | 文件大小（字节）
     */
    async getFileSize(filePath: string): Promise<number> {
        return await invoke('get_file_size', { filePath });
    }

    /**
     * Get directory size recursively.
     * 递归获取目录大小。
     *
     * @param dirPath - Directory path | 目录路径
     * @returns Total size in bytes | 总大小（字节）
     */
    async getDirectorySize(dirPath: string): Promise<number> {
        return await invoke('get_directory_size', { dirPath });
    }

    /**
     * Write JSON file.
     * 写入 JSON 文件。
     *
     * @param filePath - File path | 文件路径
     * @param content - JSON content as string | JSON 内容字符串
     */
    async writeJsonFile(filePath: string, content: string): Promise<void> {
        await invoke('write_json_file', { filePath, content });
    }

    /**
     * List files by extension.
     * 按扩展名列出文件。
     *
     * @param dirPath - Directory path | 目录路径
     * @param extensions - File extensions (without dot) | 文件扩展名（不含点）
     * @param recursive - Whether to search recursively | 是否递归搜索
     * @returns List of file paths | 文件路径列表
     */
    async listFilesByExtension(
        dirPath: string,
        extensions: string[],
        recursive: boolean = true
    ): Promise<string[]> {
        return await invoke('list_files_by_extension', { dirPath, extensions, recursive });
    }

    /**
     * Copy single file.
     * 复制单个文件。
     *
     * @param src - Source file path | 源文件路径
     * @param dst - Destination file path | 目标文件路径
     */
    async copyFile(src: string, dst: string): Promise<void> {
        await invoke('copy_file', { src, dst });
    }

    /**
     * Check if path exists.
     * 检查路径是否存在。
     *
     * @param path - Path to check | 要检查的路径
     * @returns Whether path exists | 路径是否存在
     */
    async pathExists(path: string): Promise<boolean> {
        return await invoke('path_exists', { path });
    }

    /**
     * Read file content.
     * 读取文件内容。
     *
     * @param path - File path | 文件路径
     * @returns File content | 文件内容
     */
    async readFile(path: string): Promise<string> {
        return await invoke('read_file_content', { path });
    }

    /**
     * Write file content.
     * 写入文件内容。
     *
     * @param path - File path | 文件路径
     * @param content - Content to write | 要写入的内容
     */
    async writeFile(path: string, content: string): Promise<void> {
        await invoke('write_file_content', { path, content });
    }

    /**
     * Read JSON file.
     * 读取 JSON 文件。
     *
     * @param path - File path | 文件路径
     * @returns Parsed JSON object | 解析后的 JSON 对象
     */
    async readJson<T>(path: string): Promise<T> {
        const content = await invoke<string>('read_file_content', { path });
        return JSON.parse(content) as T;
    }

    /**
     * Create directory.
     * 创建目录。
     *
     * @param path - Directory path | 目录路径
     */
    async createDirectory(path: string): Promise<void> {
        await invoke('create_directory', { path });
    }

    /**
     * Read binary file as base64.
     * 读取二进制文件为 base64。
     *
     * @param path - File path | 文件路径
     * @returns Base64 encoded content | Base64 编码的内容
     */
    async readBinaryFileAsBase64(path: string): Promise<string> {
        return await invoke('read_binary_file_as_base64', { path });
    }

    /**
     * Delete a file.
     * 删除文件。
     *
     * @param path - File path | 文件路径
     */
    async deleteFile(path: string): Promise<void> {
        await invoke('delete_file', { path });
    }
}

// Singleton instance | 单例实例
export const buildFileSystem = new BuildFileSystemService();
