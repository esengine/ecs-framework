/**
 * TSRPC 传输管理器
 * 
 * 统一管理TSRPC服务端和客户端，提供通用的传输接口
 */

import { createLogger } from '@esengine/ecs-framework';
import { TsrpcServer } from './TsrpcServer';
import { TsrpcClient } from './TsrpcClient';
import { NetworkConfig, NetworkMessage, NetworkSide } from '../Types/NetworkTypes';

const logger = createLogger('TsrpcTransport');

/**
 * 传输事件处理器
 */
export interface TransportEventHandlers {
  /** 连接建立 */
  onConnected?: () => void;
  /** 连接断开 */
  onDisconnected?: (reason?: string) => void;
  /** 客户端连接（仅服务端） */
  onClientConnected?: (clientId: number) => void;
  /** 客户端断开（仅服务端） */
  onClientDisconnected?: (clientId: number, reason?: string) => void;
  /** 收到消息 */
  onMessage?: (message: NetworkMessage, fromClientId?: number) => void;
  /** 发生错误 */
  onError?: (error: Error) => void;
}

/**
 * TSRPC传输层管理器
 */
export class TsrpcTransport {
  private server: TsrpcServer | null = null;
  private client: TsrpcClient | null = null;
  private networkSide: NetworkSide = 'client';
  private config: NetworkConfig;
  private eventHandlers: TransportEventHandlers = {};

  constructor(config: NetworkConfig) {
    this.config = config;
  }

  /**
   * 启动服务端
   */
  public async startServer(): Promise<void> {
    if (this.server) {
      throw new Error('服务端已经在运行中');
    }

    this.networkSide = 'server';
    this.server = new TsrpcServer(this.config);

    // 设置服务端事件处理器
    this.server.onClientConnected = (clientId) => {
      logger.info(`客户端 ${clientId} 已连接`);
      this.eventHandlers.onClientConnected?.(clientId);
    };

    this.server.onClientDisconnected = (clientId, reason) => {
      logger.info(`客户端 ${clientId} 已断开: ${reason}`);
      this.eventHandlers.onClientDisconnected?.(clientId, reason);
    };

    this.server.onMessage = (message, fromClientId) => {
      this.eventHandlers.onMessage?.(message, fromClientId);
    };

    await this.server.start();
    logger.info('TSRPC服务端已启动');
    this.eventHandlers.onConnected?.();
  }

  /**
   * 连接到服务端
   */
  public async connectToServer(): Promise<void> {
    if (this.client) {
      throw new Error('客户端已经连接或正在连接中');
    }

    this.networkSide = 'client';
    this.client = new TsrpcClient(this.config);

    // 设置客户端事件处理器
    this.client.onConnected = () => {
      logger.info('已连接到服务端');
      this.eventHandlers.onConnected?.();
    };

    this.client.onDisconnected = (reason) => {
      logger.info(`已断开连接: ${reason}`);
      this.eventHandlers.onDisconnected?.(reason);
    };

    this.client.onMessage = (message) => {
      this.eventHandlers.onMessage?.(message);
    };

    this.client.onError = (error) => {
      logger.error('客户端错误:', error);
      this.eventHandlers.onError?.(error);
    };

    await this.client.connect();
  }

  /**
   * 断开连接/停止服务端
   */
  public async disconnect(): Promise<void> {
    if (this.server) {
      await this.server.stop();
      this.server = null;
      logger.info('TSRPC服务端已停止');
    }

    if (this.client) {
      await this.client.disconnect();
      this.client = null;
      logger.info('TSRPC客户端已断开');
    }

    this.eventHandlers.onDisconnected?.();
  }

  /**
   * 发送消息
   */
  public async sendMessage(message: NetworkMessage, targetClientId?: number): Promise<void> {
    if (this.networkSide === 'server' && this.server) {
      // 服务端模式：发送给指定客户端或广播
      if (targetClientId) {
        this.server.sendToClient(targetClientId, {
          type: 'network/NetworkMessage',
          data: message
        });
      } else {
        this.server.broadcast({
          type: 'network/NetworkMessage',
          data: message
        });
      }
    } else if (this.networkSide === 'client' && this.client) {
      // 客户端模式：发送给服务端
      await this.client.sendMessage(message);
    } else {
      throw new Error('传输层未初始化或状态错误');
    }
  }

