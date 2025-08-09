import { NetworkMessage, JsonMessage } from './NetworkMessage';
import { MessageType as CoreMessageType } from '../types/MessageTypes';
import { MESSAGE_CONFIG } from '../constants/NetworkConstants';

/**
 * 内置消息类型枚举
 */
export enum MessageType {
    // 基础消息类型 (0-99)
    RAW = 0,
    JSON = 1,
    PROTOBUF = 2,
    
    // 连接管理消息 (100-199)
    CONNECT_REQUEST = 100,
    CONNECT_RESPONSE = 101,
    DISCONNECT = 102,
    PING = 103,
    PONG = 104,
    
    // 身份验证消息 (200-299)
    AUTH_REQUEST = 200,
    AUTH_RESPONSE = 201,
    
    // 网络对象管理 (300-399)
    SPAWN_OBJECT = 300,
    DESTROY_OBJECT = 301,
    TRANSFER_AUTHORITY = 302,
    
    // 组件同步消息 (400-499)
    SYNC_VAR_UPDATE = 400,
    COMPONENT_STATE = 401,
    BATCH_UPDATE = 402,
    
    // RPC调用消息 (500-599)
    CLIENT_RPC = 500,
    SERVER_RPC = 501,
    RPC_RESPONSE = 502,
    
    // 场景管理消息 (600-699)
    SCENE_LOAD = 600,
    SCENE_LOADED = 601,
    SCENE_UNLOAD = 602,
    
    // 自定义消息 (1000+)
    CUSTOM = 1000
}

/**
 * 连接请求消息
 */
export class ConnectRequestMessage extends JsonMessage<{
    clientVersion: string;
    protocolVersion: number;
    clientId?: string;
}> {
    public override readonly messageType: number = MessageType.CONNECT_REQUEST;
    
    constructor(clientVersion: string = '1.0.0', protocolVersion: number = 1, clientId?: string) {
        super({
            clientVersion,
            protocolVersion,
            clientId
        });
    }
}

/**
 * 连接响应消息
 */
export class ConnectResponseMessage extends JsonMessage<{
    success: boolean;
    clientId: string;
    serverVersion: string;
    protocolVersion: number;
    errorMessage?: string;
}> {
    public override readonly messageType: number = MessageType.CONNECT_RESPONSE;
    
    constructor(
        success: boolean,
        clientId: string,
        serverVersion: string = '1.0.0',
        protocolVersion: number = 1,
        errorMessage?: string
    ) {
        super({
            success,
            clientId,
            serverVersion,
            protocolVersion,
            errorMessage
        });
    }
}

/**
 * 断开连接消息
 */
export class DisconnectMessage extends JsonMessage<{
    reason: string;
    code?: number;
}> {
    public override readonly messageType: number = MessageType.DISCONNECT;
    
    constructor(reason: string, code?: number) {
        super({
            reason,
            code
        });
    }
}

/**
 * 心跳消息
 */
export class PingMessage extends NetworkMessage<{ pingId: number }> {
    public readonly messageType: number = MessageType.PING;
    private _data: { pingId: number };
    
    public get data(): { pingId: number } {
        return this._data;
    }
    
    public get pingId(): number {
        return this._data.pingId;
    }
    
    public set pingId(value: number) {
        this._data.pingId = value;
    }
    
    constructor(pingId: number = Date.now()) {
        super();
        this._data = { pingId };
    }
    
    public serialize(): Uint8Array {
        const buffer = new ArrayBuffer(12); // 4字节时间戳 + 4字节pingId + 4字节消息类型
        const view = new DataView(buffer);
        
        view.setUint32(0, this.messageType, true);
        view.setUint32(4, this.timestamp, true);
        view.setUint32(8, this._data.pingId, true);
        
        return new Uint8Array(buffer);
    }
    
    public deserialize(data: Uint8Array): void {
        if (data.length < 12) {
            throw new Error('Ping消息数据长度不足');
        }
        
        const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        // messageType在第0-3字节已经被外部处理
        this.timestamp = view.getUint32(4, true);
        this._data.pingId = view.getUint32(8, true);
    }
}

/**
 * 心跳响应消息
 */
export class PongMessage extends NetworkMessage<{ pingId: number; serverTime: number }> {
    public readonly messageType: number = MessageType.PONG;
    private _data: { pingId: number; serverTime: number };
    
    public get data(): { pingId: number; serverTime: number } {
        return this._data;
    }
    
    public get pingId(): number {
        return this._data.pingId;
    }
    
