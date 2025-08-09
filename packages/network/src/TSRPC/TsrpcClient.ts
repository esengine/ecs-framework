/**
 * TSRPC 客户端
 */
import { WsClient } from 'tsrpc';
import { ServiceType, serviceProto } from './protocols/serviceProto';
import { Component } from '@esengine/ecs-framework';
import { getTsrpcMetadata } from '../Serialization/TsrpcDecorators';
import { INetworkSyncable, MessageData } from '../types/NetworkTypes';
import { ConnectionState, ITypedEventEmitter, NetworkEventHandlers } from '../types/CoreTypes';
import { TSRPC_CONFIG, NETWORK_CONFIG } from '../constants/NetworkConstants';

const logger = { 
    info: console.log, 
    warn: console.warn, 
    error: console.error, 
    debug: console.debug 
};

export class TsrpcNetworkClient {
    private _client: WsClient<ServiceType>;
    private _playerId?: number;
    private _roomId?: string;
    private _componentUpdateCallbacks = new Map<string, (entityId: number, data: MessageData) => void>();
    private _connectionState: ConnectionState = 'disconnected';
    private _reconnectAttempts: number = 0;
    private _maxReconnectAttempts: number = NETWORK_CONFIG.DEFAULT_MAX_RECONNECT_ATTEMPTS;
    private _reconnectDelay: number = NETWORK_CONFIG.DEFAULT_RECONNECT_DELAY;
    private _lastPingTime: number = 0;
    private _rtt: number = 0;
    private _eventHandlers = new Map<keyof NetworkEventHandlers, NetworkEventHandlers[keyof NetworkEventHandlers][]>();

    constructor(serverUrl: string = TSRPC_CONFIG.DEFAULT_SERVER_URL) {
        this._client = new WsClient(serviceProto, {
            server: serverUrl,
            // JSON兼容模式
            json: false,
            // 自动重连
            heartbeat: {
                interval: TSRPC_CONFIG.DEFAULT_HEARTBEAT.interval,
                timeout: TSRPC_CONFIG.DEFAULT_HEARTBEAT.timeout
            }
        });

        this.setupMessageHandlers();
        this.setupEvents();
    }

    private setupMessageHandlers() {
        // 监听组件更新消息
        this._client.listenMsg('ComponentUpdate', (msg) => {
            const { entityId, componentType, componentData, timestamp } = msg;
            
            logger.debug(`收到组件更新: Entity ${entityId}, Component ${componentType}`);
            
            const callback = this._componentUpdateCallbacks.get(componentType);
            if (callback) {
                callback(entityId, componentData);
            }
        });
    }

    private setupEvents() {
        // 连接成功
        this._client.flows.postConnectFlow.push((conn) => {
            this._connectionState = 'connected';
            this._reconnectAttempts = 0;
            logger.info('已连接到TSRPC服务器');
            this.emit('connected');
            return conn;
        });

        // 连接断开
        this._client.flows.postDisconnectFlow.push((data) => {
            this._connectionState = 'disconnected';
            logger.info('与TSRPC服务器断开连接');
            this.emit('disconnected', data?.reason || 'Unknown disconnect reason');
            
            // 自动重连
            if (this._reconnectAttempts < this._maxReconnectAttempts) {
                this.attemptReconnect();
            }
            
            return data;
        });
    }

    /**
     * 连接到服务器
     */
    async connect(): Promise<boolean> {
        this._connectionState = 'connecting';
        this.emit('connecting');
        
        const result = await this._client.connect();
        if (result.isSucc) {
            this._connectionState = 'connected';
            return true;
        } else {
            this._connectionState = 'disconnected';
            this.emit('connectError', new Error(result.errMsg || 'Connection failed'));
            return false;
        }
    }

    /**
     * 断开连接
     */
    disconnect() {
        this._client.disconnect();
    }

    /**
     * 加入房间
     */
    async joinRoom(roomId: string, playerName?: string): Promise<boolean> {
        try {
            const result = await this._client.callApi('JoinRoom', {
                roomId,
                playerName
            });

            if (result.isSucc && result.res.success) {
                this._playerId = result.res.playerId;
                this._roomId = roomId;
                logger.info(`成功加入房间 ${roomId}, 玩家ID: ${this._playerId}`);
                return true;
            } else {
                logger.error('加入房间失败:', result.isSucc ? result.res.errorMsg : result.err);
                return false;
            }
        } catch (error) {
            logger.error('加入房间异常:', error);
            return false;
        }
    }

    /**
     * 同步组件到服务器
     */
    async syncComponent<T extends INetworkSyncable>(entityId: number, component: T): Promise<boolean> {
        try {
            // 获取组件的TSRPC元数据
            const metadata = getTsrpcMetadata(component.constructor);
            if (!metadata) {
                logger.error(`组件 ${component.constructor.name} 不支持TSRPC同步`);
                return false;
            }

            // 提取组件数据
            const componentData: Record<string, unknown> = {};
            for (const [fieldName] of metadata.fields) {
                componentData[fieldName] = component[fieldName];
            }

            const result = await this._client.callApi('SyncComponent', {
                entityId,
                componentType: metadata.componentType,
                componentData,
                timestamp: Date.now()
            });

            if (result.isSucc && result.res.success) {
                logger.debug(`组件同步成功: Entity ${entityId}, Component ${metadata.componentType}`);
                return true;
            } else {
                logger.error('组件同步失败:', result.isSucc ? result.res.errorMsg : result.err);
                return false;
            }
        } catch (error) {
            logger.error('同步组件异常:', error);
            return false;
        }
    }

