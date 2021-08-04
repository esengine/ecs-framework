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
const hit = es.Physics.linecast( start, end );
if( hit.collider != null )
	console.log( `ray hit ${hit}, entity: {hit.collider.entity}`);
```

我们使用了一些更先进的碰撞/重叠检查方法，如Minkowski和、分离轴定理和古老的三角法。这些都被包装在Collider类上的简单易用的方法中。让我们看一些例子。

第一个例子是处理碰撞的最简单方法。deltaMovement是您希望移动实体的量，通常是velocity*Time.deltaTime. collidesWithAny方法将检查所有碰撞并调整deltaMovement以解决任何碰撞。

```ts
// 碰撞结果将包含一些非常有用的信息，例如被撞的collider，表面命中的法线和最小平移矢量（MTV）。 MTV可用于将碰撞实体直接移动到命中的碰撞器附近。 
let collisionResult = null;

// 进行检查以查看entity.getComponent(Collider)（实体上的第一个碰撞器）是否与场景中的任何其他碰撞器发生碰撞。请注意，如果您有多个碰撞器，则可以获取并遍历它们，而不是仅检查第一个碰撞器。 
if( entity.getComponent(es.Collider).collidesWithAny( deltaMovement, collisionResult ) )
{
	// 记录CollisionResult。 您可能需要使用它来添加一些粒子效果或与您的游戏相关的任何其他内容。
	console.log( `collision result: ${collisionResult}` );
}

// 将实体移到新位置。 已经调整了deltaMovement为我们解决冲突。
entity.position = entity.position.add(deltaMovement);
```

如果您需要对碰撞发生时的情况进行更多控制，则也可以手动检查是否与其他collider发生碰撞。 请注意，执行此操作时，deltaMovement不会为您调整。 解决冲突时，您需要考虑最小平移矢量。 

```ts
let collisionResult = null;

// 进行检查以查看entity.getComponent<Collider>是否与一些其他Collider发生碰撞 
if( entity.getComponent(es.Collider).collidesWith( someOtherCollider, deltaMovement, collisionResult ) )
{
	// 将实体移动到与命中Collider相邻的位置，然后记录CollisionResult 
	entity.position = entity.position.add(deltaMovement.sub(collisionResult.minimumTranslationVector));
	console.log( `collision result: ${collisionResult}` );
}
```
我们可以使用前面提到的Physics.boxcastBroadphase方法或更具体地讲，将自身排除在查询之外的版本，使上述示例更进一步。 该方法将为我们提供场景中所有在我们附近的collider，然后我们可以使用这些对撞机进行实际的碰撞检查。 

```ts
// 在我们自身以外的位置获取可能与之重叠的任何东西
let neighborColliders = es.Physics.boxcastBroadphaseExcludingSelf( entity.getComponent(es.Collider) );

// 遍历并检查每个对撞机是否重叠 
for( let collider of neighborColliders )
{
	if( entity.getComponent(es.Collider).overlaps( collider ) )
		console.log( `我们正在重叠一个collider : ${collider}` );
}
```