# 层级系统

在游戏开发中，实体间的父子层级关系是常见需求。ECS Framework 采用组件化方式管理层级关系，通过 `HierarchyComponent` 和 `HierarchySystem` 实现，完全遵循 ECS 组合原则。

## 设计理念

### 为什么不在 Entity 中内置层级？

传统的游戏对象模型（如 Unity 的 GameObject）将层级关系内置于实体中。ECS Framework 选择组件化方案的原因：

1. **ECS 组合原则**：层级是一种"功能"，应该通过组件添加，而非所有实体都具备
2. **按需使用**：只有需要层级关系的实体才添加 `HierarchyComponent`
3. **数据与逻辑分离**：`HierarchyComponent` 存储数据，`HierarchySystem` 处理逻辑
4. **序列化友好**：层级关系作为组件数据可以轻松序列化和反序列化

## 基本概念

### HierarchyComponent

存储层级关系数据的组件：

```typescript
import { HierarchyComponent } from '@esengine/ecs-framework';

// HierarchyComponent 的核心属性
interface HierarchyComponent {
    parentId: number | null;      // 父实体 ID，null 表示根实体
    childIds: number[];           // 子实体 ID 列表
    depth: number;                // 在层级中的深度（由系统维护）
    bActiveInHierarchy: boolean;  // 在层级中是否激活（由系统维护）
}
```

### HierarchySystem

处理层级逻辑的系统，提供所有层级操作的 API：

```typescript
import { HierarchySystem } from '@esengine/ecs-framework';

// 获取系统
const hierarchySystem = scene.getEntityProcessor(HierarchySystem);
```

## 快速开始

### 添加系统到场景

```typescript
import { Scene, HierarchySystem } from '@esengine/ecs-framework';

class GameScene extends Scene {
    protected initialize(): void {
        // 添加层级系统
        this.addSystem(new HierarchySystem());

        // 添加其他系统...
    }
}
```

### 建立父子关系

```typescript
// 创建实体
const parent = scene.createEntity("Parent");
const child1 = scene.createEntity("Child1");
const child2 = scene.createEntity("Child2");

// 获取层级系统
const hierarchySystem = scene.getEntityProcessor(HierarchySystem);

// 设置父子关系（自动添加 HierarchyComponent）
hierarchySystem.setParent(child1, parent);
hierarchySystem.setParent(child2, parent);

// 现在 parent 有两个子实体
```

### 查询层级

```typescript
// 获取父实体
const parentEntity = hierarchySystem.getParent(child1);

// 获取所有子实体
const children = hierarchySystem.getChildren(parent);

// 获取子实体数量
const count = hierarchySystem.getChildCount(parent);

// 检查是否有子实体
const hasKids = hierarchySystem.hasChildren(parent);

// 获取在层级中的深度
const depth = hierarchySystem.getDepth(child1);  // 返回 1
```

## API 参考

### 父子关系操作

#### setParent

设置实体的父级：

```typescript
// 设置父级
hierarchySystem.setParent(child, parent);

// 移动到根级（无父级）
hierarchySystem.setParent(child, null);
```

#### insertChildAt

在指定位置插入子实体：

```typescript
// 在第一个位置插入
hierarchySystem.insertChildAt(parent, child, 0);

// 追加到末尾
hierarchySystem.insertChildAt(parent, child, -1);
```

#### removeChild

从父级移除子实体（子实体变为根级）：

```typescript
const success = hierarchySystem.removeChild(parent, child);
```

#### removeAllChildren

移除所有子实体：

```typescript
hierarchySystem.removeAllChildren(parent);
```

### 层级查询

#### getParent / getChildren

```typescript
const parent = hierarchySystem.getParent(entity);
const children = hierarchySystem.getChildren(entity);
```

#### getRoot

获取实体的根节点：

```typescript
const root = hierarchySystem.getRoot(deepChild);
```

#### getRootEntities

获取所有根实体（没有父级的实体）：

```typescript
const roots = hierarchySystem.getRootEntities();
```

