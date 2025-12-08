# 自定义节点执行器

本教程介绍如何为项目创建专用的节点执行器，供策划在编辑器中使用。

## 为什么需要自定义执行器？

虽然框架提供了ExecuteAction等通用节点,但自定义执行器能提供更好的开发体验:

- 类型安全: TypeScript类型检查,编译时发现错误
- 智能提示: IDE自动补全,提高开发效率
- 配置化: 策划只需配置参数,无需编程
- 可复用: 封装通用逻辑,便于维护
- 黑板绑定: 支持属性绑定到黑板变量

推荐做法: 程序员创建专用的执行器类,策划在编辑器中配置参数使用。

## 基础架构

### Runtime执行器架构

行为树采用Runtime执行器架构,将节点定义和执行逻辑分离:

- 节点执行器: 无状态的执行逻辑类,实现`INodeExecutor`接口
- 节点元数据: 通过`@NodeExecutorMetadata`装饰器定义
- 运行时状态: 存储在`NodeRuntimeState`中,不在执行器中
- 执行上下文: `NodeExecutionContext`包含执行所需的所有信息

### 基础结构

一个自定义节点执行器的基本结构:

```typescript
import { TaskStatus, NodeType } from '@esengine/behavior-tree';
import {
    INodeExecutor,
    NodeExecutionContext,
    BindingHelper,
    NodeExecutorMetadata
} from '@esengine/behavior-tree';

@NodeExecutorMetadata({
    implementationType: 'AttackAction',  // 唯一标识符
    nodeType: NodeType.Action,           // 节点类型
    displayName: '攻击目标',             // 编辑器显示名称
    description: '对目标造成伤害',       // 描述信息
    category: '战斗',                    // 分类
    configSchema: {                      // 配置参数定义
        damage: {
            type: 'number',
            default: 10,
            description: '伤害值',
            min: 0,
            max: 999,
            supportBinding: true         // 支持绑定到黑板变量
        }
    }
})
export class AttackAction implements INodeExecutor {
    /**
     * 执行节点逻辑
     */
    execute(context: NodeExecutionContext): TaskStatus {
        // 使用BindingHelper获取配置值(支持黑板绑定)
        const damage = BindingHelper.getValue<number>(context, 'damage', 10);

        // 访问黑板数据
        const target = context.runtime.getBlackboardValue('target');

        if (!target) {
            return TaskStatus.Failure;
        }

        // 执行攻击逻辑
        console.log(`造成 ${damage} 点伤害`);

        return TaskStatus.Success;
    }

    /**
     * 重置节点状态(可选)
     * 当节点完成或被中断时调用
     */
    reset(context: NodeExecutionContext): void {
        // 清理状态
    }
}
```

### 核心概念

#### NodeExecutionContext

执行上下文包含执行所需的所有信息:

```typescript
interface NodeExecutionContext {
    entity: Entity;                      // 行为树宿主实体
    nodeData: BehaviorNodeData;          // 节点配置数据
    state: NodeRuntimeState;             // 节点运行时状态
    runtime: BehaviorTreeRuntimeComponent; // 运行时组件(访问黑板等)
    treeData: BehaviorTreeData;          // 行为树数据
    deltaTime: number;                   // 当前帧增量时间
    totalTime: number;                   // 总时间
    executeChild(childId: string): TaskStatus; // 执行子节点
}
```

#### BindingHelper

BindingHelper用于获取配置值,自动处理黑板绑定:

```typescript
// 获取配置值(支持黑板绑定)
const damage = BindingHelper.getValue<number>(context, 'damage', 10);

// 检查是否绑定到黑板
if (BindingHelper.hasBinding(context, 'damage')) {
    const blackboardKey = BindingHelper.getBindingKey(context, 'damage');
    console.log(`damage绑定到黑板变量: ${blackboardKey}`);
}
```

#### 访问黑板

通过`context.runtime`访问黑板:

```typescript
// 读取黑板变量
const target = context.runtime.getBlackboardValue('target');
const health = context.runtime.getBlackboardValue<number>('health');

// 写入黑板变量
context.runtime.setBlackboardValue('lastAttackTime', context.totalTime);
```

