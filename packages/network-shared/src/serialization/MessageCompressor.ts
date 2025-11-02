/**
 * 消息压缩器框架
 * 提供可扩展的压缩算法接口，用户可以注册自定义压缩算法
 */
import { createLogger } from '@esengine/ecs-framework';

/**
 * 压缩算法接口
 */
export interface ICompressionAlgorithm {
    /** 算法名称 */
    readonly name: string;
    /** 算法版本 */
    readonly version: string;
    /** 是否支持异步压缩 */
    readonly supportsAsync: boolean;

    /**
     * 同步压缩
     */
    compress(data: ArrayBuffer): ArrayBuffer;

    /**
     * 同步解压缩
     */
    decompress(data: ArrayBuffer): ArrayBuffer;

    /**
     * 异步压缩（可选）
     */
    compressAsync?(data: ArrayBuffer): Promise<ArrayBuffer>;

    /**
     * 异步解压缩（可选）
     */
    decompressAsync?(data: ArrayBuffer): Promise<ArrayBuffer>;

    /**
     * 估算压缩后大小（可选）
     */
    estimateCompressedSize?(data: ArrayBuffer): number;
}

/**
 * 压缩配置
 */
export interface CompressionConfig {
    /** 默认压缩算法名称 */
    defaultAlgorithm: string;
    /** 最小压缩阈值（字节） */
    threshold: number;
    /** 是否启用异步压缩 */
    enableAsync: boolean;
    /** 压缩级别提示 (0-9) */
    level: number;
    /** 分块大小 */
    chunkSize: number;
    /** 是否启用压缩统计 */
    enableStats: boolean;
}

/**
 * 压缩结果
 */
export interface CompressionResult {
    /** 压缩后的数据 */
    data: ArrayBuffer;
    /** 原始大小 */
    originalSize: number;
    /** 压缩后大小 */
    compressedSize: number;
    /** 压缩比 */
    compressionRatio: number;
    /** 压缩耗时 */
    compressionTime: number;
    /** 使用的算法 */
    algorithm: string;
    /** 是否实际进行了压缩 */
    wasCompressed: boolean;
}

/**
 * 解压缩结果
 */
export interface DecompressionResult {
    /** 解压缩后的数据 */
    data: ArrayBuffer;
    /** 原始压缩大小 */
    compressedSize: number;
    /** 解压缩后大小 */
    decompressedSize: number;
    /** 解压缩耗时 */
    decompressionTime: number;
    /** 使用的算法 */
    algorithm: string;
}

/**
 * 压缩统计信息
 */
export interface CompressionStats {
    /** 总压缩次数 */
    totalCompressions: number;
    /** 总解压缩次数 */
    totalDecompressions: number;
    /** 总原始字节数 */
    totalOriginalBytes: number;
    /** 总压缩字节数 */
    totalCompressedBytes: number;
    /** 平均压缩比 */
    averageCompressionRatio: number;
    /** 平均压缩时间 */
    averageCompressionTime: number;
    /** 平均解压缩时间 */
    averageDecompressionTime: number;
    /** 算法使用统计 */
    algorithmUsage: Record<string, number>;
}

/**
 * 无压缩算法实现（默认）
 */
export class NoCompressionAlgorithm implements ICompressionAlgorithm {
    readonly name = 'none';
    readonly version = '1.0.0';
    readonly supportsAsync = false;

    compress(data: ArrayBuffer): ArrayBuffer {
        return data.slice(0);
    }

    decompress(data: ArrayBuffer): ArrayBuffer {
        return data.slice(0);
    }

    estimateCompressedSize(data: ArrayBuffer): number {
        return data.byteLength;
    }
}

/**
 * LZ字符串压缩算法实现
 */
export class LZCompressionAlgorithm implements ICompressionAlgorithm {
    readonly name = 'lz-string';
    readonly version = '1.0.0';
    readonly supportsAsync = false;

