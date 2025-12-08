# 资产管理

本文介绍如何加载、管理和复用行为树资产。

## 为什么需要资产管理？

在实际游戏开发中，你可能会遇到以下场景：

1. **多个实体共享同一个行为树** - 100个敌人使用同一套AI逻辑
2. **动态加载行为树** - 从JSON文件加载行为树配置
3. **子树复用** - 将常用的行为片段（如"巡逻"、"追击"）做成独立的子树
4. **运行时切换行为树** - 敌人在不同阶段使用不同的行为树

## BehaviorTreeAssetManager

框架提供了 `BehaviorTreeAssetManager` 服务来统一管理行为树资产。

### 核心概念

- **BehaviorTreeData（行为树数据）**：行为树的定义，可以被多个实体共享
- **BehaviorTreeRuntimeComponent（运行时组件）**：每个实体独立的运行时状态
- **AssetManager（资产管理器）**：统一管理所有 BehaviorTreeData

### 基本使用

```typescript
import { Core } from '@esengine/ecs-framework';
import {
    BehaviorTreeAssetManager,
    BehaviorTreeBuilder,
    BehaviorTreeStarter
} from '@esengine/behavior-tree';

// 1. 获取资产管理器（插件已自动注册）
const assetManager = Core.services.resolve(BehaviorTreeAssetManager);

// 2. 创建并注册行为树资产
const enemyAI = BehaviorTreeBuilder.create('EnemyAI')
    .defineBlackboardVariable('health', 100)
    .selector('MainBehavior')
        .log('攻击')
    .end()
    .build();

assetManager.loadAsset(enemyAI);

// 3. 为多个实体使用同一份资产
const enemy1 = scene.createEntity('Enemy1');
const enemy2 = scene.createEntity('Enemy2');
const enemy3 = scene.createEntity('Enemy3');

// 获取共享的资产
const sharedTree = assetManager.getAsset('EnemyAI');

if (sharedTree) {
    BehaviorTreeStarter.start(enemy1, sharedTree);
    BehaviorTreeStarter.start(enemy2, sharedTree);
    BehaviorTreeStarter.start(enemy3, sharedTree);
}
```

### 资产管理器 API

```typescript
// 加载资产
assetManager.loadAsset(treeData);

// 获取资产
const tree = assetManager.getAsset('TreeID');

// 检查资产是否存在
if (assetManager.hasAsset('TreeID')) {
    // ...
}

// 卸载资产
assetManager.unloadAsset('TreeID');

// 获取所有资产ID
const allIds = assetManager.getAllAssetIds();

// 清空所有资产
assetManager.clearAll();
```

## 从文件加载行为树

### JSON 格式

行为树可以导出为 JSON 格式：

```json
{
    "version": "1.0.0",
    "metadata": {
        "name": "EnemyAI",
        "description": "敌人AI行为树"
    },
    "rootNodeId": "root-1",
    "nodes": [
        {
            "id": "root-1",
            "name": "RootSelector",
            "nodeType": "Composite",
            "data": {
                "compositeType": "Selector"
            },
            "children": ["combat-1", "patrol-1"]
        },
        {
            "id": "combat-1",
            "name": "Combat",
            "nodeType": "Action",
            "data": {
                "actionType": "LogAction",
                "message": "攻击敌人"
            },
            "children": []
        }
    ],
    "blackboard": [
        {
            "name": "health",
            "type": "number",
            "defaultValue": 100
        }
    ]
}
```

### 加载 JSON 文件

```typescript
import {
    BehaviorTreeAssetSerializer,
    BehaviorTreeAssetManager
} from '@esengine/behavior-tree';

async function loadTreeFromFile(filePath: string) {
    const assetManager = Core.services.resolve(BehaviorTreeAssetManager);

    // 1. 读取文件内容
    const jsonContent = await fetch(filePath).then(res => res.text());

    // 2. 反序列化
    const treeData = BehaviorTreeAssetSerializer.deserialize(jsonContent);

    // 3. 加载到资产管理器
    assetManager.loadAsset(treeData);

    return treeData;
}

// 使用
const tree = await loadTreeFromFile('/assets/enemy-ai.btree.json');
BehaviorTreeStarter.start(entity, tree);
```

## 子树（SubTree）

子树允许你将常用的行为片段做成独立的树，然后在其他树中引用。

### 为什么使用子树？

1. **代码复用** - 避免重复定义相同的行为
2. **模块化** - 将复杂的行为树拆分成小的可管理单元
3. **团队协作** - 不同成员可以独立开发不同的子树

### 创建子树

