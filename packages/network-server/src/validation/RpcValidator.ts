/**
 * RPC 验证器
 * 
 * 专门用于验证 RPC 调用的参数、权限、频率等
 */

import { NetworkValue, RpcMetadata } from '@esengine/ecs-framework-network-shared';
import { ClientConnection } from '../core/ClientConnection';
import { ValidationResult } from './MessageValidator';

/**
 * RPC 验证配置
 */
export interface RpcValidationConfig {
  /** 最大参数数量 */
  maxParameterCount?: number;
  /** 单个参数最大大小(字节) */
  maxParameterSize?: number;
  /** 允许的参数类型 */
  allowedParameterTypes?: string[];
  /** 方法名黑名单 */
  blacklistedMethods?: string[];
  /** 方法名白名单 */
  whitelistedMethods?: string[];
  /** 是否启用参数类型检查 */
  enableTypeCheck?: boolean;
  /** 是否启用参数内容过滤 */
  enableContentFilter?: boolean;
}

/**
 * RPC 调用上下文
 */
export interface RpcCallContext {
  /** 客户端连接 */
  client: ClientConnection;
  /** 网络对象ID */
  networkId: number;
  /** 组件类型 */
  componentType: string;
  /** 方法名 */
  methodName: string;
  /** 参数列表 */
  parameters: NetworkValue[];
  /** RPC 元数据 */
  metadata: RpcMetadata;
  /** RPC 类型 */
  rpcType: 'client-rpc' | 'server-rpc';
}

/**
 * 参数类型定义
 */
export interface ParameterTypeDefinition {
  /** 参数名 */
  name: string;
  /** 参数类型 */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';
  /** 是否必需 */
  required?: boolean;
  /** 最小值/长度 */
  min?: number;
  /** 最大值/长度 */
  max?: number;
  /** 允许的值列表 */
  allowedValues?: NetworkValue[];
  /** 正则表达式（仅用于字符串） */
  pattern?: RegExp;
  /** 自定义验证函数 */
  customValidator?: (value: NetworkValue) => ValidationResult;
}

/**
 * 方法签名定义
 */
export interface MethodSignature {
  /** 方法名 */
  methodName: string;
  /** 组件类型 */
  componentType: string;
  /** 参数定义 */
  parameters: ParameterTypeDefinition[];
  /** 返回值类型 */
  returnType?: string;
  /** 是否需要权限验证 */
  requiresAuth?: boolean;
  /** 所需权限 */
  requiredPermissions?: string[];
  /** 频率限制（调用/分钟） */
  rateLimit?: number;
  /** 自定义验证函数 */
  customValidator?: (context: RpcCallContext) => ValidationResult;
}

/**
 * RPC 频率跟踪
 */
interface RpcRateTracker {
  /** 客户端ID */
  clientId: string;
  /** 方法调用计数 */
  methodCalls: Map<string, { count: number; resetTime: Date }>;
  /** 最后更新时间 */
  lastUpdate: Date;
}

/**
 * RPC 验证器
 */
