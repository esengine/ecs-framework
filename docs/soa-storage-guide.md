# SoA存储优化指南

SoA (Structure of Arrays) 存储模式是ECS框架中的高级性能优化特性，适用于大规模实体系统和批量操作场景。

## 目录

1. [什么是SoA存储](#什么是soa存储)
2. [适用场景](#适用场景)
3. [不适用场景](#不适用场景)
4. [装饰器使用指南](#装饰器使用指南)
5. [性能对比](#性能对比)
6. [最佳实践](#最佳实践)
7. [故障排除](#故障排除)

## 什么是SoA存储

### AoS vs SoA 对比

**传统AoS (Array of Structures):**
```typescript
// 数据在内存中的布局
[{x:1, y:2, z:3}, {x:4, y:5, z:6}, {x:7, y:8, z:9}]
// 内存布局: x1,y1,z1,x2,y2,z2,x3,y3,z3
```

**SoA (Structure of Arrays):**
```typescript
// 数据在内存中的布局
{
  x: [1, 4, 7],  // Float32Array
  y: [2, 5, 8],  // Float32Array  
  z: [3, 6, 9]   // Float32Array
}
// 内存布局: x1,x2,x3,y1,y2,y3,z1,z2,z3
```

### SoA的优势

- **缓存友好**: 相同类型数据连续存储，提高缓存命中率
- **向量化优化**: 支持SIMD指令并行处理
- **内存局部性**: 批量操作时减少缓存miss
- **类型优化**: 针对不同数据类型使用最优存储格式

## 适用场景

### 推荐使用SoA的场景

1. **大规模实体系统**
   ```typescript
   // 大量相似实体的物理系统
   @EnableSoA
   class PhysicsComponent extends Component {
       @Float64 public x: number = 0;
       @Float64 public y: number = 0;
       @Float32 public velocityX: number = 0;
       @Float32 public velocityY: number = 0;
   }
   ```

2. **频繁批量更新操作**
   ```typescript
   // 每帧更新大量实体位置
   system.performVectorizedOperation((fields, indices) => {
       const x = fields.get('x') as Float32Array;
       const y = fields.get('y') as Float32Array;
       const vx = fields.get('velocityX') as Float32Array;
       const vy = fields.get('velocityY') as Float32Array;
       
       // 向量化更新所有实体
       for (let i = 0; i < indices.length; i++) {
           const idx = indices[i];
           x[idx] += vx[idx] * deltaTime;
           y[idx] += vy[idx] * deltaTime;
       }
   });
   ```

3. **数值密集计算**
   ```typescript
   @EnableSoA
   class AIBrainComponent extends Component {
       @Float32 public neuron1: number = 0;
       @Float32 public neuron2: number = 0;
       @Float32 public output: number = 0;
   }
   ```

## 不适用场景

### ❌ 不推荐使用SoA的场景

1. **小规模系统**
   - SoA的开销大于收益
   - 原始存储更简单高效

2. **随机访问为主**
   ```typescript
   // 经常需要随机获取单个组件
   const component = entityManager.getComponent(randomId, SomeComponent);
   ```

3. **复杂对象为主的组件**
   ```typescript
   // 大量复杂对象，序列化开销大
   class UIComponent extends Component {
       public domElement: HTMLElement;
       public eventHandlers: Map<string, Function>;
       public children: UIComponent[];
   }
   ```

4. **频繁增删实体**
   - SoA在频繁增删时性能不如AoS
   - 适合稳定的实体集合

## 装饰器使用指南

### 基础装饰器

```typescript
import { Component, EnableSoA, HighPrecision, Float64, Int32, SerializeMap, SerializeSet, SerializeArray, DeepCopy } from '@esengine/ecs-framework';

@EnableSoA  // 启用SoA优化
class GameComponent extends Component {
    // 数值类型装饰器
    @HighPrecision  // 高精度数值，保持完整精度
    public entityId: number = 0;
    
    @Float64        // 64位浮点数 (8字节，高精度)
    public precisePosition: number = 0;
    
    @Int32          // 32位整数 (4字节，整数优化)
    public health: number = 100;
    
    // 普通数值 (默认Float32Array，4字节)
    public x: number = 0;
    public y: number = 0;
    
    // 集合类型装饰器
    @SerializeMap
    public playerStats: Map<string, number> = new Map();
    
    @SerializeSet
    public achievements: Set<string> = new Set();
    
    @SerializeArray
    public inventory: any[] = [];
    
    @DeepCopy
    public config: any = { settings: {} };
    
    // 未装饰的字段自动选择最优存储
    public name: string = '';      // string[] 数组
    public active: boolean = true; // Float32Array (0/1)
    public metadata: any = null;   // 复杂对象存储
}
```

### 装饰器选择指南

| 装饰器 | 用途 | 存储方式 | 开销 | 适用场景 |
|--------|------|----------|------|----------|
| `@HighPrecision` | 高精度数值 | 复杂对象 | 高 | ID、时间戳、大整数 |
| `@Float64` | 双精度浮点 | Float64Array | 中 | 精密计算 |
| `@Int32` | 32位整数 | Int32Array | 低 | 整数计数、枚举值 |
| `@SerializeMap` | Map序列化 | JSON字符串 | 高 | 配置映射、属性集合 |
| `@SerializeSet` | Set序列化 | JSON字符串 | 高 | 标签集合、ID集合 |
| `@SerializeArray` | Array序列化 | JSON字符串 | 中 | 列表数据、队列 |
| `@DeepCopy` | 深拷贝对象 | 复杂对象副本 | 高 | 嵌套配置、独立状态 |

## 性能对比

### 基准测试结果

```
测试场景: 2000个实体，包含位置、速度、生命值组件

创建性能:
- 原始存储: 12.45ms
- SoA存储: 15.72ms (慢26%)

随机访问性能:
- 原始存储: 8.33ms  
- SoA存储: 14.20ms (慢70%)

批量更新性能:
- 原始存储: 25.67ms
- SoA存储: 8.91ms (快188%)

内存使用:
- 原始存储: ~45KB (对象开销)
- SoA存储: ~28KB (TypedArray优化)
```

### 性能权衡总结

- **SoA优势**: 批量操作、内存效率、向量化计算
- **SoA劣势**: 随机访问、创建开销、复杂度增加
- **建议**: 大规模批量操作场景使用，小规模随机访问避免使用

## 最佳实践

### 1. 合理的组件设计

```typescript
// 好的设计：纯数值组件
@EnableSoA
class TransformComponent extends Component {
    @Float64 public x: number = 0;
    @Float64 public y: number = 0;
    @Float32 public rotation: number = 0;
    @Float32 public scaleX: number = 1;
    @Float32 public scaleY: number = 1;
}

// ❌ 不好的设计：混合复杂对象
@EnableSoA
class MixedComponent extends Component {
    public x: number = 0;
    public domElement: HTMLElement = null;  // 复杂对象开销大
    public callback: Function = null;       // 无法序列化
}
```

### 2. 批量操作优化

```typescript
// 使用向量化操作
const storage = entityManager.getStorage(TransformComponent) as SoAStorage<TransformComponent>;
storage.performVectorizedOperation((fields, indices) => {
    const x = fields.get('x') as Float64Array;
    const y = fields.get('y') as Float64Array;
    
    // 批量处理，利用缓存局部性
    for (let i = 0; i < indices.length; i++) {
        const idx = indices[i];
        x[idx] += deltaX;
        y[idx] += deltaY;
    }
});

// ❌ 避免逐个访问
for (const entity of entities) {
    const transform = entity.getComponent(TransformComponent);
    transform.x += deltaX;
    transform.y += deltaY;
}
```

### 3. 组件分离策略

```typescript
// 将频繁批量操作的数据分离
@EnableSoA
class PositionComponent extends Component {
    @Float32 public x: number = 0;
    @Float32 public y: number = 0;
}

// 复杂数据使用普通组件
class MetadataComponent extends Component {
    public name: string = '';
    public config: any = {};
    public references: any[] = [];
}
```

### 4. 性能监控

```typescript
// 监控SoA存储使用情况
const storage = entityManager.getStorage(MyComponent) as SoAStorage<MyComponent>;
const stats = storage.getStats();

console.log('SoA存储统计:', {
    size: stats.size,
    capacity: stats.capacity,
    memoryUsage: stats.memoryUsage,
    fragmentation: stats.fragmentation,
    fieldStats: stats.fieldStats
});
```

## 故障排除

### 常见问题

1. **精度丢失**
   ```typescript
   // 问题：大整数精度丢失
   public bigId: number = Number.MAX_SAFE_INTEGER;
   
   // 解决：使用高精度装饰器
   @HighPrecision
   public bigId: number = Number.MAX_SAFE_INTEGER;
   ```

2. **序列化失败**
   ```typescript
   // 问题：循环引用导致序列化失败
   @SerializeMap
   public cyclicMap: Map<string, any> = new Map();
   
   // 解决：避免循环引用或使用DeepCopy
   @DeepCopy
   public cyclicData: any = {};
   ```

3. **性能反向优化**
   ```typescript
   // 问题：小规模数据使用SoA
   @EnableSoA  // 只有10个实体，不需要SoA
   class SmallComponent extends Component {}
   
   // 解决：移除@EnableSoA装饰器
   class SmallComponent extends Component {}
   ```

### 调试技巧

```typescript
// 检查存储类型
const storage = entityManager.getStorage(MyComponent);
console.log('存储类型:', storage.constructor.name);
// 输出: 'SoAStorage' 或 'ComponentStorage'

// 检查字段存储方式
if (storage instanceof SoAStorage) {
    const fieldArray = storage.getFieldArray('myField');
    console.log('字段类型:', fieldArray?.constructor.name);
    // 输出: 'Float32Array', 'Float64Array', 'Int32Array', 或 null
}
```

## 总结

SoA存储是一个强大的性能优化工具，但需要在合适的场景下使用：

- **适合**: 大规模、批量操作、数值密集的场景
- **不适合**: 小规模、随机访问、复杂对象为主的场景
- **关键**: 通过性能测试验证优化效果，避免过度优化

正确使用SoA存储可以显著提升ECS系统性能，但滥用会带来相反的效果。建议在实际项目中先进行基准测试，确认优化效果后再应用到生产环境。