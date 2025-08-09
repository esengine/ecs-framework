import WebSocket, { WebSocketServer } from 'ws';
import { NetworkConnection } from './NetworkConnection';
import { v4 as uuidv4 } from 'uuid';
import { SyncVarUpdateMessage } from '../Messaging/MessageTypes';
import { SyncVarMessageHandler } from '../SyncVar/SyncVarMessageHandler';
import { SyncVarSyncScheduler } from '../SyncVar/SyncVarSyncScheduler';
import { MessageHandler } from '../Messaging/MessageHandler';
import { NetworkPerformanceMonitor } from './NetworkPerformanceMonitor';
import { createLogger } from '@esengine/ecs-framework';

/**
 * 服务端事件接口
 */
export interface NetworkServerEvents {
    clientConnected: (connection: NetworkConnection) => void;
    clientDisconnected: (connection: NetworkConnection, reason?: string) => void;
    clientMessage: (connection: NetworkConnection, data: Uint8Array) => void;
    serverStarted: (port: number, host: string) => void;
    serverStopped: () => void;
    error: (error: Error) => void;
}

/**
 * 网络服务端
 * 
 * 管理WebSocket服务器，处理客户端连接和消息分发
 * 支持多客户端连接，提供广播和单播功能
 */
export class NetworkServer {
    private static readonly _logger = createLogger('NetworkServer');
    private _wss: WebSocketServer | null = null;
    private _connections: Map<string, NetworkConnection> = new Map();
    private _isRunning: boolean = false;
    private _port: number = 0;
    private _host: string = '';
    private _startTime: number = 0;
    private _eventHandlers: Map<keyof NetworkServerEvents, Function[]> = new Map();
    
    // SyncVar相关组件
    private _syncVarHandler: SyncVarMessageHandler;
    private _syncScheduler: SyncVarSyncScheduler;
    private _messageHandler: MessageHandler;
    
    // 性能监控
    private _performanceMonitor: NetworkPerformanceMonitor;
    
    // 服务器配置
    private static readonly MAX_CONNECTIONS = 100;
    private static readonly CONNECTION_TIMEOUT = 60000; // 60秒
    
    constructor() {
        // 初始化SyncVar组件
        this._syncVarHandler = new SyncVarMessageHandler();
        this._syncScheduler = SyncVarSyncScheduler.Instance;
        this._messageHandler = MessageHandler.Instance;
        this._performanceMonitor = NetworkPerformanceMonitor.Instance;
        
        // 注册SyncVar消息处理器
        this._messageHandler.registerHandler(
            400, // MessageType.SYNC_VAR_UPDATE
            SyncVarUpdateMessage,
            this._syncVarHandler,
            0
        );
        
        // 设置SyncVar消息发送回调
        this._syncScheduler.setMessageSendCallback(async (message: SyncVarUpdateMessage) => {
            await this.broadcastSyncVarMessage(message);
        });
    }
    
