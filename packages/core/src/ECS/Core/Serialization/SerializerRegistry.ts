import { createLogger } from '../../../Utils/Logger';

/**
 * 序列化器对
 */
export interface SerializerPair {
    /** 序列化函数 */
    serialize: (value: any) => any;
    /** 反序列化函数 */
    deserialize: (data: any) => any;
}

/**
 * 序列化器元数据
 */
export interface SerializerMetadata {
    /** 序列化器名称 */
    name: string;
    /** 描述 */
    description?: string;
    /** 支持的数据类型 */
    supportedTypes?: string[];
    /** 是否为内置序列化器 */
    builtin: boolean;
}

/**
 * 序列化器注册表
 * 
 * 管理自定义序列化器，支持常见数学类型的优化编码
 */
export class SerializerRegistry {
    private static serializers = new Map<string, SerializerPair>();
    private static metadata = new Map<string, SerializerMetadata>();
    private static readonly logger = createLogger('SerializerRegistry');
    
    /**
     * 注册序列化器
     */
    static register(
        name: string, 
        serializer: (value: any) => any, 
        deserializer: (data: any) => any,
        metadata?: Partial<SerializerMetadata>
    ): void {
        if (this.serializers.has(name)) {
            this.logger.warn(`序列化器 "${name}" 已存在，将被覆盖`);
        }
        
        this.serializers.set(name, { serialize: serializer, deserialize: deserializer });
        this.metadata.set(name, {
            name,
            description: metadata?.description || `自定义序列化器: ${name}`,
            supportedTypes: metadata?.supportedTypes || [],
            builtin: metadata?.builtin || false
        });
        
        this.logger.debug(`注册序列化器: ${name}`);
    }
    
    /**
     * 获取序列化器
     */
    static get(name: string): SerializerPair | undefined {
        return this.serializers.get(name);
    }
    
    /**
     * 检查序列化器是否存在
     */
    static has(name: string): boolean {
        return this.serializers.has(name);
    }
    
    /**
     * 获取所有序列化器名称
     */
    static getAllNames(): string[] {
        return Array.from(this.serializers.keys());
    }
    
    /**
     * 获取序列化器元数据
     */
    static getMetadata(name: string): SerializerMetadata | undefined {
        return this.metadata.get(name);
    }
    
    /**
     * 移除序列化器
     */
    static unregister(name: string): boolean {
        const metadata = this.metadata.get(name);
        if (metadata?.builtin) {
            this.logger.error(`不能移除内置序列化器: ${name}`);
            return false;
        }
        
        const removed = this.serializers.delete(name);
        if (removed) {
            this.metadata.delete(name);
            this.logger.debug(`移除序列化器: ${name}`);
        }
        return removed;
    }
    
