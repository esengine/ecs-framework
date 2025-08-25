import { CompressionRegistry, initializeCompressionSystem, getRecommendedCompressionConfig } from '../../../../src/ECS/Core/Compression';
import { NoCompressor, RLECompressor } from '../../../../src/ECS/Core/Compression/BasicCompressors';
import { ECSCompressor } from '../../../../src/ECS/Core/Compression/ECSCompressor';
import { NoEncryptor, XorEncryptor } from '../../../../src/ECS/Core/Compression/Encryptors';
import { EcsDifferentialCompressor } from '../../../../src/ECS/Core/Compression/DifferentialCompressor';

describe('压缩注册表测试', () => {
    beforeEach(() => {
        // 清空注册表
        CompressionRegistry.clear();
    });
    
    afterEach(() => {
        // 重新初始化以确保其他测试正常运行
        initializeCompressionSystem();
    });
    
    describe('压缩器注册', () => {
        test('应该注册和获取压缩器', () => {
            const compressor = new NoCompressor();
            
            CompressionRegistry.registerCompressor(compressor);
            
            expect(CompressionRegistry.hasCompressor('none')).toBe(true);
            expect(CompressionRegistry.getCompressor('none')).toBe(compressor);
        });
        
        test('应该覆盖已存在的压缩器', () => {
            const compressor1 = new NoCompressor();
            const compressor2 = new RLECompressor();
            
            CompressionRegistry.registerCompressor(compressor1);
            CompressionRegistry.registerCompressor(compressor2);
            
            expect(CompressionRegistry.getCompressor('rle')).toBe(compressor2);
        });
        
        test('应该返回所有压缩器名称', () => {
            CompressionRegistry.registerCompressor(new NoCompressor());
            CompressionRegistry.registerCompressor(new RLECompressor());
            
            const names = CompressionRegistry.getCompressorNames();
            
            expect(names).toContain('none');
            expect(names).toContain('rle');
            expect(names.length).toBe(2);
        });
        
        test('应该移除压缩器', () => {
            const compressor = new RLECompressor();
            CompressionRegistry.registerCompressor(compressor);
            
            expect(CompressionRegistry.hasCompressor('rle')).toBe(true);
            
            const removed = CompressionRegistry.unregisterCompressor('rle');
            
            expect(removed).toBe(true);
            expect(CompressionRegistry.hasCompressor('rle')).toBe(false);
        });
        
        test('应该保护默认压缩器不被移除', () => {
            CompressionRegistry.registerCompressor(new NoCompressor());
            CompressionRegistry.setDefaultCompressor('none');
            
            const removed = CompressionRegistry.unregisterCompressor('none');
            
            expect(removed).toBe(false);
            expect(CompressionRegistry.hasCompressor('none')).toBe(true);
        });
    });
    
    describe('差分压缩器注册', () => {
        test('应该注册差分压缩器', () => {
            const diffCompressor = new EcsDifferentialCompressor();
            
            CompressionRegistry.registerDifferentialCompressor(diffCompressor);
            
            expect(CompressionRegistry.hasDifferentialCompressor('ecs-diff')).toBe(true);
            expect(CompressionRegistry.getDifferentialCompressor('ecs-diff')).toBe(diffCompressor);
            
            // 差分压缩器也应该作为普通压缩器注册
            expect(CompressionRegistry.hasCompressor('ecs-diff')).toBe(true);
        });
        
        test('应该获取差分压缩器名称', () => {
            CompressionRegistry.registerDifferentialCompressor(new EcsDifferentialCompressor());
            
            const names = CompressionRegistry.getDifferentialCompressorNames();
            
            expect(names).toContain('ecs-diff');
        });
        
        test('应该移除差分压缩器', () => {
            CompressionRegistry.registerDifferentialCompressor(new EcsDifferentialCompressor());
            
            expect(CompressionRegistry.hasDifferentialCompressor('ecs-diff')).toBe(true);
            
            const removed = CompressionRegistry.unregisterDifferentialCompressor('ecs-diff');
            
            expect(removed).toBe(true);
            expect(CompressionRegistry.hasDifferentialCompressor('ecs-diff')).toBe(false);
        });
    });
    
    describe('加密器注册', () => {
        test('应该注册和获取加密器', () => {
            const encryptor = new NoEncryptor();
            
            CompressionRegistry.registerEncryptor(encryptor);
            
            expect(CompressionRegistry.hasEncryptor('none')).toBe(true);
            expect(CompressionRegistry.getEncryptor('none')).toBe(encryptor);
        });
        
        test('应该获取加密器名称', () => {
            CompressionRegistry.registerEncryptor(new NoEncryptor());
            CompressionRegistry.registerEncryptor(new XorEncryptor());
            
            const names = CompressionRegistry.getEncryptorNames();
            
            expect(names).toContain('none');
            expect(names).toContain('xor');
        });
        
        test('应该移除加密器', () => {
            CompressionRegistry.registerEncryptor(new XorEncryptor());
            
            expect(CompressionRegistry.hasEncryptor('xor')).toBe(true);
            
            const removed = CompressionRegistry.unregisterEncryptor('xor');
            
            expect(removed).toBe(true);
            expect(CompressionRegistry.hasEncryptor('xor')).toBe(false);
        });
        
        test('应该保护默认加密器不被移除', () => {
            CompressionRegistry.registerEncryptor(new NoEncryptor());
            CompressionRegistry.setDefaultEncryptor('none');
            
            const removed = CompressionRegistry.unregisterEncryptor('none');
            
            expect(removed).toBe(false);
            expect(CompressionRegistry.hasEncryptor('none')).toBe(true);
        });
    });
    
    describe('默认设置', () => {
        test('应该设置和获取默认压缩器', () => {
            CompressionRegistry.registerCompressor(new RLECompressor());
            
            CompressionRegistry.setDefaultCompressor('rle');
            
            const defaultCompressor = CompressionRegistry.getCompressor();
            expect(defaultCompressor?.name).toBe('rle');
        });
        
        test('应该设置和获取默认加密器', () => {
            CompressionRegistry.registerEncryptor(new XorEncryptor());
            
            CompressionRegistry.setDefaultEncryptor('xor');
            
            const defaultEncryptor = CompressionRegistry.getEncryptor();
            expect(defaultEncryptor?.name).toBe('xor');
        });
        
        test('设置不存在的默认压缩器应该抛出异常', () => {
            expect(() => {
                CompressionRegistry.setDefaultCompressor('nonexistent');
            }).toThrow('压缩器不存在: nonexistent');
        });
        
        test('设置不存在的默认加密器应该抛出异常', () => {
            expect(() => {
                CompressionRegistry.setDefaultEncryptor('nonexistent');
            }).toThrow('加密器不存在: nonexistent');
        });
    });
    
    describe('信息获取', () => {
        test('应该获取压缩器信息', () => {
            const compressor = new ECSCompressor();
            CompressionRegistry.registerCompressor(compressor);
            
            const info = CompressionRegistry.getCompressorInfo('ecs-lz');
            
            expect(info).toBeDefined();
            expect(info?.name).toBe('ecs-lz');
            expect(info?.supportedLevels).toEqual([1, 9]);
            expect(info?.supportsDictionary).toBe(true);
            expect(info?.supportsStreaming).toBe(true);
        });
        
        test('应该获取加密器信息', () => {
            const encryptor = new XorEncryptor();
            CompressionRegistry.registerEncryptor(encryptor);
            
            const info = CompressionRegistry.getEncryptorInfo('xor');
            
            expect(info).toBeDefined();
            expect(info?.name).toBe('xor');
            expect(info?.keyLength).toBe(32);
            expect(info?.ivLength).toBe(0);
        });
        
        test('获取不存在的压缩器信息应该返回null', () => {
            const info = CompressionRegistry.getCompressorInfo('nonexistent');
            
            expect(info).toBeNull();
        });
        
        test('获取不存在的加密器信息应该返回null', () => {
            const info = CompressionRegistry.getEncryptorInfo('nonexistent');
            
            expect(info).toBeNull();
        });
    });
    
    describe('智能选择', () => {
        beforeEach(() => {
            // 注册一些压缩器用于测试
            CompressionRegistry.registerCompressor(new NoCompressor());
            CompressionRegistry.registerCompressor(new RLECompressor());
            CompressionRegistry.registerCompressor(new ECSCompressor());
        });
        
        test('应该为小数据选择合适的压缩器', () => {
            const selected = CompressionRegistry.selectBestCompressor(500, 'speed');
            
            // 小数据通常选择无压缩
            expect(selected).toBe('none');
        });
        
        test('应该为中等数据选择合适的压缩器', () => {
            const selected = CompressionRegistry.selectBestCompressor(10 * 1024, 'balanced');
            
            // 中等数据通常选择ECS压缩
            expect(selected).toBe('ecs-lz');
        });
        
        test('应该为大数据选择合适的压缩器', () => {
            const selected = CompressionRegistry.selectBestCompressor(100 * 1024, 'ratio');
            
            // 大数据注重压缩比
            expect(selected).toBe('ecs-lz');
        });
        
        test('没有压缩器时应该返回none', () => {
            CompressionRegistry.clear();
            CompressionRegistry.registerCompressor(new NoCompressor());
            
            const selected = CompressionRegistry.selectBestCompressor(1000, 'balanced');
            
            expect(selected).toBe('none');
        });
    });
    
    describe('统计信息', () => {
        test('应该提供注册统计', () => {
            CompressionRegistry.registerCompressor(new NoCompressor());
            CompressionRegistry.registerCompressor(new RLECompressor());
            CompressionRegistry.registerDifferentialCompressor(new EcsDifferentialCompressor());
            CompressionRegistry.registerEncryptor(new NoEncryptor());
            CompressionRegistry.registerEncryptor(new XorEncryptor());
            
            const stats = CompressionRegistry.getStats();
            
            expect(stats.compressors).toBe(3); // none, rle, ecs-diff
            expect(stats.differentialCompressors).toBe(1); // ecs-diff
            expect(stats.encryptors).toBe(2); // none, xor
            expect(stats.defaultCompressor).toBeDefined();
            expect(stats.defaultEncryptor).toBeDefined();
        });
    });
    
    describe('清空功能', () => {
        test('应该清空所有注册', () => {
            CompressionRegistry.registerCompressor(new NoCompressor());
            CompressionRegistry.registerEncryptor(new NoEncryptor());
            
            expect(CompressionRegistry.getStats().compressors).toBeGreaterThan(0);
            expect(CompressionRegistry.getStats().encryptors).toBeGreaterThan(0);
            
            CompressionRegistry.clear();
            
            const stats = CompressionRegistry.getStats();
            expect(stats.compressors).toBe(0);
            expect(stats.encryptors).toBe(0);
        });
    });
    
    describe('错误处理', () => {
        test('获取不存在的压缩器应该返回null并记录错误', () => {
            const compressor = CompressionRegistry.getCompressor('nonexistent');
            
            expect(compressor).toBeNull();
        });
        
        test('获取不存在的加密器应该返回null并记录错误', () => {
            const encryptor = CompressionRegistry.getEncryptor('nonexistent');
            
            expect(encryptor).toBeNull();
        });
        
        test('获取不存在的差分压缩器应该返回null', () => {
            const diffCompressor = CompressionRegistry.getDifferentialCompressor('nonexistent');
            
            expect(diffCompressor).toBeNull();
        });
    });
});