#### isAncestorOf / isDescendantOf

检查祖先/后代关系：

```typescript
// grandparent -> parent -> child
const isAncestor = hierarchySystem.isAncestorOf(grandparent, child);  // true
const isDescendant = hierarchySystem.isDescendantOf(child, grandparent);  // true
```

### 层级遍历

#### findChild

根据名称查找子实体：

```typescript
// 直接子级中查找
const child = hierarchySystem.findChild(parent, "ChildName");

// 递归查找所有后代
const deepChild = hierarchySystem.findChild(parent, "DeepChild", true);
```

#### findChildrenByTag

根据标签查找子实体：

```typescript
// 查找直接子级
const tagged = hierarchySystem.findChildrenByTag(parent, TAG_ENEMY);

// 递归查找
const allTagged = hierarchySystem.findChildrenByTag(parent, TAG_ENEMY, true);
```

#### forEachChild

遍历子实体：

```typescript
// 遍历直接子级
hierarchySystem.forEachChild(parent, (child) => {
    console.log(child.name);
});

// 递归遍历所有后代
hierarchySystem.forEachChild(parent, (child) => {
    console.log(child.name);
}, true);
```

### 层级状态

#### isActiveInHierarchy

检查实体在层级中是否激活（考虑所有祖先的激活状态）：

```typescript
// 如果 parent.active = false，即使 child.active = true
// isActiveInHierarchy(child) 也会返回 false
const activeInHierarchy = hierarchySystem.isActiveInHierarchy(child);
```

#### getDepth

获取实体在层级中的深度（根实体深度为 0）：

```typescript
const depth = hierarchySystem.getDepth(entity);
```

### 扁平化层级（用于 UI 渲染）

```typescript
// 用于实现可展开/折叠的层级树视图
const expandedIds = new Set([parent.id]);

const flatNodes = hierarchySystem.flattenHierarchy(expandedIds);
// 返回 [{ entity, depth, bHasChildren, bIsExpanded }, ...]
```

## 完整示例

### 创建游戏角色层级

```typescript
import {
    Scene,
    HierarchySystem,
    HierarchyComponent
} from '@esengine/ecs-framework';

class GameScene extends Scene {
    private hierarchySystem!: HierarchySystem;

    protected initialize(): void {
        // 添加层级系统
        this.hierarchySystem = new HierarchySystem();
        this.addSystem(this.hierarchySystem);

        // 创建角色层级
        this.createPlayerHierarchy();
    }

    private createPlayerHierarchy(): void {
        // 根实体
        const player = this.createEntity("Player");
        player.addComponent(new Transform(0, 0));

        // 身体部件
        const body = this.createEntity("Body");
        body.addComponent(new Sprite("body.png"));
        this.hierarchySystem.setParent(body, player);

        // 武器（挂载在身体上）
        const weapon = this.createEntity("Weapon");
        weapon.addComponent(new Sprite("sword.png"));
        this.hierarchySystem.setParent(weapon, body);

        // 特效（挂载在武器上）
        const effect = this.createEntity("WeaponEffect");
        effect.addComponent(new ParticleEmitter());
        this.hierarchySystem.setParent(effect, weapon);

        // 查询层级信息
        console.log(`Player 层级深度: ${this.hierarchySystem.getDepth(player)}`);     // 0
        console.log(`Weapon 层级深度: ${this.hierarchySystem.getDepth(weapon)}`);     // 2
        console.log(`Effect 层级深度: ${this.hierarchySystem.getDepth(effect)}`);     // 3
    }

    public equipNewWeapon(weaponName: string): void {
        const body = this.findEntity("Body");
        const oldWeapon = this.hierarchySystem.findChild(body!, "Weapon");

        if (oldWeapon) {
            // 移除旧武器的所有子实体
            this.hierarchySystem.removeAllChildren(oldWeapon);
            oldWeapon.destroy();
        }

        // 创建新武器
        const newWeapon = this.createEntity("Weapon");
        newWeapon.addComponent(new Sprite(`${weaponName}.png`));
        this.hierarchySystem.setParent(newWeapon, body!);
    }
}
```

