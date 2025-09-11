# 使用指南

ECS Framework 是一个高性能的 TypeScript ECS（Entity-Component-System）游戏开发框架。

## 什么是 ECS

ECS 是一种软件架构模式，特别适用于游戏开发：

- **Entity（实体）**：游戏世界中的对象，如玩家、敌人、子弹等
- **Component（组件）**：纯数据结构，描述实体的属性，如位置、速度、生命值等  
- **System（系统）**：处理具有特定组件的实体的业务逻辑

## 核心特性

- **高性能**：SparseSet索引、Archetype系统、SoA存储优化
- **类型安全**：完整的TypeScript支持，强类型检查
- **易于使用**：流式API和智能缓存，简洁的查询语法
- **可扩展**：支持多World、多Scene架构
- **调试友好**：内置性能监控和Cocos Creator可视化插件

## 平台支持

- Cocos Creator
- Laya Engine  
- 原生浏览器环境

## 快速开始

### 安装

```bash
npm install @esengine/ecs-framework
```

### 基础示例

```typescript
import { Core, Scene, Component, EntitySystem, ECSComponent, ECSSystem, Matcher } from '@esengine/ecs-framework';

// 创建核心实例和场景
const core = Core.create({ debug: true });
const scene = new Scene();
Core.setScene(scene);

// 定义组件
@ECSComponent('Position')
class Position extends Component {
    constructor(public x: number = 0, public y: number = 0) {
        super();
    }
}

@ECSComponent('Velocity')  
class Velocity extends Component {
    constructor(public x: number = 0, public y: number = 0) {
        super();
    }
}

// 创建实体
const player = scene.createEntity("Player");
player.addComponent(new Position(100, 100));
player.addComponent(new Velocity(5, 0));

// 创建系统
@ECSSystem('Movement')
class MovementSystem extends EntitySystem {
    constructor() {
        super(Matcher.all(Position, Velocity));
    }
    
    protected process(entities) {
        for (const entity of entities) {
            const pos = entity.getComponent(Position);
            const vel = entity.getComponent(Velocity);
            
            pos.x += vel.x;
            pos.y += vel.y;
        }
    }
}

scene.addEntityProcessor(new MovementSystem());

// 游戏循环
function update(deltaTime) {
    Core.update(deltaTime);
}
```

## 下一步

- 学习更多[核心概念](./concepts-explained)
- 了解[组件设计最佳实践](./component-design-guide)  
- 查看[性能优化技巧](./performance-optimization)
- 浏览完整的[API文档](../api/core/)