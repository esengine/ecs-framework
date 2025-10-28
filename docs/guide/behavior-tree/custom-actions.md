# 自定义动作组件

本教程介绍如何为项目创建专用的动作组件，供策划在编辑器中使用。

## 为什么需要自定义组件？

ExecuteAction节点允许在编辑器中编写JavaScript代码，但这种方式存在以下问题：

- 策划不懂编程，无法编写代码
- 没有智能提示，容易出错
- 缺少类型检查，运行时才发现问题
- 代码分散在编辑器中，难以维护

**推荐做法**：程序员创建专用的动作组件类，策划只需配置参数。

## 基础结构

一个自定义动作组件的基本结构：

```typescript
import { Component, ECSComponent, Entity } from '@esengine/ecs-framework';
import { Serializable, Serialize } from '@esengine/ecs-framework';
import {
    TaskStatus,
    NodeType,
    BlackboardComponent,
    BehaviorNode,
    BehaviorProperty
} from '@esengine/behavior-tree';

@BehaviorNode({
    displayName: '动作名称',        // 在编辑器中显示的名称
    category: '分类',                // 节点分类（如"战斗"、"移动"）
    type: NodeType.Action,           // 使用内置类型
    // 或使用自定义类型：
    // type: 'custom-behavior',      // 自定义节点类型
    icon: 'IconName',                // 图标名称（可选）
    description: '动作描述',         // 描述信息
    color: '#FF5722'                 // 节点颜色（可选）
})
@ECSComponent('CustomActionName')   // 组件名称
@Serializable({ version: 1 })       // 可序列化
export class CustomAction extends Component {
    // 属性定义...

    /**
     * 执行方法
     * 系统会自动调用此方法
     */
    execute(entity: Entity, blackboard?: BlackboardComponent, deltaTime?: number): TaskStatus {
        // 你的逻辑
        return TaskStatus.Success;
    }
}
```

## 自定义节点类型

除了使用内置的节点类型（`Action`、`Condition`、`Composite`、`Decorator`），你也可以定义自己的节点类型：

```typescript
@BehaviorNode({
    displayName: 'AI决策',
    category: '高级',
    type: 'ai-decision',  // 自定义类型
    description: '使用机器学习进行决策',
    color: '#00BCD4'
})
export class AIDecisionNode extends Component {
    execute(...): TaskStatus {
        // 自定义逻辑
        return TaskStatus.Success;
    }
}
```

自定义节点类型的好处：
- 可以创建特殊的执行逻辑
- 便于编辑器中分类和识别
- 支持项目特定的工作流

## 定义属性

使用 `@BehaviorProperty` 装饰器定义可配置的属性：

### 内置属性类型

框架提供了多种常用的属性类型：

#### 数值类型

```typescript
import { PropertyType } from '@esengine/behavior-tree';

@BehaviorProperty({
    label: '伤害值',
    type: PropertyType.Number,  // 或直接使用 'number'
    description: '造成的伤害',
    min: 0,
    max: 999,
    step: 1
})
@Serialize()
damage: number = 10;
```

策划在编辑器中看到的是：
- 标签："伤害值"
- 滑块：0-999，步长为1
- 默认值：10

#### 选择框类型

```typescript
@BehaviorProperty({
    label: '攻击类型',
    type: PropertyType.Select,
    description: '攻击方式',
    options: [
        { label: '近战', value: 'melee' },
        { label: '远程', value: 'ranged' },
        { label: '魔法', value: 'magic' }
    ]
})
@Serialize()
attackType: string = 'melee';
```

策划看到的是下拉选择框，选项为：近战、远程、魔法

#### 布尔类型

```typescript
@BehaviorProperty({
    label: '是否循环',
    type: PropertyType.Boolean,
    description: '动画是否循环播放'
})
@Serialize()
loop: boolean = false;
```

策划看到的是复选框

#### 字符串类型

```typescript
@BehaviorProperty({
    label: '动画名称',
    type: PropertyType.String,
    description: '要播放的动画名称',
    required: true
})
@Serialize()
animationName: string = '';
```

策划看到的是文本输入框，标记为必填

#### 黑板变量引用

