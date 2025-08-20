import { createLogger } from '@esengine/ecs-framework';
import { NetworkScope, SyncBatch } from '@esengine/network-shared';
import { EventEmitter } from '@esengine/network-shared';

/**
 * 客户端位置信息
 */
export interface ClientPosition {
    clientId: string;
    x: number;
    y: number;
    z: number;
    lastUpdate: number;
}

/**
 * 作用域配置
 */
export interface ScopeConfig {
    /** 默认可视范围 */
    defaultRange: number;
    /** 最大可视范围 */
    maxRange: number;
    /** 位置更新间隔(毫秒) */
    positionUpdateInterval: number;
    /** 是否启用LOD(细节层次) */
    enableLOD: boolean;
    /** LOD距离阈值 */
    lodDistances: number[];
}

/**
 * 作用域查询结果
 */
export interface ScopeQueryResult {
    /** 在范围内的客户端ID列表 */
    clientsInRange: string[];
    /** 距离映射 */
    distances: Map<string, number>;
    /** LOD级别映射 */
    lodLevels: Map<string, number>;
}

/**
 * 自定义作用域规则
 */
export interface CustomScopeRule {
    name: string;
    condition: (batch: SyncBatch, clientId: string, clientPosition?: ClientPosition) => boolean;
    priority: number;
}

/**
 * 网络作用域管理器
 * 负责管理客户端的可见范围和网络作用域优化
 */
export class NetworkScopeManager extends EventEmitter {
    private logger = createLogger('NetworkScopeManager');
    private config: ScopeConfig;
    
    /** 客户端位置信息 */
    private clientPositions = new Map<string, ClientPosition>();
    
    /** 客户端可视范围 */
    private clientRanges = new Map<string, number>();
    
    /** 房间映射 */
    private clientRooms = new Map<string, string>();
    private roomClients = new Map<string, Set<string>>();
    
    /** 自定义作用域规则 */
    private customRules: CustomScopeRule[] = [];
    
    /** 作用域缓存 */
    private scopeCache = new Map<string, { result: ScopeQueryResult; timestamp: number }>();
    private cacheTimeout = 100; // 100ms缓存

    constructor(config: Partial<ScopeConfig> = {}) {
        super();
        
        this.config = {
            defaultRange: 100,
            maxRange: 500,
            positionUpdateInterval: 100,
            enableLOD: true,
            lodDistances: [50, 150, 300],
            ...config
        };
    }

    /**
     * 添加客户端
     */
    public addClient(clientId: string, position?: { x: number; y: number; z: number }): void {
        this.clientRanges.set(clientId, this.config.defaultRange);
        
        if (position) {
            this.updateClientPosition(clientId, position.x, position.y, position.z);
        }
        
        this.logger.debug(`客户端 ${clientId} 已添加到作用域管理器`);
    }

    /**
     * 移除客户端
     */
    public removeClient(clientId: string): void {
        this.clientPositions.delete(clientId);
        this.clientRanges.delete(clientId);
        
        // 从房间中移除
        const roomId = this.clientRooms.get(clientId);
        if (roomId) {
            this.leaveRoom(clientId, roomId);
        }
        
        // 清理缓存
        this.clearClientCache(clientId);
        
        this.logger.debug(`客户端 ${clientId} 已从作用域管理器移除`);
    }

    /**
     * 更新客户端位置
     */
    public updateClientPosition(clientId: string, x: number, y: number, z: number): void {
        const clientPosition: ClientPosition = {
            clientId,
            x,
            y,
            z,
            lastUpdate: Date.now()
        };
        
        this.clientPositions.set(clientId, clientPosition);
        
        // 清理相关缓存
        this.clearClientCache(clientId);
        
        this.emit('positionUpdated', clientId, clientPosition);
    }

