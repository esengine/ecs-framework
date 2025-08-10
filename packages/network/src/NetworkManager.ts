/**
 * 网络管理器
 * 
 * 网络库的核心管理类，负责：
 * - 客户端/服务端连接管理
 * - 网络消息路由和处理
 * - SyncVar 同步调度
 * - RPC 调用管理
 */

import { createLogger, Component } from '@esengine/ecs-framework';
import { 
  NetworkConfig, 
  NetworkSide, 
  NetworkConnectionState, 
  NetworkStats,
  NetworkEventHandlers,
  SyncVarMessage,
  RpcMessage,
  NetworkMessage
} from './types/NetworkTypes';
import { NetworkRegistry } from './core/NetworkRegistry';
import { SyncVarManager } from './core/SyncVarManager';
import { RpcManager } from './core/RpcManager';
import { NetworkIdentity } from './NetworkIdentity';
import { NetworkBehaviour } from './NetworkBehaviour';
import { TsrpcTransport, TransportEventHandlers } from './transport/TsrpcTransport';

const logger = createLogger('NetworkManager');

export class NetworkManager extends Component {
  private static _instance: NetworkManager | null = null;

  /** 当前网络端类型 */
  private networkSide: NetworkSide = 'client';

  /** 连接状态 */
  private connectionState: NetworkConnectionState = 'disconnected';

  /** 网络配置 */
  private config: NetworkConfig = {
    port: 7777,
    host: 'localhost',
    maxConnections: 100,
    syncRate: 20,
    compression: false
  };

  /** 网络统计信息 */
  private stats: NetworkStats = {
    connectionCount: 0,
    bytesSent: 0,
    bytesReceived: 0,
    messagesSent: 0,
    messagesReceived: 0,
    averageLatency: 0
  };

  /** 事件处理器 */
  private eventHandlers: Partial<NetworkEventHandlers> = {};

  /** 同步定时器 */
  private syncTimer: NodeJS.Timeout | null = null;

  /** TSRPC传输层 */
  private transport: TsrpcTransport | null = null;

  public static get instance(): NetworkManager | null {
    return NetworkManager._instance;
  }

  public static get isServer(): boolean {
    return NetworkManager._instance?.networkSide === 'server' || 
           NetworkManager._instance?.networkSide === 'host';
  }

  public static get isClient(): boolean {
    return NetworkManager._instance?.networkSide === 'client' || 
           NetworkManager._instance?.networkSide === 'host';
  }

  public static get isConnected(): boolean {
    return NetworkManager._instance?.connectionState === 'connected';
  }

  constructor() {
    super();
    if (NetworkManager._instance) {
      throw new Error('NetworkManager 已存在实例，请使用 NetworkManager.instance');
    }
    NetworkManager._instance = this;
  }

