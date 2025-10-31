# Node.js 服务端使用

本文介绍如何在 Node.js 服务端环境（如游戏服务器、机器人、自动化工具）中使用行为树系统。

## 使用场景

行为树不仅适用于游戏客户端AI，在服务端也有广泛应用：

1. **游戏服务器** - NPC AI逻辑、副本关卡脚本
2. **聊天机器人** - 对话流程控制、智能回复
3. **自动化测试** - 测试用例执行流程
4. **工作流引擎** - 业务流程自动化
5. **爬虫系统** - 数据采集流程控制

## 基础设置

### 安装

```bash
npm install @esengine/ecs-framework @esengine/behavior-tree
```

### TypeScript 配置

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

## 快速开始

### 简单的游戏服务器 NPC

```typescript
import { Core, Scene } from '@esengine/ecs-framework';
import {
    BehaviorTreePlugin,
    BehaviorTreeBuilder,
    BehaviorTreeStarter,
    BehaviorTreeRuntimeComponent
} from '@esengine/behavior-tree';

async function startServer() {
    // 1. 初始化 ECS Core
    Core.create();

    // 2. 安装行为树插件
    const plugin = new BehaviorTreePlugin();
    await Core.installPlugin(plugin);

    // 3. 创建场景
    const scene = new Scene();
    plugin.setupScene(scene);
    Core.setScene(scene);

    // 4. 创建 NPC 行为树
    const npcAI = BehaviorTreeBuilder.create('MerchantNPC')
        .defineBlackboardVariable('mood', 'friendly')
        .defineBlackboardVariable('goldAmount', 1000)

        .selector('NPCBehavior')
            // 如果玩家触发对话
            .sequence('Dialogue')
                .blackboardExists('playerRequest')
                .log('NPC: 欢迎光临！')
            .end()

            // 默认行为：闲置
            .sequence('Idle')
                .log('NPC: 正在整理商品...')
                .wait(5.0)
            .end()
        .end()
        .build();

    // 5. 创建 NPC 实体
    const npc = scene.createEntity('Merchant');
    BehaviorTreeStarter.start(npc, npcAI);

    // 6. 启动游戏循环（20 TPS）
    setInterval(() => {
        Core.update(0.05);  // 50ms = 1/20秒
    }, 50);

    // 7. 模拟玩家交互
    setTimeout(() => {
        const runtime = npc.getComponent(BehaviorTreeRuntimeComponent);
        runtime?.setBlackboardValue('playerRequest', 'buy_sword');
        console.log('玩家发起交易请求');
    }, 3000);

    console.log('游戏服务器已启动');
}

startServer();
```

## 实战示例：聊天机器人

创建一个基于行为树的智能聊天机器人：

