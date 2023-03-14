ecs-framework 的目标是成为功能强大的框架。它为您构建游戏提供了坚实的基础。它包括的许多功能包括：

- 完整的场景/实体/组件系统
- SpatialHash是一种空间散列数据结构，用于加速2D物理引擎的碰撞检测，它能够将物体分割为多个小区域并快速查询每个区域内包含的物体，从而大幅度提高碰撞检测的效率。
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
Scene表示游戏场景，是所有实体和组件的容器；Entity表示游戏场景中的实体，是组件的容器；Component表示游戏实体中的组件，包含实体的具体行为逻辑。

### Scene
这是一个ECS（Entity-Component-System）框架的场景类，用于管理游戏中的实体和处理器。它具有以下特点：

- 维护了一个实体列表和一个实体处理器列表，以便在游戏中轻松添加、更新和删除实体。
- 具有实体、组件和处理器的基本结构，可帮助您组织代码并实现分离的关注点。
- 可以添加和删除场景组件，这是一个特殊类型的组件，可用于实现场景范围的逻辑。
- 通过使用实体处理器，可以轻松地处理实体的更新和渲染。
- 可以搜索场景中的实体、组件和处理器，并根据需要添加或删除它们。
- 可以为实体分配唯一的标识符，以便在处理实体时轻松地跟踪它们。

### Entity
Entity 是ECS中的一个基础概念，它代表了游戏中的实体。每个 Entity 都有唯一的 ID 和名称，可以在一个 Scene 中被创建、添加、删除和管理。

在一个 Entity 中，可以添加多个 Component 来实现不同的功能。例如，Transform Component 用来表示实体的位置、旋转和缩放等变换属性，其他自定义的 Component 则可以实现各种具体的游戏逻辑。

在 Entity 中，可以通过以下方法来管理 Component：

- createComponent(componentType: new (...args) => T): T 用来创建并返回一个指定类型的 Component 实例。
- addComponent<T extends Component>(component: T): T 用来添加一个已有的 Component 实例。
- getComponent<T extends Component>(type: new (...args) => T): T 用来获取指定类型的 Component 实例。
- getComponentInScene<T extends Component>(type: new (...args) => T): T 用来获取指定类型的 Component 实例，但会在整个场景中搜索。
- tryGetComponent<T extends Component>(type: new (...args) => T, outComponent: Ref<T>): boolean 用来尝试获取指定类型的 Component 实例，并将结果存储在传入的 outComponent 参数中。
- hasComponent<T extends Component>(type: new (...args) => T): boolean 用来检查 Entity 是否有指定类型的 Component 实例。
- getOrCreateComponent<T extends Component>(type: new (...args) => T): T 如果 Entity 没有指定类型的 Component 实例，将会创建一个并返回。
此外，还可以通过 removeComponent() 方法来移除一个指定的 Component 实例，或者 removeAllComponents() 方法来移除 Entity 中的所有 Component 实例。

最后，在 Entity 中还可以通过 Tween 类来实现各种动画效果，例如 tweenPositionTo()、tweenScaleTo() 和 tweenRotationDegreesTo() 等方法。

以下是Entity类中一些关键和重要的属性：

- scene：实体所属的场景对象。
- name：实体的名称。
- id：实体的唯一标识符。
- transform：实体的变换组件。
- components：实体的组件列表。
- updateInterval：实体更新间隔，用于控制实体的更新频率。
- componentBits：用于标记实体拥有哪些组件。
这些属性是Entity类中非常重要的，它们可以用来操作和控制实体的行为和状态。其中，transform和components属性是实体最为关键的组成部分，前者用于操作实体的位置、旋转和缩放等变换信息，后者用于添加、删除、查询和更新实体的组件信息。通过这些属性，我们可以非常方便地构建出自己的游戏对象，并实现一些基本的功能，如移动、碰撞、动画、音效等。

### Component
这是一个用于构建实体组件系统的基本组件类，所有其他组件都应该从这个抽象类派生。每个组件都可以与一个实体相关联，可以通过实体来访问其它组件。

重要属性：

- id: 组件的唯一标识符。
- entity: 附加此组件的实体。
重要方法：

- addComponent<T extends Component>(component: T): T：将指定的组件添加到此组件所在的实体中。
- getComponent<T extends Component>(type: new (...args: any[]) => T): T：获取指定类型的组件。
- getComponents(typeName: any, componentList?: any[]): any[]：获取指定类型的组件数组。
- hasComponent(type: new (...args: any[]) => Component): boolean：判断实体是否包含指定类型的组件。
- removeComponent(component?: Component): void：从此组件所在的实体中删除指定的组件，如果未指定组件，则删除此组件本身。
此外，组件还具有一些生命周期方法，例如 initialize()、onAddedToEntity()、onRemovedFromEntity()、onEntityTransformChanged()、onEnabled()、onDisabled() 等，这些方法可以根据需要在派生类中进行重写，以便在实体上添加或移除组件时执行相应的操作。


## Debug
这是一个静态类 Debug，它包含了一些方法用于打印调试信息。其中包含的方法如下：

- warnIf(condition: boolean, format: string, ...args: any[]): 如果 condition 为 true，则打印警告信息。
- warn(format: string, ...args: any[]): 打印警告信息。
- error(format: string, ...args: any[]): 打印错误信息。
- log(type: LogType, format: string, ...args: any[]): 打印指定类型的信息，可选的类型有 error、warn、log、info 和 trace。
该类的优点是它提供了一种统一的调试信息输出方式，可以帮助开发者更方便地输出调试信息，以便在调试时更快地定位问题。缺点是它的功能比较单一，只能输出调试信息，不能对调试信息进行更加复杂的处理。

## Flags
这是一个静态工具类 Flags，提供了一些位标志操作的方法：

- isFlagSet：检查位标志是否已在数值中设置（该标志未移位）
- isUnshiftedFlagSet：检查位标志是否在数值中设置（该标志已移位）
- setFlagExclusive：设置数值标志位，移除所有已经设置的标志
- setFlag：设置标志位
- unsetFlag：取消标志位
- invertFlags：反转数值集合位
- binaryStringRepresentation：打印 number 的二进制表示，方便调试 number 标志。

### 如何参与项目
#### Node.js版本
v10.20.1 
#### 操作步骤
1. 进入source目录
2. 安装package包: `npm install`
3. 打包成js: `gulp build`
> 如遇到gulp未找到则先执行 `npm install gulp -g`

## 扩展库

#### [基于ecs-framework开发的astar/BreadthFirst/Dijkstra/GOAP目标导向计划 路径寻找库](https://github.com/esengine/ecs-astar)
#### [基于ecs-framework开发的AI（BehaviourTree、UtilityAI）系统](https://github.com/esengine/BehaviourTree-ai)
