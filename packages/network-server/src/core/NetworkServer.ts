/**
 * 网络服务器主类
 * 
 * 整合 WebSocket 和 HTTP 传输，提供统一的网络服务接口
 */

import { EventEmitter } from 'events';
import { Transport, TransportConfig, TransportMessage } from './Transport';
import { WebSocketTransport, WebSocketTransportConfig } from './WebSocketTransport';
import { HttpTransport, HttpTransportConfig } from './HttpTransport';
import { ClientConnection, ClientConnectionState, ClientPermissions } from './ClientConnection';
import { NetworkValue } from '@esengine/ecs-framework-network-shared';

/**
 * 网络服务器配置
 */
export interface NetworkServerConfig {
  /** 服务器名称 */
  name?: string;
  /** WebSocket 配置 */
  websocket?: WebSocketTransportConfig;
  /** HTTP 配置 */
  http?: HttpTransportConfig;
  /** 默认客户端权限 */
  defaultPermissions?: ClientPermissions;
  /** 最大客户端连接数 */
  maxConnections?: number;
  /** 客户端认证超时(毫秒) */
  authenticationTimeout?: number;
  /** 是否启用统计 */
  enableStats?: boolean;
}

/**
 * 服务器统计信息
 */
export interface ServerStats {
  /** 总连接数 */
  totalConnections: number;
  /** 当前活跃连接数 */
  activeConnections: number;
  /** 已认证连接数 */
  authenticatedConnections: number;
  /** 消息总数 */
  totalMessages: number;
  /** 错误总数 */
  totalErrors: number;
  /** 服务器启动时间 */
  startTime: Date;
  /** 服务器运行时间(毫秒) */
  uptime: number;
}

/**
 * 网络服务器事件
 */
export interface NetworkServerEvents {
  /** 服务器启动 */
  'server-started': () => void;
  /** 服务器停止 */
  'server-stopped': () => void;
  /** 客户端连接 */
  'client-connected': (client: ClientConnection) => void;
  /** 客户端断开连接 */
  'client-disconnected': (clientId: string, reason?: string) => void;
  /** 客户端认证成功 */
  'client-authenticated': (client: ClientConnection) => void;
  /** 收到消息 */
  'message': (client: ClientConnection, message: TransportMessage) => void;
  /** 服务器错误 */
  'error': (error: Error, clientId?: string) => void;
}

/**
 * 网络服务器主类
 */
export class NetworkServer extends EventEmitter {
  private config: NetworkServerConfig;
  private wsTransport: WebSocketTransport | null = null;
  private httpTransport: HttpTransport | null = null;
  private clients = new Map<string, ClientConnection>();
  private isRunning = false;
  private stats: ServerStats;

  constructor(config: NetworkServerConfig) {
    super();
    
    this.config = {
      name: 'NetworkServer',
      maxConnections: 1000,
      authenticationTimeout: 30000, // 30秒
      enableStats: true,
      defaultPermissions: {
        canJoinRooms: true,
        canCreateRooms: false,
        canSendRpc: true,
        canSyncVars: true
      },
      ...config
    };

    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      authenticatedConnections: 0,
      totalMessages: 0,
      totalErrors: 0,
      startTime: new Date(),
      uptime: 0
    };