```typescript
import { Core, Scene, Entity } from '@esengine/ecs-framework';
import {
    BehaviorTreePlugin,
    BehaviorTreeBuilder,
    BehaviorTreeStarter,
    BehaviorTreeRuntimeComponent,
    INodeExecutor,
    NodeExecutionContext,
    TaskStatus,
    NodeType,
    NodeExecutorMetadata
} from '@esengine/behavior-tree';

// 1. 创建自定义节点：回复消息
@NodeExecutorMetadata({
    implementationType: 'SendMessage',
    nodeType: NodeType.Action,
    displayName: '发送消息',
    configSchema: {
        message: { type: 'string', default: '' }
    }
})
class SendMessageAction implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const message = context.nodeData.config['message'] as string;
        const userMessage = context.runtime.getBlackboardValue<string>('userMessage');

        console.log(`[机器人回复]: ${message}`);
        console.log(`   回复给: ${userMessage}`);

        return TaskStatus.Success;
    }
}

// 2. 创建自定义节点：匹配关键词
@NodeExecutorMetadata({
    implementationType: 'MatchKeyword',
    nodeType: NodeType.Condition,
    displayName: '匹配关键词',
    configSchema: {
        keyword: { type: 'string', default: '' }
    }
})
class MatchKeywordCondition implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const keyword = context.nodeData.config['keyword'] as string;
        const userMessage = context.runtime.getBlackboardValue<string>('userMessage') || '';

        return userMessage.includes(keyword) ? TaskStatus.Success : TaskStatus.Failure;
    }
}

// 3. 创建聊天机器人类
class ChatBot {
    private botEntity: Entity;
    private runtime: BehaviorTreeRuntimeComponent | null = null;

    constructor(scene: Scene) {
        // 创建机器人行为树
        const botBehavior = BehaviorTreeBuilder.create('ChatBotAI')
            .defineBlackboardVariable('userMessage', '')
            .defineBlackboardVariable('userName', 'Guest')

            .selector('ResponseSelector')
                // 问候语
                .sequence('Greeting')
                    .executeCondition('MatchKeyword', { keyword: '你好' })
                    .executeAction('SendMessage', { message: '你好！我是智能助手，有什么可以帮你的吗？' })
                .end()

                // 帮助请求
                .sequence('Help')
                    .executeCondition('MatchKeyword', { keyword: '帮助' })
                    .executeAction('SendMessage', { message: '我可以帮你回答问题、查询信息。试试问我一些问题吧！' })
                .end()

                // 查询天气
                .sequence('Weather')
                    .executeCondition('MatchKeyword', { keyword: '天气' })
                    .executeAction('SendMessage', { message: '今天天气不错，晴天，温度适宜。' })
                .end()

                // 查询时间
                .sequence('Time')
                    .executeCondition('MatchKeyword', { keyword: '时间' })
                    .executeAction('SendMessage', { message: `现在时间是 ${new Date().toLocaleString()}` })
                .end()

                // 默认回复
                .executeAction('SendMessage', { message: '抱歉，我还不太理解你的意思。可以换个方式问我吗？' })
            .end()
            .build();

        // 创建实体并启动
        this.botEntity = scene.createEntity('ChatBot');
        BehaviorTreeStarter.start(this.botEntity, botBehavior);
        this.runtime = this.botEntity.getComponent(BehaviorTreeRuntimeComponent);
    }

    // 处理用户消息
    async handleMessage(userName: string, message: string) {
        if (this.runtime) {
            this.runtime.setBlackboardValue('userName', userName);
            this.runtime.setBlackboardValue('userMessage', message);
        }

        // 等待一帧让行为树执行
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

// 4. 主程序
async function main() {
    // 初始化
    Core.create();
    const plugin = new BehaviorTreePlugin();
    await Core.installPlugin(plugin);

    const scene = new Scene();
    plugin.setupScene(scene);
    Core.setScene(scene);

    // 注册自定义节点
    const system = scene.getSystem(BehaviorTreeExecutionSystem);
    if (system) {
        const registry = system.getExecutorRegistry();
        registry.register('SendMessage', new SendMessageAction());
        registry.register('MatchKeyword', new MatchKeywordCondition());
    }

    // 创建聊天机器人
    const bot = new ChatBot(scene);

    // 启动更新循环
    setInterval(() => {
        Core.update(0.1);
    }, 100);

    // 模拟用户对话
    console.log('\n=== 聊天机器人测试 ===\n');

    await bot.handleMessage('Alice', '你好');
    await new Promise(resolve => setTimeout(resolve, 200));

    await bot.handleMessage('Bob', '现在几点了？');
    await new Promise(resolve => setTimeout(resolve, 200));

    await bot.handleMessage('Charlie', '今天天气怎么样');
    await new Promise(resolve => setTimeout(resolve, 200));

    await bot.handleMessage('David', '你能帮我做什么');
    await new Promise(resolve => setTimeout(resolve, 200));

    await bot.handleMessage('Eve', '你好吗？');
}

main();
```

## 实战示例：多人游戏服务器

### 房间管理系统

