/**
 * 消息验证器
 * 
 * 验证网络消息的格式、大小、内容等
 */

import { NetworkValue } from '@esengine/ecs-framework-network-shared';
import { TransportMessage } from '../core/Transport';

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误信息 */
  error?: string;
  /** 错误代码 */
  errorCode?: string;
  /** 详细信息 */
  details?: Record<string, any>;
}

/**
 * 验证配置
 */
export interface ValidationConfig {
  /** 最大消息大小(字节) */
  maxMessageSize?: number;
  /** 最大数组长度 */
  maxArrayLength?: number;
  /** 最大对象深度 */
  maxObjectDepth?: number;
  /** 最大字符串长度 */
  maxStringLength?: number;
  /** 允许的消息类型 */
  allowedMessageTypes?: string[];
  /** 是否允许null值 */
  allowNullValues?: boolean;
  /** 是否允许undefined值 */
  allowUndefinedValues?: boolean;
}

/**
 * 验证规则
 */
export interface ValidationRule {
  /** 规则名称 */
  name: string;
  /** 验证函数 */
  validate: (value: any, context: ValidationContext) => ValidationResult;
  /** 是否必需 */
  required?: boolean;
}

/**
 * 验证上下文
 */
export interface ValidationContext {
  /** 当前路径 */
  path: string[];
  /** 当前深度 */
  depth: number;
  /** 配置 */
  config: ValidationConfig;
  /** 消息类型 */
  messageType?: string;
}

/**
 * 消息验证器
 */
export class MessageValidator {
  private config: ValidationConfig;
  private customRules = new Map<string, ValidationRule>();

  constructor(config: ValidationConfig = {}) {
    this.config = {
      maxMessageSize: 1024 * 1024, // 1MB
      maxArrayLength: 1000,
      maxObjectDepth: 10,
      maxStringLength: 10000,
      allowedMessageTypes: ['rpc', 'syncvar', 'system', 'custom'],
      allowNullValues: true,
      allowUndefinedValues: false,
      ...config
    };
  }

  /**
   * 验证传输消息
   */
  validateMessage(message: TransportMessage): ValidationResult {
    try {
      // 基本结构验证
      const structureResult = this.validateMessageStructure(message);
      if (!structureResult.valid) {
        return structureResult;
      }

      // 消息大小验证
      const sizeResult = this.validateMessageSize(message);
      if (!sizeResult.valid) {
        return sizeResult;
      }

      // 消息类型验证
      const typeResult = this.validateMessageType(message);
      if (!typeResult.valid) {
        return typeResult;
      }

      // 数据内容验证
      const dataResult = this.validateMessageData(message);
      if (!dataResult.valid) {
        return dataResult;
      }

      // 自定义规则验证
      const customResult = this.validateCustomRules(message);
      if (!customResult.valid) {
        return customResult;
      }

      return { valid: true };

    } catch (error) {
      return {
        valid: false,
        error: (error as Error).message,
        errorCode: 'VALIDATION_ERROR'
      };
    }
  }

  /**
   * 验证网络值
   */
  validateNetworkValue(value: NetworkValue, context?: Partial<ValidationContext>): ValidationResult {
    const fullContext: ValidationContext = {
      path: [],
      depth: 0,
      config: this.config,
      ...context
    };

    return this.validateValue(value, fullContext);
  }

  /**
   * 添加自定义验证规则
   */
  addValidationRule(rule: ValidationRule): void {
    this.customRules.set(rule.name, rule);
  }

  /**
   * 移除自定义验证规则
   */
  removeValidationRule(ruleName: string): boolean {
    return this.customRules.delete(ruleName);
  }

  /**
   * 获取所有自定义规则
   */
  getCustomRules(): ValidationRule[] {
    return Array.from(this.customRules.values());
  }

  /**
   * 验证消息结构
   */
  private validateMessageStructure(message: TransportMessage): ValidationResult {
    // 检查必需字段
    if (!message.type) {
      return {
        valid: false,
        error: 'Message type is required',
        errorCode: 'MISSING_TYPE'
      };
    }

    if (message.data === undefined) {
      return {
        valid: false,
        error: 'Message data is required',
        errorCode: 'MISSING_DATA'
      };
    }

    // 检查字段类型
    if (typeof message.type !== 'string') {
      return {
        valid: false,
        error: 'Message type must be a string',
        errorCode: 'INVALID_TYPE_FORMAT'
      };
    }

    // 检查可选字段
    if (message.senderId && typeof message.senderId !== 'string') {
      return {
        valid: false,
        error: 'Sender ID must be a string',
        errorCode: 'INVALID_SENDER_ID'
      };
    }

    if (message.targetId && typeof message.targetId !== 'string') {
      return {
        valid: false,
        error: 'Target ID must be a string',
        errorCode: 'INVALID_TARGET_ID'
      };
    }

    if (message.reliable !== undefined && typeof message.reliable !== 'boolean') {
      return {
        valid: false,
        error: 'Reliable flag must be a boolean',
        errorCode: 'INVALID_RELIABLE_FLAG'
      };
    }

    return { valid: true };
  }

