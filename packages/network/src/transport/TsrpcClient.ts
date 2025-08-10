/**
 * TSRPC 客户端传输层
 * 
 * 封装TSRPC客户端功能，提供服务端连接和消息收发
 */

import { WsClient } from 'tsrpc';
import { createLogger } from '@esengine/ecs-framework';
import { serviceProto, ServiceType } from './protocols/serviceProto';
import { NetworkConfig, NetworkMessage } from '../types/NetworkTypes';
import { 
  ReqJoinRoom, ResJoinRoom,
  ReqServerStatus, ResServerStatus,
  ReqPing, ResPing,
  MsgNetworkMessage,
  MsgSyncVar,
  MsgRpcCall,
  MsgNetworkObjectSpawn,
  MsgNetworkObjectDespawn,
  MsgClientDisconnected,
  MsgAuthorityChange
} from './protocols/NetworkProtocols';

const logger = createLogger('TsrpcClient');

/**
 * 连接状态
 */
type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

/**
 * TSRPC客户端包装器
 */
export class TsrpcClient {
  private client: WsClient<ServiceType> | null = null;
  private config: NetworkConfig;
  private connectionState: ConnectionState = 'disconnected';
  private clientId: number = 0;
  private roomId: string = '';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 2000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  
  /** 统计信息 */
  private stats = {
    messagesSent: 0,
    messagesReceived: 0,
    bytesSent: 0,
    bytesReceived: 0,
    latency: 0
  };

  /** 事件处理器 */
  public onConnected?: () => void;
  public onDisconnected?: (reason?: string) => void;
  public onReconnecting?: () => void;
  public onMessage?: (message: NetworkMessage) => void;
  public onError?: (error: Error) => void;

  constructor(config: NetworkConfig) {
    this.config = config;
  }

  /**
   * 连接到服务端
   */
  public async connect(): Promise<void> {
    if (this.connectionState !== 'disconnected') {
      throw new Error('客户端已连接或正在连接中');
    }

    this.connectionState = 'connecting';

    try {
      // 创建WebSocket客户端
      this.client = new WsClient(serviceProto, {
        server: `ws://${this.config.host}:${this.config.port}`,
        // 自动重连配置
        heartbeat: {
          interval: 30000,
          timeout: 5000
        }
      });

      this.setupEventHandlers();
      
      // 连接到服务端
      const connectResult = await this.client.connect();
      if (!connectResult.isSucc) {
        throw new Error(`连接失败: ${connectResult.errMsg}`);
      }

      // 加入房间
      const joinResult = await this.client.callApi('network/JoinRoom', {
        roomId: this.config.roomId,
        clientInfo: {
          version: '1.0.0',
          platform: typeof window !== 'undefined' ? 'browser' : 'node'
        }
      });

      if (!joinResult.isSucc) {
        throw new Error(`加入房间失败: ${joinResult.err.message}`);
      }

      this.clientId = joinResult.res.clientId;
      this.roomId = joinResult.res.roomId;
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;

      // 启动心跳
      this.startHeartbeat();

      logger.info(`连接成功，客户端ID: ${this.clientId}, 房间: ${this.roomId}`);
      this.onConnected?.();

    } catch (error) {
      this.connectionState = 'disconnected';
      logger.error('连接服务端失败:', error);
      this.onError?.(error as Error);
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
    this.stopHeartbeat();

    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }

    logger.info('客户端已断开连接');
    this.onDisconnected?.();
  }

