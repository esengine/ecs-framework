import { Component } from '@esengine/ecs-framework';
import { v4 as uuidv4 } from 'uuid';

/**
 * 网络对象身份组件
 * 
 * 为ECS实体提供网络身份标识，支持网络对象的唯一识别和管理
 * 每个需要网络同步的实体都必须拥有此组件
 */
export class NetworkIdentity extends Component {
    /**
     * 网络对象唯一ID
     */
    public readonly networkId: string;
    
    /**
     * 是否为服务端权威对象
     */
    public hasAuthority: boolean = false;
    
    /**
     * 对象拥有者的连接ID（客户端ID）
     */
    public ownerId: string = '';
    
    /**
     * 网络对象是否处于激活状态
     */
    public isNetworkActive: boolean = false;
    
    /**
     * 对象创建时间
     */
    public readonly createdAt: number;
    
    /**
     * 最后同步时间
     */
    public lastSyncTime: number = 0;
    
    /**
     * 同步序列号（用于确保消息顺序）
     */
    public syncSequence: number = 0;
    
    /**
     * 网络对象场景标识（用于场景管理）
     */
    public sceneId: string = '';
    
    /**
     * 是否为预制体实例
     */
    public isPrefabInstance: boolean = false;
    
    /**
     * 预制体名称（如果是预制体实例）
     */
    public prefabName: string = '';
    
    /**
     * 构造函数
     * 
     * @param networkId - 指定网络ID，如果不提供则自动生成
     * @param hasAuthority - 是否有权威，默认false
     */
    constructor(networkId?: string, hasAuthority: boolean = false) {
        super();
        this.networkId = networkId || uuidv4();
        this.hasAuthority = hasAuthority;
        this.createdAt = Date.now();
        this.lastSyncTime = this.createdAt;
        
        // 自动注册到NetworkIdentityRegistry
        NetworkIdentityRegistry.Instance.register(this);
        
        console.log(`[NetworkIdentity] 创建网络对象: ${this.networkId}, 权威: ${hasAuthority}`);
    }
    
    /**
     * 设置对象拥有者
     * 
     * @param ownerId - 拥有者连接ID
     */
    public setOwner(ownerId: string): void {
        const oldOwnerId = this.ownerId;
        this.ownerId = ownerId;
        
        console.log(`[NetworkIdentity] 对象 ${this.networkId} 拥有者变更: ${oldOwnerId} -> ${ownerId}`);
    }
    
    /**
     * 设置权威状态
     * 
     * @param hasAuthority - 是否有权威
     */
    public setAuthority(hasAuthority: boolean): void {
        if (this.hasAuthority !== hasAuthority) {
            this.hasAuthority = hasAuthority;
            console.log(`[NetworkIdentity] 对象 ${this.networkId} 权威状态变更: ${hasAuthority}`);
        }
    }
    
    /**
     * 激活网络对象
     */
    public activate(): void {
        if (!this.isNetworkActive) {
            this.isNetworkActive = true;
            console.log(`[NetworkIdentity] 激活网络对象: ${this.networkId}`);
        }
    }
    
    /**
     * 停用网络对象
     */
    public deactivate(): void {
        if (this.isNetworkActive) {
            this.isNetworkActive = false;
            console.log(`[NetworkIdentity] 停用网络对象: ${this.networkId}`);
        }
    }
    
    /**
     * 获取下一个同步序列号
     */
    public getNextSyncSequence(): number {
        return ++this.syncSequence;
    }
    
    /**
     * 更新最后同步时间
     */
    public updateSyncTime(): void {
        this.lastSyncTime = Date.now();
    }
    
    /**
     * 检查是否需要同步
     * 
     * @param maxInterval - 最大同步间隔（毫秒）
     */
    public needsSync(maxInterval: number = 1000): boolean {
        return Date.now() - this.lastSyncTime > maxInterval;
    }
    
    /**
     * 获取网络对象统计信息
     */
    public getStats(): {
        networkId: string;
        hasAuthority: boolean;
        ownerId: string;
        isActive: boolean;
        createdAt: number;
        lastSyncTime: number;
        syncSequence: number;
        age: number;
        timeSinceLastSync: number;
    } {
        const now = Date.now();
        return {
            networkId: this.networkId,
            hasAuthority: this.hasAuthority,
            ownerId: this.ownerId,
            isActive: this.isNetworkActive,
            createdAt: this.createdAt,
            lastSyncTime: this.lastSyncTime,
            syncSequence: this.syncSequence,
            age: now - this.createdAt,
            timeSinceLastSync: now - this.lastSyncTime
        };
    }
    