    /**
     * 注册内置序列化器
     */
    static registerBuiltins(): void {
        // Vector2
        this.register(
            'vector2',
            (v: any) => [v.x, v.y],
            (data: number[]) => ({ x: data[0], y: data[1] }),
            {
                description: 'Vector2序列化器',
                supportedTypes: ['Vector2'],
                builtin: true
            }
        );
        
        // Vector3  
        this.register(
            'vector3',
            (v: any) => [v.x, v.y, v.z],
            (data: number[]) => ({ x: data[0], y: data[1], z: data[2] }),
            {
                description: 'Vector3序列化器',
                supportedTypes: ['Vector3'],
                builtin: true
            }
        );
        
        // Vector4
        this.register(
            'vector4', 
            (v: any) => [v.x, v.y, v.z, v.w],
            (data: number[]) => ({ x: data[0], y: data[1], z: data[2], w: data[3] }),
            {
                description: 'Vector4序列化器',
                supportedTypes: ['Vector4'],
                builtin: true
            }
        );
        
        // Quaternion
        this.register(
            'quaternion',
            (q: any) => [q.x, q.y, q.z, q.w],
            (data: number[]) => ({ x: data[0], y: data[1], z: data[2], w: data[3] }),
            {
                description: 'Quaternion序列化器',
                supportedTypes: ['Quaternion'],
                builtin: true
            }
        );
        
        // Matrix3 (3x3)
        this.register(
            'matrix3',
            (m: any) => m.elements || Array.from(m),
            (data: number[]) => ({ elements: data }),
            {
                description: 'Matrix3序列化器',
                supportedTypes: ['Matrix3'],
                builtin: true
            }
        );
        
        // Matrix4 (4x4)  
        this.register(
            'matrix4',
            (m: any) => m.elements || Array.from(m),
            (data: number[]) => ({ elements: data }),
            {
                description: 'Matrix4序列化器',
                supportedTypes: ['Matrix4'],
                builtin: true
            }
        );
        
        // Color (RGBA)
        this.register(
            'color',
            (c: any) => [c.r, c.g, c.b, c.a !== undefined ? c.a : 1.0],
            (data: number[]) => ({ r: data[0], g: data[1], b: data[2], a: data[3] }),
            {
                description: 'Color序列化器',
                supportedTypes: ['Color'],
                builtin: true
            }
        );
        
        // Transform (position + rotation + scale)
        this.register(
            'transform',
            (t: any) => ({
                position: [t.position.x, t.position.y, t.position.z],
                rotation: [t.rotation.x, t.rotation.y, t.rotation.z, t.rotation.w],
                scale: [t.scale.x, t.scale.y, t.scale.z]
            }),
            (data: any) => ({
                position: { x: data.position[0], y: data.position[1], z: data.position[2] },
                rotation: { x: data.rotation[0], y: data.rotation[1], z: data.rotation[2], w: data.rotation[3] },
                scale: { x: data.scale[0], y: data.scale[1], z: data.scale[2] }
            }),
            {
                description: 'Transform序列化器',
                supportedTypes: ['Transform'],
                builtin: true
            }
        );
        
        // 边界框
        this.register(
            'boundingbox',
            (b: any) => ({
                min: [b.min.x, b.min.y, b.min.z],
                max: [b.max.x, b.max.y, b.max.z]
            }),
            (data: any) => ({
                min: { x: data.min[0], y: data.min[1], z: data.min[2] },
                max: { x: data.max[0], y: data.max[1], z: data.max[2] }
            }),
            {
                description: 'BoundingBox序列化器',
                supportedTypes: ['BoundingBox', 'AABB'],
                builtin: true
            }
        );
        
        // 稀疏数组（只存储非零值）
        this.register(
            'sparse-array',
            (arr: number[]) => {
                const nonZero: { index: number; value: number }[] = [];
                arr.forEach((value, index) => {
                    if (value !== 0) {
                        nonZero.push({ index, value });
                    }
                });
                return { length: arr.length, nonZero };
            },
            (data: { length: number; nonZero: { index: number; value: number }[] }) => {
                const result = new Array(data.length).fill(0);
                data.nonZero.forEach(({ index, value }) => {
                    result[index] = value;
                });
                return result;
            },
            {
                description: '稀疏数组序列化器（压缩零值）',
                supportedTypes: ['number[]'],
                builtin: true
            }
        );
        
        // 位集合
        this.register(
            'bitset',
            (bitset: any) => {
                // 假设bitset有toArray()方法返回位数组
                const bits = bitset.toArray ? bitset.toArray() : Array.from(bitset);
                return { size: bitset.size || bits.length, bits };
            },
            (data: { size: number; bits: boolean[] }) => {
                // 这里需要根据实际的BitSet实现来构造
                return { size: data.size, bits: data.bits };
            },
            {
                description: 'BitSet序列化器',
                supportedTypes: ['BitSet'],
                builtin: true
            }
        );
        
        // 时间戳（毫秒转秒，减小精度要求）
        this.register(
            'timestamp',
            (timestamp: number) => Math.floor(timestamp / 1000), // 毫秒转秒
            (seconds: number) => seconds * 1000, // 秒转毫秒
            {
                description: '时间戳序列化器（秒精度）',
                supportedTypes: ['number'],
                builtin: true
            }
        );
        
        // UUID压缩（128位转16字节）
        this.register(
            'uuid',
            (uuid: string) => {
                // 移除连字符并转换为字节数组
                const hex = uuid.replace(/-/g, '');
                const bytes = new Uint8Array(16);
                for (let i = 0; i < 16; i++) {
                    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
                }
                return Array.from(bytes);
            },
            (bytes: number[]) => {
                // 字节数组转UUID字符串
                const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join('');
                return [
                    hex.slice(0, 8),
                    hex.slice(8, 12),
                    hex.slice(12, 16),
                    hex.slice(16, 20),
                    hex.slice(20, 32)
                ].join('-');
            },
            {
                description: 'UUID压缩序列化器',
                supportedTypes: ['string'],
                builtin: true
            }
        );
        
        this.logger.info(`已注册 ${this.serializers.size} 个内置序列化器`);
    }
    
    /**
     * 执行序列化
     */
    static serialize(serializerName: string, value: any): any {
        const serializer = this.get(serializerName);
        if (!serializer) {
            throw new Error(`未找到序列化器: ${serializerName}`);
        }
        
        try {
            return serializer.serialize(value);
        } catch (error) {
            throw new Error(`序列化失败 [${serializerName}]: ${error}`);
        }
    }
    
    /**
     * 执行反序列化
     */
    static deserialize(serializerName: string, data: any): any {
        const serializer = this.get(serializerName);
        if (!serializer) {
            throw new Error(`未找到序列化器: ${serializerName}`);
        }
        
        try {
            return serializer.deserialize(data);
        } catch (error) {
            throw new Error(`反序列化失败 [${serializerName}]: ${error}`);
        }
    }
    
    /**
     * 获取注册统计信息
     */
    static getStats(): { total: number; builtin: number; custom: number } {
        let builtin = 0;
        let custom = 0;
        
        for (const meta of this.metadata.values()) {
            if (meta.builtin) {
                builtin++;
            } else {
                custom++;
            }
        }
        
        return { total: this.serializers.size, builtin, custom };
    }
    
    /**
     * 清空所有自定义序列化器（保留内置）
     */
    static clearCustom(): void {
        const toRemove: string[] = [];
        
        for (const [name, meta] of this.metadata.entries()) {
            if (!meta.builtin) {
                toRemove.push(name);
            }
        }
        
        toRemove.forEach(name => {
            this.serializers.delete(name);
            this.metadata.delete(name);
        });
        
        this.logger.info(`清空了 ${toRemove.length} 个自定义序列化器`);
    }
    
    /**
     * 验证序列化器（测试序列化->反序列化往返）
     */
    static validate(serializerName: string, testValue: any): boolean {
        try {
            const serialized = this.serialize(serializerName, testValue);
            const deserialized = this.deserialize(serializerName, serialized);
            
            // 简单的深度比较（仅用于验证）
            return JSON.stringify(testValue) === JSON.stringify(deserialized);
        } catch (error) {
            this.logger.error(`序列化器验证失败 [${serializerName}]:`, error);
            return false;
        }
    }
}

// 自动注册内置序列化器
SerializerRegistry.registerBuiltins();