/**
 * 路径解析服务
 * Path Resolution Service
 *
 * 提供统一的路径解析接口，处理编辑器、Catalog、运行时三层路径转换。
 * Provides unified path resolution interface for editor, catalog, and runtime path conversion.
 *
 * 路径格式约定 | Path Format Convention:
 * - 编辑器路径 (Editor Path): 绝对路径，如 `C:\Project\assets\textures\bg.png`
 * - Catalog 路径 (Catalog Path): 相对于 assets 目录，不含 `assets/` 前缀，如 `textures/bg.png`
 * - 运行时 URL (Runtime URL): 完整 URL，如 `./assets/textures/bg.png` 或 `https://cdn.example.com/assets/textures/bg.png`
 *
 * @example
 * ```typescript
 * import { PathResolutionServiceToken, type IPathResolutionService } from '@esengine/asset-system';
 *
 * // 获取服务
 * const pathService = context.services.get(PathResolutionServiceToken);
 *
 * // Catalog 路径转运行时 URL
 * const url = pathService.catalogToRuntime('textures/bg.png');
 * // => './assets/textures/bg.png'
 *
 * // 编辑器路径转 Catalog 路径
 * const catalogPath = pathService.editorToCatalog('C:\\Project\\assets\\textures\\bg.png', 'C:\\Project');
 * // => 'textures/bg.png'
 * ```
 */

import { createServiceToken } from '@esengine/ecs-framework';

// ============================================================================
// 接口定义 | Interface Definitions
// ============================================================================

/**
 * 路径解析服务接口
 * Path resolution service interface
 */
export interface IPathResolutionService {
    /**
     * 将 Catalog 路径转换为运行时 URL
     * Convert catalog path to runtime URL
     *
     * @param catalogPath Catalog 路径（相对于 assets 目录，不含 assets/ 前缀）
     * @returns 运行时 URL
     *
     * @example
     * ```typescript
     * // 输入: 'textures/bg.png'
     * // 输出: './assets/textures/bg.png' (取决于 baseUrl 配置)
     * pathService.catalogToRuntime('textures/bg.png');
     * ```
     */
    catalogToRuntime(catalogPath: string): string;

    /**
     * 将编辑器绝对路径转换为 Catalog 路径
     * Convert editor absolute path to catalog path
     *
     * @param editorPath 编辑器绝对路径
     * @param projectRoot 项目根目录
     * @returns Catalog 路径（相对于 assets 目录，不含 assets/ 前缀）
     *
     * @example
     * ```typescript
     * // 输入: 'C:\\Project\\assets\\textures\\bg.png', 'C:\\Project'
     * // 输出: 'textures/bg.png'
     * pathService.editorToCatalog('C:\\Project\\assets\\textures\\bg.png', 'C:\\Project');
     * ```
     */
    editorToCatalog(editorPath: string, projectRoot: string): string;

    /**
     * 设置运行时基础 URL
     * Set runtime base URL
     *
     * @param url 基础 URL（通常为 './assets' 或 CDN URL）
     */
    setBaseUrl(url: string): void;

    /**
     * 获取当前基础 URL
     * Get current base URL
     */
    getBaseUrl(): string;

    /**
     * 规范化路径（统一斜杠方向，移除重复斜杠）
     * Normalize path (unify slash direction, remove duplicate slashes)
     *
     * @param path 输入路径
     * @returns 规范化后的路径
     */
    normalize(path: string): string;

    /**
     * 检查路径是否为绝对 URL
     * Check if path is absolute URL
     *
     * @param path 输入路径
     * @returns 是否为绝对 URL
     */
    isAbsoluteUrl(path: string): boolean;
}

// ============================================================================
// 服务令牌 | Service Token
// ============================================================================

/**
 * 路径解析服务令牌
 * Path resolution service token
 */
export const PathResolutionServiceToken = createServiceToken<IPathResolutionService>('pathResolutionService');

// ============================================================================
// 默认实现 | Default Implementation
// ============================================================================

/**
 * 路径解析服务默认实现
 * Default path resolution service implementation
 */
export class PathResolutionService implements IPathResolutionService {
    private _baseUrl: string = './assets';
    private _assetsDir: string = 'assets';

    /**
     * 创建路径解析服务
     * Create path resolution service
     *
     * @param baseUrl 基础 URL（默认 './assets'）
     */
    constructor(baseUrl?: string) {
        if (baseUrl !== undefined) {
            this._baseUrl = baseUrl;
        }
    }

    /**
     * 将 Catalog 路径转换为运行时 URL
     * Convert catalog path to runtime URL
     */
    catalogToRuntime(catalogPath: string): string {
        // 空路径直接返回
        if (!catalogPath) {
            return catalogPath;
        }

        // 已经是绝对 URL 则直接返回
        if (this.isAbsoluteUrl(catalogPath)) {
            return catalogPath;
        }

        // Data URL 直接返回
        if (catalogPath.startsWith('data:')) {
            return catalogPath;
        }

        // 规范化路径
        let normalized = this.normalize(catalogPath);

        // 移除开头的斜杠
        normalized = normalized.replace(/^\/+/, '');

        // 如果路径以 'assets/' 开头，移除它（避免重复）
        // Catalog 路径不应包含 assets/ 前缀
        if (normalized.startsWith('assets/')) {
            normalized = normalized.substring(7);
        }

        // 构建完整 URL
        const base = this._baseUrl.replace(/\/+$/, ''); // 移除尾部斜杠
        return `${base}/${normalized}`;
    }

    /**
     * 将编辑器绝对路径转换为 Catalog 路径
     * Convert editor absolute path to catalog path
     */
    editorToCatalog(editorPath: string, projectRoot: string): string {
        // 规范化路径
        let normalizedPath = this.normalize(editorPath);
        let normalizedRoot = this.normalize(projectRoot);

        // 确保根路径以斜杠结尾
        if (!normalizedRoot.endsWith('/')) {
            normalizedRoot += '/';
        }

        // 移除项目根路径前缀
        if (normalizedPath.startsWith(normalizedRoot)) {
            normalizedPath = normalizedPath.substring(normalizedRoot.length);
        }

        // 移除 assets/ 前缀（如果存在）
        const assetsPrefix = `${this._assetsDir}/`;
        if (normalizedPath.startsWith(assetsPrefix)) {
            normalizedPath = normalizedPath.substring(assetsPrefix.length);
        }

        return normalizedPath;
    }

    /**
     * 设置运行时基础 URL
     * Set runtime base URL
     */
    setBaseUrl(url: string): void {
        this._baseUrl = url;
    }

    /**
     * 获取当前基础 URL
     * Get current base URL
     */
    getBaseUrl(): string {
        return this._baseUrl;
    }

    /**
     * 规范化路径
     * Normalize path
     */
    normalize(path: string): string {
        return path
            .replace(/\\/g, '/') // 反斜杠转正斜杠
            .replace(/\/+/g, '/'); // 移除重复斜杠
    }

    /**
     * 检查路径是否为绝对 URL
     * Check if path is absolute URL
     */
    isAbsoluteUrl(path: string): boolean {
        return /^(https?:\/\/|file:\/\/|asset:\/\/|blob:)/.test(path);
    }
}