```typescript
// 1. 创建巡逻子树
const patrolTree = BehaviorTreeBuilder.create('PatrolBehavior')
    .sequence('Patrol')
        .log('选择巡逻点', 'PickWaypoint')
        .log('移动到巡逻点', 'MoveToWaypoint')
        .wait(2.0, 'WaitAtWaypoint')
    .end()
    .build();

// 2. 创建追击子树
const chaseTree = BehaviorTreeBuilder.create('ChaseBehavior')
    .sequence('Chase')
        .log('锁定目标', 'LockTarget')
        .log('追击目标', 'ChaseTarget')
    .end()
    .build();

// 3. 注册子树到资产管理器
const assetManager = Core.services.resolve(BehaviorTreeAssetManager);
assetManager.loadAsset(patrolTree);
assetManager.loadAsset(chaseTree);
```

### 使用子树

```typescript
// 在主行为树中使用子树
const mainTree = BehaviorTreeBuilder.create('EnemyAI')
    .defineBlackboardVariable('hasTarget', false)

    .selector('MainBehavior')
        // 条件：发现目标时执行追击子树
        .sequence('CombatBranch')
            .blackboardExists('hasTarget')
            .subTree('ChaseBehavior', { shareBlackboard: true })
        .end()

        // 默认：执行巡逻子树
        .subTree('PatrolBehavior', { shareBlackboard: true })
    .end()
    .build();

assetManager.loadAsset(mainTree);

// 启动主行为树
const enemy = scene.createEntity('Enemy');
BehaviorTreeStarter.start(enemy, mainTree);
```

### SubTree 配置选项

```typescript
.subTree('SubTreeID', {
    shareBlackboard: true,  // 是否共享黑板（默认true）
})
```

- **shareBlackboard: true** - 子树和父树共享黑板变量
- **shareBlackboard: false** - 子树使用独立的黑板

## 资源预加载

在游戏启动时预加载所有行为树资产：

```typescript
class BehaviorTreePreloader {
    private assetManager: BehaviorTreeAssetManager;

    constructor() {
        this.assetManager = Core.services.resolve(BehaviorTreeAssetManager);
    }

    async preloadAll() {
        // 定义所有行为树文件
        const treeFiles = [
            '/assets/ai/enemy-ai.btree.json',
            '/assets/ai/boss-ai.btree.json',
            '/assets/ai/patrol.btree.json',
            '/assets/ai/chase.btree.json'
        ];

        // 并行加载所有文件
        const loadPromises = treeFiles.map(file => this.loadTree(file));
        await Promise.all(loadPromises);

        console.log(`已加载 ${this.assetManager.getAssetCount()} 个行为树资产`);
    }

    private async loadTree(filePath: string) {
        const jsonContent = await fetch(filePath).then(res => res.text());
        const treeData = BehaviorTreeAssetSerializer.deserialize(jsonContent);
        this.assetManager.loadAsset(treeData);
    }
}

// 游戏启动时调用
const preloader = new BehaviorTreePreloader();
await preloader.preloadAll();
```

## 运行时切换行为树

敌人在不同阶段使用不同的行为树：

```typescript
class EnemyAI {
    private entity: Entity;
    private assetManager: BehaviorTreeAssetManager;

    constructor(entity: Entity) {
        this.entity = entity;
        this.assetManager = Core.services.resolve(BehaviorTreeAssetManager);
    }

    // 切换到巡逻AI
    switchToPatrol() {
        const tree = this.assetManager.getAsset('PatrolAI');
        if (tree) {
            BehaviorTreeStarter.stop(this.entity);
            BehaviorTreeStarter.start(this.entity, tree);
        }
    }

    // 切换到战斗AI
    switchToCombat() {
        const tree = this.assetManager.getAsset('CombatAI');
        if (tree) {
            BehaviorTreeStarter.stop(this.entity);
            BehaviorTreeStarter.start(this.entity, tree);
        }
    }

    // 切换到狂暴模式
    switchToBerserk() {
        const tree = this.assetManager.getAsset('BerserkAI');
        if (tree) {
            BehaviorTreeStarter.stop(this.entity);
            BehaviorTreeStarter.start(this.entity, tree);
        }
    }
}

// 使用
const enemyAI = new EnemyAI(enemyEntity);

// Boss血量低于30%时进入狂暴
const runtime = enemyEntity.getComponent(BehaviorTreeRuntimeComponent);
const health = runtime?.getBlackboardValue<number>('health');

if (health && health < 30) {
    enemyAI.switchToBerserk();
}
```

## 内存优化

### 1. 共享行为树数据

```typescript
// 好的做法：100个敌人共享1份BehaviorTreeData
const sharedTree = assetManager.getAsset('EnemyAI');

for (let i = 0; i < 100; i++) {
    const enemy = scene.createEntity(`Enemy${i}`);
    BehaviorTreeStarter.start(enemy, sharedTree!);  // 共享数据
}

// 不好的做法：每个敌人创建独立的BehaviorTreeData
for (let i = 0; i < 100; i++) {
    const enemy = scene.createEntity(`Enemy${i}`);
    const tree = BehaviorTreeBuilder.create('EnemyAI')  // 重复创建
        // ... 节点定义
        .build();
    BehaviorTreeStarter.start(enemy, tree);
}
```

