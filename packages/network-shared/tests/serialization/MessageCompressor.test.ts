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
        const decompressResult = await compressor.decompress(compressResult.data);
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
        const decompressResult = await compressor.decompress(compressResult.data);

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
        expect(compressResult.compressedSize).toBeGreaterThan(0); // 包含容器头
        
        const decompressResult = await compressor.decompress(compressResult.data);
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
        const decompressResult = await compressor.decompress(compressResult.data);

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
        
        const decompressResult = await compressor.decompress(compressResult.data);
        const decompressedView = new Uint8Array(decompressResult.data);
        
        // 验证模式完整性
        for (let i = 0; i < 1000; i++) {
            expect(decompressedView[i]).toBe(pattern[i % 4]);
        }
    });

    test('应该自动识别算法并正确解压缩', async () => {
        const testData = new ArrayBuffer(100);
        const view = new Uint8Array(testData);
        for (let i = 0; i < 100; i++) {
            view[i] = i % 256;
        }

        // 使用不同算法压缩
        const lzResult = await compressor.compress(testData, 'lz-string');
        const noneResult = await compressor.compress(testData, 'none');

        // 解压缩时无需指定算法
        const lzDecompressed = await compressor.decompress(lzResult.data);
        const noneDecompressed = await compressor.decompress(noneResult.data);

        // 验证算法被正确识别
        expect(lzDecompressed.algorithm).toBe('lz-string');
        expect(noneDecompressed.algorithm).toBe('none');

        // 验证数据完整性
        const lzView = new Uint8Array(lzDecompressed.data);
        const noneView = new Uint8Array(noneDecompressed.data);
        
        for (let i = 0; i < 100; i++) {
            expect(lzView[i]).toBe(i % 256);
            expect(noneView[i]).toBe(i % 256);
        }
    });

    test('应该验证解压缩后大小与原始大小一致', async () => {
        const testData = new ArrayBuffer(256);
        const view = new Uint8Array(testData);
        for (let i = 0; i < 256; i++) {
            view[i] = i;
        }

        const compressResult = await compressor.compress(testData, 'lz-string');
        const decompressResult = await compressor.decompress(compressResult.data);

        expect(decompressResult.decompressedSize).toBe(256);
        expect(compressResult.originalSize).toBe(256);
    });

    test('应该拒绝无效格式的数据', async () => {
        // 创建无效的数据（没有正确的魔数）
        const invalidData = new ArrayBuffer(20);
        const view = new Uint8Array(invalidData);
        view[0] = 65; // 'A' 而不是 'M'
        view[1] = 66; // 'B' 而不是 'C'
        view[2] = 67; // 'C' 而不是 'F'  
        view[3] = 68; // 'D' 而不是 '0'

        await expect(compressor.decompress(invalidData)).rejects.toThrow('无效的压缩数据格式，缺少容器头');
    });

    test('应该拒绝未注册的算法', async () => {
        // 手动构建一个包含未知算法的容器
        const textEncoder = new TextEncoder();
        const unknownAlgo = 'unknown-algorithm';
        const algoBytes = textEncoder.encode(unknownAlgo);
        
        const headerSize = 4 + 1 + 1 + algoBytes.length + 4 + 1;
        const data = new Uint8Array(headerSize + 10); // 10字节载荷
        let offset = 0;

        // Magic
        data[offset++] = 77;  // 'M'
        data[offset++] = 67;  // 'C'
        data[offset++] = 70;  // 'F'
        data[offset++] = 48;  // '0'
        
        // Version
        data[offset++] = 1;
        
        // Algorithm
        data[offset++] = algoBytes.length;
        data.set(algoBytes, offset);
        offset += algoBytes.length;
        
        // Original size (10 bytes)
        const sizeBytes = new ArrayBuffer(4);
        const sizeView = new DataView(sizeBytes);
        sizeView.setUint32(0, 10, true);
        data.set(new Uint8Array(sizeBytes), offset);
        offset += 4;
        
        // Flags
        data[offset++] = 0;
        
        // Payload (10 random bytes)
        for (let i = 0; i < 10; i++) {
            data[offset++] = i;
        }

        await expect(compressor.decompress(data.buffer)).rejects.toThrow(`未找到解压缩算法: ${unknownAlgo}`);
    });
});