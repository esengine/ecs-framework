import { Component } from '@esengine/ecs-framework';
import { INetworkSyncable } from './INetworkSyncable';

/**
 * 网络组件基类
 * 
 * 继承核心ECS的Component类，添加网络同步功能。
 * 用于需要网络同步的组件，提供帧同步框架所需的网络状态管理。
 * 
 * @example
 * ```typescript
 * import { NetworkComponent } from '@esengine/ecs-framework-network';
 * import { ProtoSerializable, ProtoFloat } from '@esengine/ecs-framework-network';
 * 
 * @ProtoSerializable('Position')
 * class PositionComponent extends NetworkComponent {
 *     @ProtoFloat(1)
 *     public x: number = 0;
 *     
 *     @ProtoFloat(2)
 *     public y: number = 0;
 *     
 *     constructor(x: number = 0, y: number = 0) {
 *         super();
 *         this.x = x;
 *         this.y = y;
 *     }
 * }
 * ```
 */
export abstract class NetworkComponent extends Component implements INetworkSyncable {
    /**
     * 脏字段标记集合
     * 
     * 记录已修改但尚未同步的字段编号
     */
    private _dirtyFields: Set<number> = new Set();
    
    /**
     * 字段变化时间戳
     * 
     * 记录每个字段最后修改的时间
     */
    private _fieldTimestamps: Map<number, number> = new Map();

    /**
     * 获取网络同步状态
     * 
     * 序列化当前组件状态为网络传输格式
     * @returns 序列化的网络状态数据
     */
    public getNetworkState(): Uint8Array {
        const { isProtoSerializable } = require('./Serialization/ProtobufDecorators');
        const { ProtobufSerializer } = require('./Serialization/ProtobufSerializer');
        
        if (!isProtoSerializable(this)) {
            throw new Error(`组件 ${this.constructor.name} 不支持网络同步，请添加@ProtoSerializable装饰器`);
        }
        
        try {
            const serializer = ProtobufSerializer.getInstance();
            const serializedData = serializer.serialize(this);
            return serializedData.data;
        } catch (error) {
            throw new Error(`获取网络状态失败: ${error}`);
        }
    }
    
    /**
     * 应用网络状态
     * 
     * 从网络数据恢复组件状态
     * @param data - 网络状态数据
     */
    public applyNetworkState(data: Uint8Array): void {
        const { isProtoSerializable } = require('./Serialization/ProtobufDecorators');
        const { ProtobufSerializer } = require('./Serialization/ProtobufSerializer');
        
        if (!isProtoSerializable(this)) {
            throw new Error(`组件 ${this.constructor.name} 不支持网络同步，请添加@ProtoSerializable装饰器`);
        }
        
        try {
            const serializer = ProtobufSerializer.getInstance();
            const serializedData = {
                type: 'protobuf' as const,
                componentType: this.constructor.name,
                data: data,
                size: data.length
            };
            serializer.deserialize(this, serializedData);
            
            // 应用后清理脏字段标记
            this.markClean();
        } catch (error) {
            throw new Error(`应用网络状态失败: ${error}`);
        }
    }
    
    /**
     * 获取变化的字段编号列表
     * 
     * @returns 变化字段的编号数组
     */
    public getDirtyFields(): number[] {
        return Array.from(this._dirtyFields);
    }
    
    /**
     * 标记所有字段为干净状态
     * 
     * 清除所有脏字段标记
     */
    public markClean(): void {
        this._dirtyFields.clear();
    }
    
    /**
     * 标记字段为脏状态
     * 
     * 用于标记字段已修改，需要网络同步
     * @param fieldNumber - 字段编号
     */
    public markFieldDirty(fieldNumber: number): void {
        this._dirtyFields.add(fieldNumber);
        this._fieldTimestamps.set(fieldNumber, Date.now());
    }
    
    /**
     * 检查字段是否为脏状态
     * 
     * @param fieldNumber - 字段编号
     * @returns 是否为脏状态
     */
    public isFieldDirty(fieldNumber: number): boolean {
        return this._dirtyFields.has(fieldNumber);
    }
    
    /**
     * 获取字段最后修改时间
     * 
     * @param fieldNumber - 字段编号
     * @returns 最后修改时间戳，如果字段从未修改则返回0
     */
    public getFieldTimestamp(fieldNumber: number): number {
        return this._fieldTimestamps.get(fieldNumber) || 0;
    }
    
    /**
     * 获取所有脏字段及其时间戳
     * 
     * @returns 脏字段和时间戳的映射
     */
    public getDirtyFieldsWithTimestamps(): Map<number, number> {
        const result = new Map<number, number>();
        for (const fieldNumber of this._dirtyFields) {
            result.set(fieldNumber, this._fieldTimestamps.get(fieldNumber) || 0);
        }
        return result;
    }
}