    public set pingId(value: number) {
        this._data.pingId = value;
    }
    
    public get serverTime(): number {
        return this._data.serverTime;
    }
    
    public set serverTime(value: number) {
        this._data.serverTime = value;
    }
    
    constructor(pingId: number = 0, serverTime: number = Date.now()) {
        super();
        this._data = { pingId, serverTime };
    }
    
    public serialize(): Uint8Array {
        const buffer = new ArrayBuffer(16); // 4字节消息类型 + 4字节时间戳 + 4字节pingId + 4字节服务器时间
        const view = new DataView(buffer);
        
        view.setUint32(0, this.messageType, true);
        view.setUint32(4, this.timestamp, true);
        view.setUint32(8, this._data.pingId, true);
        view.setUint32(12, this._data.serverTime, true);
        
        return new Uint8Array(buffer);
    }
    
    public deserialize(data: Uint8Array): void {
        if (data.length < 16) {
            throw new Error('Pong消息数据长度不足');
        }
        
        const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        // messageType在第0-3字节已经被外部处理
        this.timestamp = view.getUint32(4, true);
        this._data.pingId = view.getUint32(8, true);
        this._data.serverTime = view.getUint32(12, true);
    }
}

/**
 * 网络对象生成消息
 */
export class SpawnObjectMessage extends JsonMessage<{
    networkId: string;
    prefabName: string;
    position: { x: number; y: number; z?: number };
    rotation?: { x: number; y: number; z: number; w: number };
    ownerId: string;
    hasAuthority: boolean;
    components?: Array<{
        type: string;
        data: string; // base64编码的protobuf数据
    }>;
}> {
    public override readonly messageType: number = MessageType.SPAWN_OBJECT;
    
    constructor(
        networkId: string,
        prefabName: string,
        position: { x: number; y: number; z?: number },
        ownerId: string,
        hasAuthority: boolean = false,
        rotation?: { x: number; y: number; z: number; w: number },
        components?: Array<{ type: string; data: string }>
    ) {
        super({
            networkId,
            prefabName,
            position,
            rotation,
            ownerId,
            hasAuthority,
            components
        });
    }
}

/**
 * 网络对象销毁消息
 */
export class DestroyObjectMessage extends JsonMessage<{
    networkId: string;
    reason?: string;
}> {
    public override readonly messageType: number = MessageType.DESTROY_OBJECT;
    
    constructor(networkId: string, reason?: string) {
        super({
            networkId,
            reason
        });
    }
}

/**
 * 权限转移消息
 */
export class TransferAuthorityMessage extends JsonMessage<{
    networkId: string;
    newOwnerId: string;
    previousOwnerId: string;
}> {
    public override readonly messageType: number = MessageType.TRANSFER_AUTHORITY;
    
    constructor(networkId: string, newOwnerId: string, previousOwnerId: string) {
        super({
            networkId,
            newOwnerId,
            previousOwnerId
        });
    }
}

/**
 * SyncVar字段更新数据
 */
export interface SyncVarFieldUpdate {
    /** 字段编号 */
    fieldNumber: number;
    /** 字段名称（用于调试） */
    propertyKey: string;
    /** 序列化后的新值 */
    newValue: string | number | boolean | null | undefined | Date | Uint8Array | Record<string, unknown> | unknown[];
    /** 序列化后的旧值（用于回滚或调试） */
    oldValue?: string | number | boolean | null | undefined | Date | Uint8Array | Record<string, unknown> | unknown[];
    /** 字段变化时间戳 */
    timestamp: number;
    /** 是否是权威字段（只有权威端可以修改） */
    authorityOnly?: boolean;
}

/**
 * SyncVar更新消息数据结构
 */
export interface SyncVarUpdateData extends Record<string, unknown> {
    /** 网络对象ID */
    networkId: string;
    /** 组件类型名称 */
    componentType: string;
    /** 字段更新列表 */
    fieldUpdates: SyncVarFieldUpdate[];
    /** 是否是完整状态同步（而非增量更新） */
    isFullSync: boolean;
    /** 发送者ID */
    senderId: string;
    /** 同步序号（用于确保顺序） */
    syncSequence: number;
}

/**
 * SyncVar更新消息
 * 
 * 支持增量同步和批处理
 */
export class SyncVarUpdateMessage extends JsonMessage<SyncVarUpdateData> {
    public override readonly messageType: number = MessageType.SYNC_VAR_UPDATE;
    
    /** 网络对象ID */
    public get networkId(): string {
        return this.payload.networkId;
    }
    
