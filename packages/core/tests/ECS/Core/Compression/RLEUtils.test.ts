import { RLEUtils } from '../../../../src/ECS/Core/Compression/RLEUtils';

describe('RLE工具类测试', () => {
    describe('标准RLE压缩', () => {
        test('应该压缩重复数据', () => {
            const data = new Uint8Array([1, 1, 1, 2, 2, 3]);
            const compressed = RLEUtils.compressStandard(data);
            const decompressed = RLEUtils.decompressStandard(compressed);
            
            expect(decompressed).toEqual(data);
        });
        
        test('应该处理转义字符', () => {
            const data = new Uint8Array([255, 255, 255, 1, 255]);
            const compressed = RLEUtils.compressStandard(data);
            const decompressed = RLEUtils.decompressStandard(compressed);
            
            expect(decompressed).toEqual(data);
        });
        
        test('应该处理空数据', () => {
            const data = new Uint8Array(0);
            const compressed = RLEUtils.compressStandard(data);
            const decompressed = RLEUtils.decompressStandard(compressed);
            
            expect(decompressed).toEqual(data);
        });
    });
    
    describe('位编码RLE压缩', () => {
        test('应该压缩重复数据', () => {
            const data = new Uint8Array([5, 5, 5, 5, 10, 10, 10]);
            const compressed = RLEUtils.compressBitEncoded(data);
            const decompressed = RLEUtils.decompressBitEncoded(compressed);
            
            expect(decompressed).toEqual(data);
        });
        
        test('应该处理高位字节', () => {
            const data = new Uint8Array([0x80, 0x80, 0x80, 0x40]);
            const compressed = RLEUtils.compressBitEncoded(data);
            const decompressed = RLEUtils.decompressBitEncoded(compressed);
            
            expect(decompressed).toEqual(data);
        });
    });
    
    describe('流式RLE压缩', () => {
        test('应该支持流式压缩', () => {
            const state = RLEUtils.createStreamState();
            const data1 = new Uint8Array([1, 1, 1, 2]);
            const data2 = new Uint8Array([2, 2, 3, 3, 3]);
            
            const chunk1 = RLEUtils.compressStream(state, data1, false);
            const chunk2 = RLEUtils.compressStream(state, data2, true);
            
            const combined = new Uint8Array(chunk1.length + chunk2.length);
            combined.set(chunk1, 0);
            combined.set(chunk2, chunk1.length);
            
            const originalData = new Uint8Array([1, 1, 1, 2, 2, 2, 3, 3, 3]);
            const decompressed = RLEUtils.decompressStandard(combined);
            
            expect(decompressed).toEqual(originalData);
        });
    });
    
    describe('选项配置', () => {
        test('应该支持自定义最小序列长度', () => {
            const data = new Uint8Array([1, 1, 2, 2, 2, 2, 2]);
            
            const compressed1 = RLEUtils.compressStandard(data, { minRunLength: 2 });
            const compressed2 = RLEUtils.compressStandard(data, { minRunLength: 6 });
            
            // minRunLength较小时应该有更好的压缩效果
            expect(compressed1.length).toBeLessThanOrEqual(compressed2.length);
        });
        
        test('应该支持自定义转义标记', () => {
            const data = new Uint8Array([0xFE, 0xFE, 0xFE, 1]);
            
            const compressed = RLEUtils.compressStandard(data, {
                escapeMarker: 0xFE,
                escapeValue: 0x00
            });
            const decompressed = RLEUtils.decompressStandard(compressed, {
                escapeMarker: 0xFE,
                escapeValue: 0x00
            });
            
            expect(decompressed).toEqual(data);
        });
    });
    
    describe('边界条件', () => {
        test('应该处理单字节数据', () => {
            const data = new Uint8Array([42]);
            const compressed = RLEUtils.compressStandard(data);
            const decompressed = RLEUtils.decompressStandard(compressed);
            
            expect(decompressed).toEqual(data);
        });
        
        test('应该处理最大重复长度', () => {
            const data = new Uint8Array(300).fill(5);
            const compressed = RLEUtils.compressStandard(data);
            const decompressed = RLEUtils.decompressStandard(compressed);
            
            expect(decompressed).toEqual(data);
            expect(compressed.length).toBeLessThan(data.length);
        });
        
        test('应该处理混合数据', () => {
            const data = new Uint8Array([
                1, 2, 3, 4, 4, 4, 4, 5, 6, 7, 7, 7, 8, 9, 10, 10, 10, 10, 10
            ]);
            const compressed = RLEUtils.compressStandard(data);
            const decompressed = RLEUtils.decompressStandard(compressed);
            
            expect(decompressed).toEqual(data);
        });
    });
});