    /**
     * 注册组件更新回调
     */
    onComponentUpdate(componentType: string, callback: (entityId: number, data: MessageData) => void) {
        this._componentUpdateCallbacks.set(componentType, callback);
    }

    /**
     * 取消组件更新回调
     */
    offComponentUpdate(componentType: string) {
        this._componentUpdateCallbacks.delete(componentType);
    }

    /**
     * 获取客户端状态
     */
    get isConnected(): boolean {
        return this._client.isConnected;
    }

    /**
     * 获取玩家ID
     */
    get playerId(): number | undefined {
        return this._playerId;
    }

    /**
     * 获取房间ID
     */
    get roomId(): string | undefined {
        return this._roomId;
    }

    /**
     * 获取客户端实例
     */
    get client(): WsClient<ServiceType> {
        return this._client;
    }

    /**
     * 尝试重连
     */
    private async attemptReconnect(): Promise<void> {
        this._reconnectAttempts++;
        const delay = Math.min(this._reconnectDelay * Math.pow(2, this._reconnectAttempts - 1), 30000);
        
        logger.info(`尝试重连 (${this._reconnectAttempts}/${this._maxReconnectAttempts})，${delay}ms后重试`);
        this.emit('reconnecting', this._reconnectAttempts);
        
        setTimeout(async () => {
            try {
                const success = await this.connect();
                if (success) {
                    logger.info('重连成功');
                    this.emit('reconnected');
                } else if (this._reconnectAttempts < this._maxReconnectAttempts) {
                    await this.attemptReconnect();
                } else {
                    logger.error('重连失败，已达到最大重试次数');
                    this.emit('reconnectFailed');
                }
            } catch (error) {
                logger.error('重连异常:', error);
                if (this._reconnectAttempts < this._maxReconnectAttempts) {
                    await this.attemptReconnect();
                }
            }
        }, delay);
    }

    /**
     * Ping服务器测试连接
     */
    public async ping(): Promise<number> {
        try {
            this._lastPingTime = Date.now();
            const result = await this._client.callApi('Ping', {
                timestamp: this._lastPingTime
            });
            
            if (result.isSucc) {
                this._rtt = Date.now() - this._lastPingTime;
                return this._rtt;
            } else {
                throw new Error(result.err?.message || 'Ping失败');
            }
        } catch (error) {
            logger.error('Ping服务器失败:', error);
            throw error;
        }
    }

    /**
     * 获取RTT
     */
    public getRtt(): number {
        return this._rtt;
    }

    /**
     * 获取连接状态
     */
    public getConnectionState(): ConnectionState {
        return this._connectionState;
    }

    /**
     * 设置重连配置
     */
    public setReconnectConfig(maxAttempts: number, delay: number): void {
        this._maxReconnectAttempts = maxAttempts;
        this._reconnectDelay = delay;
    }

    /**
     * 添加事件监听器
     */
    public on<K extends keyof NetworkEventHandlers>(event: K, handler: NetworkEventHandlers[K]): void {
        if (!this._eventHandlers.has(event)) {
            this._eventHandlers.set(event, []);
        }
        this._eventHandlers.get(event)!.push(handler);
    }

    /**
     * 移除事件监听器
     */
    public off<K extends keyof NetworkEventHandlers>(event: K, handler: NetworkEventHandlers[K]): void {
        const handlers = this._eventHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * 触发事件
     */
    private emit<K extends keyof NetworkEventHandlers>(event: K, ...args: Parameters<NetworkEventHandlers[K]>): void {
        const handlers = this._eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    (handler as (...args: Parameters<NetworkEventHandlers[K]>) => void)(...args);
                } catch (error) {
                    logger.error(`事件处理器错误 (${event}):`, error);
                }
            });
        }
    }

    /**
     * 批量同步组件
     */
    public async syncComponents<T extends INetworkSyncable>(updates: Array<{
        entityId: number;
        component: T;
    }>): Promise<{ success: number; failed: number }> {
        let successCount = 0;
        let failedCount = 0;

        const promises = updates.map(async ({ entityId, component }) => {
            try {
                const success = await this.syncComponent(entityId, component);
                if (success) {
                    successCount++;
                } else {
                    failedCount++;
                }
            } catch (error) {
                logger.error(`批量同步组件失败 Entity ${entityId}:`, error);
                failedCount++;
            }
        });

        await Promise.all(promises);
        
        logger.debug(`批量同步完成: 成功 ${successCount}, 失败 ${failedCount}`);
        return { success: successCount, failed: failedCount };
    }

    /**
     * 获取客户端统计信息
     */
    public getStats(): {
        connectionState: string;
        playerId?: number;
        roomId?: string;
        rtt: number;
        reconnectAttempts: number;
        maxReconnectAttempts: number;
        componentCallbacks: number;
    } {
        return {
            connectionState: this._connectionState,
            playerId: this._playerId,
            roomId: this._roomId,
            rtt: this._rtt,
            reconnectAttempts: this._reconnectAttempts,
            maxReconnectAttempts: this._maxReconnectAttempts,
            componentCallbacks: this._componentUpdateCallbacks.size
        };
    }
}