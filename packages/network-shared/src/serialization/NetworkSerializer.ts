/**
 * 网络序列化器
 * 
 * 提供高效的网络消息序列化和反序列化
 */

import { INetworkSerializer, NetworkValue, SerializationSchema } from '../types/NetworkTypes';

/**
 * 序列化类型映射
 */
interface SerializationTypeMap {
  [typeName: string]: SerializationSchema<any>;
}

/**
 * 基础网络序列化器实现
 */
export class NetworkSerializer implements INetworkSerializer {
  private typeMap: SerializationTypeMap = {};

  constructor() {
    this.registerBuiltinTypes();
  }

  /**
   * 注册内置类型
   */
  private registerBuiltinTypes(): void {
    // 基础类型
    this.registerType<string>('string', {
      serialize: (str: string) => new TextEncoder().encode(str),
      deserialize: (data: Uint8Array) => new TextDecoder().decode(data),
      getSize: (str: string) => new TextEncoder().encode(str).length
    });

    this.registerType<number>('number', {
      serialize: (num: number) => {
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        view.setFloat64(0, num);
        return new Uint8Array(buffer);
      },
      deserialize: (data: Uint8Array) => {
        const view = new DataView(data.buffer);
        return view.getFloat64(0);
      },
      getSize: () => 8
    });

    this.registerType<boolean>('boolean', {
      serialize: (bool: boolean) => new Uint8Array([bool ? 1 : 0]),
      deserialize: (data: Uint8Array) => data[0] === 1,
      getSize: () => 1
    });

    this.registerType<number>('int32', {
      serialize: (num: number) => {
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        view.setInt32(0, num);
        return new Uint8Array(buffer);
      },
      deserialize: (data: Uint8Array) => {
        const view = new DataView(data.buffer);
        return view.getInt32(0);
      },
      getSize: () => 4
    });

    this.registerType<number>('uint32', {
      serialize: (num: number) => {
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        view.setUint32(0, num);
        return new Uint8Array(buffer);
      },
      deserialize: (data: Uint8Array) => {
        const view = new DataView(data.buffer);
        return view.getUint32(0);
      },
      getSize: () => 4
    });

    // Vector3 类型
    this.registerType<{x: number, y: number, z?: number}>('Vector3', {
      serialize: (vec: { x: number; y: number; z?: number }) => {
        const buffer = new ArrayBuffer(12);
        const view = new DataView(buffer);
        view.setFloat32(0, vec.x);
        view.setFloat32(4, vec.y);
        view.setFloat32(8, vec.z || 0);
        return new Uint8Array(buffer);
      },
      deserialize: (data: Uint8Array) => {
        const view = new DataView(data.buffer);
        return {
          x: view.getFloat32(0),
          y: view.getFloat32(4),
          z: view.getFloat32(8)
        };
      },
      getSize: () => 12
    });

    // JSON 类型（用于复杂对象）
    this.registerType('json', {
      serialize: (obj: any) => {
        const jsonStr = JSON.stringify(obj);
        return new TextEncoder().encode(jsonStr);
      },
      deserialize: (data: Uint8Array) => {
        const jsonStr = new TextDecoder().decode(data);
        return JSON.parse(jsonStr);
      },
      getSize: (obj: any) => {
        const jsonStr = JSON.stringify(obj);
        return new TextEncoder().encode(jsonStr).length;
      }
    });
  }

  /**
   * 注册序列化类型
   */
  public registerType<T = NetworkValue>(typeName: string, typeSchema: SerializationSchema<T>): void {
    if (typeof typeSchema.serialize !== 'function' || 
        typeof typeSchema.deserialize !== 'function') {
      throw new Error(`Invalid type schema for ${typeName}: must have serialize and deserialize methods`);
    }

    this.typeMap[typeName] = {
      serialize: typeSchema.serialize as any,
      deserialize: typeSchema.deserialize as any,
      getSize: typeSchema.getSize as any || ((obj: any) => this.serialize(obj, typeName).length)
    };
  }

  /**
   * 序列化对象
   */
  public serialize(obj: any, type?: string): Uint8Array {
    if (type && this.typeMap[type]) {
      return this.typeMap[type].serialize(obj);
    }

    // 自动类型检测
    const detectedType = this.detectType(obj);
    if (this.typeMap[detectedType]) {
      return this.typeMap[detectedType].serialize(obj);
    }

    // 默认使用 JSON 序列化
    const jsonHandler = this.typeMap['json'];
    if (jsonHandler?.serialize) {
      return jsonHandler.serialize(obj);
    }
    
    // 最终回退方案
    return new TextEncoder().encode(JSON.stringify(obj));
  }

