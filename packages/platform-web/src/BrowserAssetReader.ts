/**
 * Browser Asset Reader
 * 浏览器资产读取器
 *
 * Implements IAssetReader interface for browser environment.
 * Uses fetch API to load assets from web server.
 */

/**
 * Browser Asset Reader for loading assets via fetch API
 * 通过 fetch API 加载资产的浏览器读取器
 */
export class BrowserAssetReader {
    private _baseUrl: string;
    private _audioContext: AudioContext | null = null;

    constructor(baseUrl: string = '/assets') {
        this._baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    }

    /**
     * Resolve asset path to URL
     * 将资产路径解析为 URL
     */
    private _resolveUrl(absolutePath: string): string {
        // Handle absolute Windows paths (e.g., F:\TowerECS\assets\...)
        if (/^[A-Za-z]:[\\/]/.test(absolutePath)) {
            const normalized = absolutePath.replace(/\\/g, '/');
            const assetsIndex = normalized.toLowerCase().indexOf('/assets/');
            if (assetsIndex >= 0) {
                return `${this._baseUrl}${normalized.substring(assetsIndex + 7)}`;
            }
            const filename = normalized.split('/').pop();
            return `${this._baseUrl}/${filename}`;
        }

        // Handle relative paths
        if (absolutePath.startsWith('./') || absolutePath.startsWith('../')) {
            return absolutePath;
        }
        if (absolutePath.startsWith('/assets/')) {
            return absolutePath;
        }
        if (absolutePath.startsWith('assets/')) {
            return `/${absolutePath}`;
        }
        return `${this._baseUrl}/${absolutePath}`;
    }

    /**
     * Read text file
     * 读取文本文件
     */
    async readText(absolutePath: string): Promise<string> {
        const url = this._resolveUrl(absolutePath);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load text: ${url} (${response.status})`);
        }
        return response.text();
    }

    /**
     * Read binary file
     * 读取二进制文件
     */
    async readBinary(absolutePath: string): Promise<ArrayBuffer> {
        const url = this._resolveUrl(absolutePath);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load binary: ${url} (${response.status})`);
        }
        return response.arrayBuffer();
    }

    /**
     * Load image
     * 加载图片
     */
    async loadImage(absolutePath: string): Promise<HTMLImageElement> {
        const url = this._resolveUrl(absolutePath);
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
            img.src = url;
        });
    }

    /**
     * Load audio
     * 加载音频
     */
    async loadAudio(absolutePath: string): Promise<AudioBuffer> {
        if (!this._audioContext) {
            this._audioContext = new AudioContext();
        }
        const url = this._resolveUrl(absolutePath);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load audio: ${url} (${response.status})`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return this._audioContext.decodeAudioData(arrayBuffer);
    }

    /**
     * Check if file exists
     * 检查文件是否存在
     */
    async exists(absolutePath: string): Promise<boolean> {
        const url = this._resolveUrl(absolutePath);
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Get base URL
     * 获取基础 URL
     */
    get baseUrl(): string {
        return this._baseUrl;
    }
}