```typescript
import { Core, Scene, Entity } from '@esengine/ecs-framework';
import {
    BehaviorTreePlugin,
    BehaviorTreeBuilder,
    BehaviorTreeStarter,
    BehaviorTreeAssetManager
} from '@esengine/behavior-tree';

// 游戏房间
class GameRoom {
    private scene: Scene;
    private assetManager: BehaviorTreeAssetManager;
    private monsters: Entity[] = [];

    constructor(roomId: string) {
        // 创建房间场景
        this.scene = new Scene();
        const plugin = new BehaviorTreePlugin();
        plugin.setupScene(this.scene);

        this.assetManager = Core.services.resolve(BehaviorTreeAssetManager);

        // 初始化房间
        this.spawnMonsters();
        console.log(`房间 ${roomId} 已创建，怪物数量: ${this.monsters.length}`);
    }

    private spawnMonsters() {
        // 从资产管理器获取怪物AI（所有房间共享）
        const monsterAI = this.assetManager.getAsset('MonsterAI');
        if (!monsterAI) return;

        // 生成10个怪物
        for (let i = 0; i < 10; i++) {
            const monster = this.scene.createEntity(`Monster_${i}`);
            BehaviorTreeStarter.start(monster, monsterAI);
            this.monsters.push(monster);
        }
    }

    update(deltaTime: number) {
        this.scene.update(deltaTime);
    }

    destroy() {
        this.monsters.forEach(m => m.destroy());
        this.monsters = [];
    }
}

// 房间管理器
class RoomManager {
    private rooms: Map<string, GameRoom> = new Map();

    createRoom(roomId: string): GameRoom {
        const room = new GameRoom(roomId);
        this.rooms.set(roomId, room);
        return room;
    }

    getRoom(roomId: string): GameRoom | undefined {
        return this.rooms.get(roomId);
    }

    destroyRoom(roomId: string) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.destroy();
            this.rooms.delete(roomId);
        }
    }

    update(deltaTime: number) {
        this.rooms.forEach(room => room.update(deltaTime));
    }
}

// 主程序
async function startGameServer() {
    // 初始化
    Core.create();
    const plugin = new BehaviorTreePlugin();
    await Core.installPlugin(plugin);

    // 预加载怪物AI（所有房间共享）
    const assetManager = Core.services.resolve(BehaviorTreeAssetManager);
    const monsterAI = BehaviorTreeBuilder.create('MonsterAI')
        .defineBlackboardVariable('health', 100)
        .selector('Behavior')
            .log('攻击玩家')
        .end()
        .build();
    assetManager.loadAsset(monsterAI);

    // 创建房间管理器
    const roomManager = new RoomManager();

    // 模拟房间创建
    roomManager.createRoom('room_1');
    roomManager.createRoom('room_2');

    // 服务器主循环（60 TPS）
    setInterval(() => {
        roomManager.update(1/60);
    }, 1000 / 60);

    console.log('游戏服务器已启动');
}

startGameServer();
```

## 性能优化

### 1. 控制更新频率

```typescript
// 不同类型的AI使用不同的更新频率
class AIManager {
    private importantAIs: Entity[] = [];  // Boss等重要AI，60 TPS
    private normalAIs: Entity[] = [];     // 普通敌人，20 TPS
    private backgroundAIs: Entity[] = [];  // 背景NPC，5 TPS

    update() {
        // 重要AI每帧更新
        this.updateAIs(this.importantAIs, 1/60);

        // 普通AI每3帧更新一次
        if (frameCount % 3 === 0) {
            this.updateAIs(this.normalAIs, 3/60);
        }

        // 背景AI每12帧更新一次
        if (frameCount % 12 === 0) {
            this.updateAIs(this.backgroundAIs, 12/60);
        }
    }
}
```

### 2. 资源管理

