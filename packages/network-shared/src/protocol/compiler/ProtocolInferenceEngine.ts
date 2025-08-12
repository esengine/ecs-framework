/**
 * 协议推导引擎
 * 
 * 负责从分析结果推导出最优的序列化协议，
 * 包括类型优化、字段重排序、兼容性检查等
 */

import {
  ComponentProtocol,
  ProtocolField,
  ProtocolRpc,
  SerializeType,
  ProtocolSchema,
  ProtocolError,
  ProtocolWarning
} from '../types/ProtocolTypes';

/**
 * 优化选项
 */
export interface InferenceOptions {
  /** 是否启用字段重排序优化 */
  enableFieldReordering?: boolean;
  /** 是否启用类型提升优化 */
  enableTypePromotion?: boolean;
  /** 是否启用批量处理优化 */
  enableBatchOptimization?: boolean;
  /** 是否启用向后兼容检查 */
  enableCompatibilityCheck?: boolean;
  /** 最大字段数量限制 */
  maxFieldCount?: number;
  /** 最大 RPC 数量限制 */
  maxRpcCount?: number;
}

/**
 * 协议推导引擎
 */
export class ProtocolInferenceEngine {
  private options: Required<InferenceOptions>;
  private errors: ProtocolError[] = [];
  private warnings: ProtocolWarning[] = [];

  constructor(options: InferenceOptions = {}) {
    this.options = {
      enableFieldReordering: true,
      enableTypePromotion: true,
      enableBatchOptimization: true,
      enableCompatibilityCheck: true,
      maxFieldCount: 100,
      maxRpcCount: 50,
      ...options
    };
  }

  /**
   * 推导协议模式
   */
  public inferSchema(components: ComponentProtocol[], version: string = '1.0.0'): ProtocolSchema {
    this.errors = [];
    this.warnings = [];

    const optimizedComponents = new Map<string, ComponentProtocol>();
    const globalTypes = new Map<string, ProtocolField[]>();

    // 第一遍：基础优化和验证
    for (const component of components) {
      const optimized = this.optimizeComponent(component);
      if (optimized) {
        optimizedComponents.set(component.typeName, optimized);
      }
    }

    // 第二遍：跨组件优化
    this.performCrossComponentOptimizations(optimizedComponents);

    // 提取全局类型
    this.extractGlobalTypes(optimizedComponents, globalTypes);

    const schema: ProtocolSchema = {
      version,
      components: optimizedComponents,
      types: globalTypes,
      compatibility: {
        minVersion: version,
        maxVersion: version
      }
    };

    // 最终验证
    this.validateSchema(schema);

    return schema;
  }

  /**
   * 优化单个组件
   */
  private optimizeComponent(component: ComponentProtocol): ComponentProtocol | null {
    // 验证组件
    if (!this.validateComponent(component)) {
      return null;
    }

    const optimized: ComponentProtocol = {
      ...component,
      syncVars: [...component.syncVars],
      rpcs: [...component.rpcs]
    };

    // 优化 SyncVar 字段
    if (this.options.enableFieldReordering) {
      optimized.syncVars = this.optimizeFieldOrdering(optimized.syncVars);
    }

    if (this.options.enableTypePromotion) {
      optimized.syncVars = this.optimizeFieldTypes(optimized.syncVars);
    }

    // 优化 RPC 方法
    optimized.rpcs = this.optimizeRpcs(optimized.rpcs);

    // 启用批量处理优化
    if (this.options.enableBatchOptimization) {
      this.inferBatchOptimization(optimized);
    }

    return optimized;
  }

  /**
   * 验证组件
   */
  private validateComponent(component: ComponentProtocol): boolean {
    let isValid = true;

    // 检查字段数量限制
    if (component.syncVars.length > this.options.maxFieldCount) {
      this.addError('semantic', `Component ${component.typeName} has too many SyncVars (${component.syncVars.length}/${this.options.maxFieldCount})`);
      isValid = false;
    }

    // 检查 RPC 数量限制
    if (component.rpcs.length > this.options.maxRpcCount) {
      this.addError('semantic', `Component ${component.typeName} has too many RPCs (${component.rpcs.length}/${this.options.maxRpcCount})`);
      isValid = false;
    }

    // 检查字段名冲突
    const fieldNames = new Set<string>();
    for (const field of component.syncVars) {
      if (fieldNames.has(field.name)) {
        this.addError('semantic', `Duplicate SyncVar name: ${field.name} in ${component.typeName}`);
        isValid = false;
      }
      fieldNames.add(field.name);
    }

    // 检查 RPC 名冲突
    const rpcNames = new Set<string>();
    for (const rpc of component.rpcs) {
      if (rpcNames.has(rpc.name)) {
        this.addError('semantic', `Duplicate RPC name: ${rpc.name} in ${component.typeName}`);
        isValid = false;
      }
      rpcNames.add(rpc.name);
    }

    return isValid;
  }

