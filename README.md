# ECS Framework

[![npm version](https://badge.fury.io/js/%40esengine%2Fecs-framework.svg)](https://badge.fury.io/js/%40esengine%2Fecs-framework)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一个轻量级的 TypeScript ECS（Entity-Component-System）框架，专为小游戏开发设计，适用于 Laya、Cocos 等游戏引擎。

## ✨ 特性

- 🚀 **轻量级 ECS 架构** - 基于实体组件系统，提供清晰的代码结构
- 📡 **事件系统** - 内置 Emitter 事件发射器，支持类型安全的事件管理
- ⏰ **定时器系统** - 完整的定时器管理，支持延迟和重复任务
- 🔍 **查询系统** - 基于位掩码的高性能实体查询
- 🛠️ **性能监控** - 内置性能监控工具，帮助优化游戏性能
- 🎯 **对象池** - 内存管理优化，减少垃圾回收压力
- 📊 **数学库** - 完整的 2D 数学运算支持

## 📦 安装

```bash
npm install @esengine/ecs-framework
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

### 2. 创建场景

```typescript
import { Scene, Vector2, EntitySystem } from '@esengine/ecs-framework';

class GameScene extends Scene {
    public initialize() {
        // 创建玩家实体
        const player = this.createEntity("Player");
        
        // 设置位置
        player.position = new Vector2(100, 100);
        
        // 添加自定义组件
        const movement = player.addComponent(new MovementComponent());
        
        // 添加系统
        this.addEntityProcessor(new MovementSystem());
    }
    
    public onStart() {
        console.log("游戏场景已启动");
    }
}

// 设置当前场景
Core.scene = new GameScene();
```

### 3. 创建组件

```typescript
import { Component, Vector2, Time } from '@esengine/ecs-framework';

class MovementComponent extends Component {
    public speed: number = 100;
    public direction: Vector2 = Vector2.zero;
    
    public update() {
        if (this.direction.length > 0) {
            const movement = this.direction.multiply(this.speed * Time.deltaTime);
            this.entity.position = this.entity.position.add(movement);
        }
    }
}
```

### 4. 创建系统

```typescript
import { EntitySystem, Entity } from '@esengine/ecs-framework';

class MovementSystem extends EntitySystem {
    protected process(entities: Entity[]) {
        for (const entity of entities) {
            const movement = entity.getComponent(MovementComponent);
            if (movement) {
                movement.update();
            }
        }
    }
}
```

## 📚 核心概念

### Entity（实体）
实体是游戏世界中的基本对象，包含位置、旋转、缩放等基本属性，可以添加组件来扩展功能。

```typescript
import { Vector2 } from '@esengine/ecs-framework';

const entity = scene.createEntity("MyEntity");
entity.position = new Vector2(100, 200);
entity.rotation = Math.PI / 4;
entity.scale = new Vector2(2, 2);
```

### Component（组件）
组件包含数据和行为，定义了实体的特性。

```typescript
import { Component } from '@esengine/ecs-framework';

class HealthComponent extends Component {
    public maxHealth: number = 100;
    public currentHealth: number = 100;
    
    public takeDamage(damage: number) {
        this.currentHealth = Math.max(0, this.currentHealth - damage);
        if (this.currentHealth <= 0) {
            this.entity.destroy();
        }
    }
}
```

### System（系统）
系统处理实体集合，实现游戏逻辑。

```typescript
import { EntitySystem, Entity } from '@esengine/ecs-framework';

class HealthSystem extends EntitySystem {
    protected process(entities: Entity[]) {
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

### 事件系统

```typescript
import { Core, CoreEvents } from '@esengine/ecs-framework';

// 监听事件
Core.emitter.addObserver(CoreEvents.frameUpdated, this.onFrameUpdate, this);

// 发射自定义事件
Core.emitter.emit("playerDied", { player: entity, score: 1000 });

// 移除监听
Core.emitter.removeObserver(CoreEvents.frameUpdated, this.onFrameUpdate);
```

### 定时器系统

```typescript
import { Core } from '@esengine/ecs-framework';

// 延迟执行
Core.schedule(2.0, false, this, (timer) => {
    console.log("2秒后执行");
});

// 重复执行
Core.schedule(1.0, true, this, (timer) => {
    console.log("每秒执行一次");
});
```

### 实体查询

```typescript
// 按名称查找
const player = scene.findEntity("Player");

// 按标签查找
const enemies = scene.findEntitiesByTag(1);

// 按ID查找
const entity = scene.findEntityById(123);
```

### 性能监控

```typescript
import { PerformanceMonitor } from '@esengine/ecs-framework';

// 获取性能数据
const monitor = PerformanceMonitor.instance;
console.log("平均FPS:", monitor.averageFPS);
console.log("内存使用:", monitor.memoryUsage);
```

## 🛠️ 开发工具

### 对象池

```typescript
// 创建对象池
class BulletPool extends es.Pool<Bullet> {
    protected createObject(): Bullet {
        return new Bullet();
    }
}

const bulletPool = new BulletPool();

// 获取对象
const bullet = bulletPool.obtain();

// 释放对象
bulletPool.free(bullet);
```

### 实体调试

```typescript
// 获取实体调试信息
const debugInfo = entity.getDebugInfo();
console.log("实体信息:", debugInfo);

// 获取场景统计
const stats = scene.getStats();
console.log("场景统计:", stats);
```

## 📖 文档

- [快速入门](docs/getting-started.md) - 从零开始学习框架使用
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

# 进入源码目录
cd ecs-framework/source

# 安装依赖
npm install

# 构建项目
npm run build

# 运行测试
npm test
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