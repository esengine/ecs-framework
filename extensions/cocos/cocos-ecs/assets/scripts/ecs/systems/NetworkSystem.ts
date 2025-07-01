import { EntitySystem, Entity, Matcher, Time } from '@esengine/ecs-framework';
import { NetworkComponent } from '../components';

/**
 * 网络系统 - 处理网络同步和连接管理
 */
export class NetworkSystem extends EntitySystem {
    
    /** 网络统计 */
    private networkStats = {
        totalEntities: 0,
        connectedEntities: 0,
        totalMessagesSent: 0,
        totalMessagesReceived: 0,
        averagePing: 0,
        networkTraffic: 0
    };
    
    /** 消息处理队列 */
    private globalMessageQueue: Array<{
        from: string;
        to: string;
        messageType: string;
        data: any;
        timestamp: number;
        priority: number;
    }> = [];
    
    constructor() {
        // 处理具有网络组件的实体
        super(Matcher.empty().all(NetworkComponent));
    }
    
    /**
     * 处理所有实体
     */
    protected process(entities: Entity[]): void {
        const deltaTime = Time.deltaTime;
        
        this.networkStats.totalEntities = entities.length;
        this.networkStats.connectedEntities = entities.filter(e => 
            e.getComponent(NetworkComponent)?.connectionState === 'connected'
        ).length;
        
        for (const entity of entities) {
            this.processEntity(entity, deltaTime);
        }
        
        // 处理全局消息队列
        this.processGlobalMessages();
        
        // 更新网络统计
        this.updateGlobalNetworkStats(entities);
    }
    
    /**
     * 处理单个实体
     */
    private processEntity(entity: Entity, deltaTime: number): void {
        const network = entity.getComponent(NetworkComponent);
        
        if (!network) return;
        
        // 更新网络统计
        network.updateNetworkStats(deltaTime);
        
        // 处理连接状态
        this.updateConnectionState(network, deltaTime);
        
        // 处理消息队列
        this.processEntityMessages(network, entity);
        
        // 处理数据同步
        this.processSynchronization(network, deltaTime);
        
        // 处理群组通信
        this.processGroupCommunication(network);
    }
    
    /**
     * 更新连接状态
     */
    private updateConnectionState(network: NetworkComponent, deltaTime: number): void {
        const currentTime = Date.now();
        
        switch (network.connectionState) {
            case 'disconnected':
                // 尝试连接
                if (network.config.autoReconnect && 
                    network.networkStats.reconnectCount < network.config.maxReconnectAttempts) {
                    network.connectionState = 'connecting';
                    network.connection.lastHeartbeat = currentTime;
                }
                break;
                
            case 'connecting':
                // 模拟连接过程
                if (Math.random() > 0.1) { // 90% 成功率
                    network.connectionState = 'connected';
                    network.connection.sessionId = this.generateSessionId();
                    network.connection.serverId = 'server_001';
                    network.connection.lastHeartbeat = currentTime;
                } else if (currentTime - network.connection.lastHeartbeat > 5000) {
                    // 连接超时
                    network.connectionState = 'error';
                    network.networkStats.errorCount++;
                }
                break;
                
            case 'connected':
                // 维持连接心跳
                if (currentTime - network.connection.lastHeartbeat > network.config.heartbeatInterval) {
                    this.sendHeartbeat(network);
                    network.connection.lastHeartbeat = currentTime;
                }
                
                // 模拟网络质量变化
                network.connection.ping = Math.random() * 100 + 20; // 20-120ms
                network.connection.packetLoss = Math.random() * 0.05; // 0-5%
                network.connection.bandwidth = 1000 + Math.random() * 500; // 1000-1500 Kbps
                break;
                
            case 'error':
                // 错误状态，尝试重连
                if (network.config.autoReconnect && 
                    network.networkStats.reconnectCount < network.config.maxReconnectAttempts) {
                    network.connectionState = 'disconnected';
                    network.networkStats.reconnectCount++;
                }
                break;
        }
    }
    
