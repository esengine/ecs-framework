import { SoASerializer } from '../../../src/ECS/Core/SoASerializer';

describe('SoASerializer', () => {
    describe('serialize', () => {
        test('should serialize Map to JSON string', () => {
            const map = new Map([['key1', 'value1'], ['key2', 'value2']]);
            const result = SoASerializer.serialize(map, 'testMap', { isMap: true });
            expect(result).toBe('[["key1","value1"],["key2","value2"]]');
        });

        test('should serialize Set to JSON string', () => {
            const set = new Set([1, 2, 3]);
            const result = SoASerializer.serialize(set, 'testSet', { isSet: true });
            expect(result).toBe('[1,2,3]');
        });

        test('should serialize Array to JSON string', () => {
            const arr = [1, 2, 3];
            const result = SoASerializer.serialize(arr, 'testArray', { isArray: true });
            expect(result).toBe('[1,2,3]');
        });

        test('should serialize plain object to JSON string', () => {
            const obj = { a: 1, b: 'test' };
            const result = SoASerializer.serialize(obj, 'testObj');
            expect(result).toBe('{"a":1,"b":"test"}');
        });

        test('should serialize primitive values', () => {
            expect(SoASerializer.serialize(42, 'num')).toBe('42');
            expect(SoASerializer.serialize('hello', 'str')).toBe('"hello"');
            expect(SoASerializer.serialize(true, 'bool')).toBe('true');
            expect(SoASerializer.serialize(null, 'null')).toBe('null');
        });

        test('should return empty object on serialization error', () => {
            const circular: Record<string, unknown> = {};
            circular.self = circular;
            const result = SoASerializer.serialize(circular, 'circular');
            expect(result).toBe('{}');
        });
    });

    describe('deserialize', () => {
        test('should deserialize JSON string to Map', () => {
            const json = '[["key1","value1"],["key2","value2"]]';
            const result = SoASerializer.deserialize(json, 'testMap', { isMap: true });
            expect(result).toBeInstanceOf(Map);
            expect((result as Map<string, string>).get('key1')).toBe('value1');
            expect((result as Map<string, string>).get('key2')).toBe('value2');
        });

        test('should deserialize JSON string to Set', () => {
            const json = '[1,2,3]';
            const result = SoASerializer.deserialize(json, 'testSet', { isSet: true });
            expect(result).toBeInstanceOf(Set);
            expect((result as Set<number>).has(1)).toBe(true);
            expect((result as Set<number>).has(2)).toBe(true);
            expect((result as Set<number>).has(3)).toBe(true);
        });

        test('should deserialize JSON string to Array', () => {
            const json = '[1,2,3]';
            const result = SoASerializer.deserialize(json, 'testArray', { isArray: true });
            expect(result).toEqual([1, 2, 3]);
        });

        test('should deserialize JSON string to object', () => {
            const json = '{"a":1,"b":"test"}';
            const result = SoASerializer.deserialize(json, 'testObj');
            expect(result).toEqual({ a: 1, b: 'test' });
        });

        test('should deserialize primitive values', () => {
            expect(SoASerializer.deserialize('42', 'num')).toBe(42);
            expect(SoASerializer.deserialize('"hello"', 'str')).toBe('hello');
            expect(SoASerializer.deserialize('true', 'bool')).toBe(true);
            expect(SoASerializer.deserialize('null', 'null')).toBe(null);
        });

        test('should return null on deserialization error', () => {
            const result = SoASerializer.deserialize('invalid json', 'field');
            expect(result).toBe(null);
        });
    });

    describe('deepClone', () => {
        test('should return primitive values as-is', () => {
            expect(SoASerializer.deepClone(42)).toBe(42);
            expect(SoASerializer.deepClone('hello')).toBe('hello');
            expect(SoASerializer.deepClone(true)).toBe(true);
            expect(SoASerializer.deepClone(null)).toBe(null);
            expect(SoASerializer.deepClone(undefined)).toBe(undefined);
        });

        test('should clone Date objects', () => {
            const date = new Date('2023-01-01');
            const cloned = SoASerializer.deepClone(date);
            expect(cloned).toBeInstanceOf(Date);
            expect(cloned.getTime()).toBe(date.getTime());
            expect(cloned).not.toBe(date);
        });

        test('should clone arrays deeply', () => {
            const arr = [1, [2, 3], { a: 4 }];
            const cloned = SoASerializer.deepClone(arr);
            expect(cloned).toEqual(arr);
            expect(cloned).not.toBe(arr);
            expect(cloned[1]).not.toBe(arr[1]);
            expect(cloned[2]).not.toBe(arr[2]);
        });

        test('should clone Map objects deeply', () => {
            const map = new Map([
                ['key1', { value: 1 }],
                ['key2', { value: 2 }]
            ]);
            const cloned = SoASerializer.deepClone(map);
            expect(cloned).toBeInstanceOf(Map);
            expect(cloned.size).toBe(2);
            expect(cloned.get('key1')).toEqual({ value: 1 });
            expect(cloned.get('key1')).not.toBe(map.get('key1'));
        });

        test('should clone Set objects deeply', () => {
            const obj1 = { a: 1 };
            const obj2 = { b: 2 };
            const set = new Set([obj1, obj2]);
            const cloned = SoASerializer.deepClone(set);
            expect(cloned).toBeInstanceOf(Set);
            expect(cloned.size).toBe(2);

            const clonedArray = Array.from(cloned);
            expect(clonedArray[0]).toEqual(obj1);
            expect(clonedArray[0]).not.toBe(obj1);
        });

        test('should clone nested objects deeply', () => {
            const obj = {
                a: 1,
                b: {
                    c: 2,
                    d: {
                        e: 3
                    }
                }
            };
            const cloned = SoASerializer.deepClone(obj);
            expect(cloned).toEqual(obj);
            expect(cloned).not.toBe(obj);
            expect(cloned.b).not.toBe(obj.b);
            expect(cloned.b.d).not.toBe(obj.b.d);
        });

        test('should clone complex nested structures', () => {
            const complex = {
                array: [1, 2, 3],
                map: new Map([['a', 1]]),
                set: new Set([1, 2]),
                date: new Date('2023-01-01'),
                nested: {
                    value: 'test'
                }
            };
            const cloned = SoASerializer.deepClone(complex);

            expect(cloned.array).toEqual(complex.array);
            expect(cloned.array).not.toBe(complex.array);

            expect(cloned.map).toBeInstanceOf(Map);
            expect(cloned.map.get('a')).toBe(1);

            expect(cloned.set).toBeInstanceOf(Set);
            expect(cloned.set.has(1)).toBe(true);

            expect(cloned.date).toBeInstanceOf(Date);
            expect(cloned.date.getTime()).toBe(complex.date.getTime());

            expect(cloned.nested).toEqual(complex.nested);
            expect(cloned.nested).not.toBe(complex.nested);
        });
    });
});