  /**
   * 验证消息大小
   */
  private validateMessageSize(message: TransportMessage): ValidationResult {
    try {
      const serialized = JSON.stringify(message);
      const size = new TextEncoder().encode(serialized).length;

      if (size > this.config.maxMessageSize!) {
        return {
          valid: false,
          error: `Message size (${size} bytes) exceeds maximum (${this.config.maxMessageSize} bytes)`,
          errorCode: 'MESSAGE_TOO_LARGE',
          details: { actualSize: size, maxSize: this.config.maxMessageSize }
        };
      }

      return { valid: true };

    } catch (error) {
      return {
        valid: false,
        error: 'Failed to serialize message for size validation',
        errorCode: 'SERIALIZATION_ERROR'
      };
    }
  }

  /**
   * 验证消息类型
   */
  private validateMessageType(message: TransportMessage): ValidationResult {
    if (!this.config.allowedMessageTypes!.includes(message.type)) {
      return {
        valid: false,
        error: `Message type '${message.type}' is not allowed`,
        errorCode: 'INVALID_MESSAGE_TYPE',
        details: { 
          messageType: message.type,
          allowedTypes: this.config.allowedMessageTypes
        }
      };
    }

    return { valid: true };
  }

  /**
   * 验证消息数据
   */
  private validateMessageData(message: TransportMessage): ValidationResult {
    const context: ValidationContext = {
      path: ['data'],
      depth: 0,
      config: this.config,
      messageType: message.type
    };

    return this.validateValue(message.data, context);
  }

  /**
   * 验证值
   */
  private validateValue(value: any, context: ValidationContext): ValidationResult {
    // 深度检查
    if (context.depth > this.config.maxObjectDepth!) {
      return {
        valid: false,
        error: `Object depth (${context.depth}) exceeds maximum (${this.config.maxObjectDepth})`,
        errorCode: 'OBJECT_TOO_DEEP',
        details: { path: context.path.join('.'), depth: context.depth }
      };
    }

    // null/undefined 检查
    if (value === null) {
      if (!this.config.allowNullValues) {
        return {
          valid: false,
          error: 'Null values are not allowed',
          errorCode: 'NULL_NOT_ALLOWED',
          details: { path: context.path.join('.') }
        };
      }
      return { valid: true };
    }

    if (value === undefined) {
      if (!this.config.allowUndefinedValues) {
        return {
          valid: false,
          error: 'Undefined values are not allowed',
          errorCode: 'UNDEFINED_NOT_ALLOWED',
          details: { path: context.path.join('.') }
        };
      }
      return { valid: true };
    }

    // 根据类型验证
    switch (typeof value) {
      case 'string':
        return this.validateString(value, context);
      
      case 'number':
        return this.validateNumber(value, context);
      
      case 'boolean':
        return { valid: true };
      
      case 'object':
        if (Array.isArray(value)) {
          return this.validateArray(value, context);
        } else {
          return this.validateObject(value, context);
        }
      
      default:
        return {
          valid: false,
          error: `Unsupported value type: ${typeof value}`,
          errorCode: 'UNSUPPORTED_TYPE',
          details: { path: context.path.join('.'), type: typeof value }
        };
    }
  }

  /**
   * 验证字符串
   */
  private validateString(value: string, context: ValidationContext): ValidationResult {
    if (value.length > this.config.maxStringLength!) {
      return {
        valid: false,
        error: `String length (${value.length}) exceeds maximum (${this.config.maxStringLength})`,
        errorCode: 'STRING_TOO_LONG',
        details: { 
          path: context.path.join('.'), 
          actualLength: value.length, 
          maxLength: this.config.maxStringLength 
        }
      };
    }

    return { valid: true };
  }

  /**
   * 验证数字
   */
  private validateNumber(value: number, context: ValidationContext): ValidationResult {
    // 检查是否为有效数字
    if (!Number.isFinite(value)) {
      return {
        valid: false,
        error: 'Number must be finite',
        errorCode: 'INVALID_NUMBER',
        details: { path: context.path.join('.'), value }
      };
    }

    return { valid: true };
  }

