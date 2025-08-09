import WebSocket from 'isomorphic-ws';
import { createLogger } from '@esengine/ecs-framework';

/**
 * 网络连接状态
 */
export enum ConnectionState {
    Disconnected = 'disconnected',
    Connecting = 'connecting', 
    Connected = 'connected',
    Disconnecting = 'disconnecting'
}

/**
 * 网络连接事件
 */
export interface NetworkConnectionEvents {
    connected: () => void;
    disconnected: (reason?: string, code?: number) => void;
    message: (data: Uint8Array) => void;
    error: (error: Error) => void;
    reconnecting: (attempt: number) => void;
    reconnected: () => void;
    reconnectFailed: (error: Error) => void;
}

/**
 * 网络连接抽象类
 * 
 * 封装WebSocket连接，提供统一的连接管理接口
 * 支持二进制消息传输，集成心跳检测
 */
export class NetworkConnection {
    private static readonly logger = createLogger('NetworkConnection');
    private _ws: WebSocket | null = null;
    private _state: ConnectionState = ConnectionState.Disconnected;
    private _connectionId: string = '';
    private _address: string = '';
    private _connectedTime: number = 0;
    private _lastPingTime: number = 0;
    private _pingInterval: NodeJS.Timeout | null = null;
    private _eventHandlers: Map<keyof NetworkConnectionEvents, Function[]> = new Map();
    
    // 重连相关属性
    private _reconnectAttempts: number = 0;
    private _maxReconnectAttempts: number = 5;
    private _reconnectInterval: number = 1000; // 1秒
    private _maxReconnectInterval: number = 30000; // 30秒
    private _reconnectTimer: NodeJS.Timeout | null = null;
    private _enableAutoReconnect: boolean = true;
    private _originalUrl: string = '';
    
    // 心跳配置
    private static readonly PING_INTERVAL = 30000; // 30秒
    private static readonly PING_TIMEOUT = 5000;   // 5秒超时
    
    // 错误分类
    private static readonly RECOVERABLE_CODES = [1006, 1011, 1012, 1013, 1014];
    
    /**
     * 构造函数
     * 
     * @param ws - WebSocket实例
     * @param connectionId - 连接ID
     * @param address - 连接地址
     * @param options - 连接选项
     */
    constructor(
        ws: WebSocket, 
        connectionId: string, 
        address: string = '',
        options?: {
            enableAutoReconnect?: boolean;
            maxReconnectAttempts?: number;
            reconnectInterval?: number;
            maxReconnectInterval?: number;
        }
    ) {
        this._ws = ws;
        this._connectionId = connectionId;
        this._address = address;
        this._originalUrl = address;
        this._connectedTime = Date.now();
        
        // 设置重连选项
        if (options) {
            this._enableAutoReconnect = options.enableAutoReconnect ?? true;
            this._maxReconnectAttempts = options.maxReconnectAttempts ?? 5;
            this._reconnectInterval = options.reconnectInterval ?? 1000;
            this._maxReconnectInterval = options.maxReconnectInterval ?? 30000;
        }
        
        this.setupWebSocket();
        this.startPingInterval();
    }
    