### 层级变换系统

结合 Transform 组件实现层级变换：

```typescript
import { EntitySystem, Matcher, HierarchySystem, HierarchyComponent } from '@esengine/ecs-framework';

class HierarchyTransformSystem extends EntitySystem {
    private hierarchySystem!: HierarchySystem;

    constructor() {
        super(Matcher.empty().all(Transform, HierarchyComponent));
    }

    public onAddedToScene(): void {
        // 获取层级系统引用
        this.hierarchySystem = this.scene!.getEntityProcessor(HierarchySystem)!;
    }

    protected process(entities: readonly Entity[]): void {
        // 按深度排序，确保父级先更新
        const sorted = [...entities].sort((a, b) => {
            return this.hierarchySystem.getDepth(a) - this.hierarchySystem.getDepth(b);
        });

        for (const entity of sorted) {
            const transform = entity.getComponent(Transform)!;
            const parent = this.hierarchySystem.getParent(entity);

            if (parent) {
                const parentTransform = parent.getComponent(Transform);
                if (parentTransform) {
                    // 计算世界坐标
                    transform.worldX = parentTransform.worldX + transform.localX;
                    transform.worldY = parentTransform.worldY + transform.localY;
                }
            } else {
                // 根实体，本地坐标即世界坐标
                transform.worldX = transform.localX;
                transform.worldY = transform.localY;
            }
        }
    }
}
```

## 性能优化

### 缓存机制

`HierarchySystem` 内置了缓存机制：

- `depth` 和 `bActiveInHierarchy` 由系统自动维护
- 使用 `bCacheDirty` 标记优化更新
- 层级变化时自动标记所有子级缓存为脏

### 最佳实践

1. **避免深层嵌套**：系统限制最大深度为 32 层
2. **批量操作**：构建复杂层级时，尽量一次性设置好所有父子关系
3. **按需添加**：只有真正需要层级关系的实体才添加 `HierarchyComponent`
4. **缓存系统引用**：避免每次调用都获取 `HierarchySystem`

```typescript
// 好的做法
class MySystem extends EntitySystem {
    private hierarchySystem!: HierarchySystem;

    onAddedToScene() {
        this.hierarchySystem = this.scene!.getEntityProcessor(HierarchySystem)!;
    }

    process() {
        // 使用缓存的引用
        const parent = this.hierarchySystem.getParent(entity);
    }
}

// 避免的做法
process() {
    // 每次都获取，性能较差
    const system = this.scene!.getEntityProcessor(HierarchySystem);
}
```

## 迁移指南

如果你之前使用的是旧版 Entity 内置的层级 API，请参考以下迁移指南：

| 旧 API (已移除) | 新 API |
|----------------|--------|
| `entity.parent` | `hierarchySystem.getParent(entity)` |
| `entity.children` | `hierarchySystem.getChildren(entity)` |
| `entity.addChild(child)` | `hierarchySystem.setParent(child, entity)` |
| `entity.removeChild(child)` | `hierarchySystem.removeChild(entity, child)` |
| `entity.findChild(name)` | `hierarchySystem.findChild(entity, name)` |
| `entity.activeInHierarchy` | `hierarchySystem.isActiveInHierarchy(entity)` |

### 迁移示例

```typescript
// 旧代码
const parent = scene.createEntity("Parent");
const child = scene.createEntity("Child");
parent.addChild(child);
const found = parent.findChild("Child");

// 新代码
const hierarchySystem = scene.getEntityProcessor(HierarchySystem);

const parent = scene.createEntity("Parent");
const child = scene.createEntity("Child");
hierarchySystem.setParent(child, parent);
const found = hierarchySystem.findChild(parent, "Child");
```

## 下一步

- 了解 [实体类](./entity.md) 的其他功能
- 了解 [场景管理](./scene.md) 如何组织实体和系统
- 了解 [组件系统](./component.md) 如何定义和使用组件