  /**
   * 反序列化对象
   */
  public deserialize<T = any>(data: Uint8Array, type?: string): T {
    if (type && this.typeMap[type]) {
      return this.typeMap[type].deserialize(data);
    }

    // 如果没有指定类型，尝试使用 JSON 反序列化
    try {
      const jsonHandler = this.typeMap['json'];
      if (jsonHandler?.deserialize) {
        return jsonHandler.deserialize(data);
      }
      
      // 最终回退方案
      const jsonString = new TextDecoder().decode(data);
      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error(`Failed to deserialize data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取序列化后的大小
   */
  public getSerializedSize(obj: any, type?: string): number {
    if (type && this.typeMap[type]?.getSize) {
      return this.typeMap[type].getSize(obj);
    }

    const detectedType = this.detectType(obj);
    if (this.typeMap[detectedType]?.getSize) {
      return this.typeMap[detectedType].getSize(obj);
    }

    const jsonHandler = this.typeMap['json'];
    return jsonHandler?.getSize ? jsonHandler.getSize(obj) : JSON.stringify(obj).length;
  }

  /**
   * 自动检测对象类型
   */
  private detectType(obj: any): string {
    if (typeof obj === 'string') return 'string';
    if (typeof obj === 'number') return 'number';
    if (typeof obj === 'boolean') return 'boolean';
    
    if (obj && typeof obj === 'object') {
      // 检测 Vector3 类型
      if ('x' in obj && 'y' in obj && typeof obj.x === 'number' && typeof obj.y === 'number') {
        return 'Vector3';
      }
    }

    return 'json';
  }

  /**
   * 批量序列化多个值
   */
  public serializeBatch(values: Array<{ value: any; type?: string }>): Uint8Array {
    const serializedParts: Uint8Array[] = [];
    let totalSize = 0;

    // 序列化每个值
    for (const item of values) {
      const serialized = this.serialize(item.value, item.type);
      serializedParts.push(serialized);
      totalSize += serialized.length + 4; // +4 为长度信息
    }

    // 创建总缓冲区
    const result = new Uint8Array(totalSize + 4); // +4 为值的数量
    const view = new DataView(result.buffer);
    let offset = 0;

    // 写入值的数量
    view.setUint32(offset, values.length);
    offset += 4;

    // 写入每个序列化的值
    for (const serialized of serializedParts) {
      // 写入长度
      view.setUint32(offset, serialized.length);
      offset += 4;
      
      // 写入数据
      result.set(serialized, offset);
      offset += serialized.length;
    }

    return result;
  }

  /**
   * 批量反序列化
   */
  public deserializeBatch(data: Uint8Array, types?: string[]): any[] {
    const view = new DataView(data.buffer);
    let offset = 0;
    
    // 读取值的数量
    const count = view.getUint32(offset);
    offset += 4;

    const results: any[] = [];

    // 读取每个值
    for (let i = 0; i < count; i++) {
      // 读取长度
      const length = view.getUint32(offset);
      offset += 4;
      
      // 读取数据
      const valueData = data.slice(offset, offset + length);
      offset += length;
      
      // 反序列化
      const type = types?.[i];
      const value = this.deserialize(valueData, type);
      results.push(value);
    }

    return results;
  }

  /**
   * 压缩序列化数据
   */
  public compress(data: Uint8Array): Uint8Array {
    // 这里可以集成压缩算法，如 LZ4、gzip 等
    // 目前返回原数据
    return data;
  }

  /**
   * 解压缩数据
   */
  public decompress(data: Uint8Array): Uint8Array {
    // 这里可以集成解压缩算法
    // 目前返回原数据
    return data;
  }

  /**
   * 创建增量序列化数据
   */
  public serializeDelta(oldValue: any, newValue: any, type?: string): Uint8Array | null {
    // 基础实现：如果值相同则返回 null，否则序列化新值
    if (this.isEqual(oldValue, newValue)) {
      return null;
    }
    
    return this.serialize(newValue, type);
  }

  /**
   * 应用增量数据
   */
  public applyDelta(_baseValue: any, deltaData: Uint8Array, type?: string): any {
    // 基础实现：直接反序列化增量数据
    // baseValue 在更复杂的增量实现中会被使用
    return this.deserialize(deltaData, type);
  }

  /**
   * 检查两个值是否相等
   */
  private isEqual(a: any, b: any): boolean {
    if (a === b) return true;
    
    if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
      return JSON.stringify(a) === JSON.stringify(b);
    }
    
    return false;
  }

  /**
   * 获取已注册的类型列表
   */
  public getRegisteredTypes(): string[] {
    return Object.keys(this.typeMap);
  }

  /**
   * 检查类型是否已注册
   */
  public hasType(typeName: string): boolean {
    return typeName in this.typeMap;
  }
}