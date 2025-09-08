/**
 * 消息压缩器框架
 * 提供可扩展的压缩算法接口，用户可以注册自定义压缩算法
 */
import { createLogger } from '@esengine/ecs-framework';

/**
 * 容器头结构
 */
export interface ContainerHeader {
    /** 魔数标识 'MCF0' */
    magic: 'MCF0';
    /** 版本号 */
    version: 1;
    /** 压缩算法名称 */
    algo: string;
    /** 原始数据大小 */
    originalSize: number;
    /** 标志位，预留扩展用 */
    flags: number;
}

/**
 * 容器头解析结果
 */
export interface ParsedHeader {
    /** 解析到的头部信息 */
    header: ContainerHeader;
    /** 头部字节长度 */
    headerSize: number;
    /** 载荷数据 */
    payload: Uint8Array;
}

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
     * @param data - 待压缩的字节数据
     * @returns 压缩后的字节数据
     */
    compress(data: Uint8Array): Uint8Array;
    
    /**
     * 同步解压缩
     * @param data - 待解压的字节数据
     * @returns 解压后的字节数据
     */
    decompress(data: Uint8Array): Uint8Array;
    
    /**
     * 异步压缩（可选）
     */
    compressAsync?(data: Uint8Array): Promise<Uint8Array>;
    
    /**
     * 异步解压缩（可选）
     */
    decompressAsync?(data: Uint8Array): Promise<Uint8Array>;
    
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
    
    compress(data: Uint8Array): Uint8Array {
        return new Uint8Array(data);
    }
    
    decompress(data: Uint8Array): Uint8Array {
        return new Uint8Array(data);
    }
}

/**
 * LZ字符串压缩算法实现
 */
export class LZCompressionAlgorithm implements ICompressionAlgorithm {
    readonly name = 'lz-string';
    readonly version = '1.0.0';
    readonly supportsAsync = false;
    
    compress(data: Uint8Array): Uint8Array {
        if (data.length === 0) {
            return new Uint8Array(0);
        }
        
        // LZ压缩算法
        const dictionary: { [key: string]: number } = {};
        let dictSize = 256;
        
        // 初始化字典
        for (let i = 0; i < 256; i++) {
            dictionary[String(i)] = i;
        }
        
        let w = String(data[0]);
        const result: number[] = [];
        
        for (let i = 1; i < data.length; i++) {
            const c = String(data[i]);
            const wc = w + ',' + c; // 使用逗号分隔以避免歧义
            
            if (dictionary[wc] !== undefined) {
                w = wc;
            } else {
                result.push(dictionary[w]);
                dictionary[wc] = dictSize++;
                w = c;
                
                // 防止字典过大
                if (dictSize >= 0x8000) {
                    dictSize = 256;
                    // 重置字典，只保留单字节序列
                    const newDict: { [key: string]: number } = {};
                    for (let j = 0; j < 256; j++) {
                        newDict[String(j)] = j;
                    }
                    Object.assign(dictionary, newDict);
                }
            }
        }
        
        if (w) {
            result.push(dictionary[w]);
        }
        
        return this.numbersToUint8Array(result);
    }
    
    decompress(data: Uint8Array): Uint8Array {
        if (data.length === 0) {
            return new Uint8Array(0);
        }
        
        const numbers = this.uint8ArrayToNumbers(data);
        if (numbers.length === 0) {
            return new Uint8Array(0);
        }
        
        const dictionary: { [key: number]: number[] } = {};
        let dictSize = 256;
        
        // 初始化字典
        for (let i = 0; i < 256; i++) {
            dictionary[i] = [i];
        }
        
        let w = dictionary[numbers[0]];
        const result: number[] = [...w];
        
        for (let i = 1; i < numbers.length; i++) {
            const k = numbers[i];
            let entry: number[];
            
            if (dictionary[k] !== undefined) {
                entry = dictionary[k];
            } else if (k === dictSize) {
                entry = [...w, w[0]];
            } else {
                throw new Error('LZ解压缩错误：无效的压缩数据');
            }
            
            result.push(...entry);
            dictionary[dictSize++] = [...w, entry[0]];
            w = entry;
            
            // 防止字典过大
            if (dictSize >= 0x8000) {
                dictSize = 256;
                // 重置字典，只保留单字节序列
                const newDict: { [key: number]: number[] } = {};
                for (let j = 0; j < 256; j++) {
                    newDict[j] = [j];
                }
                Object.assign(dictionary, newDict);
            }
        }
        
        return new Uint8Array(result);
    }
    