    /**
     * 启动服务器
     * 
     * @param port - 监听端口
     * @param host - 监听地址
     */
    public async start(port: number, host: string = '0.0.0.0'): Promise<void> {
        if (this._isRunning) {
            throw new Error('服务器已经在运行');
        }
        
        return new Promise((resolve, reject) => {
            try {
                this._wss = new WebSocketServer({
                    port,
                    host,
                    maxPayload: 16 * 1024 * 1024, // 16MB
                    perMessageDeflate: true,
                    clientTracking: true
                });
                
                this._wss.on('connection', (ws: WebSocket, request) => {
                    this.handleNewConnection(ws, request);
                });
                
                this._wss.on('listening', () => {
                    this._isRunning = true;
                    this._port = port;
                    this._host = host;
                    this._startTime = Date.now();
                    
                    // 启动SyncVar同步调度器
                    this.startSyncVarScheduler();
                    
                    // 启动性能监控
                    this.startPerformanceMonitoring();
                    
                    NetworkServer._logger.info(`服务器启动成功: ${host}:${port}`);
                    this.emit('serverStarted', port, host);
                    resolve();
                });
                
                this._wss.on('error', (error) => {
                    NetworkServer._logger.error('服务器错误:', error);
                    this.emit('error', error);
                    
                    if (!this._isRunning) {
                        reject(error);
                    }
                });
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * 停止服务器
     */
    public async stop(): Promise<void> {
        if (!this._isRunning || !this._wss) {
            return;
        }
        
        return new Promise((resolve) => {
            // 关闭所有客户端连接
            const connections = Array.from(this._connections.values());
            connections.forEach(connection => {
                connection.close('Server shutting down');
            });
            this._connections.clear();
            
            // 停止SyncVar同步调度器
            this.stopSyncVarScheduler();
            
            // 停止性能监控
            this.stopPerformanceMonitoring();
            
            // 关闭WebSocket服务器
            this._wss!.close(() => {
                this._isRunning = false;
                this._wss = null;
                this._port = 0;
                this._host = '';
                this._startTime = 0;
                
                NetworkServer._logger.info('服务器已停止');
                this.emit('serverStopped');
                resolve();
            });
        });
    }
    
    /**
     * 处理新的客户端连接
     * 
     * @param ws - WebSocket连接
     * @param request - HTTP请求对象
     */
    private handleNewConnection(ws: WebSocket, request: any): void {
        // 检查连接数限制
        if (this._connections.size >= NetworkServer.MAX_CONNECTIONS) {
            NetworkServer._logger.warn('达到最大连接数限制，拒绝新连接');
            ws.close(1013, 'Server full');
            return;
        }
        
        // 生成连接ID和获取客户端地址
        const connectionId = uuidv4();
        const clientAddress = request.socket.remoteAddress || 'unknown';
        
        // 创建连接对象
        const connection = new NetworkConnection(ws, connectionId, clientAddress);
        
        // 设置连接事件监听
        connection.on('connected', () => {
            this._connections.set(connectionId, connection);
            NetworkServer._logger.info(`客户端连接: ${connectionId} (${clientAddress})`);
            this.emit('clientConnected', connection);
        });
        
        connection.on('disconnected', (reason) => {
            this._connections.delete(connectionId);
            NetworkServer._logger.info(`客户端断开: ${connectionId} (${reason})`);
            this.emit('clientDisconnected', connection, reason);
        });
        
        connection.on('message', async (data) => {
            this.recordMessagePerformance(data, false);
            this.emit('clientMessage', connection, data);
            
            // 自动处理消息
            await this._messageHandler.handleRawMessage(data, connection);
        });
        
        connection.on('error', (error) => {
            NetworkServer._logger.error(`连接错误 ${connectionId}:`, error);
            this.emit('error', error);
        });
    }
    
    /**
     * 向指定客户端发送消息
     * 
     * @param connectionId - 连接ID
     * @param data - 消息数据
     * @returns 是否发送成功
     */
    public sendToClient(connectionId: string, data: Uint8Array): boolean {
        const connection = this._connections.get(connectionId);
        if (!connection) {
            NetworkServer._logger.warn(`连接不存在: ${connectionId}`);
            return false;
        }
        
        const success = connection.send(data);
        if (success) {
            this.recordMessagePerformance(data, true);
        }
        return success;
    }
    
    /**
     * 广播消息给所有客户端
     * 
     * @param data - 消息数据
     * @param excludeConnection - 排除的连接ID（可选）
     * @returns 成功发送的连接数
     */
    public broadcast(data: Uint8Array, excludeConnection?: string): number {
        let successCount = 0;
        
        for (const [connectionId, connection] of this._connections) {
            if (excludeConnection && connectionId === excludeConnection) {
                continue;
            }
            
            if (connection.send(data)) {
                successCount++;
                this.recordMessagePerformance(data, true);
            }
        }
        
        return successCount;
    }
    
    /**
     * 向多个指定客户端发送消息
     * 
     * @param connectionIds - 连接ID数组
     * @param data - 消息数据
     * @returns 成功发送的连接数
     */
    public sendToMultipleClients(connectionIds: string[], data: Uint8Array): number {
        let successCount = 0;
        
        connectionIds.forEach(connectionId => {
            if (this.sendToClient(connectionId, data)) {
                successCount++;
            }
        });
        
        return successCount;
    }
    
    /**
     * 断开指定客户端连接
     * 
     * @param connectionId - 连接ID
     * @param reason - 断开原因
     * @returns 是否成功断开
     */
    public disconnectClient(connectionId: string, reason: string = 'Disconnected by server'): boolean {
        const connection = this._connections.get(connectionId);
        if (!connection) {
            return false;
        }
        
        connection.close(reason);
        return true;
    }
    
    /**
     * 获取指定客户端连接
     * 
     * @param connectionId - 连接ID
     * @returns 连接对象
     */
    public getConnection(connectionId: string): NetworkConnection | null {
        return this._connections.get(connectionId) || null;
    }
    
    /**
     * 获取所有活跃连接
     * 
     * @returns 连接数组
     */
    public getAllConnections(): NetworkConnection[] {
        return Array.from(this._connections.values());
    }
    
    /**
     * 获取活跃连接的ID列表
     * 
     * @returns 连接ID数组
     */
    public getConnectionIds(): string[] {
        return Array.from(this._connections.keys());
    }
    
    /**
     * 添加事件监听器
     * 
     * @param event - 事件名称
     * @param handler - 事件处理函数
     */
    public on<K extends keyof NetworkServerEvents>(
        event: K, 
        handler: NetworkServerEvents[K]
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
    public off<K extends keyof NetworkServerEvents>(
        event: K, 
        handler: NetworkServerEvents[K]
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
    private emit<K extends keyof NetworkServerEvents>(
        event: K,
        ...args: Parameters<NetworkServerEvents[K]>
    ): void {
        const handlers = this._eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(...args);
                } catch (error) {
                    NetworkServer._logger.error(`事件处理器错误 (${event}):`, error);
                }
            });
        }
    }
    
    /**
     * 检查服务器是否正在运行
     */
    public get isRunning(): boolean {
        return this._isRunning;
    }
    
    /**
     * 获取当前连接数
     */
    public get connectionCount(): number {
        return this._connections.size;
    }
    
    /**
     * 获取监听端口
     */
    public get port(): number {
        return this._port;
    }
    
    /**
     * 获取监听地址
     */
    public get host(): string {
        return this._host;
    }
    
    /**
     * 获取服务器运行时间（毫秒）
     */
    public get uptime(): number {
        return this._startTime > 0 ? Date.now() - this._startTime : 0;
    }
    
    /**
     * 启动SyncVar同步调度器
     */
    private startSyncVarScheduler(): void {
        try {
            this._syncScheduler.start();
            NetworkServer._logger.info('SyncVar同步调度器已启动');
        } catch (error) {
            NetworkServer._logger.error('启动SyncVar调度器失败:', error);
        }
    }
    
    /**
     * 停止SyncVar同步调度器
     */
    private stopSyncVarScheduler(): void {
        try {
            this._syncScheduler.stop();
            NetworkServer._logger.info('SyncVar同步调度器已停止');
        } catch (error) {
            NetworkServer._logger.error('停止SyncVar调度器失败:', error);
        }
    }
    
    /**
     * 广播SyncVar更新消息
     * 
     * @param message - SyncVar更新消息
     */
    public async broadcastSyncVarMessage(message: SyncVarUpdateMessage): Promise<void> {
        try {
            const serializedMessage = message.serialize();
            const successCount = this.broadcast(serializedMessage);
            
            NetworkServer._logger.info(`广播SyncVar消息: ${message.networkId}.${message.componentType}, 成功发送到 ${successCount} 个客户端`);
        } catch (error) {
            NetworkServer._logger.error('广播SyncVar消息失败:', error);
        }
    }
    
    /**
     * 发送SyncVar消息到指定客户端
     * 
     * @param connectionId - 连接ID
     * @param message - SyncVar更新消息
     */
    public async sendSyncVarMessage(connectionId: string, message: SyncVarUpdateMessage): Promise<boolean> {
        try {
            const serializedMessage = message.serialize();
            return this.sendToClient(connectionId, serializedMessage);
        } catch (error) {
            NetworkServer._logger.error(`发送SyncVar消息到客户端 ${connectionId} 失败:`, error);
            return false;
        }
    }
    
    /**
     * 发送SyncVar消息到指定客户端列表（排除某个客户端）
     * 
     * @param message - SyncVar更新消息
     * @param excludeConnectionId - 要排除的连接ID
     */
    public async broadcastSyncVarMessageExcept(message: SyncVarUpdateMessage, excludeConnectionId: string): Promise<number> {
        try {
            const serializedMessage = message.serialize();
            const allConnections = Array.from(this._connections.keys());
            const targetConnections = allConnections.filter(id => id !== excludeConnectionId);
            
            return this.sendToMultipleClients(targetConnections, serializedMessage);
        } catch (error) {
            NetworkServer._logger.error('广播SyncVar消息（排除指定客户端）失败:', error);
            return 0;
        }
    }
    
    /**
     * 获取SyncVar调度器统计信息
     */
    public getSyncVarStats(): any {
        return this._syncScheduler.getStats();
    }
    
    /**
     * 配置SyncVar同步调度器
     */
    public configureSyncVarScheduler(config: any): void {
        this._syncScheduler.configure(config);
    }
    
    /**
     * 启动性能监控
     */
    private startPerformanceMonitoring(): void {
        try {
            this._performanceMonitor.startMonitoring();
            NetworkServer._logger.info('性能监控已启动');
        } catch (error) {
            NetworkServer._logger.error('启动性能监控失败:', error);
        }
    }
    
    /**
     * 停止性能监控
     */
    private stopPerformanceMonitoring(): void {
        try {
            this._performanceMonitor.stopMonitoring();
            NetworkServer._logger.info('性能监控已停止');
        } catch (error) {
            NetworkServer._logger.error('停止性能监控失败:', error);
        }
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
        this._performanceMonitor.updateActiveConnections(this._connections.size);
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
    
    /**
     * 获取服务器统计信息
     */
    public getStats(): {
        isRunning: boolean;
        connectionCount: number;
        maxConnections: number;
        port: number;
        host: string;
        uptime: number;
        connections: Array<{
            connectionId: string;
            address: string;
            connectedTime: number;
            isAlive: boolean;
        }>;
    } {
        const connectionStats = Array.from(this._connections.values()).map(conn => {
            const stats = conn.getStats();
            return {
                connectionId: stats.connectionId,
                address: stats.address,
                connectedTime: stats.connectedTime,
                isAlive: stats.isAlive
            };
        });
        
        return {
            isRunning: this._isRunning,
            connectionCount: this._connections.size,
            maxConnections: NetworkServer.MAX_CONNECTIONS,
            port: this._port,
            host: this._host,
            uptime: this.uptime,
            connections: connectionStats
        };
    }
}