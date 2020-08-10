# egret-framework


[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/esengine/egret-framework.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/esengine/egret-framework/context:javascript)

这是一套用于egret的游戏框架，里面包含ECS框架用于管理场景实体，一些常用2D碰撞检测及A*寻路。如果您还需要包含其他的AI系统可以查看作者其他库（行为树、简易FSM、实用AI）。

## 版本计划功能

- [x] 简易ECS框架
  - [x] 组件列表
    - [x] 碰撞组件
    - [x] 移动组件
    - [ ] 刚体组件
    - [ ] 点光源/灯光组件
    - [ ] 阴影组件
    - [ ] 轨迹组件
    - [x] 滚动组件
    - [ ] 网格弹簧组件
    - [ ] 相机震动组件
    - [ ] 霓虹灯组件
    - [x] 跟随相机组件
  - [x] 系统列表
    - [x] 被动系统
    - [x] 协调系统
- [x] A*寻路(AStar)
- [x] 常用碰撞检测
- [x] 数学库
  - [x] 简易矩阵类
  - [x] 简易2d 向量类
  - [x] 掩码实用类
  - [x] 贝塞尔曲线
  - [x] 快速随机数类
- [x] BreadthFirst 寻路算法
- [x] Dijkstra 寻路算法
- [x] 事件处理器

## 关于egret用ecs框架（typescript/javascript）
ecs 是功能强大的实体组件系统。typescript与其他语言不同，因此我对ecs的设计尽可能的支持typescript特性。虽然ecs拥有标准实体组件系统，但在细节上有很大不同。创建标准ecs通常处于原始速度、缓存位置和其他性能原因。使用typescript，我们没有struct，因为没有必要匹配标准实体组件系统的设计方式，因为我们对内存布局没有那种控制。

ecs更灵活，可以更好的集中、组织、排序和过滤游戏中的对象。ecs让您拥有轻量级实体和组件，这些组件可以由系统批量处理。
例如，您在制作一个射手，您可能会有几十到几百个子弹，这些作为轻量级实体由系统批量处理。

所以ecs在设计当中拥有四种重要类型：世界（Scene），过滤器（Matcher），系统（System）和实体(Entity)

## 世界（Scene）
Scene是ecs包含系统和实体最外面的容器。

## 实体（Entity）
实体只由系统处理。

## 组件(Component)
组件应该只包含数据而没有逻辑代码。对数据进行逻辑是系统的工作。

## 系统（System）
ecs中的系统会不断的更新实体。系统使用过滤器选择某些实体，然后仅更新那些选择的实体。

## 作者其他库（egret）

- [行为树/实用AI 系统](https://github.com/esengine/egret-BehaviourTree-ai)

