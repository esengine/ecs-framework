ecs-framework 的目标是成为功能强大的框架。它为您构建游戏提供了坚实的基础。它包括的许多功能包括：

- 完整的场景/实体/组件系统
- SpatialHash用于超快速的广相物理学查找。您永远不会看到它，因为它在幕后起作用，但是您仍然会喜欢它，因为它可以通过射线广播或重叠检查迅速找到您附近的所有事物。
- AABB，圆和多边形碰撞/触发检测
- 高效的协程，可在多个帧或动画定时中分解大型任务（Core.startCoroutine）
- 通过Astar和广度优先搜索提供寻路支持，以查找图块地图或您自己的自定义格式 ( 参见 https://github.com/esengine/ecs-astar )
- tween系统。任何number / Vector / 矩形/字段或属性都可以tween。
- 针对核心事件的优化的事件发射器（发射器类），您也可以将其添加到自己的任何类中
- 延迟和重复任务的调度程序（核心调度方法）

# 快速开始
- [运行框架](docs/getting_start.md)
- [创建实体与组件](docs/create_entity_component.md)
- [创建系统](docs/system.md)
- [全局时间Time](docs/time.md)
- [协程Coroutine](docs/coroutine.md)
- [Physics](docs/physics.md)
- [Emitter](docs/emitter.md)
- [Collision](docs/collision.md)

## 交流群
点击链接加入群聊【ecs游戏框架交流】：https://jq.qq.com/?_wv=1027&k=29w1Nud6


## Scene/Entity/Component
框架的大部分围绕着实体组件系统（ECS）。ECS与您可能使用过的任何其他ECS均不同，所以我为您再以下详细介绍。

### Scene
ECS的根源。可以将场景视为游戏的不同部分，在适当的时间调用它们的方法。您也可以使用场景通过findEntity和findEntitiesByTag方法定位实体。

场景可以包含一种称为场景组件的特殊类型的组件。 SceneComponent通过add / get / removeSceneComponent方法进行管理。可以将场景组件视为简化组件。它包含少量可重写的生命周期方法（onEnabled / onDisabled / update / onRemovedFromScene）。当您需要一个位于场景级别但不需要实体容器的对象时，可以使用这些对象。 

### Entity
将实体添加到场景中/从场景中删除，并由场景进行管理。 您可以子类化Entity，也可以只创建一个Entity实例，然后向其中添加任何必需的组件（通过addComponent，然后通过getComponent检索）。 在实体的最基本层次上，可以将其视为组件的容器。 实体具有一系列在整个生命周期中的不同时间被场景调用的方法。

实体生命周期方法： 
- onAddedToScene：在将所有未决的实体更改提交后将实体添加到场景中时调用
- onRemovedFromScene：当实体从场景中移除时调用
- update：只要启用了实体，就会每帧调用

实体上的一些关键/重要属性如下： 

- updateOrder：控制实体的顺序。 这会影响在每个实体上调用更新的顺序以及标签列表的顺序。
- tag：随便使用它。 以后可以使用它在场景中查询具有特定标签（Scene.findEntitiesByTag）的所有实体。
- updateInterval：指定应多久调用一次此Entities更新方法。 1表示每帧，2表示每两帧，依此类推 

### Component
组件添加到实体并由实体管理。 它们构成了您游戏的重点，并且基本上是可重用的代码块，这些代码决定了实体的行为方式。

组件生命周期方法： 

- initialize：在创建组件并分配Entity字段但在onAddedToEntity之前调用
- onAddedToEntity：在将所有未决组件更改提交后将组件添加到实体时调用
- onRemovedFromEntity：当组件从其实体中移除时调用。 在这里进行所有清理。
- onEntityPositionChanged：在实体位置更改时调用。 这使组件可以知道它们是由于父实体移动而移动的。
- update：只要启用了实体和组件并且组件实现IUpdatable，就会每帧调用
- onEnabled：在启用父实体或组件时调用
- onDisabled：在禁用父实体或组件时调用 


## Debug
Debug类提供日志记录。 Insist类提供各种断言条件。 您可以在整个代码中自由使用它们。 

## Flags
您是否喜欢将大量数据打包为单个number的功能，但讨厌处理该数据的语法？ Flags类可以为您提供帮助。 它包括用于处理number的辅助方法，以检查是否设置了位以及设置/取消设置了它们。 处理Collider.physicsLayer非常方便。 

### 示例地址

#### [laya-demo](https://github.com/esengine/ecs-laya-demo)
#### [egret-demo](https://github.com/esengine/ecs-egret-demo)

### 渲染集成框架
#### [cocos-framework](https://github.com/esengine/cocos-framework)

## 扩展库

#### [基于ecs-framework开发的astar/BreadthFirst/Dijkstra/GOAP目标导向计划 路径寻找库](https://github.com/esengine/ecs-astar)
#### [基于ecs-framework开发的AI（BehaviourTree、UtilityAI）系统](https://github.com/esengine/BehaviourTree-ai))