  /**
   * 优化字段顺序
   * 将频繁变化的字段和固定大小的字段排在前面，以提高序列化效率
   */
  private optimizeFieldOrdering(fields: ProtocolField[]): ProtocolField[] {
    const optimized = [...fields];

    // 按照优化策略排序
    optimized.sort((a, b) => {
      // 优先级高的在前
      const priorityA = this.getFieldPriority(a);
      const priorityB = this.getFieldPriority(b);
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // 优先级高的在前
      }

      // 固定大小类型在前
      const fixedA = this.isFixedSizeType(a.type) ? 1 : 0;
      const fixedB = this.isFixedSizeType(b.type) ? 1 : 0;
      
      if (fixedA !== fixedB) {
        return fixedB - fixedA;
      }

      // 按类型大小排序，小的在前
      const sizeA = this.getTypeSize(a.type);
      const sizeB = this.getTypeSize(b.type);
      
      return sizeA - sizeB;
    });

    // 重新分配字段 ID（保持顺序）
    optimized.forEach((field, index) => {
      field.id = index + 1;
    });

    return optimized;
  }

  /**
   * 优化字段类型
   * 将通用类型提升为更高效的序列化类型
   */
  private optimizeFieldTypes(fields: ProtocolField[]): ProtocolField[] {
    return fields.map(field => {
      const optimized = { ...field };

      // 类型提升规则
      switch (field.type) {
        case SerializeType.FLOAT64:
          // 检查是否可以使用 float32
          if (this.canUseFloat32(field)) {
            optimized.type = SerializeType.FLOAT32;
            this.addWarning('performance', `Promoted field ${field.name} from float64 to float32`);
          }
          break;

        case SerializeType.INT64:
          // 检查是否可以使用 int32
          if (this.canUseInt32(field)) {
            optimized.type = SerializeType.INT32;
            this.addWarning('performance', `Promoted field ${field.name} from int64 to int32`);
          }
          break;

        case SerializeType.JSON:
          // 检查是否可以使用更高效的类型
          const betterType = this.inferBetterType(field);
          if (betterType && betterType !== SerializeType.JSON) {
            optimized.type = betterType;
            this.addWarning('performance', `Promoted field ${field.name} from JSON to ${betterType}`);
          }
          break;
      }

      return optimized;
    });
  }

  /**
   * 优化 RPC 方法
   */
  private optimizeRpcs(rpcs: ProtocolRpc[]): ProtocolRpc[] {
    return rpcs.map(rpc => {
      const optimized = { ...rpc };

      // 优化参数类型
      optimized.parameters = rpc.parameters.map(param => ({
        ...param,
        type: this.optimizeParameterType(param.type)
      }));

      // 设置默认选项
      if (optimized.reliable === undefined) {
        optimized.reliable = rpc.type === 'server-rpc'; // 服务端 RPC 默认可靠
      }

      return optimized;
    });
  }

  /**
   * 推导批量处理优化
   */
  private inferBatchOptimization(component: ComponentProtocol): void {
    // 检查是否适合批量处理
    const hasManyInstances = this.estimateInstanceCount(component) > 10;
    const hasSimpleTypes = component.syncVars.every(field => 
      this.isSimpleType(field.type) && !field.repeated
    );

    if (hasManyInstances && hasSimpleTypes) {
      component.batchEnabled = true;
      this.addWarning('performance', `Enabled batch optimization for ${component.typeName}`);
    }

    // 检查是否适合增量同步
    const hasLargeData = component.syncVars.some(field => 
      this.isLargeDataType(field.type) || field.repeated
    );
    
    if (hasLargeData) {
      component.deltaEnabled = true;
      this.addWarning('performance', `Enabled delta synchronization for ${component.typeName}`);
    }
  }

  /**
   * 跨组件优化
   */
  private performCrossComponentOptimizations(components: Map<string, ComponentProtocol>): void {
    // 检查重复字段模式，提取为全局类型
    const fieldPatterns = this.findCommonFieldPatterns(Array.from(components.values()));
    
    for (const [pattern, count] of fieldPatterns) {
      if (count >= 3) { // 如果有3个或更多组件使用相同模式
        this.addWarning('style', `Common field pattern found: ${pattern} (used ${count} times). Consider extracting to a shared type.`);
      }
    }

    // 检查 ID 冲突
    this.validateIdUniqueness(Array.from(components.values()));
  }

  /**
   * 提取全局类型
   */
  private extractGlobalTypes(
    components: Map<string, ComponentProtocol>, 
    globalTypes: Map<string, ProtocolField[]>
  ): void {
    // 预定义常用游戏类型
    globalTypes.set('Vector2', [
      { name: 'x', type: SerializeType.FLOAT32, id: 1 },
      { name: 'y', type: SerializeType.FLOAT32, id: 2 }
    ]);

    globalTypes.set('Vector3', [
      { name: 'x', type: SerializeType.FLOAT32, id: 1 },
      { name: 'y', type: SerializeType.FLOAT32, id: 2 },
      { name: 'z', type: SerializeType.FLOAT32, id: 3 }
    ]);

    globalTypes.set('Quaternion', [
      { name: 'x', type: SerializeType.FLOAT32, id: 1 },
      { name: 'y', type: SerializeType.FLOAT32, id: 2 },
      { name: 'z', type: SerializeType.FLOAT32, id: 3 },
      { name: 'w', type: SerializeType.FLOAT32, id: 4 }
    ]);

    globalTypes.set('Color', [
      { name: 'r', type: SerializeType.FLOAT32, id: 1 },
      { name: 'g', type: SerializeType.FLOAT32, id: 2 },
      { name: 'b', type: SerializeType.FLOAT32, id: 3 },
      { name: 'a', type: SerializeType.FLOAT32, id: 4, optional: true, defaultValue: 1.0 }
    ]);
  }

  /**
   * 验证协议模式
   */
  private validateSchema(schema: ProtocolSchema): void {
    // 检查版本兼容性
    if (this.options.enableCompatibilityCheck) {
      this.validateCompatibility(schema);
    }

    // 检查全局一致性
    this.validateGlobalConsistency(schema);
  }

  // 辅助方法

  private getFieldPriority(field: ProtocolField): number {
    // 根据字段名推断优先级
    const highPriorityNames = ['position', 'rotation', 'health', 'transform'];
    const mediumPriorityNames = ['velocity', 'speed', 'direction'];
    
    const fieldName = field.name.toLowerCase();
    
    if (highPriorityNames.some(name => fieldName.includes(name))) {
      return 10;
    }
    if (mediumPriorityNames.some(name => fieldName.includes(name))) {
      return 5;
    }
    return 1;
  }

  private isFixedSizeType(type: SerializeType): boolean {
    const fixedTypes = [
      SerializeType.BOOLEAN,
      SerializeType.INT8, SerializeType.UINT8,
      SerializeType.INT16, SerializeType.UINT16,
      SerializeType.INT32, SerializeType.UINT32,
      SerializeType.INT64, SerializeType.UINT64,
      SerializeType.FLOAT32, SerializeType.FLOAT64,
      SerializeType.VECTOR2, SerializeType.VECTOR3,
      SerializeType.QUATERNION, SerializeType.COLOR
    ];
    return fixedTypes.includes(type);
  }

  private getTypeSize(type: SerializeType): number {
    const sizes = {
      [SerializeType.BOOLEAN]: 1,
      [SerializeType.INT8]: 1,
      [SerializeType.UINT8]: 1,
      [SerializeType.INT16]: 2,
      [SerializeType.UINT16]: 2,
      [SerializeType.INT32]: 4,
      [SerializeType.UINT32]: 4,
      [SerializeType.INT64]: 8,
      [SerializeType.UINT64]: 8,
      [SerializeType.FLOAT32]: 4,
      [SerializeType.FLOAT64]: 8,
      [SerializeType.VECTOR2]: 8,
      [SerializeType.VECTOR3]: 12,
      [SerializeType.QUATERNION]: 16,
      [SerializeType.COLOR]: 16,
      [SerializeType.STRING]: 100, // 估算
      [SerializeType.BYTES]: 100,
      [SerializeType.ARRAY]: 200,
      [SerializeType.MAP]: 200,
      [SerializeType.OBJECT]: 500,
      [SerializeType.JSON]: 1000
    };
    return sizes[type] || 100;
  }

  private canUseFloat32(field: ProtocolField): boolean {
    // 简单启发式：位置、旋转等游戏相关字段通常可以使用 float32
    const float32FriendlyNames = ['position', 'rotation', 'scale', 'velocity', 'speed'];
    return float32FriendlyNames.some(name => field.name.toLowerCase().includes(name));
  }

  private canUseInt32(field: ProtocolField): boolean {
    // 大多数游戏中的整数值都可以用 int32 表示
    const int32FriendlyNames = ['id', 'count', 'level', 'score', 'health', 'mana'];
    return int32FriendlyNames.some(name => field.name.toLowerCase().includes(name));
  }

  private inferBetterType(field: ProtocolField): SerializeType | null {
    // 根据字段名推断更好的类型
    const fieldName = field.name.toLowerCase();
    
    if (fieldName.includes('position') || fieldName.includes('vector')) {
      return SerializeType.VECTOR3;
    }
    if (fieldName.includes('rotation') || fieldName.includes('quaternion')) {
      return SerializeType.QUATERNION;
    }
    if (fieldName.includes('color')) {
      return SerializeType.COLOR;
    }
    
    return null;
  }

  private optimizeParameterType(type: SerializeType): SerializeType {
    // RPC 参数类型优化
    if (type === SerializeType.FLOAT64) {
      return SerializeType.FLOAT32; // RPC 通常不需要高精度
    }
    if (type === SerializeType.INT64) {
      return SerializeType.INT32;
    }
    return type;
  }

  private estimateInstanceCount(component: ComponentProtocol): number {
    // 基于组件名称估算实例数量
    const highVolumeNames = ['transform', 'position', 'movement', 'particle'];
    const mediumVolumeNames = ['player', 'enemy', 'bullet', 'item'];
    
    const typeName = component.typeName.toLowerCase();
    
    if (highVolumeNames.some(name => typeName.includes(name))) {
      return 100;
    }
    if (mediumVolumeNames.some(name => typeName.includes(name))) {
      return 20;
    }
    return 5;
  }

  private isSimpleType(type: SerializeType): boolean {
    const simpleTypes = [
      SerializeType.BOOLEAN,
      SerializeType.INT32, SerializeType.UINT32,
      SerializeType.FLOAT32,
      SerializeType.VECTOR2, SerializeType.VECTOR3,
      SerializeType.QUATERNION
    ];
    return simpleTypes.includes(type);
  }

  private isLargeDataType(type: SerializeType): boolean {
    const largeTypes = [
      SerializeType.STRING,
      SerializeType.BYTES,
      SerializeType.ARRAY,
      SerializeType.MAP,
      SerializeType.OBJECT,
      SerializeType.JSON
    ];
    return largeTypes.includes(type);
  }

  private findCommonFieldPatterns(components: ComponentProtocol[]): Map<string, number> {
    const patterns = new Map<string, number>();
    
    for (const component of components) {
      const pattern = component.syncVars
        .map(field => `${field.name}:${field.type}`)
        .sort()
        .join(',');
      
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    }
    
    return patterns;
  }

  private validateIdUniqueness(components: ComponentProtocol[]): void {
    const fieldIds = new Map<number, string>();
    const rpcIds = new Map<number, string>();
    
    for (const component of components) {
      // 检查字段 ID 冲突
      for (const field of component.syncVars) {
        const existing = fieldIds.get(field.id);
        if (existing && existing !== `${component.typeName}.${field.name}`) {
          this.addError('semantic', `Field ID conflict: ${field.id} used by both ${existing} and ${component.typeName}.${field.name}`);
        }
        fieldIds.set(field.id, `${component.typeName}.${field.name}`);
      }
      
      // 检查 RPC ID 冲突
      for (const rpc of component.rpcs) {
        const existing = rpcIds.get(rpc.id);
        if (existing && existing !== `${component.typeName}.${rpc.name}`) {
          this.addError('semantic', `RPC ID conflict: ${rpc.id} used by both ${existing} and ${component.typeName}.${rpc.name}`);
        }
        rpcIds.set(rpc.id, `${component.typeName}.${rpc.name}`);
      }
    }
  }

  private validateCompatibility(schema: ProtocolSchema): void {
    // 这里可以添加向后兼容性检查逻辑
    // 比如检查字段删除、类型变更等
  }

  private validateGlobalConsistency(schema: ProtocolSchema): void {
    // 检查全局类型的一致性使用
    for (const [typeName, fields] of schema.types) {
      const usageCount = Array.from(schema.components.values())
        .flatMap(comp => comp.syncVars)
        .filter(field => field.type === typeName as SerializeType)
        .length;
      
      if (usageCount === 0) {
        this.addWarning('style', `Global type ${typeName} is defined but not used`);
      }
    }
  }

  private addError(type: ProtocolError['type'], message: string): void {
    this.errors.push({ type, message });
  }

  private addWarning(type: ProtocolWarning['type'], message: string): void {
    this.warnings.push({ type, message });
  }

  public getErrors(): ProtocolError[] {
    return [...this.errors];
  }

  public getWarnings(): ProtocolWarning[] {
    return [...this.warnings];
  }
}