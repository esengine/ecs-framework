import { murmur3_32, hashString } from '../../src/Utils/Hash32';

describe('Hash32', () => {
    describe('murmur3_32', () => {
        it('应该返回一致的哈希值', () => {
            const data = new TextEncoder().encode('test');
            const hash1 = murmur3_32(data);
            const hash2 = murmur3_32(data);
            
            expect(hash1).toBe(hash2);
            expect(typeof hash1).toBe('number');
        });

        it('应该支持不同的种子值', () => {
            const data = new TextEncoder().encode('test');
            const hash1 = murmur3_32(data, 0);
            const hash2 = murmur3_32(data, 1);
            
            expect(hash1).not.toBe(hash2);
        });

        it('应该处理空数据', () => {
            const empty = new Uint8Array(0);
            const hash = murmur3_32(empty);
            
            expect(typeof hash).toBe('number');
            expect(hash).toBe(0); // MurmurHash3空输入的预期值
        });

        it('应该处理不同长度的数据', () => {
            const data1 = new TextEncoder().encode('a');
            const data2 = new TextEncoder().encode('ab');
            const data3 = new TextEncoder().encode('abc');
            const data4 = new TextEncoder().encode('abcd');
            const data5 = new TextEncoder().encode('abcde');
            
            const hash1 = murmur3_32(data1);
            const hash2 = murmur3_32(data2);
            const hash3 = murmur3_32(data3);
            const hash4 = murmur3_32(data4);
            const hash5 = murmur3_32(data5);
            
            // 所有哈希值应该不同
            const hashes = [hash1, hash2, hash3, hash4, hash5];
            const uniqueHashes = new Set(hashes);
            expect(uniqueHashes.size).toBe(5);
        });

        it('应该产生32位无符号整数', () => {
            const data = new TextEncoder().encode('test data');
            const hash = murmur3_32(data);
            
            expect(hash).toBeGreaterThanOrEqual(0);
            expect(hash).toBeLessThanOrEqual(0xFFFFFFFF);
            expect(Number.isInteger(hash)).toBe(true);
        });

        it('应该验证已知测试向量', () => {
            // MurmurHash3的标准测试向量
            const testCases = [
                { input: '', seed: 0, expected: 0 },
                { input: 'a', seed: 0, expected: 0x3c2569b2 },
                { input: 'ab', seed: 0, expected: 0x9bbfd75f },
                { input: 'abc', seed: 0, expected: 0xb3dd93fa },
                { input: 'abcd', seed: 0, expected: 0x43ed676a },
                { input: 'abcde', seed: 0, expected: 0xe89b9af6 }
            ];

            for (const testCase of testCases) {
                const data = new TextEncoder().encode(testCase.input);
                const hash = murmur3_32(data, testCase.seed);
                expect(hash).toBe(testCase.expected);
            }
        });
    });

    describe('hashString', () => {
        it('应该正确处理字符串哈希', () => {
            const hash1 = hashString('test');
            const hash2 = hashString('test');
            
            expect(hash1).toBe(hash2);
            expect(typeof hash1).toBe('number');
        });

        it('应该支持种子值', () => {
            const hash1 = hashString('test', 0);
            const hash2 = hashString('test', 1);
            
            expect(hash1).not.toBe(hash2);
        });

        it('应该处理Unicode字符', () => {
            const hash1 = hashString('测试');
            const hash2 = hashString('テスト');
            
            expect(hash1).not.toBe(hash2);
            expect(typeof hash1).toBe('number');
            expect(typeof hash2).toBe('number');
        });
    });
});