```typescript
@BehaviorProperty({
    label: '目标位置变量',
    type: PropertyType.Blackboard,
    description: '黑板中存储目标位置的变量名'
})
@Serialize()
targetVariableName: string = 'targetPosition';
```

策划看到的是黑板变量选择器

#### 代码编辑器

```typescript
@BehaviorProperty({
    label: '配置（JSON）',
    type: PropertyType.Code,
    description: '配置数据，JSON格式'
})
@Serialize()
configJson: string = '{}';
```

策划看到的是代码编辑器

#### 资产引用

```typescript
@BehaviorProperty({
    label: '音效文件',
    type: PropertyType.Asset,
    description: '要播放的音效资产'
})
@Serialize()
soundAsset: string = '';
```

策划看到的是资产选择器

### 自定义属性渲染

你可以通过 `renderConfig` 配置自定义属性的渲染方式：

#### 使用自定义渲染器组件

```typescript
@BehaviorProperty({
    label: '颜色',
    type: 'color',
    description: '选择颜色',
    renderConfig: {
        component: 'ColorPicker',  // 编辑器中的渲染器组件名
        props: {
            showAlpha: true,        // 是否显示透明度
            presets: [              // 预设颜色
                '#FF0000',
                '#00FF00',
                '#0000FF'
            ]
        }
    }
})
@Serialize()
color: string = '#FFFFFF';
```

#### 使用曲线编辑器

```typescript
@BehaviorProperty({
    label: '动画曲线',
    type: 'curve',
    description: '编辑动画曲线',
    renderConfig: {
        component: 'CurveEditor',
        props: {
            min: 0,
            max: 1,
            defaultCurve: 'linear'
        },
        style: {
            height: '200px'
        }
    }
})
@Serialize()
curve: string = '';
```

#### 使用项目特定的选择器

```typescript
@BehaviorProperty({
    label: '技能',
    type: 'skill',
    description: '选择技能',
    renderConfig: {
        component: 'SkillSelector',  // 项目自定义的技能选择器
        props: {
            category: 'combat',      // 只显示战斗技能
            maxLevel: 10,
            showIcon: true
        }
    }
})
@Serialize()
skillId: number = 0;
```

#### 使用自定义验证

```typescript
@BehaviorProperty({
    label: 'IP地址',
    type: PropertyType.String,
    description: '输入IP地址',
    validation: {
        pattern: /^(\d{1,3}\.){3}\d{1,3}$/,
        message: '请输入有效的IP地址'
    }
})
@Serialize()
ipAddress: string = '127.0.0.1';
```

#### 使用资产浏览器

```typescript
@BehaviorProperty({
    label: '音效',
    type: 'asset',
    description: '选择音效文件',
    renderConfig: {
        component: 'AssetBrowser',
        props: {
            filter: ['mp3', 'wav', 'ogg'],  // 只显示音频文件
            basePath: 'assets/sounds'        // 默认路径
        }
    }
})
@Serialize()
soundPath: string = '';
```

#### 使用滑块和输入框组合

```typescript
@BehaviorProperty({
    label: '音量',
    type: PropertyType.Number,
    min: 0,
    max: 100,
    renderConfig: {
        component: 'SliderWithInput',  // 滑块+输入框组合控件
        props: {
            showPercentage: true,
            marks: {                    // 刻度标记
                0: '静音',
                50: '中等',
                100: '最大'
            }
        }
    }
})
@Serialize()
volume: number = 80;
```

### 渲染配置说明

`renderConfig` 对象支持以下字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `component` | string | 渲染器组件名称（需在编辑器中注册） |
| `props` | object | 传递给渲染器的属性配置 |
| `className` | string | CSS类名 |
| `style` | object | 内联样式 |

编辑器会根据 `component` 查找对应的渲染器组件，并将 `props` 传递给它。

## 完整示例

### 示例1：攻击动作