    compress(data: ArrayBuffer): ArrayBuffer {
        // 将ArrayBuffer转换为字符串
        const decoder = new TextDecoder();
        const input = decoder.decode(data);

        if (!input) {
            return data.slice(0);
        }

        // LZ压缩算法
        const dictionary: { [key: string]: number } = {};
        let dictSize = 256;

        // 初始化字典
        for (let i = 0; i < 256; i++) {
            dictionary[String.fromCharCode(i)] = i;
        }

        let w = '';
        const result: number[] = [];

        for (let i = 0; i < input.length; i++) {
            const c = input.charAt(i);
            const wc = w + c;

            if (dictionary[wc] !== undefined) {
                w = wc;
            } else {
                result.push(dictionary[w]);
                dictionary[wc] = dictSize++;
                w = c;

                // 防止字典过大
                if (dictSize >= 0xFFFF) {
                    dictSize = 256;
                    // 重置字典
                    for (const key in dictionary) {
                        if (dictionary[key] >= 256) {
                            delete dictionary[key];
                        }
                    }
                }
            }
        }

        if (w) {
            result.push(dictionary[w]);
        }

        // 将结果转换为ArrayBuffer
        return this.numbersToArrayBuffer(result);
    }

    decompress(data: ArrayBuffer): ArrayBuffer {
        if (data.byteLength === 0) {
            return data.slice(0);
        }

        const numbers = this.arrayBufferToNumbers(data);
        if (numbers.length === 0) {
            return data.slice(0);
        }

        const dictionary: { [key: number]: string } = {};
        let dictSize = 256;

        // 初始化字典
        for (let i = 0; i < 256; i++) {
            dictionary[i] = String.fromCharCode(i);
        }

        let w = String.fromCharCode(numbers[0]);
        const result = [w];

        for (let i = 1; i < numbers.length; i++) {
            const k = numbers[i];
            let entry: string;

            if (dictionary[k] !== undefined) {
                entry = dictionary[k];
            } else if (k === dictSize) {
                entry = w + w.charAt(0);
            } else {
                throw new Error('LZ解压缩错误：无效的压缩数据');
            }

            result.push(entry);
            dictionary[dictSize++] = w + entry.charAt(0);
            w = entry;

            // 防止字典过大
            if (dictSize >= 0xFFFF) {
                dictSize = 256;
                // 重置字典
                for (const key in dictionary) {
                    if (parseInt(key) >= 256) {
                        delete dictionary[key];
                    }
                }
            }
        }

        // 将结果转换为ArrayBuffer
        const output = result.join('');
        const encoder = new TextEncoder();
        return encoder.encode(output).buffer;
    }

    estimateCompressedSize(data: ArrayBuffer): number {
        // 简单估算：假设压缩率在30%-70%之间
        const size = data.byteLength;
        return Math.floor(size * 0.5); // 50%的估算压缩率
    }

    /**
     * 将数字数组转换为ArrayBuffer
     */
    private numbersToArrayBuffer(numbers: number[]): ArrayBuffer {
        // 使用变长编码以节省空间
        const bytes: number[] = [];

        for (const num of numbers) {
            if (num < 128) {
                // 小于128，用1字节
                bytes.push(num);
            } else if (num < 16384) {
                // 小于16384，用2字节，最高位为1表示有下一字节
                bytes.push(0x80 | (num & 0x7F));
                bytes.push((num >> 7) & 0x7F);
            } else {
                // 大于等于16384，用3字节
                bytes.push(0x80 | (num & 0x7F));
                bytes.push(0x80 | ((num >> 7) & 0x7F));
                bytes.push((num >> 14) & 0x7F);
            }
        }

        return new Uint8Array(bytes).buffer;
    }

    /**
     * 将ArrayBuffer转换为数字数组
     */
    private arrayBufferToNumbers(buffer: ArrayBuffer): number[] {
        const bytes = new Uint8Array(buffer);
        const numbers: number[] = [];

        for (let i = 0; i < bytes.length; i++) {
            const byte1 = bytes[i];

            if ((byte1 & 0x80) === 0) {
                // 单字节数字
                numbers.push(byte1);
            } else {
                // 多字节数字
                let num = byte1 & 0x7F;
                i++;

                if (i < bytes.length) {
                    const byte2 = bytes[i];
                    num |= (byte2 & 0x7F) << 7;

                    if ((byte2 & 0x80) !== 0) {
                        // 三字节数字
                        i++;
                        if (i < bytes.length) {
                            const byte3 = bytes[i];
                            num |= (byte3 & 0x7F) << 14;
                        }
                    }
                }

                numbers.push(num);
            }
        }

        return numbers;
    }
}

/**
 * 消息压缩器
 */
export class MessageCompressor {
    private logger = createLogger('MessageCompressor');
    private config: CompressionConfig;
    private algorithms = new Map<string, ICompressionAlgorithm>();
    private stats: CompressionStats;

