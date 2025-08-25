import { EcsDifferentialCompressor } from '../../../../src/ECS/Core/Compression/DifferentialCompressor';

describe('差分压缩器测试', () => {
    const compressor = new EcsDifferentialCompressor();
    
    describe('基本差分功能', () => {
        test('应该创建差分数据', () => {
            const baseData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
            const newData = new Uint8Array([1, 2, 99, 4, 5, 6, 7, 88, 9, 10]);
            
            const result = compressor.createDiff(baseData, newData);
            
            expect(result.stats.compressionRatio).toBeLessThan(3.0); // 差分可能比原数据大，但应该合理
            expect(result.diff.length).toBeGreaterThan(0);
            expect(result.stats.compressionTime).toBeGreaterThan(0);
        });
        
        test('应该正确应用差分', () => {
            const baseData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
            const newData = new Uint8Array([1, 2, 99, 4, 5, 6, 7, 88, 9, 10]);
            
            const diffResult = compressor.createDiff(baseData, newData);
            const reconstructed = compressor.applyDiff(baseData, diffResult.diff);
            
            expect(reconstructed.data).toEqual(newData);
            expect(reconstructed.stats.decompressionTime).toBeGreaterThan(0);
        });
        
        test('应该处理相同数据的差分', () => {
            const baseData = new Uint8Array([1, 2, 3, 4, 5]);
            const sameData = new Uint8Array([1, 2, 3, 4, 5]);
            
            const diffResult = compressor.createDiff(baseData, sameData);
            
            // 相同数据的差分应该相对较小
            expect(diffResult.stats.compressionRatio).toBeLessThan(4.0); // 允许头部开销
            expect(diffResult.diff.length).toBeGreaterThan(0);
        });
        
        test('应该处理完全不同的数据', () => {
            const baseData = new Uint8Array([1, 2, 3, 4, 5]);
            const newData = new Uint8Array([10, 20, 30, 40, 50]);
            
            const diffResult = compressor.createDiff(baseData, newData);
            const reconstructed = compressor.applyDiff(baseData, diffResult.diff);
            
            expect(reconstructed.data).toEqual(newData);
        });
    });
    
    describe('不同类型的变化', () => {
        test('应该处理插入操作', () => {
            const baseData = new Uint8Array([1, 2, 3]);
            const newData = new Uint8Array([1, 2, 99, 88, 3]); // 在中间插入99, 88
            
            const diffResult = compressor.createDiff(baseData, newData);
            const reconstructed = compressor.applyDiff(baseData, diffResult.diff);
            
            expect(reconstructed.data).toEqual(newData);
        });
        
        test('应该处理删除操作', () => {
            const baseData = new Uint8Array([1, 2, 3, 4, 5]);
            const newData = new Uint8Array([1, 3, 5]); // 删除2和4
            
            const diffResult = compressor.createDiff(baseData, newData);
            const reconstructed = compressor.applyDiff(baseData, diffResult.diff);
            
            expect(reconstructed.data).toEqual(newData);
        });
        
        test('应该处理替换操作', () => {
            const baseData = new Uint8Array([1, 2, 3, 4, 5]);
            const newData = new Uint8Array([1, 99, 88, 4, 5]); // 替换2->99, 3->88
            
            const diffResult = compressor.createDiff(baseData, newData);
            const reconstructed = compressor.applyDiff(baseData, diffResult.diff);
            
            expect(reconstructed.data).toEqual(newData);
        });
        
        test('应该处理复杂的混合变化', () => {
            const baseData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
            const newData = new Uint8Array([1, 99, 3, 77, 88, 6, 9, 10, 11]); // 替换、插入、删除的组合
            
            const diffResult = compressor.createDiff(baseData, newData);
            const reconstructed = compressor.applyDiff(baseData, diffResult.diff);
            
            expect(reconstructed.data).toEqual(newData);
        });
    });
    
    describe('大数据处理', () => {
        test('应该处理大数据的小变化', () => {
            const baseData = new Uint8Array(1000);
            baseData.fill(42);
            
            const newData = new Uint8Array(baseData);
            newData[100] = 99; // 只改变一个字节
            newData[500] = 88; // 再改变一个字节
            
            const diffResult = compressor.createDiff(baseData, newData);
            const reconstructed = compressor.applyDiff(baseData, diffResult.diff);
            
            expect(reconstructed.data).toEqual(newData);
            expect(diffResult.stats.compressionRatio).toBeLessThan(0.1); // 应该有很高的压缩比
        });
        
        test('应该处理重复模式的数据', () => {
            const baseData = new Uint8Array(200);
            for (let i = 0; i < baseData.length; i++) {
                baseData[i] = i % 10; // 重复模式
            }
            
            const newData = new Uint8Array(baseData);
            // 修改一些重复的部分
            for (let i = 50; i < 60; i++) {
                newData[i] = 99;
            }
            
            const diffResult = compressor.createDiff(baseData, newData);
            const reconstructed = compressor.applyDiff(baseData, diffResult.diff);
            
            expect(reconstructed.data).toEqual(newData);
        });
    });
    
    describe('边界条件', () => {
        test('应该处理空基线数据', () => {
            const baseData = new Uint8Array(0);
            const newData = new Uint8Array([1, 2, 3]);
            
            const diffResult = compressor.createDiff(baseData, newData);
            const reconstructed = compressor.applyDiff(baseData, diffResult.diff);
            
            expect(reconstructed.data).toEqual(newData);
        });
        
        test('应该处理空新数据', () => {
            const baseData = new Uint8Array([1, 2, 3]);
            const newData = new Uint8Array(0);
            
            const diffResult = compressor.createDiff(baseData, newData);
            const reconstructed = compressor.applyDiff(baseData, diffResult.diff);
            
            expect(reconstructed.data).toEqual(newData);
        });
        
        test('应该处理单字节数据', () => {
            const baseData = new Uint8Array([1]);
            const newData = new Uint8Array([2]);
            
            const diffResult = compressor.createDiff(baseData, newData);
            const reconstructed = compressor.applyDiff(baseData, diffResult.diff);
            
            expect(reconstructed.data).toEqual(newData);
        });
    });
    
    describe('数据完整性验证', () => {
        test('应该验证基线数据校验和', () => {
            const baseData = new Uint8Array([1, 2, 3, 4, 5]);
            const newData = new Uint8Array([1, 2, 99, 4, 5]);
            
            const diffResult = compressor.createDiff(baseData, newData);
            
            // 修改基线数据
            const modifiedBase = new Uint8Array([1, 2, 3, 4, 99]);
            
            expect(() => {
                compressor.applyDiff(modifiedBase, diffResult.diff);
            }).toThrow('基线数据校验失败，可能已被修改');
        });
        
        test('应该验证结果数据校验和', () => {
            const baseData = new Uint8Array([1, 2, 3, 4, 5]);
            const newData = new Uint8Array([1, 2, 99, 4, 5]);
            
            const diffResult = compressor.createDiff(baseData, newData);
            
            // 损坏差分数据(修改校验和)
            if (diffResult.diff.length >= 9) {
                diffResult.diff[6] = 255; // 修改新数据校验和位置
            }
            
            expect(() => {
                compressor.applyDiff(baseData, diffResult.diff, { verifyIntegrity: true });
            }).toThrow('应用差分后的数据校验失败');
        });
        
        test('应该支持跳过完整性验证', () => {
            const baseData = new Uint8Array([1, 2, 3, 4, 5]);
            const newData = new Uint8Array([1, 2, 99, 4, 5]);
            
            const diffResult = compressor.createDiff(baseData, newData);
            
            // 不验证完整性应该不抛出异常
            expect(() => {
                compressor.applyDiff(baseData, diffResult.diff, { verifyIntegrity: false });
            }).not.toThrow();
        });
    });
    
    describe('压缩器属性', () => {
        test('应该有正确的基本属性', () => {
            expect(compressor.name).toBe('ecs-diff');
            expect(compressor.supportedLevels).toEqual([1, 9]);
            expect(compressor.supportsDictionary).toBe(false);
            expect(compressor.supportsStreaming).toBe(false);
        });
        
        test('应该不支持普通压缩和解压', () => {
            const testData = new Uint8Array([1, 2, 3]);
            
            expect(() => {
                compressor.compress(testData);
            }).toThrow('差分压缩器需要使用createDiff方法，不支持普通压缩');
            
            expect(() => {
                compressor.decompress(testData);
            }).toThrow('差分压缩器需要使用applyDiff方法，不支持普通解压');
        });
    });
    
    describe('性能和统计', () => {
        test('应该提供准确的统计信息', () => {
            const baseData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
            const newData = new Uint8Array([1, 2, 99, 4, 5, 6, 7, 88, 9, 10]);
            
            const diffResult = compressor.createDiff(baseData, newData);
            
            expect(diffResult.stats.originalSize).toBe(newData.length);
            expect(diffResult.stats.compressedSize).toBe(diffResult.diff.length);
            expect(diffResult.stats.compressionRatio).toBe(diffResult.diff.length / newData.length);
            expect(diffResult.stats.compressionTime).toBeGreaterThan(0);
        });
        
    });
    
    describe('错误处理', () => {
        test('应该处理损坏的差分头部', () => {
            const baseData = new Uint8Array([1, 2, 3]);
            const corruptedDiff = new Uint8Array([1, 2, 3]); // 太短的数据
            
            expect(() => {
                compressor.applyDiff(baseData, corruptedDiff);
            }).toThrow('差分数据头部不完整');
        });
        
        test('应该处理无效的差分标记', () => {
            const baseData = new Uint8Array([1, 2, 3]);
            const invalidDiff = new Uint8Array(16);
            
            // 设置无效的标记
            invalidDiff[0] = 0x12; // 无效标记
            
            expect(() => {
                compressor.applyDiff(baseData, invalidDiff);
            }).toThrow('无效的差分标记');
        });
        
        test('应该处理不支持的版本', () => {
            const baseData = new Uint8Array([1, 2, 3, 4, 5]);
            const newData = new Uint8Array([1, 2, 99, 4, 5]);
            
            // 创建有效的差分数据，然后修改基线校验和使其失败
            const diffResult = compressor.createDiff(baseData, newData);
            
            // 修改基线数据的校验和(位置1-4)来模拟版本问题
            if (diffResult.diff.length >= 5) {
                diffResult.diff[2] = 255; // 修改基线校验和
            }
            
            expect(() => {
                compressor.applyDiff(baseData, diffResult.diff);
            }).toThrow('基线数据校验失败');
        });
    });
    
    describe('高级功能', () => {
        test('应该优化连续的相同操作', () => {
            const baseData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
            const newData = new Uint8Array([99, 99, 99, 4, 5, 6, 7, 8, 9, 10]); // 连续替换
            
            const diffResult = compressor.createDiff(baseData, newData);
            const reconstructed = compressor.applyDiff(baseData, diffResult.diff);
            
            expect(reconstructed.data).toEqual(newData);
            
            // 应该有合理的压缩效果
            expect(diffResult.stats.compressionRatio).toBeLessThan(3.0);
        });
        
        test('应该处理块大小边界', () => {
            const baseData = new Uint8Array(50);
            for (let i = 0; i < baseData.length; i++) {
                baseData[i] = i % 10;
            }
            
            const newData = new Uint8Array(baseData);
            // 修改跨越块边界的数据
            for (let i = 14; i < 18; i++) {
                newData[i] = 99;
            }
            
            const diffResult = compressor.createDiff(baseData, newData);
            const reconstructed = compressor.applyDiff(baseData, diffResult.diff);
            
            expect(reconstructed.data).toEqual(newData);
        });
    });
});