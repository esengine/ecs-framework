# 序列化系统

序列化系统提供了完整的场景、实体和组件数据持久化方案，支持全量序列化和增量序列化两种模式，适用于游戏存档、网络同步、场景编辑器、时间回溯等场景。

## 基本概念

序列化系统分为两个层次：

- **全量序列化**：序列化完整的场景状态，包括所有实体、组件和场景数据
- **增量序列化**：只序列化相对于基础快照的变更部分，大幅减少数据量

### 支持的数据格式

- **JSON格式**：人类可读，便于调试和编辑
- **Binary格式**：使用MessagePack，体积更小，性能更高

> **📢 v2.2.2 重要变更**
>
> 从 v2.2.2 开始，二进制序列化格式返回 `Uint8Array` 而非 Node.js 的 `Buffer`，以确保浏览器兼容性：
> - `serialize({ format: 'binary' })` 返回 `string | Uint8Array`（原为 `string | Buffer`）
> - `deserialize(data)` 接收 `string | Uint8Array`（原为 `string | Buffer`）
> - `applyIncremental(data)` 接收 `IncrementalSnapshot | string | Uint8Array`（原为包含 `Buffer`）
>
> **迁移影响**：
> - ✅ **运行时兼容**：Node.js 的 `Buffer` 继承自 `Uint8Array`，现有代码可直接运行
> - ⚠️ **类型检查**：如果你的 TypeScript 代码中显式使用了 `Buffer` 类型，需要改为 `Uint8Array`
> - ✅ **浏览器支持**：`Uint8Array` 是标准 JavaScript 类型，所有现代浏览器都支持

## 全量序列化

### 基础用法

#### 1. 标记可序列化组件

使用 `@Serializable` 和 `@Serialize` 装饰器标记需要序列化的组件和字段：

```typescript
import { Component, ECSComponent, Serializable, Serialize } from '@esengine/ecs-framework';

@ECSComponent('Player')
@Serializable({ version: 1 })
class PlayerComponent extends Component {
  @Serialize()
  public name: string = '';

  @Serialize()
  public level: number = 1;

  @Serialize()
  public experience: number = 0;

  @Serialize()
  public position: { x: number; y: number } = { x: 0, y: 0 };

  // 不使用 @Serialize() 的字段不会被序列化
  private tempData: any = null;
}
```

#### 2. 序列化场景

```typescript
// JSON格式序列化
const jsonData = scene.serialize({
  format: 'json',
  pretty: true  // 美化输出
});

// 保存到本地存储
localStorage.setItem('gameSave', jsonData);

// Binary格式序列化（更小的体积）
const binaryData = scene.serialize({
  format: 'binary'
});

// 保存为文件（Node.js环境）
// 注意：binaryData 是 Uint8Array 类型，Node.js 的 fs 可以直接写入
fs.writeFileSync('save.bin', binaryData);
```

#### 3. 反序列化场景

```typescript
// 从JSON恢复
const saveData = localStorage.getItem('gameSave');
if (saveData) {
  scene.deserialize(saveData, {
    strategy: 'replace'  // 替换当前场景内容
  });
}

// 从Binary恢复
const binaryData = fs.readFileSync('save.bin');
scene.deserialize(binaryData, {
  strategy: 'merge'  // 合并到现有场景
});
```

### 序列化选项

#### SerializationOptions

```typescript
interface SceneSerializationOptions {
  // 指定要序列化的组件类型（可选）
  components?: ComponentType[];

  // 序列化格式：'json' 或 'binary'
  format?: 'json' | 'binary';

  // JSON美化输出
  pretty?: boolean;

  // 包含元数据
  includeMetadata?: boolean;
}
```

示例：

```typescript
// 只序列化特定组件类型
const saveData = scene.serialize({
  format: 'json',
  components: [PlayerComponent, InventoryComponent],
  pretty: true,
  includeMetadata: true
});
```

#### DeserializationOptions

```typescript
interface SceneDeserializationOptions {
  // 反序列化策略
  strategy?: 'merge' | 'replace';

  // 组件类型注册表（可选，默认使用全局注册表）
  componentRegistry?: Map<string, ComponentType>;
}
```

### 高级装饰器

#### 字段序列化选项