    /**
     * 处理实体消息
     */
    private processEntityMessages(network: NetworkComponent, entity: Entity): void {
        // 处理传出消息
        const outgoingMessages = network.messageQueue.outgoing.slice();
        network.messageQueue.outgoing = [];
        
        for (const message of outgoingMessages) {
            if (this.sendMessage(network, message)) {
                this.networkStats.totalMessagesSent++;
                network.networkStats.totalBytesSent += this.estimateMessageSize(message);
            } else {
                // 发送失败，重新加入队列
                message.attempts++;
                if (message.attempts < message.maxAttempts) {
                    network.messageQueue.outgoing.push(message);
                }
            }
        }
        
        // 处理传入消息
        this.processIncomingMessages(network, entity);
    }
    
    /**
     * 发送消息
     */
    private sendMessage(network: NetworkComponent, message: any): boolean {
        if (network.connectionState !== 'connected') {
            return false;
        }
        
        // 模拟网络延迟和丢包
        const shouldDelay = Math.random() < 0.3; // 30% 概率有延迟
        const shouldDrop = Math.random() < network.connection.packetLoss;
        
        if (shouldDrop) {
            network.networkStats.errorCount++;
            return false;
        }
        
        // 添加到全局消息队列
        this.globalMessageQueue.push({
            from: network.networkId,
            to: message.targetId,
            messageType: message.messageType,
            data: message.data,
            timestamp: Date.now() + (shouldDelay ? Math.random() * 200 : 0),
            priority: message.priority
        });
        
        return true;
    }
    
    /**
     * 处理传入消息
     */
    private processIncomingMessages(network: NetworkComponent, entity: Entity): void {
        // 从全局队列中获取发给此实体的消息
        const incomingMessages = this.globalMessageQueue.filter(msg => 
            msg.to === network.networkId && msg.timestamp <= Date.now()
        );
        
        // 从全局队列中移除这些消息
        this.globalMessageQueue = this.globalMessageQueue.filter(msg => 
            !(msg.to === network.networkId && msg.timestamp <= Date.now())
        );
        
        // 处理消息
        for (const message of incomingMessages) {
            network.messageQueue.incoming.push({
                senderId: message.from,
                messageType: message.messageType,
                data: message.data,
                timestamp: message.timestamp,
                processed: false
            });
            
            this.networkStats.totalMessagesReceived++;
            network.networkStats.totalBytesReceived += this.estimateMessageSize(message);
            
            // 立即处理某些类型的消息
            this.handleSpecialMessages(network, message);
        }
    }
    
    /**
     * 处理特殊消息类型
     */
    private handleSpecialMessages(network: NetworkComponent, message: any): void {
        switch (message.messageType) {
            case 'player_join_group':
                // 处理加入群组消息
                const groupData = message.data;
                if (groupData.members && Array.isArray(groupData.members)) {
                    // 查找对应的网络组件并建立连接
                    groupData.members.forEach((memberId: string) => {
                        // 直接使用成员ID建立连接
                        network.connectToPlayer(memberId);
                    });
                }
                break;
                
            case 'heartbeat':
                // 心跳响应
                network.connection.ping = Date.now() - message.data.timestamp;
                break;
                
            case 'sync_request':
                // 同步请求
                this.handleSyncRequest(network, message);
                break;
        }
    }
    
    /**
     * 处理数据同步
     */
    private processSynchronization(network: NetworkComponent, deltaTime: number): void {
        const currentTime = Date.now();
        const syncInterval = 1000 / network.config.syncFrequency; // 转换为毫秒
        
        if (currentTime - network.syncData.lastSyncTime >= syncInterval) {
            this.performSynchronization(network);
            network.syncData.lastSyncTime = currentTime;
        }
        
        // 处理排队的更新
        this.processQueuedUpdates(network);
    }
    
    /**
     * 执行同步
     */
    private performSynchronization(network: NetworkComponent): void {
        if (network.syncData.dirtyFlags.size === 0) {
            return; // 没有需要同步的数据
        }
        
        const syncData = {
            networkId: network.networkId,
            timestamp: Date.now(),
            properties: Array.from(network.syncData.dirtyFlags),
            checksum: this.calculateChecksum(network)
        };
        
        // 发送同步数据给连接的玩家
        network.connectedPlayerIds.forEach(playerId => {
            network.sendMessage(playerId, 'sync_data', syncData, 7);
        });
        
        // 记录同步历史
        network.syncData.syncHistory.push({
            timestamp: syncData.timestamp,
            dataSize: this.estimateMessageSize(syncData),
            properties: syncData.properties,
            success: true
        });
        
        // 清理脏标记
        network.syncData.dirtyFlags.clear();
    }
    
