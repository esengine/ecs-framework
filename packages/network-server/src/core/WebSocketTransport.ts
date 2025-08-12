/**
 * WebSocket 传输层实现
 */

import { WebSocketServer, WebSocket } from 'ws';
import { createServer, Server as HttpServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { Transport, TransportConfig, ClientConnectionInfo, TransportMessage } from './Transport';

/**
 * WebSocket 传输配置
 */
export interface WebSocketTransportConfig extends TransportConfig {
  /** WebSocket 路径 */
  path?: string;
  /** 是否启用压缩 */
  compression?: boolean;
  /** 最大消息大小(字节) */
  maxMessageSize?: number;
  /** ping 间隔(毫秒) */
  pingInterval?: number;
  /** pong 超时(毫秒) */
  pongTimeout?: number;
}

/**
 * WebSocket 客户端连接扩展信息
 */
interface WebSocketConnectionInfo extends ClientConnectionInfo {
  /** WebSocket 实例 */
  socket: WebSocket;
  /** ping 定时器 */
  pingTimer?: NodeJS.Timeout;
  /** pong 超时定时器 */
  pongTimer?: NodeJS.Timeout;
}

/**
 * WebSocket 传输层实现
 */
export class WebSocketTransport extends Transport {
  private httpServer: HttpServer | null = null;
  private wsServer: WebSocketServer | null = null;
  private wsConnections = new Map<string, WebSocketConnectionInfo>();
  
  protected override config: WebSocketTransportConfig;

  constructor(config: WebSocketTransportConfig) {
    super(config);
    this.config = {
      path: '/ws',
      compression: true,
      maxMessageSize: 1024 * 1024, // 1MB
      pingInterval: 30000, // 30秒
      pongTimeout: 5000, // 5秒
      heartbeatInterval: 30000,
      connectionTimeout: 60000,
      maxConnections: 1000,
      ...config
    };
  }

  /**
   * 启动 WebSocket 服务器
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('WebSocket transport is already running');
    }

    try {
      // 创建 HTTP 服务器
      this.httpServer = createServer();
      
      // 创建 WebSocket 服务器
      this.wsServer = new WebSocketServer({
        server: this.httpServer,
        path: this.config.path,
        maxPayload: this.config.maxMessageSize,
        perMessageDeflate: this.config.compression
      });

      // 设置事件监听
      this.setupEventListeners();

      // 启动服务器
      await new Promise<void>((resolve, reject) => {
        this.httpServer!.listen(this.config.port, this.config.host, (error?: Error) => {
          if (error) {
            reject(error);
          } else {
            this.isRunning = true;
            resolve();
          }
        });
      });

      this.emit('server-started', this.config);
    } catch (error) {
      await this.cleanup();
      throw error;
    }
  }

  /**
   * 停止 WebSocket 服务器
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    // 断开所有客户端连接
    for (const [connectionId, connection] of this.wsConnections) {
      this.disconnectClient(connectionId, 'server-shutdown');
    }

    await this.cleanup();
    this.emit('server-stopped');
  }

  /**
   * 发送消息给指定客户端
   */
  async sendToClient(connectionId: string, message: TransportMessage): Promise<boolean> {
    const connection = this.wsConnections.get(connectionId);
    if (!connection || connection.socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      const data = JSON.stringify(message);
      connection.socket.send(data);
      this.updateClientActivity(connectionId);
      return true;
    } catch (error) {
      this.handleError(error as Error, connectionId);
      return false;
    }
  }

  /**
   * 广播消息给所有客户端
   */
  async broadcast(message: TransportMessage, excludeId?: string): Promise<number> {
    const data = JSON.stringify(message);
    let sentCount = 0;

    for (const [connectionId, connection] of this.wsConnections) {
      if (excludeId && connectionId === excludeId) {
        continue;
      }

      if (connection.socket.readyState === WebSocket.OPEN) {
        try {
          connection.socket.send(data);
          sentCount++;
        } catch (error) {
          this.handleError(error as Error, connectionId);
        }
      }
    }

    return sentCount;
  }

  /**
   * 发送消息给指定客户端列表
   */
  async sendToClients(connectionIds: string[], message: TransportMessage): Promise<number> {
    const data = JSON.stringify(message);
    let sentCount = 0;

    for (const connectionId of connectionIds) {
      const connection = this.wsConnections.get(connectionId);
      if (connection && connection.socket.readyState === WebSocket.OPEN) {
        try {
          connection.socket.send(data);
          sentCount++;
        } catch (error) {
          this.handleError(error as Error, connectionId);
        }
      }
    }

    return sentCount;
  }

  /**
   * 断开指定客户端连接
   */
  async disconnectClient(connectionId: string, reason?: string): Promise<void> {
    const connection = this.wsConnections.get(connectionId);
    if (connection) {
      this.cleanupConnection(connectionId);
      connection.socket.close(1000, reason);
    }
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.wsServer) return;

    this.wsServer.on('connection', (socket: WebSocket, request) => {
      this.handleNewConnection(socket, request);
    });

    this.wsServer.on('error', (error: Error) => {
      this.handleError(error);
    });

    if (this.httpServer) {
      this.httpServer.on('error', (error: Error) => {
        this.handleError(error);
      });
    }
  }

  /**
   * 处理新连接
   */
  private handleNewConnection(socket: WebSocket, request: any): void {
    // 检查连接数限制
    if (this.config.maxConnections && this.wsConnections.size >= this.config.maxConnections) {
      socket.close(1013, 'Too many connections');
      return;
    }

    const connectionId = uuidv4();
    const remoteAddress = request.socket.remoteAddress || request.headers['x-forwarded-for'] || 'unknown';
    
    const connectionInfo: WebSocketConnectionInfo = {
      id: connectionId,
      socket,
      remoteAddress: Array.isArray(remoteAddress) ? remoteAddress[0] : remoteAddress,
      connectedAt: new Date(),
      lastActivity: new Date(),
      userData: {}
    };

    this.wsConnections.set(connectionId, connectionInfo);
    this.addConnection(connectionInfo);

    // 设置 socket 事件监听
    socket.on('message', (data: Buffer) => {
      this.handleClientMessage(connectionId, data);
    });

    socket.on('close', (code: number, reason: Buffer) => {
      this.handleClientDisconnect(connectionId, code, reason.toString());
    });

    socket.on('error', (error: Error) => {
      this.handleError(error, connectionId);
      this.handleClientDisconnect(connectionId, 1006, 'Socket error');
    });

    socket.on('pong', () => {
      this.handlePong(connectionId);
    });

    // 启动心跳检测
    this.startHeartbeat(connectionId);
  }

  /**
   * 处理客户端消息
   */
  private handleClientMessage(connectionId: string, data: Buffer): void {
    try {
      const message = JSON.parse(data.toString()) as TransportMessage;
      message.senderId = connectionId;
      this.handleMessage(connectionId, message);
    } catch (error) {
      this.handleError(new Error(`Invalid message format from client ${connectionId}`), connectionId);
    }
  }

  /**
   * 处理客户端断开连接
   */
  private handleClientDisconnect(connectionId: string, code: number, reason: string): void {
    this.cleanupConnection(connectionId);
    this.removeConnection(connectionId, `${code}: ${reason}`);
  }

  /**
   * 启动心跳检测
   */
  private startHeartbeat(connectionId: string): void {
    const connection = this.wsConnections.get(connectionId);
    if (!connection) return;

    if (this.config.pingInterval && this.config.pingInterval > 0) {
      connection.pingTimer = setInterval(() => {
        this.sendPing(connectionId);
      }, this.config.pingInterval);
    }
  }

  /**
   * 发送 ping
   */
  private sendPing(connectionId: string): void {
    const connection = this.wsConnections.get(connectionId);
    if (!connection || connection.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    connection.socket.ping();

    // 设置 pong 超时
    if (this.config.pongTimeout && this.config.pongTimeout > 0) {
      if (connection.pongTimer) {
        clearTimeout(connection.pongTimer);
      }

      connection.pongTimer = setTimeout(() => {
        this.disconnectClient(connectionId, 'Pong timeout');
      }, this.config.pongTimeout);
    }
  }

  /**
   * 处理 pong 响应
   */
  private handlePong(connectionId: string): void {
    const connection = this.wsConnections.get(connectionId);
    if (connection && connection.pongTimer) {
      clearTimeout(connection.pongTimer);
      connection.pongTimer = undefined;
    }
    this.updateClientActivity(connectionId);
  }

  /**
   * 清理连接资源
   */
  private cleanupConnection(connectionId: string): void {
    const connection = this.wsConnections.get(connectionId);
    if (connection) {
      if (connection.pingTimer) {
        clearInterval(connection.pingTimer);
      }
      if (connection.pongTimer) {
        clearTimeout(connection.pongTimer);
      }
      this.wsConnections.delete(connectionId);
    }
  }

  /**
   * 清理所有资源
   */
  private async cleanup(): Promise<void> {
    // 清理所有连接
    for (const connectionId of this.wsConnections.keys()) {
      this.cleanupConnection(connectionId);
    }
    this.clearConnections();

    // 关闭 WebSocket 服务器
    if (this.wsServer) {
      this.wsServer.close();
      this.wsServer = null;
    }

    // 关闭 HTTP 服务器
    if (this.httpServer) {
      await new Promise<void>((resolve) => {
        this.httpServer!.close(() => resolve());
      });
      this.httpServer = null;
    }
  }

  /**
   * 获取 WebSocket 连接统计信息
   */
  getWebSocketStats(): {
    totalConnections: number;
    activeConnections: number;
    inactiveConnections: number;
  } {
    let activeConnections = 0;
    let inactiveConnections = 0;

    for (const connection of this.wsConnections.values()) {
      if (connection.socket.readyState === WebSocket.OPEN) {
        activeConnections++;
      } else {
        inactiveConnections++;
      }
    }

    return {
      totalConnections: this.wsConnections.size,
      activeConnections,
      inactiveConnections
    };
  }
}