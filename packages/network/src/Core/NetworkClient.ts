import WebSocket from 'isomorphic-ws';
import { NetworkConnection } from './NetworkConnection';
import { SyncVarUpdateMessage } from '../Messaging/MessageTypes';
import { SyncVarMessageHandler } from '../SyncVar/SyncVarMessageHandler';
import { MessageHandler } from '../Messaging/MessageHandler';
import { NetworkPerformanceMonitor } from './NetworkPerformanceMonitor';
import { createLogger } from '@esengine/ecs-framework';

/**
 * 客户端事件接口
 */
export interface NetworkClientEvents {
    connected: () => void;
    disconnected: (reason?: string) => void;
    message: (data: Uint8Array) => void;
    error: (error: Error) => void;
    reconnecting: (attempt: number) => void;
    reconnected: () => void;
}

/**
 * 网络客户端
 * 
 * 管理与服务端的WebSocket连接，支持自动重连
 * 提供消息发送和接收功能
 */
export class NetworkClient {
    private static readonly logger = createLogger('NetworkClient');
    private _connection: NetworkConnection | null = null;
    private _url: string = '';
    private _isConnected: boolean = false;
    private _isConnecting: boolean = false;
    private _connectTime: number = 0;
    private _eventHandlers: Map<keyof NetworkClientEvents, Function[]> = new Map();
    
    // SyncVar相关组件
    private _syncVarHandler: SyncVarMessageHandler;
    private _messageHandler: MessageHandler;
    
    // 性能监控
    private _performanceMonitor: NetworkPerformanceMonitor;
    
    // 重连配置
    private _autoReconnect: boolean = true;
    private _reconnectAttempts: number = 0;
    private _maxReconnectAttempts: number = 5;
    private _reconnectDelay: number = 1000; // 初始重连延迟1秒
    private _maxReconnectDelay: number = 30000; // 最大重连延迟30秒
    private _reconnectTimer: NodeJS.Timeout | null = null;
    
    constructor() {
        // 初始化SyncVar组件
        this._syncVarHandler = new SyncVarMessageHandler();
        this._messageHandler = MessageHandler.Instance;
        this._performanceMonitor = NetworkPerformanceMonitor.Instance;
        
        // 注册SyncVar消息处理器
        this._messageHandler.registerHandler(
            400, // MessageType.SYNC_VAR_UPDATE
            SyncVarUpdateMessage,
            this._syncVarHandler,
            0
        );
    }
    
    /**
     * 连接到服务端
     * 
     * @param url - 服务端WebSocket地址
     * @param autoReconnect - 是否启用自动重连
     * @returns Promise<void>
     */
    public async connect(url: string, autoReconnect: boolean = true): Promise<void> {
        if (this._isConnected || this._isConnecting) {
            throw new Error('客户端已连接或正在连接中');
        }
        
        this._url = url;
        this._autoReconnect = autoReconnect;
        this._isConnecting = true;
        this._reconnectAttempts = 0;
        
        return this.attemptConnection();
    }
    
