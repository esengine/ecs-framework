/**
 * Path Validator
 * 路径验证器
 *
 * Validates and sanitizes asset paths for security
 * 验证并清理资产路径以确保安全
 */

/**
 * Path validation options.
 * 路径验证选项。
 */
export interface PathValidationOptions {
    /** Allow absolute paths (for editor environment). | 允许绝对路径（用于编辑器环境）。 */
    allowAbsolutePaths?: boolean;
    /** Allow URLs (http://, https://, asset://). | 允许 URL。 */
    allowUrls?: boolean;
}

export class PathValidator {
    // Dangerous path patterns (without absolute path checks)
    private static readonly DANGEROUS_PATTERNS_STRICT = [
        /\.\.[/\\]/g,  // Path traversal attempts (..)
        /^[/\\]/,      // Absolute paths on Unix
        /^[a-zA-Z]:[/\\]/,  // Absolute paths on Windows
        /\0/,           // Null bytes
        /%00/,          // URL encoded null bytes
        /\.\.%2[fF]/   // URL encoded path traversal
    ];

    // Dangerous path patterns (allowing absolute paths)
    private static readonly DANGEROUS_PATTERNS_RELAXED = [
        /\.\.[/\\]/g,  // Path traversal attempts (..)
        /\0/,           // Null bytes
        /%00/,          // URL encoded null bytes
        /\.\.%2[fF]/   // URL encoded path traversal
    ];

    // Valid path characters for relative paths (alphanumeric, dash, underscore, dot, slash)
    private static readonly VALID_PATH_REGEX = /^[a-zA-Z0-9\-_./\\@]+$/;

    // Valid path characters for absolute paths (includes colon for Windows drives)
    private static readonly VALID_ABSOLUTE_PATH_REGEX = /^[a-zA-Z0-9\-_./\\@:]+$/;

    // URL pattern
    private static readonly URL_REGEX = /^(https?|asset|blob|data):\/\//;

    // Maximum path length
    private static readonly MAX_PATH_LENGTH = 1024;

    /** Global options for path validation. | 路径验证的全局选项。 */
    private static _globalOptions: PathValidationOptions = {
        allowAbsolutePaths: false,
        allowUrls: true
    };

    /**
     * Set global validation options.
     * 设置全局验证选项。
     */
    static setGlobalOptions(options: PathValidationOptions): void {
        this._globalOptions = { ...this._globalOptions, ...options };
    }

    /**
     * Get current global options.
     * 获取当前全局选项。
     */
    static getGlobalOptions(): PathValidationOptions {
        return { ...this._globalOptions };
    }

    /**
     * Validate if a path is safe
     * 验证路径是否安全
     */
    static validate(path: string, options?: PathValidationOptions): { valid: boolean; reason?: string } {
        const opts = { ...this._globalOptions, ...options };

        // Check for null/undefined/empty
        if (!path || typeof path !== 'string') {
            return { valid: false, reason: 'Path is empty or invalid' };
        }

        // Check length
        if (path.length > this.MAX_PATH_LENGTH) {
            return { valid: false, reason: `Path exceeds maximum length of ${this.MAX_PATH_LENGTH} characters` };
        }

        // Allow URLs if enabled
        if (opts.allowUrls && this.URL_REGEX.test(path)) {
            return { valid: true };
        }

        // Choose patterns based on options
        const patterns = opts.allowAbsolutePaths
            ? this.DANGEROUS_PATTERNS_RELAXED
            : this.DANGEROUS_PATTERNS_STRICT;

        // Check for dangerous patterns
        for (const pattern of patterns) {
            if (pattern.test(path)) {
                return { valid: false, reason: 'Path contains dangerous pattern' };
            }
        }

        // Check for valid characters
        const validCharsRegex = opts.allowAbsolutePaths
            ? this.VALID_ABSOLUTE_PATH_REGEX
            : this.VALID_PATH_REGEX;

        if (!validCharsRegex.test(path)) {
            return { valid: false, reason: 'Path contains invalid characters' };
        }

        return { valid: true };
    }

    /**
     * Sanitize a path
     * 清理路径
     */
    static sanitize(path: string): string {
        if (!path || typeof path !== 'string') {
            return '';
        }

        // Remove dangerous patterns
        let sanitized = path;

        // Remove path traversal (apply repeatedly until fully removed)
        let prev;
        do {
            prev = sanitized;
            sanitized = sanitized.replace(/\.\.[/\\]/g, '');
        } while (sanitized !== prev);

        // Remove leading slashes
        sanitized = sanitized.replace(/^[/\\]+/, '');

        // Remove null bytes
        sanitized = sanitized.replace(/\0/g, '');
        sanitized = sanitized.replace(/%00/g, '');

        // Remove invalid Windows characters
        sanitized = sanitized.replace(/[<>:"|?*]/g, '_');

        // Normalize slashes
        sanitized = sanitized.replace(/\\/g, '/');

        // Remove double slashes
        sanitized = sanitized.replace(/\/+/g, '/');

        // Trim whitespace
        sanitized = sanitized.trim();

        // Truncate if too long
        if (sanitized.length > this.MAX_PATH_LENGTH) {
            sanitized = sanitized.substring(0, this.MAX_PATH_LENGTH);
        }

        return sanitized;
    }

    /**
     * Check if path is trying to escape the base directory
     * 检查路径是否试图逃离基础目录
     */
    static isPathTraversal(path: string): boolean {
        const normalized = path.replace(/\\/g, '/');
        return normalized.includes('../') || normalized.includes('..\\');
    }

    /**
     * Normalize a path for consistent handling
     * 规范化路径以便一致处理
     */
    static normalize(path: string): string {
        if (!path) return '';

        // Sanitize first
        let normalized = this.sanitize(path);

        // Convert backslashes to forward slashes
        normalized = normalized.replace(/\\/g, '/');

        // Remove trailing slash (except for root)
        if (normalized.length > 1 && normalized.endsWith('/')) {
            normalized = normalized.slice(0, -1);
        }

        return normalized;
    }

    /**
     * Join path segments safely
     * 安全地连接路径段
     */
    static join(...segments: string[]): string {
        const validSegments = segments
            .filter((s) => s && typeof s === 'string')
            .map((s) => this.sanitize(s))
            .filter((s) => s.length > 0);

        if (validSegments.length === 0) {
            return '';
        }

        return this.normalize(validSegments.join('/'));
    }

    /**
     * Get file extension safely
     * 安全地获取文件扩展名
     */
    static getExtension(path: string): string {
        const sanitized = this.sanitize(path);
        const lastDot = sanitized.lastIndexOf('.');
        const lastSlash = sanitized.lastIndexOf('/');

        if (lastDot > lastSlash && lastDot > 0) {
            return sanitized.substring(lastDot + 1).toLowerCase();
        }

        return '';
    }
}
