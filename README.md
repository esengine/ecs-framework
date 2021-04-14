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
        const moveComponent = entity.getComponent(MovementComponent);
        if (!moveComponent.enabled)
            return;

        // 根据moveComponent的数据执行移动的逻辑
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

## 关于 Physics/Collision
框架中的物理不是一个真实的物理模拟。它只提供了游戏物理。您可以执行一些操作，如检测碰撞器、重叠检查、碰撞检查、扫描测试等。不是一个完整的刚体模拟。

### Colliders 物理系统的根本
没有Collider，在物理系统中什么也不会发生。 碰撞器存在于实体类中，有几种类型：BoxCollider，CircleCollider和PolygonCollider。 您可以像这样添加Collider：`entity.addComponent(new BoxCollider())`. 将碰撞器添加到Entity时，它们会自动添加到SpatialHash中。 

### SpatialHash：你永远不会用到它，但它仍然对你很重要 
SpatialHash类是一个隐藏类，该类为您的游戏全局管理 `collider`。静态物理类是SpatialHash的公共包装器。 SpatialHash没有设置大小限制，用于快速进行碰撞/线投射/重叠检查。例如，如果你有一个英雄在世界各地移动，而不必检查每个对撞机（可能是数百个）是否发生碰撞，则只需向SpatialHash询问英雄附近的所有collider即可。这大大缩小了您的碰撞检查范围。

SpatialHash有一个可配置的方面，它可以极大地影响其性能：单元大小。 SpatialHash将空间分成一个网格，选择适当的网格大小可以将可能发生的碰撞查询减到最少。默认情况下，网格大小为100像素。您可以通过在创建场景之前设置`Physics.SpatialHashCellSize`来更改此设置。选择比您的平均玩家/敌人人数稍大的尺寸通常效果最佳。

### Physics 类
物理类是物理的核心类。 您可以设置一些属性，例如前面提到的spatialHashCellSize，raycastsHitTriggers和raycastsStartInColliders。
- linecast：从开始到结束投射一条线，并返回与layerMask相匹配的碰撞器的第一次命中
- overlapRectangle：检查是否有任何collider在矩形区域内 
- overlapCircle：检查是否有任何collider在圆形区域内 
- boxcastBroadphase：返回边界与collider.bounds相交的所有碰撞器。 请注意，这是一个broadphase检查，因此它只检查边界，不执行单个碰撞器到碰撞器的检查！

会注意到上面提到的layerMask。 layerMask允许您确定与哪些碰撞器碰撞。 每个collider都可以设置其物理层，以便在查询物理系统时可以选择仅检索与传入的layerMask匹配的对撞机。 所有物理方法都接受默认为所有图层的图层蒙版参数。 使用此选项可以过滤冲突检查，并通过不执行不必要的冲突检查来使性能保持最佳状态。 

### 使用物理系统
射线检测对于检查敌人的视线、探测实体的空间环境、快速移动的子弹等各种事情都非常有用。下面是一个从头到尾投射线条的示例，如果击中某个物体，它只会记录数据：
```ts
const hit = Physics.linecast( start, end );
if( hit.Collider != null )
	console.log( `ray hit ${hit}, entity: {hit.collider.entity}`);
```

我们使用了一些更先进的碰撞/重叠检查方法，如Minkowski和、分离轴定理和古老的三角法。这些都被包装在Collider类上的简单易用的方法中。让我们看一些例子。

第一个例子是处理碰撞的最简单方法。deltaMovement是您希望移动实体的量，通常是velocity*Time.deltaTime. collidesWithAny方法将检查所有碰撞并调整deltaMovement以解决任何碰撞。

```ts
// 碰撞结果将包含一些非常有用的信息，例如被撞的collider，表面命中的法线和最小平移矢量（MTV）。 MTV可用于将碰撞实体直接移动到命中的碰撞器附近。 
let collisionResult = null;

// 进行检查以查看entity.getComponent<Collider>（实体上的第一个碰撞器）是否与场景中的任何其他碰撞器发生碰撞。请注意，如果您有多个碰撞器，则可以获取并遍历它们，而不是仅检查第一个碰撞器。 
if( entity.getComponent<Collider>().collidesWithAny( deltaMovement, collisionResult ) )
{
	// 记录CollisionResult。 您可能需要使用它来添加一些粒子效果或与您的游戏相关的任何其他内容。
	console.log( `collision result: ${collisionResult}` );
}

// 将实体移到新位置。 已经调整了deltaMovement为我们解决冲突。
entity.position = Vector2.add(entity.position, deltaMovement);
```

如果您需要对碰撞发生时的情况进行更多控制，则也可以手动检查是否与其他collider发生碰撞。 请注意，执行此操作时，deltaMovement不会为您调整。 解决冲突时，您需要考虑最小平移矢量。 

```ts
let collisionResult = null;

// 进行检查以查看entity.getComponent<Collider>是否与一些其他Collider发生碰撞 
if( entity.getComponent<Collider>().collidesWith( someOtherCollider, deltaMovement, collisionResult ) )
{
	// 将实体移动到与命中Collider相邻的位置，然后记录CollisionResult 
	entity.position = Vector2.add(entity.position, Vector2.substract(deltaMovement, collisionResult.minimumTranslationVector));
	console.log( `collision result: ${collisionResult}` );
}
```
我们可以使用前面提到的Physics.boxcastBroadphase方法或更具体地讲，将自身排除在查询之外的版本，使上述示例更进一步。 该方法将为我们提供场景中所有在我们附近的collider，然后我们可以使用这些对撞机进行实际的碰撞检查。 

```ts
// 在我们自身以外的位置获取可能与之重叠的任何东西
let neighborColliders = Physics.boxcastBroadphaseExcludingSelf( entity.getComponent<Collider>() );

// 遍历并检查每个对撞机是否重叠 
for( let collider of neighborColliders )
{
	if( entity.getComponent<Collider>().overlaps( collider ) )
		console.log( `我们正在重叠一个collider : ${collider}` );
}
```

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

