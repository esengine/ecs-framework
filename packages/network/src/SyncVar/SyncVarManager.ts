import { 
    SyncVarMetadata, 
    getSyncVarMetadata, 
    validateSyncVarMetadata,
    getSyncVarMetadataForProperty 
} from './SyncVarDecorator';
import { NetworkEnvironment } from '../Core/NetworkEnvironment';
import { SyncVarUpdateMessage, SyncVarFieldUpdate } from '../Messaging/MessageTypes';
import { 
    SyncVarValue, 
    INetworkSyncable,
    NetworkComponentType,
    TypeGuards
} from '../types/NetworkTypes';

/**
 * SyncVar变化记录
 */
export interface SyncVarChange {
    /**
     * 属性名
     */
    propertyKey: string;
    
    /**
     * 字段编号
     */
    fieldNumber: number;
    
    /**
     * 旧值
     */
    oldValue: SyncVarValue;
    
    /**
     * 新值
     */
    newValue: SyncVarValue;
    
    /**
     * 变化时间戳
     */
    timestamp: number;
    
    /**
     * 是否需要网络同步
     */
    needsSync: boolean;
}

/**
 * SyncVar同步数据
 */
export interface SyncVarSyncData {
    /**
     * 组件类名
     */
    componentType: string;
    
    /**
     * 网络对象ID（将来实现）
     */
    networkId?: string;
    
    /**
     * 字段更新数据
     */
    fieldUpdates: Array<{
        fieldNumber: number;
        data: Uint8Array;
    }>;
    
    /**
     * 时间戳
     */
    timestamp: number;
}

/**
 * SyncVar管理器
 * 
 * 负责管理组件的SyncVar变量，检测变化，处理序列化和同步
 */
export class SyncVarManager {
    private static _instance: SyncVarManager | null = null;
    
    /**
     * 组件实例的SyncVar变化监听器
     * Key: 组件实例的唯一ID
     * Value: 变化记录数组
     */
    private _componentChanges: Map<string, SyncVarChange[]> = new Map();
    
    /**
     * 组件实例的最后同步时间
     */
    private _lastSyncTimes: Map<string, Map<string, number>> = new Map();
    
    /**
     * 获取SyncVarManager单例
     */
    public static get Instance(): SyncVarManager {
        if (!SyncVarManager._instance) {
            SyncVarManager._instance = new SyncVarManager();
        }
        return SyncVarManager._instance;
    }
    
    private constructor() {}
    
    /**
     * 初始化组件的SyncVar系统
     * 
     * @param component - 网络组件实例
     * @returns 是否成功初始化
     */
    public initializeComponent(component: INetworkSyncable): boolean {
        const componentId = this.getComponentId(component);
        const metadata = getSyncVarMetadata(component.constructor as NetworkComponentType);
        
        if (metadata.length === 0) {
            // 没有SyncVar，无需初始化
            return false;
        }
        
        // 验证所有SyncVar配置
        const validationErrors: string[] = [];
        for (const meta of metadata) {
            const validation = validateSyncVarMetadata(component, meta);
            if (!validation.isValid) {
                validationErrors.push(...validation.errors);
            }
        }
        
        if (validationErrors.length > 0) {
            console.error(`[SyncVarManager] 组件 ${component.constructor.name} 的SyncVar配置错误:`, validationErrors);
            return false;
        }
        
        // 初始化变化记录
        this._componentChanges.set(componentId, []);
        this._lastSyncTimes.set(componentId, new Map());
        
        console.log(`[SyncVarManager] 初始化组件 ${component.constructor.name} 的SyncVar系统，共 ${metadata.length} 个同步变量`);
        return true;
    }
    
    /**
     * 清理组件的SyncVar系统
     * 
     * @param component - 网络组件实例
     */
    public cleanupComponent(component: INetworkSyncable): void {
        const componentId = this.getComponentId(component);
        this._componentChanges.delete(componentId);
        this._lastSyncTimes.delete(componentId);
    }
    
