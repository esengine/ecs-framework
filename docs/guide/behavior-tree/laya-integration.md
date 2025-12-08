# Laya 引擎集成

本教程将引导你在 Laya 引擎项目中集成和使用行为树系统。

## 前置要求

- LayaAir 3.x 或更高版本
- 基本的 TypeScript 知识
- 已完成[快速开始](./getting-started.md)教程

## 安装

在你的 Laya 项目根目录下：

```bash
npm install @esengine/ecs-framework @esengine/behavior-tree
```

## 项目结构

建议的项目结构：

```
src/
├── ai/
│   ├── EnemyAI.ts
│   └── BossAI.ts
├── systems/
│   └── AISystem.ts
└── Main.ts
resources/
└── behaviors/
    ├── enemy.btree.json
    └── boss.btree.json
```


## 初始化

### 在Main.ts中初始化

```typescript
import { Core, Scene } from '@esengine/ecs-framework';
import { BehaviorTreePlugin } from '@esengine/behavior-tree';

export class Main {
    constructor() {
        Laya.init(1280, 720).then(() => {
            this.initECS();
            this.startGame();
        });
    }

    private async initECS() {
        // 初始化 ECS
        Core.create();

        // 安装行为树插件
        const btPlugin = new BehaviorTreePlugin();
        await Core.installPlugin(btPlugin);

        // 创建并设置场景
        const scene = new Scene();
        btPlugin.setupScene(scene);
        Core.setScene(scene);

        // 启动更新循环
        Laya.timer.frameLoop(1, this, this.update);
    }

    private update() {
        // Core.update会自动更新场景
        Core.update(Laya.timer.delta / 1000);
    }

    private startGame() {
        // 加载场景
    }
}

new Main();
```


## 创建AI组件

```typescript
import { Core, Entity } from '@esengine/ecs-framework';
import {
    BehaviorTreeBuilder,
    BehaviorTreeStarter,
    BehaviorTreeRuntimeComponent
} from '@esengine/behavior-tree';

export class EnemyAI extends Laya.Script {
    private aiEntity: Entity;

    onEnable() {
        this.createBehaviorTree();
    }

    private createBehaviorTree() {
        // 获取Core管理的场景
        const scene = Core.scene;
        if (!scene) {
            console.error('场景未初始化');
            return;
        }

        const sprite = this.owner as Laya.Sprite;

        // 使用Builder API创建行为树
        const tree = BehaviorTreeBuilder.create('EnemyAI')
            .defineBlackboardVariable('layaSprite', sprite)
            .defineBlackboardVariable('health', 100)
            .defineBlackboardVariable('position', { x: sprite.x, y: sprite.y })
            .selector('MainBehavior')
                .sequence('Combat')
                    .blackboardCompare('health', 30, 'greater')
                    .log('攻击', 'Attack')
                .end()
                .log('巡逻', 'Patrol')
            .end()
            .build();

        // 创建AI实体并启动
        this.aiEntity = scene.createEntity(`AI_${sprite.name}`);
        BehaviorTreeStarter.start(this.aiEntity, tree);
    }

    onDisable() {
        // 停止AI
        if (this.aiEntity) {
            BehaviorTreeStarter.stop(this.aiEntity);
        }
    }
}
```


## 与Laya节点交互

要实现与Laya节点的交互，需要创建自定义执行器。下面展示一个完整示例。

## 完整示例

创建一个使用自定义执行器的敌人AI系统：

```typescript
import {
    BehaviorTreeBuilder,
    BehaviorTreeStarter,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutorMetadata,
    BehaviorTreeRuntimeComponent
} from '@esengine/behavior-tree';
import { TaskStatus, NodeType } from '@esengine/behavior-tree';
import { Core, Entity } from '@esengine/ecs-framework';

// 自定义移动执行器
@NodeExecutorMetadata({
    implementationType: 'MoveToTarget',
    nodeType: NodeType.Action,
    displayName: '移动到目标',
    category: 'Laya',
    configSchema: {
        speed: {
            type: 'number',
            default: 50,
            supportBinding: true
        }
    }
})
export class MoveToTargetAction implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const sprite = context.runtime.getBlackboardValue('layaSprite');
        const targetPos = context.runtime.getBlackboardValue('targetPosition');
        const speed = context.nodeData.config.speed;

        if (!sprite || !targetPos) {
            return TaskStatus.Failure;
        }

        const dx = targetPos.x - sprite.x;
        const dy = targetPos.y - sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 10) {
            return TaskStatus.Success;
        }

        sprite.x += (dx / distance) * speed * context.deltaTime;
        sprite.y += (dy / distance) * speed * context.deltaTime;

        return TaskStatus.Running;
    }
}

export class SimpleEnemyAI extends Laya.Script {
    public player: Laya.Sprite;

    private aiEntity: Entity;

    onEnable() {
        this.buildAI();
    }

    private buildAI() {
        const scene = Core.scene;
        if (!scene) {
            console.error('场景未初始化');
            return;
        }

        const sprite = this.owner as Laya.Sprite;

        const tree = BehaviorTreeBuilder.create('EnemyAI')
            .defineBlackboardVariable('layaSprite', sprite)
            .defineBlackboardVariable('health', 100)
            .defineBlackboardVariable('player', this.player)
            .defineBlackboardVariable('targetPosition', { x: 0, y: 0 })
            .selector('MainBehavior')
                .sequence('Attack')
                    .blackboardExists('player')
                    .log('攻击玩家', 'DoAttack')
                .end()
                .log('巡逻', 'Patrol')
            .end()
            .build();

        this.aiEntity = scene.createEntity(`AI_${sprite.name}`);
        BehaviorTreeStarter.start(this.aiEntity, tree);

        // 可以在帧更新中修改黑板
        Laya.timer.frameLoop(1, this, () => {
            const runtime = this.aiEntity?.getComponent(BehaviorTreeRuntimeComponent);
            if (runtime && this.player) {
                runtime.setBlackboardValue('targetPosition', {
                    x: this.player.x,
                    y: this.player.y
                });
            }
        });
    }

    onDisable() {
        if (this.aiEntity) {
            BehaviorTreeStarter.stop(this.aiEntity);
        }
        Laya.timer.clearAll(this);
    }
}
```


## 性能优化

### 使用冷却装饰器

对于不需要每帧更新的AI，使用冷却装饰器：

```typescript
const tree = BehaviorTreeBuilder.create('ThrottledAI')
    .cooldown(0.2, 'ThrottleRoot')  // 每0.2秒执行一次
        .selector('MainBehavior')
            // AI逻辑...
        .end()
    .end()
    .build();
```

### 限制同时运行的AI数量

```typescript
class AIManager {
    private activeAIs: Entity[] = [];
    private maxAIs: number = 20;

    addAI(entity: Entity, tree: BehaviorTreeData) {
        if (this.activeAIs.length >= this.maxAIs) {
            const furthest = this.activeAIs.shift();
            if (furthest) {
                BehaviorTreeStarter.stop(furthest);
            }
        }

        BehaviorTreeStarter.start(entity, tree);
        this.activeAIs.push(entity);
    }
}
```

## 常见问题

### 资源加载失败？

确保：
1. 资源路径正确
2. 资源已添加到项目中
3. 使用 `Laya.loader.load()` 加载

### AI不执行？

检查：
1. `onUpdate()` 是否被调用
2. `Scene.update()` 是否执行
3. 行为树是否已启动

## 下一步

- 查看[高级用法](./advanced-usage.md)
- 学习[最佳实践](./best-practices.md)
