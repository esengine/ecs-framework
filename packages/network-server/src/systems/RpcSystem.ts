/**
 * RPC 系统
 * 
 * 处理服务端的 RPC 调用、权限验证、参数验证等
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { 
  NetworkValue, 
  RpcMetadata 
} from '@esengine/ecs-framework-network-shared';
import { ClientConnection } from '../core/ClientConnection';
import { Room } from '../rooms/Room';
import { TransportMessage } from '../core/Transport';

/**
 * RPC 调用记录
 */
export interface RpcCall {
  /** 调用ID */
  id: string;
  /** 网络对象ID */
  networkId: number;
  /** 组件类型 */
  componentType: string;
  /** 方法名 */
  methodName: string;
  /** 参数 */
  parameters: NetworkValue[];
  /** 元数据 */
  metadata: RpcMetadata;
  /** 发送者客户端ID */
  senderId: string;
  /** 目标客户端IDs（用于 ClientRpc） */
  targetClientIds?: string[];
  /** 是否需要响应 */
  requiresResponse: boolean;
  /** 时间戳 */
  timestamp: Date;
  /** 过期时间 */
  expiresAt?: Date;
}

/**
 * RPC 响应
 */
export interface RpcResponse {
  /** 调用ID */
  callId: string;
  /** 是否成功 */
  success: boolean;
  /** 返回值 */
  result?: NetworkValue;
  /** 错误信息 */
  error?: string;
  /** 错误代码 */
  errorCode?: string;
  /** 时间戳 */
  timestamp: Date;
}

/**
 * RPC 系统配置
 */
export interface RpcSystemConfig {
  /** RPC 调用超时时间(毫秒) */
  callTimeout?: number;
  /** 最大并发 RPC 调用数 */
  maxConcurrentCalls?: number;
  /** 是否启用权限检查 */
  enablePermissionCheck?: boolean;
  /** 是否启用参数验证 */
  enableParameterValidation?: boolean;
  /** 是否启用频率限制 */
  enableRateLimit?: boolean;
  /** 最大 RPC 频率(调用/秒) */
  maxRpcRate?: number;
  /** 单个参数最大大小(字节) */
  maxParameterSize?: number;
}

/**
 * RPC 系统事件
 */
export interface RpcSystemEvents {
  /** ClientRpc 调用 */
  'client-rpc-called': (call: RpcCall) => void;
  /** ServerRpc 调用 */
  'server-rpc-called': (call: RpcCall) => void;
  /** RPC 调用完成 */
  'rpc-completed': (call: RpcCall, response?: RpcResponse) => void;
  /** RPC 调用超时 */
  'rpc-timeout': (callId: string) => void;
  /** 权限验证失败 */
  'permission-denied': (clientId: string, call: RpcCall) => void;
  /** 参数验证失败 */
  'parameter-validation-failed': (clientId: string, call: RpcCall, reason: string) => void;
  /** 频率限制触发 */
  'rate-limit-exceeded': (clientId: string) => void;
  /** RPC 错误 */
  'rpc-error': (error: Error, callId?: string, clientId?: string) => void;
}

/**
 * 客户端 RPC 状态
 */
interface ClientRpcState {
  /** 客户端ID */
  clientId: string;
  /** 活跃的调用 */
  activeCalls: Map<string, RpcCall>;
  /** RPC 调用计数 */
  rpcCount: number;
  /** 频率重置时间 */
  rateResetTime: Date;
}

/**
 * 待处理的 RPC 响应
 */
interface PendingRpcResponse {
  /** 调用信息 */
  call: RpcCall;
  /** 超时定时器 */
  timeoutTimer: NodeJS.Timeout;
  /** 响应回调 */
  responseCallback: (response: RpcResponse) => void;
}

/**
 * RPC 系统
 */
