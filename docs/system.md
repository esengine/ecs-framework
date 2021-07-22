# system
系统是ecs的核心。你的游戏逻辑应该在这里进行处理，所有的实体及组件也会在这里进行集中处理。用于处理实体的系统叫做 `es.EntityProcessingSystem`。 你需要继承他并实现`processEntity(entity: Entity)`方法。

```typescript
export class ASystem extends es.EntityProcessingSystem {
    processEntity(entity: Entity){

    }
}
```

系统也依赖于场景，如果想要系统被激活则需要使用场景中`addEntityProcessor`方法。系统被实例化需要传入一个`es.Matcher` 参数。

```typescript
export class MainScene extends es.Scene {
    onStart() {
        this.addEntityProcessor(new ASystem(es.Matcher.empty().all(AComponent)));
    }
}
```

## Matcher
matcher是系统的匹配器，用于匹配满足条件的实体传入系统进行处理。如果想要一个空的匹配器则直接 `es.Matcher.empty()`

- all
同时拥有多个组件

```typescript
es.Matcher.empty().all(AComponent, BComponent);
```

- one
拥有任意一个组件

```typescript
es.Matcher.empty().one(AComponent, BComponent);
```

- exclude
拥有某些组件，并且不包含某些组件
```typescript
// 不包含CComponent或者DComponent
es.Matcher.empty().all(AComponent, BComponent).exclude(CComponent, DComponent);

// 不同时包含CComponent和DComponent
es.Matcher.empty().all(AComponent, BComponent).exclude(CComponent).exclude(DComponent);
```

## 获取系统

```typescript
export class MainScene extends es.Scene {
    onStart() {
        const aSystem = this.getEntityProcessor(ASystem);
    }
}
```

## 移除系统

```typescript
export class MainScene extends es.Scene {
    onStart() {
        this.removeEntityProcessor(aSystem);
    }
}
```