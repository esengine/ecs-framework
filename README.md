Cegret-framework


[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/esengine/egret-framework.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/esengine/egret-framework/context:javascript)

这是一套用于egret的游戏框架，里面包含ECS框架用于管理场景实体，一些常用2D碰撞检测及A*寻路。如果您还需要包含其他的AI系统可以查看作者其他库（行为树、简易FSM、实用AI）。

## 在线框架演示

[非完整游戏演示](http://www.hyuan.org/samples)

## 入门教程

[Getting Start](https://github.com/esengine/egret-framework/wiki/Getting-Start)

打开白鹭工程 替换 `Main.ts` 文件内容

```ts
class Main extends es.Core {
    /** 
     * 由监听事件 egret.Event.ADDED_TO_STAGE后触发的事件
     */
    protected initialize() {
        // 初始化游戏逻辑
    }
    
    /**
    * 由监听事件 egret.Event.ENTER_FRAME后触发的事件
    */
    protected async update(){
        // 如果需要更新方法 不能删除super.update()
        // 会导致框架内所有组件及实体无法更新
        super.update();
        
        // 更新逻辑
    }
    
    /**
    * 在update方法执行完毕后执行 draw方法
    */
    public async draw(){
        // 如果需要绘制方法 不能删除super.draw()
        // 会导致框架内所有渲染组件位置无法更新
        super.draw();
        
        // 绘制逻辑
    }
}
```



## 版本计划功能

- [x] 简易ECS框架
  - [x] 组件列表
    - [x] 碰撞组件
    - [x] 移动组件
    - [x] 滚动精灵组件
    - [x] 平铺精灵组件
    - [x] 序列帧动画组件
    - [x] 相机震动组件
    - [x] 相机组件
    - [x] 组件池
    - [x] 基础碰撞组件（矩形、圆形、多边形碰撞）
    - [x] 场景组件
  - [x] 系统列表
    - [x] 被动系统
    - [x] 协调系统
    - [x] 实体系统
    - [x] 实体解析系统
- [x] 扩展库
  - [x] object扩展
  - [x] string扩展
  - [x] texture扩展
  - [x] time扩展
  - [x] [array扩展（Extension）](https://github.com/esengine/egret-framework/wiki/Array-%E6%89%A9%E5%B1%95%E8%AF%B4%E6%98%8E)
  - [x] base64扩展
  - [x] Stopwatch计数器
  - [x] Input输入帮助
  - [x] [Keyboard键盘帮助](https://github.com/esengine/egret-framework/wiki/KeyboardUtils-%E9%94%AE%E7%9B%98%E5%B8%AE%E5%8A%A9)
  - [x] List池对象
  - [x] Lock锁帮助
  - [x] Emitter事件发射器
  - [x] Random随机类帮助
  - [x] Rectangle矩形帮助类
  - [x] Vector2向量帮助类
  - [x] Content资源管理器
  - [x] 全局管理器
  - [x] 向量集Bitset
- [x] 图形帮助
  - [x] 场景过渡
  - [x] 后处理器
  - [x] 场景渲染器
  - [x] 特效组
- [x] A*寻路(AStar)
- [x] 常用碰撞检测
- [x] 数学库
  - [x] 矩形类（Rectangle）
  - [x] 简易2D矩阵类（Matrix2D）
  - [x] 简易2d 向量类（Vector2）
  - [x] 数学扩展库（MathHelper）
  - [x] 掩码实用类（Flags）
  - [x] 贝塞尔曲线（Bezier）
- [x] 物理系统（简易）
  - [x] Collision碰撞检测
  - [x] ColliderTrigger帮助
  - [x] [Ray2D射线检测](https://github.com/esengine/egret-framework/wiki/Ray2D-2D%E5%B0%84%E7%BA%BF)
  - [x] ShapeCollision 多种形状检测
  - [x] RealtimeCollisions 实时碰撞检测
  - [x] SpatialHash 网格检测
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

