import { StreamingCompressor } from '../../../../src/ECS/Core/Compression/StreamingCompressor';

describe('流式压缩器测试', () => {
    const compressor = new StreamingCompressor();
    
    describe('基本压缩功能', () => {
        test('应该压缩小数据', () => {
            const testData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
            
            const result = compressor.compress(testData, { level: 6 });
            
            expect(result.data.length).toBeGreaterThan(0);
            expect(result.stats.originalSize).toBe(10);
            expect(result.stats.compressedSize).toBe(result.data.length);
            expect(result.stats.compressionTime).toBeGreaterThan(0);
        });
        
        test('应该压缩大数据并使用流式处理', () => {
            // 创建大于默认块大小的测试数据 (65KB)
            const largeData = new Uint8Array(65 * 1024);
            for (let i = 0; i < largeData.length; i++) {
                largeData[i] = i % 256;
            }
            
            const result = compressor.compress(largeData, { level: 5 });
            
            expect(result.data.length).toBeGreaterThan(0);
            expect(result.stats.originalSize).toBe(largeData.length);
            expect(result.stats.compressedSize).toBe(result.data.length);
            expect(result.stats.compressionTime).toBeGreaterThan(0);
        });
        
        test('应该正确解压小数据', () => {
            const originalData = new Uint8Array([1, 1, 1, 2, 2, 3, 3, 3, 3]);
            
            const compressed = compressor.compress(originalData);
            const decompressed = compressor.decompress(compressed.data);
            
            expect(decompressed.data).toEqual(originalData);
            expect(decompressed.stats.decompressionTime).toBeGreaterThan(0);
        });
        
        test('应该正确解压大数据', () => {
            const largeData = new Uint8Array(100 * 1024);
            // 创建具有重复模式的数据
            for (let i = 0; i < largeData.length; i++) {
                largeData[i] = Math.floor(i / 1000) % 20;
            }
            
            const compressed = compressor.compress(largeData);
            const decompressed = compressor.decompress(compressed.data);
            
            expect(decompressed.data).toEqual(largeData);
        });
    });
    
    describe('流式处理功能', () => {
        test('应该支持创建压缩流', () => {
            const stream = compressor.createCompressionStream({
                level: 7,
                blockSize: 32 * 1024
            });
            
            expect(stream.internalState.level).toBe(7);
            expect(stream.internalState.chunkSize).toBe(32 * 1024);
            expect(stream.processedBytes).toBe(0);
            expect(stream.finished).toBe(false);
        });
        
        test('应该支持分块压缩', () => {
            const stream = compressor.createCompressionStream();
            const testChunk = new Uint8Array([1, 2, 3, 4, 5, 5, 5, 5]);
            
            const compressedChunk = compressor.compressChunk(stream, testChunk, false);
            
            expect(compressedChunk.length).toBeGreaterThan(0);
            expect(stream.processedBytes).toBe(testChunk.length);
        });
        
        test('应该支持最后一块的处理', () => {
            const stream = compressor.createCompressionStream();
            const testChunk = new Uint8Array([1, 2, 3, 4, 5]);
            
            const compressedChunk = compressor.compressChunk(stream, testChunk, true);
            
            expect(compressedChunk.length).toBeGreaterThan(0);
            expect(stream.finished).toBe(true);
        });
        
        test('应该支持创建解压流', () => {
            const stream = compressor.createDecompressionStream({
                dictionary: new Uint8Array([1, 2, 3])
            });
            
            expect(stream.internalState.dictionary).toBeDefined();
            expect(stream.processedBytes).toBe(0);
            expect(stream.finished).toBe(false);
        });
        
        test('应该支持完成压缩', () => {
            const stream = compressor.createCompressionStream();
            const result = compressor.finishCompression(stream);
            
            expect(result).toBeInstanceOf(Uint8Array);
        });
        
        test('应该支持完成解压', () => {
            const stream = compressor.createDecompressionStream();
            const result = compressor.finishDecompression(stream);
            
            expect(result).toBeInstanceOf(Uint8Array);
        });
    });
    
    describe('压缩选项', () => {
        test('应该支持不同的压缩级别', () => {
            const testData = new Uint8Array([1, 2, 2, 3, 3, 3, 4, 4, 4, 4]);
            
            const result1 = compressor.compress(testData, { level: 1 });
            const result5 = compressor.compress(testData, { level: 5 });
            const result9 = compressor.compress(testData, { level: 9 });
            
            expect(result1.data.length).toBeGreaterThan(0);
            expect(result5.data.length).toBeGreaterThan(0);
            expect(result9.data.length).toBeGreaterThan(0);
        });
        
        test('应该支持自定义块大小', () => {
            const largeData = new Uint8Array(128 * 1024);
            largeData.fill(42);
            
            const result = compressor.compress(largeData, {
                blockSize: 16 * 1024
            });
            
            expect(result.data.length).toBeGreaterThan(0);
            expect(result.stats.originalSize).toBe(largeData.length);
        });
        
        test('应该限制最大块大小', () => {
            const stream = compressor.createCompressionStream({
                blockSize: 2 * 1024 * 1024 // 2MB，超过最大限制
            });
            
            // 应该被限制为1MB
            expect(stream.internalState.chunkSize).toBe(1024 * 1024);
        });
        
        test('应该支持字典压缩', () => {
            const dictionary = new Uint8Array([1, 2, 3, 4, 5]);
            const testData = new Uint8Array([1, 2, 3, 1, 2, 3, 4, 5, 4, 5]);
            
            const result = compressor.compress(testData, {
                dictionary,
                level: 8
            });
            
            expect(result.data.length).toBeGreaterThan(0);
        });
    });
    
    describe('边界条件', () => {
        test('应该处理空数据', () => {
            const emptyData = new Uint8Array(0);
            
            const compressed = compressor.compress(emptyData);
            const decompressed = compressor.decompress(compressed.data);
            
            expect(decompressed.data.length).toBe(0);
        });
        
        test('应该处理单字节数据', () => {
            const singleByte = new Uint8Array([42]);
            
            const compressed = compressor.compress(singleByte);
            const decompressed = compressor.decompress(compressed.data);
            
            expect(decompressed.data).toEqual(singleByte);
        });
        
        test('应该处理刚好一个块大小的数据', () => {
            const blockData = new Uint8Array(64 * 1024); // 默认块大小
            for (let i = 0; i < blockData.length; i++) {
                blockData[i] = i % 100;
            }
            
            const compressed = compressor.compress(blockData);
            const decompressed = compressor.decompress(compressed.data);
            
            expect(decompressed.data).toEqual(blockData);
        });
        
        test('应该处理超大数据', () => {
            const hugeData = new Uint8Array(500 * 1024); // 500KB
            // 创建重复模式以获得更好的压缩效果
            for (let i = 0; i < hugeData.length; i++) {
                hugeData[i] = (i % 10 === 0) ? 255 : 0;
            }
            
            const compressed = compressor.compress(hugeData);
            const decompressed = compressor.decompress(compressed.data);
            
            expect(decompressed.data).toEqual(hugeData);
            // 由于重复模式，应该有一定的压缩效果
            expect(compressed.stats.compressionRatio).toBeLessThan(1.0);
        });
    });
    
    describe('性能和统计', () => {
        test('应该提供准确的统计信息', () => {
            const testData = new Uint8Array(1000);
            testData.fill(123);
            
            const result = compressor.compress(testData);
            
            expect(result.stats.originalSize).toBe(1000);
            expect(result.stats.compressedSize).toBe(result.data.length);
            expect(result.stats.compressionRatio).toBe(result.data.length / 1000);
            expect(result.stats.compressionTime).toBeGreaterThan(0);
        });
        
        test('应该记录解压统计信息', () => {
            const testData = new Uint8Array([1, 1, 1, 2, 2, 2]);
            
            const compressed = compressor.compress(testData);
            const decompressed = compressor.decompress(compressed.data);
            
            expect(decompressed.stats.originalSize).toBe(testData.length);
            expect(decompressed.stats.compressedSize).toBe(compressed.data.length);
            expect(decompressed.stats.decompressionTime).toBeGreaterThan(0);
        });
    });
    
    describe('压缩器属性', () => {
        test('应该有正确的基本属性', () => {
            expect(compressor.name).toBe('streaming');
            expect(compressor.supportedLevels).toEqual([1, 9]);
            expect(compressor.supportsDictionary).toBe(true);
            expect(compressor.supportsStreaming).toBe(true);
        });
    });
    
    describe('错误处理', () => {
        test('应该处理损坏的压缩数据', () => {
            const corruptedData = new Uint8Array([1, 2, 3, 255, 254, 253]);
            
            expect(() => {
                compressor.decompress(corruptedData);
            }).not.toThrow(); // 应该优雅处理而不是崩溃
        });
        
        test('应该处理无效的压缩级别', () => {
            const testData = new Uint8Array([1, 2, 3, 4, 5]);
            
            // 测试超出范围的级别
            const result1 = compressor.compress(testData, { level: 0 });
            const result2 = compressor.compress(testData, { level: 15 });
            
            expect(result1.data).toBeDefined();
            expect(result2.data).toBeDefined();
        });
        
        test('应该处理解压空数据', () => {
            const emptyCompressed = new Uint8Array(0);
            
            const result = compressor.decompress(emptyCompressed);
            
            expect(result.data.length).toBe(0);
            expect(result.stats.originalSize).toBe(0);
        });
    });
    
    describe('数据完整性', () => {
        test('应该保持数据完整性通过多次压缩解压', () => {
            const originalData = new Uint8Array(200);
            for (let i = 0; i < originalData.length; i++) {
                originalData[i] = Math.random() * 256 | 0;
            }
            
            let data: Uint8Array = originalData;
            
            // 进行多次压缩和解压
            for (let i = 0; i < 3; i++) {
                const compressed = compressor.compress(data);
                data = compressor.decompress(compressed.data).data;
            }
            
            expect(data).toEqual(originalData);
        });
        
        test('应该正确处理不同数据模式', () => {
            const patterns = [
                // 全零数据
                new Uint8Array(100).fill(0),
                // 全255数据
                new Uint8Array(100).fill(255),
                // 递增数据
                new Uint8Array(256).map((_, i) => i),
                // 随机数据
                new Uint8Array(300).map(() => Math.random() * 256 | 0)
            ];
            
            for (const pattern of patterns) {
                const compressed = compressor.compress(pattern);
                const decompressed = compressor.decompress(compressed.data);
                
                expect(decompressed.data).toEqual(pattern);
            }
        });
    });
});