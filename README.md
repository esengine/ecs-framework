# ECS Framework

[![npm version](https://badge.fury.io/js/%40esengine%2Fecs-framework.svg)](https://badge.fury.io/js/%40esengine%2Fecs-framework)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一个轻量级的 TypeScript ECS（Entity-Component-System）框架，专为小游戏开发设计，适用于 Laya、Cocos 等游戏引擎。

## ✨ 特性

- 🚀 **轻量级 ECS 架构** - 基于实体组件系统，提供清晰的代码结构
- ⚡ **高性能** - 实体创建速度可达64万实体/秒，支持大规模实体管理
- 🎯 **智能优化** - 组件对象池、位掩码优化器、延迟索引更新等性能优化技术
- 📡 **事件系统** - 内置 Emitter 事件发射器，支持类型安全的事件管理
- ⏰ **定时器系统** - 完整的定时器管理，支持延迟和重复任务
- 🔍 **查询系统** - 基于位掩码的高性能实体查询，支持批量操作
- 🛠️ **性能监控** - 内置性能监控工具，帮助优化游戏性能
- 🔧 **批量操作** - 支持批量实体创建、组件添加等高效操作

## 📦 安装

```bash
npm install @esengine/ecs-framework
```

## 📊 性能基准

```bash
# 运行快速性能基准测试
npm run benchmark

# 运行完整性能测试
npm run test:performance
```

**框架性能数据**:

### 🚀 实体创建性能
- **小规模**: 640,697 实体/秒 (1,000个实体/1.56ms)
- **中规模**: 250,345 实体/秒 (10,000个实体/39.94ms)  
- **大规模**: 161,990 实体/秒 (500,000个实体/3.09秒)

### 🎯 核心操作性能
```
📊 核心操作性能
  实体创建: 640,697个/秒 
  组件添加: 596,929组件/秒
  位掩码操作: 5,000,000次/秒
  查询缓存: 零延迟访问
  批量操作: 高效处理

🔧 优化技术效果
  组件对象池: 减少30-50%内存分配
  位掩码优化器: 提升20-40%掩码性能  
  批量操作: 大幅减少创建时间
  索引优化: 避免O(n)重复检查
  缓存策略: 延迟清理机制
```

## 🚀 快速开始

### 1. 初始化框架

```typescript
import { Core, CoreEvents } from '@esengine/ecs-framework';

// 创建 Core 实例
const core = Core.create(true); // true 表示开启调试模式

// 在游戏循环中更新框架
function gameLoop() {
    // 发送帧更新事件
    Core.emitter.emit(CoreEvents.frameUpdated);
}
```

### 2. 高性能批量创建实体

```typescript
import { Scene, EntitySystem } from '@esengine/ecs-framework';

class GameScene extends Scene {
    public initialize() {
        // 批量创建实体
        const entities = this.createEntities(1000, "Enemy");
        
        // 批量添加组件
        entities.forEach((entity, index) => {
            entity.addComponent(new PositionComponent(
                Math.random() * 1000,
                Math.random() * 1000
            ));
            entity.addComponent(new VelocityComponent());
        });
        
        // 添加系统
        this.addEntityProcessor(new MovementSystem());
    }
}
```

### 3. 使用组件对象池优化内存

```typescript
import { Component, ComponentPoolManager } from '@esengine/ecs-framework';

class BulletComponent extends Component {
    public damage: number = 10;
    public speed: number = 300;
    
    // 重置方法用于对象池
    public reset() {
        this.damage = 10;
        this.speed = 300;
    }
}

// 注册组件池
ComponentPoolManager.getInstance().registerPool(BulletComponent, 1000);

// 使用对象池获取组件
const bullet = ComponentPoolManager.getInstance().getComponent(BulletComponent);
entity.addComponent(bullet);

// 释放回对象池
ComponentPoolManager.getInstance().releaseComponent(bullet);
```

### 4. 位掩码优化器加速查询

```typescript
import { BitMaskOptimizer } from '@esengine/ecs-framework';

// 注册常用组件类型
const optimizer = BitMaskOptimizer.getInstance();
optimizer.registerComponentType(PositionComponent);
optimizer.registerComponentType(VelocityComponent);
optimizer.registerComponentType(RenderComponent);

// 预计算常用掩码组合
optimizer.precomputeCommonMasks();

// 高效的掩码操作
const positionMask = optimizer.getComponentMask(PositionComponent);
const movementMask = optimizer.getCombinedMask([PositionComponent, VelocityComponent]);
```

## 📚 核心概念

### Entity（实体）
实体是游戏世界中的基本对象，支持批量操作和高性能创建。

```typescript
// 单个实体创建
const entity = scene.createEntity("MyEntity");

// 批量实体创建
const entities = scene.createEntities(1000, "Bullets");

// 实体属性设置
entity.tag = 1;
entity.updateOrder = 0;
entity.enabled = true;
```

### Component（组件）
组件包含数据和行为，支持对象池优化。

```typescript
import { Component, ComponentPoolManager } from '@esengine/ecs-framework';

class HealthComponent extends Component {
    public maxHealth: number = 100;
    public currentHealth: number = 100;
    
    // 对象池重置方法
    public reset() {
        this.maxHealth = 100;
        this.currentHealth = 100;
    }
    
    public takeDamage(damage: number) {
        this.currentHealth = Math.max(0, this.currentHealth - damage);
        if (this.currentHealth <= 0) {
            this.entity.destroy();
        }
    }
}

// 注册到对象池
ComponentPoolManager.getInstance().registerPool(HealthComponent, 500);
```

### System（系统）
系统处理实体集合，支持批量处理优化。

```typescript
import { EntitySystem, Entity } from '@esengine/ecs-framework';

class HealthSystem extends EntitySystem {
    protected process(entities: Entity[]) {
        // 批量处理实体
        const batchSize = 1000;
        for (let i = 0; i < entities.length; i += batchSize) {
            const batch = entities.slice(i, i + batchSize);
            this.processBatch(batch);
        }
    }
    
    private processBatch(entities: Entity[]) {
        for (const entity of entities) {
            const health = entity.getComponent(HealthComponent);
            if (health && health.currentHealth <= 0) {
                entity.destroy();
            }
        }
    }
}
```

## 🎮 高级功能

### 批量操作API

```typescript
// 批量创建实体
const entities = scene.createEntities(5000, "Enemies");

// 批量查询
const movingEntities = scene.getEntitiesWithComponents([PositionComponent, VelocityComponent]);

// 延迟缓存清理
scene.addEntity(entity, false); // 延迟缓存清理
// ... 添加更多实体
scene.querySystem.clearCache(); // 手动清理缓存
```

### 性能监控

```typescript
import { Core } from '@esengine/ecs-framework';

// 获取性能统计
const stats = scene.getPerformanceStats();
console.log(`实体数量: ${stats.entityCount}`);
console.log(`查询缓存大小: ${stats.queryCacheSize}`);
console.log(`组件池统计:`, stats.componentPoolStats);
```

### 内存优化

```typescript
// 预热组件池
ComponentPoolManager.getInstance().preWarmPools({
    BulletComponent: 1000,
    EffectComponent: 500,
    PickupComponent: 200
});

// 清理未使用的组件
ComponentPoolManager.getInstance().clearUnusedComponents();
```

## 🧪 测试和基准

### 运行测试套件

```bash
# 运行所有测试
npm run test

# 单元测试
npm run test:unit

# 性能测试
npm run test:performance

# 快速基准测试
npm run benchmark
```

### 自定义性能测试

```typescript
import { runEntityCreationBenchmark } from './Testing/Performance/benchmark';

// 运行自定义基准测试
await runEntityCreationBenchmark();
```

## 🔧 优化建议

### 大规模实体处理

1. **使用批量API**
   ```typescript
   // ✅ 推荐：批量创建
   const entities = scene.createEntities(10000, "Units");
   
   // ❌ 避免：循环单个创建
   for (let i = 0; i < 10000; i++) {
       scene.createEntity("Unit" + i);
   }
   ```

2. **启用对象池**
   ```typescript
   // 预先注册常用组件池
   ComponentPoolManager.getInstance().registerPool(BulletComponent, 2000);
   ComponentPoolManager.getInstance().registerPool(EffectComponent, 1000);
   ```

3. **优化查询频率**
   ```typescript
   // 缓存查询结果
   if (frameCount % 5 === 0) {
       this.cachedEnemies = scene.getEntitiesWithComponent(EnemyComponent);
   }
   ```

### 移动端优化

- 实体数量建议 ≤ 20,000
- 启用组件对象池
- 减少查询频率
- 使用批量操作

## 📈 版本更新

### v2.0.6 (最新)
- 🚀 **高性能实体创建**: 支持64万实体/秒的创建速度
- 🎯 **组件对象池**: 减少内存分配开销
- ⚡ **位掩码优化器**: 加速组件查询和操作
- 🔧 **批量操作API**: 支持高效的批量实体创建
- 📊 **性能监控**: 完整的性能分析工具
- 🧪 **测试套件**: 单元测试、性能测试、集成测试

### 历史版本
- v1.x.x: 基础ECS架构实现

## 📖 文档

- [快速入门](docs/getting-started.md) - 从零开始学习框架使用
- [实体使用指南](docs/entity-guide.md) - 详细了解实体的所有功能和用法
- [核心概念](docs/core-concepts.md) - 深入了解 ECS 架构和设计原理
- [查询系统使用指南](docs/query-system-usage.md) - 学习高性能查询系统的详细用法

## 🔗 扩展库

- [路径寻找库](https://github.com/esengine/ecs-astar) - A*、广度优先、Dijkstra、GOAP 算法
- [AI 系统](https://github.com/esengine/BehaviourTree-ai) - 行为树、效用 AI 系统

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发环境设置

```bash
# 克隆项目
git clone https://github.com/esengine/ecs-framework.git
cd ecs-framework

# 运行基准测试
node benchmark.js

# 开发构建 (在source目录)
cd source && npm install && npm run build
```

### 构建要求

- Node.js >= 14.0.0
- TypeScript >= 4.0.0

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

## 💬 交流群

加入 QQ 群讨论：[ecs游戏框架交流](https://jq.qq.com/?_wv=1027&k=29w1Nud6)

---

**ECS Framework** - 让游戏开发更简单、更高效！ 