    /**
     * 记录SyncVar字段的变化
     * 
     * @param component - 组件实例
     * @param propertyKey - 属性名
     * @param oldValue - 旧值
     * @param newValue - 新值
     */
    public recordChange(
        component: INetworkSyncable, 
        propertyKey: string, 
        oldValue: SyncVarValue, 
        newValue: SyncVarValue
    ): void {
        const componentId = this.getComponentId(component);
        const metadata = getSyncVarMetadataForProperty(component, propertyKey);
        
        if (!metadata) {
            console.warn(`[SyncVarManager] 属性 ${propertyKey} 不是SyncVar`);
            return;
        }
        
        // 检查值是否真的发生了变化
        if (!TypeGuards.isSyncVarValue(oldValue) || !TypeGuards.isSyncVarValue(newValue)) {
            console.warn(`[SyncVarManager] 无效的SyncVar值类型: ${typeof oldValue}, ${typeof newValue}`);
            return;
        }
        
        if (this.isValueEqual(oldValue, newValue)) {
            return;
        }
        
        // 检查频率限制
        const now = Date.now();
        const lastSyncTimes = this._lastSyncTimes.get(componentId);
        const lastSyncTime = lastSyncTimes?.get(propertyKey) || 0;
        
        if (metadata.options.throttleMs && metadata.options.throttleMs > 0) {
            if (now - lastSyncTime < metadata.options.throttleMs) {
                console.log(`[SyncVarManager] 属性 ${propertyKey} 变化过于频繁，跳过同步`);
                return;
            }
        }
        
        // 检查权限
        if (metadata.options.authorityOnly && !this.hasAuthority(component)) {
            console.warn(`[SyncVarManager] 属性 ${propertyKey} 需要权限才能修改，但当前没有权限`);
            return;
        }
        
        // 记录变化
        const change: SyncVarChange = {
            propertyKey,
            fieldNumber: metadata.fieldNumber,
            oldValue,
            newValue,
            timestamp: now,
            needsSync: this.shouldSync(component, metadata)
        };
        
        let changes = this._componentChanges.get(componentId);
        if (!changes) {
            changes = [];
            this._componentChanges.set(componentId, changes);
        }
        
        changes.push(change);
        
        // 更新最后同步时间
        if (lastSyncTimes) {
            lastSyncTimes.set(propertyKey, now);
        }
        
        console.log(`[SyncVarManager] 记录变化: ${component.constructor.name}.${propertyKey} = ${newValue} (was ${oldValue})`);
        
        // 触发hook回调
        this.triggerHook(component, metadata, oldValue, newValue);
    }
    
    /**
     * 获取组件的待同步变化
     * 
     * @param component - 组件实例
     * @returns 待同步的变化数组
     */
    public getPendingChanges(component: any): SyncVarChange[] {
        const componentId = this.getComponentId(component);
        const changes = this._componentChanges.get(componentId) || [];
        return changes.filter(change => change.needsSync);
    }
    
    /**
     * 清除组件的变化记录
     * 
     * @param component - 组件实例
     * @param propertyKeys - 要清除的属性名数组，如果不提供则清除所有
     */
    public clearChanges(component: any, propertyKeys?: string[]): void {
        const componentId = this.getComponentId(component);
        const changes = this._componentChanges.get(componentId);
        
        if (!changes) {
            return;
        }
        
        if (propertyKeys) {
            // 清除指定属性的变化
            const filteredChanges = changes.filter(change => !propertyKeys.includes(change.propertyKey));
            this._componentChanges.set(componentId, filteredChanges);
        } else {
            // 清除所有变化
            this._componentChanges.set(componentId, []);
        }
    }
    