    /**
     * 设置WebSocket事件监听
     */
    private setupWebSocket(): void {
        if (!this._ws) return;
        
        this._ws.onopen = () => {
            this._state = ConnectionState.Connected;
            
            // 重连成功，重置重连状态
            if (this._reconnectAttempts > 0) {
                NetworkConnection.logger.info(`重连成功 (第 ${this._reconnectAttempts} 次尝试)`);
                this.resetReconnectState();
                this.emit('reconnected');
            }
            
            this.emit('connected');
        };
        
        this._ws.onclose = (event) => {
            this._state = ConnectionState.Disconnected;
            this.stopPingInterval();
            
            const reason = event.reason || '连接已关闭';
            const code = event.code;
            
            NetworkConnection.logger.warn(`连接断开: ${reason} (code: ${code})`);
            this.emit('disconnected', reason, code);
            
            // 判断是否需要自动重连
            if (this._enableAutoReconnect && this.shouldReconnect(code)) {
                this.scheduleReconnect();
            }
        };
        
        this._ws.onerror = (event) => {
            const error = new Error(`WebSocket error: ${event.toString()}`);
            this.emit('error', error);
        };
        
        this._ws.onmessage = (event) => {
            try {
                let data: Uint8Array;
                
                if (event.data instanceof ArrayBuffer) {
                    data = new Uint8Array(event.data);
                } else if (event.data instanceof Uint8Array) {
                    data = event.data;
                } else if (typeof event.data === 'string') {
                    // 处理字符串消息（如心跳）
                    if (event.data === 'pong') {
                        this._lastPingTime = Date.now();
                        return;
                    }
                    // 将字符串转换为Uint8Array
                    data = new TextEncoder().encode(event.data);
                } else {
                    NetworkConnection.logger.warn(' 收到未知类型的消息:', typeof event.data);
                    return;
                }
                
                this.emit('message', data);
            } catch (error) {
                NetworkConnection.logger.error(' 消息处理错误:', error);
            }
        };
    }
    
    /**
     * 启动心跳检测
     */
    private startPingInterval(): void {
        this._pingInterval = setInterval(() => {
            if (this._state === ConnectionState.Connected) {
                this.ping();
            }
        }, NetworkConnection.PING_INTERVAL);
    }
    
    /**
     * 停止心跳检测
     */
    private stopPingInterval(): void {
        if (this._pingInterval) {
            clearInterval(this._pingInterval);
            this._pingInterval = null;
        }
    }
    
    /**
     * 发送心跳包
     */
    private ping(): void {
        if (this._ws && this._state === ConnectionState.Connected) {
            try {
                this._ws.send('ping');
            } catch (error) {
                NetworkConnection.logger.error(' 心跳发送失败:', error);
            }
        }
    }
    
    /**
     * 发送二进制数据
     * 
     * @param data - 要发送的数据
     * @returns 是否发送成功
     */
    public send(data: Uint8Array): boolean {
        if (!this._ws || this._state !== ConnectionState.Connected) {
            NetworkConnection.logger.warn(' 连接未就绪，无法发送数据');
            return false;
        }
        
        try {
            this._ws.send(data);
            return true;
        } catch (error) {
            NetworkConnection.logger.error(' 数据发送失败:', error);
            return false;
        }
    }
    
    /**
     * 判断是否应该重连
     */
    private shouldReconnect(code: number): boolean {
        // 正常关闭不需要重连
        if (code === 1000) {
            return false;
        }
        
        // 检查是否是可恢复的错误代码
        return NetworkConnection.RECOVERABLE_CODES.includes(code) || code === 1006;
    }
    
    /**
     * 安排重连
     */
    private scheduleReconnect(): void {
        if (this._reconnectAttempts >= this._maxReconnectAttempts) {
            NetworkConnection.logger.error(`重连失败，已达到最大重试次数 ${this._maxReconnectAttempts}`);
            this.emit('reconnectFailed', new Error(`重连失败，已达到最大重试次数`));
            return;
        }
        
        this._reconnectAttempts++;
        const delay = Math.min(
            this._reconnectInterval * Math.pow(2, this._reconnectAttempts - 1),
            this._maxReconnectInterval
        );
        
        NetworkConnection.logger.info(`将在 ${delay}ms 后尝试第 ${this._reconnectAttempts} 次重连`);
        this.emit('reconnecting', this._reconnectAttempts);
        
        this._reconnectTimer = setTimeout(() => {
            this.attemptReconnect();
        }, delay);
    }
    
    /**
     * 尝试重连
     */
    private attemptReconnect(): void {
        if (this._state === ConnectionState.Connected) {
            return;
        }
        
        try {
            NetworkConnection.logger.info(`正在尝试重连到 ${this._originalUrl}`);
            
            // 创建新的WebSocket连接
            this._ws = new WebSocket(this._originalUrl);
            this._state = ConnectionState.Connecting;
            
            // 重新设置事件处理
            this.setupWebSocket();
            
        } catch (error) {
            NetworkConnection.logger.error(`重连失败:`, error);
            
            // 继续下一次重连尝试
            setTimeout(() => {
                this.scheduleReconnect();
            }, 1000);
        }
    }
    