  /**
   * 发送消息到服务端
   */
  public async sendMessage(message: NetworkMessage): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('客户端未连接');
    }

    try {
      const tsrpcMessage: MsgNetworkMessage = {
        type: message.type as 'syncvar' | 'rpc',
        networkId: message.networkId,
        data: message.data,
        timestamp: message.timestamp
      };

      await this.client!.sendMsg('network/NetworkMessage', tsrpcMessage);
      this.stats.messagesSent++;
      
      logger.debug(`发送消息: ${message.type}, 网络ID: ${message.networkId}`);
    } catch (error) {
      logger.error('发送消息失败:', error);
      throw error;
    }
  }

  /**
   * 发送SyncVar同步消息
   */
  public async sendSyncVar(
    networkId: number,
    componentType: string,
    propertyName: string,
    value: any
  ): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('客户端未连接');
    }

    try {
      const message: MsgSyncVar = {
        networkId,
        componentType,
        propertyName,
        value,
        timestamp: Date.now()
      };

      await this.client!.sendMsg('network/SyncVar', message);
      this.stats.messagesSent++;
      
      logger.debug(`发送SyncVar: ${componentType}.${propertyName} = ${value}`);
    } catch (error) {
      logger.error('发送SyncVar失败:', error);
      throw error;
    }
  }

  /**
   * 发送RPC调用消息
   */
  public async sendRpcCall(
    networkId: number,
    componentType: string,
    methodName: string,
    args: any[],
    isClientRpc: boolean
  ): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('客户端未连接');
    }

    try {
      const message: MsgRpcCall = {
        networkId,
        componentType,
        methodName,
        args,
        isClientRpc,
        timestamp: Date.now()
      };

      await this.client!.sendMsg('network/RpcCall', message);
      this.stats.messagesSent++;
      
      logger.debug(`发送RPC: ${componentType}.${methodName}(${isClientRpc ? 'ClientRpc' : 'Command'})`);
    } catch (error) {
      logger.error('发送RPC失败:', error);
      throw error;
    }
  }

  /**
   * 查询服务端状态
   */
  public async getServerStatus(): Promise<ResServerStatus> {
    if (!this.isConnected()) {
      throw new Error('客户端未连接');
    }

    const result = await this.client!.callApi('network/ServerStatus', {});
    if (!result.isSucc) {
      throw new Error(`查询服务端状态失败: ${result.err.message}`);
    }

    return result.res;
  }

  /**
   * 发送心跳
   */
  public async ping(): Promise<number> {
    if (!this.isConnected()) {
      throw new Error('客户端未连接');
    }

    const startTime = Date.now();
    const result = await this.client!.callApi('network/Ping', {
      timestamp: startTime
    });

    if (!result.isSucc) {
      throw new Error(`心跳失败: ${result.err.message}`);
    }

    const latency = Date.now() - startTime;
    this.stats.latency = latency;
    return latency;
  }

  /**
   * 获取连接状态
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * 是否已连接
   */
  public isConnected(): boolean {
    return this.connectionState === 'connected' && (this.client?.isConnected || false);
  }

  /**
   * 获取客户端ID
   */
  public getClientId(): number {
    return this.clientId;
  }

  /**
   * 获取统计信息
   */
  public getStats() {
    return { ...this.stats };
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    if (!this.client) return;

    // 连接断开处理
    this.client.flows.postDisconnectFlow.push((v) => {
      if (this.connectionState !== 'disconnected') {
        logger.warn('连接意外断开，尝试重连...');
        this.connectionState = 'reconnecting';
        this.onReconnecting?.();
        this.attemptReconnect();
      }
      return v;
    });

    // 消息监听
    this.client.listenMsg('network/NetworkMessage', msg => {
      this.stats.messagesReceived++;
      
      const networkMessage: NetworkMessage = {
        type: msg.type,
        networkId: msg.networkId,
        data: msg.data,
        timestamp: msg.timestamp
      };

      this.onMessage?.(networkMessage);
    });

    // SyncVar消息监听
    this.client.listenMsg('network/SyncVar', msg => {
      this.stats.messagesReceived++;
      
      const networkMessage: NetworkMessage = {
        type: 'syncvar',
        networkId: msg.networkId,
        data: {
          componentType: msg.componentType,
          propertyName: msg.propertyName,
          value: msg.value
        },
        timestamp: msg.timestamp
      };

      this.onMessage?.(networkMessage);
    });

    // RPC消息监听
    this.client.listenMsg('network/RpcCall', msg => {
      this.stats.messagesReceived++;
      
      const networkMessage: NetworkMessage = {
        type: 'rpc',
        networkId: msg.networkId,
        data: {
          componentType: msg.componentType,
          methodName: msg.methodName,
          args: msg.args
        },
        timestamp: msg.timestamp
      };

      this.onMessage?.(networkMessage);
    });

    // 客户端断开通知
    this.client.listenMsg('network/ClientDisconnected', msg => {
      logger.info(`客户端 ${msg.clientId} 断开连接: ${msg.reason}`);
    });

    // 权威转移通知
    this.client.listenMsg('network/AuthorityChange', msg => {
      logger.info(`网络对象 ${msg.networkId} 权威转移给客户端 ${msg.newOwnerId}`);
    });
  }

  /**
   * 尝试重连
   */
  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('重连次数已达上限，停止重连');
      this.connectionState = 'disconnected';
      this.onDisconnected?.('max_reconnect_attempts_reached');
      return;
    }

    this.reconnectAttempts++;
    logger.info(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    try {
      await new Promise(resolve => setTimeout(resolve, this.reconnectInterval));
      
      // 重新连接
      await this.connect();
      
    } catch (error) {
      logger.error(`重连失败:`, error);
      // 继续尝试重连
      this.attemptReconnect();
    }
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.ping();
      } catch (error) {
        logger.warn('心跳失败:', error);
      }
    }, 30000); // 30秒心跳
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}