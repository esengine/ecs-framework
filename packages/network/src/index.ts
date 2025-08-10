/**
 * ECS Network Library
 * 
 * 基于 ECS 架构和 TSRPC 的网络同步库
 * 提供简洁易用的网络组件和同步机制
 */

// 核心组件
export { NetworkManager } from './NetworkManager';
export { NetworkIdentity } from './NetworkIdentity';
export { NetworkBehaviour } from './NetworkBehaviour';

// 装饰器
export { SyncVar } from './decorators/SyncVar';
export { ClientRpc } from './decorators/ClientRpc';
export { Command } from './decorators/Command';

// 核心管理器
export { SyncVarManager } from './core/SyncVarManager';
export { RpcManager } from './core/RpcManager';
export { NetworkRegistry } from './core/NetworkRegistry';

// 传输层
export * from './transport';

// 类型定义
export * from './types/NetworkTypes';