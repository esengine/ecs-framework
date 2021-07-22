# 如何开始

## 初始化框架

```typescript
// 参数为false则开启debug模式
es.Core.create(false);
```

## 分发帧事件

```typescript
// 放置于引擎每帧更新处
// dt为可选参数，传入引擎的deltaTime代替框架内的es.Time.deltaTime
es.Core.emitter.emit(es.CoreEvents.frameUpdated, dt);
```

> 尽可能使用引擎的dt，以免再游戏暂停继续时由于dt导致的跳帧问题

> **您还需要一个默认的场景以使得游戏可以进行使用ecs框架以及物理类或tween系统**

## 创建场景类

场景类需要继承框架中的 `es.Scene`

```typescript
export class MainScene extends es.Scene {
    /**
     * 可重写方法，从contructor中调用这个函数
     */
    initialize() {
        console.log('initialize');
    }

    /**
     *  可重写方法。当Core将这个场景设置为活动场景时调用
     */
    onStart() {
        console.log('onStart');
    }

    /**
     *  可重写方法。当Core把这个场景从活动槽中移除时调用。
     */
    unload() {
        console.log('unload');
    }

    /**
     * 可重写方法。
     */
    update() {
        // 如果重写update方法 一定要调用该方法
        // 不调用将导致实体无法加入/组件无法更新
        super.update();
    }
}
```

要想激活该场景需要通过核心类 `Core` 来设置当前 `MainScene` 为使用的场景

```typescript
es.Core.scene = new MainScene();
```

# 下一章节
- [创建实体与组件](create_entity_component.md)
- [创建系统](system.md)