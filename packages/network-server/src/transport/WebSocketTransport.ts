/**
 * WebSocket传输层服务端实现
 */
import WebSocket, { WebSocketServer } from 'ws';
import { createLogger, Core } from '@esengine/ecs-framework';
import { 
    ITransport, 
    ITransportClientInfo, 
    ITransportConfig,
    ConnectionState,
    EventEmitter
} from '@esengine/network-shared';
import * as crypto from 'crypto';

/**
 * WebSocket传输层实现
 */
export class WebSocketTransport extends EventEmitter implements ITransport {
    private logger = createLogger('WebSocketTransport');
    private server?: WebSocketServer;
    private clients: Map<string, WebSocket> = new Map();
    private clientInfo: Map<string, ITransportClientInfo> = new Map();
    private config: ITransportConfig;
    private isRunning = false;

    /**
     * 连接事件处理器
     */
    private connectHandlers: ((clientInfo: ITransportClientInfo) => void)[] = [];
    
    /**
     * 断开连接事件处理器
     */
    private disconnectHandlers: ((clientId: string, reason?: string) => void)[] = [];
    
    /**
     * 消息接收事件处理器
     */
    private messageHandlers: ((clientId: string, data: ArrayBuffer | string) => void)[] = [];
    
    /**
     * 错误事件处理器
     */
    private errorHandlers: ((error: Error) => void)[] = [];

    /**
     * 构造函数
     */
    constructor(config: ITransportConfig) {
        super();
        this.config = {
            maxConnections: 1000,
            heartbeatInterval: 30000,
            connectionTimeout: 60000,
            maxMessageSize: 1024 * 1024, // 1MB
            compression: true,
            ...config
        };
    }

    /**
     * 启动传输层
     */
    async start(port: number, host?: string): Promise<void> {
        if (this.isRunning) {
            this.logger.warn('WebSocket传输层已在运行');
            return;
        }

        try {
            this.server = new WebSocketServer({
                port,
                host: host || '0.0.0.0',
                maxPayload: this.config.maxMessageSize,
                perMessageDeflate: this.config.compression ? {
                    threshold: 1024,
                    concurrencyLimit: 10,
                    clientNoContextTakeover: false,
                    serverNoContextTakeover: false
                } : false
            });

            this.setupServerEvents();
            this.isRunning = true;

            this.logger.info(`WebSocket服务器已启动: ${host || '0.0.0.0'}:${port}`);
            this.logger.info(`最大连接数: ${this.config.maxConnections}`);
            this.logger.info(`压缩: ${this.config.compression ? '启用' : '禁用'}`);

        } catch (error) {
            this.logger.error('启动WebSocket服务器失败:', error);
            throw error;
        }
    }

    /**
     * 停止传输层
     */
    async stop(): Promise<void> {
        if (!this.isRunning || !this.server) {
            return;
        }

        return new Promise((resolve) => {
            // 断开所有客户端连接
            for (const [clientId, ws] of this.clients) {
                ws.close(1001, '服务器关闭');
                this.handleClientDisconnect(clientId, '服务器关闭');
            }

            // 关闭服务器
            this.server!.close(() => {
                this.isRunning = false;
                this.server = undefined;
                this.logger.info('WebSocket服务器已停止');
                resolve();
            });
        });
    }

    /**
     * 发送数据到指定客户端
     */
    send(clientId: string, data: ArrayBuffer | string): void {
        const ws = this.clients.get(clientId);
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            this.logger.warn(`尝试向未连接的客户端发送消息: ${clientId}`);
            return;
        }

