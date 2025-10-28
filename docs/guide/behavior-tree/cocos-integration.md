# Cocos Creator 集成

本教程将引导你在 Cocos Creator 项目中集成和使用行为树系统。

## 前置要求

- Cocos Creator 3.x 或更高版本
- 基本的 TypeScript 知识
- 已完成[快速开始](./getting-started.md)教程

## 安装

### 步骤1：安装依赖

在你的 Cocos Creator 项目根目录下：

```bash
npm install @esengine/ecs-framework @esengine/behavior-tree
```

### 步骤2：配置 tsconfig.json

确保 `tsconfig.json` 中包含以下配置：

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "moduleResolution": "node"
  }
}
```

## 项目结构

建议的项目结构：

```
assets/
├── scripts/
│   ├── ai/
│   │   ├── EnemyAIComponent.ts      # AI 组件
│   │   └── PlayerDetector.ts         # 检测器
│   ├── systems/
│   │   └── BehaviorTreeSystem.ts     # 行为树系统
│   └── Main.ts                        # 主入口
├── resources/
│   └── behaviors/
│       ├── enemy-ai.btree.json        # 行为树资产
│       └── patrol.btree.json          # 子树资产
└── types/
    └── enemy-ai.ts                    # 类型定义
```


## 初始化 ECS 和行为树

### 创建主入口组件

创建 `assets/scripts/Main.ts`：

```typescript
import { _decorator, Component } from 'cc';
import { Core, Scene } from '@esengine/ecs-framework';
import { BehaviorTreePlugin } from '@esengine/behavior-tree';

const { ccclass } = _decorator;

@ccclass('Main')
export class Main extends Component {
    async onLoad() {
        // 初始化 ECS Core
        Core.create();

        // 安装行为树插件
        const behaviorTreePlugin = new BehaviorTreePlugin();
        await Core.installPlugin(behaviorTreePlugin);

        // 创建并设置场景
        const scene = new Scene();
        behaviorTreePlugin.setupScene(scene);
        Core.setScene(scene);

        console.log('ECS 和行为树系统初始化完成');
    }

    update(deltaTime: number) {
        // 更新 ECS（会自动更新场景）
        Core.update(deltaTime);
    }

    onDestroy() {
        // 清理资源
        Core.destroy();
    }
}
```


### 添加组件到场景

1. 在场景中创建一个空节点（命名为 `GameManager`）
2. 添加 `Main` 组件到该节点


## 创建 AI 组件

创建 `assets/scripts/ai/EnemyAIComponent.ts`：

```typescript
import { _decorator, Component, Node } from 'cc';
import { Core, Entity } from '@esengine/ecs-framework';
import {
    BehaviorTreeAssetSerializer,
    BehaviorTreeAssetLoader,
    BehaviorTreeStarter,
    BlackboardComponent
} from '@esengine/behavior-tree';
import { resources } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('EnemyAIComponent')
export class EnemyAIComponent extends Component {
    @property
    behaviorTreeAsset: string = 'behaviors/enemy-ai.btree';

    private aiEntity: Entity | null = null;

    async start() {
        // 加载行为树资产
        await this.loadBehaviorTree();
    }

    private async loadBehaviorTree() {
        try {
            // 获取Core管理的场景
            const scene = Core.scene;
            if (!scene) {
                console.error('场景未初始化');
                return;
            }

            // 从 resources 加载JSON资产
            resources.load(this.behaviorTreeAsset, (err, jsonAsset: any) => {
                if (err) {
                    console.error('加载行为树失败:', err);
                    return;
                }

                // 获取JSON字符串
                const jsonString = jsonAsset.json ? JSON.stringify(jsonAsset.json) : jsonAsset.text;

                // 反序列化
                const btAsset = BehaviorTreeAssetSerializer.deserialize(jsonString);

                // 实例化
                this.aiEntity = BehaviorTreeAssetLoader.instantiate(
                    btAsset,
                    scene,
                    {
                        namePrefix: this.node.name
                    }
                );

                // 设置黑板初始值
                const blackboard = this.aiEntity.getComponent(BlackboardComponent);
                if (blackboard) {
                    // 可以在这里设置引用到 Cocos 节点
                    blackboard.setValue('cocosNode', this.node);
                    blackboard.setValue('position', this.node.position.clone());
                }

                // 启动 AI
                BehaviorTreeStarter.start(this.aiEntity);

                console.log('敌人 AI 已启动');
            });
        } catch (error) {
            console.error('初始化行为树失败:', error);
        }
    }

