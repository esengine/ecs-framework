import { Component } from '@esengine/ecs-framework';

/**
 * 网络组件 - 模拟复杂的网络连接和数据同步（已移除循环引用）
 */
export class NetworkComponent extends Component {
    /** 网络ID */
    public networkId: string = '';
    
    /** 连接状态 */
    public connectionState: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
    
    /** 网络连接信息 */
    public connection: {
        sessionId: string;
        serverId: string;
        roomId: string;
        playerId: string;
        ping: number;
        packetLoss: number;
        bandwidth: number;
        lastHeartbeat: number;
    };
    
    /** 同步数据 */
    public syncData: {
        dirtyFlags: Set<string>;
        lastSyncTime: number;
        syncHistory: Array<{
            timestamp: number;
            dataSize: number;
            properties: string[];
            success: boolean;
        }>;
        queuedUpdates: Array<{
            property: string;
            value: any;
            timestamp: number;
            priority: number;
        }>;
    };
    
    /** 网络统计 */
    public networkStats: {
        totalBytesSent: number;
        totalBytesReceived: number;
        packetsPerSecond: number;
        averageLatency: number;
        latencyHistory: number[];
        connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
        errorCount: number;
        reconnectCount: number;
        lastErrorTime: number;
        errorLog: Array<{
            timestamp: number;
            errorType: string;
            message: string;
            stack?: string;
        }>;
    };
    
    /** 连接的玩家ID列表（避免循环引用） */
    public connectedPlayerIds: Set<string> = new Set();
    
    /** 群组成员ID（避免循环引用） */
    public groupMemberIds: string[] = [];
    
    /** 群组领导者ID（避免循环引用） */
    public groupLeaderId: string | null = null;
    
    /** 复杂的网络配置 */
    public config: {
        autoReconnect: boolean;
        maxReconnectAttempts: number;
        heartbeatInterval: number;
        syncFrequency: number;
        compressionEnabled: boolean;
        encryptionEnabled: boolean;
        priorityLevels: Map<string, number>;
        filters: Array<{
            property: string;
            condition: (value: any) => boolean;
            action: 'allow' | 'deny' | 'transform';
            transformer?: (value: any) => any;
        }>;
        bufferSettings: {
            maxBufferSize: number;
            flushInterval: number;
            compressionThreshold: number;
        };
    };
    
    /** 消息队列 */
    public messageQueue: {
        incoming: Array<{
            senderId: string;
            messageType: string;
            data: any;
            timestamp: number;
            processed: boolean;
        }>;
        outgoing: Array<{
            targetId: string;
            messageType: string;
            data: any;
            priority: number;
            attempts: number;
            maxAttempts: number;
        }>;
        processing: Map<string, {
            messageId: string;
            startTime: number;
            expectedDuration: number;
            status: 'processing' | 'completed' | 'failed';
        }>;
    };
    
    /** 复杂的网络缓存系统 */
    public cacheSystem: {
        playerCache: Map<string, {
            playerId: string;
            lastSeen: number;
            cachedData: any;
            cacheExpiry: number;
        }>;
        messageCache: Map<string, {
            messageId: string;
            content: any;
            timestamp: number;
            recipients: string[];
        }>;
        syncCache: Map<string, {
            propertyPath: string;
            value: any;
            lastUpdated: number;
            version: number;
        }>;
    };
    
    constructor(networkId: string = '') {
        super();
        
        this.networkId = networkId || this.generateNetworkId();
        
        this.connection = {
            sessionId: '',
            serverId: '',
            roomId: '',
            playerId: '',
            ping: 0,
            packetLoss: 0,
            bandwidth: 0,
            lastHeartbeat: 0
        };
        
        this.syncData = {
            dirtyFlags: new Set(),
            lastSyncTime: 0,
            syncHistory: [],
            queuedUpdates: []
        };
        
        this.networkStats = {
            totalBytesSent: 0,
            totalBytesReceived: 0,
            packetsPerSecond: 0,
            averageLatency: 0,
            latencyHistory: [],
            connectionQuality: 'excellent',
            errorCount: 0,
            reconnectCount: 0,
            lastErrorTime: 0,
            errorLog: []
        };
        
        this.config = {
            autoReconnect: true,
            maxReconnectAttempts: 5,
            heartbeatInterval: 1000,
            syncFrequency: 60,
            compressionEnabled: true,
            encryptionEnabled: false,
            priorityLevels: new Map([
                ['critical', 10],
                ['high', 7],
                ['medium', 5],
                ['low', 2]
            ]),
            filters: [],
            bufferSettings: {
                maxBufferSize: 1024 * 1024, // 1MB
                flushInterval: 100,
                compressionThreshold: 1024
            }
        };
        
        this.messageQueue = {
            incoming: [],
            outgoing: [],
            processing: new Map()
        };
        
        this.cacheSystem = {
            playerCache: new Map(),
            messageCache: new Map(),
            syncCache: new Map()
        };
    }
    
    /**
     * 生成网络ID
     */
    private generateNetworkId(): string {
        return 'net_' + Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }
    
    /**
     * 连接到其他网络组件（避免循环引用）
     */
    public connectToPlayer(playerNetworkId: string): void {
        if (!this.connectedPlayerIds.has(playerNetworkId)) {
            this.connectedPlayerIds.add(playerNetworkId);
            
            // 记录连接事件
            this.logNetworkEvent('player_connected', {
                playerId: playerNetworkId,
                timestamp: Date.now()
            });
        }
    }
    
