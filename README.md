这是一套ecs游戏框架，里面包含ECS框架用于管理场景实体，一些常用2D碰撞检测及游戏中常用的工具

## 交流群
点击链接加入群聊【ecs游戏框架交流】：https://jq.qq.com/?_wv=1027&k=29w1Nud6

## Getting Start

1. 初始化核心

```typescript
// 传入舞台宽高确定屏幕大小
let core = new es.Core(768, 1366);
```

2. 派发核心事件

```typescript
// 在监听每帧更新时间处执行 egret写法:
es.Time.update(egret.getTimer());
// 在监听每帧更新时间处执行 laya写法:
// laya 使用 Laya.timer.frameLoop 进行侦听
// es.Time.update(Laya.systemTimer.currTimer);
// 必须派发该事件 否则核心内所有更新事件将不会执行
es.Core.emitter.emit(es.CoreEvents.FrameUpdated);
```

3. 创建主场景

```typescript
// 继承es.Scene来确定这是一个场景
class MainScene extends es.Scene {
  public initialize(){
    // 当场景构造函数执行完成后执行
  }
  public async onStart() {
    // 当场景被激活时执行
  }
}
```

4. 创建组件

```typescript
// 敌人组件 继承es.Component确定他是一个组件
// 组件当中不应该含有具体逻辑 只存储数据/属性
class SpawnerComponent extends es.Component {
    public cooldown: number = -1;
    public minInterval: number = 2;
    public maxInterval: number = 60;
    public minCount: number = 1;
    public maxCount: number = 1;
    public enemyType: EnemyType = EnemyType.worm;
    public numSpawned: number = 0;
    public numAlive: number = 0;

    constructor(enemyType: EnemyType) {
        super();
        this.enemyType = enemyType;
    }
}

enum EnemyType {
  worm
}
```

5. 创建系统

```typescript
// 每个组件应对应一个系统 系统中负责游戏逻辑
class SpawnerSystem extends es.EntityProcessingSystem {
  // 必须实现的构造函数
  constructor(matcher: es.Matcher){
      super(matcher);
  }

  // 当满足条件的实体会被派发至这统一进行处理
  // 条件在Matcher中进行设置
  processEntity(entity: es.Entity){
      let spawner = entity.getComponent<component.SpawnerComponent>(component.SpawnerComponent);
      if (spawner.numAlive <= 0)
          spawner.enabled = true;
      
      if (!spawner.enabled)
          return;

      if (spawner.cooldown <= -1) {
          this.scheduleSpawn(spawner);
          console.log("冷却时间已到，进入下一轮刷新 冷却时间:", spawner.cooldown);
          spawner.cooldown /= 4;
      }

      spawner.cooldown -= es.Time.deltaTime;
      if (spawner.cooldown <= 0) {
          this.scheduleSpawn(spawner);

          for (let i = 0; i < RandomUtils.randint(spawner.minCount, spawner.maxCount); i ++) {
              console.log("创建敌人", entity.position.x, entity.position.y, spawner.enemyType, entity);
              spawner.numSpawned ++;
              spawner.numAlive++;
          }

          if (spawner.numAlive > 0)
              spawner.enabled = false;
      }
  }

  private scheduleSpawn(spawner: component.SpawnerComponent) {
      spawner.cooldown = RandomUtils.randint(spawner.minInterval, spawner.maxInterval);
  }
}
```

6. 创建实体、添加组件、激活实体处理器

```typescript
class MainScene extends es.Scene {
  public async onStart() {
      // 创建实体
      let spawn = this.createEntity("spawn");
      // 添加组件
      spawn.addComponent(new component.SpawnerComponent(component.EnemyType.worm));

      // 添加实体处理
      // Matcher.all 代表对带有该组件的实体进行处理
      // Matcher.one 代表对至少有一个该组件的实体进行处理
      // Matcher.exclude 代表对不带该组件的实体进行处理
      this.addEntityProcessor(new system.SpawnerSystem(new es.Matcher().all(component.SpawnerComponent)));
  }
}
```

7. 激活场景

```typescript
// 设置MainScene为当前激活的场景
es.Core.scene = new MainScene();
```

### 示例地址

- [egret-demo](https://github.com/esengine/ecs-egret-demo)
- [laya-demo](https://github.com/esengine/ecs-laya-demo)

## 扩展库

- [基于ecs-framework开发的astar/BreadthFirst/Dijkstra/GOAP目标导向计划 路径寻找库](https://github.com/esengine/ecs-astar)
- [基于ecs-framework开发的AI（BehaviourTree、UtilityAI）系统](https://github.com/esengine/BehaviourTree-ai))

## 版本计划功能

- [x] 简易ECS框架
  - [x] 组件列表
    - [x] 碰撞组件
    - [x] 移动组件
    - [x] 组件池
    - [x] 基础碰撞组件（矩形、圆形、多边形碰撞）
    - [x] 场景组件
  - [x] 系统列表
    - [x] 被动系统
    - [x] 协调系统
    - [x] 实体系统
    - [x] 实体解析系统
- [x] 扩展库
  - [x] string扩展
  - [x] time扩展
  - [x] [array扩展（Extension）](https://github.com/esengine/egret-framework/wiki/Array-%E6%89%A9%E5%B1%95%E8%AF%B4%E6%98%8E)
  - [x] base64扩展
  - [x] Stopwatch计数器
  - [x] List池对象
  - [x] Emitter事件发射器
  - [x] Random随机类帮助
  - [x] Rectangle矩形帮助类
  - [x] Vector2向量帮助类
  - [x] 全局管理器
  - [x] 向量集Bitset
- [x] 图形帮助
  - [x] 场景过渡
  - [x] 场景渲染器
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
- [x] 事件处理器

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

