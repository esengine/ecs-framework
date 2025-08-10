/**
 * RPC 管理器
 * 
 * 负责处理客户端 RPC 和命令的注册、调用和消息路由
 */

import { createLogger } from '@esengine/ecs-framework';
import { NetworkBehaviour } from '../NetworkBehaviour';
import { NetworkRegistry } from './NetworkRegistry';
import { RpcMessage, RpcMetadata } from '../types/NetworkTypes';
import { getClientRpcMetadata } from '../decorators/ClientRpc';
import { getCommandMetadata } from '../decorators/Command';

const logger = createLogger('RpcManager');

/**
 * RPC 调用信息
 */
interface RpcCall {
  networkId: number;
  componentType: string;
  methodName: string;
  args: any[];
  timestamp: number;
  isClientRpc: boolean;
}

export class RpcManager {
  private static _instance: RpcManager | null = null;

  /** 已注册的网络组件类型 */
  private registeredComponents: Set<string> = new Set();

  /** 待发送的 RPC 调用队列 */
  private pendingRpcCalls: RpcCall[] = [];

  public static get instance(): RpcManager {
    if (!RpcManager._instance) {
      RpcManager._instance = new RpcManager();
    }
    return RpcManager._instance;
  }

  private constructor() {}

  /**
   * 注册网络组件的 RPC 方法
   */
  public registerComponent(component: NetworkBehaviour): void {
    const componentType = component.constructor.name;
    
    if (this.registeredComponents.has(componentType)) {
      return; // 已经注册过了
    }

    // 获取 ClientRpc 和 Command 元数据
    const clientRpcMetadata = getClientRpcMetadata(component.constructor);
    const commandMetadata = getCommandMetadata(component.constructor);
    
    if (clientRpcMetadata.length === 0 && commandMetadata.length === 0) {
      return; // 没有 RPC 方法
    }

    this.registeredComponents.add(componentType);
    
    logger.debug(`注册 RPC 组件: ${componentType}, ClientRpc: ${clientRpcMetadata.length}, Commands: ${commandMetadata.length}`);
  }

  /**
   * 添加 ClientRpc 调用到队列
   */
  public addClientRpcCall(
    networkId: number,
    componentType: string,
    methodName: string,
    args: any[] = []
  ): void {
    const rpcCall: RpcCall = {
      networkId,
      componentType,
      methodName,
      args,
      timestamp: Date.now(),
      isClientRpc: true
    };

    this.pendingRpcCalls.push(rpcCall);
    logger.debug(`添加 ClientRpc 调用: ${componentType}.${methodName}`);
  }

  /**
   * 添加 Command 调用到队列
   */
  public addCommandCall(
    networkId: number,
    componentType: string,
    methodName: string,
    args: any[] = []
  ): void {
    const rpcCall: RpcCall = {
      networkId,
      componentType,
      methodName,
      args,
      timestamp: Date.now(),
      isClientRpc: false
    };

    this.pendingRpcCalls.push(rpcCall);
    logger.debug(`添加 Command 调用: ${componentType}.${methodName}`);
  }

  /**
   * 获取待发送的 RPC 消息
   */
  public getPendingRpcMessages(): RpcMessage[] {
    const messages: RpcMessage[] = [];

    for (const rpcCall of this.pendingRpcCalls) {
      messages.push({
        type: 'rpc',
        networkId: rpcCall.networkId,
        data: {
          componentType: rpcCall.componentType,
          methodName: rpcCall.methodName,
          args: rpcCall.args
        },
        methodName: rpcCall.methodName,
        args: rpcCall.args,
        isClientRpc: rpcCall.isClientRpc,
        timestamp: rpcCall.timestamp
      });
    }

    // 清空待发送队列
    this.pendingRpcCalls.length = 0;
    return messages;
  }

  /**
   * 处理收到的 RPC 消息
   */
  public handleRpcMessage(message: RpcMessage): void {
    const networkIdentity = NetworkRegistry.instance.find(message.networkId);
    if (!networkIdentity) {
      logger.warn(`找不到网络ID为 ${message.networkId} 的对象`);
      return;
    }

    // 找到对应的组件
    const targetComponent = networkIdentity.networkBehaviours
      .find(b => b.constructor.name === message.data.componentType);
    
    if (!targetComponent) {
      logger.warn(`找不到组件: ${message.data.componentType} (网络ID: ${message.networkId})`);
      return;
    }

    // 验证方法是否存在
    const method = (targetComponent as any)[message.methodName];
    if (typeof method !== 'function') {
      logger.warn(`方法不存在: ${message.data.componentType}.${message.methodName}`);
      return;
    }

    // 验证权限
    if (!this.validateRpcPermission(targetComponent as NetworkBehaviour, message)) {
      return;
    }

    try {
      // 执行方法
      method.apply(targetComponent, message.args);
      logger.debug(`执行 RPC: ${message.data.componentType}.${message.methodName}`);
    } catch (error) {
      logger.error(`RPC 执行失败: ${message.data.componentType}.${message.methodName}`, error);
    }
  }

  /**
   * 验证 RPC 调用权限
   */
  private validateRpcPermission(component: NetworkBehaviour, message: RpcMessage): boolean {
    let metadata: RpcMetadata[] = [];

    if (message.isClientRpc) {
      metadata = getClientRpcMetadata(component.constructor);
    } else {
      metadata = getCommandMetadata(component.constructor);
    }

    const rpcMeta = metadata.find(m => m.methodName === message.methodName);
    if (!rpcMeta) {
      logger.warn(`未找到 RPC 元数据: ${message.data.componentType}.${message.methodName}`);
      return false;
    }

    // 检查权限要求
    if (rpcMeta.requiresAuthority && !component.hasAuthority) {
      logger.warn(`RPC 权限不足: ${message.data.componentType}.${message.methodName}`);
      return false;
    }

    return true;
  }

  /**
   * 清理所有待发送的 RPC 调用
   */
  public clearPendingCalls(): void {
    this.pendingRpcCalls.length = 0;
  }

  /**
   * 获取统计信息
   */
  public getStats() {
    return {
      registeredComponents: this.registeredComponents.size,
      pendingRpcCalls: this.pendingRpcCalls.length
    };
  }
}