describe('推荐配置测试', () => {
    beforeEach(() => {
        initializeCompressionSystem();
    });
    
    test('应该为不同数据大小提供合适的配置', () => {
        const testCases = [
            { size: 500, priority: 'speed' as const },
            { size: 5000, priority: 'balanced' as const },
            { size: 50000, priority: 'ratio' as const }
        ];
        
        for (const { size, priority } of testCases) {
            const config = getRecommendedCompressionConfig(size, priority);
            
            expect(config.compressor).toBeDefined();
            expect(config.level).toBeGreaterThanOrEqual(1);
            expect(config.level).toBeLessThanOrEqual(9);
            expect(config.encryptor).toBeDefined();
        }
    });
    
    test('应该为不同优先级提供不同配置', () => {
        const size = 10000;
        
        const speedConfig = getRecommendedCompressionConfig(size, 'speed');
        const balancedConfig = getRecommendedCompressionConfig(size, 'balanced');
        const ratioConfig = getRecommendedCompressionConfig(size, 'ratio');
        
        // 速度优先通常使用较低的压缩级别
        expect(speedConfig.level).toBeLessThanOrEqual(balancedConfig.level);
        
        // 压缩比优先通常使用较高的压缩级别
        expect(ratioConfig.level).toBeGreaterThanOrEqual(balancedConfig.level);
    });
});

describe('系统初始化测试', () => {
    test('应该正确初始化所有组件', () => {
        CompressionRegistry.clear();
        
        initializeCompressionSystem();
        
        const stats = CompressionRegistry.getStats();
        
        // 应该注册了基本的压缩器和加密器
        expect(stats.compressors).toBeGreaterThan(0);
        expect(stats.encryptors).toBeGreaterThan(0);
        expect(stats.differentialCompressors).toBeGreaterThan(0);
        
        // 应该设置了默认值
        expect(stats.defaultCompressor).toBeDefined();
        expect(stats.defaultEncryptor).toBeDefined();
        
        // 验证具体的压缩器和加密器
        expect(CompressionRegistry.hasCompressor('none')).toBe(true);
        expect(CompressionRegistry.hasCompressor('ecs-lz')).toBe(true);
        expect(CompressionRegistry.hasEncryptor('chacha20')).toBe(true);
        expect(CompressionRegistry.hasDifferentialCompressor('ecs-diff')).toBe(true);
    });
});