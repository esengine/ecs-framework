import { BinarySerializer } from '../../src/Utils/BinarySerializer';

describe('BinarySerializer', () => {
    describe('encode and decode', () => {
        it('应该正确编码和解码简单对象', () => {
            const data = { name: 'test', value: 123 };
            const encoded = BinarySerializer.encode(data);
            const decoded = BinarySerializer.decode(encoded);

            expect(decoded).toEqual(data);
        });

        it('应该正确编码和解码包含中文的对象', () => {
            const data = {
                name: '测试',
                description: '这是一个包含中文的测试对象',
                value: 456
            };
            const encoded = BinarySerializer.encode(data);
            const decoded = BinarySerializer.decode(encoded);

            expect(decoded).toEqual(data);
        });

        it('应该正确编码和解码数组', () => {
            const data = {
                items: [1, 2, 3, 4, 5],
                names: ['Alice', 'Bob', 'Charlie']
            };
            const encoded = BinarySerializer.encode(data);
            const decoded = BinarySerializer.decode(encoded);

            expect(decoded).toEqual(data);
        });

        it('应该正确编码和解码嵌套对象', () => {
            const data = {
                user: {
                    name: 'John',
                    age: 30,
                    address: {
                        city: 'Beijing',
                        street: 'Main St'
                    }
                },
                scores: [90, 85, 95]
            };
            const encoded = BinarySerializer.encode(data);
            const decoded = BinarySerializer.decode(encoded);

            expect(decoded).toEqual(data);
        });

        it('应该正确编码和解码包含特殊字符的字符串', () => {
            const data = {
                text: 'Hello\nWorld\t!@#$%^&*()',
                emoji: '😀🎉🚀',
                special: 'a\u0000b'
            };
            const encoded = BinarySerializer.encode(data);
            const decoded = BinarySerializer.decode(encoded);

            expect(decoded).toEqual(data);
        });

        it('应该正确编码和解码空对象', () => {
            const data = {};
            const encoded = BinarySerializer.encode(data);
            const decoded = BinarySerializer.decode(encoded);

            expect(decoded).toEqual(data);
        });

        it('应该正确编码和解码空数组', () => {
            const data: any[] = [];
            const encoded = BinarySerializer.encode(data);
            const decoded = BinarySerializer.decode(encoded);

            expect(decoded).toEqual(data);
        });

        it('应该正确编码和解码包含null和undefined的对象', () => {
            const data = {
                nullValue: null,
                undefinedValue: undefined,
                normalValue: 'test'
            };
            const encoded = BinarySerializer.encode(data);
            const decoded = BinarySerializer.decode(encoded);

            expect(decoded.nullValue).toBeNull();
            expect(decoded.undefinedValue).toBeUndefined();
            expect(decoded.normalValue).toBe('test');
        });

        it('应该正确编码和解码布尔值', () => {
            const data = {
                isTrue: true,
                isFalse: false
            };
            const encoded = BinarySerializer.encode(data);
            const decoded = BinarySerializer.decode(encoded);

            expect(decoded).toEqual(data);
        });

        it('应该正确编码和解码数字类型', () => {
            const data = {
                integer: 42,
                float: 3.14159,
                negative: -100,
                zero: 0,
                large: 1234567890
            };
            const encoded = BinarySerializer.encode(data);
            const decoded = BinarySerializer.decode(encoded);

            expect(decoded).toEqual(data);
        });

        it('应该返回Uint8Array类型', () => {
            const data = { test: 'value' };
            const encoded = BinarySerializer.encode(data);

            expect(encoded).toBeInstanceOf(Uint8Array);
        });

        it('应该正确处理包含emoji的复杂字符串', () => {
            const data = {
                text: '🌟 测试 Test 👍',
                emoji: '🎮🎯🎲'
            };
            const encoded = BinarySerializer.encode(data);
            const decoded = BinarySerializer.decode(encoded);

            expect(decoded).toEqual(data);
        });
    });
});