export class RpcSystem extends EventEmitter {
  private config: RpcSystemConfig;
  private clientStates = new Map<string, ClientRpcState>();
  private pendingCalls = new Map<string, PendingRpcResponse>();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: RpcSystemConfig = {}) {
    super();
    
    this.config = {
      callTimeout: 30000, // 30秒
      maxConcurrentCalls: 10,
      enablePermissionCheck: true,
      enableParameterValidation: true,
      enableRateLimit: true,
      maxRpcRate: 30, // 30次/秒
      maxParameterSize: 65536, // 64KB
      ...config
    };

    this.initialize();
  }

  /**
   * 处理 ClientRpc 调用
   */
  async handleClientRpcCall(
    client: ClientConnection,
    message: TransportMessage,
    room: Room
  ): Promise<void> {
    try {
      const data = message.data as any;
      const {
        networkId,
        componentType,
        methodName,
        parameters = [],
        metadata,
        targetFilter = 'all'
      } = data;

      // 创建 RPC 调用记录
      const rpcCall: RpcCall = {
        id: uuidv4(),
        networkId,
        componentType,
        methodName,
        parameters,
        metadata,
        senderId: client.id,
        requiresResponse: metadata?.requiresResponse || false,
        timestamp: new Date()
      };

      // 权限检查
      if (this.config.enablePermissionCheck) {
        if (!this.checkRpcPermission(client, rpcCall, 'client-rpc')) {
          this.emit('permission-denied', client.id, rpcCall);
          return;
        }
      }

      // 频率限制检查
      if (this.config.enableRateLimit && !this.checkRpcRate(client.id)) {
        this.emit('rate-limit-exceeded', client.id);
        return;
      }

      // 参数验证
      if (this.config.enableParameterValidation) {
        const validationResult = this.validateRpcParameters(rpcCall);
        if (!validationResult.valid) {
          this.emit('parameter-validation-failed', client.id, rpcCall, validationResult.reason!);
          return;
        }
      }

      // 确定目标客户端
      const targetClientIds = this.getClientRpcTargets(room, client.id, targetFilter);
      rpcCall.targetClientIds = targetClientIds;

      // 记录活跃调用
      this.recordActiveCall(client.id, rpcCall);

      // 触发事件
      this.emit('client-rpc-called', rpcCall);

      // 发送到目标客户端
      await this.sendClientRpc(room, rpcCall, targetClientIds);

      // 如果不需要响应，立即标记完成
      if (!rpcCall.requiresResponse) {
        this.completeRpcCall(rpcCall);
      }

    } catch (error) {
      this.emit('rpc-error', error as Error, undefined, client.id);
    }
  }

  /**
   * 处理 ServerRpc 调用
   */
  async handleServerRpcCall(
    client: ClientConnection,
    message: TransportMessage,
    room: Room
  ): Promise<void> {
    try {
      const data = message.data as any;
      const {
        networkId,
        componentType,
        methodName,
        parameters = [],
        metadata
      } = data;

      // 创建 RPC 调用记录
      const rpcCall: RpcCall = {
        id: uuidv4(),
        networkId,
        componentType,
        methodName,
        parameters,
        metadata,
        senderId: client.id,
        requiresResponse: metadata?.requiresResponse || false,
        timestamp: new Date()
      };

      // 权限检查
      if (this.config.enablePermissionCheck) {
        if (!this.checkRpcPermission(client, rpcCall, 'server-rpc')) {
          this.emit('permission-denied', client.id, rpcCall);
          return;
        }
      }

      // 频率限制检查
      if (this.config.enableRateLimit && !this.checkRpcRate(client.id)) {
        this.emit('rate-limit-exceeded', client.id);
        return;
      }

      // 参数验证
      if (this.config.enableParameterValidation) {
        const validationResult = this.validateRpcParameters(rpcCall);
        if (!validationResult.valid) {
          this.emit('parameter-validation-failed', client.id, rpcCall, validationResult.reason!);
          return;
        }
      }

      // 记录活跃调用
      this.recordActiveCall(client.id, rpcCall);

      // 触发事件
      this.emit('server-rpc-called', rpcCall);

      // ServerRpc 在服务端执行，这里需要实际的执行逻辑
      // 在实际使用中，应该通过事件或回调来执行具体的方法
      const response = await this.executeServerRpc(rpcCall);

      // 发送响应（如果需要）
      if (rpcCall.requiresResponse && response) {
        await this.sendRpcResponse(client, response);
      }

      this.completeRpcCall(rpcCall, response || undefined);

    } catch (error) {
      this.emit('rpc-error', error as Error, undefined, client.id);
      
      // 发送错误响应
      if (message.data && (message.data as any).requiresResponse) {
        const errorResponse: RpcResponse = {
          callId: (message.data as any).callId || uuidv4(),
          success: false,
          error: (error as Error).message,
          errorCode: 'EXECUTION_ERROR',
          timestamp: new Date()
        };
        await this.sendRpcResponse(client, errorResponse);
      }
    }
  }

  /**
   * 处理 RPC 响应
   */
  async handleRpcResponse(
    client: ClientConnection,
    message: TransportMessage
  ): Promise<void> {
    try {
      const response = message.data as any as RpcResponse;
      const pendingCall = this.pendingCalls.get(response.callId);

      if (pendingCall) {
        // 清除超时定时器
        clearTimeout(pendingCall.timeoutTimer);
        this.pendingCalls.delete(response.callId);

        // 调用响应回调
        pendingCall.responseCallback(response);

        // 完成调用
        this.completeRpcCall(pendingCall.call, response);
      }

    } catch (error) {
      this.emit('rpc-error', error as Error, undefined, client.id);
    }
  }

  /**
   * 调用 ClientRpc（从服务端向客户端发送）
   */
  async callClientRpc(
    room: Room,
    networkId: number,
    componentType: string,
    methodName: string,
    parameters: NetworkValue[] = [],
    options: {
      targetFilter?: 'all' | 'others' | 'owner' | string[];
      requiresResponse?: boolean;
      timeout?: number;
    } = {}
  ): Promise<RpcResponse[]> {
    const rpcCall: RpcCall = {
      id: uuidv4(),
      networkId,
      componentType,
      methodName,
      parameters,
      metadata: {
        methodName,
        rpcType: 'client-rpc',
        requiresAuth: false,
        reliable: true,
        requiresResponse: options.requiresResponse || false
      },
      senderId: 'server',
      requiresResponse: options.requiresResponse || false,
      timestamp: new Date()
    };

    // 确定目标客户端
    const targetClientIds = typeof options.targetFilter === 'string' 
      ? this.getClientRpcTargets(room, 'server', options.targetFilter)
      : options.targetFilter || [];

    rpcCall.targetClientIds = targetClientIds;

    // 发送到目标客户端
    await this.sendClientRpc(room, rpcCall, targetClientIds);

    // 如果需要响应，等待响应
    if (options.requiresResponse) {
      return await this.waitForRpcResponses(rpcCall, targetClientIds, options.timeout);
    }

    this.completeRpcCall(rpcCall);
    return [];
  }

  /**
   * 获取客户端统计信息
   */
  getClientRpcStats(clientId: string): {
    activeCalls: number;
    totalCalls: number;
  } {
    const state = this.clientStates.get(clientId);
    return {
      activeCalls: state?.activeCalls.size || 0,
      totalCalls: state?.rpcCount || 0
    };
  }

  /**
   * 取消所有客户端的 RPC 调用
   */
  cancelClientRpcs(clientId: string): number {
    const state = this.clientStates.get(clientId);
    if (!state) {
      return 0;
    }

    const cancelledCount = state.activeCalls.size;
    
    // 取消所有活跃调用
    for (const call of state.activeCalls.values()) {
      this.completeRpcCall(call);
    }

    state.activeCalls.clear();
    return cancelledCount;
  }

  /**
   * 销毁 RPC 系统
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // 清除所有待处理的调用
    for (const pending of this.pendingCalls.values()) {
      clearTimeout(pending.timeoutTimer);
    }

    this.clientStates.clear();
    this.pendingCalls.clear();
    this.removeAllListeners();
  }

  /**
   * 初始化系统
   */
  private initialize(): void {
    // 启动清理定时器（每分钟清理一次）
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * 检查 RPC 权限
   */
  private checkRpcPermission(
    client: ClientConnection, 
    call: RpcCall, 
    rpcType: 'client-rpc' | 'server-rpc'
  ): boolean {
    // 基本权限检查
    if (!client.hasPermission('canSendRpc')) {
      return false;
    }

    // ServerRpc 额外权限检查
    if (rpcType === 'server-rpc' && call.metadata.requiresAuth) {
      if (!client.isAuthenticated) {
        return false;
      }
    }

    // 可以添加更多特定的权限检查逻辑
    return true;
  }

  /**
   * 检查 RPC 频率
   */
  private checkRpcRate(clientId: string): boolean {
    if (!this.config.maxRpcRate || this.config.maxRpcRate <= 0) {
      return true;
    }

    const now = new Date();
    let state = this.clientStates.get(clientId);

    if (!state) {
      state = {
        clientId,
        activeCalls: new Map(),
        rpcCount: 1,
        rateResetTime: new Date(now.getTime() + 1000)
      };
      this.clientStates.set(clientId, state);
      return true;
    }

    // 检查是否需要重置计数
    if (now >= state.rateResetTime) {
      state.rpcCount = 1;
      state.rateResetTime = new Date(now.getTime() + 1000);
      return true;
    }

    // 检查频率限制
    if (state.rpcCount >= this.config.maxRpcRate) {
      return false;
    }

    state.rpcCount++;
    return true;
  }

  /**
   * 验证 RPC 参数
   */
  private validateRpcParameters(call: RpcCall): { valid: boolean; reason?: string } {
    // 检查参数数量
    if (call.parameters.length > 10) {
      return { valid: false, reason: 'Too many parameters' };
    }

    // 检查每个参数的大小
    for (let i = 0; i < call.parameters.length; i++) {
      const param = call.parameters[i];
      try {
        const serialized = JSON.stringify(param);
        if (serialized.length > this.config.maxParameterSize!) {
          return { valid: false, reason: `Parameter ${i} is too large` };
        }
      } catch (error) {
        return { valid: false, reason: `Parameter ${i} is not serializable` };
      }
    }

    return { valid: true };
  }

  /**
   * 获取 ClientRpc 目标客户端
   */
  private getClientRpcTargets(
    room: Room, 
    senderId: string, 
    targetFilter: string
  ): string[] {
    const players = room.getPlayers();
    
    switch (targetFilter) {
      case 'all':
        return players.map(p => p.client.id);
      
      case 'others':
        return players
          .filter(p => p.client.id !== senderId)
          .map(p => p.client.id);
      
      case 'owner':
        const owner = room.getOwner();
        return owner ? [owner.client.id] : [];
      
      default:
        return [];
    }
  }

  /**
   * 发送 ClientRpc
   */
  private async sendClientRpc(
    room: Room, 
    call: RpcCall, 
    targetClientIds: string[]
  ): Promise<void> {
    const message: TransportMessage = {
      type: 'rpc',
      data: {
        action: 'client-rpc',
        callId: call.id,
        networkId: call.networkId,
        componentType: call.componentType,
        methodName: call.methodName,
        parameters: call.parameters,
        metadata: call.metadata as any,
        requiresResponse: call.requiresResponse,
        timestamp: call.timestamp.getTime()
      } as any
    };

    // 发送给目标客户端
    const promises = targetClientIds.map(clientId => 
      room.sendToPlayer(clientId, message)
    );

    await Promise.allSettled(promises);
  }

  /**
   * 执行 ServerRpc
   */
  private async executeServerRpc(call: RpcCall): Promise<RpcResponse | null> {
    // 这里应该是实际的服务端方法执行逻辑
    // 在实际实现中，可能需要通过事件或回调来执行具体的方法
    
    // 示例响应
    const response: RpcResponse = {
      callId: call.id,
      success: true,
      result: undefined, // 实际执行结果
      timestamp: new Date()
    };

    return response;
  }

  /**
   * 发送 RPC 响应
   */
  private async sendRpcResponse(
    client: ClientConnection, 
    response: RpcResponse
  ): Promise<void> {
    const message: TransportMessage = {
      type: 'rpc',
      data: {
        action: 'rpc-response',
        ...response
      } as any
    };

    await client.sendMessage(message);
  }

  /**
   * 等待 RPC 响应
   */
  private async waitForRpcResponses(
    call: RpcCall, 
    targetClientIds: string[], 
    timeout?: number
  ): Promise<RpcResponse[]> {
    return new Promise((resolve) => {
      const responses: RpcResponse[] = [];
      const responseTimeout = timeout || this.config.callTimeout!;
      let responseCount = 0;

      const responseCallback = (response: RpcResponse) => {
        responses.push(response);
        responseCount++;

        // 如果收到所有响应，立即resolve
        if (responseCount >= targetClientIds.length) {
          resolve(responses);
        }
      };

      // 设置超时
      const timeoutTimer = setTimeout(() => {
        resolve(responses); // 返回已收到的响应
        this.emit('rpc-timeout', call.id);
      }, responseTimeout);

      // 注册待处理的响应
      this.pendingCalls.set(call.id, {
        call,
        timeoutTimer,
        responseCallback
      });
    });
  }

  /**
   * 记录活跃调用
   */
  private recordActiveCall(clientId: string, call: RpcCall): void {
    let state = this.clientStates.get(clientId);
    if (!state) {
      state = {
        clientId,
        activeCalls: new Map(),
        rpcCount: 0,
        rateResetTime: new Date()
      };
      this.clientStates.set(clientId, state);
    }

    state.activeCalls.set(call.id, call);
  }

  /**
   * 完成 RPC 调用
   */
  private completeRpcCall(call: RpcCall, response?: RpcResponse): void {
    // 从活跃调用中移除
    const state = this.clientStates.get(call.senderId);
    if (state) {
      state.activeCalls.delete(call.id);
    }

    // 触发完成事件
    this.emit('rpc-completed', call, response);
  }

  /**
   * 清理过期的调用和状态
   */
  private cleanup(): void {
    const now = new Date();
    let cleanedCalls = 0;
    let cleanedStates = 0;

    // 清理过期的待处理调用
    for (const [callId, pending] of this.pendingCalls.entries()) {
      if (pending.call.expiresAt && pending.call.expiresAt < now) {
        clearTimeout(pending.timeoutTimer);
        this.pendingCalls.delete(callId);
        cleanedCalls++;
      }
    }

    // 清理空的客户端状态
    for (const [clientId, state] of this.clientStates.entries()) {
      if (state.activeCalls.size === 0 && 
          now.getTime() - state.rateResetTime.getTime() > 60000) {
        this.clientStates.delete(clientId);
        cleanedStates++;
      }
    }

    if (cleanedCalls > 0 || cleanedStates > 0) {
      console.log(`RPC cleanup: ${cleanedCalls} calls, ${cleanedStates} states`);
    }
  }

  /**
   * 类型安全的事件监听
   */
  override on<K extends keyof RpcSystemEvents>(event: K, listener: RpcSystemEvents[K]): this {
    return super.on(event, listener);
  }

  /**
   * 类型安全的事件触发
   */
  override emit<K extends keyof RpcSystemEvents>(event: K, ...args: Parameters<RpcSystemEvents[K]>): boolean {
    return super.emit(event, ...args);
  }
}