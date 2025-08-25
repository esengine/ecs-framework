import { ECSCompressor } from '../../../../src/ECS/Core/Compression/ECSCompressor';

describe('ECS专用压缩器测试', () => {
    const compressor = new ECSCompressor();
    
    describe('基本压缩功能', () => {
        test('应该压缩实体ID序列', () => {
            // 创建连续的实体ID数据
            const testData = new Uint8Array(40);
            const view = new DataView(testData.buffer);
            
            // 写入10个连续的实体ID（每个4字节）
            for (let i = 0; i < 10; i++) {
                view.setUint32(i * 4, 1000 + i, true);
            }
            
            const result = compressor.compress(testData, { level: 6 });
            
            expect(result.stats.compressionRatio).toBeLessThan(0.95);
            expect(result.data.length).toBeLessThan(testData.length);
        });
        
        test('应该压缩位图数据', () => {
            // 创建稀疏位图（大量0）
            const testData = new Uint8Array(1000);
            // 只有少量非零值
            testData[10] = 1;
            testData[50] = 1;
            testData[100] = 1;
            
            const result = compressor.compress(testData, { level: 6 });
            
            expect(result.stats.compressionRatio).toBeLessThan(0.3);
            expect(result.data.length).toBeLessThan(testData.length);
        });
        
        test('应该压缩重复字段数据', () => {
            // 创建结构化数据（模拟组件字段）
            const testData = new Uint8Array(200);
            const recordSize = 8; // 每个记录8字节
            
            // 填充25个记录，每个记录有重复的字段模式
            for (let i = 0; i < 25; i++) {
                const offset = i * recordSize;
                testData[offset] = 42; // 字段1：固定值
                testData[offset + 1] = i % 5; // 字段2：有限值范围
                testData[offset + 2] = 1; // 字段3：固定值
                testData[offset + 3] = 0;
                testData[offset + 4] = i & 0xFF; // 字段5：递增值
                testData[offset + 5] = 0;
                testData[offset + 6] = 0;
                testData[offset + 7] = 0;
            }
            
            const result = compressor.compress(testData, { level: 6 });
            
            expect(result.stats.compressionRatio).toBeLessThan(0.85);
        });
        
        test('应该正确解压所有压缩模式', () => {
            const testCases = [
                // 实体ID序列
                (() => {
                    const data = new Uint8Array(20);
                    const view = new DataView(data.buffer);
                    for (let i = 0; i < 5; i++) {
                        view.setUint32(i * 4, 100 + i, true);
                    }
                    return data;
                })(),
                
                // 位图数据
                (() => {
                    const data = new Uint8Array(100);
                    data[5] = 1;
                    data[15] = 1;
                    return data;
                })(),
                
                // 重复字段数据
                (() => {
                    const data = new Uint8Array(48); // 6个8字节记录
                    for (let i = 0; i < 6; i++) {
                        const offset = i * 8;
                        data[offset] = 42;
                        data[offset + 1] = i % 3;
                        data[offset + 4] = i;
                    }
                    return data;
                })(),
                
                // 通用数据
                new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
            ];
            
            for (const originalData of testCases) {
                const compressed = compressor.compress(originalData, { level: 6 });
                const decompressed = compressor.decompress(compressed.data);
                
                expect(decompressed.data).toEqual(originalData);
            }
        });
    });
    
    describe('数据模式分析', () => {
        test('应该检测实体ID模式', () => {
            const testData = new Uint8Array(32);
            const view = new DataView(testData.buffer);
            
            // 创建8个连续的实体ID
            for (let i = 0; i < 8; i++) {
                view.setUint32(i * 4, 1000 + i, true);
            }
            
            const result = compressor.compress(testData, { level: 6 });
            
            // 应该使用实体ID优化压缩
            expect(result.stats.compressionRatio).toBeLessThan(0.5);
        });
        
        test('应该检测位图模式', () => {
            const testData = new Uint8Array(1000);
            // 70%以上的零字节
            for (let i = 0; i < 300; i++) {
                testData[i] = i % 256;
            }
            // 剩余700字节为0
            
            const result = compressor.compress(testData, { level: 6 });
            
            expect(result.stats.compressionRatio).toBeLessThan(0.6);
        });
        
        test('应该检测重复字段模式', () => {
            const fieldSize = 12;
            const recordCount = 20;
            const testData = new Uint8Array(fieldSize * recordCount);
            
            // 创建有明显字段重复模式的数据
            for (let i = 0; i < recordCount; i++) {
                const offset = i * fieldSize;
                testData[offset] = 42; // 固定字段
                testData[offset + 4] = i % 5; // 有限值字段
                testData[offset + 8] = 1; // 固定字段
            }
            
            const result = compressor.compress(testData, { level: 6 });
            
            expect(result.stats.compressionRatio).toBeLessThan(0.95);
        });
    });
    
    describe('压缩级别', () => {
        test('应该支持不同压缩级别', () => {
            const testData = new Uint8Array(100);
            for (let i = 0; i < testData.length; i++) {
                testData[i] = i % 10;
            }
            
            const level1 = compressor.compress(testData, { level: 1 });
            const level5 = compressor.compress(testData, { level: 5 });
            const level9 = compressor.compress(testData, { level: 9 });
            
            // 所有级别都应该工作
            expect(level1.stats.compressionRatio).toBeGreaterThan(0);
            expect(level5.stats.compressionRatio).toBeGreaterThan(0);
            expect(level9.stats.compressionRatio).toBeGreaterThan(0);
            
            // 验证所有级别都能正常工作
            expect(level1.stats.compressionTime).toBeGreaterThanOrEqual(0);
            expect(level9.stats.compressionTime).toBeGreaterThanOrEqual(0);
        });
        
        test('应该正确处理无效级别', () => {
            const testData = new Uint8Array([1, 2, 3, 4, 5]);
            
            // 测试超出范围的级别
            const result1 = compressor.compress(testData, { level: 0 }); // 应该变成1
            const result2 = compressor.compress(testData, { level: 15 }); // 应该变成9
            
            expect(result1.data).toBeDefined();
            expect(result2.data).toBeDefined();
        });
    });
    
    describe('性能和统计', () => {
        test('应该提供压缩统计信息', () => {
            const testData = new Uint8Array(500);
            for (let i = 0; i < testData.length; i++) {
                testData[i] = i % 20;
            }
            
            const result = compressor.compress(testData, { level: 6 });
            
            expect(result.stats.originalSize).toBe(500);
            expect(result.stats.compressedSize).toBe(result.data.length);
            expect(result.stats.compressionRatio).toBe(result.data.length / 500);
            expect(result.stats.compressionTime).toBeGreaterThan(0);
        });
        
        test('应该正确估算压缩大小', () => {
            const testCases = [
                // 实体ID数据
                (() => {
                    const data = new Uint8Array(40);
                    const view = new DataView(data.buffer);
                    for (let i = 0; i < 10; i++) {
                        view.setUint32(i * 4, 100 + i, true);
                    }
                    return data;
                })(),
                
                // 位图数据
                (() => {
                    const data = new Uint8Array(1000);
                    data[10] = 1;
                    data[20] = 1;
                    return data;
                })(),
                
                // 重复字段数据
                (() => {
                    const data = new Uint8Array(80);
                    for (let i = 0; i < 10; i++) {
                        data[i * 8] = 42;
                        data[i * 8 + 4] = i % 5;
                    }
                    return data;
                })(),
                
                // 通用数据
                new Uint8Array(100).fill(123)
            ];
            
            for (const testData of testCases) {
                const result = compressor.compress(testData);
                
                // 验证压缩能够正常工作
                expect(result.data.length).toBeGreaterThan(0);
                expect(result.stats.compressionRatio).toBeGreaterThan(0);
            }
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
        
        test('应该处理大数据', () => {
            const largeData = new Uint8Array(10000);
            for (let i = 0; i < largeData.length; i++) {
                largeData[i] = i % 256;
            }
            
            const compressed = compressor.compress(largeData, { level: 5 });
            const decompressed = compressor.decompress(compressed.data);
            
            expect(decompressed.data).toEqual(largeData);
            expect(compressed.stats.compressionRatio).toBeLessThan(1.0);
        });
    });
    
    describe('压缩器属性', () => {
        test('应该有正确的基本属性', () => {
            expect(compressor.name).toBe('ecs-lz');
            expect(compressor.supportedLevels).toEqual([1, 9]);
            expect(compressor.supportsDictionary).toBe(true);
            expect(compressor.supportsStreaming).toBe(true);
        });
    });
    
    describe('错误处理', () => {
        test('应该处理解压失败', () => {
            const invalidData = new Uint8Array([99, 1, 2, 3, 4]); // 无效的压缩模式
            
            expect(() => {
                compressor.decompress(invalidData);
            }).not.toThrow(); // 应该有graceful fallback
        });
        
        test('应该处理损坏的压缩数据', () => {
            const originalData = new Uint8Array([1, 2, 3, 4, 5]);
            const compressed = compressor.compress(originalData);
            
            // 损坏压缩数据
            if (compressed.data.length > 1) {
                compressed.data[1] = 255;
            }
            
            // 解压可能失败或产生不同结果
            expect(() => {
                compressor.decompress(compressed.data);
            }).not.toThrow(); // 不应该崩溃
        });
    });
});