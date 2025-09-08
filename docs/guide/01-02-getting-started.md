# 快速开始

本指南提供了设置和使用 ECS 框架的快速入门，涵盖安装、基本配置、核心概念和第一个工作示例。本页面专注于让您快速提高生产力的基本步骤。

有关详细的平台集成指南，请参见[《平台集成》](04-platform-integrations.md)。有关深入的架构概念，请参见[《架构概述》](01-01-architecture-overview.md)。有关完整的 API 文档，请参见[《核心 ECS 框架》](02-core-ecs-framework.md)。

## 安装与设置

### 包安装

通过 npm 安装框架：

```bash
npm install @esengine/ecs-framework
```

框架开箱即用地支持 TypeScript，并在浏览器和 Node.js 环境中都能工作。

### 核心初始化

框架提供两种初始化方法：简化方式（向后兼容）和详细配置。

### 基础初始化（推荐初学者使用）

```typescript
import { Core, Scene } from '@esengine/ecs-framework';

// 启用调试模式的简单初始化
Core.create(true);  // 启用调试模式
// Core.create(false); // 生产模式

// 创建并设置场景
const scene = new Scene();
Core.setScene(scene);
```

### 高级配置

```typescript
import { Core, ICoreConfig } from '@esengine/ecs-framework';

const config: ICoreConfig = {
    debug: true,
    enableEntitySystems: true,
    debugConfig: {
        enabled: true,
        websocketUrl: 'ws://localhost:8080',
        autoReconnect: true,
        updateInterval: 1000,
        channels: {
            entities: true,
            systems: true,
            performance: true,
            components: true,
            scenes: true
        }
    }
};

const core = Core.create(config);
```

## 框架架构概述

了解核心架构有助于您有效地构建游戏：

### 核心类及其作用

| 类 | 文件位置 | 主要作用 |
|----|----------|----------|
| Core | packages/core/src/Core.ts | 框架生命周期管理，全局编排 |
| Scene | packages/core/src/Scene.ts | 实体和系统容器，更新协调 |
| Entity | packages/core/src/Entity.ts | 具有唯一标识的组件容器 |
| Component | packages/core/src/Component.ts | 数据存储和简单行为 |
| EntitySystem | packages/core/src/EntitySystem.ts | 基于组件查询的实体处理逻辑 |

## 第一个 ECS 应用

让我们构建一个简单的移动系统来演示核心概念：

### 步骤 1：定义组件

组件存储数据和简单行为：

```typescript
import { Component, ECSComponent } from '@esengine/ecs-framework';

@ECSComponent('PositionComponent')
class PositionComponent extends Component {
    public x: number = 0;
    public y: number = 0;
    
    constructor(x: number = 0, y: number = 0) {
        super();
        this.x = x;
        this.y = y;
    }
}

@ECSComponent('VelocityComponent')
class VelocityComponent extends Component {
    public x: number = 0;
    public y: number = 0;
    
    constructor(x: number = 0, y: number = 0) {
        super();
        this.x = x;
        this.y = y;
    }
}
```

### 步骤 2：创建系统

系统包含游戏逻辑并处理具有特定组件的实体：

```typescript
import { EntitySystem, Entity, Matcher, Time, ECSSystem } from '@esengine/ecs-framework';

@ECSSystem('MovementSystem')
class MovementSystem extends EntitySystem {
    constructor() {
        super(Matcher.all(PositionComponent, VelocityComponent));
    }
    
    protected process(entities: Entity[]): void {
        entities.forEach(entity => {
            const position = entity.getComponent(PositionComponent)!;
            const velocity = entity.getComponent(VelocityComponent)!;
            
            position.x += velocity.x * Time.deltaTime;
            position.y += velocity.y * Time.deltaTime;
        });
    }
}
```

### 步骤 3：设置场景和实体

