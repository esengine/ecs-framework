import JSZip from 'jszip';
import { readTextFile } from '@tauri-apps/plugin-fs';

/**
 * 插件 package.json 结构
 */
export interface PluginPackageJson {
    name: string;
    version: string;
    description?: string;
    author?: string | { name: string };
    repository?: string | { url: string };
    license?: string;
}

/**
 * 解析后的插件信息
 */
export interface ParsedPluginInfo {
    /** package.json 内容 */
    packageJson: PluginPackageJson;
    /** 插件源类型 */
    sourceType: 'folder' | 'zip';
    /** 插件源路径（文件夹路径或 zip 文件路径） */
    sourcePath: string;
    /** 如果是 zip，这里存储 zip 的路径；如果是文件夹，需要构建后才有 */
    zipPath?: string;
}

/**
 * 插件源解析服务
 *
 * 统一处理插件来源的解析，支持：
 * 1. 文件夹（包含 package.json 的插件项目）
 * 2. ZIP 文件（已构建的插件包）
 */
export class PluginSourceParser {
    /**
     * 从文件夹解析插件信息
     * @param folderPath 插件文件夹路径
     * @returns 解析后的插件信息
     */
    async parseFromFolder(folderPath: string): Promise<ParsedPluginInfo> {
        try {
            // 读取 package.json
            const packageJsonPath = `${folderPath}/package.json`;
            const packageJsonContent = await readTextFile(packageJsonPath);
            const packageJson = JSON.parse(packageJsonContent) as PluginPackageJson;

            return {
                packageJson,
                sourceType: 'folder',
                sourcePath: folderPath
                // zipPath 留空，需要构建后才有
            };
        } catch (error) {
            console.error('[PluginSourceParser] Failed to parse folder:', error);
            throw new Error(
                `Failed to read package.json from folder: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * 从 ZIP 文件解析插件信息
     * @param zipPath ZIP 文件路径
     * @returns 解析后的插件信息
     */
    async parseFromZip(zipPath: string): Promise<ParsedPluginInfo> {
        try {
            // 读取 ZIP 文件
            const { readFile } = await import('@tauri-apps/plugin-fs');
            const zipData = await readFile(zipPath);

            // 解压 ZIP
            const zip = await JSZip.loadAsync(zipData);

            // 查找 package.json
            const packageJsonFile = zip.file('package.json');
            if (!packageJsonFile) {
                throw new Error('package.json not found in ZIP file');
            }

            // 读取 package.json 内容
            const packageJsonContent = await packageJsonFile.async('text');
            const packageJson = JSON.parse(packageJsonContent) as PluginPackageJson;

            // 验证 ZIP 中必须包含 dist 目录
            const distFiles = Object.keys(zip.files).filter((f) => f.startsWith('dist/'));
            if (distFiles.length === 0) {
                throw new Error('dist/ directory not found in ZIP file. Please ensure the plugin is properly built.');
            }

            // 检查是否有入口文件
            const hasIndexEsm = zip.file('dist/index.esm.js');
            const hasIndexJs = zip.file('dist/index.js');
            if (!hasIndexEsm && !hasIndexJs) {
                throw new Error('No entry file found in dist/. Expected dist/index.esm.js or dist/index.js');
            }

            return {
                packageJson,
                sourceType: 'zip',
                sourcePath: zipPath,
                zipPath // ZIP 文件已经可用
            };
        } catch (error) {
            console.error('[PluginSourceParser] Failed to parse ZIP:', error);
            throw new Error(
                `Failed to parse ZIP file: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * 验证 package.json 的必要字段
     * @param packageJson package.json 对象
     * @throws 如果缺少必要字段
     */
    validatePackageJson(packageJson: PluginPackageJson): void {
        if (!packageJson.name) {
            throw new Error('package.json must contain "name" field');
        }
        if (!packageJson.version) {
            throw new Error('package.json must contain "version" field');
        }

        // 验证版本号格式
        const versionRegex = /^\d+\.\d+\.\d+$/;
        if (!versionRegex.test(packageJson.version)) {
            throw new Error(
                `Invalid version format: "${packageJson.version}". Expected format: X.Y.Z (e.g., 1.0.0)`
            );
        }
    }

    /**
     * 生成插件 ID
     * 从插件名称生成标准化的 ID（小写，仅包含字母、数字和连字符）
     * @param name 插件名称
     * @returns 插件 ID
     */
    generatePluginId(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/^-+|-+$/g, '');
    }
}