    /**
     * 重置重连状态
     */
    private resetReconnectState(): void {
        this._reconnectAttempts = 0;
        
        if (this._reconnectTimer) {
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = null;
        }
    }
    
    /**
     * 设置重连配置
     */
    public setReconnectOptions(options: {
        enableAutoReconnect?: boolean;
        maxReconnectAttempts?: number;
        reconnectInterval?: number;
        maxReconnectInterval?: number;
    }): void {
        if (options.enableAutoReconnect !== undefined) {
            this._enableAutoReconnect = options.enableAutoReconnect;
        }
        if (options.maxReconnectAttempts !== undefined) {
            this._maxReconnectAttempts = options.maxReconnectAttempts;
        }
        if (options.reconnectInterval !== undefined) {
            this._reconnectInterval = options.reconnectInterval;
        }
        if (options.maxReconnectInterval !== undefined) {
            this._maxReconnectInterval = options.maxReconnectInterval;
        }
    }
    
    /**
     * 手动重连
     */
    public reconnect(): void {
        if (this._state === ConnectionState.Connected) {
            NetworkConnection.logger.warn('连接已存在，无需重连');
            return;
        }
        
        this.resetReconnectState();
        this.attemptReconnect();
    }
    
    /**
     * 关闭连接
     * 
     * @param reason - 关闭原因
     */
    public close(reason: string = 'Connection closed by local'): void {
        if (this._state === ConnectionState.Disconnected) {
            return;
        }
        
        this._state = ConnectionState.Disconnecting;
        
        // 主动关闭时禁用自动重连
        this._enableAutoReconnect = false;
        this.resetReconnectState();
        
        this.stopPingInterval();
        
        if (this._ws) {
            try {
                this._ws.close(1000, reason);
            } catch (error) {
                NetworkConnection.logger.error(' 连接关闭失败:', error);
            }
            this._ws = null;
        }
    }
    
    /**
     * 添加事件监听器
     * 
     * @param event - 事件名称
     * @param handler - 事件处理函数
     */
    public on<K extends keyof NetworkConnectionEvents>(
        event: K, 
        handler: NetworkConnectionEvents[K]
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
    public off<K extends keyof NetworkConnectionEvents>(
        event: K, 
        handler: NetworkConnectionEvents[K]
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
    private emit<K extends keyof NetworkConnectionEvents>(
        event: K,
        ...args: Parameters<NetworkConnectionEvents[K]>
    ): void {
        const handlers = this._eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(...args);
                } catch (error) {
                    NetworkConnection.logger.error(`事件处理器错误 (${event}):`, error);
                }
            });
        }
    }
    
    /**
     * 获取连接ID
     */
    public get connectionId(): string {
        return this._connectionId;
    }
    
    /**
     * 获取连接地址
     */
    public get address(): string {
        return this._address;
    }
    
    /**
     * 获取连接状态
     */
    public get state(): ConnectionState {
        return this._state;
    }
    
    /**
     * 检查是否已连接
     */
    public get isConnected(): boolean {
        return this._state === ConnectionState.Connected;
    }
    
    /**
     * 获取连接时长（毫秒）
     */
    public get connectedTime(): number {
        return this._connectedTime > 0 ? Date.now() - this._connectedTime : 0;
    }
    
    /**
     * 获取最后一次心跳时间
     */
    public get lastPingTime(): number {
        return this._lastPingTime;
    }
    
    /**
     * 获取连接统计信息
     */
    public getStats(): {
        connectionId: string;
        address: string;
        state: ConnectionState;
        connectedTime: number;
        lastPingTime: number;
        isAlive: boolean;
    } {
        const now = Date.now();
        const isAlive = this._state === ConnectionState.Connected && 
                       (this._lastPingTime === 0 || (now - this._lastPingTime) < NetworkConnection.PING_TIMEOUT * 2);
        
        return {
            connectionId: this._connectionId,
            address: this._address,
            state: this._state,
            connectedTime: this.connectedTime,
            lastPingTime: this._lastPingTime,
            isAlive
        };
    }
}