    /**
     * 清理网络对象
     */
    public cleanup(): void {
        NetworkIdentityRegistry.Instance.unregister(this.networkId);
        this.deactivate();
        console.log(`[NetworkIdentity] 清理网络对象: ${this.networkId}`);
    }
}

/**
 * 网络身份注册表
 * 
 * 管理所有网络对象的注册和查找
 */
export class NetworkIdentityRegistry {
    private static _instance: NetworkIdentityRegistry | null = null;
    
    /**
     * 网络对象注册表
     * Key: networkId, Value: NetworkIdentity实例
     */
    private _identities: Map<string, NetworkIdentity> = new Map();
    
    /**
     * 按拥有者分组的对象
     * Key: ownerId, Value: NetworkIdentity集合
     */
    private _ownerObjects: Map<string, Set<NetworkIdentity>> = new Map();
    
    /**
     * 权威对象集合
     */
    private _authorityObjects: Set<NetworkIdentity> = new Set();
    
    /**
     * 获取注册表单例
     */
    public static get Instance(): NetworkIdentityRegistry {
        if (!NetworkIdentityRegistry._instance) {
            NetworkIdentityRegistry._instance = new NetworkIdentityRegistry();
        }
        return NetworkIdentityRegistry._instance;
    }
    
    private constructor() {}
    
    /**
     * 注册网络对象
     * 
     * @param identity - 网络身份组件
     */
    public register(identity: NetworkIdentity): void {
        if (this._identities.has(identity.networkId)) {
            console.warn(`[NetworkIdentityRegistry] 网络对象ID重复: ${identity.networkId}`);
            return;
        }
        
        this._identities.set(identity.networkId, identity);
        
        // 按拥有者分组
        if (identity.ownerId) {
            this.addToOwnerGroup(identity);
        }
        
        // 权威对象管理
        if (identity.hasAuthority) {
            this._authorityObjects.add(identity);
        }
        
        console.log(`[NetworkIdentityRegistry] 注册网络对象: ${identity.networkId}`);
    }
    
    /**
     * 注销网络对象
     * 
     * @param networkId - 网络对象ID
     */
    public unregister(networkId: string): boolean {
        const identity = this._identities.get(networkId);
        if (!identity) {
            return false;
        }
        
        this._identities.delete(networkId);
        
        // 从拥有者分组中移除
        if (identity.ownerId) {
            this.removeFromOwnerGroup(identity);
        }
        
        // 从权威对象集合中移除
        this._authorityObjects.delete(identity);
        
        console.log(`[NetworkIdentityRegistry] 注销网络对象: ${networkId}`);
        return true;
    }
    
    /**
     * 通过网络ID查找对象
     * 
     * @param networkId - 网络对象ID
     * @returns 网络身份组件或undefined
     */
    public find(networkId: string): NetworkIdentity | undefined {
        return this._identities.get(networkId);
    }
    
    /**
     * 获取指定拥有者的所有对象
     * 
     * @param ownerId - 拥有者ID
     * @returns 网络身份组件数组
     */
    public getObjectsByOwner(ownerId: string): NetworkIdentity[] {
        const ownerObjects = this._ownerObjects.get(ownerId);
        return ownerObjects ? Array.from(ownerObjects) : [];
    }
    
    /**
     * 获取所有权威对象
     * 
     * @returns 权威对象数组
     */
    public getAuthorityObjects(): NetworkIdentity[] {
        return Array.from(this._authorityObjects);
    }
    
    /**
     * 获取所有激活的网络对象
     * 
     * @returns 激活的网络对象数组
     */
    public getActiveObjects(): NetworkIdentity[] {
        return Array.from(this._identities.values()).filter(identity => identity.isNetworkActive);
    }
    
    /**
     * 获取需要同步的对象
     * 
     * @param maxInterval - 最大同步间隔
     * @returns 需要同步的对象数组
     */
    public getObjectsNeedingSync(maxInterval: number = 1000): NetworkIdentity[] {
        return this.getActiveObjects().filter(identity => identity.needsSync(maxInterval));
    }
    
