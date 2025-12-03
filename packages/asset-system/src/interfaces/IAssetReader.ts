/**
 * Asset Reader Interface
 * 资产读取器接口
 *
 * Provides unified file reading abstraction across different platforms.
 * 提供跨平台的统一文件读取抽象。
 */

/**
 * Asset content types.
 * 资产内容类型。
 */
export type AssetContentType = 'text' | 'binary' | 'image' | 'audio';

/**
 * Asset content result.
 * 资产内容结果。
 */
export interface IAssetContent {
    /** Content type. | 内容类型。 */
    type: AssetContentType;
    /** Text content (for text/json files). | 文本内容。 */
    text?: string;
    /** Binary content. | 二进制内容。 */
    binary?: ArrayBuffer;
    /** Image element (for textures). | 图片元素。 */
    image?: HTMLImageElement;
    /** Audio buffer (for audio files). | 音频缓冲区。 */
    audioBuffer?: AudioBuffer;
}

/**
 * Asset reader interface.
 * 资产读取器接口。
 *
 * Abstracts platform-specific file reading operations.
 * 抽象平台特定的文件读取操作。
 */
export interface IAssetReader {
    /**
     * Read file as text.
     * 读取文件为文本。
     *
     * @param absolutePath - Absolute file path. | 绝对文件路径。
     * @returns Text content. | 文本内容。
     */
    readText(absolutePath: string): Promise<string>;

    /**
     * Read file as binary.
     * 读取文件为二进制。
     *
     * @param absolutePath - Absolute file path. | 绝对文件路径。
     * @returns Binary content. | 二进制内容。
     */
    readBinary(absolutePath: string): Promise<ArrayBuffer>;

    /**
     * Load image from file.
     * 从文件加载图片。
     *
     * @param absolutePath - Absolute file path. | 绝对文件路径。
     * @returns Image element. | 图片元素。
     */
    loadImage(absolutePath: string): Promise<HTMLImageElement>;

    /**
     * Load audio from file.
     * 从文件加载音频。
     *
     * @param absolutePath - Absolute file path. | 绝对文件路径。
     * @returns Audio buffer. | 音频缓冲区。
     */
    loadAudio(absolutePath: string): Promise<AudioBuffer>;

    /**
     * Check if file exists.
     * 检查文件是否存在。
     *
     * @param absolutePath - Absolute file path. | 绝对文件路径。
     * @returns True if exists. | 是否存在。
     */
    exists(absolutePath: string): Promise<boolean>;
}

/**
 * Service identifier for IAssetReader.
 * IAssetReader 的服务标识符。
 */
export const IAssetReaderService = Symbol.for('IAssetReaderService');
