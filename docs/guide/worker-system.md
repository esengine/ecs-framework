# Worker系统

Worker系统（WorkerEntitySystem）是ECS框架中基于Web Worker的多线程处理系统，专为计算密集型任务设计，能够充分利用多核CPU性能，实现真正的并行计算。

## 核心特性

- **真正的并行计算**：利用Web Worker在后台线程执行计算密集型任务
- **自动负载均衡**：根据CPU核心数自动分配工作负载
- **SharedArrayBuffer优化**：零拷贝数据共享，提升大规模计算性能
- **降级支持**：不支持Worker时自动回退到主线程处理
- **类型安全**：完整的TypeScript支持和类型检查

## 基本用法

### 简单的物理系统示例

```typescript
interface PhysicsData {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
}

@ECSSystem('Physics')
class PhysicsWorkerSystem extends WorkerEntitySystem<PhysicsData> {
  constructor() {
    super(Matcher.all(Position, Velocity, Physics), {
      enableWorker: true,              // 启用Worker并行处理
      workerCount: 4,                  // Worker数量
      useSharedArrayBuffer: true,      // 启用SharedArrayBuffer优化
      entityDataSize: 7,               // 每个实体数据大小
      maxEntities: 10000,              // 最大实体数量
      systemConfig: {                  // 传递给Worker的配置
        gravity: 100,
        friction: 0.95
      }
    });
  }

  // 数据提取：将Entity转换为可序列化的数据
  protected extractEntityData(entity: Entity): PhysicsData {
    const position = entity.getComponent(Position);
    const velocity = entity.getComponent(Velocity);
    const physics = entity.getComponent(Physics);

    return {
      id: entity.id,
      x: position.x,
      y: position.y,
      vx: velocity.x,
      vy: velocity.y,
      mass: physics.mass,
      radius: physics.radius
    };
  }

  // Worker处理函数：纯函数，在Worker中执行
  protected workerProcess(
    entities: PhysicsData[],
    deltaTime: number,
    config: any
  ): PhysicsData[] {
    return entities.map(entity => {
      // 应用重力
      entity.vy += config.gravity * deltaTime;

      // 更新位置
      entity.x += entity.vx * deltaTime;
      entity.y += entity.vy * deltaTime;

      // 应用摩擦力
      entity.vx *= config.friction;
      entity.vy *= config.friction;

      return entity;
    });
  }

  // 结果应用：将Worker处理结果应用回Entity
  protected applyResult(entity: Entity, result: PhysicsData): void {
    const position = entity.getComponent(Position);
    const velocity = entity.getComponent(Velocity);

    position.x = result.x;
    position.y = result.y;
    velocity.x = result.vx;
    velocity.y = result.vy;
  }

  // SharedArrayBuffer优化支持
  protected getDefaultEntityDataSize(): number {
    return 7; // id, x, y, vx, vy, mass, radius
  }

  protected writeEntityToBuffer(entityData: PhysicsData, offset: number): void {
    if (!this.sharedFloatArray) return;

    this.sharedFloatArray[offset + 0] = entityData.id;
    this.sharedFloatArray[offset + 1] = entityData.x;
    this.sharedFloatArray[offset + 2] = entityData.y;
    this.sharedFloatArray[offset + 3] = entityData.vx;
    this.sharedFloatArray[offset + 4] = entityData.vy;
    this.sharedFloatArray[offset + 5] = entityData.mass;
    this.sharedFloatArray[offset + 6] = entityData.radius;
  }

  protected readEntityFromBuffer(offset: number): PhysicsData | null {
    if (!this.sharedFloatArray) return null;

    return {
      id: this.sharedFloatArray[offset + 0],
      x: this.sharedFloatArray[offset + 1],
      y: this.sharedFloatArray[offset + 2],
      vx: this.sharedFloatArray[offset + 3],
      vy: this.sharedFloatArray[offset + 4],
      mass: this.sharedFloatArray[offset + 5],
      radius: this.sharedFloatArray[offset + 6]
    };
  }
}
```

## 配置选项

Worker系统支持丰富的配置选项：