```typescript
@ECSComponent('Advanced')
@Serializable({ version: 1 })
class AdvancedComponent extends Component {
  // 使用别名
  @Serialize({ alias: 'playerName' })
  public name: string = '';

  // 自定义序列化器
  @Serialize({
    serializer: (value: Date) => value.toISOString(),
    deserializer: (value: string) => new Date(value)
  })
  public createdAt: Date = new Date();

  // 忽略序列化
  @IgnoreSerialization()
  public cachedData: any = null;
}
```

#### 集合类型序列化

```typescript
@ECSComponent('Collections')
@Serializable({ version: 1 })
class CollectionsComponent extends Component {
  // Map序列化
  @SerializeAsMap()
  public inventory: Map<string, number> = new Map();

  // Set序列化
  @SerializeAsSet()
  public acquiredSkills: Set<string> = new Set();

  constructor() {
    super();
    this.inventory.set('gold', 100);
    this.inventory.set('silver', 50);
    this.acquiredSkills.add('attack');
    this.acquiredSkills.add('defense');
  }
}
```

### 场景自定义数据

除了实体和组件，还可以序列化场景级别的配置数据：

```typescript
// 设置场景数据
scene.sceneData.set('weather', 'rainy');
scene.sceneData.set('difficulty', 'hard');
scene.sceneData.set('checkpoint', { x: 100, y: 200 });

// 序列化时会自动包含场景数据
const saveData = scene.serialize({ format: 'json' });

// 反序列化后场景数据会恢复
scene.deserialize(saveData);
console.log(scene.sceneData.get('weather')); // 'rainy'
```

## 增量序列化

增量序列化只保存场景的变更部分，适用于网络同步、撤销/重做、时间回溯等需要频繁保存状态的场景。

### 基础用法

#### 1. 创建基础快照

```typescript
// 在需要开始记录变更前创建基础快照
scene.createIncrementalSnapshot();
```

#### 2. 修改场景

```typescript
// 添加实体
const enemy = scene.createEntity('Enemy');
enemy.addComponent(new PositionComponent(100, 200));
enemy.addComponent(new HealthComponent(50));

// 修改组件
const player = scene.findEntity('Player');
const pos = player.getComponent(PositionComponent);
pos.x = 300;
pos.y = 400;

// 删除组件
player.removeComponentByType(BuffComponent);

// 删除实体
const oldEntity = scene.findEntity('ToDelete');
oldEntity.destroy();

// 修改场景数据
scene.sceneData.set('score', 1000);
```

#### 3. 获取增量变更

```typescript
// 获取相对于基础快照的所有变更
const incremental = scene.serializeIncremental();

// 查看变更统计
const stats = IncrementalSerializer.getIncrementalStats(incremental);
console.log('总变更数:', stats.totalChanges);
console.log('新增实体:', stats.addedEntities);
console.log('删除实体:', stats.removedEntities);
console.log('新增组件:', stats.addedComponents);
console.log('更新组件:', stats.updatedComponents);
```

#### 4. 序列化增量数据

```typescript
// JSON格式（默认）
const jsonData = IncrementalSerializer.serializeIncremental(incremental, {
  format: 'json'
});

// 二进制格式（更小的体积，更高性能）
const binaryData = IncrementalSerializer.serializeIncremental(incremental, {
  format: 'binary'
});

// 美化JSON输出（便于调试）
const prettyJson = IncrementalSerializer.serializeIncremental(incremental, {
  format: 'json',
  pretty: true
});

// 发送或保存
socket.send(binaryData);  // 网络传输使用二进制
localStorage.setItem('changes', jsonData);  // 本地存储可用JSON
```

#### 5. 应用增量变更

```typescript
// 在另一个场景应用变更
const otherScene = new Scene();

// 直接应用增量对象
otherScene.applyIncremental(incremental);

// 从JSON字符串应用
const jsonData = IncrementalSerializer.serializeIncremental(incremental, { format: 'json' });
otherScene.applyIncremental(jsonData);

// 从二进制Uint8Array应用
const binaryData = IncrementalSerializer.serializeIncremental(incremental, { format: 'binary' });
otherScene.applyIncremental(binaryData);
```

### 增量快照管理

#### 更新快照基准

在应用增量变更后，可以更新快照基准：

```typescript
// 创建初始快照
scene.createIncrementalSnapshot();

// 第一次修改
entity.addComponent(new VelocityComponent(5, 0));
const incremental1 = scene.serializeIncremental();

// 更新基准（将当前状态设为新的基准）
scene.updateIncrementalSnapshot();

// 第二次修改（增量将基于更新后的基准）
entity.getComponent(VelocityComponent).dx = 10;
const incremental2 = scene.serializeIncremental();
```

