/**
 * Tauri Asset Reader
 * Tauri 资产读取器
 *
 * Implements IAssetReader for Tauri/editor environment.
 * 为 Tauri/编辑器环境实现 IAssetReader。
 */

import { invoke } from '@tauri-apps/api/core';
import { convertFileSrc } from '@tauri-apps/api/core';
import type { IAssetReader } from '@esengine/asset-system';

/**
 * Asset reader implementation for Tauri.
 * Tauri 的资产读取器实现。
 */
export class TauriAssetReader implements IAssetReader {
    /**
     * Read file as text.
     * 读取文件为文本。
     */
    async readText(absolutePath: string): Promise<string> {
        return await invoke<string>('read_file_content', { path: absolutePath });
    }

    /**
     * Read file as binary.
     * 读取文件为二进制。
     */
    async readBinary(absolutePath: string): Promise<ArrayBuffer> {
        const bytes = await invoke<number[]>('read_binary_file', { filePath: absolutePath });
        return new Uint8Array(bytes).buffer;
    }

    /**
     * Load image from file.
     * 从文件加载图片。
     */
    async loadImage(absolutePath: string): Promise<HTMLImageElement> {
        // Only convert if not already a URL.
        // 仅当不是 URL 时才转换。
        let assetUrl = absolutePath;
        if (!absolutePath.startsWith('http://') &&
            !absolutePath.startsWith('https://') &&
            !absolutePath.startsWith('data:') &&
            !absolutePath.startsWith('asset://')) {
            assetUrl = convertFileSrc(absolutePath);
        }

        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error(`Failed to load image: ${absolutePath}`));
            image.src = assetUrl;
        });
    }

    /**
     * Load audio from file.
     * 从文件加载音频。
     */
    async loadAudio(absolutePath: string): Promise<AudioBuffer> {
        const binary = await this.readBinary(absolutePath);
        const audioContext = new AudioContext();
        return await audioContext.decodeAudioData(binary);
    }

    /**
     * Check if file exists.
     * 检查文件是否存在。
     */
    async exists(absolutePath: string): Promise<boolean> {
        try {
            await invoke('read_file_content', { path: absolutePath });
            return true;
        } catch {
            return false;
        }
    }
}
