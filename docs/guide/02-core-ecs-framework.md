# 第二章 核心 ECS 框架

本文档深入介绍了实体-组件-系统（Entity-Component-System）架构，包括核心协调器、世界管理器和场景管理系统。涵盖了框架从高级协调到基础 ECS 构建块的分层设计。

有关特定方面的详细信息：实体生命周期和层级管理，参见《实体与实体管理》；组件设计和存储优化，参见《组件与存储》；系统处理和执行，参见《系统与处理》；高级场景和世界管理，参见《场景与世界》。

## 架构概览

ECS 框架实现了一个分层架构，在多个抽象级别上分离关注点，从全局协调到单个实体处理。

## 核心协调

Core 类作为全局协调器，管理框架的生命周期并为所有子系统提供统一访问。

## 核心初始化和配置

框架支持简单和高级配置模式：

```typescript
// 简单配置（向后兼容）
Core.create(true);  // 启用调试模式
Core.create(false); // 生产模式

// 高级配置
const config: ICoreConfig = {
    debug: true,
    enableEntitySystems: true,
    debugConfig: {
        enabled: true,
        websocketUrl: 'ws://localhost:8080',
        debugFrameRate: 30,
        channels: {
            entities: true,
            systems: true,
            performance: true,
            components: true,
            scenes: true
        }
    }
};
Core.create(config);
```

**API 参考:**
- [Core.create()](../api/core/ecs-framework-monorepo.core.create.md) - 核心实例创建方法
- [ICoreConfig](../api/core/ecs-framework-monorepo.icoreconfig.md) - 核心配置接口

## 双架构支持

框架提供两种操作模式以支持不同的用例：

| 模式 | 用例 | 实现方式 |
|------|------|----------|
| 单场景模式 | 简单游戏、原型、学习 | Core.setScene(scene) |
| 多世界模式 | MMO 服务器、复杂应用 | Core.enableWorldManager() |

## 世界管理系统

WorldManager 为多个独立的 ECS 环境提供全局协调，每个环境都包含自己的场景和系统。

## 世界配置与生命周期

每个 World 实例代表一个独立的 ECS 环境，拥有自己的场景和全局系统：

```typescript
// 使用配置创建World
const worldConfig: IWorldConfig = {
    name: 'GameRoom_001',
    debug: true,
    maxScenes: 10,
    autoCleanup: true
};

const gameWorld = worldManager.createWorld('room_001', worldConfig);

// World内的场景管理
const battleScene = gameWorld.createScene('battle', new Scene());
const uiScene = gameWorld.createScene('ui', new Scene());

// 跨场景逻辑的全局系统
gameWorld.addGlobalSystem(new NetworkSyncSystem());
gameWorld.addGlobalSystem(new PlayerManagementSystem());

// World生命周期
gameWorld.start();  // 激活所有场景和全局系统
gameWorld.stop();   // 停用但保持状态
gameWorld.destroy(); // 完全清理和资源回收
```

**API 参考:**
- [WorldManager](../api/core/ecs-framework-monorepo.iworldmanagerconfig.md) - 世界管理器配置
- [IWorldConfig](../api/core/ecs-framework-monorepo.iworldconfig.md) - 世界配置接口
- [World.addGlobalSystem()](../api/core/ecs-framework-monorepo.world.addglobalsystem.md) - 添加全局系统

## 场景管理

Scene 类实现了核心 ECS 容器，在单个游戏上下文中管理实体、系统及其交互。

## 更新循环集成

框架通过统一的更新接口与不同游戏引擎集成：

```typescript
// 引擎无关的更新模式
function gameLoop(deltaTime: number) {
    Core.update(deltaTime);
}

// Cocos Creator 集成
update(deltaTime: number) {
    Core.update(deltaTime);
}

// Laya 引擎集成
Laya.timer.frameLoop(1, this, () => {
    const deltaTime = Laya.timer.delta / 1000;
    Core.update(deltaTime);
});

// 浏览器集成
function browserGameLoop(currentTime: number) {
    const deltaTime = (currentTime - lastTime) / 1000;
    Core.update(deltaTime);
    requestAnimationFrame(browserGameLoop);
}
```

**API 参考:**
- [Core.update()](../api/core/ecs-framework-monorepo.core.update.md) - 核心更新方法

核心 ECS 框架为构建可扩展的游戏应用提供了坚实的基础，灵活的架构既支持简单的单场景游戏，也支持复杂的多世界应用。分层设计确保了关注点的清晰分离，同时通过优化的存储和查询系统保持高性能。