#### 清除快照

```typescript
// 释放快照占用的内存
scene.clearIncrementalSnapshot();

// 检查是否有快照
if (scene.hasIncrementalSnapshot()) {
  console.log('存在增量快照');
}
```

### 增量序列化选项

```typescript
interface IncrementalSerializationOptions {
  // 是否进行组件数据的深度对比
  // 默认true，设为false可提升性能但可能漏掉组件内部字段变更
  deepComponentComparison?: boolean;

  // 是否跟踪场景数据变更
  // 默认true
  trackSceneData?: boolean;

  // 是否压缩快照（使用JSON序列化）
  // 默认false
  compressSnapshot?: boolean;

  // 序列化格式
  // 'json': JSON格式（可读性好，方便调试）
  // 'binary': MessagePack二进制格式（体积小，性能高）
  // 默认 'json'
  format?: 'json' | 'binary';

  // 是否美化JSON输出（仅在format='json'时有效）
  // 默认false
  pretty?: boolean;
}

// 使用选项
scene.createIncrementalSnapshot({
  deepComponentComparison: true,
  trackSceneData: true
});
```

### 增量数据结构

增量快照包含以下变更类型：

```typescript
interface IncrementalSnapshot {
  version: number;           // 快照版本号
  timestamp: number;         // 时间戳
  sceneName: string;         // 场景名称
  baseVersion: number;       // 基础版本号
  entityChanges: EntityChange[];      // 实体变更
  componentChanges: ComponentChange[]; // 组件变更
  sceneDataChanges: SceneDataChange[]; // 场景数据变更
}

// 变更操作类型
enum ChangeOperation {
  EntityAdded = 'entity_added',
  EntityRemoved = 'entity_removed',
  EntityUpdated = 'entity_updated',
  ComponentAdded = 'component_added',
  ComponentRemoved = 'component_removed',
  ComponentUpdated = 'component_updated',
  SceneDataUpdated = 'scene_data_updated'
}
```

## 版本迁移

当组件结构发生变化时，版本迁移系统可以自动升级旧版本的存档数据。

### 注册迁移函数

```typescript
import { VersionMigrationManager } from '@esengine/ecs-framework';

// 假设 PlayerComponent v1 有 hp 字段
// v2 改为 health 和 maxHealth 字段

// 注册从版本1到版本2的迁移
VersionMigrationManager.registerComponentMigration(
  'Player',
  1,  // 从版本
  2,  // 到版本
  (data) => {
    // 迁移逻辑
    const newData = {
      ...data,
      health: data.hp,
      maxHealth: data.hp,
    };
    delete newData.hp;
    return newData;
  }
);
```

### 使用迁移构建器

```typescript
import { MigrationBuilder } from '@esengine/ecs-framework';

new MigrationBuilder()
  .forComponent('Player')
  .fromVersionToVersion(2, 3)
  .migrate((data) => {
    // 从版本2迁移到版本3
    data.experience = data.exp || 0;
    delete data.exp;
    return data;
  });
```

### 场景级迁移

```typescript
// 注册场景级迁移
VersionMigrationManager.registerSceneMigration(
  1,  // 从版本
  2,  // 到版本
  (scene) => {
    // 迁移场景结构
    scene.metadata = {
      ...scene.metadata,
      migratedFrom: 1
    };
    return scene;
  }
);
```

### 检查迁移路径

```typescript
// 检查是否可以迁移
const canMigrate = VersionMigrationManager.canMigrateComponent(
  'Player',
  1,  // 从版本
  3   // 到版本
);

if (canMigrate) {
  // 可以安全迁移
  scene.deserialize(oldSaveData);
}

// 获取迁移路径
const path = VersionMigrationManager.getComponentMigrationPath('Player');
console.log('可用迁移版本:', path); // [1, 2, 3]
```

## 使用场景

### 游戏存档系统