```typescript
// 使用资产管理器避免重复创建
const assetManager = Core.services.resolve(BehaviorTreeAssetManager);

// 预加载所有AI
const enemyAI = BehaviorTreeBuilder.create('EnemyAI').build();
const bossAI = BehaviorTreeBuilder.create('BossAI').build();

assetManager.loadAsset(enemyAI);
assetManager.loadAsset(bossAI);

// 创建1000个敌人，但只使用1份BehaviorTreeData
for (let i = 0; i < 1000; i++) {
    const enemy = scene.createEntity(`Enemy${i}`);
    const ai = assetManager.getAsset('EnemyAI')!;
    BehaviorTreeStarter.start(enemy, ai);
}
```

### 3. 使用对象池

```typescript
class EntityPool {
    private pool: Entity[] = [];
    private active: Entity[] = [];

    spawn(scene: Scene, treeId: string): Entity {
        let entity = this.pool.pop();

        if (!entity) {
            entity = scene.createEntity();
            const tree = assetManager.getAsset(treeId)!;
            BehaviorTreeStarter.start(entity, tree);
        } else {
            BehaviorTreeStarter.restart(entity);
        }

        this.active.push(entity);
        return entity;
    }

    recycle(entity: Entity) {
        BehaviorTreeStarter.pause(entity);
        const index = this.active.indexOf(entity);
        if (index >= 0) {
            this.active.splice(index, 1);
            this.pool.push(entity);
        }
    }
}
```

## 最佳实践

### 1. 使用环境变量控制调试

```typescript
const DEBUG = process.env.NODE_ENV === 'development';

const aiTree = BehaviorTreeBuilder.create('AI')
    .selector('Main')
        .when(DEBUG, builder =>
            builder.log('调试信息：开始AI逻辑')
        )
        // AI 逻辑...
    .end()
    .build();
```

### 2. 错误处理

```typescript
try {
    const tree = BehaviorTreeBuilder.create('AI')
        // ... 构建逻辑
        .build();

    assetManager.loadAsset(tree);
    BehaviorTreeStarter.start(entity, tree);
} catch (error) {
    console.error('启动AI失败:', error);
    // 使用默认AI或进行降级处理
}
```

### 3. 监控和日志

```typescript
// 定期输出AI状态
setInterval(() => {
    const assetManager = Core.services.resolve(BehaviorTreeAssetManager);
    const count = assetManager.getAssetCount();
    const entities = scene.getEntitiesFor(Matcher.empty().all(BehaviorTreeRuntimeComponent));

    console.log(`[AI监控] 行为树资产: ${count}, 活跃实体: ${entities.length}`);
}, 10000);
```

## 常见问题

### 如何与 Express/Koa 等框架集成？

```typescript
import express from 'express';
import { Core, Scene } from '@esengine/ecs-framework';

const app = express();
const scene = new Scene();

// 在单独的循环中更新ECS
setInterval(() => {
    Core.update(0.016);
}, 16);

app.post('/npc/:id/interact', (req, res) => {
    const npcId = req.params.id;
    const npc = scene.findEntity(npcId);

    if (npc) {
        const runtime = npc.getComponent(BehaviorTreeRuntimeComponent);
        runtime?.setBlackboardValue('playerRequest', req.body);

        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'NPC not found' });
    }
});

app.listen(3000);
```

### 如何持久化行为树状态？

```typescript
// 保存状态
function saveAIState(entity: Entity) {
    const runtime = entity.getComponent(BehaviorTreeRuntimeComponent);
    if (runtime) {
        return {
            treeId: runtime.treeId,
            blackboard: runtime.getAllBlackboardVariables(),
            activeNodes: Array.from(runtime.activeNodeIds)
        };
    }
}

// 恢复状态
function loadAIState(entity: Entity, savedState: any) {
    const runtime = entity.getComponent(BehaviorTreeRuntimeComponent);
    if (runtime) {
        // 恢复黑板变量
        Object.entries(savedState.blackboard).forEach(([key, value]) => {
            runtime.setBlackboardValue(key, value);
        });
    }
}
```

## 下一步

- 查看[资产管理](./asset-management.md)了解资源加载和子树
- 学习[自定义节点执行器](./custom-actions.md)创建自定义行为
- 阅读[最佳实践](./best-practices.md)优化你的服务端AI