```typescript
interface WorkerSystemConfig {
  /** 是否启用Worker并行处理 */
  enableWorker?: boolean;
  /** Worker数量，默认为CPU核心数 */
  workerCount?: number;
  /** 系统配置数据，会传递给Worker */
  systemConfig?: any;
  /** 是否使用SharedArrayBuffer优化 */
  useSharedArrayBuffer?: boolean;
  /** 每个实体在SharedArrayBuffer中占用的Float32数量 */
  entityDataSize?: number;
  /** 最大实体数量（用于预分配SharedArrayBuffer） */
  maxEntities?: number;
}
```

### 配置建议

```typescript
constructor() {
  super(matcher, {
    // 根据任务复杂度决定是否启用
    enableWorker: this.shouldUseWorker(),

    // 限制Worker数量，避免创建过多线程
    workerCount: Math.min(navigator.hardwareConcurrency || 2, 4),

    // 大量简单计算时启用SharedArrayBuffer
    useSharedArrayBuffer: this.entityCount > 1000,

    // 根据实际数据结构设置
    entityDataSize: 8, // 确保与数据结构匹配

    // 预估最大实体数量
    maxEntities: 10000,

    // 传递给Worker的全局配置
    systemConfig: {
      gravity: 9.8,
      friction: 0.95,
      worldBounds: { width: 1920, height: 1080 }
    }
  });
}

private shouldUseWorker(): boolean {
  // 根据实体数量和计算复杂度决定
  return this.expectedEntityCount > 100;
}
```

## 处理模式

Worker系统支持两种处理模式：

### 1. 传统Worker模式

数据通过序列化在主线程和Worker间传递：

```typescript
// 适用于：复杂计算逻辑，实体数量适中
constructor() {
  super(matcher, {
    enableWorker: true,
    useSharedArrayBuffer: false, // 使用传统模式
    workerCount: 2
  });
}

protected workerProcess(entities: EntityData[], deltaTime: number): EntityData[] {
  // 复杂的算法逻辑
  return entities.map(entity => {
    // AI决策、路径规划等复杂计算
    return this.complexAILogic(entity, deltaTime);
  });
}
```

### 2. SharedArrayBuffer模式

零拷贝数据共享，适合大量简单计算：

```typescript
// 适用于：大量实体的简单计算
constructor() {
  super(matcher, {
    enableWorker: true,
    useSharedArrayBuffer: true, // 启用共享内存
    entityDataSize: 6,
    maxEntities: 10000
  });
}

protected getSharedArrayBufferProcessFunction(): SharedArrayBufferProcessFunction {
  return function(sharedFloatArray: Float32Array, startIndex: number, endIndex: number, deltaTime: number, config: any) {
    const entitySize = 6;
    for (let i = startIndex; i < endIndex; i++) {
      const offset = i * entitySize;

      // 读取数据
      let x = sharedFloatArray[offset];
      let y = sharedFloatArray[offset + 1];
      let vx = sharedFloatArray[offset + 2];
      let vy = sharedFloatArray[offset + 3];

      // 物理计算
      vy += config.gravity * deltaTime;
      x += vx * deltaTime;
      y += vy * deltaTime;

      // 写回数据
      sharedFloatArray[offset] = x;
      sharedFloatArray[offset + 1] = y;
      sharedFloatArray[offset + 2] = vx;
      sharedFloatArray[offset + 3] = vy;
    }
  };
}
```

## 完整示例：粒子物理系统

一个包含碰撞检测的完整粒子物理系统：