    /**
     * 创建同步数据
     * 
     * @param component - 组件实例
     * @returns 同步数据
     */
    public createSyncData(component: any): SyncVarSyncData | null {
        const pendingChanges = this.getPendingChanges(component);
        
        if (pendingChanges.length === 0) {
            return null;
        }
        
        const fieldUpdates: Array<{ fieldNumber: number; data: Uint8Array }> = [];
        
        for (const change of pendingChanges) {
            try {
                const serializedData = this.serializeValue(component, change.propertyKey, change.newValue);
                fieldUpdates.push({
                    fieldNumber: change.fieldNumber,
                    data: serializedData
                });
            } catch (error) {
                console.error(`[SyncVarManager] 序列化失败 ${change.propertyKey}:`, error);
            }
        }
        
        if (fieldUpdates.length === 0) {
            return null;
        }
        
        return {
            componentType: component.constructor.name,
            fieldUpdates,
            timestamp: Date.now()
        };
    }
    
    /**
     * 应用同步数据
     * 
     * @param component - 组件实例
     * @param syncData - 同步数据
     */
    public applySyncData(component: any, syncData: SyncVarSyncData): void {
        const metadata = getSyncVarMetadata(component.constructor);
        const metadataMap = new Map(metadata.map(m => [m.fieldNumber, m]));
        
        for (const update of syncData.fieldUpdates) {
            const meta = metadataMap.get(update.fieldNumber);
            if (!meta) {
                console.warn(`[SyncVarManager] 未找到字段编号 ${update.fieldNumber} 的元数据`);
                continue;
            }
            
            try {
                const newValue = this.deserializeValue(component, meta.propertyKey, update.data);
                const oldValue = component[meta.propertyKey];
                
                // 直接设置值，不通过代理（避免循环触发）
                this.setValueDirectly(component, meta.propertyKey, newValue);
                
                // 触发hook回调
                this.triggerHook(component, meta, oldValue, newValue);
                
                console.log(`[SyncVarManager] 应用同步: ${component.constructor.name}.${meta.propertyKey} = ${newValue}`);
            } catch (error) {
                console.error(`[SyncVarManager] 反序列化失败 ${meta.propertyKey}:`, error);
            }
        }
    }
    
