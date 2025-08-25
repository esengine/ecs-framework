import { Compressor, DifferentialCompressor, Encryptor } from './CompressionTypes';
import { createLogger } from '../../../Utils/Logger';

/**
 * 压缩器和加密器注册表
 * 
 * 提供插件化的压缩和加密算法管理
 */
export class CompressionRegistry {
    private static compressors = new Map<string, Compressor>();
    private static differentialCompressors = new Map<string, DifferentialCompressor>();
    private static encryptors = new Map<string, Encryptor>();
    private static readonly logger = createLogger('CompressionRegistry');
    
    /** 默认压缩器 */
    private static defaultCompressor = 'none';
    
    /** 默认加密器 */
    private static defaultEncryptor = 'aes-gcm';
    
    /**
     * 注册压缩器
     */
    static registerCompressor(compressor: Compressor): void {
        if (this.compressors.has(compressor.name)) {
            this.logger.warn(`压缩器 "${compressor.name}" 已存在，将被覆盖`);
        }
        
        this.compressors.set(compressor.name, compressor);
        this.logger.debug(`注册压缩器: ${compressor.name}`);
    }
    
    /**
     * 注册差分压缩器
     */
    static registerDifferentialCompressor(compressor: DifferentialCompressor): void {
        if (this.differentialCompressors.has(compressor.name)) {
            this.logger.warn(`差分压缩器 "${compressor.name}" 已存在，将被覆盖`);
        }
        
        this.differentialCompressors.set(compressor.name, compressor);
        this.logger.debug(`注册差分压缩器: ${compressor.name}`);
        
        // 同时注册为普通压缩器
        this.registerCompressor(compressor);
    }
    
    /**
     * 注册加密器
     */
    static registerEncryptor(encryptor: Encryptor): void {
        if (this.encryptors.has(encryptor.name)) {
            this.logger.warn(`加密器 "${encryptor.name}" 已存在，将被覆盖`);
        }
        
        this.encryptors.set(encryptor.name, encryptor);
        this.logger.debug(`注册加密器: ${encryptor.name}`);
    }
    
    /**
     * 获取压缩器
     */
    static getCompressor(name?: string): Compressor | null {
        const compressorName = name || this.defaultCompressor;
        const compressor = this.compressors.get(compressorName);
        
        if (!compressor && name) {
            this.logger.error(`未找到压缩器: ${name}`);
        }
        
        return compressor || null;
    }
    
    /**
     * 获取差分压缩器
     */
    static getDifferentialCompressor(name: string): DifferentialCompressor | null {
        const compressor = this.differentialCompressors.get(name);
        
        if (!compressor) {
            this.logger.error(`未找到差分压缩器: ${name}`);
        }
        
        return compressor || null;
    }
    
    /**
     * 获取加密器
     */
    static getEncryptor(name?: string): Encryptor | null {
        const encryptorName = name || this.defaultEncryptor;
        const encryptor = this.encryptors.get(encryptorName);
        
        if (!encryptor && name) {
            this.logger.error(`未找到加密器: ${name}`);
        }
        
        return encryptor || null;
    }
    
    /**
     * 设置默认压缩器
     */
    static setDefaultCompressor(name: string): void {
        if (!this.compressors.has(name)) {
            throw new Error(`压缩器不存在: ${name}`);
        }
        
        this.defaultCompressor = name;
        this.logger.info(`设置默认压缩器: ${name}`);
    }
    
    /**
     * 设置默认加密器
     */
    static setDefaultEncryptor(name: string): void {
        if (!this.encryptors.has(name)) {
            throw new Error(`加密器不存在: ${name}`);
        }
        
        this.defaultEncryptor = name;
        this.logger.info(`设置默认加密器: ${name}`);
    }
    
    /**
     * 获取所有已注册的压缩器名称
     */
    static getCompressorNames(): string[] {
        return Array.from(this.compressors.keys());
    }
    
    /**
     * 获取所有已注册的差分压缩器名称
     */
    static getDifferentialCompressorNames(): string[] {
        return Array.from(this.differentialCompressors.keys());
    }
    
    /**
     * 获取所有已注册的加密器名称
     */
    static getEncryptorNames(): string[] {
        return Array.from(this.encryptors.keys());
    }
    