    public set networkId(value: string) {
        this.payload.networkId = value;
    }
    
    /** 组件类型名称 */
    public get componentType(): string {
        return this.payload.componentType;
    }
    
    public set componentType(value: string) {
        this.payload.componentType = value;
    }
    
    /** 字段更新列表 */
    public get fieldUpdates(): SyncVarFieldUpdate[] {
        return this.payload.fieldUpdates;
    }
    
    public set fieldUpdates(value: SyncVarFieldUpdate[]) {
        this.payload.fieldUpdates = value;
    }
    
    /** 是否是完整状态同步（而非增量更新） */
    public get isFullSync(): boolean {
        return this.payload.isFullSync;
    }
    
    public set isFullSync(value: boolean) {
        this.payload.isFullSync = value;
    }
    
    /** 同步序号（用于确保顺序） */
    public get syncSequence(): number {
        return this.payload.syncSequence;
    }
    
    public set syncSequence(value: number) {
        this.payload.syncSequence = value;
    }
    
    constructor(
        networkId: string = '',
        componentType: string = '',
        fieldUpdates: SyncVarFieldUpdate[] = [],
        isFullSync: boolean = false,
        senderId: string = '',
        syncSequence: number = 0
    ) {
        const data: SyncVarUpdateData = {
            networkId,
            componentType,
            fieldUpdates,
            isFullSync,
            senderId,
            syncSequence
        };
        super(data, senderId, syncSequence);
    }
    
    /**
     * 添加字段更新
     */
    public addFieldUpdate(update: SyncVarFieldUpdate): void {
        this.payload.fieldUpdates.push(update);
    }
    
    /**
     * 获取指定字段的更新
     */
    public getFieldUpdate(fieldNumber: number): SyncVarFieldUpdate | undefined {
        return this.payload.fieldUpdates.find(update => update.fieldNumber === fieldNumber);
    }
    
    /**
     * 移除指定字段的更新
     */
    public removeFieldUpdate(fieldNumber: number): boolean {
        const index = this.payload.fieldUpdates.findIndex(update => update.fieldNumber === fieldNumber);
        if (index !== -1) {
            this.payload.fieldUpdates.splice(index, 1);
            return true;
        }
        return false;
    }
    
    /**
     * 清空所有字段更新
     */
    public clearFieldUpdates(): void {
        this.payload.fieldUpdates = [];
    }
    
    /**
     * 获取更新的字段数量
     */
    public getUpdateCount(): number {
        return this.payload.fieldUpdates.length;
    }
    
    /**
     * 检查是否有字段更新
     */
    public hasUpdates(): boolean {
        return this.payload.fieldUpdates.length > 0;
    }
    
    
    
    /**
     * 创建消息副本
     */
    public override clone(): SyncVarUpdateMessage {
        return new SyncVarUpdateMessage(
            this.payload.networkId,
            this.payload.componentType,
            [...this.payload.fieldUpdates], // 深拷贝字段更新数组
            this.payload.isFullSync,
            this.payload.senderId,
            this.payload.syncSequence
        );
    }
    
    /**
     * 获取消息统计信息
     */
    public getStats(): {
        updateCount: number;
        estimatedSize: number;
        hasAuthorityOnlyFields: boolean;
        oldestUpdateTime: number;
        newestUpdateTime: number;
    } {
        if (this.payload.fieldUpdates.length === 0) {
            return {
                updateCount: 0,
                estimatedSize: this.getSize(),
                hasAuthorityOnlyFields: false,
                oldestUpdateTime: 0,
                newestUpdateTime: 0
            };
        }
        
        const timestamps = this.payload.fieldUpdates.map(u => u.timestamp);
        const hasAuthorityOnlyFields = this.payload.fieldUpdates.some(u => u.authorityOnly);
        
        return {
            updateCount: this.payload.fieldUpdates.length,
            estimatedSize: this.getSize(),
            hasAuthorityOnlyFields,
            oldestUpdateTime: Math.min(...timestamps),
            newestUpdateTime: Math.max(...timestamps)
        };
    }
}

/**
 * 批量更新消息
 * 
 * 用于一次性发送多个对象的状态更新
 */
export class BatchUpdateMessage extends JsonMessage<{
    updates: Array<{
        networkId: string;
        componentType: string;
        data: string; // base64编码的完整组件状态
    }>;
}> {
    public override readonly messageType: number = MessageType.BATCH_UPDATE;
    
    constructor(updates: Array<{ networkId: string; componentType: string; data: string }>) {
        super({ updates });
    }
}