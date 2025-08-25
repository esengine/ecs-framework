/**
 * 压缩和加密系统导出
 */

// 类型定义
export * from './CompressionTypes';

// 注册表
export { CompressionRegistry } from './CompressionRegistry';

// 基础压缩器
export { 
    NoCompressor, 
    RLECompressor 
} from './BasicCompressors';

// ECS专用压缩器
export { ECSCompressor } from './ECSCompressor';

// 流式压缩器
export { StreamingCompressor } from './StreamingCompressor';

// 差分压缩器
export { EcsDifferentialCompressor } from './DifferentialCompressor';

// 加密器
export { 
    NoEncryptor, 
    XorEncryptor, 
    ChaCha20Encryptor, 
    AesGcmEncryptor,
    CompositeEncryptor 
} from './Encryptors';

// 注册所有内置压缩器和加密器
import { CompressionRegistry } from './CompressionRegistry';
import { NoCompressor, RLECompressor } from './BasicCompressors';
import { ECSCompressor } from './ECSCompressor';
import { StreamingCompressor } from './StreamingCompressor';
import { EcsDifferentialCompressor } from './DifferentialCompressor';
import { NoEncryptor, XorEncryptor, ChaCha20Encryptor, AesGcmEncryptor } from './Encryptors';

/**
 * 初始化压缩和加密系统
 * 注册所有内置的压缩器和加密器
 */
export function initializeCompressionSystem(): void {
    // 注册压缩器
    CompressionRegistry.registerCompressor(new NoCompressor());
    CompressionRegistry.registerCompressor(new RLECompressor());
    CompressionRegistry.registerCompressor(new ECSCompressor());
    CompressionRegistry.registerCompressor(new StreamingCompressor());
    
    // 注册差分压缩器
    CompressionRegistry.registerDifferentialCompressor(new EcsDifferentialCompressor());
    
    // 注册加密器
    CompressionRegistry.registerEncryptor(new NoEncryptor());
    CompressionRegistry.registerEncryptor(new XorEncryptor());
    CompressionRegistry.registerEncryptor(new ChaCha20Encryptor());
    CompressionRegistry.registerEncryptor(new AesGcmEncryptor());
    
    // 设置默认压缩器
    CompressionRegistry.setDefaultCompressor('ecs-lz');
    CompressionRegistry.setDefaultEncryptor('chacha20');
}

/**
 * 获取推荐的压缩器配置
 */
export function getRecommendedCompressionConfig(
    dataSize: number,
    priority: 'speed' | 'ratio' | 'balanced' = 'balanced'
): {
    compressor: string;
    level: number;
    encryptor: string;
} {
    let compressor: string;
    let level: number;
    
    if (dataSize < 1024) {
        // 小数据
        compressor = priority === 'ratio' ? 'rle' : 'none';
        level = 1;
    } else if (dataSize < 64 * 1024) {
        // 中等数据
        compressor = 'ecs-lz';
        level = priority === 'speed' ? 3 : priority === 'ratio' ? 7 : 5;
    } else {
        // 大数据
        compressor = 'streaming';
        level = priority === 'speed' ? 2 : priority === 'ratio' ? 8 : 6;
    }
    
    return {
        compressor,
        level,
        encryptor: 'chacha20'
    };
}