    /**
     * 加入群组（避免循环引用）
     */
    public joinGroup(memberIds: string[], leaderId?: string): void {
        this.groupMemberIds = [...memberIds];
        this.groupLeaderId = leaderId || null;
        
        // 更新缓存
        memberIds.forEach(memberId => {
            this.cacheSystem.playerCache.set(memberId, {
                playerId: memberId,
                lastSeen: Date.now(),
                cachedData: {},
                cacheExpiry: Date.now() + 300000 // 5分钟缓存
            });
        });
    }
    
    /**
     * 发送消息
     */
    public sendMessage(targetId: string, messageType: string, data: any, priority: number = 5): void {
        const message = {
            targetId,
            messageType,
            data: this.processOutgoingData(data),
            priority,
            attempts: 0,
            maxAttempts: 3
        };
        
        this.messageQueue.outgoing.push(message);
        this.messageQueue.outgoing.sort((a, b) => b.priority - a.priority);
        
        // 更新统计
        this.networkStats.totalBytesSent += JSON.stringify(data).length;
    }
    
    /**
     * 处理传出数据
     */
    private processOutgoingData(data: any): any {
        let processedData = data;
        
        // 应用过滤器
        this.config.filters.forEach(filter => {
            if (filter.condition(processedData)) {
                if (filter.action === 'transform' && filter.transformer) {
                    processedData = filter.transformer(processedData);
                }
            }
        });
        
        // 压缩数据
        if (this.config.compressionEnabled) {
            processedData = this.compressData(processedData);
        }
        
        return processedData;
    }
    
    /**
     * 压缩数据（模拟）
     */
    private compressData(data: any): any {
        // 模拟压缩算法
        const serialized = JSON.stringify(data);
        if (serialized.length > this.config.bufferSettings.compressionThreshold) {
            // 模拟压缩
            return {
                compressed: true,
                originalSize: serialized.length,
                compressedSize: Math.floor(serialized.length * 0.6),
                data: serialized.substring(0, Math.floor(serialized.length * 0.6))
            };
        }
        return data;
    }
    
    /**
     * 标记属性为脏
     */
    public markDirty(property: string): void {
        this.syncData.dirtyFlags.add(property);
    }
    
    /**
     * 更新网络统计
     */
    public updateNetworkStats(deltaTime: number): void {
        // 更新延迟历史
        if (this.networkStats.latencyHistory.length > 100) {
            this.networkStats.latencyHistory.shift();
        }
        this.networkStats.latencyHistory.push(this.connection.ping);
        
        // 计算平均延迟
        this.networkStats.averageLatency = this.networkStats.latencyHistory.reduce((a, b) => a + b, 0) / 
                                           this.networkStats.latencyHistory.length;
        
        // 更新连接质量
        if (this.networkStats.averageLatency < 50) {
            this.networkStats.connectionQuality = 'excellent';
        } else if (this.networkStats.averageLatency < 100) {
            this.networkStats.connectionQuality = 'good';
        } else if (this.networkStats.averageLatency < 200) {
            this.networkStats.connectionQuality = 'fair';
        } else {
            this.networkStats.connectionQuality = 'poor';
        }
        
        // 更新包率
        this.networkStats.packetsPerSecond = this.messageQueue.outgoing.length / deltaTime;
        
        // 清理过期缓存
        this.cleanupExpiredCache();
    }
    
    /**
     * 清理过期缓存
     */
    private cleanupExpiredCache(): void {
        const now = Date.now();
        
        // 清理玩家缓存
        for (const [key, value] of this.cacheSystem.playerCache) {
            if (value.cacheExpiry < now) {
                this.cacheSystem.playerCache.delete(key);
            }
        }
        
        // 清理消息缓存
        for (const [key, value] of this.cacheSystem.messageCache) {
            if (value.timestamp < now - 600000) { // 10分钟过期
                this.cacheSystem.messageCache.delete(key);
            }
        }
    }
    
    /**
     * 记录网络事件
     */
    private logNetworkEvent(eventType: string, data: any): void {
        this.networkStats.errorLog.push({
            timestamp: Date.now(),
            errorType: eventType,
            message: JSON.stringify(data)
        });
        
        // 限制日志大小
        if (this.networkStats.errorLog.length > 1000) {
            this.networkStats.errorLog = this.networkStats.errorLog.slice(-500);
        }
    }
    
    /**
     * 重置组件
     */
    public reset(): void {
        // 清理ID列表（不再需要处理循环引用）
        this.connectedPlayerIds.clear();
        this.groupMemberIds = [];
        this.groupLeaderId = null;
        this.connectionState = 'disconnected';
        
        this.syncData.dirtyFlags.clear();
        this.syncData.syncHistory = [];
        this.syncData.queuedUpdates = [];
        
        this.messageQueue.incoming = [];
        this.messageQueue.outgoing = [];
        this.messageQueue.processing.clear();
        
        this.cacheSystem.playerCache.clear();
        this.cacheSystem.messageCache.clear();
        this.cacheSystem.syncCache.clear();
        
        this.networkStats.errorLog = [];
        this.networkStats.latencyHistory = [];
    }
} 