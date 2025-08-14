/**
 * 消息压缩器
 * 提供多种压缩算法选择和压缩率统计
 */
import { createLogger } from '@esengine/ecs-framework';
import * as zlib from 'zlib';
import { promisify } from 'util';

/**
 * 压缩算法类型
 */
export enum CompressionAlgorithm {
    NONE = 'none',
    GZIP = 'gzip',
    DEFLATE = 'deflate',
    BROTLI = 'brotli'
}

/**
 * 压缩配置
 */
export interface CompressionConfig {
    algorithm: CompressionAlgorithm;
    level: number;              // 压缩级别 (0-9)
    threshold: number;          // 最小压缩阈值（字节）
    enableAsync: boolean;       // 是否启用异步压缩
    chunkSize: number;          // 分块大小
}

/**
 * 压缩结果
 */
export interface CompressionResult {
    data: Buffer;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    compressionTime: number;
    algorithm: CompressionAlgorithm;
}

/**
 * 压缩统计信息
 */
export interface CompressionStats {
    totalCompressed: number;
    totalDecompressed: number;
    totalOriginalBytes: number;
    totalCompressedBytes: number;
    averageCompressionRatio: number;
    averageCompressionTime: number;
    averageDecompressionTime: number;
    algorithmUsage: Record<CompressionAlgorithm, number>;
}

/**
 * 消息压缩器
 */
export class MessageCompressor {
    private logger = createLogger('MessageCompressor');
    private config: CompressionConfig;
    private stats: CompressionStats;

    // 异步压缩函数
    private gzipAsync = promisify(zlib.gzip);
    private gunzipAsync = promisify(zlib.gunzip);
    private deflateAsync = promisify(zlib.deflate);
    private inflateAsync = promisify(zlib.inflate);
    private brotliCompressAsync = promisify(zlib.brotliCompress);
    private brotliDecompressAsync = promisify(zlib.brotliDecompress);

    /**
     * 构造函数
     */
    constructor(config: Partial<CompressionConfig> = {}) {
        this.config = {
            algorithm: CompressionAlgorithm.GZIP,
            level: 6,               // 平衡压缩率和速度
            threshold: 1024,        // 1KB以上才压缩
            enableAsync: true,
            chunkSize: 64 * 1024,   // 64KB分块
            ...config
        };

        this.stats = {
            totalCompressed: 0,
            totalDecompressed: 0,
            totalOriginalBytes: 0,
            totalCompressedBytes: 0,
            averageCompressionRatio: 0,
            averageCompressionTime: 0,
            averageDecompressionTime: 0,
            algorithmUsage: {
                [CompressionAlgorithm.NONE]: 0,
                [CompressionAlgorithm.GZIP]: 0,
                [CompressionAlgorithm.DEFLATE]: 0,
                [CompressionAlgorithm.BROTLI]: 0
            }
        };
    }

    /**
     * 压缩数据
     */
    async compress(data: string | Buffer): Promise<CompressionResult> {
        const startTime = performance.now();
        const inputBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
        const originalSize = inputBuffer.length;

        try {
            // 检查是否需要压缩
            if (originalSize < this.config.threshold) {
                return this.createNoCompressionResult(inputBuffer, originalSize, startTime);
            }

            let compressedData: Buffer;
            const algorithm = this.config.algorithm;

            // 根据算法进行压缩
            switch (algorithm) {
                case CompressionAlgorithm.GZIP:
                    compressedData = await this.compressGzip(inputBuffer);
                    break;
                case CompressionAlgorithm.DEFLATE:
                    compressedData = await this.compressDeflate(inputBuffer);
                    break;
                case CompressionAlgorithm.BROTLI:
                    compressedData = await this.compressBrotli(inputBuffer);
                    break;
                case CompressionAlgorithm.NONE:
                default:
                    return this.createNoCompressionResult(inputBuffer, originalSize, startTime);
            }

            const endTime = performance.now();
            const compressionTime = endTime - startTime;
            const compressedSize = compressedData.length;
            const compressionRatio = originalSize > 0 ? compressedSize / originalSize : 1;

            // 检查压缩效果
            if (compressedSize >= originalSize * 0.9) {
                // 压缩效果不明显，返回原始数据
                this.logger.debug(`压缩效果不佳，返回原始数据。原始: ${originalSize}, 压缩: ${compressedSize}`);
                return this.createNoCompressionResult(inputBuffer, originalSize, startTime);
            }

            const result: CompressionResult = {
                data: compressedData,
                originalSize,
                compressedSize,
                compressionRatio,
                compressionTime,
                algorithm
            };

            // 更新统计
            this.updateCompressionStats(result);

            return result;

        } catch (error) {
            this.logger.error('压缩失败:', error);
            return this.createNoCompressionResult(inputBuffer, originalSize, startTime);
        }
    }