export class RpcValidator {
  private config: RpcValidationConfig;
  private methodSignatures = new Map<string, MethodSignature>();
  private rateTrackers = new Map<string, RpcRateTracker>();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: RpcValidationConfig = {}) {
    this.config = {
      maxParameterCount: 10,
      maxParameterSize: 65536, // 64KB
      allowedParameterTypes: ['string', 'number', 'boolean', 'object', 'array'],
      blacklistedMethods: [],
      whitelistedMethods: [],
      enableTypeCheck: true,
      enableContentFilter: true,
      ...config
    };

    this.initialize();
  }

  /**
   * 验证 RPC 调用
   */
  validateRpcCall(context: RpcCallContext): ValidationResult {
    try {
      // 基本验证
      const basicResult = this.validateBasicRpcCall(context);
      if (!basicResult.valid) {
        return basicResult;
      }

      // 方法名验证
      const methodResult = this.validateMethodName(context);
      if (!methodResult.valid) {
        return methodResult;
      }

      // 权限验证
      const permissionResult = this.validateRpcPermissions(context);
      if (!permissionResult.valid) {
        return permissionResult;
      }

      // 参数验证
      const parameterResult = this.validateParameters(context);
      if (!parameterResult.valid) {
        return parameterResult;
      }

      // 频率限制验证
      const rateResult = this.validateRateLimit(context);
      if (!rateResult.valid) {
        return rateResult;
      }

      // 签名验证（如果有定义）
      const signatureResult = this.validateMethodSignature(context);
      if (!signatureResult.valid) {
        return signatureResult;
      }

      return { valid: true };

    } catch (error) {
      return {
        valid: false,
        error: (error as Error).message,
        errorCode: 'RPC_VALIDATION_ERROR'
      };
    }
  }

  /**
   * 注册方法签名
   */
  registerMethodSignature(signature: MethodSignature): void {
    const key = `${signature.componentType}.${signature.methodName}`;
    this.methodSignatures.set(key, signature);
  }

  /**
   * 移除方法签名
   */
  removeMethodSignature(componentType: string, methodName: string): boolean {
    const key = `${componentType}.${methodName}`;
    return this.methodSignatures.delete(key);
  }

  /**
   * 获取方法签名
   */
  getMethodSignature(componentType: string, methodName: string): MethodSignature | undefined {
    const key = `${componentType}.${methodName}`;
    return this.methodSignatures.get(key);
  }

  /**
   * 添加方法到黑名单
   */
  addToBlacklist(methodName: string): void {
    if (!this.config.blacklistedMethods!.includes(methodName)) {
      this.config.blacklistedMethods!.push(methodName);
    }
  }

  /**
   * 从黑名单移除方法
   */
  removeFromBlacklist(methodName: string): boolean {
    const index = this.config.blacklistedMethods!.indexOf(methodName);
    if (index !== -1) {
      this.config.blacklistedMethods!.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 添加方法到白名单
   */
  addToWhitelist(methodName: string): void {
    if (!this.config.whitelistedMethods!.includes(methodName)) {
      this.config.whitelistedMethods!.push(methodName);
    }
  }

  /**
   * 获取客户端的 RPC 统计
   */
  getClientRpcStats(clientId: string): {
    totalCalls: number;
    methodStats: Record<string, number>;
  } {
    const tracker = this.rateTrackers.get(clientId);
    if (!tracker) {
      return { totalCalls: 0, methodStats: {} };
    }

    let totalCalls = 0;
    const methodStats: Record<string, number> = {};

    for (const [method, data] of tracker.methodCalls) {
      totalCalls += data.count;
      methodStats[method] = data.count;
    }

    return { totalCalls, methodStats };
  }

  /**
   * 重置客户端的频率限制
   */
  resetClientRateLimit(clientId: string): boolean {
    const tracker = this.rateTrackers.get(clientId);
    if (!tracker) {
      return false;
    }

    tracker.methodCalls.clear();
    tracker.lastUpdate = new Date();
    return true;
  }

  /**
   * 销毁验证器
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.methodSignatures.clear();
    this.rateTrackers.clear();
  }

  /**
   * 初始化验证器
   */
  private initialize(): void {
    // 启动清理定时器（每5分钟清理一次）
    this.cleanupTimer = setInterval(() => {
      this.cleanupRateTrackers();
    }, 5 * 60 * 1000);
  }

  /**
   * 基本 RPC 调用验证
   */
  private validateBasicRpcCall(context: RpcCallContext): ValidationResult {
    // 网络对象ID验证
    if (!Number.isInteger(context.networkId) || context.networkId <= 0) {
      return {
        valid: false,
        error: 'Invalid network object ID',
        errorCode: 'INVALID_NETWORK_ID'
      };
    }

    // 组件类型验证
    if (!context.componentType || typeof context.componentType !== 'string') {
      return {
        valid: false,
        error: 'Invalid component type',
        errorCode: 'INVALID_COMPONENT_TYPE'
      };
    }

    // 方法名验证
    if (!context.methodName || typeof context.methodName !== 'string') {
      return {
        valid: false,
        error: 'Invalid method name',
        errorCode: 'INVALID_METHOD_NAME'
      };
    }

    // 参数数组验证
    if (!Array.isArray(context.parameters)) {
      return {
        valid: false,
        error: 'Parameters must be an array',
        errorCode: 'INVALID_PARAMETERS_FORMAT'
      };
    }

    // 参数数量检查
    if (context.parameters.length > this.config.maxParameterCount!) {
      return {
        valid: false,
        error: `Too many parameters: ${context.parameters.length} (max: ${this.config.maxParameterCount})`,
        errorCode: 'TOO_MANY_PARAMETERS'
      };
    }

    return { valid: true };
  }

  /**
   * 方法名验证
   */
  private validateMethodName(context: RpcCallContext): ValidationResult {
    const methodName = context.methodName;

    // 黑名单检查
    if (this.config.blacklistedMethods!.length > 0) {
      if (this.config.blacklistedMethods!.includes(methodName)) {
        return {
          valid: false,
          error: `Method '${methodName}' is blacklisted`,
          errorCode: 'METHOD_BLACKLISTED'
        };
      }
    }

    // 白名单检查
    if (this.config.whitelistedMethods!.length > 0) {
      if (!this.config.whitelistedMethods!.includes(methodName)) {
        return {
          valid: false,
          error: `Method '${methodName}' is not whitelisted`,
          errorCode: 'METHOD_NOT_WHITELISTED'
        };
      }
    }

    // 危险方法名检查
    const dangerousPatterns = [
      /^__/, // 私有方法
      /constructor/i,
      /prototype/i,
      /eval/i,
      /function/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(methodName)) {
        return {
          valid: false,
          error: `Potentially dangerous method name: '${methodName}'`,
          errorCode: 'DANGEROUS_METHOD_NAME'
        };
      }
    }

    return { valid: true };
  }

  /**
   * RPC 权限验证
   */
  private validateRpcPermissions(context: RpcCallContext): ValidationResult {
    // 基本 RPC 权限检查
    if (!context.client.hasPermission('canSendRpc')) {
      return {
        valid: false,
        error: 'Client does not have RPC permission',
        errorCode: 'RPC_PERMISSION_DENIED'
      };
    }

    // ServerRpc 特殊权限检查
    if (context.rpcType === 'server-rpc') {
      if (context.metadata.requiresAuth && !context.client.isAuthenticated) {
        return {
          valid: false,
          error: 'Authentication required for this RPC',
          errorCode: 'AUTHENTICATION_REQUIRED'
        };
      }
    }

    // 检查方法签名中的权限要求
    const signature = this.getMethodSignature(context.componentType, context.methodName);
    if (signature && signature.requiredPermissions) {
      for (const permission of signature.requiredPermissions) {
        if (!context.client.hasCustomPermission(permission)) {
          return {
            valid: false,
            error: `Required permission '${permission}' not found`,
            errorCode: 'INSUFFICIENT_PERMISSIONS'
          };
        }
      }
    }

    return { valid: true };
  }

  /**
   * 参数验证
   */
  private validateParameters(context: RpcCallContext): ValidationResult {
    // 参数大小检查
    for (let i = 0; i < context.parameters.length; i++) {
      const param = context.parameters[i];
      
      try {
        const serialized = JSON.stringify(param);
        const size = new TextEncoder().encode(serialized).length;
        
        if (size > this.config.maxParameterSize!) {
          return {
            valid: false,
            error: `Parameter ${i} is too large: ${size} bytes (max: ${this.config.maxParameterSize})`,
            errorCode: 'PARAMETER_TOO_LARGE'
          };
        }
      } catch (error) {
        return {
          valid: false,
          error: `Parameter ${i} is not serializable`,
          errorCode: 'PARAMETER_NOT_SERIALIZABLE'
        };
      }
    }

    // 参数类型检查
    if (this.config.enableTypeCheck) {
      const typeResult = this.validateParameterTypes(context);
      if (!typeResult.valid) {
        return typeResult;
      }
    }

    // 参数内容过滤
    if (this.config.enableContentFilter) {
      const contentResult = this.validateParameterContent(context);
      if (!contentResult.valid) {
        return contentResult;
      }
    }

    return { valid: true };
  }

  /**
   * 参数类型验证
   */
  private validateParameterTypes(context: RpcCallContext): ValidationResult {
    for (let i = 0; i < context.parameters.length; i++) {
      const param = context.parameters[i];
      const paramType = this.getParameterType(param);

      if (!this.config.allowedParameterTypes!.includes(paramType)) {
        return {
          valid: false,
          error: `Parameter ${i} type '${paramType}' is not allowed`,
          errorCode: 'INVALID_PARAMETER_TYPE'
        };
      }
    }

    return { valid: true };
  }

  /**
   * 参数内容验证
   */
  private validateParameterContent(context: RpcCallContext): ValidationResult {
    for (let i = 0; i < context.parameters.length; i++) {
      const param = context.parameters[i];

      // 检查危险内容
      if (typeof param === 'string') {
        const dangerousPatterns = [
          /<script/i,
          /javascript:/i,
          /eval\(/i,
          /function\(/i,
          /__proto__/i
        ];

        for (const pattern of dangerousPatterns) {
          if (pattern.test(param)) {
            return {
              valid: false,
              error: `Parameter ${i} contains potentially dangerous content`,
              errorCode: 'DANGEROUS_PARAMETER_CONTENT'
            };
          }
        }
      }
    }

    return { valid: true };
  }

  /**
   * 频率限制验证
   */
  private validateRateLimit(context: RpcCallContext): ValidationResult {
    const signature = this.getMethodSignature(context.componentType, context.methodName);
    if (!signature || !signature.rateLimit) {
      return { valid: true }; // 没有频率限制
    }

    const clientId = context.client.id;
    const methodKey = `${context.componentType}.${context.methodName}`;
    
    let tracker = this.rateTrackers.get(clientId);
    if (!tracker) {
      tracker = {
        clientId,
        methodCalls: new Map(),
        lastUpdate: new Date()
      };
      this.rateTrackers.set(clientId, tracker);
    }

    const now = new Date();
    let methodData = tracker.methodCalls.get(methodKey);

    if (!methodData) {
      methodData = {
        count: 1,
        resetTime: new Date(now.getTime() + 60000) // 1分钟后重置
      };
      tracker.methodCalls.set(methodKey, methodData);
      return { valid: true };
    }

    // 检查是否需要重置
    if (now >= methodData.resetTime) {
      methodData.count = 1;
      methodData.resetTime = new Date(now.getTime() + 60000);
      return { valid: true };
    }

    // 检查频率限制
    if (methodData.count >= signature.rateLimit) {
      return {
        valid: false,
        error: `Rate limit exceeded for method '${methodKey}': ${methodData.count}/${signature.rateLimit} per minute`,
        errorCode: 'RATE_LIMIT_EXCEEDED'
      };
    }

    methodData.count++;
    tracker.lastUpdate = now;
    return { valid: true };
  }

  /**
   * 方法签名验证
   */
  private validateMethodSignature(context: RpcCallContext): ValidationResult {
    const signature = this.getMethodSignature(context.componentType, context.methodName);
    if (!signature) {
      return { valid: true }; // 没有定义签名，跳过验证
    }

    // 参数数量检查
    const requiredParams = signature.parameters.filter(p => p.required !== false);
    if (context.parameters.length < requiredParams.length) {
      return {
        valid: false,
        error: `Not enough parameters: expected at least ${requiredParams.length}, got ${context.parameters.length}`,
        errorCode: 'INSUFFICIENT_PARAMETERS'
      };
    }

    if (context.parameters.length > signature.parameters.length) {
      return {
        valid: false,
        error: `Too many parameters: expected at most ${signature.parameters.length}, got ${context.parameters.length}`,
        errorCode: 'EXCESS_PARAMETERS'
      };
    }

    // 参数类型和值验证
    for (let i = 0; i < Math.min(context.parameters.length, signature.parameters.length); i++) {
      const param = context.parameters[i];
      const paramDef = signature.parameters[i];
      
      const paramResult = this.validateParameterDefinition(param, paramDef, i);
      if (!paramResult.valid) {
        return paramResult;
      }
    }

    // 自定义验证
    if (signature.customValidator) {
      const customResult = signature.customValidator(context);
      if (!customResult.valid) {
        return customResult;
      }
    }

    return { valid: true };
  }

  /**
   * 验证参数定义
   */
  private validateParameterDefinition(
    value: NetworkValue, 
    definition: ParameterTypeDefinition, 
    index: number
  ): ValidationResult {
    // 类型检查
    const actualType = this.getParameterType(value);
    if (definition.type !== 'any' && actualType !== definition.type) {
      return {
        valid: false,
        error: `Parameter ${index} type mismatch: expected '${definition.type}', got '${actualType}'`,
        errorCode: 'PARAMETER_TYPE_MISMATCH'
      };
    }

    // 值范围检查
    if (typeof value === 'number' && (definition.min !== undefined || definition.max !== undefined)) {
      if (definition.min !== undefined && value < definition.min) {
        return {
          valid: false,
          error: `Parameter ${index} value ${value} is less than minimum ${definition.min}`,
          errorCode: 'PARAMETER_BELOW_MINIMUM'
        };
      }
      
      if (definition.max !== undefined && value > definition.max) {
        return {
          valid: false,
          error: `Parameter ${index} value ${value} is greater than maximum ${definition.max}`,
          errorCode: 'PARAMETER_ABOVE_MAXIMUM'
        };
      }
    }

    // 字符串长度检查
    if (typeof value === 'string' && (definition.min !== undefined || definition.max !== undefined)) {
      if (definition.min !== undefined && value.length < definition.min) {
        return {
          valid: false,
          error: `Parameter ${index} string length ${value.length} is less than minimum ${definition.min}`,
          errorCode: 'STRING_TOO_SHORT'
        };
      }
      
      if (definition.max !== undefined && value.length > definition.max) {
        return {
          valid: false,
          error: `Parameter ${index} string length ${value.length} is greater than maximum ${definition.max}`,
          errorCode: 'STRING_TOO_LONG'
        };
      }
    }

    // 允许值检查
    if (definition.allowedValues && definition.allowedValues.length > 0) {
      if (!definition.allowedValues.includes(value)) {
        return {
          valid: false,
          error: `Parameter ${index} value '${value}' is not in allowed values: ${definition.allowedValues.join(', ')}`,
          errorCode: 'VALUE_NOT_ALLOWED'
        };
      }
    }

    // 正则表达式检查（字符串）
    if (typeof value === 'string' && definition.pattern) {
      if (!definition.pattern.test(value)) {
        return {
          valid: false,
          error: `Parameter ${index} string '${value}' does not match required pattern`,
          errorCode: 'PATTERN_MISMATCH'
        };
      }
    }

    // 自定义验证
    if (definition.customValidator) {
      const customResult = definition.customValidator(value);
      if (!customResult.valid) {
        return {
          ...customResult,
          error: `Parameter ${index} validation failed: ${customResult.error}`
        };
      }
    }

    return { valid: true };
  }

  /**
   * 获取参数类型
   */
  private getParameterType(value: any): string {
    if (value === null || value === undefined) {
      return 'null';
    }
    
    if (Array.isArray(value)) {
      return 'array';
    }
    
    return typeof value;
  }

  /**
   * 清理过期的频率跟踪器
   */
  private cleanupRateTrackers(): void {
    const now = new Date();
    const expireTime = 10 * 60 * 1000; // 10分钟
    let cleanedCount = 0;

    for (const [clientId, tracker] of this.rateTrackers.entries()) {
      if (now.getTime() - tracker.lastUpdate.getTime() > expireTime) {
        this.rateTrackers.delete(clientId);
        cleanedCount++;
      } else {
        // 清理过期的方法调用记录
        for (const [methodKey, methodData] of tracker.methodCalls.entries()) {
          if (now >= methodData.resetTime) {
            tracker.methodCalls.delete(methodKey);
          }
        }
      }
    }

    if (cleanedCount > 0) {
      console.log(`RPC validator cleanup: ${cleanedCount} rate trackers removed`);
    }
  }
}