# 快速开始

本文档为开始使用 @esengine/ai 库的开发者提供安装说明、基本使用模式和模块导入策略。它涵盖了三个核心 AI 范式（行为树、效用 AI 和有限状态机）并演示了基本的集成模式。

有关全面的行为树文档，请参见[行为树](04-02-02-behavior-trees.md)。有关性能优化功能，请参见[性能与优化](04-02-05-performance-optimization.md)。

## 安装

该库作为 npm 包分发，面向 JavaScript 游戏引擎和 TypeScript 应用程序。

```bash
npm install @esengine/ai
```

### 系统要求

- Node.js >= 16.0.0
- TypeScript 5.8.3+（用于 TypeScript 项目）
- 兼容 Laya Engine、Cocos Creator、Egret Engine 和通用 JavaScript/TypeScript 应用程序

## 导入模式

### 命名空间导入模式

```typescript
import * as AI from '@esengine/ai';

// 使用命名空间语法
const behaviorTree = AI.BehaviourTree.BehaviorTreeBuilder.begin(context);
const stateMachine = new AI.FSM.StateMachine(context, initialState);
const utilityAI = new AI.UtilityAI.UtilityAI();
```

### 直接命名导入模式

```typescript
import { 
    BehaviorTree, 
    BehaviorTreeBuilder, 
    TaskStatus,
    StateMachine, 
    State,
    TimeManager 
} from '@esengine/ai';

// 直接使用类
const behaviorTree = BehaviorTreeBuilder.begin(context);
const stateMachine = new StateMachine(context, initialState);
```

### 选择性模块导入模式

```typescript
import * as BT from '@esengine/ai/behaviourTree';
import * as FSM from '@esengine/ai/fsm';

// 仅导入所需模块
const tree = BT.BehaviorTreeBuilder.begin(context);
const machine = new FSM.StateMachine(context, initialState);
```

## 基本使用示例

### 行为树示例

BehaviorTreeBuilder 类提供了用于构建行为树的流式 API，支持复合节点、装饰器和行动节点。

```typescript
import { BehaviorTreeBuilder, TaskStatus } from '@esengine/ai';

interface GameContext {
    health: number;
    position: { x: number, y: number };
    hasWeapon: boolean;
}

class NPCController {
    private context: GameContext = {
        health: 100,
        position: { x: 0, y: 0 },
        hasWeapon: true
    };

    createBehaviorTree() {
        const builder = BehaviorTreeBuilder.begin(this.context);
        
        return builder.selector()
            // 优先级 1：低血量 - 寻找治疗
            .conditionalDecorator(ctx => ctx.health < 30)
            .sequence()
                .logAction("正在寻找治疗")
                .action(ctx => this.findHealing(ctx))
                .endComposite()
            
            // 优先级 2：持有武器 - 攻击敌人
            .conditionalDecorator(ctx => ctx.hasWeapon)
            .sequence()
                .action(ctx => this.scanForEnemies(ctx))
                .action(ctx => this.attackEnemy(ctx))
                .endComposite()
            
            // 默认：巡逻行为
            .sequence()
                .action(ctx => this.patrol(ctx))
                .waitAction(2.0)
                .endComposite()
            .endComposite()
            .build();
    }

    private findHealing(ctx: GameContext): TaskStatus {
        ctx.health = Math.min(100, ctx.health + 10);
        return ctx.health >= 100 ? TaskStatus.Success : TaskStatus.Running;
    }

    private scanForEnemies(ctx: GameContext): TaskStatus {
        // 扫描逻辑
        return TaskStatus.Success;
    }

    private attackEnemy(ctx: GameContext): TaskStatus {
        // 攻击逻辑
        return TaskStatus.Success;
    }

    private patrol(ctx: GameContext): TaskStatus {
        // 巡逻逻辑
        return TaskStatus.Success;
    }
}
```

### 效用 AI 示例

UtilityAI 系统通过 Action 和 Consideration 类使用基于评分的决策制定。

```typescript
import { UtilityAI } from '@esengine/ai';

interface AIAgent {
    health: number;
    ammunition: number;
    distanceToEnemy: number;
}

class AttackAction {
    execute(context: AIAgent): void {
        console.log("执行攻击");
        context.ammunition--;
    }
    
    getScore(context: AIAgent): number {
        let score = 0;
        
        // 血量考虑因素（0-1 范围）
        score += context.health / 100 * 0.4;
        
        // 弹药考虑因素
        score += Math.min(context.ammunition / 10, 1) * 0.3;
        
        // 距离考虑因素（越近分数越高）
        score += Math.max(0, 1 - context.distanceToEnemy / 10) * 0.3;
        
        return score;
    }
}

class DefendAction {
    execute(context: AIAgent): void {
        console.log("执行防御");
    }
    
    getScore(context: AIAgent): number {
        // 血量低时分数更高
        return (100 - context.health) / 100;
    }
}

// 使用方式
const agent: AIAgent = {
    health: 60,
    ammunition: 5,
    distanceToEnemy: 3
};

const utilityAI = new UtilityAI<AIAgent>();
utilityAI.addAction(new AttackAction());
utilityAI.addAction(new DefendAction());

// 基于当前上下文执行最佳行动
utilityAI.execute(agent);
```

