import { INetworkMessage, MessageData } from '../types/NetworkTypes';

/**
 * 网络消息基类
 * 
 * 所有网络消息都应该继承此类
 * 提供消息的序列化和反序列化功能
 */
export abstract class NetworkMessage<TData extends MessageData = MessageData> implements INetworkMessage<TData> {
    /**
     * 消息类型ID
     * 每个消息类型都应该有唯一的ID
     */
    public abstract readonly messageType: number;
    
    /**
     * 消息数据
     */
    public abstract readonly data: TData;
    
    /**
     * 消息时间戳
     */
    public timestamp: number = Date.now();
    
    /**
     * 发送者ID
     */
    public senderId?: string;
    
    /**
     * 消息序列号
     */
    public sequence?: number;
    
    /**
     * 序列化消息为二进制数据
     * 
     * @returns 序列化后的数据
     */
    public abstract serialize(): Uint8Array;
    
    /**
     * 从二进制数据反序列化消息
     * 
     * @param data - 二进制数据
     */
    public abstract deserialize(data: Uint8Array): void;
    
    /**
     * 创建消息实例
     */
    protected constructor(
        senderId?: string,
        sequence?: number
    ) {
        this.senderId = senderId;
        this.sequence = sequence;
    }
    
    /**
     * 获取消息大小（字节）
     * 
     * @returns 消息大小
     */
    public getSize(): number {
        return this.serialize().length;
    }
    
    /**
     * 创建消息副本
     * 
     * @returns 消息副本
     */
    public clone(): NetworkMessage<TData> {
        const Constructor = this.constructor as new (senderId?: string, sequence?: number) => NetworkMessage<TData>;
        const cloned = new Constructor(this.senderId, this.sequence);
        const data = this.serialize();
        cloned.deserialize(data);
        return cloned;
    }
}

/**
 * 原始二进制消息
 * 
 * 用于传输原始二进制数据，不进行额外的序列化处理
 */
export class RawMessage extends NetworkMessage<Uint8Array> {
    public readonly messageType: number = 0;
    private _data: Uint8Array;
    
    public get data(): Uint8Array {
        return this._data;
    }
    
    constructor(
        data: Uint8Array = new Uint8Array(0),
        senderId?: string, 
        sequence?: number
    ) {
        super(senderId, sequence);
        this._data = data;
    }
    
    public serialize(): Uint8Array {
        // 创建包含消息类型的完整消息格式：[4字节消息类型][原始数据]
        const buffer = new ArrayBuffer(4 + this._data.length);
        const view = new DataView(buffer);
        const uint8Array = new Uint8Array(buffer);
        
        // 写入消息类型
        view.setUint32(0, this.messageType, true);
        
        // 写入原始数据
        uint8Array.set(this._data, 4);
        
        return uint8Array;
    }
    
    public deserialize(data: Uint8Array): void {
        // 原始数据从第4字节开始（前4字节是消息类型）
        this._data = data.subarray(4);
    }
}

/**
 * JSON消息
 * 
 * 用于传输JSON数据，自动进行JSON序列化和反序列化
 */
export class JsonMessage<T = Record<string, unknown>> extends NetworkMessage<Record<string, unknown>> {
    public readonly messageType: number = 1;
    private _data: Record<string, unknown>;
    
    public get data(): Record<string, unknown> {
        return this._data;
    }
    
    constructor(
        payload: T = {} as T,
        senderId?: string,
        sequence?: number
    ) {
        super(senderId, sequence);
        this._data = { payload };
    }
    
    public get payload(): T {
        return this._data.payload as T;
    }
    
    public serialize(): Uint8Array {
        const payloadBytes = this.serializePayload(this._data.payload);
        const senderIdBytes = new TextEncoder().encode(this.senderId || '');
        
        const buffer = new ArrayBuffer(
            4 +  // messageType
            8 +  // timestamp
            4 +  // sequence
            4 +  // senderId length
            senderIdBytes.length + // senderId
            payloadBytes.length
        );
        
        const view = new DataView(buffer);
        const uint8Array = new Uint8Array(buffer);
        let offset = 0;
        
        view.setUint32(offset, this.messageType, true);
        offset += 4;
        
        view.setBigUint64(offset, BigInt(this.timestamp), true);
        offset += 8;
        
        view.setUint32(offset, this.sequence || 0, true);
        offset += 4;
        
        view.setUint32(offset, senderIdBytes.length, true);
        offset += 4;
        
        uint8Array.set(senderIdBytes, offset);
        offset += senderIdBytes.length;
        
        uint8Array.set(payloadBytes, offset);
        
        return uint8Array;
    }
    