    /**
     * 更新对象拥有者
     * 
     * @param networkId - 网络对象ID
     * @param newOwnerId - 新拥有者ID
     */
    public updateObjectOwner(networkId: string, newOwnerId: string): boolean {
        const identity = this._identities.get(networkId);
        if (!identity) {
            return false;
        }
        
        // 从旧拥有者分组中移除
        if (identity.ownerId) {
            this.removeFromOwnerGroup(identity);
        }
        
        // 设置新拥有者
        identity.setOwner(newOwnerId);
        
        // 添加到新拥有者分组
        if (newOwnerId) {
            this.addToOwnerGroup(identity);
        }
        
        return true;
    }
    
    /**
     * 更新对象权威状态
     * 
     * @param networkId - 网络对象ID
     * @param hasAuthority - 是否有权威
     */
    public updateObjectAuthority(networkId: string, hasAuthority: boolean): boolean {
        const identity = this._identities.get(networkId);
        if (!identity) {
            return false;
        }
        
        const oldAuthority = identity.hasAuthority;
        identity.setAuthority(hasAuthority);
        
        // 更新权威对象集合
        if (hasAuthority && !oldAuthority) {
            this._authorityObjects.add(identity);
        } else if (!hasAuthority && oldAuthority) {
            this._authorityObjects.delete(identity);
        }
        
        return true;
    }
    
    /**
     * 清理断开连接客户端的对象
     * 
     * @param disconnectedOwnerId - 断开连接的客户端ID
     */
    public cleanupDisconnectedOwner(disconnectedOwnerId: string): NetworkIdentity[] {
        const ownerObjects = this.getObjectsByOwner(disconnectedOwnerId);
        
        for (const identity of ownerObjects) {
            // 移除拥有权，但保留对象（由服务端接管）
            this.updateObjectOwner(identity.networkId, '');
            identity.setAuthority(false);
        }
        
        console.log(`[NetworkIdentityRegistry] 清理断开连接客户端 ${disconnectedOwnerId} 的 ${ownerObjects.length} 个对象`);
        return ownerObjects;
    }
    
    /**
     * 添加到拥有者分组
     */
    private addToOwnerGroup(identity: NetworkIdentity): void {
        if (!identity.ownerId) return;
        
        let ownerSet = this._ownerObjects.get(identity.ownerId);
        if (!ownerSet) {
            ownerSet = new Set();
            this._ownerObjects.set(identity.ownerId, ownerSet);
        }
        ownerSet.add(identity);
    }
    
    /**
     * 从拥有者分组中移除
     */
    private removeFromOwnerGroup(identity: NetworkIdentity): void {
        if (!identity.ownerId) return;
        
        const ownerSet = this._ownerObjects.get(identity.ownerId);
        if (ownerSet) {
            ownerSet.delete(identity);
            if (ownerSet.size === 0) {
                this._ownerObjects.delete(identity.ownerId);
            }
        }
    }
    
    /**
     * 获取注册表统计信息
     */
    public getStats(): {
        totalObjects: number;
        activeObjects: number;
        authorityObjects: number;
        ownerCount: number;
        averageAge: number;
        oldestObject?: string;
        newestObject?: string;
    } {
        const all = Array.from(this._identities.values());
        const active = all.filter(i => i.isNetworkActive);
        
        let totalAge = 0;
        let oldestTime = Date.now();
        let newestTime = 0;
        let oldestId = '';
        let newestId = '';
        
        for (const identity of all) {
            const age = Date.now() - identity.createdAt;
            totalAge += age;
            
            if (identity.createdAt < oldestTime) {
                oldestTime = identity.createdAt;
                oldestId = identity.networkId;
            }
            
            if (identity.createdAt > newestTime) {
                newestTime = identity.createdAt;
                newestId = identity.networkId;
            }
        }
        
        return {
            totalObjects: all.length,
            activeObjects: active.length,
            authorityObjects: this._authorityObjects.size,
            ownerCount: this._ownerObjects.size,
            averageAge: all.length > 0 ? totalAge / all.length : 0,
            oldestObject: oldestId || undefined,
            newestObject: newestId || undefined
        };
    }
    
    /**
     * 清空注册表
     */
    public clear(): void {
        this._identities.clear();
        this._ownerObjects.clear();
        this._authorityObjects.clear();
        console.log('[NetworkIdentityRegistry] 已清空注册表');
    }
}