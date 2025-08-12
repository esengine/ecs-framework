/**
 * 网络协议编译系统类型定义
 */

/**
 * 序列化类型枚举
 */
export enum SerializeType {
  // 基础类型
  BOOLEAN = 'boolean',
  INT8 = 'int8',
  UINT8 = 'uint8',
  INT16 = 'int16',
  UINT16 = 'uint16',
  INT32 = 'int32',
  UINT32 = 'uint32',
  INT64 = 'int64',
  UINT64 = 'uint64',
  FLOAT32 = 'float32',
  FLOAT64 = 'float64',
  STRING = 'string',
  BYTES = 'bytes',
  
  // 常用游戏类型
  VECTOR2 = 'Vector2',
  VECTOR3 = 'Vector3',
  QUATERNION = 'Quaternion',
  COLOR = 'Color',
  
  // 容器类型
  ARRAY = 'array',
  MAP = 'map',
  
  // 复杂类型
  OBJECT = 'object',
  JSON = 'json'
}

/**
 * 字段定义
 */
export interface ProtocolField {
  /** 字段名 */
  name: string;
  /** 序列化类型 */
  type: SerializeType;
  /** 字段ID（用于向后兼容） */
  id: number;
  /** 是否可选 */
  optional?: boolean;
  /** 是否重复（数组） */
  repeated?: boolean;
  /** 元素类型（用于数组和映射） */
  elementType?: SerializeType;
  /** 键类型（用于映射） */
  keyType?: SerializeType;
  /** 值类型（用于映射） */
  valueType?: SerializeType;
  /** 默认值 */
  defaultValue?: any;
  /** 自定义序列化器 */
  customSerializer?: string;
}

/**
 * RPC 参数定义
 */
export interface RpcParameter {
  /** 参数名 */
  name: string;
  /** 参数类型 */
  type: SerializeType;
  /** 是否可选 */
  optional?: boolean;
  /** 是否为数组 */
  isArray?: boolean;
}

/**
 * RPC 定义
 */
export interface ProtocolRpc {
  /** 方法名 */
  name: string;
  /** RPC ID */
  id: number;
  /** RPC 类型 */
  type: 'client-rpc' | 'server-rpc';
  /** 参数列表 */
  parameters: RpcParameter[];
  /** 返回类型 */
  returnType?: SerializeType;
  /** 是否需要权限 */
  requiresAuth?: boolean;
  /** 是否可靠传输 */
  reliable?: boolean;
  /** 频率限制 */
  rateLimit?: number;
}

/**
 * 网络组件协议定义
 */
export interface ComponentProtocol {
  /** 组件类型名 */
  typeName: string;
  /** 协议版本 */
  version: number;
  /** SyncVar 字段 */
  syncVars: ProtocolField[];
  /** RPC 方法 */
  rpcs: ProtocolRpc[];
  /** 是否启用批量处理 */
  batchEnabled?: boolean;
  /** 是否启用增量同步 */
  deltaEnabled?: boolean;
}

/**
 * 协议模式定义
 */
export interface ProtocolSchema {
  /** 模式版本 */
  version: string;
  /** 组件协议映射 */
  components: Map<string, ComponentProtocol>;
  /** 全局类型定义 */
  types: Map<string, ProtocolField[]>;
  /** 协议兼容性信息 */
  compatibility: {
    minVersion: string;
    maxVersion: string;
  };
}

/**
 * 序列化器接口
 */
export interface IProtocolSerializer {
  /** 序列化单个对象 */
  serialize(obj: any, type: SerializeType): Uint8Array;
  /** 反序列化单个对象 */
  deserialize(data: Uint8Array, type: SerializeType): any;
  /** 批量序列化 */
  serializeBatch(objects: any[], type: SerializeType): Uint8Array;
  /** 批量反序列化 */
  deserializeBatch(data: Uint8Array, type: SerializeType): any[];
  /** 增量序列化 */
  serializeDelta(oldObj: any, newObj: any, type: SerializeType): Uint8Array | null;
  /** 应用增量 */
  applyDelta(baseObj: any, delta: Uint8Array, type: SerializeType): any;
}

/**
 * 协议编译器配置
 */
export interface ProtocolCompilerConfig {
  /** 输入目录 */
  inputDir: string;
  /** 输出目录 */
  outputDir: string;
  /** TypeScript 配置文件路径 */
  tsconfigPath?: string;
  /** 是否启用优化 */
  optimize?: boolean;
  /** 是否生成调试信息 */
  debug?: boolean;
  /** 自定义类型映射 */
  typeMapping?: Map<string, SerializeType>;
  /** 排除的文件模式 */
  excludePatterns?: string[];
}

/**
 * 协议分析结果
 */
export interface ProtocolAnalysisResult {
  /** 分析的文件列表 */
  files: string[];
  /** 发现的网络组件 */
  components: ComponentProtocol[];
  /** 类型依赖图 */
  dependencies: Map<string, string[]>;
  /** 分析错误 */
  errors: ProtocolError[];
  /** 分析警告 */
  warnings: ProtocolWarning[];
}

/**
 * 协议错误
 */
export interface ProtocolError {
  /** 错误类型 */
  type: 'syntax' | 'type' | 'semantic' | 'compatibility';
  /** 错误消息 */
  message: string;
  /** 文件路径 */
  file?: string;
  /** 行号 */
  line?: number;
  /** 列号 */
  column?: number;
}

/**
 * 协议警告
 */
export interface ProtocolWarning {
  /** 警告类型 */
  type: 'performance' | 'compatibility' | 'style';
  /** 警告消息 */
  message: string;
  /** 文件路径 */
  file?: string;
  /** 行号 */
  line?: number;
  /** 列号 */
  column?: number;
}

/**
 * 代码生成选项
 */
export interface CodeGenerationOptions {
  /** 目标平台 */
  platform: 'node' | 'browser' | 'universal';
  /** 代码风格 */
  style: 'typescript' | 'javascript';
  /** 是否生成类型定义 */
  generateTypes?: boolean;
  /** 是否生成文档 */
  generateDocs?: boolean;
  /** 模块格式 */
  moduleFormat?: 'es' | 'cjs' | 'umd';
  /** 压缩级别 */
  minification?: 'none' | 'basic' | 'aggressive';
}

/**
 * 运行时协议信息
 */
export interface RuntimeProtocolInfo {
  /** 协议版本 */
  version: string;
  /** 组件数量 */
  componentCount: number;
  /** 总字段数 */
  fieldCount: number;
  /** 总 RPC 数 */
  rpcCount: number;
  /** 内存使用情况 */
  memoryUsage: {
    schemas: number;
    serializers: number;
    cache: number;
  };
  /** 性能统计 */
  performance: {
    serializeTime: number;
    deserializeTime: number;
    cacheHits: number;
    cacheMisses: number;
  };
}

/**
 * 协议事件类型
 */
export type ProtocolEventType =
  | 'protocol-loaded'
  | 'protocol-updated'
  | 'serializer-registered'
  | 'compatibility-check'
  | 'performance-warning';

/**
 * 协议事件数据
 */
export interface ProtocolEventData {
  type: ProtocolEventType;
  timestamp: number;
  data: any;
}

/**
 * 协议事件处理器
 */
export type ProtocolEventHandler = (event: ProtocolEventData) => void;