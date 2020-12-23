这是一套ecs游戏框架，里面包含ECS框架用于管理场景实体，一些常用2D碰撞检测及游戏中常用的工具

## 交流群
点击链接加入群聊【ecs游戏框架交流】：https://jq.qq.com/?_wv=1027&k=29w1Nud6

### 示例地址

- [laya-demo](https://github.com/esengine/ecs-laya-demo)
- [egret-demo](https://github.com/esengine/ecs-egret-demo)

## 扩展库

- [基于ecs-framework开发的astar/BreadthFirst/Dijkstra/GOAP目标导向计划 路径寻找库](https://github.com/esengine/ecs-astar)
- [基于ecs-framework开发的AI（BehaviourTree、UtilityAI）系统](https://github.com/esengine/BehaviourTree-ai))

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

