/**
 * ECS Framework Network Plugin - 网络插件
 * 
 * 为ECS框架提供完整的网络同步和多人游戏功能
 * 支持客户端-服务端模式
 */

// 核心网络管理
export * from './Core';

// 消息系统
export * from './Messaging';

// SyncVar同步变量系统
export * from './SyncVar';

// 网络组件基类
export { NetworkComponent } from './NetworkComponent';
export { INetworkSyncable } from './INetworkSyncable';
export { NetworkRole } from './NetworkRole';

// Protobuf序列化系统
export * from './Serialization';

// 快照系统（帧同步）
export * from './Snapshot';