```typescript
class SaveSystem {
  private static SAVE_KEY = 'game_save';

  // 保存游戏
  public static saveGame(scene: Scene): void {
    const saveData = scene.serialize({
      format: 'json',
      pretty: false
    });

    localStorage.setItem(this.SAVE_KEY, saveData);
    console.log('游戏已保存');
  }

  // 加载游戏
  public static loadGame(scene: Scene): boolean {
    const saveData = localStorage.getItem(this.SAVE_KEY);
    if (saveData) {
      scene.deserialize(saveData, {
        strategy: 'replace'
      });
      console.log('游戏已加载');
      return true;
    }
    return false;
  }

  // 检查是否有存档
  public static hasSave(): boolean {
    return localStorage.getItem(this.SAVE_KEY) !== null;
  }
}
```

### 网络同步

```typescript
class NetworkSync {
  private baseSnapshot?: any;
  private syncInterval: number = 100; // 100ms同步一次

  constructor(private scene: Scene, private socket: WebSocket) {
    this.setupSync();
  }

  private setupSync(): void {
    // 创建基础快照
    this.scene.createIncrementalSnapshot();

    // 定期发送增量
    setInterval(() => {
      this.sendIncremental();
    }, this.syncInterval);

    // 接收远程增量
    this.socket.onmessage = (event) => {
      this.receiveIncremental(event.data);
    };
  }

  private sendIncremental(): void {
    const incremental = this.scene.serializeIncremental();
    const stats = IncrementalSerializer.getIncrementalStats(incremental);

    // 只在有变更时发送
    if (stats.totalChanges > 0) {
      // 使用二进制格式减少网络传输量
      const binaryData = IncrementalSerializer.serializeIncremental(incremental, {
        format: 'binary'
      });
      this.socket.send(binaryData);

      // 更新基准
      this.scene.updateIncrementalSnapshot();
    }
  }

  private receiveIncremental(data: ArrayBuffer): void {
    // 直接应用二进制数据（ArrayBuffer 转 Uint8Array）
    const uint8Array = new Uint8Array(data);
    this.scene.applyIncremental(uint8Array);
  }
}
```

### 撤销/重做系统

```typescript
class UndoRedoSystem {
  private history: IncrementalSnapshot[] = [];
  private currentIndex: number = -1;
  private maxHistory: number = 50;

  constructor(private scene: Scene) {
    // 创建初始快照
    this.scene.createIncrementalSnapshot();
    this.saveState('Initial');
  }

  // 保存当前状态
  public saveState(label: string): void {
    const incremental = this.scene.serializeIncremental();

    // 删除当前位置之后的历史
    this.history = this.history.slice(0, this.currentIndex + 1);

    // 添加新状态
    this.history.push(incremental);
    this.currentIndex++;

    // 限制历史记录数量
    if (this.history.length > this.maxHistory) {
      this.history.shift();
      this.currentIndex--;
    }

    // 更新快照基准
    this.scene.updateIncrementalSnapshot();
  }

  // 撤销
  public undo(): boolean {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      const incremental = this.history[this.currentIndex];
      this.scene.applyIncremental(incremental);
      return true;
    }
    return false;
  }

  // 重做
  public redo(): boolean {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      const incremental = this.history[this.currentIndex];
      this.scene.applyIncremental(incremental);
      return true;
    }
    return false;
  }

  public canUndo(): boolean {
    return this.currentIndex > 0;
  }

  public canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }
}
```

### 关卡编辑器

```typescript
class LevelEditor {
  // 导出关卡
  public exportLevel(scene: Scene, filename: string): void {
    const levelData = scene.serialize({
      format: 'json',
      pretty: true,
      includeMetadata: true
    });

    // 浏览器环境
    const blob = new Blob([levelData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // 导入关卡
  public importLevel(scene: Scene, fileContent: string): void {
    scene.deserialize(fileContent, {
      strategy: 'replace'
    });
  }

  // 验证关卡数据
  public validateLevel(saveData: string): boolean {
    const validation = SceneSerializer.validate(saveData);
    if (!validation.valid) {
      console.error('关卡数据无效:', validation.errors);
      return false;
    }
    return true;
  }

  // 获取关卡信息（不完全反序列化）
  public getLevelInfo(saveData: string): any {
    const info = SceneSerializer.getInfo(saveData);
    return info;
  }
}
```

## 性能优化建议

### 1. 选择合适的格式

- **开发阶段**：使用JSON格式，便于调试和查看
- **生产环境**：使用Binary格式，减少30-50%的数据大小

### 2. 按需序列化

