import { Component } from '@esengine/ecs-framework';
import { INetworkSyncable } from './INetworkSyncable';
import { NetworkRole } from './NetworkRole';
import { NetworkEnvironment } from './Core/NetworkEnvironment';
import { createSyncVarProxy, isSyncVarProxied, destroySyncVarProxy } from './SyncVar/SyncVarProxy';
import { SyncVarManager } from './SyncVar/SyncVarManager';
import { getSyncVarMetadata } from './SyncVar/SyncVarDecorator';

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
 * 
 *     // 客户端特有逻辑
 *     public onClientUpdate(): void {
 *         if (__CLIENT__) {
 *             // 客户端构建时才包含此逻辑
 *             this.handleInputPrediction();
 *             this.interpolatePosition();
 *         }
 *     }
 * 
 *     // 服务端特有逻辑  
 *     public onServerUpdate(): void {
 *         if (__SERVER__) {
 *             // 服务端构建时才包含此逻辑
 *             this.validateMovement();
 *             this.broadcastToClients();
 *         }
 *     }
 * }
 * 
 * // 使用方式（角色由环境自动检测）
 * const position = new PositionComponent(10, 20);
 * // 角色由 NetworkManager.StartServer() 或 StartClient() 决定
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
     * 构造函数
     * 
     * 角色信息通过NetworkEnvironment自动获取，无需手动传入
     */
    constructor() {
        super();
        this.initializeSyncVar();
        this.ensureComponentRegistered();
    }
    
    /**
     * 确保当前组件类型已注册到ComponentRegistry
     */
    private ensureComponentRegistered(): void {
        try {
            const { ComponentRegistry } = require('@esengine/ecs-framework');
            
            // 检查当前组件类型是否已注册
            if (!ComponentRegistry.isRegistered(this.constructor)) {
                // 如果未注册，自动注册
                ComponentRegistry.register(this.constructor);
                console.log(`[NetworkComponent] 自动注册组件类型: ${this.constructor.name}`);
            }
        } catch (error) {
            console.warn(`[NetworkComponent] 无法注册组件类型 ${this.constructor.name}:`, error);
        }
    }
    
    /**
     * 初始化SyncVar系统
     * 
     * 如果组件有SyncVar字段，自动创建代理来监听变化
     */
    private initializeSyncVar(): void {
        const metadata = getSyncVarMetadata(this.constructor);
        if (metadata.length > 0) {
            console.log(`[NetworkComponent] ${this.constructor.name} 发现 ${metadata.length} 个SyncVar字段，将启用代理监听`);
        }
    }

    /**
     * 获取网络角色
     * 
     * 从全局网络环境获取当前角色
     * @returns 当前组件的网络角色
     */
    public getRole(): NetworkRole {
        return NetworkEnvironment.getPrimaryRole();
    }

    /**
     * 检查是否为客户端角色
     * 
     * @returns 是否为客户端
     */
    public isClient(): boolean {
        return NetworkEnvironment.isClient;
    }

    /**
     * 检查是否为服务端角色
     * 
     * @returns 是否为服务端
     */
    public isServer(): boolean {
        return NetworkEnvironment.isServer;
    }

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
    
    /**
     * 获取待同步的SyncVar变化
     * 
     * @returns 待同步的变化数组
     */
    public getSyncVarChanges(): any[] {
        const syncVarManager = SyncVarManager.Instance;
        return syncVarManager.getPendingChanges(this);
    }
    
    /**
     * 创建SyncVar同步数据
     * 
     * @returns 同步数据，如果没有变化则返回null
     */
    public createSyncVarData(): any {
        const syncVarManager = SyncVarManager.Instance;
        return syncVarManager.createSyncData(this);
    }
    
    /**
     * 应用SyncVar同步数据
     * 
     * @param syncData - 同步数据
     */
    public applySyncVarData(syncData: any): void {
        const syncVarManager = SyncVarManager.Instance;
        syncVarManager.applySyncData(this, syncData);
    }
    
    /**
     * 清除SyncVar变化记录
     * 
     * @param propertyKeys - 要清除的属性名数组，如果不提供则清除所有
     */
    public clearSyncVarChanges(propertyKeys?: string[]): void {
        const syncVarManager = SyncVarManager.Instance;
        syncVarManager.clearChanges(this, propertyKeys);
    }
    
    /**
     * 检查组件是否有SyncVar字段
     * 
     * @returns 是否有SyncVar字段
     */
    public hasSyncVars(): boolean {
        const metadata = getSyncVarMetadata(this.constructor);
        return metadata.length > 0;
    }
    
    /**
     * 获取SyncVar统计信息
     * 
     * @returns 统计信息
     */
    public getSyncVarStats(): any {
        const metadata = getSyncVarMetadata(this.constructor);
        const syncVarManager = SyncVarManager.Instance;
        const changes = syncVarManager.getPendingChanges(this);
        
        return {
            totalSyncVars: metadata.length,
            pendingChanges: changes.length,
            syncVarFields: metadata.map(m => ({
                propertyKey: m.propertyKey,
                fieldNumber: m.fieldNumber,
                hasHook: !!m.options.hook,
                authorityOnly: !!m.options.authorityOnly
            }))
        };
    }

    /**
     * 客户端更新逻辑
     * 
     * 子类可以重写此方法实现客户端特有的逻辑，如：
     * - 输入预测
     * - 状态插值
     * - 回滚重放
     */
    public onClientUpdate(): void {
        // 默认空实现，子类可根据需要重写
    }

    /**
     * 服务端更新逻辑
     * 
     * 子类可以重写此方法实现服务端特有的逻辑，如：
     * - 输入验证
     * - 权威状态计算
     * - 状态广播
     */
    public onServerUpdate(): void {
        // 默认空实现，子类可根据需要重写
    }

    /**
     * 统一的更新入口
     * 
     * 根据角色调用相应的更新方法
     */
    public override update(): void {
        if (this.isClient()) {
            this.onClientUpdate();
        } else if (this.isServer()) {
            this.onServerUpdate();
        }
    }
}