    onDestroy() {
        // 停止 AI
        if (this.aiEntity) {
            BehaviorTreeStarter.stop(this.aiEntity);
        }
    }
}
```


## 与 Cocos 节点交互

### 在编辑器ExecuteAction节点中编写代码

在行为树编辑器中，可以使用 `Execute Action` 节点，并编写代码：

```javascript
// 获取 Cocos 节点
const cocosNode = blackboard.getValue('cocosNode');

// 播放攻击动画
const animation = cocosNode.getComponent('Animation');
animation.play('attack');

return TaskStatus.Success;
```


## 完整示例：敌人 AI

### 行为树设计

使用编辑器创建 `enemy-ai.btree.json`：

```
RootSelector
├── CombatSequence
│   ├── CheckPlayerInRange (Condition)
│   ├── CheckHealthGood (Condition)
│   └── AttackPlayer (Action)
├── FleeSequence
│   ├── CheckHealthLow (Condition)
│   └── RunAway (Action)
└── PatrolSequence
    ├── PickWaypoint (Action)
    ├── MoveToWaypoint (Action)
    └── Wait (Action)
```


### 黑板变量

定义以下黑板变量：

- `cocosNode`：Node - Cocos 节点引用
- `health`：Number - 生命值
- `playerNode`：Object - 玩家节点引用
- `detectionRange`：Number - 检测范围
- `attackRange`：Number - 攻击范围
- `currentWaypoint`：Number - 当前路点索引


### 实现检测系统

创建 `assets/scripts/ai/PlayerDetector.ts`：

```typescript
import { _decorator, Component, Node, Vec3 } from 'cc';
import { BlackboardComponent } from '@esengine/behavior-tree';

const { ccclass, property } = _decorator;

@ccclass('PlayerDetector')
export class PlayerDetector extends Component {
    @property(Node)
    player: Node = null;

    @property
    detectionRange: number = 10;

    private blackboard: BlackboardComponent | null = null;

    start() {
        // 假设AI组件在同一节点上
        const aiComponent = this.node.getComponent('EnemyAIComponent') as any;
        if (aiComponent && aiComponent.aiEntity) {
            this.blackboard = aiComponent.aiEntity.getComponent(BlackboardComponent);
        }
    }

    update(deltaTime: number) {
        if (!this.blackboard || !this.player) {
            return;
        }

        // 计算距离
        const distance = Vec3.distance(this.node.position, this.player.position);

        // 更新黑板
        this.blackboard.setValue('playerNode', this.player);
        this.blackboard.setValue('playerInRange', distance <= this.detectionRange);
        this.blackboard.setValue('distanceToPlayer', distance);
    }
}
```


## 资源管理

### 预加载行为树资产

在游戏启动时预加载所有行为树资产：

```typescript
import { resources } from 'cc';

async function preloadBehaviorTrees() {
    const assets = [
        'behaviors/enemy-ai',
        'behaviors/boss-ai',
        'behaviors/patrol'
    ];

    for (const path of assets) {
        await new Promise((resolve, reject) => {
            resources.preload(path, (err) => {
                if (err) reject(err);
                else resolve(null);
            });
        });
    }

    console.log('行为树资产预加载完成');
}
```

### 使用 AssetManager

对于动态加载，可以使用 Cocos 的 AssetManager：

```typescript
import { assetManager } from 'cc';

