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
    BehaviorTreeAssetSerializer,
    BehaviorTreeAssetLoader,
    BehaviorTreeStarter,
    BlackboardComponent
} from '@esengine/behavior-tree';

export class EnemyAI extends Laya.Script {
    behaviorTreePath: string = "resources/behaviors/enemy.btree";

    private aiEntity: Entity;

    onEnable() {
        this.loadBehaviorTree();
    }

    private async loadBehaviorTree() {
        // 获取Core管理的场景
        const scene = Core.scene;
        if (!scene) {
            console.error('场景未初始化');
            return;
        }

        // 加载JSON资产
        const jsonData = await Laya.loader.load(this.behaviorTreePath, Laya.Loader.JSON);

        // 转换为JSON字符串
        const jsonString = typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData);

        // 反序列化
        const asset = BehaviorTreeAssetSerializer.deserialize(jsonString);

        // 实例化
        this.aiEntity = BehaviorTreeAssetLoader.instantiate(asset, scene, {
            namePrefix: (this.owner as Laya.Sprite).name
        });

        // 设置黑板变量
        const blackboard = this.aiEntity.getComponent(BlackboardComponent);
        blackboard?.setValue('layaSprite', this.owner);
        blackboard?.setValue('position', {
            x: (this.owner as Laya.Sprite).x,
            y: (this.owner as Laya.Sprite).y
        });

        // 启动AI
        BehaviorTreeStarter.start(this.aiEntity);
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

在BehaviorTreeBuilder的action方法中，可以直接操作Laya节点。下面的完整示例展示了如何实现。

## 完整示例

创建一个完整的敌人AI系统：

```typescript
import { BehaviorTreeBuilder, BehaviorTreeStarter, BlackboardValueType, TaskStatus } from '@esengine/behavior-tree';
import { Core, Entity } from '@esengine/ecs-framework';

export class SimpleEnemyAI extends Laya.Script {
    public player: Laya.Sprite;
    public patrolPoints: Array<{x: number, y: number}> = [];

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

        this.aiEntity = BehaviorTreeBuilder.create(scene, 'EnemyAI')
            .blackboard()
                .defineVariable('sprite', BlackboardValueType.Object, sprite)
                .defineVariable('health', BlackboardValueType.Number, 100)
                .defineVariable('player', BlackboardValueType.Object, this.player)
                .defineVariable('patrolIndex', BlackboardValueType.Number, 0)
            .endBlackboard()
            .selector()
                // 攻击玩家
                .sequence()
                    .condition((e, bb) => {
                        const player = bb?.getValue('player');
                        if (!player) return false;

                        const dx = player.x - sprite.x;
                        const dy = player.y - sprite.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        return distance < 200;  // 检测范围
                    }, 'CheckPlayerInRange')
                    .action('Attack', (e, bb) => {
                        console.log('攻击玩家');
                        // 攻击逻辑
                        return TaskStatus.Success;
                    })
                .end()
                // 巡逻
                .sequence()
                    .action('Patrol', (e, bb, dt) => {
                        const index = bb?.getValue('patrolIndex') || 0;
                        const point = this.patrolPoints[index];

                        const dx = point.x - sprite.x;
                        const dy = point.y - sprite.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        if (distance < 10) {
                            // 到达路点
                            const nextIndex = (index + 1) % this.patrolPoints.length;
                            bb?.setValue('patrolIndex', nextIndex);
                            return TaskStatus.Success;
                        }

                        // 移动
                        const speed = 50;
                        sprite.x += (dx / distance) * speed * dt;
                        sprite.y += (dy / distance) * speed * dt;

                        return TaskStatus.Running;
                    })
                    .wait(2.0)
                .end()
            .end()
            .build();

        BehaviorTreeStarter.start(this.aiEntity);
    }

    onDisable() {
        // 停止AI
        if (this.aiEntity) {
            BehaviorTreeStarter.stop(this.aiEntity);
        }
    }
}
```


## 性能优化

### 使用对象池

```typescript
class AIPool {
    private pool: Entity[] = [];

    get(asset: any, scene: Scene): Entity {
        return this.pool.pop() ||
            BehaviorTreeAssetLoader.instantiate(asset, scene);
    }

    release(entity: Entity) {
        BehaviorTreeStarter.stop(entity);
        this.pool.push(entity);
    }
}
```

### 降低更新频率

```typescript
private updateInterval: number = 0.1;  // 每0.1秒更新
private timer: number = 0;

onUpdate() {
    this.timer += Laya.timer.delta / 1000;

    if (this.timer >= this.updateInterval) {
        this.scene?.update();
        this.timer = 0;
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