#### 状态存储

节点状态存储在`context.state`中,不在执行器中:

```typescript
execute(context: NodeExecutionContext): TaskStatus {
    // 读取状态
    if (!context.state.startTime) {
        context.state.startTime = context.totalTime;
    }

    const elapsed = context.totalTime - context.state.startTime;

    if (elapsed >= 3.0) {
        return TaskStatus.Success;
    }

    return TaskStatus.Running;
}

reset(context: NodeExecutionContext): void {
    // 重置状态
    context.state.startTime = undefined;
}
```

## 配置参数定义

使用`configSchema`定义可配置的参数:

### 支持的参数类型

#### 数值类型

```typescript
configSchema: {
    damage: {
        type: 'number',
        default: 10,
        description: '伤害值',
        min: 0,
        max: 999,
        supportBinding: true  // 支持绑定到黑板变量
    },
    speed: {
        type: 'number',
        default: 5.0,
        min: 0,
        max: 100,
        supportBinding: true
    }
}
```

#### 字符串类型

```typescript
configSchema: {
    animationName: {
        type: 'string',
        default: '',
        description: '动画名称',
        supportBinding: true
    },
    message: {
        type: 'string',
        default: 'Hello',
        supportBinding: true
    }
}
```

#### 布尔类型

```typescript
configSchema: {
    loop: {
        type: 'boolean',
        default: false,
        description: '是否循环',
        supportBinding: false
    }
}
```

#### 对象类型

```typescript
configSchema: {
    config: {
        type: 'object',
        default: {},
        description: '配置对象',
        supportBinding: true
    }
}
```

#### 数组类型

```typescript
configSchema: {
    targets: {
        type: 'array',
        default: [],
        description: '目标列表',
        supportBinding: true
    }
}
```

### 属性连接限制

可以控制属性是否允许多个连接:

```typescript
configSchema: {
    target: {
        type: 'object',
        default: null,
        supportBinding: true,
        allowMultipleConnections: false  // 不允许多个连接(默认)
    },
    listeners: {
        type: 'array',
        default: [],
        supportBinding: true,
        allowMultipleConnections: true   // 允许多个连接
    }
}
```

## 完整示例

### 示例1: 攻击动作

```typescript
import { TaskStatus, NodeType } from '@esengine/behavior-tree';
import {
    INodeExecutor,
    NodeExecutionContext,
    BindingHelper,
    NodeExecutorMetadata
} from '@esengine/behavior-tree';

/**
 * 攻击动作执行器
 */
@NodeExecutorMetadata({
    implementationType: 'AttackAction',
    nodeType: NodeType.Action,
    displayName: '攻击目标',
    description: '对目标造成伤害',
    category: '战斗',
    configSchema: {
        damage: {
            type: 'number',
            default: 10,
            description: '造成的伤害值',
            min: 0,
            max: 999,
            supportBinding: true
        },
        attackType: {
            type: 'string',
            default: 'melee',
            description: '攻击类型',
            options: ['melee', 'ranged', 'magic'],
            supportBinding: true
        }
    }
})
export class AttackAction implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { entity, runtime } = context;

        // 获取配置值(支持黑板绑定)
        const damage = BindingHelper.getValue<number>(context, 'damage', 10);
        const attackType = BindingHelper.getValue<string>(context, 'attackType', 'melee');

        // 获取目标
        const target = runtime.getBlackboardValue('target');

        if (!target) {
            return TaskStatus.Failure;
        }

        // 执行攻击逻辑
        console.log(`[AttackAction] 使用${attackType}攻击，造成${damage}点伤害`);

        // 触发事件让游戏逻辑处理
        entity.scene?.eventSystem.emit('ai:attack', {
            attacker: entity,
            target,
            damage,
            attackType
        });

        return TaskStatus.Success;
    }
}
```

### 示例2: 移动到位置

带状态的异步动作示例:

