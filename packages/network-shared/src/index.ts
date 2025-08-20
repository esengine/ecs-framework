/**
 * @esengine/network-shared
 * ECS Framework网络层 - 共享组件和协议
 */

// 类型定义
export * from './types/NetworkTypes';
export * from './types/TransportTypes';
export * from './types/RpcTypes';

// 协议消息
export * from './protocols/MessageTypes';
export * from './protocols/MessageManager';

// 核心组件
export * from './components/NetworkIdentity';

// 传输层
export * from './transport/HeartbeatManager';
export * from './transport/ErrorHandler';

// 事件系统
export * from './events/NetworkEvents';

// 序列化系统
export * from './serialization/JSONSerializer';
export * from './serialization/MessageCompressor';
export { 
    SyncVarSerializer, 
    SyncVarSerializerConfig,
    SerializationResult as SyncVarSerializationResult,
    DeserializationResult as SyncVarDeserializationResult,
    DeltaData as SyncVarDeltaData,
    CompressionMetadata 
} from './serialization/SyncVarSerializer';

// 装饰器系统
export * from './decorators';

// RPC系统
export * from './rpc/RpcMetadataManager';
export * from './rpc/RpcCallHandler';
export * from './rpc/RpcCallProxy';
export * from './rpc/RpcReliabilityManager';

// 同步系统
export { SyncVarManager, SyncBatch } from './sync/SyncVarManager';
export { 
    DeltaSync, 
    DeltaSyncConfig,
    DeltaData,
    DeltaOperationType,
    DeltaOperation,
    VersionedData,
    DeltaSyncStats 
} from './sync/DeltaSync';

// 监控系统
export * from './monitoring';

// 工具类
export * from './utils';