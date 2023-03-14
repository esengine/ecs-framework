# 如何开始

## 初始化框架

```typescript
// 创建调试模式下的`Core`实例
const core = es.Core.create();

// 创建非调试模式下的`Core`实例
const core = es.Core.create(false);
```

## 分发帧事件

```typescript
// dt 是一个可选参数，如果传入了 es.Time.deltaTime或者不传入参数，则代表使用框架的内置的时间差来更新游戏状态；
// 如果传入了游戏引擎自带的 deltaTime，则代表使用该值来更新游戏状态。
// 在 es.Core.update 方法中，会根据 dt 的值来计算时间戳信息，并更新全局管理器和当前场景的状态
es.Core.emitter.emit(es.CoreEvents.frameUpdated, dt);
```

> 尽可能使用引擎的dt，以免再游戏暂停继续时由于dt导致的跳帧问题

> **您还需要一个默认的场景以使得游戏可以进行使用ecs框架以及物理类或tween系统**

## 创建场景类

场景类需要继承框架中的 `es.Scene`

```typescript
/** 示例场景 */
export class MainScene extends Scene {
    constructor() {
        super();
    }

    /**
    * 初始化场景，添加实体和组件
    *
    * 这个方法会在场景被创建时被调用。我们在这个方法中创建了一个实体，
    * 并向它添加了一个SpriteRender组件和一个TransformMove组件。
    */
    public initialize() {
        // 创建一个实体
        let entity = this.createEntity("Player");

        // 添加一个SpriteRender组件，用于显示实体的图像
        let spriteRender = entity.addComponent(new SpriteRender());
        spriteRender.sprite = new es.Sprite(new es.Texture("player.png"));

        // 添加一个TransformMove组件，用于移动实体
        let transformMove = entity.addComponent(new TransformMove());
        transformMove.speed = 50;
    }

    /**
    * 场景开始运行时执行的操作
    *
    * 这个方法会在场景开始运行时被调用。我们在这个方法中输出一条消息表示场景已经开始运行。
    */
    public onStart() {
        console.log("MainScene has started!");
    }

    /**
    * 场景被销毁时执行的操作
    *
    * 这个方法会在场景被销毁时被调用。我们在这个方法中输出一条消息表示场景已经被卸载。
    */
    public unload() {
        console.log("MainScene has been unloaded!");
    }
}
```

要想激活该场景需要通过核心类 `Core` 来设置当前 `MainScene` 为使用的场景

```typescript
es.Core.scene = new MainScene();
```