```typescript
/**
 * 移动到位置执行器
 */
@NodeExecutorMetadata({
    implementationType: 'MoveToPosition',
    nodeType: NodeType.Action,
    displayName: '移动到位置',
    description: '移动到目标位置',
    category: '移动',
    configSchema: {
        targetPosition: {
            type: 'object',
            default: { x: 0, y: 0 },
            description: '目标位置',
            supportBinding: true
        },
        speed: {
            type: 'number',
            default: 5.0,
            description: '移动速度',
            min: 0,
            max: 100,
            supportBinding: true
        },
        arrivalDistance: {
            type: 'number',
            default: 0.5,
            description: '到达距离',
            min: 0.1,
            max: 10,
            supportBinding: false
        }
    }
})
export class MoveToPosition implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { runtime, deltaTime } = context;

        // 获取配置值
        const targetPos = BindingHelper.getValue<{x: number, y: number}>(
            context, 'targetPosition', { x: 0, y: 0 }
        );
        const speed = BindingHelper.getValue<number>(context, 'speed', 5.0);
        const arrivalDistance = BindingHelper.getValue<number>(
            context, 'arrivalDistance', 0.5
        );

        // 获取当前位置
        const currentPos = runtime.getBlackboardValue<{x: number, y: number}>('position');

        if (!currentPos) {
            return TaskStatus.Failure;
        }

        // 计算距离
        const dx = targetPos.x - currentPos.x;
        const dy = targetPos.y - currentPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 到达目标
        if (distance <= arrivalDistance) {
            return TaskStatus.Success;
        }

        // 移动
        const moveDistance = speed * deltaTime;
        const ratio = Math.min(moveDistance / distance, 1);

        const newPos = {
            x: currentPos.x + dx * ratio,
            y: currentPos.y + dy * ratio
        };

        runtime.setBlackboardValue('position', newPos);

        return TaskStatus.Running;
    }
}
```

### 示例3: 等待并计时

使用状态存储的示例:

```typescript
/**
 * 延迟执行器
 */
@NodeExecutorMetadata({
    implementationType: 'DelayAction',
    nodeType: NodeType.Action,
    displayName: '延迟',
    description: '等待指定时间',
    category: '工具',
    configSchema: {
        duration: {
            type: 'number',
            default: 1.0,
            description: '等待时长(秒)',
            min: 0,
            supportBinding: true
        }
    }
})
export class DelayAction implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { state, totalTime } = context;
        const duration = BindingHelper.getValue<number>(context, 'duration', 1.0);

        // 第一次执行,记录开始时间
        if (!state.startTime) {
            state.startTime = totalTime;
            return TaskStatus.Running;
        }

        // 检查是否超时
        if (totalTime - state.startTime >= duration) {
            return TaskStatus.Success;
        }

        return TaskStatus.Running;
    }

    reset(context: NodeExecutionContext): void {
        context.state.startTime = undefined;
    }
}
```

### 示例4: 条件节点

```typescript
/**
 * 检查生命值条件执行器
 */
@NodeExecutorMetadata({
    implementationType: 'CheckHealth',
    nodeType: NodeType.Condition,
    displayName: '检查生命值',
    description: '检查生命值是否满足条件',
    category: '条件',
    configSchema: {
        threshold: {
            type: 'number',
            default: 50,
            description: '阈值',
            min: 0,
            max: 100,
            supportBinding: true
        },
        operator: {
            type: 'string',
            default: 'greater',
            description: '比较运算符',
            options: ['greater', 'less', 'equal'],
            supportBinding: false
        }
    }
})
export class CheckHealth implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const threshold = BindingHelper.getValue<number>(context, 'threshold', 50);
        const operator = BindingHelper.getValue<string>(context, 'operator', 'greater');

        const health = context.runtime.getBlackboardValue<number>('health');

        if (health === undefined) {
            return TaskStatus.Failure;
        }

        let result = false;

        switch (operator) {
            case 'greater':
                result = health > threshold;
                break;
            case 'less':
                result = health < threshold;
                break;
            case 'equal':
                result = health === threshold;
                break;
        }

        return result ? TaskStatus.Success : TaskStatus.Failure;
    }
}
```