```typescript
import { PropertyType } from '@esengine/behavior-tree';

@BehaviorNode({
    displayName: '攻击目标',
    category: '战斗',
    type: NodeType.Action,
    icon: 'Sword',
    description: '对目标造成伤害',
    color: '#FF5722'
})
@ECSComponent('AttackAction')
@Serializable({ version: 1 })
export class AttackAction extends Component {
    @BehaviorProperty({
        label: '伤害值',
        type: PropertyType.Number,
        min: 0,
        max: 999
    })
    @Serialize()
    damage: number = 10;

    @BehaviorProperty({
        label: '攻击类型',
        type: PropertyType.Select,
        options: [
            { label: '近战', value: 'melee' },
            { label: '远程', value: 'ranged' },
            { label: '魔法', value: 'magic' }
        ]
    })
    @Serialize()
    attackType: string = 'melee';

    execute(entity: Entity, blackboard?: BlackboardComponent): TaskStatus {
        const target = blackboard?.getValue('target');
        if (!target) {
            return TaskStatus.Failure;
        }

        // 执行攻击逻辑
        console.log(`使用${this.attackType}攻击，造成${this.damage}点伤害`);

        // 触发事件让游戏逻辑处理
        entity.scene?.eventSystem.emit('ai:attack', {
            attacker: entity,
            target,
            damage: this.damage,
            attackType: this.attackType
        });

        return TaskStatus.Success;
    }
}
```

### 示例2：移动动作

```typescript
@BehaviorNode({
    displayName: '移动到位置',
    category: '移动',
    type: NodeType.Action,
    icon: 'Navigation',
    description: '移动到指定位置',
    color: '#2196F3'
})
@ECSComponent('MoveToPositionAction')
@Serializable({ version: 1 })
export class MoveToPositionAction extends Component {
    @BehaviorProperty({
        label: '目标位置变量',
        type: PropertyType.Blackboard,
        description: '黑板中的目标位置变量'
    })
    @Serialize()
    targetVar: string = 'targetPosition';

    @BehaviorProperty({
        label: '移动速度',
        type: PropertyType.Number,
        min: 0,
        max: 100,
        step: 0.1
    })
    @Serialize()
    speed: number = 5.0;

    @BehaviorProperty({
        label: '到达距离',
        type: PropertyType.Number,
        min: 0.1,
        max: 10
    })
    @Serialize()
    arrivalDistance: number = 0.5;

    execute(entity: Entity, blackboard?: BlackboardComponent, deltaTime?: number): TaskStatus {
        const targetPos = blackboard?.getValue(this.targetVar);
        const currentPos = blackboard?.getValue('position');

        if (!targetPos || !currentPos) {
            return TaskStatus.Failure;
        }

        // 计算距离
        const dx = targetPos.x - currentPos.x;
        const dy = targetPos.y - currentPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 到达目标
        if (distance <= this.arrivalDistance) {
            return TaskStatus.Success;
        }

        // 移动
        const moveDistance = this.speed * (deltaTime || 0);
        const ratio = Math.min(moveDistance / distance, 1);

        currentPos.x += dx * ratio;
        currentPos.y += dy * ratio;
        blackboard?.setValue('position', currentPos);

        return TaskStatus.Running;
    }
}
```

### 示例3：播放动画

```typescript
@BehaviorNode({
    displayName: '播放动画',
    category: '表现',
    type: NodeType.Action,
    icon: 'Film',
    description: '播放角色动画',
    color: '#9C27B0'
})
@ECSComponent('PlayAnimationAction')
@Serializable({ version: 1 })
export class PlayAnimationAction extends Component {
    @BehaviorProperty({
        label: '动画名称',
        type: PropertyType.String,
        required: true
    })
    @Serialize()
    animationName: string = '';

    @BehaviorProperty({
        label: '是否循环',
        type: PropertyType.Boolean
    })
    @Serialize()
    loop: boolean = false;

    execute(entity: Entity, blackboard?: BlackboardComponent): TaskStatus {
        if (!this.animationName) {
            return TaskStatus.Failure;
        }

        // 触发事件让游戏逻辑播放动画
        entity.scene?.eventSystem.emit('ai:playAnimation', {
            entity,
            animationName: this.animationName,
            loop: this.loop
        });

        return TaskStatus.Success;
    }
}
```

## 注册组件

创建好组件后，需要导入以注册到编辑器：

在 `src/game/ai/index.ts` 中：

```typescript
// 导入所有自定义组件以注册到编辑器
import './AttackAction';
import './MoveToPositionAction';
import './PlayAnimationAction';

export function registerCustomActions() {
    // 组件会通过装饰器自动注册
}
```

在游戏初始化时调用：

