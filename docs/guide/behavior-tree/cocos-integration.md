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
    BehaviorTreeBuilder,
    BehaviorTreeStarter,
    BehaviorTreeRuntimeComponent
} from '@esengine/behavior-tree';

const { ccclass, property } = _decorator;

@ccclass('EnemyAIComponent')
export class EnemyAIComponent extends Component {
    private aiEntity: Entity | null = null;

    async start() {
        // 创建行为树
        await this.createBehaviorTree();
    }

    private async createBehaviorTree() {
        try {
            // 获取Core管理的场景
            const scene = Core.scene;
            if (!scene) {
                console.error('场景未初始化');
                return;
            }

            // 使用Builder API创建行为树
            const tree = BehaviorTreeBuilder.create('EnemyAI')
                .defineBlackboardVariable('cocosNode', this.node)
                .defineBlackboardVariable('health', 100)
                .defineBlackboardVariable('playerNode', null)
                .defineBlackboardVariable('detectionRange', 10)
                .defineBlackboardVariable('attackRange', 2)
                .selector('MainBehavior')
                    .sequence('Combat')
                        .blackboardExists('playerNode')
                        .blackboardCompare('health', 30, 'greater')
                        .log('攻击玩家', 'AttackPlayer')
                    .end()
                    .sequence('Flee')
                        .blackboardCompare('health', 30, 'lessOrEqual')
                        .log('逃跑', 'RunAway')
                    .end()
                    .log('巡逻', 'Patrol')
                .end()
                .build();

            // 创建AI实体并启动
            this.aiEntity = scene.createEntity(`AI_${this.node.name}`);
            BehaviorTreeStarter.start(this.aiEntity, tree);

            console.log('敌人 AI 已启动');
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

### 创建自定义执行器

要实现与Cocos节点的交互，需要创建自定义执行器：

```typescript
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutorMetadata
} from '@esengine/behavior-tree';
import { TaskStatus, NodeType } from '@esengine/behavior-tree';
import { Animation } from 'cc';

@NodeExecutorMetadata({
    implementationType: 'PlayAnimation',
    nodeType: NodeType.Action,
    displayName: '播放动画',
    description: '播放Cocos节点上的动画',
    category: 'Cocos',
    configSchema: {
        animationName: {
            type: 'string',
            default: 'attack'
        }
    }
})
export class PlayAnimationAction implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const cocosNode = context.runtime.getBlackboardValue('cocosNode');
        const animationName = context.nodeData.config.animationName;

        if (!cocosNode) {
            return TaskStatus.Failure;
        }

        const animation = cocosNode.getComponent(Animation);
        if (animation) {
            animation.play(animationName);
            return TaskStatus.Success;
        }

        return TaskStatus.Failure;
    }
}
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
import { BehaviorTreeRuntimeComponent } from '@esengine/behavior-tree';

const { ccclass, property } = _decorator;

@ccclass('PlayerDetector')
export class PlayerDetector extends Component {
    @property(Node)
    player: Node = null;

    @property
    detectionRange: number = 10;

    private runtime: BehaviorTreeRuntimeComponent | null = null;

    start() {
        // 假设AI组件在同一节点上
        const aiComponent = this.node.getComponent('EnemyAIComponent') as any;
        if (aiComponent && aiComponent.aiEntity) {
            this.runtime = aiComponent.aiEntity.getComponent(BehaviorTreeRuntimeComponent);
        }
    }

    update(deltaTime: number) {
        if (!this.runtime || !this.player) {
            return;
        }

        // 计算距离
        const distance = Vec3.distance(this.node.position, this.player.position);

        // 更新黑板
        this.runtime.setBlackboardValue('playerNode', this.player);
        this.runtime.setBlackboardValue('playerInRange', distance <= this.detectionRange);
        this.runtime.setBlackboardValue('distanceToPlayer', distance);
    }
}
```


## 资源管理

### 使用 BehaviorTreeAssetManager

框架提供了 `BehaviorTreeAssetManager` 来统一管理行为树资产，避免重复创建：

```typescript
import { Core } from '@esengine/ecs-framework';
import {
    BehaviorTreeAssetManager,
    BehaviorTreeBuilder,
    BehaviorTreeStarter
} from '@esengine/behavior-tree';

// 获取资产管理器（插件已自动注册）
const assetManager = Core.services.resolve(BehaviorTreeAssetManager);

// 创建并注册行为树（只创建一次）
const enemyAI = BehaviorTreeBuilder.create('EnemyAI')
    .defineBlackboardVariable('health', 100)
    .selector('MainBehavior')
        .log('攻击')
    .end()
    .build();

assetManager.loadAsset(enemyAI);

// 为多个敌人实体使用同一份资产
for (let i = 0; i < 10; i++) {
    const enemy = scene.createEntity(`Enemy${i}`);
    const tree = assetManager.getAsset('EnemyAI')!;
    BehaviorTreeStarter.start(enemy, tree);  // 10个敌人共享1份数据
}
```

### 从 Cocos Creator 资源加载

#### 1. 将行为树 JSON 放入 resources 目录

```
assets/
└── resources/
    └── behaviors/
        ├── enemy-ai.btree.json
        └── boss-ai.btree.json
```

#### 2. 创建资源加载器

创建 `assets/scripts/BehaviorTreeLoader.ts`：

```typescript
import { resources, JsonAsset } from 'cc';
import { Core } from '@esengine/ecs-framework';
import {
    BehaviorTreeAssetManager,
    BehaviorTreeAssetSerializer,
    BehaviorTreeData
} from '@esengine/behavior-tree';

export class BehaviorTreeLoader {
    private assetManager: BehaviorTreeAssetManager;

    constructor() {
        this.assetManager = Core.services.resolve(BehaviorTreeAssetManager);
    }

    /**
     * 从 resources 目录加载行为树
     * @param path 相对于 resources 的路径，不带扩展名
     * @example await loader.load('behaviors/enemy-ai')
     */
    async load(path: string): Promise<BehaviorTreeData | null> {
        return new Promise((resolve, reject) => {
            resources.load(path, JsonAsset, (err, jsonAsset) => {
                if (err) {
                    console.error(`加载行为树失败: ${path}`, err);
                    reject(err);
                    return;
                }

                try {
                    // 反序列化 JSON 为 BehaviorTreeData
                    const jsonStr = JSON.stringify(jsonAsset.json);
                    const treeData = BehaviorTreeAssetSerializer.deserialize(jsonStr);

                    // 加载到资产管理器
                    this.assetManager.loadAsset(treeData);

                    console.log(`行为树已加载: ${treeData.name}`);
                    resolve(treeData);
                } catch (error) {
                    console.error(`解析行为树失败: ${path}`, error);
                    reject(error);
                }
            });
        });
    }

    /**
     * 预加载所有行为树
     */
    async preloadAll(paths: string[]): Promise<void> {
        const promises = paths.map(path => this.load(path));
        await Promise.all(promises);
        console.log(`已预加载 ${paths.length} 个行为树`);
    }
}
```

#### 3. 在游戏启动时预加载

修改 `Main.ts`：

```typescript
import { _decorator, Component } from 'cc';
import { Core, Scene } from '@esengine/ecs-framework';
import { BehaviorTreePlugin } from '@esengine/behavior-tree';
import { BehaviorTreeLoader } from './BehaviorTreeLoader';

const { ccclass } = _decorator;

@ccclass('Main')
export class Main extends Component {
    private loader: BehaviorTreeLoader | null = null;

    async onLoad() {
        // 初始化 ECS Core
        Core.create();

        // 安装行为树插件
        const behaviorTreePlugin = new BehaviorTreePlugin();
        await Core.installPlugin(behaviorTreePlugin);

        // 创建场景
        const scene = new Scene();
        behaviorTreePlugin.setupScene(scene);
        Core.setScene(scene);

        // 创建加载器并预加载所有行为树
        this.loader = new BehaviorTreeLoader();
        await this.loader.preloadAll([
            'behaviors/enemy-ai',
            'behaviors/boss-ai',
            'behaviors/patrol',  // 子树
            'behaviors/chase'    // 子树
        ]);

        console.log('游戏初始化完成');
    }

    update(deltaTime: number) {
        Core.update(deltaTime);
    }

    onDestroy() {
        Core.destroy();
    }
}
```

#### 4. 在敌人组件中使用

```typescript
import { _decorator, Component } from 'cc';
import { Core, Entity } from '@esengine/ecs-framework';
import {
    BehaviorTreeAssetManager,
    BehaviorTreeStarter
} from '@esengine/behavior-tree';

const { ccclass, property } = _decorator;

@ccclass('EnemyAIComponent')
export class EnemyAIComponent extends Component {
    @property
    aiType: string = 'enemy-ai';  // 在编辑器中配置使用哪个AI

    private aiEntity: Entity | null = null;

    start() {
        const scene = Core.scene;
        if (!scene) return;

        // 从资产管理器获取已加载的行为树
        const assetManager = Core.services.resolve(BehaviorTreeAssetManager);
        const tree = assetManager.getAsset(this.aiType);

        if (tree) {
            this.aiEntity = scene.createEntity(`AI_${this.node.name}`);
            BehaviorTreeStarter.start(this.aiEntity, tree);

            // 设置黑板变量
            const runtime = this.aiEntity.getComponent(BehaviorTreeRuntimeComponent);
            runtime?.setBlackboardValue('cocosNode', this.node);
        } else {
            console.error(`找不到行为树资产: ${this.aiType}`);
        }
    }

    onDestroy() {
        if (this.aiEntity) {
            BehaviorTreeStarter.stop(this.aiEntity);
        }
    }
}
```

## 调试

### 可视化调试信息

创建调试组件显示 AI 状态：

```typescript
import { _decorator, Component, Label } from 'cc';
import { BehaviorTreeRuntimeComponent } from '@esengine/behavior-tree';

const { ccclass, property } = _decorator;

@ccclass('AIDebugger')
export class AIDebugger extends Component {
    @property(Label)
    debugLabel: Label = null;

    private runtime: BehaviorTreeRuntimeComponent | null = null;

    start() {
        const aiComponent = this.node.getComponent('EnemyAIComponent') as any;
        if (aiComponent && aiComponent.aiEntity) {
            this.runtime = aiComponent.aiEntity.getComponent(BehaviorTreeRuntimeComponent);
        }
    }

    update() {
        if (!this.runtime || !this.debugLabel) {
            return;
        }

        const health = this.runtime.getBlackboardValue('health');
        const playerNode = this.runtime.getBlackboardValue('playerNode');

        this.debugLabel.string = `Health: ${health}\nHas Target: ${playerNode ? 'Yes' : 'No'}`;
    }
}
```


## 性能优化

### 1. 限制行为树数量

合理控制同时运行的行为树数量：

```typescript
class AIManager {
    private activeAIs: Entity[] = [];
    private maxAIs: number = 20;

    addAI(entity: Entity, tree: BehaviorTreeData) {
        if (this.activeAIs.length >= this.maxAIs) {
            // 移除最远的AI
            const furthest = this.findFurthestAI();
            if (furthest) {
                BehaviorTreeStarter.stop(furthest);
                this.activeAIs = this.activeAIs.filter(e => e !== furthest);
            }
        }

        BehaviorTreeStarter.start(entity, tree);
        this.activeAIs.push(entity);
    }

    removeAI(entity: Entity) {
        BehaviorTreeStarter.stop(entity);
        this.activeAIs = this.activeAIs.filter(e => e !== entity);
    }

    private findFurthestAI(): Entity | null {
        // 根据距离找到最远的AI
        // 实现细节略
        return this.activeAIs[0];
    }
}
```

### 2. 使用冷却装饰器

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

### 3. 缓存计算结果

在自定义执行器中缓存昂贵的计算：

```typescript
export class CachedFindTarget implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { state, runtime, totalTime } = context;
        const cacheTime = state.lastFindTime || 0;

        if (totalTime - cacheTime < 1.0) {
            const cached = runtime.getBlackboardValue('target');
            return cached ? TaskStatus.Success : TaskStatus.Failure;
        }

        const target = findNearestTarget();
        runtime.setBlackboardValue('target', target);
        state.lastFindTime = totalTime;

        return target ? TaskStatus.Success : TaskStatus.Failure;
    }
}
```

## 多平台注意事项

### 性能考虑

不同平台的性能差异：

- **Web平台**: 受浏览器性能限制，建议减少同时运行的AI数量
- **原生平台**: 性能较好，可以运行更多AI
- **小游戏平台**: 内存受限，注意控制行为树数量和复杂度

### 平台适配

```typescript
import { sys } from 'cc';

// 根据平台调整AI数量
const maxAIs = sys.isNative ? 50 : (sys.isBrowser ? 20 : 30);

// 根据平台调整更新频率
const updateInterval = sys.isNative ? 0.016 : 0.05;
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
3. 使用 `BehaviorTreeRuntimeComponent.getBlackboardValue()` 和 `setBlackboardValue()` 方法

## 下一步

- 查看[资产管理](./asset-management.md)了解如何加载和管理行为树资产、使用子树
- 学习[高级用法](./advanced-usage.md)了解性能优化和调试技巧
- 阅读[最佳实践](./best-practices.md)优化你的 AI
- 学习[自定义节点执行器](./custom-actions.md)创建自定义行为