### 示例5: 装饰器节点

```typescript
/**
 * 重试装饰器执行器
 */
@NodeExecutorMetadata({
    implementationType: 'RetryDecorator',
    nodeType: NodeType.Decorator,
    displayName: '重试',
    description: '子节点失败时重试指定次数',
    category: '装饰器',
    configSchema: {
        maxRetries: {
            type: 'number',
            default: 3,
            description: '最大重试次数',
            min: 1,
            max: 10,
            supportBinding: false
        }
    }
})
export class RetryDecorator implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        const { nodeData, state } = context;

        if (!nodeData.children || nodeData.children.length === 0) {
            return TaskStatus.Failure;
        }

        const maxRetries = BindingHelper.getValue<number>(context, 'maxRetries', 3);

        // 初始化重试计数
        if (state.retryCount === undefined) {
            state.retryCount = 0;
        }

        const childId = nodeData.children[0];
        const status = context.executeChild(childId);

        if (status === TaskStatus.Running) {
            return TaskStatus.Running;
        }

        if (status === TaskStatus.Success) {
            state.retryCount = 0;
            return TaskStatus.Success;
        }

        // 失败时重试
        state.retryCount++;

        if (state.retryCount < maxRetries) {
            // 重置子节点状态以便重试
            context.runtime.resetNodeState(childId);
            return TaskStatus.Running;
        }

        // 达到最大重试次数
        state.retryCount = 0;
        return TaskStatus.Failure;
    }

    reset(context: NodeExecutionContext): void {
        context.state.retryCount = 0;

        if (context.nodeData.children && context.nodeData.children.length > 0) {
            context.runtime.resetNodeState(context.nodeData.children[0]);
        }
    }
}
```

## 注册执行器

### 自动注册

执行器通过`@NodeExecutorMetadata`装饰器自动注册到全局注册表。只需导入执行器文件即可:

```typescript
// src/game/ai/index.ts
import './executors/AttackAction';
import './executors/MoveToPosition';
import './executors/DelayAction';
import './executors/CheckHealth';

// 执行器会自动注册,无需手动调用注册函数
```

### 导入时机

在Core初始化之前导入执行器:

```typescript
// src/main.ts
import { Core } from '@esengine/ecs-framework';
import { BehaviorTreePlugin } from '@esengine/behavior-tree';

// 导入自定义执行器
import './game/ai';

async function main() {
    Core.create();

    const plugin = new BehaviorTreePlugin();
    await Core.installPlugin(plugin);

    // ...
}
```

### 插件方式注册

如果要创建可复用的行为树插件,参考以下结构:

```typescript
// my-behavior-plugin/src/plugin.ts
import type { IEditorPlugin } from '@esengine/editor-core';
import { EditorPluginCategory } from '@esengine/editor-core';
import type { Core, ServiceContainer } from '@esengine/ecs-framework';

// 导入执行器(触发装饰器注册)
import './executors/AttackAction';
import './executors/MoveToPosition';

export class MyBehaviorPlugin implements IEditorPlugin {
    readonly name = 'my-behavior-plugin';
    readonly version = '1.0.0';
    readonly category = EditorPluginCategory.Tool;

    async install(core: Core, services: ServiceContainer): Promise<void> {
        console.log('[MyBehaviorPlugin] 插件已安装');
        // 执行器已通过装饰器自动注册
    }

    async uninstall(): Promise<void> {
        console.log('[MyBehaviorPlugin] 插件已卸载');
    }
}

export const myBehaviorPlugin = new MyBehaviorPlugin();
```

## 与游戏逻辑集成

### 方式1: 通过事件系统(推荐)

在执行器中触发事件,保持解耦:

```typescript
execute(context: NodeExecutionContext): TaskStatus {
    const { entity } = context;
    const damage = BindingHelper.getValue<number>(context, 'damage', 10);
    const target = context.runtime.getBlackboardValue('target');

    entity.scene?.eventSystem.emit('ai:attack', {
        attacker: entity,
        target,
        damage
    });

    return TaskStatus.Success;
}
```

