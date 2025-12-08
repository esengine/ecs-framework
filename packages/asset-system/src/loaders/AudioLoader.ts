/**
 * Audio asset loader
 * 音频资产加载器
 */

import { AssetType } from '../types/AssetTypes';
import { IAssetLoader, IAudioAsset, IAssetParseContext } from '../interfaces/IAssetLoader';
import { IAssetContent, AssetContentType } from '../interfaces/IAssetReader';

/**
 * Audio loader implementation
 * 音频加载器实现
 *
 * Uses Web Audio API to decode audio data into AudioBuffer.
 * 使用 Web Audio API 将音频数据解码为 AudioBuffer。
 */
export class AudioLoader implements IAssetLoader<IAudioAsset> {
    readonly supportedType = AssetType.Audio;
    readonly supportedExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'];
    readonly contentType: AssetContentType = 'audio';

    private static _audioContext: AudioContext | null = null;

    /**
     * Get or create shared AudioContext
     * 获取或创建共享的 AudioContext
     */
    private static getAudioContext(): AudioContext {
        if (!AudioLoader._audioContext) {
            // 兼容旧版 Safari 的 webkitAudioContext
            // Support legacy Safari webkitAudioContext
            const AudioContextClass = window.AudioContext ||
                (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!AudioContextClass) {
                throw new Error('AudioContext is not supported in this browser');
            }
            AudioLoader._audioContext = new AudioContextClass();
        }
        return AudioLoader._audioContext;
    }

    /**
     * Parse audio from content.
     * 从内容解析音频。
     */
    async parse(content: IAssetContent, _context: IAssetParseContext): Promise<IAudioAsset> {
        if (!content.audioBuffer) {
            throw new Error('Audio content is empty');
        }

        const audioBuffer = content.audioBuffer;

        const audioAsset: IAudioAsset = {
            buffer: audioBuffer,
            duration: audioBuffer.duration,
            sampleRate: audioBuffer.sampleRate,
            channels: audioBuffer.numberOfChannels
        };

        return audioAsset;
    }

    /**
     * Dispose loaded asset
     * 释放已加载的资产
     */
    dispose(_asset: IAudioAsset): void {
        // AudioBuffer doesn't need explicit cleanup in most browsers
        // AudioBuffer 在大多数浏览器中不需要显式清理
        // The garbage collector will handle it when no references remain
        // 当没有引用时，垃圾回收器会处理它
    }

    /**
     * Close the shared AudioContext
     * 关闭共享的 AudioContext
     *
     * Call this when completely shutting down audio system.
     * 在完全关闭音频系统时调用。
     */
    static closeAudioContext(): void {
        if (AudioLoader._audioContext) {
            AudioLoader._audioContext.close();
            AudioLoader._audioContext = null;
        }
    }

    /**
     * Resume AudioContext after user interaction
     * 用户交互后恢复 AudioContext
     *
     * Browsers require user interaction before audio can play.
     * 浏览器要求用户交互后才能播放音频。
     */
    static async resumeAudioContext(): Promise<void> {
        const ctx = AudioLoader.getAudioContext();
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }
    }

    /**
     * Get the shared AudioContext instance
     * 获取共享的 AudioContext 实例
     */
    static get audioContext(): AudioContext {
        return AudioLoader.getAudioContext();
    }
}