```typescript
interface ParticleData {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  mass: number;
  radius: number;
  bounce: number;
  friction: number;
}

@ECSSystem('ParticlePhysics')
class ParticlePhysicsWorkerSystem extends WorkerEntitySystem<ParticleData> {
  constructor() {
    super(Matcher.all(Position, Velocity, Physics, Renderable), {
      enableWorker: true,
      workerCount: navigator.hardwareConcurrency || 2,
      useSharedArrayBuffer: true,
      entityDataSize: 9,
      maxEntities: 5000,
      systemConfig: {
        gravity: 100,
        canvasWidth: 800,
        canvasHeight: 600,
        groundFriction: 0.98
      }
    });
  }

  protected extractEntityData(entity: Entity): ParticleData {
    const position = entity.getComponent(Position);
    const velocity = entity.getComponent(Velocity);
    const physics = entity.getComponent(Physics);
    const renderable = entity.getComponent(Renderable);

    return {
      id: entity.id,
      x: position.x,
      y: position.y,
      dx: velocity.dx,
      dy: velocity.dy,
      mass: physics.mass,
      radius: renderable.size,
      bounce: physics.bounce,
      friction: physics.friction
    };
  }

  protected workerProcess(
    entities: ParticleData[],
    deltaTime: number,
    config: any
  ): ParticleData[] {
    const result = entities.map(e => ({ ...e }));

    // 基础物理更新
    for (const particle of result) {
      // 应用重力
      particle.dy += config.gravity * deltaTime;

      // 更新位置
      particle.x += particle.dx * deltaTime;
      particle.y += particle.dy * deltaTime;

      // 边界碰撞
      if (particle.x <= particle.radius) {
        particle.x = particle.radius;
        particle.dx = -particle.dx * particle.bounce;
      } else if (particle.x >= config.canvasWidth - particle.radius) {
        particle.x = config.canvasWidth - particle.radius;
        particle.dx = -particle.dx * particle.bounce;
      }

      if (particle.y <= particle.radius) {
        particle.y = particle.radius;
        particle.dy = -particle.dy * particle.bounce;
      } else if (particle.y >= config.canvasHeight - particle.radius) {
        particle.y = config.canvasHeight - particle.radius;
        particle.dy = -particle.dy * particle.bounce;
        particle.dx *= config.groundFriction;
      }

      // 空气阻力
      particle.dx *= particle.friction;
      particle.dy *= particle.friction;
    }

    // 粒子间碰撞检测（O(n²)算法）
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const p1 = result[i];
        const p2 = result[j];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = p1.radius + p2.radius;

        if (distance < minDistance && distance > 0) {
          // 分离粒子
          const nx = dx / distance;
          const ny = dy / distance;
          const overlap = minDistance - distance;

          p1.x -= nx * overlap * 0.5;
          p1.y -= ny * overlap * 0.5;
          p2.x += nx * overlap * 0.5;
          p2.y += ny * overlap * 0.5;

          // 弹性碰撞
          const relativeVelocityX = p2.dx - p1.dx;
          const relativeVelocityY = p2.dy - p1.dy;
          const velocityAlongNormal = relativeVelocityX * nx + relativeVelocityY * ny;

          if (velocityAlongNormal > 0) continue;

          const restitution = (p1.bounce + p2.bounce) * 0.5;
          const impulseScalar = -(1 + restitution) * velocityAlongNormal / (1/p1.mass + 1/p2.mass);

          p1.dx -= impulseScalar * nx / p1.mass;
          p1.dy -= impulseScalar * ny / p1.mass;
          p2.dx += impulseScalar * nx / p2.mass;
          p2.dy += impulseScalar * ny / p2.mass;
        }
      }
    }

    return result;
  }

  protected applyResult(entity: Entity, result: ParticleData): void {
    if (!entity?.enabled) return;

    const position = entity.getComponent(Position);
    const velocity = entity.getComponent(Velocity);

    if (position && velocity) {
      position.set(result.x, result.y);
      velocity.set(result.dx, result.dy);
    }
  }

  protected getDefaultEntityDataSize(): number {
    return 9;
  }

  protected writeEntityToBuffer(data: ParticleData, offset: number): void {
    if (!this.sharedFloatArray) return;

    this.sharedFloatArray[offset + 0] = data.id;
    this.sharedFloatArray[offset + 1] = data.x;
    this.sharedFloatArray[offset + 2] = data.y;
    this.sharedFloatArray[offset + 3] = data.dx;
    this.sharedFloatArray[offset + 4] = data.dy;
    this.sharedFloatArray[offset + 5] = data.mass;
    this.sharedFloatArray[offset + 6] = data.radius;
    this.sharedFloatArray[offset + 7] = data.bounce;
    this.sharedFloatArray[offset + 8] = data.friction;
  }

  protected readEntityFromBuffer(offset: number): ParticleData | null {
    if (!this.sharedFloatArray) return null;

    return {
      id: this.sharedFloatArray[offset + 0],
      x: this.sharedFloatArray[offset + 1],
      y: this.sharedFloatArray[offset + 2],
      dx: this.sharedFloatArray[offset + 3],
      dy: this.sharedFloatArray[offset + 4],
      mass: this.sharedFloatArray[offset + 5],
      radius: this.sharedFloatArray[offset + 6],
      bounce: this.sharedFloatArray[offset + 7],
      friction: this.sharedFloatArray[offset + 8]
    };
  }

  // 性能监控
  public getPerformanceInfo(): {
    enabled: boolean;
    workerCount: number;
    entityCount: number;
    isProcessing: boolean;
  } {
    const workerInfo = this.getWorkerInfo();
    return {
      ...workerInfo,
      entityCount: this.entities.length
    };
  }
}
```

