# scene_component
这是一个场景组件的基类，如果您需要一个不在实体上的组件则继承它 `es.SceneComponent`。场景组件默认包含`update`/`onEnabled`/`onDisabled`/`onRemovedFromScene`，你可以对他们进行重载。

```typescript
export class ASceneComponent extends es.SceneComponent {
    /**
     * 在启用此SceneComponent时调用
     */
    onEnabled() {

    }

    /**
     * 当禁用此SceneComponent时调用
     */
    onDisabled() {

    }

    /**
     * 当该SceneComponent从场景中移除时调用
     */
    onRemovedFromScene() {

    }

    update() {

    }
}
```

- 场景组件需要添加至场景上, 通过场景中的 `addSceneComponent` 方法加入。

```typescript
export class MainScene extends es.Scene {
    onStart() {
        const aSceneCom = this.addSceneComponent(new ASceneComponent());
    }
}
```

- 如果想要获取该场景组件则通过`getSceneComponent`方法获取

```typescript
export class MainScene extends es.Scene {
    onStart() {
        const aSceneCom = this.getSceneComponent(ASceneComponent);
    }
}
```

- 如果获取时发现没有可以自动创建则通过 `getOrCreateSceneComponent` 方法

```typescript
export class MainScene extends es.Scene {
    onStart() {
        const aSceneCom = this.getOrCreateSceneComponent(ASceneComponent);
    }
}
```

- 删除场景组件

```typescript
export class MainScene extends es.Scene {
    onStart() {
        this.removeSceneComponent(aSceneCom);
    }
}
```