    /**
     * 构造函数
     */
    constructor(config: Partial<CompressionConfig> = {}) {
        this.config = {
            defaultAlgorithm: 'none',
            threshold: 1024,        // 1KB以上才压缩
            enableAsync: true,
            level: 6,
            chunkSize: 64 * 1024,   // 64KB分块
            enableStats: true,
            ...config
        };

        this.stats = {
            totalCompressions: 0,
            totalDecompressions: 0,
            totalOriginalBytes: 0,
            totalCompressedBytes: 0,
            averageCompressionRatio: 1.0,
            averageCompressionTime: 0,
            averageDecompressionTime: 0,
            algorithmUsage: {}
        };

        // 注册默认算法
        this.registerAlgorithm(new NoCompressionAlgorithm());
        this.registerAlgorithm(new LZCompressionAlgorithm());
    }

    /**
     * 注册压缩算法
     */
    public registerAlgorithm(algorithm: ICompressionAlgorithm): void {
        if (this.algorithms.has(algorithm.name)) {
            this.logger.warn(`压缩算法 '${algorithm.name}' 已存在，将被覆盖`);
        }

        this.algorithms.set(algorithm.name, algorithm);
        this.stats.algorithmUsage[algorithm.name] = 0;

        this.logger.info(`注册压缩算法: ${algorithm.name} v${algorithm.version}`);
    }

    /**
     * 注销压缩算法
     */
    public unregisterAlgorithm(algorithmName: string): boolean {
        if (algorithmName === 'none') {
            this.logger.warn('无法注销默认的无压缩算法');
            return false;
        }

        const removed = this.algorithms.delete(algorithmName);
        if (removed) {
            delete this.stats.algorithmUsage[algorithmName];
            this.logger.info(`注销压缩算法: ${algorithmName}`);
        }

        return removed;
    }

    /**
     * 获取已注册的算法列表
     */
    public getRegisteredAlgorithms(): string[] {
        return Array.from(this.algorithms.keys());
    }

    /**
     * 检查算法是否已注册
     */
    public hasAlgorithm(algorithmName: string): boolean {
        return this.algorithms.has(algorithmName);
    }

    /**
     * 压缩数据
     */
    public async compress(
        data: ArrayBuffer | string,
        algorithmName?: string
    ): Promise<CompressionResult> {
        const startTime = performance.now();

        // 转换输入数据
        const inputBuffer = typeof data === 'string'
            ? new TextEncoder().encode(data).buffer
            : data;
        const originalSize = inputBuffer.byteLength;

        // 选择压缩算法
        const selectedAlgorithm = algorithmName || this.config.defaultAlgorithm;
        const algorithm = this.algorithms.get(selectedAlgorithm);

        if (!algorithm) {
            throw new Error(`未找到压缩算法: ${selectedAlgorithm}`);
        }

        try {
            let compressedData: ArrayBuffer;
            let wasCompressed = false;

            // 检查是否需要压缩
            if (originalSize < this.config.threshold || selectedAlgorithm === 'none') {
                compressedData = inputBuffer.slice(0);
            } else {
                // 选择同步或异步压缩
                if (this.config.enableAsync && algorithm.supportsAsync && algorithm.compressAsync) {
                    compressedData = await algorithm.compressAsync(inputBuffer);
                } else {
                    compressedData = algorithm.compress(inputBuffer);
                }
                wasCompressed = true;
            }

            const endTime = performance.now();
            const compressionTime = endTime - startTime;
            const compressedSize = compressedData.byteLength;
            const compressionRatio = originalSize > 0 ? compressedSize / originalSize : 1;

            // 更新统计信息
            if (this.config.enableStats) {
                this.updateCompressionStats(
                    selectedAlgorithm,
                    originalSize,
                    compressedSize,
                    compressionTime
                );
            }

            const result: CompressionResult = {
                data: compressedData,
                originalSize,
                compressedSize,
                compressionRatio,
                compressionTime,
                algorithm: selectedAlgorithm,
                wasCompressed
            };

            this.logger.debug(
                `压缩完成: ${originalSize}B -> ${compressedSize}B ` +
                `(${(compressionRatio * 100).toFixed(1)}%) ` +
                `用时 ${compressionTime.toFixed(2)}ms, 算法: ${selectedAlgorithm}`
            );

            return result;

        } catch (error) {
            this.logger.error(`压缩失败 (${selectedAlgorithm}):`, error);
            throw error;
        }
    }