在游戏代码中监听事件:

```typescript
Core.scene.eventSystem.on('ai:attack', (data) => {
    const { attacker, target, damage } = data;
    target.takeDamage(damage);
});
```

### 方式2: 通过黑板传递对象

将游戏对象放入黑板:

```typescript
const runtime = aiEntity.getComponent(BehaviorTreeRuntimeComponent);
runtime.setBlackboardValue('gameController', this.gameController);
runtime.setBlackboardValue('player', this.player);
```

在执行器中使用:

```typescript
execute(context: NodeExecutionContext): TaskStatus {
    const gameController = context.runtime.getBlackboardValue('gameController');
    const player = context.runtime.getBlackboardValue('player');

    const damage = BindingHelper.getValue<number>(context, 'damage', 10);
    gameController?.attack(player, damage);

    return TaskStatus.Success;
}
```

### 方式3: 通过Entity组件

访问Entity上的其他组件:

```typescript
execute(context: NodeExecutionContext): TaskStatus {
    const { entity } = context;

    // 获取实体上的其他组件
    const transform = entity.getComponent(Transform);
    const animator = entity.getComponent(Animator);

    if (animator) {
        const animName = BindingHelper.getValue<string>(context, 'animationName', '');
        animator.play(animName);
    }

    return TaskStatus.Success;
}
```

## 最佳实践

### 1. 保持执行器无状态

执行器实例在所有节点间共享,不要在执行器中存储状态:

```typescript
// 错误: 状态存储在执行器中
export class BadAction implements INodeExecutor {
    private startTime = 0;  // 错误!多个节点会共享这个值

    execute(context: NodeExecutionContext): TaskStatus {
        this.startTime = context.totalTime;  // 错误!
        return TaskStatus.Success;
    }
}

// 正确: 状态存储在context.state中
export class GoodAction implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        if (!context.state.startTime) {
            context.state.startTime = context.totalTime;  // 正确!
        }
        return TaskStatus.Success;
    }
}
```

### 2. 使用BindingHelper获取配置值

始终使用BindingHelper而不是直接访问nodeData.config:

```typescript
// 错误: 直接访问config,不支持黑板绑定
execute(context: NodeExecutionContext): TaskStatus {
    const damage = context.nodeData.config.damage;  // 错误!
}

// 正确: 使用BindingHelper,自动处理黑板绑定
execute(context: NodeExecutionContext): TaskStatus {
    const damage = BindingHelper.getValue<number>(context, 'damage', 10);  // 正确!
}
```

### 3. 为配置参数标记supportBinding

需要动态值的参数应支持黑板绑定:

```typescript
configSchema: {
    damage: {
        type: 'number',
        default: 10,
        supportBinding: true  // 允许绑定到黑板变量
    },
    maxRetries: {
        type: 'number',
        default: 3,
        supportBinding: false  // 固定配置,不需要绑定
    }
}
```

### 4. 单一职责原则

每个执行器只做一件事:

```typescript
// 好的做法
export class AttackAction { }      // 只负责攻击
export class MoveAction { }        // 只负责移动
export class PlayAnimation { }     // 只负责播放动画

// 不好的做法
export class AttackAndMoveAndAnimate { }  // 做太多事情
```

### 5. 提供合理的默认值

```typescript
configSchema: {
    damage: {
        type: 'number',
        default: 10,        // 合理的默认值
        min: 0,
        max: 999
    }
}
```

### 6. 添加详细的描述

```typescript
@NodeExecutorMetadata({
    implementationType: 'AttackAction',
    displayName: '攻击目标',
    description: '对黑板中的目标造成伤害,如果目标不存在则失败',  // 清晰的描述
    configSchema: {
        damage: {
            type: 'number',
            default: 10,
            description: '每次攻击造成的伤害值'  // 参数说明
        }
    }
})
```

### 7. 正确实现reset方法

如果节点使用了状态,必须实现reset方法:

