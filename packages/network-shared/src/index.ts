/**
 * @esengine/network-shared
 * ECS Framework网络层 - 共享组件和协议
 */

// 类型定义
export * from './types/NetworkTypes';
export * from './types/TransportTypes';

// 协议消息
export * from './protocols/MessageTypes';

// 核心组件
export * from './components/NetworkIdentity';

// 装饰器系统 (待实现)
// export * from './decorators/SyncVar';
// export * from './decorators/ServerRpc';
// export * from './decorators/ClientRpc';
// export * from './decorators/NetworkComponent';

// 事件系统
export * from './events/NetworkEvents';

// 序列化系统 (待实现)
// export * from './serialization/NetworkSerializer';