```typescript
import { Core, Scene } from '@esengine/ecs-framework';

// 初始化框架
Core.create(true);

// 创建场景
const scene = new Scene();
Core.setScene(scene);

// 向场景添加系统
scene.addEntityProcessor(new MovementSystem());

// 创建实体
const player = scene.createEntity("Player");
player.addComponent(new PositionComponent(100, 100));
player.addComponent(new VelocityComponent(50, 0));

const enemy = scene.createEntity("Enemy");
enemy.addComponent(new PositionComponent(200, 200));
enemy.addComponent(new VelocityComponent(-30, 10));
```

### 步骤 4：游戏循环

```typescript
// 浏览器游戏循环
function gameLoop(currentTime: number) {
    const deltaTime = (currentTime - lastTime) / 1000;
    Core.update(deltaTime);
    requestAnimationFrame(gameLoop);
}

let lastTime = 0;
requestAnimationFrame(gameLoop);
```

## 组件和系统交互流程

### 更新流程详情

1. Core.update() 驱动主循环
2. Scene 遍历所有注册的 EntitySystem 实例
3. 每个 EntitySystem.process() 接收与其 Matcher 条件匹配的实体
4. 系统使用 Entity.getComponent() 查询实体以获取所需组件
5. 系统修改组件数据以实现游戏逻辑
6. 每帧重复此循环

## 平台集成

框架通过统一的更新接口支持多个平台：

### Cocos Creator 集成

```typescript
import { Component as CocosComponent, _decorator } from 'cc';
import { Core, Scene } from '@esengine/ecs-framework';

@ccclass('ECSManager')
export class ECSManager extends CocosComponent {
    start() {
        Core.create(true);
        const scene = new Scene();
        Core.setScene(scene);
        // 设置系统和实体...
    }
    
    update(deltaTime: number) {
        Core.update(deltaTime);
    }
}
```

### Laya Engine 集成

```typescript
import { Core } from '@esengine/ecs-framework';

class LayaECSGame extends Laya.Scene {
    onAwake(): void {
        Core.create(true);
        // 设置场景...
        
        Laya.timer.frameLoop(1, this, this.updateECS);
    }
    
    private updateECS(): void {
        const deltaTime = Laya.timer.delta / 1000;
        Core.update(deltaTime);
    }
}
```

### Node.js 服务器集成

```typescript
class ServerGameManager {
    private tickRate: number = 60;
    private lastUpdate: number = Date.now();
    
    constructor() {
        Core.create(false); // 服务器禁用调试模式
        // 设置场景...
    }
    
    private gameLoop(): void {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;
        
        Core.update(deltaTime);
        
        setTimeout(() => this.gameLoop(), 1000 / this.tickRate);
    }
}
```

## 调试和开发工具

框架包含内置的调试功能：

### 调试配置

为开发启用调试模式：

```typescript
Core.create({
    debug: true,
    debugConfig: {
        enabled: true,
        websocketUrl: 'ws://localhost:8080',
        channels: {
            entities: true,
            systems: true,
            performance: true
        }
    }
});
```

### 性能监控

```typescript
// 获取场景统计信息
const sceneStats = scene.getStats();
console.log('实体数量:', sceneStats.entityCount);
console.log('系统数量:', sceneStats.processorCount);

// 获取查询性能
const queryStats = scene.querySystem.getStats();
console.log('查询统计信息:', queryStats);
```

### Cocos Creator 调试插件

对于 Cocos Creator 用户，请从 Cocos Store 安装官方调试插件，以获得可视化调试功能，包括实体查看器、组件编辑器和性能监控。

## 下一步

现在您已经有一个基本的 ECS 应用程序在运行，请探索这些主题：

- **核心概念** - 在[《核心 ECS 框架》](02-core-ecs-framework.md)中了解实体生命周期、组件设计模式和系统类型

- **组件设计** - 在[《组件与存储》](02-02-components-and-storage.md)中学习创建可维护组件的最佳实践

- **系统架构** - 在[《系统与处理》](02-03-systems-and-processing.md)中了解高级系统模式和执行顺序

- **查询系统** - 在[《查询系统与性能》](03-01-query-system-and-performance.md)中学习高性能实体查询

- **平台集成** - 在[《平台集成》](04-platform-integrations.md)中查看详细的集成指南

- **性能优化** - 在[《高级特性》](03-advanced-features.md)中了解高级优化技术