    /**
     * 解压缩数据
     */
    public async decompress(
        data: ArrayBuffer,
        algorithmName: string
    ): Promise<DecompressionResult> {
        const startTime = performance.now();
        const compressedSize = data.byteLength;

        const algorithm = this.algorithms.get(algorithmName);
        if (!algorithm) {
            throw new Error(`未找到解压缩算法: ${algorithmName}`);
        }

        try {
            let decompressedData: ArrayBuffer;

            // 选择同步或异步解压缩
            if (this.config.enableAsync && algorithm.supportsAsync && algorithm.decompressAsync) {
                decompressedData = await algorithm.decompressAsync(data);
            } else {
                decompressedData = algorithm.decompress(data);
            }

            const endTime = performance.now();
            const decompressionTime = endTime - startTime;
            const decompressedSize = decompressedData.byteLength;

            // 更新统计信息
            if (this.config.enableStats) {
                this.updateDecompressionStats(algorithmName, decompressionTime);
            }

            const result: DecompressionResult = {
                data: decompressedData,
                compressedSize,
                decompressedSize,
                decompressionTime,
                algorithm: algorithmName
            };

            this.logger.debug(
                `解压缩完成: ${compressedSize}B -> ${decompressedSize}B ` +
                `用时 ${decompressionTime.toFixed(2)}ms, 算法: ${algorithmName}`
            );

            return result;

        } catch (error) {
            this.logger.error(`解压缩失败 (${algorithmName}):`, error);
            throw error;
        }
    }

    /**
     * 估算压缩后大小
     */
    public estimateCompressedSize(
        data: ArrayBuffer,
        algorithmName?: string
    ): number {
        const selectedAlgorithm = algorithmName || this.config.defaultAlgorithm;
        const algorithm = this.algorithms.get(selectedAlgorithm);

        if (!algorithm) {
            return data.byteLength;
        }

        if (algorithm.estimateCompressedSize) {
            return algorithm.estimateCompressedSize(data);
        }

        // 如果没有估算函数，返回原始大小
        return data.byteLength;
    }

    /**
     * 获取压缩统计信息
     */
    public getStats(): CompressionStats {
        return { ...this.stats };
    }

    /**
     * 重置统计信息
     */
    public resetStats(): void {
        this.stats = {
            totalCompressions: 0,
            totalDecompressions: 0,
            totalOriginalBytes: 0,
            totalCompressedBytes: 0,
            averageCompressionRatio: 1.0,
            averageCompressionTime: 0,
            averageDecompressionTime: 0,
            algorithmUsage: {}
        };

        // 重新初始化算法使用统计
        for (const algorithmName of this.algorithms.keys()) {
            this.stats.algorithmUsage[algorithmName] = 0;
        }
    }

    /**
     * 更新配置
     */
    public updateConfig(newConfig: Partial<CompressionConfig>): void {
        Object.assign(this.config, newConfig);
        this.logger.info('压缩器配置已更新');
    }

    /**
     * 获取配置
     */
    public getConfig(): CompressionConfig {
        return { ...this.config };
    }

    /**
     * 更新压缩统计信息
     */
    private updateCompressionStats(
        algorithmName: string,
        originalSize: number,
        compressedSize: number,
        compressionTime: number
    ): void {
        this.stats.totalCompressions++;
        this.stats.totalOriginalBytes += originalSize;
        this.stats.totalCompressedBytes += compressedSize;
        this.stats.algorithmUsage[algorithmName]++;

        // 更新平均压缩比
        this.stats.averageCompressionRatio = this.stats.totalOriginalBytes > 0
            ? this.stats.totalCompressedBytes / this.stats.totalOriginalBytes
            : 1.0;

        // 更新平均压缩时间
        this.stats.averageCompressionTime =
            (this.stats.averageCompressionTime * (this.stats.totalCompressions - 1) + compressionTime)
            / this.stats.totalCompressions;
    }

    /**
     * 更新解压缩统计信息
     */
    private updateDecompressionStats(algorithmName: string, decompressionTime: number): void {
        this.stats.totalDecompressions++;

        // 更新平均解压缩时间
        this.stats.averageDecompressionTime =
            (this.stats.averageDecompressionTime * (this.stats.totalDecompressions - 1) + decompressionTime)
            / this.stats.totalDecompressions;
    }
}

/**
 * 全局压缩器实例
 */
export const globalCompressor = new MessageCompressor();