## 适用场景

Worker系统特别适合以下场景：

### 1. 物理模拟
- **重力系统**：大量实体的重力计算
- **碰撞检测**：复杂的碰撞算法
- **流体模拟**：粒子流体系统
- **布料模拟**：顶点物理计算

### 2. AI计算
- **路径寻找**：A*、Dijkstra等算法
- **行为树**：复杂的AI决策逻辑
- **群体智能**：鸟群、鱼群算法
- **神经网络**：简单的AI推理

### 3. 数据处理
- **大量实体更新**：状态机、生命周期管理
- **统计计算**：游戏数据分析
- **图像处理**：纹理生成、效果计算
- **音频处理**：音效合成、频谱分析

## 最佳实践

### 1. Worker函数要求

```typescript
// ✅ 推荐：Worker处理函数是纯函数
protected workerProcess(entities: PhysicsData[], deltaTime: number, config: any): PhysicsData[] {
  // 只使用参数和标准JavaScript API
  return entities.map(entity => {
    // 纯计算逻辑，不依赖外部状态
    entity.y += entity.velocity * deltaTime;
    return entity;
  });
}

// ❌ 避免：在Worker函数中使用外部引用
protected workerProcess(entities: PhysicsData[], deltaTime: number): PhysicsData[] {
  // this 和外部变量在Worker中不可用
  return entities.map(entity => {
    entity.y += this.someProperty; // ❌ 错误
    return entity;
  });
}
```

### 2. 数据设计

```typescript
// ✅ 推荐：合理的数据设计
interface SimplePhysicsData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  // 保持数据结构简单，便于序列化
}

// ❌ 避免：复杂的嵌套对象
interface ComplexData {
  transform: {
    position: { x: number; y: number };
    rotation: { angle: number };
  };
  // 复杂嵌套结构增加序列化开销
}
```

### 3. Worker数量控制

```typescript
// ✅ 推荐：适当的Worker数量
constructor() {
  super(matcher, {
    workerCount: Math.min(navigator.hardwareConcurrency || 2, 4), // 限制最大数量
    enableWorker: this.shouldUseWorker(), // 条件启用
  });
}

private shouldUseWorker(): boolean {
  // 根据实体数量和复杂度决定是否使用Worker
  return this.expectedEntityCount > 100;
}
```

### 4. 性能监控

```typescript
// ✅ 推荐：性能监控
public getPerformanceMetrics(): WorkerPerformanceMetrics {
  return {
    ...this.getWorkerInfo(),
    entityCount: this.entities.length,
    averageProcessTime: this.getAverageProcessTime(),
    workerUtilization: this.getWorkerUtilization()
  };
}
```

## 性能优化建议

### 1. 计算密集度评估
只对计算密集型任务使用Worker，避免在简单计算上增加线程开销。

### 2. 数据传输优化
- 使用SharedArrayBuffer减少序列化开销
- 保持数据结构简单和扁平
- 避免频繁的大数据传输

### 3. 批处理大小
根据实体数量和Worker数量调整批处理大小，平衡负载和开销。

### 4. 降级策略
始终提供主线程回退方案，确保在不支持Worker的环境中正常运行。

### 5. 内存管理
及时清理Worker池和共享缓冲区，避免内存泄漏。

## 在线演示

查看完整的Worker系统演示：[Worker系统演示](https://esengine.github.io/ecs-framework/demos/worker-system/)

该演示展示了：
- 多线程物理计算
- 实时性能对比
- SharedArrayBuffer优化
- 大量实体的并行处理

Worker系统为ECS框架提供了强大的并行计算能力，让你能够充分利用现代多核处理器的性能，为复杂的游戏逻辑和计算密集型任务提供了高效的解决方案。