    /**
     * 检查压缩器是否存在
     */
    static hasCompressor(name: string): boolean {
        return this.compressors.has(name);
    }
    
    /**
     * 检查差分压缩器是否存在
     */
    static hasDifferentialCompressor(name: string): boolean {
        return this.differentialCompressors.has(name);
    }
    
    /**
     * 检查加密器是否存在
     */
    static hasEncryptor(name: string): boolean {
        return this.encryptors.has(name);
    }
    
    /**
     * 移除压缩器
     */
    static unregisterCompressor(name: string): boolean {
        if (name === this.defaultCompressor) {
            this.logger.warn(`不能移除默认压缩器: ${name}`);
            return false;
        }
        
        const removed = this.compressors.delete(name);
        if (removed) {
            this.logger.debug(`移除压缩器: ${name}`);
        }
        return removed;
    }
    
    /**
     * 移除差分压缩器
     */
    static unregisterDifferentialCompressor(name: string): boolean {
        const removed = this.differentialCompressors.delete(name);
        if (removed) {
            this.logger.debug(`移除差分压缩器: ${name}`);
        }
        return removed;
    }
    
    /**
     * 移除加密器
     */
    static unregisterEncryptor(name: string): boolean {
        if (name === this.defaultEncryptor) {
            this.logger.warn(`不能移除默认加密器: ${name}`);
            return false;
        }
        
        const removed = this.encryptors.delete(name);
        if (removed) {
            this.logger.debug(`移除加密器: ${name}`);
        }
        return removed;
    }
    
    /**
     * 获取压缩器信息
     */
    static getCompressorInfo(name: string): {
        name: string;
        supportedLevels: readonly [number, number];
        supportsDictionary: boolean;
        supportsStreaming: boolean;
    } | null {
        const compressor = this.compressors.get(name);
        if (!compressor) return null;
        
        return {
            name: compressor.name,
            supportedLevels: compressor.supportedLevels,
            supportsDictionary: compressor.supportsDictionary,
            supportsStreaming: compressor.supportsStreaming
        };
    }
    
    /**
     * 获取加密器信息
     */
    static getEncryptorInfo(name: string): {
        name: string;
        keyLength: number;
        ivLength: number;
    } | null {
        const encryptor = this.encryptors.get(name);
        if (!encryptor) return null;
        
        return {
            name: encryptor.name,
            keyLength: encryptor.keyLength,
            ivLength: encryptor.ivLength
        };
    }
    
    /**
     * 选择最佳压缩器
     */
    static selectBestCompressor(
        dataSize: number, 
        priority: 'speed' | 'ratio' | 'balanced' = 'balanced'
    ): string {
        const compressors = Array.from(this.compressors.keys()).filter(name => name !== 'none');
        
        if (compressors.length === 0) {
            return 'none';
        }
        
        // 根据数据大小和优先级选择
        if (dataSize < 1024) {
            // 小数据优先选择速度
            return priority === 'ratio' ? 'ecs-lz' : 'none';
        } else if (dataSize < 64 * 1024) {
            // 中等数据平衡选择
            return 'ecs-lz';
        } else {
            // 大数据根据优先级选择
            switch (priority) {
                case 'speed':
                    return 'ecs-fast';
                case 'ratio':
                    return 'ecs-lz';
                default:
                    return 'ecs-lz';
            }
        }
    }
    
    /**
     * 清空所有注册
     */
    static clear(): void {
        this.compressors.clear();
        this.differentialCompressors.clear();
        this.encryptors.clear();
        this.defaultCompressor = 'none';
        this.defaultEncryptor = 'aes-gcm';
        this.logger.info('清空所有压缩器和加密器注册');
    }
    
    /**
     * 获取注册统计
     */
    static getStats(): {
        compressors: number;
        differentialCompressors: number;
        encryptors: number;
        defaultCompressor: string;
        defaultEncryptor: string;
    } {
        return {
            compressors: this.compressors.size,
            differentialCompressors: this.differentialCompressors.size,
            encryptors: this.encryptors.size,
            defaultCompressor: this.defaultCompressor,
            defaultEncryptor: this.defaultEncryptor
        };
    }
}