### 有限状态机示例

StateMachine 和 State 类提供基于状态的 AI 控制，支持自动转换。

```typescript
import { StateMachine, State } from '@esengine/ai';

interface GuardContext {
    alertLevel: number;
    playerVisible: boolean;
    position: { x: number, y: number };
    stateMachine: StateMachine<GuardContext>;
}

class PatrolState extends State<GuardContext> {
    onEnter(context: GuardContext): void {
        console.log("开始巡逻");
        context.alertLevel = 0;
    }
    
    update(context: GuardContext): void {
        // 巡逻移动逻辑
        this.simulatePatrol(context);
        
        if (context.playerVisible) {
            context.stateMachine.changeState(new AlertState());
        }
    }
    
    private simulatePatrol(context: GuardContext): void {
        // 在巡逻点之间移动
        context.position.x += Math.sin(Date.now() * 0.001);
    }
}

class AlertState extends State<GuardContext> {
    onEnter(context: GuardContext): void {
        console.log("发现玩家！进入警戒状态");
        context.alertLevel = 100;
    }
    
    update(context: GuardContext): void {
        if (!context.playerVisible) {
            context.alertLevel = Math.max(0, context.alertLevel - 2);
            
            if (context.alertLevel <= 0) {
                context.stateMachine.changeState(new PatrolState());
            }
        } else {
            context.stateMachine.changeState(new CombatState());
        }
    }
}

class CombatState extends State<GuardContext> {
    update(context: GuardContext): void {
        console.log("进入战斗");
        
        if (!context.playerVisible) {
            context.stateMachine.changeState(new AlertState());
        }
    }
}

// 使用方式
const guardContext: GuardContext = {
    alertLevel: 0,
    playerVisible: false,
    position: { x: 0, y: 0 },
    stateMachine: null as any // 将在下面设置
};

const stateMachine = new StateMachine(guardContext, new PatrolState());
guardContext.stateMachine = stateMachine;

// 在游戏循环中
stateMachine.update();
```

## 性能考虑

该库包含多个性能优化系统，应在初始化期间进行配置：

### TimeManager 配置

```typescript
import { TimeManager } from '@esengine/ai';

// 启用时间池化以减少分配开销
TimeManager.enablePooling(true);

// 设置游戏模拟的时间缩放
TimeManager.setTimeScale(1.0);
```

### 对象池设置

```typescript
import { AdvancedObjectPool } from '@esengine/ai';

// 为频繁使用的对象创建池
const bulletPool = new AdvancedObjectPool(
    () => new Bullet(),           // 工厂函数
    bullet => bullet.reset(),     // 重置函数
    {
        initialSize: 50,
        maxSize: 200,
        priority: 'high'
    }
);
```

### 性能监控

```typescript
import { PerformanceMonitor, PerformanceConfig } from '@esengine/ai';

// 在开发环境中配置监控
PerformanceConfig.set({
    enableObjectPooling: true,
    enableTimePooling: true,
    enablePerformanceMonitoring: process.env.NODE_ENV === 'development',
    maxPoolSize: 1000
});

// 获取运行时统计信息
const btStats = PerformanceMonitor.getBehaviorTreeStats();
console.log(`平均执行时间: ${btStats.averageExecutionTime}ms`);
```

## 下一步

- **行为树开发**：参见[行为树章节](04-02-02-behavior-trees.md)，了解综合节点类型、组合模式和 BehaviorTreeBuilder 流式 API
- **高级行为树**：参见[BehaviorTreeBuilder 章节](04-02-01-01-behaviortreebuilder.md)，了解 JSON 配置和复杂树构建
- **性能优化**：参见[性能与优化章节](04-02-05-performance-optimization.md)，了解 TimeManager、ObjectPool 和监控系统
- **测试和开发**：参见[测试章节](#testing)，了解 Jest 测试设置和性能基准

该库提供了广泛的 TypeScript 类型定义和运行时类型检查。所有类都支持泛型类型参数，为你的游戏上下文对象提供强类型支持。