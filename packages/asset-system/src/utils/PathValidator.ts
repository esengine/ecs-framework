/**
 * Path Validator
 * 路径验证器
 *
 * Validates and sanitizes asset paths for security
 * 验证并清理资产路径以确保安全
 */

export class PathValidator {
    // Dangerous path patterns
    private static readonly DANGEROUS_PATTERNS = [
        /\.\.[/\\]/g,  // Path traversal attempts (..)
        /^[/\\]/,      // Absolute paths on Unix
        /^[a-zA-Z]:[/\\]/,  // Absolute paths on Windows
        /[<>:"|?*]/,    // Invalid characters for Windows paths
        /\0/,           // Null bytes
        /%00/,          // URL encoded null bytes
        /\.\.%2[fF]/   // URL encoded path traversal
    ];

    // Valid path characters (alphanumeric, dash, underscore, dot, slash)
    private static readonly VALID_PATH_REGEX = /^[a-zA-Z0-9\-_./\\@]+$/;

    // Maximum path length
    private static readonly MAX_PATH_LENGTH = 260;

    /**
     * Validate if a path is safe
     * 验证路径是否安全
     */
    static validate(path: string): { valid: boolean; reason?: string } {
        // Check for null/undefined/empty
        if (!path || typeof path !== 'string') {
            return { valid: false, reason: 'Path is empty or invalid' };
        }

        // Check length
        if (path.length > this.MAX_PATH_LENGTH) {
            return { valid: false, reason: `Path exceeds maximum length of ${this.MAX_PATH_LENGTH} characters` };
        }

        // Check for dangerous patterns
        for (const pattern of this.DANGEROUS_PATTERNS) {
            if (pattern.test(path)) {
                return { valid: false, reason: 'Path contains dangerous pattern' };
            }
        }

        // Check for valid characters
        if (!this.VALID_PATH_REGEX.test(path)) {
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
            .filter(s => s && typeof s === 'string')
            .map(s => this.sanitize(s))
            .filter(s => s.length > 0);

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