  /**
   * 发送SyncVar消息
   */
  public async sendSyncVar(
    networkId: number,
    componentType: string,
    propertyName: string,
    value: any,
    targetClientId?: number
  ): Promise<void> {
    if (this.networkSide === 'server' && this.server) {
      const message = {
        type: 'network/SyncVar',
        data: {
          networkId,
          componentType,
          propertyName,
          value,
          timestamp: Date.now()
        }
      };

      if (targetClientId) {
        this.server.sendToClient(targetClientId, message);
      } else {
        this.server.broadcast(message);
      }
    } else if (this.networkSide === 'client' && this.client) {
      await this.client.sendSyncVar(networkId, componentType, propertyName, value);
    } else {
      throw new Error('传输层未初始化或状态错误');
    }
  }

  /**
   * 发送RPC消息
   */
  public async sendRpcCall(
    networkId: number,
    componentType: string,
    methodName: string,
    args: any[],
    isClientRpc: boolean,
    targetClientId?: number
  ): Promise<void> {
    if (this.networkSide === 'server' && this.server) {
      const message = {
        type: 'network/RpcCall',
        data: {
          networkId,
          componentType,
          methodName,
          args,
          isClientRpc,
          timestamp: Date.now()
        }
      };

      if (targetClientId) {
        this.server.sendToClient(targetClientId, message);
      } else {
        this.server.broadcast(message);
      }
    } else if (this.networkSide === 'client' && this.client) {
      await this.client.sendRpcCall(networkId, componentType, methodName, args, isClientRpc);
    } else {
      throw new Error('传输层未初始化或状态错误');
    }
  }

  /**
   * 获取连接状态
   */
  public isConnected(): boolean {
    if (this.networkSide === 'server' && this.server) {
      return true; // 服务端启动即为连接状态
    } else if (this.networkSide === 'client' && this.client) {
      return this.client.isConnected();
    }
    return false;
  }

  /**
   * 获取网络端类型
   */
  public getNetworkSide(): NetworkSide {
    return this.networkSide;
  }

  /**
   * 获取客户端ID（仅客户端模式）
   */
  public getClientId(): number {
    if (this.networkSide === 'client' && this.client) {
      return this.client.getClientId();
    }
    return 0;
  }

  /**
   * 获取连接的客户端列表（仅服务端模式）
   */
  public getConnectedClients(): number[] {
    if (this.networkSide === 'server' && this.server) {
      return this.server.getConnectedClients();
    }
    return [];
  }

  /**
   * 获取客户端数量（仅服务端模式）
   */
  public getClientCount(): number {
    if (this.networkSide === 'server' && this.server) {
      return this.server.getClientCount();
    }
    return 0;
  }

  /**
   * 获取统计信息
   */
  public getStats() {
    if (this.networkSide === 'server' && this.server) {
      return this.server.getStats();
    } else if (this.networkSide === 'client' && this.client) {
      const clientStats = this.client.getStats();
      return {
        messagesSent: clientStats.messagesSent,
        messagesReceived: clientStats.messagesReceived,
        bytesSent: clientStats.bytesSent,
        bytesReceived: clientStats.bytesReceived,
        clientCount: 0,
        uptime: 0
      };
    }
    
    return {
      messagesSent: 0,
      messagesReceived: 0,
      bytesSent: 0,
      bytesReceived: 0,
      clientCount: 0,
      uptime: 0
    };
  }

  /**
   * 查询服务端状态（仅客户端模式）
   */
  public async getServerStatus() {
    if (this.networkSide === 'client' && this.client) {
      return await this.client.getServerStatus();
    }
    throw new Error('只能在客户端模式下查询服务端状态');
  }

  /**
   * 发送心跳（仅客户端模式）
   */
  public async ping(): Promise<number> {
    if (this.networkSide === 'client' && this.client) {
      return await this.client.ping();
    }
    throw new Error('只能在客户端模式下发送心跳');
  }

  /**
   * 设置事件处理器
   */
  public setEventHandlers(handlers: TransportEventHandlers): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  /**
   * 设置单个事件处理器
   */
  public on<K extends keyof TransportEventHandlers>(
    event: K,
    handler: TransportEventHandlers[K]
  ): void {
    this.eventHandlers[event] = handler;
  }
}