    /**
     * 将数字数组编码为字节数组
     */
    private numbersToUint8Array(numbers: number[]): Uint8Array {
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
        
        return new Uint8Array(bytes);
    }
    
    /**
     * 将字节数组解码为数字数组
     */
    private uint8ArrayToNumbers(data: Uint8Array): number[] {
        const bytes = data;
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
        
        // 转换输入数据为 Uint8Array
        const inputData = typeof data === 'string' 
            ? new TextEncoder().encode(data)
            : new Uint8Array(data);
        const originalSize = inputData.length;
        
        // 选择压缩算法
        const selectedAlgorithm = algorithmName || this.config.defaultAlgorithm;
        const algorithm = this.algorithms.get(selectedAlgorithm);
        
        if (!algorithm) {
            throw new Error(`未找到压缩算法: ${selectedAlgorithm}`);
        }

        try {
            let compressedData: Uint8Array;
            let wasCompressed = false;

            // 检查是否需要压缩
            if (originalSize < this.config.threshold || selectedAlgorithm === 'none') {
                compressedData = new Uint8Array(inputData);
            } else {
                // 选择同步或异步压缩
                if (this.config.enableAsync && algorithm.supportsAsync && algorithm.compressAsync) {
                    compressedData = await algorithm.compressAsync(inputData);
                } else {
                    compressedData = algorithm.compress(inputData);
                }
                wasCompressed = true;
            }

            const endTime = performance.now();
            const compressionTime = endTime - startTime;
            const compressedSize = compressedData.byteLength;
            const compressionRatio = originalSize > 0 ? compressedSize / originalSize : 1;

            // 创建容器头
            const header: ContainerHeader = {
                magic: 'MCF0',
                version: 1,
                algo: selectedAlgorithm,
                originalSize,
                flags: 0 // 暂时保留扩展用
            };

            // 编码容器格式数据
            const containerData = this.encodeContainerHeader(header, compressedData);
            const finalCompressedSize = containerData.byteLength;
            const finalCompressionRatio = originalSize > 0 ? finalCompressedSize / originalSize : 1;

            // 更新统计信息
            if (this.config.enableStats) {
                this.updateCompressionStats(
                    selectedAlgorithm, 
                    originalSize, 
                    finalCompressedSize, 
                    compressionTime
                );
            }

            const result: CompressionResult = {
                data: containerData.buffer.slice(containerData.byteOffset, containerData.byteOffset + containerData.byteLength) as ArrayBuffer,
                originalSize,
                compressedSize: finalCompressedSize,
                compressionRatio: finalCompressionRatio,
                compressionTime,
                algorithm: selectedAlgorithm,
                wasCompressed
            };

            this.logger.debug(
                `压缩完成: ${originalSize}B -> ${finalCompressedSize}B ` +
                `(${(finalCompressionRatio * 100).toFixed(1)}%) ` +
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
    public async decompress(data: ArrayBuffer): Promise<DecompressionResult> {
        const startTime = performance.now();
        const compressedSize = data.byteLength;
        const inputData = new Uint8Array(data);
        
        // 检测并解析容器头
        if (!this.isContainerFormat(inputData)) {
            throw new Error('无效的压缩数据格式，缺少容器头');
        }

        const parsed = this.decodeContainerHeader(inputData);
        const { header, payload } = parsed;
        
        const algorithm = this.algorithms.get(header.algo);
        if (!algorithm) {
            throw new Error(`未找到解压缩算法: ${header.algo}`);
        }

        try {
            let decompressedUint8Array: Uint8Array;

            // 选择同步或异步解压缩
            if (this.config.enableAsync && algorithm.supportsAsync && algorithm.decompressAsync) {
                decompressedUint8Array = await algorithm.decompressAsync(payload);
            } else {
                decompressedUint8Array = algorithm.decompress(payload);
            }

            // 验证解压缩后的大小是否与头部记录一致
            if (decompressedUint8Array.length !== header.originalSize) {
                throw new Error(
                    `解压缩大小不匹配: 期望 ${header.originalSize}B, 实际 ${decompressedUint8Array.length}B`
                );
            }

            const decompressedData = decompressedUint8Array.buffer.slice(
                decompressedUint8Array.byteOffset, 
                decompressedUint8Array.byteOffset + decompressedUint8Array.byteLength
            );

            const endTime = performance.now();
            const decompressionTime = endTime - startTime;
            const decompressedSize = decompressedData.byteLength;

            // 更新统计信息
            if (this.config.enableStats) {
                this.updateDecompressionStats(header.algo, decompressionTime);
            }

            const result: DecompressionResult = {
                data: decompressedData as ArrayBuffer,
                compressedSize,
                decompressedSize,
                decompressionTime,
                algorithm: header.algo
            };

            this.logger.debug(
                `解压缩完成: ${compressedSize}B -> ${decompressedSize}B ` +
                `用时 ${decompressionTime.toFixed(2)}ms, 算法: ${header.algo}`
            );

            return result;

        } catch (error) {
            this.logger.error(`解压缩失败 (${header.algo}):`, error);
            throw error;
        }
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

    /**
     * 编码容器头
     * 格式: [MAGIC:4] 'MCF0' | [ver:1] | [algoLen:1] | [algoName:algoLen]
     *       [origLen:4, LE] | [flags:1] | [payload:...]
     */
    private encodeContainerHeader(header: ContainerHeader, payload: Uint8Array): Uint8Array {
        const textEncoder = new TextEncoder();
        const algoBytes = textEncoder.encode(header.algo);
        
        if (algoBytes.length > 255) {
            throw new Error(`算法名称过长: ${header.algo.length} > 255`);
        }

        // 计算头部总长度: 4(magic) + 1(version) + 1(algoLen) + algoLen + 4(originalSize) + 1(flags)
        const headerSize = 4 + 1 + 1 + algoBytes.length + 4 + 1;
        const totalSize = headerSize + payload.length;
        const result = new Uint8Array(totalSize);
        
        let offset = 0;

        // Magic number 'MCF0'
        result[offset++] = 77;  // 'M'
        result[offset++] = 67;  // 'C'
        result[offset++] = 70;  // 'F'
        result[offset++] = 48;  // '0'

        // Version
        result[offset++] = header.version;

        // Algorithm length and name
        result[offset++] = algoBytes.length;
        result.set(algoBytes, offset);
        offset += algoBytes.length;

        // Original size (Little Endian)
        const originalSizeBytes = new ArrayBuffer(4);
        const originalSizeView = new DataView(originalSizeBytes);
        originalSizeView.setUint32(0, header.originalSize, true); // Little Endian
        result.set(new Uint8Array(originalSizeBytes), offset);
        offset += 4;

        // Flags
        result[offset++] = header.flags;

        // Payload
        result.set(payload, offset);

        return result;
    }

    /**
     * 解码容器头
     */
    private decodeContainerHeader(data: Uint8Array): ParsedHeader {
        if (data.length < 11) { // 最小头部大小
            throw new Error('数据太小，无法包含有效的容器头');
        }

        let offset = 0;

        // 验证 Magic number
        const magic = String.fromCharCode(data[offset], data[offset + 1], data[offset + 2], data[offset + 3]);
        if (magic !== 'MCF0') {
            throw new Error(`无效的魔数: ${magic}，期望: MCF0`);
        }
        offset += 4;

        // 版本
        const version = data[offset++];
        if (version !== 1) {
            throw new Error(`不支持的版本: ${version}，期望: 1`);
        }

        // 算法名长度和名称
        const algoLen = data[offset++];
        if (offset + algoLen > data.length) {
            throw new Error('算法名称长度超出数据边界');
        }

        const textDecoder = new TextDecoder();
        const algoBytes = data.slice(offset, offset + algoLen);
        const algo = textDecoder.decode(algoBytes);
        offset += algoLen;

        // 原始大小 (Little Endian)
        if (offset + 4 > data.length) {
            throw new Error('原始大小字段超出数据边界');
        }
        const originalSizeBytes = data.slice(offset, offset + 4);
        const originalSizeView = new DataView(originalSizeBytes.buffer, originalSizeBytes.byteOffset, 4);
        const originalSize = originalSizeView.getUint32(0, true); // Little Endian
        offset += 4;

        // 标志位
        if (offset >= data.length) {
            throw new Error('标志位字段超出数据边界');
        }
        const flags = data[offset++];

        // 载荷数据
        const payload = data.slice(offset);

        const header: ContainerHeader = {
            magic: 'MCF0',
            version: version as 1,
            algo,
            originalSize,
            flags
        };

        return {
            header,
            headerSize: offset,
            payload
        };
    }

    /**
     * 检测是否为新的容器格式
     */
    private isContainerFormat(data: Uint8Array): boolean {
        return data.length >= 4 && 
               data[0] === 77 && // 'M'
               data[1] === 67 && // 'C'
               data[2] === 70 && // 'F'
               data[3] === 48;   // '0'
    }
}

/**
 * 全局压缩器实例
 */
export const globalCompressor = new MessageCompressor();