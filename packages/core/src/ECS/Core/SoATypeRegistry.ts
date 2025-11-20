/**
 * SoA存储器支持的TypedArray类型
 */
export type SupportedTypedArray =
    | Float32Array
    | Float64Array
    | Int32Array
    | Uint32Array
    | Int16Array
    | Uint16Array
    | Int8Array
    | Uint8Array
    | Uint8ClampedArray;

export type TypedArrayConstructor =
    | typeof Float32Array
    | typeof Float64Array
    | typeof Int32Array
    | typeof Uint32Array
    | typeof Int16Array
    | typeof Uint16Array
    | typeof Int8Array
    | typeof Uint8Array
    | typeof Uint8ClampedArray;

/**
 * TypedArray 类型名称
 */
export type TypedArrayTypeName =
    | 'float32'
    | 'float64'
    | 'int32'
    | 'uint32'
    | 'int16'
    | 'uint16'
    | 'int8'
    | 'uint8'
    | 'uint8clamped';

/**
 * 字段元数据
 */
export interface FieldMetadata {
    name: string;
    type: 'number' | 'boolean' | 'string' | 'object';
    arrayType?: TypedArrayTypeName;
    isSerializedMap?: boolean;
    isSerializedSet?: boolean;
    isSerializedArray?: boolean;
    isDeepCopy?: boolean;
}

/**
 * SoA 类型注册器
 * 负责类型推断、TypedArray 创建和元数据管理
 */
export class SoATypeRegistry {
    private static readonly TYPE_CONSTRUCTORS: Record<TypedArrayTypeName, TypedArrayConstructor> = {
        float32: Float32Array,
        float64: Float64Array,
        int32: Int32Array,
        uint32: Uint32Array,
        int16: Int16Array,
        uint16: Uint16Array,
        int8: Int8Array,
        uint8: Uint8Array,
        uint8clamped: Uint8ClampedArray
    };

    private static readonly TYPE_BYTES: Record<TypedArrayTypeName, number> = {
        float32: 4,
        float64: 8,
        int32: 4,
        uint32: 4,
        int16: 2,
        uint16: 2,
        int8: 1,
        uint8: 1,
        uint8clamped: 1
    };

    /**
     * 获取 TypedArray 构造函数
     */
    public static getConstructor(typeName: TypedArrayTypeName): TypedArrayConstructor {
        return this.TYPE_CONSTRUCTORS[typeName] || Float32Array;
    }

    /**
     * 获取每个元素的字节数
     */
    public static getBytesPerElement(typeName: TypedArrayTypeName): number {
        return this.TYPE_BYTES[typeName] || 4;
    }

    /**
     * 从 TypedArray 实例获取类型名称
     */
    public static getTypeName(array: SupportedTypedArray): TypedArrayTypeName {
        if (array instanceof Float32Array) return 'float32';
        if (array instanceof Float64Array) return 'float64';
        if (array instanceof Int32Array) return 'int32';
        if (array instanceof Uint32Array) return 'uint32';
        if (array instanceof Int16Array) return 'int16';
        if (array instanceof Uint16Array) return 'uint16';
        if (array instanceof Int8Array) return 'int8';
        if (array instanceof Uint8Array) return 'uint8';
        if (array instanceof Uint8ClampedArray) return 'uint8clamped';
        return 'float32';
    }

    /**
     * 创建新的 TypedArray（与原数组同类型）
     */
    public static createSameType(source: SupportedTypedArray, capacity: number): SupportedTypedArray {
        const typeName = this.getTypeName(source);
        const Constructor = this.getConstructor(typeName);
        return new Constructor(capacity);
    }

    /**
     * 从组件类型提取字段元数据
     */
    public static extractFieldMetadata<T>(
        componentType: new () => T
    ): Map<string, FieldMetadata> {
        const instance = new componentType();
        const metadata = new Map<string, FieldMetadata>();

        const typeWithMeta = componentType as typeof componentType & {
            __float64Fields?: Set<string>;
            __float32Fields?: Set<string>;
            __int32Fields?: Set<string>;
            __uint32Fields?: Set<string>;
            __int16Fields?: Set<string>;
            __uint16Fields?: Set<string>;
            __int8Fields?: Set<string>;
            __uint8Fields?: Set<string>;
            __uint8ClampedFields?: Set<string>;
            __serializeMapFields?: Set<string>;
            __serializeSetFields?: Set<string>;
            __serializeArrayFields?: Set<string>;
            __deepCopyFields?: Set<string>;
        };

        // 收集装饰器标记
        const decoratorMap = new Map<string, TypedArrayTypeName>();

        const addDecorators = (fields: Set<string> | undefined, type: TypedArrayTypeName) => {
            if (fields) {
                for (const key of fields) decoratorMap.set(key, type);
            }
        };

        addDecorators(typeWithMeta.__float64Fields, 'float64');
        addDecorators(typeWithMeta.__float32Fields, 'float32');
        addDecorators(typeWithMeta.__int32Fields, 'int32');
        addDecorators(typeWithMeta.__uint32Fields, 'uint32');
        addDecorators(typeWithMeta.__int16Fields, 'int16');
        addDecorators(typeWithMeta.__uint16Fields, 'uint16');
        addDecorators(typeWithMeta.__int8Fields, 'int8');
        addDecorators(typeWithMeta.__uint8Fields, 'uint8');
        addDecorators(typeWithMeta.__uint8ClampedFields, 'uint8clamped');

        // 遍历实例属性
        const instanceKeys = Object.keys(instance as object).filter((key) => key !== 'id');

        for (const key of instanceKeys) {
            const value = (instance as Record<string, unknown>)[key];
            const type = typeof value;

            if (type === 'function') continue;

            const fieldMeta: FieldMetadata = {
                name: key,
                type: type as 'number' | 'boolean' | 'string' | 'object'
            };

            const decoratorType = decoratorMap.get(key);

            if (decoratorType) {
                fieldMeta.arrayType = decoratorType;
            } else if (type === 'number') {
                fieldMeta.arrayType = 'float32';
            } else if (type === 'boolean') {
                fieldMeta.arrayType = 'uint8';
            }

            // 序列化标记
            if (typeWithMeta.__serializeMapFields?.has(key)) {
                fieldMeta.isSerializedMap = true;
            }
            if (typeWithMeta.__serializeSetFields?.has(key)) {
                fieldMeta.isSerializedSet = true;
            }
            if (typeWithMeta.__serializeArrayFields?.has(key)) {
                fieldMeta.isSerializedArray = true;
            }
            if (typeWithMeta.__deepCopyFields?.has(key)) {
                fieldMeta.isDeepCopy = true;
            }

            metadata.set(key, fieldMeta);
        }

        return metadata;
    }
}
