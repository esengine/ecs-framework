# ECS框架启动模板

欢迎使用ECS框架！这是一个最基础的启动模板，帮助您快速开始ECS项目开发。

## 📁 项目结构

```
ecs/
├── components/          # 组件目录（请在此添加您的组件）
├── systems/            # 系统目录（请在此添加您的系统）
├── scenes/             # 场景目录
│   └── GameScene.ts    # 主游戏场景
├── ECSManager.ts       # ECS管理器组件
└── README.md          # 本文档
```

## 🚀 快速开始

### 1. 启动ECS框架

ECS框架已经配置完成！您只需要：

1. 在Cocos Creator中打开您的场景
2. 创建一个空节点（例如命名为"ECSManager"）
3. 将 `ECSManager` 组件添加到该节点
4. 运行场景，ECS框架将自动启动

### 2. 查看控制台输出

如果一切正常，您将在控制台看到：

```
🎮 正在初始化ECS框架...
🔧 ECS调试模式已启用，可在Cocos Creator扩展面板中查看调试信息
🎯 游戏场景已创建
✅ ECS框架初始化成功！
🚀 游戏场景已启动
```

### 3. 使用调试面板

ECS框架已启用调试功能，您可以：

1. 在Cocos Creator编辑器菜单中选择 "扩展" → "ECS Framework" → "调试面板"
2. 调试面板将显示实时的ECS运行状态：
   - 实体数量和状态
   - 系统执行信息
   - 性能监控数据
   - 组件统计信息

**注意**：调试功能会消耗一定性能，正式发布时建议关闭调试模式。

## 📚 下一步开发

### 创建您的第一个组件

在 `components/` 目录下创建组件：

```typescript
// components/PositionComponent.ts
import { Component } from '@esengine/ecs-framework';
import { Vec3 } from 'cc';

export class PositionComponent extends Component {
    public position: Vec3 = new Vec3();
    
    constructor(x: number = 0, y: number = 0, z: number = 0) {
        super();
        this.position.set(x, y, z);
    }
}
```

### 创建您的第一个系统

在 `systems/` 目录下创建系统：

```typescript
// systems/MovementSystem.ts
import { EntitySystem, Entity, Matcher } from '@esengine/ecs-framework';
import { PositionComponent } from '../components/PositionComponent';

export class MovementSystem extends EntitySystem {
    constructor() {
        super(Matcher.empty().all(PositionComponent));
    }
    
    protected process(entities: Entity[]): void {
        for (const entity of entities) {
            const position = entity.getComponent(PositionComponent);
            if (position) {
                // TODO: 在这里编写移动逻辑
                console.log(`实体 ${entity.name} 位置: ${position.position}`);
            }
        }
    }
}
```

### 在场景中注册系统

在 `scenes/GameScene.ts` 的 `initialize()` 方法中添加：

```typescript
import { MovementSystem } from '../systems/MovementSystem';

public initialize(): void {
    super.initialize();
    this.name = "MainGameScene";
    
    // 添加系统
    this.addEntityProcessor(new MovementSystem());
    
    // 创建测试实体
    const testEntity = this.createEntity("TestEntity");
    testEntity.addComponent(new PositionComponent(0, 0, 0));
}
```

## 🔗 学习资源

- [ECS框架完整文档](https://github.com/esengine/ecs-framework)
- [ECS概念详解](https://github.com/esengine/ecs-framework/blob/master/docs/concepts-explained.md)
- [新手教程](https://github.com/esengine/ecs-framework/blob/master/docs/beginner-tutorials.md)
- [组件设计指南](https://github.com/esengine/ecs-framework/blob/master/docs/component-design-guide.md)
- [系统开发指南](https://github.com/esengine/ecs-framework/blob/master/docs/system-guide.md)

## 💡 开发提示

1. **组件只存储数据**：避免在组件中编写复杂逻辑
2. **系统处理逻辑**：所有业务逻辑应该在系统中实现
3. **使用Matcher过滤实体**：系统通过Matcher指定需要处理的实体类型
4. **性能优化**：大量实体时考虑使用位掩码查询和组件索引

## ❓ 常见问题

### Q: 如何创建实体？
A: 在场景中使用 `this.createEntity("实体名称")`

### Q: 如何给实体添加组件？
A: 使用 `entity.addComponent(new YourComponent())`

### Q: 如何获取实体的组件？
A: 使用 `entity.getComponent(YourComponent)`

### Q: 如何删除实体？
A: 使用 `entity.destroy()` 或 `this.destroyEntity(entity)`

---

🎮 **开始您的ECS开发之旅吧！**

如有问题，请查阅官方文档或提交Issue。