  /**
   * 验证数组
   */
  private validateArray(value: any[], context: ValidationContext): ValidationResult {
    // 长度检查
    if (value.length > this.config.maxArrayLength!) {
      return {
        valid: false,
        error: `Array length (${value.length}) exceeds maximum (${this.config.maxArrayLength})`,
        errorCode: 'ARRAY_TOO_LONG',
        details: { 
          path: context.path.join('.'), 
          actualLength: value.length, 
          maxLength: this.config.maxArrayLength 
        }
      };
    }

    // 验证每个元素
    for (let i = 0; i < value.length; i++) {
      const elementContext: ValidationContext = {
        ...context,
        path: [...context.path, `[${i}]`],
        depth: context.depth + 1
      };

      const result = this.validateValue(value[i], elementContext);
      if (!result.valid) {
        return result;
      }
    }

    return { valid: true };
  }

  /**
   * 验证对象
   */
  private validateObject(value: Record<string, any>, context: ValidationContext): ValidationResult {
    // 验证每个属性
    for (const [key, propertyValue] of Object.entries(value)) {
      const propertyContext: ValidationContext = {
        ...context,
        path: [...context.path, key],
        depth: context.depth + 1
      };

      const result = this.validateValue(propertyValue, propertyContext);
      if (!result.valid) {
        return result;
      }
    }

    return { valid: true };
  }

  /**
   * 验证自定义规则
   */
  private validateCustomRules(message: TransportMessage): ValidationResult {
    for (const rule of this.customRules.values()) {
      const context: ValidationContext = {
        path: [],
        depth: 0,
        config: this.config,
        messageType: message.type
      };

      const result = rule.validate(message, context);
      if (!result.valid) {
        return {
          ...result,
          details: {
            ...result.details,
            rule: rule.name
          }
        };
      }
    }

    return { valid: true };
  }
}

/**
 * 预定义验证规则
 */
export const DefaultValidationRules = {
  /**
   * RPC 消息验证规则
   */
  RpcMessage: {
    name: 'RpcMessage',
    validate: (message: TransportMessage, context: ValidationContext): ValidationResult => {
      if (message.type !== 'rpc') {
        return { valid: true }; // 不是 RPC 消息，跳过验证
      }

      const data = message.data as any;

      // 检查必需字段
      if (!data.networkId || typeof data.networkId !== 'number') {
        return {
          valid: false,
          error: 'RPC message must have a valid networkId',
          errorCode: 'RPC_INVALID_NETWORK_ID'
        };
      }

      if (!data.componentType || typeof data.componentType !== 'string') {
        return {
          valid: false,
          error: 'RPC message must have a valid componentType',
          errorCode: 'RPC_INVALID_COMPONENT_TYPE'
        };
      }

      if (!data.methodName || typeof data.methodName !== 'string') {
        return {
          valid: false,
          error: 'RPC message must have a valid methodName',
          errorCode: 'RPC_INVALID_METHOD_NAME'
        };
      }

      // 检查参数数组
      if (data.parameters && !Array.isArray(data.parameters)) {
        return {
          valid: false,
          error: 'RPC parameters must be an array',
          errorCode: 'RPC_INVALID_PARAMETERS'
        };
      }

      return { valid: true };
    }
  } as ValidationRule,

  /**
   * SyncVar 消息验证规则
   */
  SyncVarMessage: {
    name: 'SyncVarMessage',
    validate: (message: TransportMessage, context: ValidationContext): ValidationResult => {
      if (message.type !== 'syncvar') {
        return { valid: true }; // 不是 SyncVar 消息，跳过验证
      }

      const data = message.data as any;

      // 检查必需字段
      if (!data.networkId || typeof data.networkId !== 'number') {
        return {
          valid: false,
          error: 'SyncVar message must have a valid networkId',
          errorCode: 'SYNCVAR_INVALID_NETWORK_ID'
        };
      }

      if (!data.componentType || typeof data.componentType !== 'string') {
        return {
          valid: false,
          error: 'SyncVar message must have a valid componentType',
          errorCode: 'SYNCVAR_INVALID_COMPONENT_TYPE'
        };
      }

      if (!data.propertyName || typeof data.propertyName !== 'string') {
        return {
          valid: false,
          error: 'SyncVar message must have a valid propertyName',
          errorCode: 'SYNCVAR_INVALID_PROPERTY_NAME'
        };
      }

      return { valid: true };
    }
  } as ValidationRule
};