    /**
     * 解压缩数据
     */
    async decompress(data: Buffer, algorithm: CompressionAlgorithm): Promise<Buffer> {
        const startTime = performance.now();

        try {
            if (algorithm === CompressionAlgorithm.NONE) {
                return data;
            }

            let decompressedData: Buffer;

            switch (algorithm) {
                case CompressionAlgorithm.GZIP:
                    decompressedData = await this.decompressGzip(data);
                    break;
                case CompressionAlgorithm.DEFLATE:
                    decompressedData = await this.decompressDeflate(data);
                    break;
                case CompressionAlgorithm.BROTLI:
                    decompressedData = await this.decompressBrotli(data);
                    break;
                default:
                    throw new Error(`不支持的压缩算法: ${algorithm}`);
            }

            const endTime = performance.now();
            const decompressionTime = endTime - startTime;

            // 更新统计
            this.updateDecompressionStats(decompressionTime);

            return decompressedData;

        } catch (error) {
            this.logger.error('解压缩失败:', error);
            throw error;
        }
    }

    /**
     * 批量压缩
     */
    async compressBatch(dataList: (string | Buffer)[]): Promise<CompressionResult[]> {
        const results: CompressionResult[] = [];

        if (this.config.enableAsync) {
            // 并行压缩
            const promises = dataList.map(data => this.compress(data));
            return await Promise.all(promises);
        } else {
            // 串行压缩
            for (const data of dataList) {
                results.push(await this.compress(data));
            }
            return results;
        }
    }

    /**
     * 自适应压缩
     * 根据数据特征自动选择最佳压缩算法
     */
    async compressAdaptive(data: string | Buffer): Promise<CompressionResult> {
        const inputBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
        const originalAlgorithm = this.config.algorithm;

        try {
            // 对小数据进行算法测试
            const testSize = Math.min(inputBuffer.length, 4096); // 测试前4KB
            const testData = inputBuffer.subarray(0, testSize);

            const algorithms = [
                CompressionAlgorithm.GZIP,
                CompressionAlgorithm.DEFLATE,
                CompressionAlgorithm.BROTLI
            ];

            let bestAlgorithm = CompressionAlgorithm.GZIP;
            let bestRatio = 1;

            // 测试不同算法的压缩效果
            for (const algorithm of algorithms) {
                try {
                    this.config.algorithm = algorithm;
                    const testResult = await this.compress(testData);
                    
                    if (testResult.compressionRatio < bestRatio) {
                        bestRatio = testResult.compressionRatio;
                        bestAlgorithm = algorithm;
                    }
                } catch (error) {
                    // 忽略测试失败的算法
                    continue;
                }
            }

            // 使用最佳算法压缩完整数据
            this.config.algorithm = bestAlgorithm;
            const result = await this.compress(inputBuffer);

            this.logger.debug(`自适应压缩选择算法: ${bestAlgorithm}, 压缩率: ${result.compressionRatio.toFixed(3)}`);

            return result;

        } finally {
            // 恢复原始配置
            this.config.algorithm = originalAlgorithm;
        }
    }

    /**
     * 获取统计信息
     */
    getStats(): CompressionStats {
        return { ...this.stats };
    }

    /**
     * 重置统计信息
     */
    resetStats(): void {
        this.stats = {
            totalCompressed: 0,
            totalDecompressed: 0,
            totalOriginalBytes: 0,
            totalCompressedBytes: 0,
            averageCompressionRatio: 0,
            averageCompressionTime: 0,
            averageDecompressionTime: 0,
            algorithmUsage: {
                [CompressionAlgorithm.NONE]: 0,
                [CompressionAlgorithm.GZIP]: 0,
                [CompressionAlgorithm.DEFLATE]: 0,
                [CompressionAlgorithm.BROTLI]: 0
            }
        };
    }

    /**
     * 更新配置
     */
    updateConfig(newConfig: Partial<CompressionConfig>): void {
        Object.assign(this.config, newConfig);
        this.logger.info('压缩器配置已更新:', newConfig);
    }

    /**
     * 获取压缩建议
     */
    getCompressionRecommendation(dataSize: number, dataType: string): CompressionAlgorithm {
        // 根据数据大小和类型推荐压缩算法
        if (dataSize < this.config.threshold) {
            return CompressionAlgorithm.NONE;
        }

        if (dataType === 'json' || dataType === 'text') {
            // 文本数据推荐GZIP
            return CompressionAlgorithm.GZIP;
        } else if (dataType === 'binary') {
            // 二进制数据推荐DEFLATE
            return CompressionAlgorithm.DEFLATE;
        } else {
            // 默认推荐GZIP
            return CompressionAlgorithm.GZIP;
        }
    }