```typescript
// 只序列化需要持久化的组件
const saveData = scene.serialize({
  format: 'binary',
  components: [PlayerComponent, InventoryComponent, QuestComponent]
});
```

### 3. 增量序列化优化

```typescript
// 对于高频同步，关闭深度对比以提升性能
scene.createIncrementalSnapshot({
  deepComponentComparison: false  // 只检测组件的添加/删除
});
```

### 4. 批量操作

```typescript
// 批量修改后再序列化
scene.entities.buffer.forEach(entity => {
  // 批量修改
});

// 一次性序列化所有变更
const incremental = scene.serializeIncremental();
```

## 最佳实践

### 1. 明确序列化字段

```typescript
// 明确标记需要序列化的字段
@ECSComponent('Player')
@Serializable({ version: 1 })
class PlayerComponent extends Component {
  @Serialize()
  public name: string = '';

  @Serialize()
  public level: number = 1;

  // 运行时数据不序列化
  private _cachedSprite: any = null;
}
```

### 2. 使用版本控制

```typescript
// 为组件指定版本
@Serializable({ version: 2 })
class PlayerComponent extends Component {
  // 版本2的字段
}

// 注册迁移函数确保兼容性
VersionMigrationManager.registerComponentMigration('Player', 1, 2, migrateV1ToV2);
```

### 3. 避免循环引用

```typescript
// 不要在组件中直接引用其他实体
@ECSComponent('Follower')
@Serializable({ version: 1 })
class FollowerComponent extends Component {
  // 存储实体ID而不是实体引用
  @Serialize()
  public targetId: number = 0;

  // 通过场景查找目标实体
  public getTarget(scene: Scene): Entity | null {
    return scene.entities.findEntityById(this.targetId);
  }
}
```

### 4. 压缩大数据

```typescript
// 对于大型数据结构，使用自定义序列化
@ECSComponent('LargeData')
@Serializable({ version: 1 })
class LargeDataComponent extends Component {
  @Serialize({
    serializer: (data: LargeObject) => compressData(data),
    deserializer: (data: CompressedData) => decompressData(data)
  })
  public data: LargeObject;
}
```

## API参考

### 全量序列化API

- [`Scene.serialize()`](/api/classes/Scene#serialize) - 序列化场景
- [`Scene.deserialize()`](/api/classes/Scene#deserialize) - 反序列化场景
- [`SceneSerializer`](/api/classes/SceneSerializer) - 场景序列化器
- [`ComponentSerializer`](/api/classes/ComponentSerializer) - 组件序列化器

### 增量序列化API

- [`Scene.createIncrementalSnapshot()`](/api/classes/Scene#createincrementalsnapshot) - 创建基础快照
- [`Scene.serializeIncremental()`](/api/classes/Scene#serializeincremental) - 获取增量变更
- [`Scene.applyIncremental()`](/api/classes/Scene#applyincremental) - 应用增量变更（支持IncrementalSnapshot对象、JSON字符串或二进制Uint8Array）
- [`Scene.updateIncrementalSnapshot()`](/api/classes/Scene#updateincrementalsnapshot) - 更新快照基准
- [`Scene.clearIncrementalSnapshot()`](/api/classes/Scene#clearincrementalsnapshot) - 清除快照
- [`Scene.hasIncrementalSnapshot()`](/api/classes/Scene#hasincrementalsnapshot) - 检查是否有快照
- [`IncrementalSerializer`](/api/classes/IncrementalSerializer) - 增量序列化器
- [`IncrementalSnapshot`](/api/interfaces/IncrementalSnapshot) - 增量快照接口
- [`IncrementalSerializationOptions`](/api/interfaces/IncrementalSerializationOptions) - 增量序列化选项
- [`IncrementalSerializationFormat`](/api/type-aliases/IncrementalSerializationFormat) - 序列化格式类型

### 版本迁移API

- [`VersionMigrationManager`](/api/classes/VersionMigrationManager) - 版本迁移管理器
- `VersionMigrationManager.registerComponentMigration()` - 注册组件迁移
- `VersionMigrationManager.registerSceneMigration()` - 注册场景迁移
- `VersionMigrationManager.canMigrateComponent()` - 检查是否可以迁移
- `VersionMigrationManager.getComponentMigrationPath()` - 获取迁移路径

序列化系统是构建完整游戏的重要基础设施，合理使用可以实现强大的功能，如存档系统、网络同步、关卡编辑器等。
