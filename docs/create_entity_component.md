# 创建实体

实体必须依赖于场景，不能单独存在。创建实体方法由场景提供。

## 方式一
```typescript
// 通过全局快捷获取场景创建实体
const playerEntity = es.Core.scene.createEntity("player");
```

## 方式二
```typescript
export class MainScene extends es.Scene {
    onStart() {
        // 通过场景内创建
        const playerEntity = this.createEntity("player");
    }
}
```

### Transform

框架中提供的实体不同于其他框架实体，它更偏向于游戏使用，实体内含有`Transform`属性。可用于快速访问位置，旋转，缩放等。如果需要应用于游戏引擎，请再组件重写`onTransformChanged`监听这些属性的变化。

> 实体内包含对transform里位置、旋转、缩放的快捷tween方法。`tweenPositionTo`/`tweenLocalPositionTo`/`tweenScaleTo`/`tweenLocalScaleTo`/`tweenRotationDegreesTo`/`tweenLocalRotationDegreesTo`

### tag / setTag

实体还提供`tag`属性及`setTag`方法来快速设置实体的标记，可再场景中使用`findEntitiesWithTag`快速查询拥有该标记的实体或使用`findEntityWithTag`来查找第一个拥有该标记的实体，你可以把它当作组来使用。

### detachFromScene / attachToScene
当你不想实体与场景被销毁时一同被销毁。可先 `detachFromScene`，等待合适的时机再调用 `attachToScene` 放入新的场景。


# 创建组件

组件一般配合实体使用。组件需要继承 `es.Component` 来标识为组件，如果想让组件拥有每帧更新能力则额外继承`es.IUpdatable` 接口。在实现的`update`方法当中进行更新逻辑。

```typescript
// es.IUpdatable接口为可选接口，如果不需要更新能力则不必继承
export class AComponent extends es.Component implements es.IUpdatable {
    update() {
        // 更新逻辑
    }
}
```

## 加入组件

组件必须挂载于实体上，不能单独存在，如果需要单独于场景的组件则参考 [es.SceneComponent](scene_component.md) 组件。

- 方式一：将现有的AComponent加入实体
```typescript
const aCom = playerEntity.addComponent(new AComponent());
```

- 方式二：在实体上直接创建组件
```typescript
const aCom = playerEntity.createComponent(AComponent);
```

## 获取组件

- 方式一: 根据类型获取找到满足条件的第一个组件
```typescript
// 不能保证已经加入场景
const aCom = playerEntity.getComponent(AComponent);
```

```typescript
// 保证已经加入场景
const aCom = playerEntity.getComponentInScene(AComponent);
```

- 方式二: 尝试找到一个组件，返回是否找到组件标志，第二参数需要一个引用组件用于存储已找到的组件
```typescript
const outCom = new Ref<AComponent>();
const find = playerEntity.tryGetComponent(AComponent, outCom);
if (find) {
    const aCom = outCom.value;
}
```

- 方式三：获取该类型的组件，如果未找到则创建一个并返回
```typescript
const aCom = playerEntity.getOrCreateComponent(AComponent);
```

- 方式四：根据第二参数中的列表找到该类型的所有组件并返回
```typescript
const findArray: Component[] = [
    new AComponent(),
    new BComponent(),
    new CComponent()
];
// findArray可不传，则在实体上寻找满足第一个条件的所有组件
const coms = playerEntity.getComponents(AComponent, findArray);
```

- 组件是否存在

```typescript
const find = playerEntity.hasComponent(AComponent);
```

## 移除组件

- 方式一: 移除已实例组件
```typescript
playerEntity.removeComponent(aCom);
```

- 方式二：移除满足类型的第一个组件
```typescript
playerEntity.removeComponentForType(AComponent);
```

- 方式三: 移除所有组件
```typescript
playerEntity.removeAllComponents();
```