    /**
     * GZIP压缩
     */
    private async compressGzip(data: Buffer): Promise<Buffer> {
        if (this.config.enableAsync) {
            return await this.gzipAsync(data, { level: this.config.level });
        } else {
            return zlib.gzipSync(data, { level: this.config.level });
        }
    }

    /**
     * GZIP解压缩
     */
    private async decompressGzip(data: Buffer): Promise<Buffer> {
        if (this.config.enableAsync) {
            return await this.gunzipAsync(data);
        } else {
            return zlib.gunzipSync(data);
        }
    }

    /**
     * DEFLATE压缩
     */
    private async compressDeflate(data: Buffer): Promise<Buffer> {
        if (this.config.enableAsync) {
            return await this.deflateAsync(data, { level: this.config.level });
        } else {
            return zlib.deflateSync(data, { level: this.config.level });
        }
    }

    /**
     * DEFLATE解压缩
     */
    private async decompressDeflate(data: Buffer): Promise<Buffer> {
        if (this.config.enableAsync) {
            return await this.inflateAsync(data);
        } else {
            return zlib.inflateSync(data);
        }
    }

    /**
     * BROTLI压缩
     */
    private async compressBrotli(data: Buffer): Promise<Buffer> {
        const options = {
            params: {
                [zlib.constants.BROTLI_PARAM_QUALITY]: this.config.level
            }
        };

        if (this.config.enableAsync) {
            return await this.brotliCompressAsync(data, options);
        } else {
            return zlib.brotliCompressSync(data, options);
        }
    }

    /**
     * BROTLI解压缩
     */
    private async decompressBrotli(data: Buffer): Promise<Buffer> {
        if (this.config.enableAsync) {
            return await this.brotliDecompressAsync(data);
        } else {
            return zlib.brotliDecompressSync(data);
        }
    }

    /**
     * 创建无压缩结果
     */
    private createNoCompressionResult(
        data: Buffer, 
        originalSize: number, 
        startTime: number
    ): CompressionResult {
        const endTime = performance.now();
        const result: CompressionResult = {
            data,
            originalSize,
            compressedSize: originalSize,
            compressionRatio: 1,
            compressionTime: endTime - startTime,
            algorithm: CompressionAlgorithm.NONE
        };

        this.updateCompressionStats(result);
        return result;
    }

    /**
     * 更新压缩统计
     */
    private updateCompressionStats(result: CompressionResult): void {
        this.stats.totalCompressed++;
        this.stats.totalOriginalBytes += result.originalSize;
        this.stats.totalCompressedBytes += result.compressedSize;
        this.stats.algorithmUsage[result.algorithm]++;

        // 计算平均值
        this.stats.averageCompressionRatio = 
            this.stats.totalOriginalBytes > 0 ? 
            this.stats.totalCompressedBytes / this.stats.totalOriginalBytes : 1;

        // 更新平均压缩时间（使用移动平均）
        const alpha = 0.1; // 平滑因子
        this.stats.averageCompressionTime = 
            this.stats.averageCompressionTime * (1 - alpha) + result.compressionTime * alpha;
    }

    /**
     * 更新解压缩统计
     */
    private updateDecompressionStats(decompressionTime: number): void {
        this.stats.totalDecompressed++;

        // 更新平均解压缩时间（使用移动平均）
        const alpha = 0.1;
        this.stats.averageDecompressionTime = 
            this.stats.averageDecompressionTime * (1 - alpha) + decompressionTime * alpha;
    }

    /**
     * 获取压缩效率报告
     */
    getEfficiencyReport() {
        const savings = this.stats.totalOriginalBytes - this.stats.totalCompressedBytes;
        const savingsPercentage = this.stats.totalOriginalBytes > 0 ? 
            (savings / this.stats.totalOriginalBytes) * 100 : 0;

        return {
            totalSavings: savings,
            savingsPercentage,
            averageCompressionRatio: this.stats.averageCompressionRatio,
            averageCompressionTime: this.stats.averageCompressionTime,
            averageDecompressionTime: this.stats.averageDecompressionTime,
            algorithmUsage: this.stats.algorithmUsage,
            recommendation: this.generateRecommendation()
        };
    }

    /**
     * 生成优化建议
     */
    private generateRecommendation(): string {
        const ratio = this.stats.averageCompressionRatio;
        const time = this.stats.averageCompressionTime;

        if (ratio > 0.8) {
            return '压缩效果较差，建议调整算法或提高压缩级别';
        } else if (time > 50) {
            return '压缩时间较长，建议降低压缩级别或使用更快的算法';
        } else if (ratio < 0.3) {
            return '压缩效果很好，当前配置最优';
        } else {
            return '压缩性能正常';
        }
    }
}