### 2. 及时卸载不用的资产

```typescript
// 关卡结束时卸载该关卡的AI
function onLevelEnd() {
    assetManager.unloadAsset('Level1BossAI');
    assetManager.unloadAsset('Level1EnemyAI');
}

// 加载新关卡的AI
function onLevelStart() {
    const boss2AI = await loadTreeFromFile('/assets/level2-boss.btree.json');
    assetManager.loadAsset(boss2AI);
}
```

## 完整示例：多敌人类型的游戏

```typescript
import { Core, Scene } from '@esengine/ecs-framework';
import {
    BehaviorTreePlugin,
    BehaviorTreeAssetManager,
    BehaviorTreeBuilder,
    BehaviorTreeStarter
} from '@esengine/behavior-tree';

async function setupGame() {
    // 1. 初始化
    Core.create();
    const plugin = new BehaviorTreePlugin();
    await Core.installPlugin(plugin);

    const scene = new Scene();
    plugin.setupScene(scene);
    Core.setScene(scene);

    const assetManager = Core.services.resolve(BehaviorTreeAssetManager);

    // 2. 创建共享的子树
    const patrolTree = BehaviorTreeBuilder.create('Patrol')
        .sequence('PatrolLoop')
            .log('巡逻')
            .wait(1.0)
        .end()
        .build();

    const combatTree = BehaviorTreeBuilder.create('Combat')
        .sequence('CombatLoop')
            .log('战斗')
        .end()
        .build();

    assetManager.loadAsset(patrolTree);
    assetManager.loadAsset(combatTree);

    // 3. 创建不同类型敌人的AI
    const meleeEnemyAI = BehaviorTreeBuilder.create('MeleeEnemyAI')
        .selector('MeleeBehavior')
            .sequence('Attack')
                .blackboardExists('target')
                .log('近战攻击')
            .end()
            .subTree('Patrol')
        .end()
        .build();

    const rangedEnemyAI = BehaviorTreeBuilder.create('RangedEnemyAI')
        .selector('RangedBehavior')
            .sequence('Attack')
                .blackboardExists('target')
                .log('远程攻击')
            .end()
            .subTree('Patrol')
        .end()
        .build();

    assetManager.loadAsset(meleeEnemyAI);
    assetManager.loadAsset(rangedEnemyAI);

    // 4. 创建多个敌人实体
    // 10个近战敌人共享同一份AI
    const meleeAI = assetManager.getAsset('MeleeEnemyAI')!;
    for (let i = 0; i < 10; i++) {
        const enemy = scene.createEntity(`MeleeEnemy${i}`);
        BehaviorTreeStarter.start(enemy, meleeAI);
    }

    // 5个远程敌人共享同一份AI
    const rangedAI = assetManager.getAsset('RangedEnemyAI')!;
    for (let i = 0; i < 5; i++) {
        const enemy = scene.createEntity(`RangedEnemy${i}`);
        BehaviorTreeStarter.start(enemy, rangedAI);
    }

    console.log(`已创建 15 个敌人，使用 ${assetManager.getAssetCount()} 个行为树资产`);

    // 5. 游戏循环
    setInterval(() => {
        Core.update(0.016);
    }, 16);
}

setupGame();
```

## 常见问题

### 如何检查资产是否已加载？

```typescript
const assetManager = Core.services.resolve(BehaviorTreeAssetManager);

if (!assetManager.hasAsset('EnemyAI')) {
    // 加载资产
    const tree = await loadTreeFromFile('/assets/enemy-ai.btree.json');
    assetManager.loadAsset(tree);
}
```

### 子树找不到怎么办？

确保子树已经加载到资产管理器中：

```typescript
// 1. 先加载子树
const subTree = BehaviorTreeBuilder.create('SubTreeID')
    // ...
    .build();
assetManager.loadAsset(subTree);

// 2. 再加载使用子树的主树
const mainTree = BehaviorTreeBuilder.create('MainTree')
    .subTree('SubTreeID')
    .build();
```

### 如何导出行为树为 JSON？

```typescript
import { BehaviorTreeAssetSerializer } from '@esengine/behavior-tree';

const tree = BehaviorTreeBuilder.create('MyTree')
    // ... 节点定义
    .build();

// 序列化为JSON字符串
const json = BehaviorTreeAssetSerializer.serialize(tree);

// 保存到文件或发送到服务器
console.log(json);
```

## 下一步

- 学习[Cocos Creator 集成](./cocos-integration.md)了解如何在游戏引擎中加载资源
- 查看[自定义节点执行器](./custom-actions.md)创建自定义行为
- 阅读[最佳实践](./best-practices.md)优化你的行为树设计