        try {
            ws.send(data);
        } catch (error) {
            this.logger.error(`发送消息到客户端 ${clientId} 失败:`, error);
            this.handleError(error as Error);
        }
    }

    /**
     * 广播数据到所有客户端
     */
    broadcast(data: ArrayBuffer | string, exclude?: string[]): void {
        const excludeSet = new Set(exclude || []);
        
        for (const [clientId, ws] of this.clients) {
            if (excludeSet.has(clientId) || ws.readyState !== WebSocket.OPEN) {
                continue;
            }

            try {
                ws.send(data);
            } catch (error) {
                this.logger.error(`广播消息到客户端 ${clientId} 失败:`, error);
                this.handleError(error as Error);
            }
        }
    }

    /**
     * 监听客户端连接事件
     */
    onConnect(handler: (clientInfo: ITransportClientInfo) => void): void {
        this.connectHandlers.push(handler);
    }

    /**
     * 监听客户端断开事件
     */
    onDisconnect(handler: (clientId: string, reason?: string) => void): void {
        this.disconnectHandlers.push(handler);
    }

    /**
     * 监听消息接收事件
     */
    onMessage(handler: (clientId: string, data: ArrayBuffer | string) => void): void {
        this.messageHandlers.push(handler);
    }

    /**
     * 监听错误事件
     */
    onError(handler: (error: Error) => void): void {
        this.errorHandlers.push(handler);
    }

    /**
     * 获取连接的客户端数量
     */
    getClientCount(): number {
        return this.clients.size;
    }

    /**
     * 检查客户端是否连接
     */
    isClientConnected(clientId: string): boolean {
        const ws = this.clients.get(clientId);
        return ws !== undefined && ws.readyState === WebSocket.OPEN;
    }

    /**
     * 断开指定客户端
     */
    disconnectClient(clientId: string, reason?: string): void {
        const ws = this.clients.get(clientId);
        if (ws) {
            ws.close(1000, reason || '服务器主动断开');
            this.handleClientDisconnect(clientId, reason);
        }
    }

    /**
     * 获取客户端信息
     */
    getClientInfo(clientId: string): ITransportClientInfo | undefined {
        return this.clientInfo.get(clientId);
    }

    /**
     * 获取所有客户端信息
     */
    getAllClients(): ITransportClientInfo[] {
        return Array.from(this.clientInfo.values());
    }

    /**
     * 设置服务器事件监听
     */
    private setupServerEvents(): void {
        if (!this.server) return;

        this.server.on('connection', (ws, request) => {
            this.handleNewConnection(ws, request);
        });

        this.server.on('error', (error) => {
            this.logger.error('WebSocket服务器错误:', error);
            this.handleError(error);
        });

        this.server.on('close', () => {
            this.logger.info('WebSocket服务器已关闭');
        });
    }

    /**
     * 处理新客户端连接
     */
    private handleNewConnection(ws: WebSocket, request: any): void {
        // 检查连接数限制
        if (this.clients.size >= this.config.maxConnections!) {
            this.logger.warn('达到最大连接数限制，拒绝新连接');
            ws.close(1013, '服务器繁忙');
            return;
        }

        const clientId = crypto.randomUUID();
        const clientInfo: ITransportClientInfo = {
            id: clientId,
            remoteAddress: request.socket.remoteAddress || 'unknown',
            connectTime: Date.now(),
            userAgent: request.headers['user-agent'],
            headers: request.headers
        };

        // 存储客户端连接和信息
        this.clients.set(clientId, ws);
        this.clientInfo.set(clientId, clientInfo);

        // 设置WebSocket事件监听
        this.setupClientEvents(ws, clientId);

        this.logger.info(`新客户端连接: ${clientId} from ${clientInfo.remoteAddress}`);
        
        // 触发连接事件
        this.connectHandlers.forEach(handler => {
            try {
                handler(clientInfo);
            } catch (error) {
                this.logger.error('连接事件处理器错误:', error);
            }
        });
    }

    /**
     * 设置客户端WebSocket事件监听
     */
    private setupClientEvents(ws: WebSocket, clientId: string): void {
        // 消息接收
        ws.on('message', (data) => {
            this.handleClientMessage(clientId, data);
        });

        // 连接关闭
        ws.on('close', (code, reason) => {
            this.handleClientDisconnect(clientId, reason?.toString() || `Code: ${code}`);
        });

        // 错误处理
        ws.on('error', (error) => {
            this.logger.error(`客户端 ${clientId} WebSocket错误:`, error);
            this.handleError(error);
        });

        // Pong响应（心跳）
        ws.on('pong', () => {
            // 记录客户端响应心跳
            const info = this.clientInfo.get(clientId);
            if (info) {
                // 可以更新延迟信息
            }
        });

        // 设置连接超时
        if (this.config.connectionTimeout) {
            Core.schedule(this.config.connectionTimeout / 1000, false, this, () => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.ping();
                }
            });
        }
    }

    /**
     * 处理客户端消息
     */
    private handleClientMessage(clientId: string, data: WebSocket.Data): void {
        try {
            // 检查是否为有效的应用消息
            if (!this.isApplicationMessage(data)) {
                this.logger.debug(`忽略非应用消息 (${clientId}): ${typeof data} ${data instanceof ArrayBuffer ? data.byteLength : data.toString().length} bytes`);
                return;
            }
            
            const message = data instanceof ArrayBuffer ? data : new TextEncoder().encode(data.toString()).buffer;
            
            // 触发消息事件
            this.messageHandlers.forEach(handler => {
                try {
                    handler(clientId, message);
                } catch (error) {
                    this.logger.error('消息事件处理器错误:', error);
                }
            });

        } catch (error) {
            this.logger.error(`处理客户端 ${clientId} 消息失败:`, error);
            this.handleError(error as Error);
        }
    }

    /**
     * 检查是否为有效的应用消息
     */
    private isApplicationMessage(data: WebSocket.Data): boolean {
        try {
            // 转换为字符串进行检查
            const jsonString = data instanceof ArrayBuffer 
                ? new TextDecoder().decode(data) 
                : data.toString();
            
            // 基本长度检查 - 空消息或过短消息通常不是应用消息
            if (!jsonString || jsonString.length < 10) {
                return false;
            }
            
            // 尝试解析JSON
            const parsed = JSON.parse(jsonString);
            
            // 检查是否有基本的消息结构
            return parsed && 
                   typeof parsed === 'object' && 
                   (parsed.type || parsed.messageId || parsed.data);
                   
        } catch (error) {
            // JSON解析失败，可能是握手数据或其他非JSON消息
            return false;
        }
    }

    /**
     * 处理客户端断开连接
     */
    private handleClientDisconnect(clientId: string, reason?: string): void {
        // 清理客户端数据
        this.clients.delete(clientId);
        this.clientInfo.delete(clientId);

        this.logger.info(`客户端断开连接: ${clientId}, 原因: ${reason || '未知'}`);

        // 触发断开连接事件
        this.disconnectHandlers.forEach(handler => {
            try {
                handler(clientId, reason);
            } catch (error) {
                this.logger.error('断开连接事件处理器错误:', error);
            }
        });
    }

    /**
     * 处理错误
     */
    private handleError(error: Error): void {
        this.errorHandlers.forEach(handler => {
            try {
                handler(error);
            } catch (handlerError) {
                this.logger.error('错误事件处理器错误:', handlerError);
            }
        });
    }

    /**
     * 发送心跳到所有客户端
     */
    public sendHeartbeat(): void {
        for (const [clientId, ws] of this.clients) {
            if (ws.readyState === WebSocket.OPEN) {
                try {
                    ws.ping();
                } catch (error) {
                    this.logger.error(`发送心跳到客户端 ${clientId} 失败:`, error);
                }
            }
        }
    }

    /**
     * 获取传输层统计信息
     */
    public getStats() {
        return {
            isRunning: this.isRunning,
            clientCount: this.clients.size,
            maxConnections: this.config.maxConnections,
            compressionEnabled: this.config.compression,
            clients: this.getAllClients()
        };
    }
}