    /**
     * 设置客户端可视范围
     */
    public setClientRange(clientId: string, range: number): void {
        const clampedRange = Math.min(range, this.config.maxRange);
        this.clientRanges.set(clientId, clampedRange);
        
        // 清理相关缓存
        this.clearClientCache(clientId);
        
        this.logger.debug(`客户端 ${clientId} 可视范围设置为: ${clampedRange}`);
    }

    /**
     * 加入房间
     */
    public joinRoom(clientId: string, roomId: string): void {
        // 从旧房间离开
        const oldRoom = this.clientRooms.get(clientId);
        if (oldRoom) {
            this.leaveRoom(clientId, oldRoom);
        }
        
        // 加入新房间
        this.clientRooms.set(clientId, roomId);
        
        if (!this.roomClients.has(roomId)) {
            this.roomClients.set(roomId, new Set());
        }
        this.roomClients.get(roomId)!.add(clientId);
        
        this.logger.debug(`客户端 ${clientId} 已加入房间 ${roomId}`);
        this.emit('clientJoinedRoom', clientId, roomId);
    }

    /**
     * 离开房间
     */
    public leaveRoom(clientId: string, roomId: string): void {
        this.clientRooms.delete(clientId);
        
        const roomClientSet = this.roomClients.get(roomId);
        if (roomClientSet) {
            roomClientSet.delete(clientId);
            
            // 如果房间为空，删除房间
            if (roomClientSet.size === 0) {
                this.roomClients.delete(roomId);
            }
        }
        
        this.logger.debug(`客户端 ${clientId} 已离开房间 ${roomId}`);
        this.emit('clientLeftRoom', clientId, roomId);
    }

    /**
     * 添加自定义作用域规则
     */
    public addCustomRule(rule: CustomScopeRule): void {
        this.customRules.push(rule);
        this.customRules.sort((a, b) => b.priority - a.priority);
        
        this.logger.debug(`已添加自定义作用域规则: ${rule.name}`);
    }

    /**
     * 移除自定义作用域规则
     */
    public removeCustomRule(ruleName: string): boolean {
        const index = this.customRules.findIndex(rule => rule.name === ruleName);
        if (index >= 0) {
            this.customRules.splice(index, 1);
            this.logger.debug(`已移除自定义作用域规则: ${ruleName}`);
            return true;
        }
        return false;
    }

