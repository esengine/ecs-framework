import { Component } from '../../../src/ECS/Component';
import {
    SoATypeRegistry,
    TypedArrayTypeName
} from '../../../src/ECS/Core/SoATypeRegistry';

// Test components
class SimpleComponent extends Component {
    public value: number = 0;
    public flag: boolean = false;
    public name: string = '';
}

describe('SoATypeRegistry', () => {
    describe('getConstructor', () => {
        test('should return Float32Array constructor for float32', () => {
            expect(SoATypeRegistry.getConstructor('float32')).toBe(Float32Array);
        });

        test('should return Float64Array constructor for float64', () => {
            expect(SoATypeRegistry.getConstructor('float64')).toBe(Float64Array);
        });

        test('should return Int32Array constructor for int32', () => {
            expect(SoATypeRegistry.getConstructor('int32')).toBe(Int32Array);
        });

        test('should return Uint32Array constructor for uint32', () => {
            expect(SoATypeRegistry.getConstructor('uint32')).toBe(Uint32Array);
        });

        test('should return Int16Array constructor for int16', () => {
            expect(SoATypeRegistry.getConstructor('int16')).toBe(Int16Array);
        });

        test('should return Uint16Array constructor for uint16', () => {
            expect(SoATypeRegistry.getConstructor('uint16')).toBe(Uint16Array);
        });

        test('should return Int8Array constructor for int8', () => {
            expect(SoATypeRegistry.getConstructor('int8')).toBe(Int8Array);
        });

        test('should return Uint8Array constructor for uint8', () => {
            expect(SoATypeRegistry.getConstructor('uint8')).toBe(Uint8Array);
        });

        test('should return Uint8ClampedArray constructor for uint8clamped', () => {
            expect(SoATypeRegistry.getConstructor('uint8clamped')).toBe(Uint8ClampedArray);
        });

        test('should return Float32Array as default for unknown type', () => {
            expect(SoATypeRegistry.getConstructor('unknown' as TypedArrayTypeName)).toBe(Float32Array);
        });
    });

    describe('getBytesPerElement', () => {
        test('should return 4 for float32', () => {
            expect(SoATypeRegistry.getBytesPerElement('float32')).toBe(4);
        });

        test('should return 8 for float64', () => {
            expect(SoATypeRegistry.getBytesPerElement('float64')).toBe(8);
        });

        test('should return 4 for int32', () => {
            expect(SoATypeRegistry.getBytesPerElement('int32')).toBe(4);
        });

        test('should return 4 for uint32', () => {
            expect(SoATypeRegistry.getBytesPerElement('uint32')).toBe(4);
        });

        test('should return 2 for int16', () => {
            expect(SoATypeRegistry.getBytesPerElement('int16')).toBe(2);
        });

        test('should return 2 for uint16', () => {
            expect(SoATypeRegistry.getBytesPerElement('uint16')).toBe(2);
        });

        test('should return 1 for int8', () => {
            expect(SoATypeRegistry.getBytesPerElement('int8')).toBe(1);
        });

        test('should return 1 for uint8', () => {
            expect(SoATypeRegistry.getBytesPerElement('uint8')).toBe(1);
        });

        test('should return 1 for uint8clamped', () => {
            expect(SoATypeRegistry.getBytesPerElement('uint8clamped')).toBe(1);
        });

        test('should return 4 as default for unknown type', () => {
            expect(SoATypeRegistry.getBytesPerElement('unknown' as TypedArrayTypeName)).toBe(4);
        });
    });

    describe('getTypeName', () => {
        test('should return float32 for Float32Array', () => {
            expect(SoATypeRegistry.getTypeName(new Float32Array(1))).toBe('float32');
        });

        test('should return float64 for Float64Array', () => {
            expect(SoATypeRegistry.getTypeName(new Float64Array(1))).toBe('float64');
        });

        test('should return int32 for Int32Array', () => {
            expect(SoATypeRegistry.getTypeName(new Int32Array(1))).toBe('int32');
        });

        test('should return uint32 for Uint32Array', () => {
            expect(SoATypeRegistry.getTypeName(new Uint32Array(1))).toBe('uint32');
        });

        test('should return int16 for Int16Array', () => {
            expect(SoATypeRegistry.getTypeName(new Int16Array(1))).toBe('int16');
        });

        test('should return uint16 for Uint16Array', () => {
            expect(SoATypeRegistry.getTypeName(new Uint16Array(1))).toBe('uint16');
        });

        test('should return int8 for Int8Array', () => {
            expect(SoATypeRegistry.getTypeName(new Int8Array(1))).toBe('int8');
        });

        test('should return uint8 for Uint8Array', () => {
            expect(SoATypeRegistry.getTypeName(new Uint8Array(1))).toBe('uint8');
        });

        test('should return uint8clamped for Uint8ClampedArray', () => {
            expect(SoATypeRegistry.getTypeName(new Uint8ClampedArray(1))).toBe('uint8clamped');
        });
    });

    describe('createSameType', () => {
        test('should create Float32Array from Float32Array source', () => {
            const source = new Float32Array(10);
            const result = SoATypeRegistry.createSameType(source, 20);
            expect(result).toBeInstanceOf(Float32Array);
            expect(result.length).toBe(20);
        });

        test('should create Float64Array from Float64Array source', () => {
            const source = new Float64Array(10);
            const result = SoATypeRegistry.createSameType(source, 20);
            expect(result).toBeInstanceOf(Float64Array);
            expect(result.length).toBe(20);
        });

        test('should create Int32Array from Int32Array source', () => {
            const source = new Int32Array(10);
            const result = SoATypeRegistry.createSameType(source, 20);
            expect(result).toBeInstanceOf(Int32Array);
            expect(result.length).toBe(20);
        });

        test('should create Uint32Array from Uint32Array source', () => {
            const source = new Uint32Array(10);
            const result = SoATypeRegistry.createSameType(source, 20);
            expect(result).toBeInstanceOf(Uint32Array);
            expect(result.length).toBe(20);
        });

        test('should create Int16Array from Int16Array source', () => {
            const source = new Int16Array(10);
            const result = SoATypeRegistry.createSameType(source, 15);
            expect(result).toBeInstanceOf(Int16Array);
            expect(result.length).toBe(15);
        });

        test('should create Uint16Array from Uint16Array source', () => {
            const source = new Uint16Array(10);
            const result = SoATypeRegistry.createSameType(source, 15);
            expect(result).toBeInstanceOf(Uint16Array);
            expect(result.length).toBe(15);
        });

        test('should create Int8Array from Int8Array source', () => {
            const source = new Int8Array(10);
            const result = SoATypeRegistry.createSameType(source, 15);
            expect(result).toBeInstanceOf(Int8Array);
            expect(result.length).toBe(15);
        });

        test('should create Uint8Array from Uint8Array source', () => {
            const source = new Uint8Array(10);
            const result = SoATypeRegistry.createSameType(source, 15);
            expect(result).toBeInstanceOf(Uint8Array);
            expect(result.length).toBe(15);
        });

        test('should create Uint8ClampedArray from Uint8ClampedArray source', () => {
            const source = new Uint8ClampedArray(10);
            const result = SoATypeRegistry.createSameType(source, 15);
            expect(result).toBeInstanceOf(Uint8ClampedArray);
            expect(result.length).toBe(15);
        });
    });

    describe('extractFieldMetadata', () => {
        test('should extract metadata for simple component', () => {
            const metadata = SoATypeRegistry.extractFieldMetadata(SimpleComponent);

            expect(metadata.has('value')).toBe(true);
            expect(metadata.get('value')?.type).toBe('number');
            expect(metadata.get('value')?.arrayType).toBe('float32');

            expect(metadata.has('flag')).toBe(true);
            expect(metadata.get('flag')?.type).toBe('boolean');
            expect(metadata.get('flag')?.arrayType).toBe('uint8');

            expect(metadata.has('name')).toBe(true);
            expect(metadata.get('name')?.type).toBe('string');
        });

        test('should not include id field in metadata', () => {
            const metadata = SoATypeRegistry.extractFieldMetadata(SimpleComponent);
            expect(metadata.has('id')).toBe(false);
        });

        test('should handle component with object fields', () => {
            class ObjectComponent extends Component {
                public data: object = {};
            }

            const metadata = SoATypeRegistry.extractFieldMetadata(ObjectComponent);
            expect(metadata.has('data')).toBe(true);
            expect(metadata.get('data')?.type).toBe('object');
        });
    });
});