    /**
     * 尝试建立连接
     * 
     * @returns Promise<void>
     */
    private async attemptConnection(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const ws = new WebSocket(this._url);
                
                // 设置连接超时
                const connectTimeout = setTimeout(() => {
                    ws.close();
                    this.handleConnectionFailed(new Error('连接超时'), resolve, reject);
                }, 10000);
                
                ws.onopen = () => {
                    clearTimeout(connectTimeout);
                    this.handleConnectionSuccess(ws, resolve);
                };
                
                ws.onerror = (event) => {
                    clearTimeout(connectTimeout);
                    const error = new Error(`连接失败: ${event.toString()}`);
                    this.handleConnectionFailed(error, resolve, reject);
                };
                
            } catch (error) {
                this.handleConnectionFailed(error as Error, resolve, reject);
            }
        });
    }
    
    /**
     * 处理连接成功
     * 
     * @param ws - WebSocket连接
     * @param resolve - Promise resolve函数
     */
    private handleConnectionSuccess(ws: WebSocket, resolve: () => void): void {
        this._connection = new NetworkConnection(ws, 'client', this._url);
        this._isConnected = true;
        this._isConnecting = false;
        this._connectTime = Date.now();
        this._reconnectAttempts = 0;
        
        // 设置连接事件监听
        this._connection.on('connected', () => {
            NetworkClient.logger.info(`连接成功: ${this._url}`);
            this.emit('connected');
            
            // 如果这是重连，触发重连成功事件
            if (this._reconnectAttempts > 0) {
                this.emit('reconnected');
            }
        });
        
        this._connection.on('disconnected', (reason) => {
            NetworkClient.logger.info(`连接断开: ${reason}`);
            this.handleDisconnection(reason);
        });
        
        this._connection.on('message', async (data) => {
            this.recordMessagePerformance(data, false);
            this.emit('message', data);
            
            // 自动处理消息
            await this._messageHandler.handleRawMessage(data);
        });
        
        this._connection.on('error', (error) => {
            NetworkClient.logger.error('连接错误:', error);
            this.emit('error', error);
        });
        
        resolve();
    }
    
    /**
     * 处理连接失败
     * 
     * @param error - 错误对象
     * @param resolve - Promise resolve函数
     * @param reject - Promise reject函数
     */
    private handleConnectionFailed(error: Error, resolve: () => void, reject: (error: Error) => void): void {
        this._isConnecting = false;
        
        if (this._autoReconnect && this._reconnectAttempts < this._maxReconnectAttempts) {
            this.scheduleReconnection(resolve, reject);
        } else {
            this._autoReconnect = false;
            this.emit('error', error);
            reject(error);
        }
    }
    
    /**
     * 处理连接断开
     * 
     * @param reason - 断开原因
     */
    private handleDisconnection(reason?: string): void {
        const wasConnected = this._isConnected;
        
        this._isConnected = false;
        this._connection = null;
        this._connectTime = 0;
        
        this.emit('disconnected', reason);
        
        // 如果启用自动重连且之前是连接状态
        if (this._autoReconnect && wasConnected && this._reconnectAttempts < this._maxReconnectAttempts) {
            this.scheduleReconnection();
        }
    }
    
    /**
     * 安排重连
     * 
     * @param resolve - Promise resolve函数（可选）
     * @param reject - Promise reject函数（可选）
     */
    private scheduleReconnection(resolve?: () => void, reject?: (error: Error) => void): void {
        this._reconnectAttempts++;
        
        // 计算重连延迟（指数退避）
        const delay = Math.min(
            this._reconnectDelay * Math.pow(2, this._reconnectAttempts - 1),
            this._maxReconnectDelay
        );
        
        NetworkClient.logger.info(`${delay}ms后尝试重连 (${this._reconnectAttempts}/${this._maxReconnectAttempts})`);
        this.emit('reconnecting', this._reconnectAttempts);
        
        this._reconnectTimer = setTimeout(async () => {
            this._reconnectTimer = null;
            this._isConnecting = true;
            
            try {
                await this.attemptConnection();
                if (resolve) resolve();
            } catch (error) {
                if (reject) reject(error as Error);
            }
        }, delay);
    }
    
    /**
     * 断开连接
     * 
     * @param reason - 断开原因
     */
    public async disconnect(reason: string = 'Disconnected by client'): Promise<void> {
        // 停止自动重连
        this._autoReconnect = false;
        
        // 清除重连定时器
        if (this._reconnectTimer) {
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = null;
        }
        
        // 关闭连接
        if (this._connection) {
            this._connection.close(reason);
        }
        
        // 重置状态
        this._isConnected = false;
        this._isConnecting = false;
        this._connection = null;
        this._connectTime = 0;
        this._reconnectAttempts = 0;
    }
    
    /**
     * 发送消息
     * 
     * @param data - 要发送的数据
     * @returns 是否发送成功
     */
    public send(data: Uint8Array): boolean {
        if (!this._connection || !this._isConnected) {
            NetworkClient.logger.warn('未连接，无法发送数据');
            return false;
        }
        
        const success = this._connection.send(data);
        if (success) {
            this.recordMessagePerformance(data, true);
        }
        return success;
    }
    
    /**
     * 手动触发重连
     * 
     * @returns Promise<void>
     */
    public async reconnect(): Promise<void> {
        if (this._isConnected) {
            await this.disconnect('Manual reconnect');
        }
        
        this._autoReconnect = true;
        this._reconnectAttempts = 0;
        
        return this.connect(this._url, this._autoReconnect);
    }
    
    /**
     * 设置自动重连配置
     * 
     * @param enabled - 是否启用自动重连
     * @param maxAttempts - 最大重连次数
     * @param initialDelay - 初始重连延迟（毫秒）
     * @param maxDelay - 最大重连延迟（毫秒）
     */
    public setReconnectConfig(
        enabled: boolean = true,
        maxAttempts: number = 5,
        initialDelay: number = 1000,
        maxDelay: number = 30000
    ): void {
        this._autoReconnect = enabled;
        this._maxReconnectAttempts = maxAttempts;
        this._reconnectDelay = initialDelay;
        this._maxReconnectDelay = maxDelay;
    }
    
    /**
     * 添加事件监听器
     * 
     * @param event - 事件名称
     * @param handler - 事件处理函数
     */
    public on<K extends keyof NetworkClientEvents>(
        event: K, 
        handler: NetworkClientEvents[K]
    ): void {
        if (!this._eventHandlers.has(event)) {
            this._eventHandlers.set(event, []);
        }
        this._eventHandlers.get(event)!.push(handler);
    }
    
    /**
     * 移除事件监听器
     * 
     * @param event - 事件名称
     * @param handler - 事件处理函数
     */
    public off<K extends keyof NetworkClientEvents>(
        event: K, 
        handler: NetworkClientEvents[K]
    ): void {
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
     * 
     * @param event - 事件名称
     * @param args - 事件参数
     */
    private emit<K extends keyof NetworkClientEvents>(
        event: K,
        ...args: Parameters<NetworkClientEvents[K]>
    ): void {
        const handlers = this._eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(...args);
                } catch (error) {
                    NetworkClient.logger.error(`事件处理器错误 (${event}):`, error);
                }
            });
        }
    }
    
    /**
     * 检查是否已连接
     */
    public get isConnected(): boolean {
        return this._isConnected;
    }
    
    /**
     * 检查是否正在连接
     */
    public get isConnecting(): boolean {
        return this._isConnecting;
    }
    
    /**
     * 获取服务端URL
     */
    public get url(): string {
        return this._url;
    }
    
    /**
     * 获取连接时长（毫秒）
     */
    public get connectedTime(): number {
        return this._connectTime > 0 ? Date.now() - this._connectTime : 0;
    }
    
    /**
     * 获取重连次数
     */
    public get reconnectAttempts(): number {
        return this._reconnectAttempts;
    }
    
    /**
     * 获取连接对象
     */
    public get connection(): NetworkConnection | null {
        return this._connection;
    }
    
    /**
     * 获取客户端统计信息
     */
    public getStats(): {
        isConnected: boolean;
        isConnecting: boolean;
        url: string;
        connectedTime: number;
        reconnectAttempts: number;
        maxReconnectAttempts: number;
        autoReconnect: boolean;
        connectionStats?: ReturnType<NetworkConnection['getStats']>;
    } {
        return {
            isConnected: this._isConnected,
            isConnecting: this._isConnecting,
            url: this._url,
            connectedTime: this.connectedTime,
            reconnectAttempts: this._reconnectAttempts,
            maxReconnectAttempts: this._maxReconnectAttempts,
            autoReconnect: this._autoReconnect,
            connectionStats: this._connection ? this._connection.getStats() : undefined
        };
    }
    
    /**
     * 发送SyncVar更新消息到服务端
     * 
     * @param message - SyncVar更新消息
     * @returns 是否发送成功
     */
    public sendSyncVarMessage(message: SyncVarUpdateMessage): boolean {
        try {
            const serializedMessage = message.serialize();
            const success = this.send(serializedMessage);
            
            if (success) {
                NetworkClient.logger.debug(`发送SyncVar消息: ${message.networkId}.${message.componentType}`);
            } else {
                NetworkClient.logger.warn(`SyncVar消息发送失败: ${message.networkId}.${message.componentType}`);
            }
            
            return success;
        } catch (error) {
            NetworkClient.logger.error('发送SyncVar消息失赅:', error);
            return false;
        }
    }
    
    /**
     * 批量发送SyncVar更新消息
     * 
     * @param messages - SyncVar更新消息数组
     * @returns 成功发送的消息数量
     */
    public sendSyncVarMessages(messages: SyncVarUpdateMessage[]): number {
        let successCount = 0;
        
        for (const message of messages) {
            if (this.sendSyncVarMessage(message)) {
                successCount++;
            }
        }
        
        NetworkClient.logger.debug(`批量发送SyncVar消息: ${successCount}/${messages.length} 成功`);
        return successCount;
    }
    
    /**
     * 记录消息传输性能
     */
    private recordMessagePerformance(data: Uint8Array, sent: boolean): void {
        const size = data.length;
        if (sent) {
            this._performanceMonitor.recordDataTransfer(size, 0);
            this._performanceMonitor.recordMessageTransfer(1, 0);
        } else {
            this._performanceMonitor.recordDataTransfer(0, size);
            this._performanceMonitor.recordMessageTransfer(0, 1);
        }
        this._performanceMonitor.updateActiveConnections(this._isConnected ? 1 : 0);
    }
    
    /**
     * 获取性能监控数据
     */
    public getPerformanceMetrics(): any {
        return this._performanceMonitor.getCurrentMetrics();
    }
    
    /**
     * 获取性能报告
     */
    public getPerformanceReport(timeRangeMs?: number): any {
        return this._performanceMonitor.generateReport(timeRangeMs);
    }
}