  /**
   * 启动服务端
   * @param config 网络配置
   */
  public async startServer(config?: Partial<NetworkConfig>): Promise<void> {
    if (this.connectionState !== 'disconnected') {
      throw new Error('网络管理器已在运行中');
    }

    this.networkSide = 'server';
    this.config = { ...this.config, ...config };
    this.connectionState = 'connecting';

    try {
      // 初始化TSRPC传输层
      await this.initializeTransport();
      
      // 启动TSRPC服务端
      await this.transport!.startServer();
      
      this.connectionState = 'connected';
      this.startSyncLoop();
      
      logger.info(`服务端已启动，端口: ${this.config.port}`);
      this.eventHandlers.onConnected?.();
      
    } catch (error) {
      this.connectionState = 'disconnected';
      logger.error('启动服务端失败:', error);
      this.eventHandlers.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * 连接到服务端
   * @param host 服务端地址
   * @param port 服务端端口
   */
  public async connectToServer(host?: string, port?: number): Promise<void> {
    if (this.connectionState !== 'disconnected') {
      throw new Error('已经连接或正在连接中');
    }

    this.networkSide = 'client';
    this.config.host = host || this.config.host;
    this.config.port = port || this.config.port;
    this.connectionState = 'connecting';

    try {
      // 初始化TSRPC传输层
      await this.initializeTransport();
      
      // 连接到TSRPC服务端
      await this.transport!.connectToServer();
      
      this.connectionState = 'connected';
      this.startSyncLoop();
      
      logger.info(`已连接到服务端: ${this.config.host}:${this.config.port}`);
      this.eventHandlers.onConnected?.();
      
    } catch (error) {
      this.connectionState = 'disconnected';
      logger.error('连接服务端失败:', error);
      this.eventHandlers.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * 断开连接
   */
  public async disconnect(): Promise<void> {
    if (this.connectionState === 'disconnected') {
      return;
    }

    this.connectionState = 'disconnected';
    this.stopSyncLoop();

    // 关闭TSRPC传输层连接
    if (this.transport) {
      await this.transport.disconnect();
    }

    logger.info('网络连接已断开');
    this.eventHandlers.onDisconnected?.();
  }

  /**
   * 注册网络对象
   * @param entity 包含 NetworkIdentity 的实体
   * @returns 分配的网络ID
   */
  public registerNetworkObject(entity: any): number {
    const networkIdentity = entity.getComponent?.(NetworkIdentity);
    if (!networkIdentity) {
      throw new Error('实体必须包含 NetworkIdentity 组件才能注册为网络对象');
    }

    // 注册到网络注册表
    const networkId = NetworkRegistry.instance.register(networkIdentity);

    // 注册所有网络组件到管理器
    const networkBehaviours = entity.getComponents?.()?.filter((c: any) => c instanceof NetworkBehaviour) || [];
    for (const behaviour of networkBehaviours) {
      SyncVarManager.instance.registerComponent(behaviour as NetworkBehaviour);
      RpcManager.instance.registerComponent(behaviour as NetworkBehaviour);
    }

    logger.debug(`注册网络对象: ${entity.name}, ID: ${networkId}`);
    return networkId;
  }

  /**
   * 发送客户端 RPC（服务端调用）
   */
  public sendClientRpc(
    networkId: number, 
    componentType: string, 
    methodName: string, 
    args: any[] = [], 
    targetClient?: number
  ): void {
    if (!NetworkManager.isServer) {
      logger.warn('ClientRpc 只能在服务端调用');
      return;
    }

    const message: RpcMessage = {
      type: 'rpc',
      networkId,
      data: {
        componentType,
        methodName,
        args
      },
      methodName,
      args,
      isClientRpc: true,
      timestamp: Date.now()
    };

    this.sendMessage(message, targetClient);
  }

  /**
   * 发送命令到服务端（客户端调用）
   */
  public sendCommand(
    networkId: number, 
    componentType: string, 
    methodName: string, 
    args: any[] = []
  ): void {
    if (!NetworkManager.isClient) {
      logger.warn('Command 只能在客户端调用');
      return;
    }

    const message: RpcMessage = {
      type: 'rpc',
      networkId,
      data: {
        componentType,
        methodName,
        args
      },
      methodName,
      args,
      isClientRpc: false,
      timestamp: Date.now()
    };

    this.sendMessage(message);
  }

  /**
   * 设置事件处理器
   */
  public on<K extends keyof NetworkEventHandlers>(
    event: K, 
    handler: NetworkEventHandlers[K]
  ): void {
    this.eventHandlers[event] = handler;
  }

  /**
   * 获取网络统计信息
   */
  public getStats(): NetworkStats {
    return { ...this.stats };
  }

  /**
   * 获取连接状态
   */
  public getConnectionState(): NetworkConnectionState {
    return this.connectionState;
  }

  /**
   * 组件销毁时清理
   */
  public destroy(): void {
    this.disconnect();
    NetworkManager._instance = null;
  }

  /**
   * 初始化传输层
   */
  private async initializeTransport(): Promise<void> {
    if (this.transport) {
      return; // 已经初始化
    }

    // 创建TSRPC传输层
    this.transport = new TsrpcTransport(this.config);

    // 设置传输层事件处理器
    const transportHandlers: TransportEventHandlers = {
      onConnected: () => {
        logger.debug('传输层连接已建立');
      },
      
      onDisconnected: (reason) => {
        logger.debug(`传输层连接已断开: ${reason}`);
        if (this.connectionState === 'connected') {
          this.connectionState = 'disconnected';
          this.eventHandlers.onDisconnected?.(reason);
        }
      },
      
      onClientConnected: (clientId) => {
        logger.debug(`客户端 ${clientId} 已连接到传输层`);
        this.eventHandlers.onClientConnected?.(clientId);
      },
      
      onClientDisconnected: (clientId, reason) => {
        logger.debug(`客户端 ${clientId} 已从传输层断开: ${reason}`);
        this.eventHandlers.onClientDisconnected?.(clientId, reason);
        
        // 清理断开连接的客户端对象
        NetworkRegistry.instance.cleanupDisconnectedClient(clientId);
      },
      
      onMessage: (message, fromClientId) => {
        this.handleMessage(message);
      },
      
      onError: (error) => {
        logger.error('传输层错误:', error);
        this.eventHandlers.onError?.(error);
      }
    };

    this.transport.setEventHandlers(transportHandlers);
    logger.debug('TSRPC传输层已初始化');
  }

  /**
   * 启动同步循环
   */
  private startSyncLoop(): void {
    if (this.syncTimer) {
      return;
    }

    const interval = 1000 / (this.config.syncRate || 20);
    this.syncTimer = setInterval(() => {
      this.processSyncVars();
    }, interval);

    logger.debug(`同步循环已启动，频率: ${this.config.syncRate} Hz`);
  }

  /**
   * 停止同步循环
   */
  private stopSyncLoop(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      logger.debug('同步循环已停止');
    }
  }

  /**
   * 处理 SyncVar 同步
   */
  private processSyncVars(): void {
    if (!NetworkManager.isServer) {
      return; // 只有服务端发送同步消息
    }

    const syncVarMessages = SyncVarManager.instance.getPendingMessages();
    for (const message of syncVarMessages) {
      this.sendMessage(message).catch(error => {
        logger.error('发送SyncVar消息失败:', error);
      });
    }

    // 处理 RPC 消息
    const rpcMessages = RpcManager.instance.getPendingRpcMessages();
    for (const message of rpcMessages) {
      this.sendMessage(message).catch(error => {
        logger.error('发送RPC消息失败:', error);
      });
    }
  }

  /**
   * 发送网络消息
   */
  private async sendMessage(message: NetworkMessage, targetClient?: number): Promise<void> {
    if (!this.transport) {
      logger.warn('传输层未初始化，无法发送消息');
      return;
    }

    try {
      await this.transport.sendMessage(message, targetClient);
      this.stats.messagesSent++;
      logger.debug(`发送消息: ${message.type}, 网络ID: ${message.networkId}`);
    } catch (error) {
      logger.error('发送消息失败:', error);
    }
  }

  /**
   * 处理收到的网络消息（供外部调用）
   */
  public handleIncomingMessage(message: NetworkMessage): void {
    this.handleMessage(message);
  }

  /**
   * 处理收到的网络消息
   */
  private handleMessage(message: NetworkMessage): void {
    this.stats.messagesReceived++;

    switch (message.type) {
      case 'syncvar':
        SyncVarManager.instance.handleSyncVarMessage(message as SyncVarMessage);
        break;
      case 'rpc':
        RpcManager.instance.handleRpcMessage(message as RpcMessage);
        break;
      default:
        logger.warn(`未知消息类型: ${message.type}`);
    }
  }
}