/**
 * Asset path resolver for different platforms and protocols
 * 不同平台和协议的资产路径解析器
 */

import { AssetPlatform } from '../types/AssetTypes';
import { PathValidator } from '../utils/PathValidator';

/**
 * Asset path resolver configuration
 * 资产路径解析器配置
 */
export interface IAssetPathConfig {
    /** Base URL for web assets | Web资产的基础URL */
    baseUrl?: string;

    /** Asset directory path | 资产目录路径 */
    assetDir?: string;

    /** Asset host for asset:// protocol | 资产协议的主机名 */
    assetHost?: string;

    /** Current platform | 当前平台 */
    platform?: AssetPlatform;

    /** Custom path transformer | 自定义路径转换器 */
    pathTransformer?: (path: string) => string;
}

/**
 * Asset path resolver
 * 资产路径解析器
 */
export class AssetPathResolver {
    private config: IAssetPathConfig;

    constructor(config: IAssetPathConfig = {}) {
        this.config = {
            baseUrl: '',
            assetDir: 'assets',
            platform: AssetPlatform.H5,
            ...config
        };
    }

    /**
     * Update configuration
     * 更新配置
     */
    updateConfig(config: Partial<IAssetPathConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Resolve asset path to full URL
     * 解析资产路径为完整URL
     */
    resolve(path: string): string {
        // Validate input path
        const validation = PathValidator.validate(path);
        if (!validation.valid) {
            console.warn(`Invalid asset path: ${path} - ${validation.reason}`);
            // Sanitize the path instead of throwing
            path = PathValidator.sanitize(path);
            if (!path) {
                throw new Error(`Cannot resolve invalid path: ${validation.reason}`);
            }
        }

        // Already a full URL
        // 已经是完整URL
        if (this.isAbsoluteUrl(path)) {
            return path;
        }

        // Data URL
        // 数据URL
        if (path.startsWith('data:')) {
            return path;
        }

        // Normalize the path
        path = PathValidator.normalize(path);

        // Apply custom transformer if provided
        // 应用自定义转换器（如果提供）
        if (this.config.pathTransformer) {
            path = this.config.pathTransformer(path);
            // Transformer output is trusted (may be absolute path or asset:// URL)
            // 转换器输出是可信的（可能是绝对路径或 asset:// URL）
            return path;
        }

        // Platform-specific resolution
        // 平台特定解析
        switch (this.config.platform) {
            case AssetPlatform.H5:
                return this.resolveH5Path(path);

            case AssetPlatform.WeChat:
                return this.resolveWeChatPath(path);

            case AssetPlatform.Playable:
                return this.resolvePlayablePath(path);

            case AssetPlatform.Android:
            case AssetPlatform.iOS:
                return this.resolveMobilePath(path);

            case AssetPlatform.Editor:
                return this.resolveEditorPath(path);

            default:
                return this.resolveH5Path(path);
        }
    }

    /**
     * Resolve path for H5 platform
     * 解析H5平台路径
     */
    private resolveH5Path(path: string): string {
        // Remove leading slash if present
        // 移除开头的斜杠（如果存在）
        path = path.replace(/^\//, '');

        // Combine with base URL and asset directory
        // 与基础URL和资产目录结合
        const base = this.config.baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
        const assetDir = this.config.assetDir || 'assets';

        return `${base}/${assetDir}/${path}`.replace(/\/+/g, '/');
    }

    /**
     * Resolve path for WeChat Mini Game
     * 解析微信小游戏路径
     */
    private resolveWeChatPath(path: string): string {
        // WeChat mini games use relative paths
        // 微信小游戏使用相对路径
        return `${this.config.assetDir}/${path}`.replace(/\/+/g, '/');
    }

    /**
     * Resolve path for Playable Ads platform
     * 解析试玩广告平台路径
     */
    private resolvePlayablePath(path: string): string {
        // Playable ads typically use base64 embedded resources or relative paths
        // 试玩广告通常使用base64内嵌资源或相对路径

        // If custom transformer is provided (e.g., for base64 encoding)
        // 如果提供了自定义转换器（例如用于base64编码）
        if (this.config.pathTransformer) {
            return this.config.pathTransformer(path);
        }

        // Default to relative path without directory prefix
        // 默认使用不带目录前缀的相对路径
        return path;
    }

    /**
     * Resolve path for mobile platform (Android/iOS)
     * 解析移动平台路径（Android/iOS）
     */
    private resolveMobilePath(path: string): string {
        // Mobile platforms use relative paths or file:// protocol
        // 移动平台使用相对路径或file://协议
        return `./${this.config.assetDir}/${path}`.replace(/\/+/g, '/');
    }

    /**
     * Resolve path for Editor platform (Tauri)
     * 解析编辑器平台路径（Tauri）
     */
    private resolveEditorPath(path: string): string {
        // For Tauri editor, use pathTransformer if provided
        // 对于Tauri编辑器，使用pathTransformer（如果提供）
        if (this.config.pathTransformer) {
            return this.config.pathTransformer(path);
        }

        // Use configurable asset host or default to 'localhost'
        // 使用可配置的资产主机或默认为 'localhost'
        const host = this.config.assetHost || 'localhost';
        const sanitizedPath = PathValidator.sanitize(path);
        return `asset://${host}/${sanitizedPath}`;
    }

    /**
     * Check if path is absolute URL
     * 检查路径是否为绝对URL
     */
    private isAbsoluteUrl(path: string): boolean {
        return /^(https?:\/\/|file:\/\/|asset:\/\/)/.test(path);
    }

    /**
     * Get asset directory from path
     * 从路径获取资产目录
     */
    getAssetDirectory(path: string): string {
        const resolved = this.resolve(path);
        const lastSlash = resolved.lastIndexOf('/');
        return lastSlash >= 0 ? resolved.substring(0, lastSlash) : '';
    }

    /**
     * Get asset filename from path
     * 从路径获取资产文件名
     */
    getAssetFilename(path: string): string {
        const resolved = this.resolve(path);
        const lastSlash = resolved.lastIndexOf('/');
        return lastSlash >= 0 ? resolved.substring(lastSlash + 1) : resolved;
    }

    /**
     * Join paths
     * 连接路径
     */
    join(...paths: string[]): string {
        return paths.join('/').replace(/\/+/g, '/');
    }

    /**
     * Normalize path
     * 规范化路径
     */
    normalize(path: string): string {
        return path.replace(/\\/g, '/').replace(/\/+/g, '/');
    }
}