    /**
     * 处理排队的更新
     */
    private processQueuedUpdates(network: NetworkComponent): void {
        // 按优先级和时间戳排序
        network.syncData.queuedUpdates.sort((a, b) => {
            if (a.priority !== b.priority) {
                return b.priority - a.priority; // 高优先级优先
            }
            return a.timestamp - b.timestamp; // 时间戳早的优先
        });
        
        // 处理前10个更新
        const updatesToProcess = network.syncData.queuedUpdates.splice(0, 10);
        for (const update of updatesToProcess) {
            network.markDirty(update.property);
        }
    }
    
    /**
     * 处理群组通信
     */
    private processGroupCommunication(network: NetworkComponent): void {
        if (network.groupMemberIds.length === 0) {
            return;
        }
        
        // 群组消息广播
        if (Math.random() < 0.01) { // 1% 概率发送群组消息
            const groupMessage = {
                type: 'group_update',
                data: {
                    sender: network.networkId,
                    timestamp: Date.now(),
                    groupSize: network.groupMemberIds.length,
                    status: network.connectionState
                }
            };
            
            network.groupMemberIds.forEach(memberId => {
                if (memberId !== network.networkId) {
                    network.sendMessage(memberId, 'group_message', groupMessage, 5);
                }
            });
        }
    }
    
    /**
     * 处理全局消息
     */
    private processGlobalMessages(): void {
        // 移除过期消息
        const currentTime = Date.now();
        this.globalMessageQueue = this.globalMessageQueue.filter(msg => 
            currentTime - msg.timestamp < 30000 // 30秒过期
        );
        
        // 按优先级排序
        this.globalMessageQueue.sort((a, b) => b.priority - a.priority);
    }
    
    /**
     * 更新全局网络统计
     */
    private updateGlobalNetworkStats(entities: Entity[]): void {
        let totalPing = 0;
        let connectedCount = 0;
        let totalTraffic = 0;
        
        for (const entity of entities) {
            const network = entity.getComponent(NetworkComponent);
            if (network && network.connectionState === 'connected') {
                totalPing += network.connection.ping;
                connectedCount++;
                totalTraffic += network.networkStats.totalBytesSent + network.networkStats.totalBytesReceived;
            }
        }
        
        this.networkStats.averagePing = connectedCount > 0 ? totalPing / connectedCount : 0;
        this.networkStats.networkTraffic = totalTraffic;
    }
    
    /**
     * 辅助方法
     */
    private generateSessionId(): string {
        return 'session_' + Math.random().toString(36).substring(2, 15);
    }
    
    private estimateMessageSize(message: any): number {
        return JSON.stringify(message).length;
    }
    
    private calculateChecksum(network: NetworkComponent): string {
        // 简单的校验和计算
        const data = JSON.stringify({
            networkId: network.networkId,
            connectionState: network.connectionState
        });
        return btoa(data).substring(0, 8);
    }
    
    private sendHeartbeat(network: NetworkComponent): void {
        network.sendMessage('server', 'heartbeat', { timestamp: Date.now() }, 10);
    }
    
    private findNetworkComponentById(networkId: string): NetworkComponent | null {
        // 这里应该有一个全局的网络组件注册表
        // 为了简化，我们返回null
        return null;
    }
    
    private handleSyncRequest(network: NetworkComponent, message: any): void {
        // 处理同步请求
        const response = {
            requestId: message.data.requestId,
            data: this.gatherSyncData(network),
            timestamp: Date.now()
        };
        
        network.sendMessage(message.from, 'sync_response', response, 8);
    }
    
    private gatherSyncData(network: NetworkComponent): any {
        return {
            networkId: network.networkId,
            connectionState: network.connectionState,
            ping: network.connection.ping,
            groupSize: network.groupMemberIds.length
        };
    }
    
    /**
     * 系统初始化时调用
     */
    public initialize(): void {
        super.initialize();
        console.log('🌐 网络系统已启动');
    }
    
    /**
     * 获取系统统计信息
     */
    public getSystemStats(): any {
        return {
            ...this.networkStats,
            globalMessageQueueSize: this.globalMessageQueue.length,
            systemName: 'NetworkSystem'
        };
    }
} 