    this.initialize();
  }

  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    try {
      const promises: Promise<void>[] = [];

      // 启动 WebSocket 传输
      if (this.config.websocket && this.wsTransport) {
        promises.push(this.wsTransport.start());
      }

      // 启动 HTTP 传输
      if (this.config.http && this.httpTransport) {
        promises.push(this.httpTransport.start());
      }

      if (promises.length === 0) {
        throw new Error('No transport configured. Please configure at least one transport (WebSocket or HTTP)');
      }

      await Promise.all(promises);

      this.isRunning = true;
      this.stats.startTime = new Date();
      
      console.log(`Network Server "${this.config.name}" started successfully`);
      if (this.config.websocket) {
        console.log(`- WebSocket: ws://${this.config.websocket.host || 'localhost'}:${this.config.websocket.port}${this.config.websocket.path || '/ws'}`);
      }
      if (this.config.http) {
        console.log(`- HTTP: http://${this.config.http.host || 'localhost'}:${this.config.http.port}${this.config.http.apiPrefix || '/api'}`);
      }

      this.emit('server-started');

    } catch (error) {
      await this.stop();
      throw error;
    }
  }

  /**
   * 停止服务器
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // 断开所有客户端
    const clients = Array.from(this.clients.values());
    for (const client of clients) {
      client.disconnect('server-shutdown');
    }

    // 停止传输层
    const promises: Promise<void>[] = [];
    
    if (this.wsTransport) {
      promises.push(this.wsTransport.stop());
    }
    
    if (this.httpTransport) {
      promises.push(this.httpTransport.stop());
    }

    await Promise.all(promises);
    
    console.log(`Network Server "${this.config.name}" stopped`);
    this.emit('server-stopped');
  }

  /**
   * 获取服务器配置
   */
  getConfig(): Readonly<NetworkServerConfig> {
    return this.config;
  }

  /**
   * 获取服务器统计信息
   */
  getStats(): ServerStats {
    this.stats.uptime = Date.now() - this.stats.startTime.getTime();
    this.stats.activeConnections = this.clients.size;
    this.stats.authenticatedConnections = Array.from(this.clients.values())
      .filter(client => client.isAuthenticated).length;
    
    return { ...this.stats };
  }

  /**
   * 获取所有客户端连接
   */
  getClients(): ClientConnection[] {
    return Array.from(this.clients.values());
  }

  /**
   * 获取指定客户端连接
   */
  getClient(clientId: string): ClientConnection | undefined {
    return this.clients.get(clientId);
  }

  /**
   * 检查客户端是否存在
   */
  hasClient(clientId: string): boolean {
    return this.clients.has(clientId);
  }

  /**
   * 获取客户端数量
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * 发送消息给指定客户端
   */
  async sendToClient(clientId: string, message: TransportMessage): Promise<boolean> {
    const client = this.clients.get(clientId);
    if (!client) {
      return false;
    }

    return await client.sendMessage(message);
  }

  /**
   * 广播消息给所有客户端
   */
  async broadcast(message: TransportMessage, excludeId?: string): Promise<number> {
    const promises = Array.from(this.clients.entries())
      .filter(([clientId]) => clientId !== excludeId)
      .map(([, client]) => client.sendMessage(message));

    const results = await Promise.allSettled(promises);
    return results.filter(result => result.status === 'fulfilled' && result.value).length;
  }

  /**
   * 发送消息给指定房间的所有客户端
   */
  async broadcastToRoom(roomId: string, message: TransportMessage, excludeId?: string): Promise<number> {
    const roomClients = Array.from(this.clients.values())
      .filter(client => client.currentRoomId === roomId && client.id !== excludeId);

    const promises = roomClients.map(client => client.sendMessage(message));
    const results = await Promise.allSettled(promises);
    
    return results.filter(result => result.status === 'fulfilled' && result.value).length;
  }

  /**
   * 断开指定客户端连接
   */
  async disconnectClient(clientId: string, reason?: string): Promise<void> {
    const client = this.clients.get(clientId);
    if (client) {
      client.disconnect(reason);
    }
  }

  /**
   * 获取在指定房间的客户端列表
   */
  getClientsInRoom(roomId: string): ClientConnection[] {
    return Array.from(this.clients.values())
      .filter(client => client.currentRoomId === roomId);
  }

  /**
   * 检查服务器是否正在运行
   */
  isServerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * 初始化服务器
   */
  private initialize(): void {
    // 初始化 WebSocket 传输
    if (this.config.websocket) {
      this.wsTransport = new WebSocketTransport(this.config.websocket);
      this.setupTransportEvents(this.wsTransport);
    }

    // 初始化 HTTP 传输
    if (this.config.http) {
      this.httpTransport = new HttpTransport(this.config.http);
      this.setupTransportEvents(this.httpTransport);
    }
  }

  /**
   * 设置传输层事件监听
   */
  private setupTransportEvents(transport: Transport): void {
    transport.on('client-connected', (connectionInfo) => {
      this.handleClientConnected(connectionInfo.id, connectionInfo.remoteAddress || 'unknown', transport);
    });

    transport.on('client-disconnected', (connectionId, reason) => {
      this.handleClientDisconnected(connectionId, reason);
    });

    transport.on('message', (connectionId, message) => {
      this.handleTransportMessage(connectionId, message);
    });

    transport.on('error', (error, connectionId) => {
      this.handleTransportError(error, connectionId);
    });
  }

  /**
   * 处理客户端连接
   */
  private handleClientConnected(connectionId: string, remoteAddress: string, transport: Transport): void {
    // 检查连接数限制
    if (this.config.maxConnections && this.clients.size >= this.config.maxConnections) {
      transport.disconnectClient(connectionId, 'Max connections reached');
      return;
    }

    const client = new ClientConnection(
      connectionId,
      remoteAddress,
      (message) => transport.sendToClient(connectionId, message),
      {
        connectionTimeout: this.config.authenticationTimeout,
        permissions: this.config.defaultPermissions
      }
    );

    // 设置客户端事件监听
    this.setupClientEvents(client);

    this.clients.set(connectionId, client);
    this.stats.totalConnections++;

    console.log(`Client connected: ${connectionId} from ${remoteAddress}`);
    this.emit('client-connected', client);
  }

  /**
   * 处理客户端断开连接
   */
  private handleClientDisconnected(connectionId: string, reason?: string): void {
    const client = this.clients.get(connectionId);
    if (client) {
      client.destroy();
      this.clients.delete(connectionId);
      
      console.log(`Client disconnected: ${connectionId}, reason: ${reason || 'unknown'}`);
      this.emit('client-disconnected', connectionId, reason);
    }
  }

  /**
   * 处理传输层消息
   */
  private handleTransportMessage(connectionId: string, message: TransportMessage): void {
    const client = this.clients.get(connectionId);
    if (!client) {
      return;
    }

    client.handleMessage(message);
    this.stats.totalMessages++;

    this.emit('message', client, message);
  }

  /**
   * 处理传输层错误
   */
  private handleTransportError(error: Error, connectionId?: string): void {
    this.stats.totalErrors++;
    
    console.error(`Transport error${connectionId ? ` (client: ${connectionId})` : ''}:`, error.message);
    this.emit('error', error, connectionId);
    
    // 如果是特定客户端的错误，断开该客户端
    if (connectionId) {
      this.disconnectClient(connectionId, 'transport-error');
    }
  }

  /**
   * 设置客户端事件监听
   */
  private setupClientEvents(client: ClientConnection): void {
    client.on('authenticated', (userData) => {
      console.log(`Client authenticated: ${client.id}`, userData);
      this.emit('client-authenticated', client);
    });

    client.on('error', (error) => {
      console.error(`Client error (${client.id}):`, error.message);
      this.emit('error', error, client.id);
    });

    client.on('timeout', () => {
      console.log(`Client timeout: ${client.id}`);
      this.disconnectClient(client.id, 'timeout');
    });

    client.on('state-changed', (oldState, newState) => {
      console.log(`Client ${client.id} state changed: ${oldState} -> ${newState}`);
    });
  }

  /**
   * 类型安全的事件监听
   */
  override on<K extends keyof NetworkServerEvents>(event: K, listener: NetworkServerEvents[K]): this {
    return super.on(event, listener);
  }

  /**
   * 类型安全的事件触发
   */
  override emit<K extends keyof NetworkServerEvents>(event: K, ...args: Parameters<NetworkServerEvents[K]>): boolean {
    return super.emit(event, ...args);
  }
}