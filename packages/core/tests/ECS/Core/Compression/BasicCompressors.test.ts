import { NoCompressor, RLECompressor } from '../../../../src/ECS/Core/Compression/BasicCompressors';

describe('基础压缩器测试', () => {
    describe('NoCompressor', () => {
        const compressor = new NoCompressor();
        
        test('应该直接返回原始数据', () => {
            const testData = new Uint8Array([1, 2, 3, 4, 5]);
            
            const result = compressor.compress(testData);
            
            expect(result.data).toEqual(testData);
            expect(result.stats.compressionRatio).toBe(1.0);
            expect(result.stats.originalSize).toBe(5);
            expect(result.stats.compressedSize).toBe(5);
        });
        
        test('解压应该返回相同数据', () => {
            const testData = new Uint8Array([1, 2, 3, 4, 5]);
            
            const decompressed = compressor.decompress(testData);
            
            expect(decompressed.data).toEqual(testData);
            expect(decompressed.stats.decompressionTime).toBeGreaterThanOrEqual(0);
        });
        
    });
    
    describe('RLECompressor', () => {
        const compressor = new RLECompressor();
        
        test('应该压缩重复数据', () => {
            // 创建大量重复数据
            const testData = new Uint8Array(100);
            testData.fill(42); // 全部填充42
            
            const result = compressor.compress(testData);
            
            expect(result.data.length).toBeLessThan(testData.length);
            expect(result.stats.compressionRatio).toBeLessThan(1.0);
        });
        
        test('应该正确处理无重复数据', () => {
            const testData = new Uint8Array([1, 2, 3, 4, 5]);
            
            const result = compressor.compress(testData);
            
            // 无重复数据压缩效果不佳
            expect(result.stats.compressionRatio).toBeGreaterThanOrEqual(1.0);
        });
        
        test('应该正确解压数据', () => {
            const originalData = new Uint8Array(50);
            originalData.fill(123);
            
            const compressed = compressor.compress(originalData);
            const decompressed = compressor.decompress(compressed.data);
            
            expect(decompressed.data).toEqual(originalData);
        });
        
        test('应该处理混合数据', () => {
            const testData = new Uint8Array([
                1, 1, 1, 1, 1, // 5个1
                2, 3, 4, // 单独的数字
                5, 5, 5, 5, 5, 5, 5 // 7个5
            ]);
            
            const compressed = compressor.compress(testData);
            const decompressed = compressor.decompress(compressed.data);
            
            expect(decompressed.data).toEqual(testData);
            expect(compressed.stats.compressionRatio).toBeLessThan(1.0);
        });
        
        test('应该正确处理0xFF转义', () => {
            const testData = new Uint8Array([0xFF, 0xFF, 0xFF, 1, 2, 3]);
            
            const compressed = compressor.compress(testData);
            const decompressed = compressor.decompress(compressed.data);
            
            expect(decompressed.data).toEqual(testData);
        });
        
        test('应该支持流式压缩', () => {
            expect(compressor.supportsStreaming).toBe(true);
            
            const state = compressor.createCompressionStream();
            expect(state).toBeDefined();
            expect(state.finished).toBe(false);
            
            const chunk1 = new Uint8Array([1, 1, 1]);
            const chunk2 = new Uint8Array([1, 2, 2]);
            
            const result1 = compressor.compressChunk(state, chunk1);
            const result2 = compressor.compressChunk(state, chunk2, true);
            const final = compressor.finishCompression(state);
            
            expect(result1.length + result2.length + final.length).toBeGreaterThan(0);
            expect(state.finished).toBe(true);
        });
        
    });
    
    describe('压缩器属性验证', () => {
        test('NoCompressor属性', () => {
            const compressor = new NoCompressor();
            
            expect(compressor.name).toBe('none');
            expect(compressor.supportedLevels).toEqual([0, 0]);
            expect(compressor.supportsDictionary).toBe(false);
            expect(compressor.supportsStreaming).toBe(false);
        });
        
        test('RLECompressor属性', () => {
            const compressor = new RLECompressor();
            
            expect(compressor.name).toBe('rle');
            expect(compressor.supportedLevels).toEqual([1, 1]);
            expect(compressor.supportsDictionary).toBe(false);
            expect(compressor.supportsStreaming).toBe(true);
        });
        
    });
    
    describe('错误处理', () => {
        test('RLE解压应该处理损坏数据', () => {
            const compressor = new RLECompressor();
            const corruptedData = new Uint8Array([0xFF, 1]); // 不完整的RLE数据
            
            // 通用RLE工具会优雅处理损坏数据而不是抛出异常
            expect(() => {
                compressor.decompress(corruptedData);
            }).not.toThrow();
            
            const result = compressor.decompress(corruptedData);
            expect(result.data.length).toBeGreaterThanOrEqual(0);
        });
        
        test('应该处理空数据', () => {
            const compressor = new RLECompressor();
            const emptyData = new Uint8Array(0);
            
            const compressed = compressor.compress(emptyData);
            const decompressed = compressor.decompress(compressed.data);
            
            expect(decompressed.data.length).toBe(0);
        });
    });
});