    public deserialize(data: Uint8Array): void {
        const view = new DataView(data.buffer, data.byteOffset);
        let offset = 4; // 跳过messageType
        
        this.timestamp = Number(view.getBigUint64(offset, true));
        offset += 8;
        
        this.sequence = view.getUint32(offset, true);
        offset += 4;
        
        const senderIdLength = view.getUint32(offset, true);
        offset += 4;
        
        this.senderId = new TextDecoder().decode(data.subarray(offset, offset + senderIdLength));
        offset += senderIdLength;
        
        const payloadBytes = data.subarray(offset);
        this._data = { payload: this.deserializePayload(payloadBytes) };
    }
    
    /**
     * 序列化payload，子类可以重写以使用不同的序列化策略
     */
    protected serializePayload(payload: unknown): Uint8Array {
        const jsonString = JSON.stringify(payload);
        return new TextEncoder().encode(jsonString);
    }
    
    /**
     * 反序列化payload，子类可以重写以使用不同的反序列化策略
     */
    protected deserializePayload(data: Uint8Array): unknown {
        const jsonString = new TextDecoder().decode(data);
        return JSON.parse(jsonString);
    }
}

/**
 * Protobuf消息包装器
 * 
 * 用于包装已经序列化的Protobuf数据
 */
export class ProtobufMessage extends NetworkMessage<Uint8Array> {
    public readonly messageType: number = 2;
    private _componentType: string;
    private _data: Uint8Array;
    
    public get componentType(): string {
        return this._componentType;
    }
    
    public get data(): Uint8Array {
        return this._data;
    }
    
    constructor(
        componentType: string = '',
        data: Uint8Array = new Uint8Array(0),
        senderId?: string,
        sequence?: number
    ) {
        super(senderId, sequence);
        this._componentType = componentType;
        this._data = data;
    }
    
    public serialize(): Uint8Array {
        // 创建包含头部信息的消息格式：
        // [4字节消息类型][4字节时间戳][1字节组件类型长度][组件类型字符串][protobuf数据]
        const typeBytes = new TextEncoder().encode(this._componentType);
        const buffer = new ArrayBuffer(4 + 4 + 1 + typeBytes.length + this._data.length);
        const view = new DataView(buffer);
        const uint8Array = new Uint8Array(buffer);
        
        let offset = 0;
        
        // 写入消息类型（4字节）
        view.setUint32(offset, this.messageType, true);
        offset += 4;
        
        // 写入时间戳（4字节）
        view.setUint32(offset, this.timestamp, true);
        offset += 4;
        
        // 写入组件类型长度（1字节）
        view.setUint8(offset, typeBytes.length);
        offset += 1;
        
        // 写入组件类型字符串
        uint8Array.set(typeBytes, offset);
        offset += typeBytes.length;
        
        // 写入protobuf数据
        uint8Array.set(this._data, offset);
        
        return uint8Array;
    }
    
    public deserialize(data: Uint8Array): void {
        if (data.length < 9) { // 4+4+1 = 9字节最小长度
            throw new Error('Protobuf消息数据长度不足');
        }
        
        const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        let offset = 4; // 跳过前4字节消息类型
        
        // 读取时间戳（4字节）
        this.timestamp = view.getUint32(offset, true);
        offset += 4;
        
        // 读取组件类型长度（1字节）
        const typeLength = view.getUint8(offset);
        offset += 1;
        
        if (data.length < offset + typeLength) {
            throw new Error('Protobuf消息组件类型数据不足');
        }
        
        // 读取组件类型字符串
        const typeBytes = data.subarray(offset, offset + typeLength);
        this._componentType = new TextDecoder().decode(typeBytes);
        offset += typeLength;
        
        // 读取protobuf数据
        this._data = data.subarray(offset);
    }
}