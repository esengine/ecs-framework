这是一套ecs游戏框架，里面包含ECS框架用于管理场景实体，一些常用2D碰撞检测及游戏中常用的工具

# 项目规划及讨论
- [点击参与及查看](https://github.com/esengine/ecs-framework/discussions/36)

## 交流群
点击链接加入群聊【ecs游戏框架交流】：https://jq.qq.com/?_wv=1027&k=29w1Nud6

## 快速开始
- 初始化框架
```typescript
es.Core.create();
```
- 派发帧事件
```typescript
es.Core.emitter.emit(es.CoreEvents.frameUpdated);
```
完成以上对框架的初始化，您还需要一个默认场景并激活它，新建一个场景类并继承`es.Scene`

```typescript
class MainScene extends es.Scene { }
```

- 激活场景
```typescript
es.Core.scene = new MainScene();
```

至此框架已完全开始运作，您可以使用框架内所有提供的方法。

## ECS框架的基本使用

#### 创建实体

创建实体一般由场景控制。您需要在场景内进行创建或添加实体（`createEntity` / `addEntity`）

> 注意：创建实体需要在场景`onStart`方法进行创建，而不是直接在`initialize`方法内创建。`initialize` 只是在构造函数完成后进行调用，此时该场景并未被激活。

```typescript
class MainScene extends es.Scene {
    onStart() {
        // 创建一个名为player的实体
        const player = this.createEntity("player");
    }
}
```

#### 添加组件

每个实体都会有多个组件，如果我们需要实体能够拥有一个新的能力，则需要给它添加相对应的组件，组件必须继承 `es.Component` 来标志为组件。

> 注意：组件一般没有具体逻辑，一般只存放一些属性，逻辑应该由系统进行调用

```typescript
class MovementComponent extends es.Component { 
    // 定义该实体的移动速度
    public moveSpeed: number = 100;
}
```

- 将组件添加至Player实体上(`addComponent`)

```typescript
class MainScene extends es.Scene {
    onStart() {
        // 创建一个名为player的实体，createEntity方法会将创建的实体返回给你
        const player = this.createEntity("player");
        // 为实体添加一个移动组件，addComponent会将新建的移动组件返回给你
        const moveComponent = player.addComponent(new MovementComponent())
    }
}
```

#### 添加系统

系统里会使用`Matcher`类帮助过滤它所感兴趣的实体并对其进行更新。我们一般定义系统会与对应的组件相匹配，刚我们创建了一个移动组件，则相对应的就会有一个移动系统来处理该类型的组件。

这里我们使用`es.EntityProcessingSystem`，因为我们要对带有移动组件的实体进行更新。

> 系统也分多种类型，分为管理实体的系统(`es.EntityProcessingSystem`)/管理系统的系统(`es.ProcessingSystem`)

```typescript
class MoveSystem extends es.EntityProcessingSystem {
    // 必须实现
    processEntity(entity: Entity) {
        // 这里会传入带有MoveComponent的实体
        // 为什么会传入只带有MoveComponent的实体? 
        // 因为在构造函数中有一个Matcher匹配器，在你初始化MoveSystem的时候需要你传入匹配的对象. 见下方如何定义匹配带MoveComponent的匹配器

        // 该方法每帧都会执行，请确保您的操作尽可能的小或者在使用大数据时采用缓存的方法进行获取操作
    }
}
```

##### 定义Matcher匹配器匹配所有带MoveComponent的实体

```typescript
// 这里你可以传入多个组件类型
const matcher = Matcher.empty().all(MovementComponent);
```

#### 激活系统

使用`addEntityProcessor`方法进行添加系统

```typescript
class MainScene extends es.Scene {
    onStart() {
        const matcher = Matcher.empty().all(MovementComponent);
        // 将所有带MoveComponent的实体送到该系统处理
        this.addEntityProcessor(new MoveSystem(matcher));

        // 创建一个名为player的实体，createEntity方法会将创建的实体返回给你
        const player = this.createEntity("player");
        // 为实体添加一个移动组件，addComponent会将新建的移动组件返回给你
        const moveComponent = player.addComponent(new MovementComponent());
    }
}
```

至此所有的快速开始的学习到此为止，如果上述运行过程您已看懂，则框架的基本知识你已经掌握，框架内还含有部分内置组件和更高级的用法，您刚所学习的只是框架的冰山一角，如果您需要学习更多的话可以查看源码或查阅更多资料进行学习。

### 示例地址

#### [laya-demo](https://github.com/esengine/ecs-laya-demo)
#### [egret-demo](https://github.com/esengine/ecs-egret-demo)

## 扩展库

#### [基于ecs-framework开发的astar/BreadthFirst/Dijkstra/GOAP目标导向计划 路径寻找库](https://github.com/esengine/ecs-astar)
#### [基于ecs-framework开发的AI（BehaviourTree、UtilityAI）系统](https://github.com/esengine/BehaviourTree-ai))

## 关于用ecs框架（typescript/javascript）
ecs 是功能强大的实体组件系统。typescript与其他语言不同，因此我对ecs的设计尽可能的支持typescript特性。虽然ecs拥有标准实体组件系统，但在细节上有很大不同。创建标准ecs通常处于原始速度、缓存位置和其他性能原因。使用typescript，我们没有struct，因为没有必要匹配标准实体组件系统的设计方式，因为我们对内存布局没有那种控制。

ecs更灵活，可以更好的集中、组织、排序和过滤游戏中的对象。ecs让您拥有轻量级实体和组件，这些组件可以由系统批量处理。
例如，您在制作一个射手，您可能会有几十到几百个子弹，这些作为轻量级实体由系统批量处理。

所以ecs在设计当中拥有四种重要类型：世界（Scene），过滤器（Matcher），系统（System）和实体(Entity)

## [世界（Scene）](https://github.com/esengine/egret-framework/wiki/%E5%9C%BA%E6%99%AF-Scene)
Scene是ecs包含系统和实体最外面的容器。

## 实体（Entity）
实体只由系统处理。

## 组件(Component)
组件应该只包含数据而没有逻辑代码。对数据进行逻辑是系统的工作。

## 系统（System）
ecs中的系统会不断的更新实体。系统使用过滤器选择某些实体，然后仅更新那些选择的实体。

