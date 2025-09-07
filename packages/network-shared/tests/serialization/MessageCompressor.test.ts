/**
 * MessageCompressor 测试套件
 * 验证压缩系统的二进制数据安全性
 */
import { MessageCompressor, ICompressionAlgorithm } from '../../src/serialization/MessageCompressor';

describe('MessageCompressor 二进制数据安全测试', () => {
    let compressor: MessageCompressor;

    beforeEach(() => {
        compressor = new MessageCompressor({
            defaultAlgorithm: 'lz-string',
            threshold: 0,
            enableAsync: false,
            enableStats: false
        });
    });

    test('应该安全处理包含空字节的二进制数据', async () => {
        // 创建包含各种二进制数据的 ArrayBuffer
        const binaryData = new ArrayBuffer(256);
        const view = new Uint8Array(binaryData);
        
        // 填充所有可能的字节值（0-255）
        for (let i = 0; i < 256; i++) {
            view[i] = i;
        }

        // 压缩数据
        const compressResult = await compressor.compress(binaryData, 'lz-string');
        expect(compressResult.wasCompressed).toBe(true);
        expect(compressResult.data).toBeInstanceOf(ArrayBuffer);
        expect(compressResult.compressedSize).toBeGreaterThan(0);

        // 解压缩数据
        const decompressResult = await compressor.decompress(compressResult.data, 'lz-string');
        expect(decompressResult.data).toBeInstanceOf(ArrayBuffer);
        expect(decompressResult.decompressedSize).toBe(256);

        // 验证解压缩后的数据完全相同
        const decompressedView = new Uint8Array(decompressResult.data);
        expect(decompressedView.length).toBe(256);
        
        for (let i = 0; i < 256; i++) {
            expect(decompressedView[i]).toBe(i);
        }
    });

    test('应该正确处理包含UTF-8不兼容字节序列的数据', async () => {
        // 创建包含无效UTF-8序列的数据
        const invalidUtf8 = new ArrayBuffer(10);
        const view = new Uint8Array(invalidUtf8);
        view[0] = 0xFF; // 无效UTF-8起始字节
        view[1] = 0xFE; // 无效UTF-8起始字节
        view[2] = 0x00; // 空字节
        view[3] = 0x80; // 无效UTF-8续延字节
        view[4] = 0xC0; // 孤立UTF-8起始字节
        view[5] = 0x01; // 控制字符
        view[6] = 0x1F; // 控制字符
        view[7] = 0x7F; // DEL字符
        view[8] = 0xC2; // 不完整UTF-8序列
        view[9] = 0x20; // 普通空格

        // 压缩和解压缩
        const compressResult = await compressor.compress(invalidUtf8, 'lz-string');
        const decompressResult = await compressor.decompress(compressResult.data, 'lz-string');

        // 验证数据完整性
        const decompressedView = new Uint8Array(decompressResult.data);
        expect(decompressedView.length).toBe(10);
        
        for (let i = 0; i < 10; i++) {
            expect(decompressedView[i]).toBe(view[i]);
        }
    });

    test('应该处理空数据', async () => {
        const emptyData = new ArrayBuffer(0);
        
        const compressResult = await compressor.compress(emptyData, 'none');
        expect(compressResult.data).toBeInstanceOf(ArrayBuffer);
        expect(compressResult.compressedSize).toBe(0);
        
        const decompressResult = await compressor.decompress(compressResult.data, 'none');
        expect(decompressResult.data).toBeInstanceOf(ArrayBuffer);
        expect(decompressResult.decompressedSize).toBe(0);
    });

    test('应该保持大型二进制数据的完整性', async () => {
        // 创建较大的随机二进制数据
        const size = 10000;
        const largeData = new ArrayBuffer(size);
        const view = new Uint8Array(largeData);
        
        // 使用伪随机数填充
        for (let i = 0; i < size; i++) {
            view[i] = (i * 17 + 42) % 256;
        }

        // 压缩和解压缩
        const compressResult = await compressor.compress(largeData, 'lz-string');
        const decompressResult = await compressor.decompress(compressResult.data, 'lz-string');

        // 验证完整性
        const decompressedView = new Uint8Array(decompressResult.data);
        expect(decompressedView.length).toBe(size);
        
        for (let i = 0; i < size; i++) {
            expect(decompressedView[i]).toBe(view[i]);
        }
    });

    test('应该正确处理重复字节模式', async () => {
        // 创建包含重复模式的数据，这应该压缩得很好
        const patternData = new ArrayBuffer(1000);
        const view = new Uint8Array(patternData);
        
        // 重复模式: 0x00, 0xFF, 0xAA, 0x55
        const pattern = [0x00, 0xFF, 0xAA, 0x55];
        for (let i = 0; i < 1000; i++) {
            view[i] = pattern[i % 4];
        }

        const compressResult = await compressor.compress(patternData, 'lz-string');
        expect(compressResult.wasCompressed).toBe(true);
        expect(compressResult.compressedSize).toBeLessThan(1000); // 应该压缩得很好
        
        const decompressResult = await compressor.decompress(compressResult.data, 'lz-string');
        const decompressedView = new Uint8Array(decompressResult.data);
        
        // 验证模式完整性
        for (let i = 0; i < 1000; i++) {
            expect(decompressedView[i]).toBe(pattern[i % 4]);
        }
    });
});