    /**
     * 检查批次是否应该发送给特定客户端
     */
    public shouldSendToClient(batch: SyncBatch, clientId: string): boolean {
        // 检查自定义规则
        for (const rule of this.customRules) {
            const clientPosition = this.clientPositions.get(clientId);
            if (!rule.condition(batch, clientId, clientPosition)) {
                return false;
            }
        }
        
        // 检查网络作用域
        for (const [prop, scope] of Object.entries(batch.scopes)) {
            if (!this.checkPropertyScope(scope, batch, clientId)) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * 查询在范围内的客户端
     */
    public queryClientsInRange(
        position: { x: number; y: number; z: number },
        range: number,
        excludeClientId?: string
    ): ScopeQueryResult {
        const cacheKey = `${position.x},${position.y},${position.z},${range},${excludeClientId || ''}`;
        const cached = this.scopeCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.result;
        }
        
        const clientsInRange: string[] = [];
        const distances = new Map<string, number>();
        const lodLevels = new Map<string, number>();
        
        for (const [clientId, clientPosition] of this.clientPositions) {
            if (excludeClientId && clientId === excludeClientId) {
                continue;
            }
            
            const distance = this.calculateDistance(position, clientPosition);
            
            if (distance <= range) {
                clientsInRange.push(clientId);
                distances.set(clientId, distance);
                
                // 计算LOD级别
                if (this.config.enableLOD) {
                    const lodLevel = this.calculateLODLevel(distance);
                    lodLevels.set(clientId, lodLevel);
                }
            }
        }
        
        const result: ScopeQueryResult = {
            clientsInRange,
            distances,
            lodLevels
        };
        
        // 缓存结果
        this.scopeCache.set(cacheKey, {
            result,
            timestamp: Date.now()
        });
        
        return result;
    }

    /**
     * 获取房间内的所有客户端
     */
    public getRoomClients(roomId: string): string[] {
        const roomClientSet = this.roomClients.get(roomId);
        return roomClientSet ? Array.from(roomClientSet) : [];
    }

    /**
     * 获取客户端所在房间
     */
    public getClientRoom(clientId: string): string | undefined {
        return this.clientRooms.get(clientId);
    }

    /**
     * 获取客户端位置
     */
    public getClientPosition(clientId: string): ClientPosition | undefined {
        return this.clientPositions.get(clientId);
    }

    /**
     * 获取所有客户端位置
     */
    public getAllClientPositions(): Map<string, ClientPosition> {
        return new Map(this.clientPositions);
    }

    /**
     * 清理过期缓存
     */
    public cleanupCache(): void {
        const now = Date.now();
        for (const [key, cache] of this.scopeCache) {
            if (now - cache.timestamp > this.cacheTimeout * 2) {
                this.scopeCache.delete(key);
            }
        }
    }

    /**
     * 更新配置
     */
    public updateConfig(newConfig: Partial<ScopeConfig>): void {
        Object.assign(this.config, newConfig);
    }

    /**
     * 获取统计信息
     */
    public getStats(): {
        clientCount: number;
        roomCount: number;
        cacheSize: number;
        customRuleCount: number;
    } {
        return {
            clientCount: this.clientPositions.size,
            roomCount: this.roomClients.size,
            cacheSize: this.scopeCache.size,
            customRuleCount: this.customRules.length
        };
    }

    /**
     * 销毁管理器
     */
    public destroy(): void {
        this.clientPositions.clear();
        this.clientRanges.clear();
        this.clientRooms.clear();
        this.roomClients.clear();
        this.customRules.length = 0;
        this.scopeCache.clear();
        this.removeAllListeners();
    }

    /**
     * 检查属性作用域
     */
    private checkPropertyScope(scope: NetworkScope, batch: SyncBatch, clientId: string): boolean {
        switch (scope) {
            case NetworkScope.Global:
                return true;
                
            case NetworkScope.Room:
                const clientRoom = this.clientRooms.get(clientId);
                // 这里需要知道batch来源的实体所在房间，简化实现
                return true;
                
            case NetworkScope.Owner:
                return batch.instanceId === clientId;
                
            case NetworkScope.Nearby:
                return this.isClientNearby(batch, clientId);
                
            case NetworkScope.Custom:
                // 由自定义规则处理
                return true;
                
            default:
                return false;
        }
    }

    /**
     * 检查客户端是否在附近
     */
    private isClientNearby(batch: SyncBatch, clientId: string): boolean {
        const clientPosition = this.clientPositions.get(clientId);
        if (!clientPosition) {
            return false;
        }
        
        const clientRange = this.clientRanges.get(clientId) || this.config.defaultRange;
        
        // 这里需要知道batch来源实体的位置，简化实现
        // 实际项目中应该从实体的Transform组件获取位置
        return true;
    }

    /**
     * 计算两点之间的距离
     */
    private calculateDistance(
        pos1: { x: number; y: number; z: number },
        pos2: { x: number; y: number; z: number }
    ): number {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /**
     * 计算LOD级别
     */
    private calculateLODLevel(distance: number): number {
        for (let i = 0; i < this.config.lodDistances.length; i++) {
            if (distance <= this.config.lodDistances[i]) {
                return i;
            }
        }
        return this.config.lodDistances.length;
    }

    /**
     * 清理客户端相关缓存
     */
    private clearClientCache(clientId: string): void {
        const keysToDelete: string[] = [];
        
        for (const key of this.scopeCache.keys()) {
            if (key.includes(clientId)) {
                keysToDelete.push(key);
            }
        }
        
        for (const key of keysToDelete) {
            this.scopeCache.delete(key);
        }
    }
}