```typescript
export class TimedAction implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        if (!context.state.startTime) {
            context.state.startTime = context.totalTime;
        }

        if (context.totalTime - context.state.startTime >= 3.0) {
            return TaskStatus.Success;
        }

        return TaskStatus.Running;
    }

    // 必须重置状态
    reset(context: NodeExecutionContext): void {
        context.state.startTime = undefined;
    }
}
```

### 8. 装饰器节点要重置子节点

装饰器节点在reset时要重置子节点状态:

```typescript
export class MyDecorator implements INodeExecutor {
    execute(context: NodeExecutionContext): TaskStatus {
        if (!context.nodeData.children || context.nodeData.children.length === 0) {
            return TaskStatus.Failure;
        }

        const childId = context.nodeData.children[0];
        return context.executeChild(childId);
    }

    reset(context: NodeExecutionContext): void {
        // 重置自己的状态
        context.state.customData = undefined;

        // 重置子节点状态
        if (context.nodeData.children && context.nodeData.children.length > 0) {
            context.runtime.resetNodeState(context.nodeData.children[0]);
        }
    }
}
```

## 调试技巧

### 添加日志

```typescript
execute(context: NodeExecutionContext): TaskStatus {
    const damage = BindingHelper.getValue<number>(context, 'damage', 10);
    console.log(`[AttackAction] 执行攻击, 节点ID=${context.nodeData.id}, 伤害=${damage}`);

    // ...
}
```

### 监控黑板状态

```typescript
execute(context: NodeExecutionContext): TaskStatus {
    // 输出所有黑板变量
    const allVars = context.runtime.getAllBlackboardVariables();
    console.log('黑板状态:', allVars);

    // ...
}
```

### 检查绑定状态

```typescript
execute(context: NodeExecutionContext): TaskStatus {
    if (BindingHelper.hasBinding(context, 'damage')) {
        const key = BindingHelper.getBindingKey(context, 'damage');
        const value = context.runtime.getBlackboardValue(key);
        console.log(`damage绑定到 ${key}, 值为 ${value}`);
    } else {
        console.log('damage使用配置值');
    }

    // ...
}
```

### 跟踪执行路径

```typescript
execute(context: NodeExecutionContext): TaskStatus {
    console.log(`执行节点: ${context.nodeData.name} (${context.nodeData.implementationType})`);
    console.log(`当前活动节点:`, Array.from(context.runtime.activeNodeIds));

    // ...
}
```

## 常见问题

### 编辑器中看不到自定义执行器?

确保:
1. 执行器文件已被导入
2. 使用了`@NodeExecutorMetadata`装饰器
3. 装饰器参数正确(implementationType唯一,nodeType正确)
4. 在Core.create()之前导入

### 属性绑定不生效?

检查:
1. configSchema中设置了`supportBinding: true`
2. 使用`BindingHelper.getValue()`获取值
3. 黑板变量名拼写正确
4. 黑板变量已定义

### 节点状态没有重置?

检查:
1. 是否实现了`reset()`方法
2. reset方法中是否清理了所有状态
3. 装饰器节点是否重置了子节点

### 多个节点共享状态?

问题: 在执行器类中定义了成员变量存储状态

解决: 状态必须存储在`context.state`中,而不是执行器实例中

### 如何支持复杂配置?

使用object类型:

```typescript
configSchema: {
    config: {
        type: 'object',
        default: {
            speed: 5,
            maxDistance: 100
        },
        description: '复杂配置对象'
    }
}

// 使用
execute(context: NodeExecutionContext): TaskStatus {
    const config = BindingHelper.getValue<{speed: number, maxDistance: number}>(
        context, 'config', { speed: 5, maxDistance: 100 }
    );

    console.log(config.speed, config.maxDistance);
}
```

## 下一步

- 学习[编辑器工作流](./editor-workflow.md)了解如何在编辑器中使用自定义节点
- 阅读[最佳实践](./best-practices.md)学习行为树设计模式
- 查看[高级用法](./advanced-usage.md)了解更多功能