assetManager.loadBundle('behaviors', (err, bundle) => {
    if (err) {
        console.error('加载 bundle 失败:', err);
        return;
    }

    bundle.load('enemy-ai', (err, asset) => {
        if (!err) {
            // 使用资产
        }
    });
});
```

## 调试

### 可视化调试信息

创建调试组件显示 AI 状态：

```typescript
import { _decorator, Component, Label } from 'cc';
import { BlackboardComponent } from '@esengine/behavior-tree';

const { ccclass, property } = _decorator;

@ccclass('AIDebugger')
export class AIDebugger extends Component {
    @property(Label)
    debugLabel: Label = null;

    private blackboard: BlackboardComponent | null = null;

    start() {
        const aiComponent = this.node.getComponent('EnemyAIComponent') as any;
        if (aiComponent && aiComponent.aiEntity) {
            this.blackboard = aiComponent.aiEntity.getComponent(BlackboardComponent);
        }
    }

    update() {
        if (!this.blackboard || !this.debugLabel) {
            return;
        }

        const health = this.blackboard.getValue('health');
        const state = this.blackboard.getValue('currentState');

        this.debugLabel.string = `Health: ${health}\nState: ${state}`;
    }
}
```


## 性能优化

### 1. 使用对象池

为 AI 实体使用对象池：

```typescript
class AIEntityPool {
    private pool: Entity[] = [];
    private scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    acquire(behaviorTreeAsset: any): Entity {
        if (this.pool.length > 0) {
            const entity = this.pool.pop()!;
            BehaviorTreeStarter.restart(entity);
            return entity;
        }

        return BehaviorTreeAssetLoader.instantiate(behaviorTreeAsset, this.scene);
    }

    release(entity: Entity) {
        BehaviorTreeStarter.stop(entity);
        this.pool.push(entity);
    }
}
```

### 2. 限制更新频率

对于远离相机的敌人，可以在行为树内部使用节流机制：

```typescript
// 在行为树的Action节点中实现节流
function throttledAction(entity, blackboard, deltaTime) {
    let lastUpdate = blackboard?.getValue('lastUpdateTime') || 0;
    const currentTime = Date.now();

    // 根据距离决定更新间隔
    const distance = getDistanceToCamera();
    const updateInterval = distance < 10 ? 0 : 200;  // 远处敌人200ms更新一次

    if (currentTime - lastUpdate < updateInterval) {
        return TaskStatus.Running;
    }

    blackboard?.setValue('lastUpdateTime', currentTime);

    // 执行实际逻辑
    performAILogic();
    return TaskStatus.Success;
}
```

### 3. 使用二进制格式

在构建时将 JSON 转换为二进制格式以减小包体：

```bash
# 在构建脚本中
node scripts/convert-bt-to-binary.js
```

## 多平台发布

### Web 平台

在 Web 平台，确保资源路径正确：

```typescript
// 使用相对路径
const assetPath = 'behaviors/enemy-ai';
```

### 原生平台

原生平台可以使用二进制格式以获得更好的性能：

```typescript
// 检测平台
if (sys.isNative) {
    // 加载二进制格式
    assetPath = 'behaviors/enemy-ai.btree.bin';
} else {
    // 加载 JSON 格式
    assetPath = 'behaviors/enemy-ai.btree.json';
}
```

## 常见问题

### 行为树无法加载？

检查：
1. 资源路径是否正确（相对于 `resources` 目录）
2. 文件是否已添加到项目中
3. 检查控制台错误信息

### AI 不执行？

确保：
1. `Main` 组件的 `update` 方法被调用
2. `Scene.update()` 在每帧被调用
3. 行为树已通过 `BehaviorTreeStarter.start()` 启动

### 黑板变量不更新？

检查：
1. 变量名拼写是否正确
2. 是否在正确的时机更新变量
3. 使用 `BlackboardComponent.getValue()` 和 `setValue()` 方法

## 下一步

- 查看[高级用法](./advanced-usage.md)了解子树和异步加载
- 学习[最佳实践](./best-practices.md)优化你的 AI