    /**
     * 生成组件的唯一ID
     * 
     * @param component - 组件实例
     * @returns 唯一ID
     */
    private getComponentId(component: any): string {
        // 简单实现，将来可以集成网络ID系统
        if (!component._syncVarId) {
            component._syncVarId = `${component.constructor.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        return component._syncVarId;
    }
    
    /**
     * 检查两个值是否相等
     * 
     * @param a - 值A
     * @param b - 值B
     * @returns 是否相等
     */
    private isValueEqual(a: any, b: any): boolean {
        // 基础类型比较
        if (typeof a !== typeof b) {
            return false;
        }
        
        if (a === b) {
            return true;
        }
        
        // 对象比较（浅比较）
        if (typeof a === 'object' && a !== null && b !== null) {
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);
            
            if (keysA.length !== keysB.length) {
                return false;
            }
            
            return keysA.every(key => a[key] === b[key]);
        }
        
        return false;
    }
    
    /**
     * 检查组件是否有修改权限
     * 
     * @param component - 组件实例
     * @returns 是否有权限
     */
    private hasAuthority(component: any): boolean {
        // 简单实现：服务端始终有权限
        if (NetworkEnvironment.isServer) {
            return true;
        }
        
        // 客户端检查组件的权限设置
        // 如果组件有hasAuthority方法，使用它；否则默认客户端没有权限
        if (typeof component.hasAuthority === 'function') {
            return component.hasAuthority();
        }
        
        // 默认情况下，客户端对权威字段没有权限
        return false;
    }
    
    /**
     * 检查是否应该同步
     * 
     * @param component - 组件实例
     * @param metadata - SyncVar元数据
     * @returns 是否应该同步
     */
    private shouldSync(component: any, metadata: SyncVarMetadata): boolean {
        // 权限检查：权威字段只有在有权限时才同步
        if (metadata.options.authorityOnly && !this.hasAuthority(component)) {
            console.log(`[SyncVarManager] 字段 ${metadata.propertyKey} 是权威字段，但当前没有权限，跳过同步`);
            return false;
        }
        
        // 环境检查：服务端可以同步所有字段
        if (NetworkEnvironment.isServer) {
            return true;
        }
        
        // 客户端：非权威字段可以同步，权威字段需要检查权限
        if (metadata.options.authorityOnly) {
            return this.hasAuthority(component);
        }
        
        // 普通字段客户端也可以同步
        return true;
    }
    
    /**
     * 触发hook回调
     * 
     * @param component - 组件实例
     * @param metadata - SyncVar元数据
     * @param oldValue - 旧值
     * @param newValue - 新值
     */
    private triggerHook(component: any, metadata: SyncVarMetadata, oldValue: any, newValue: any): void {
        if (!metadata.options.hook) {
            return;
        }
        
        const hookFunction = component[metadata.options.hook];
        if (typeof hookFunction === 'function') {
            try {
                hookFunction.call(component, oldValue, newValue);
            } catch (error) {
                console.error(`[SyncVarManager] Hook函数执行失败 ${metadata.options.hook}:`, error);
            }
        }
    }
    
    /**
     * 序列化值
     * 
     * @param component - 组件实例
     * @param propertyKey - 属性名
     * @param value - 值
     * @returns 序列化数据
     */
    private serializeValue(component: any, propertyKey: string, value: any): Uint8Array {
        const metadata = getSyncVarMetadataForProperty(component, propertyKey);
        
        if (metadata?.options.serializer) {
            return metadata.options.serializer(value);
        }
        
        return this.serializeValueToBinary(value);
    }
    
    /**
     * 反序列化值
     * 
     * @param component - 组件实例
     * @param propertyKey - 属性名
     * @param data - 序列化数据
     * @returns 反序列化的值
     */
    private deserializeValue(component: any, propertyKey: string, data: Uint8Array): any {
        const metadata = getSyncVarMetadataForProperty(component, propertyKey);
        
        if (metadata?.options.deserializer) {
            return metadata.options.deserializer(data);
        }
        
        return this.deserializeValueFromBinary(data);
    }
    
    /**
     * 将值序列化为二进制数据
     */
    private serializeValueToBinary(value: any): Uint8Array {
        if (value === null || value === undefined) {
            return new Uint8Array([0]);
        }
        
        if (typeof value === 'boolean') {
            return new Uint8Array([1, value ? 1 : 0]);
        }
        
        if (typeof value === 'number') {
            const buffer = new ArrayBuffer(9);
            const view = new DataView(buffer);
            view.setUint8(0, 2);
            view.setFloat64(1, value, true);
            return new Uint8Array(buffer);
        }
        
        if (typeof value === 'string') {
            const encoded = new TextEncoder().encode(value);
            const buffer = new Uint8Array(5 + encoded.length);
            const view = new DataView(buffer.buffer);
            view.setUint8(0, 3);
            view.setUint32(1, encoded.length, true);
            buffer.set(encoded, 5);
            return buffer;
        }
        
        const jsonString = JSON.stringify(value);
        const encoded = new TextEncoder().encode(jsonString);
        const buffer = new Uint8Array(5 + encoded.length);
        const view = new DataView(buffer.buffer);
        view.setUint8(0, 4);
        view.setUint32(1, encoded.length, true);
        buffer.set(encoded, 5);
        return buffer;
    }
    
    /**
     * 从二进制数据反序列化值
     */
    private deserializeValueFromBinary(data: Uint8Array): any {
        if (data.length === 0) return null;
        
        const view = new DataView(data.buffer, data.byteOffset);
        const type = view.getUint8(0);
        
        switch (type) {
            case 0: return null;
            case 1: return view.getUint8(1) === 1;
            case 2: return view.getFloat64(1, true);
            case 3: {
                const length = view.getUint32(1, true);
                return new TextDecoder().decode(data.subarray(5, 5 + length));
            }
            case 4: {
                const length = view.getUint32(1, true);
                const jsonString = new TextDecoder().decode(data.subarray(5, 5 + length));
                return JSON.parse(jsonString);
            }
            default:
                throw new Error(`未知的序列化类型: ${type}`);
        }
    }
    
    /**
     * 直接设置值（绕过代理）
     * 
     * @param component - 组件实例
     * @param propertyKey - 属性名
     * @param value - 值
     */
    private setValueDirectly(component: any, propertyKey: string, value: any): void {
        // 临时禁用代理监听
        const originalValue = component._syncVarDisabled;
        component._syncVarDisabled = true;
        
        try {
            component[propertyKey] = value;
        } finally {
            component._syncVarDisabled = originalValue;
        }
    }
    
    /**
     * 创建SyncVar更新消息
     * 
     * @param component - 组件实例
     * @param networkId - 网络对象ID
     * @param senderId - 发送者ID
     * @param syncSequence - 同步序号
     * @param isFullSync - 是否是完整同步
     * @returns SyncVar更新消息，如果没有待同步的变化则返回null
     */
    public createSyncVarUpdateMessage(
        component: any, 
        networkId: string = '', 
        senderId: string = '',
        syncSequence: number = 0,
        isFullSync: boolean = false
    ): SyncVarUpdateMessage | null {
        const pendingChanges = this.getPendingChanges(component);
        
        if (pendingChanges.length === 0) {
            return null;
        }
        
        // 转换变化记录为消息格式
        const fieldUpdates: SyncVarFieldUpdate[] = [];
        
        for (const change of pendingChanges) {
            const metadata = getSyncVarMetadataForProperty(component, change.propertyKey);
            if (!metadata) {
                continue;
            }
            
            const fieldUpdate: SyncVarFieldUpdate = {
                fieldNumber: change.fieldNumber,
                propertyKey: change.propertyKey,
                newValue: change.newValue as any,
                oldValue: change.oldValue as any,
                timestamp: change.timestamp,
                authorityOnly: metadata.options.authorityOnly
            };
            
            fieldUpdates.push(fieldUpdate);
        }
        
        if (fieldUpdates.length === 0) {
            return null;
        }
        
        const message = new SyncVarUpdateMessage(
            networkId,
            component.constructor.name,
            fieldUpdates,
            isFullSync,
            senderId,
            syncSequence
        );
        
        console.log(`[SyncVarManager] 创建SyncVar更新消息: ${component.constructor.name}, ${fieldUpdates.length} 个字段`);
        return message;
    }
    
    /**
     * 应用SyncVar更新消息
     * 
     * @param component - 组件实例
     * @param message - SyncVar更新消息
     */
    public applySyncVarUpdateMessage(component: any, message: SyncVarUpdateMessage): void {
        if (message.componentType !== component.constructor.name) {
            console.warn(`[SyncVarManager] 组件类型不匹配: 期望 ${component.constructor.name}, 收到 ${message.componentType}`);
            return;
        }
        
        const metadata = getSyncVarMetadata(component.constructor);
        const metadataMap = new Map(metadata.map(m => [m.fieldNumber, m]));
        
        for (const fieldUpdate of message.fieldUpdates) {
            const meta = metadataMap.get(fieldUpdate.fieldNumber);
            if (!meta) {
                console.warn(`[SyncVarManager] 未找到字段编号 ${fieldUpdate.fieldNumber} 的元数据`);
                continue;
            }
            
            // 权限检查：权威字段在客户端通常应该接受来自服务端的更新
            // 只有当客户端试图应用自己产生的权威字段更新时才拒绝
            if (fieldUpdate.authorityOnly && NetworkEnvironment.isClient && !this.hasAuthority(component)) {
                // 如果这是来自服务端的更新，则允许应用
                // 这里简单实现：客户端接受所有权威字段的更新
                console.log(`[SyncVarManager] 客户端接受权威字段更新: ${fieldUpdate.propertyKey}`);
            }
            
            try {
                const oldValue = component[meta.propertyKey];
                
                // 直接设置值，不通过代理（避免循环触发）
                this.setValueDirectly(component, meta.propertyKey, fieldUpdate.newValue);
                
                // 触发hook回调
                this.triggerHook(component, meta, oldValue, fieldUpdate.newValue);
                
                console.log(`[SyncVarManager] 应用SyncVar消息更新: ${component.constructor.name}.${meta.propertyKey} = ${fieldUpdate.newValue}`);
            } catch (error) {
                console.error(`[SyncVarManager] 应用SyncVar更新失败 ${meta.propertyKey}:`, error);
            }
        }
        
        // 清除对应的变化记录（已经同步完成）
        this.clearChanges(component, message.fieldUpdates.map(u => u.propertyKey));
    }
    
    /**
     * 批量创建多个组件的SyncVar更新消息
     * 
     * @param components - 组件实例数组
     * @param networkIds - 对应的网络对象ID数组  
     * @param senderId - 发送者ID
     * @param syncSequence - 同步序号
     * @returns SyncVar更新消息数组
     */
    public createBatchSyncVarUpdateMessages(
        components: any[], 
        networkIds: string[] = [],
        senderId: string = '',
        syncSequence: number = 0
    ): SyncVarUpdateMessage[] {
        const messages: SyncVarUpdateMessage[] = [];
        
        for (let i = 0; i < components.length; i++) {
            const component = components[i];
            const networkId = networkIds[i] || '';
            
            const message = this.createSyncVarUpdateMessage(
                component, 
                networkId, 
                senderId, 
                syncSequence + i
            );
            
            if (message) {
                messages.push(message);
            }
        }
        
        return messages;
    }
    
    /**
     * 过滤需要同步的组件
     * 
     * @param components - 组件数组
     * @returns 有待同步变化的组件数组
     */
    public filterComponentsWithChanges(components: any[]): any[] {
        return components.filter(component => {
            const pendingChanges = this.getPendingChanges(component);
            return pendingChanges.length > 0;
        });
    }
    
    /**
     * 获取组件的变化统计
     * 
     * @param component - 组件实例
     * @returns 变化统计信息
     */
    public getComponentChangeStats(component: any): {
        totalChanges: number;
        pendingChanges: number;
        lastChangeTime: number;
        fieldChangeCounts: Map<string, number>;
        hasAuthorityOnlyChanges: boolean;
    } {
        const componentId = this.getComponentId(component);
        const changes = this._componentChanges.get(componentId) || [];
        const pendingChanges = changes.filter(c => c.needsSync);
        
        const fieldChangeCounts = new Map<string, number>();
        let lastChangeTime = 0;
        let hasAuthorityOnlyChanges = false;
        
        for (const change of changes) {
            const count = fieldChangeCounts.get(change.propertyKey) || 0;
            fieldChangeCounts.set(change.propertyKey, count + 1);
            lastChangeTime = Math.max(lastChangeTime, change.timestamp);
            
            if (!hasAuthorityOnlyChanges) {
                const metadata = getSyncVarMetadataForProperty(component, change.propertyKey);
                if (metadata?.options.authorityOnly) {
                    hasAuthorityOnlyChanges = true;
                }
            }
        }
        
        return {
            totalChanges: changes.length,
            pendingChanges: pendingChanges.length,
            lastChangeTime,
            fieldChangeCounts,
            hasAuthorityOnlyChanges
        };
    }
    
    /**
     * 获取管理器统计信息
     * 
     * @returns 统计信息
     */
    public getStats(): {
        totalComponents: number;
        totalChanges: number;
        pendingChanges: number;
        components: Array<{
            id: string;
            changes: number;
            pending: number;
        }>;
    } {
        let totalChanges = 0;
        let pendingChanges = 0;
        const components: Array<{ id: string; changes: number; pending: number }> = [];
        
        for (const [componentId, changes] of this._componentChanges) {
            const pendingCount = changes.filter(c => c.needsSync).length;
            totalChanges += changes.length;
            pendingChanges += pendingCount;
            
            components.push({
                id: componentId,
                changes: changes.length,
                pending: pendingCount
            });
        }
        
        return {
            totalComponents: this._componentChanges.size,
            totalChanges,
            pendingChanges,
            components
        };
    }
}