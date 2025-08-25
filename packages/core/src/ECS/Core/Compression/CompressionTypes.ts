/**
 * 压缩系统类型定义
 */

/**
 * 压缩统计信息
 */
export interface CompressionStats {
    /** 原始大小（字节） */
    originalSize: number;
    /** 压缩后大小（字节） */
    compressedSize: number;
    /** 压缩比（0-1） */
    compressionRatio: number;
    /** 压缩时间（毫秒） */
    compressionTime: number;
    /** 解压时间（毫秒） */
    decompressionTime?: number;
}

/**
 * 压缩选项
 */
export interface CompressionOptions {
    /** 压缩级别 (0-9, 0=无压缩, 9=最大压缩) */
    level?: number;
    /** 是否启用字典压缩 */
    useDictionary?: boolean;
    /** 自定义字典数据 */
    dictionary?: Uint8Array;
    /** 块大小（用于分块压缩） */
    blockSize?: number;
    /** 是否验证解压数据完整性 */
    verifyIntegrity?: boolean;
}

/**
 * 流式压缩状态
 */
export interface StreamCompressionState {
    /** 压缩器内部状态 */
    internalState: any;
    /** 已处理字节数 */
    processedBytes: number;
    /** 输出缓冲区 */
    outputBuffer: Uint8Array;
    /** 是否完成 */
    finished: boolean;
}

/**
 * 压缩器接口
 */
export interface Compressor {
    /** 压缩器名称 */
    readonly name: string;
    
    /** 支持的压缩级别范围 */
    readonly supportedLevels: readonly [number, number];
    
    /** 是否支持字典压缩 */
    readonly supportsDictionary: boolean;
    
    /** 是否支持流式压缩 */
    readonly supportsStreaming: boolean;
    
    /**
     * 压缩数据
     */
    compress(data: Uint8Array, options?: CompressionOptions): {
        data: Uint8Array;
        stats: CompressionStats;
    };
    
    /**
     * 解压数据
     */
    decompress(data: Uint8Array, options?: CompressionOptions): {
        data: Uint8Array;
        stats: CompressionStats;
    };
    
    /**
     * 创建流式压缩状态
     */
    createCompressionStream?(options?: CompressionOptions): StreamCompressionState;
    
    /**
     * 流式压缩数据块
     */
    compressChunk?(
        state: StreamCompressionState, 
        chunk: Uint8Array, 
        isLast?: boolean
    ): Uint8Array;
    
    /**
     * 完成流式压缩
     */
    finishCompression?(state: StreamCompressionState): Uint8Array;
    
    /**
     * 创建流式解压状态
     */
    createDecompressionStream?(options?: CompressionOptions): StreamCompressionState;
    
    /**
     * 流式解压数据块
     */
    decompressChunk?(
        state: StreamCompressionState, 
        chunk: Uint8Array, 
        isLast?: boolean
    ): Uint8Array;
    
    /**
     * 完成流式解压
     */
    finishDecompression?(state: StreamCompressionState): Uint8Array;
    
    
}

/**
 * 差分压缩器接口
 */
export interface DifferentialCompressor extends Compressor {
    /**
     * 创建差分数据
     */
    createDiff(
        baseData: Uint8Array, 
        newData: Uint8Array, 
        options?: CompressionOptions
    ): {
        diff: Uint8Array;
        stats: CompressionStats;
    };
    
    /**
     * 应用差分数据
     */
    applyDiff(
        baseData: Uint8Array, 
        diff: Uint8Array, 
        options?: CompressionOptions
    ): {
        data: Uint8Array;
        stats: CompressionStats;
    };
}

/**
 * 加密器接口
 */
export interface Encryptor {
    /** 加密器名称 */
    readonly name: string;
    
    /** 密钥长度（字节） */
    readonly keyLength: number;
    
    /** 初始化向量长度（字节） */
    readonly ivLength: number;
    
    /**
     * 加密数据
     */
    encrypt(data: Uint8Array, key: Uint8Array, iv?: Uint8Array): {
        encrypted: Uint8Array;
        iv: Uint8Array;
        tag?: Uint8Array; // 用于认证加密
    };
    
    /**
     * 解密数据
     */
    decrypt(
        encryptedData: Uint8Array, 
        key: Uint8Array, 
        iv: Uint8Array, 
        tag?: Uint8Array
    ): Uint8Array;
    
    /**
     * 生成随机密钥
     */
    generateKey(): Uint8Array;
    
    /**
     * 生成随机初始化向量
     */
    generateIV(): Uint8Array;
    
    /**
     * 从密码派生密钥
     */
    deriveKey?(password: string, salt: Uint8Array, iterations: number): Uint8Array;
}

/**
 * 压缩元数据
 */
export interface CompressionMetadata {
    /** 压缩器名称 */
    compressor: string;
    /** 压缩选项 */
    options: CompressionOptions;
    /** 原始大小 */
    originalSize: number;
    /** 压缩时间戳 */
    timestamp: number;
    /** 校验和 */
    checksum?: number;
    /** 是否加密 */
    encrypted?: boolean;
    /** 加密器名称 */
    encryptor?: string;
}