```typescript
import { registerCustomActions } from './game/ai';

// 在 Core.create() 之前调用
registerCustomActions();
Core.create();
```

## 与游戏逻辑集成

### 方式1：通过事件系统（推荐）

在动作中触发事件：

```typescript
execute(entity: Entity, blackboard?: BlackboardComponent): TaskStatus {
    entity.scene?.eventSystem.emit('ai:attack', {
        attacker: entity,
        target: blackboard?.getValue('target'),
        damage: this.damage
    });
    return TaskStatus.Success;
}
```

在游戏代码中监听：

```typescript
Core.scene.eventSystem.on('ai:attack', (data) => {
    const { attacker, target, damage } = data;
    // 执行实际的战斗逻辑
    target.takeDamage(damage);
});
```

### 方式2：通过黑板传递对象

将游戏对象放入黑板：

```typescript
const blackboard = aiEntity.getComponent(BlackboardComponent);
blackboard?.setValue('gameController', this.gameController);
blackboard?.setValue('player', this.player);
```

在动作中使用：

```typescript
execute(entity: Entity, blackboard?: BlackboardComponent): TaskStatus {
    const gameController = blackboard?.getValue('gameController');
    const player = blackboard?.getValue('player');

    gameController?.attack(player, this.damage);
    return TaskStatus.Success;
}
```

## 最佳实践

### 1. 保持动作简单

每个动作组件应该只做一件事：

```typescript
// 好的做法
class AttackAction { }      // 只负责攻击
class MoveAction { }         // 只负责移动
class PlayAnimationAction { } // 只负责播放动画

// 不好的做法
class AttackAndMoveAndPlayAnimation { }  // 做太多事情
```

### 2. 使用事件解耦

动作不应该直接调用游戏逻辑，而是通过事件：

```typescript
// 好的做法
execute(...): TaskStatus {
    entity.scene?.eventSystem.emit('ai:attack', data);
    return TaskStatus.Success;
}

// 不好的做法
execute(...): TaskStatus {
    // 直接调用游戏代码，导致耦合
    GameManager.instance.battle.performAttack(...);
    return TaskStatus.Success;
}
```

### 3. 参数使用黑板变量

需要动态的值应该从黑板读取：

```typescript
@BehaviorProperty({
    label: '目标变量',
    type: 'blackboard'  // 让策划选择黑板变量
})
targetVar: string = 'target';

execute(...): TaskStatus {
    const target = blackboard?.getValue(this.targetVar);
    // 使用target...
}
```

### 4. 提供合理的默认值

```typescript
@BehaviorProperty({
    label: '伤害值',
    type: 'number',
    min: 0,
    max: 100
})
@Serialize()
damage: number = 10;  // 合理的默认值
```

### 5. 添加详细的描述

```typescript
@BehaviorNode({
    displayName: '攻击目标',
    description: '对黑板中的目标造成伤害，如果目标不存在则失败'  // 清晰的描述
})
@BehaviorProperty({
    label: '伤害值',
    description: '每次攻击造成的伤害值'  // 参数说明
})
```

## 调试技巧

### 添加日志

```typescript
execute(...): TaskStatus {
    console.log(`[AttackAction] 攻击目标，伤害=${this.damage}`);
    // ...
}
```

### 使用黑板监控

```typescript
execute(...): TaskStatus {
    console.log('黑板状态:', blackboard?.getAllVariables());
    // ...
}
```

## 常见问题

### 编辑器中看不到自定义组件？

确保：
1. 组件文件已被导入
2. 使用了正确的装饰器（`@BehaviorNode`、`@ECSComponent`）
3. 类型设置为 `NodeType.Action`

### 参数修改后不生效？

检查：
1. 是否使用了 `@Serialize()` 装饰器
2. 重新加载资产文件
3. 清除缓存重启编辑器

### 如何支持复杂参数？

对于复杂对象，使用JSON字符串：

```typescript
@BehaviorProperty({
    label: '配置（JSON）',
    type: 'code'
})
@Serialize()
configJson: string = '{}';

execute(...): TaskStatus {
    const config = JSON.parse(this.configJson);
    // 使用config...
}
```

## 下一步

- 学习[编辑器工作流](./editor-workflow.md)
- 阅读[最佳实践](./best-practices.md)
