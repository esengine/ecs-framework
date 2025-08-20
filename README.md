# ECS Framework

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&pause=1000&color=F75C7E&center=true&vCenter=true&width=435&lines=TypeScript+ECS+Framework;高性能游戏开发框架;支持+Cocos+Creator+%26+Laya)](https://git.io/typing-svg)

[![CI](https://github.com/esengine/ecs-framework/workflows/CI/badge.svg)](https://github.com/esengine/ecs-framework/actions)
[![npm version](https://badge.fury.io/js/%40esengine%2Fecs-framework.svg)](https://badge.fury.io/js/%40esengine%2Fecs-framework)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/esengine/ecs-framework?style=social)](https://github.com/esengine/ecs-framework/stargazers)

TypeScript ECS (Entity-Component-System) 框架，专为游戏开发设计。

## 项目特色

<div align="center">

[![Cocos Store](https://img.shields.io/badge/Cocos_Store-专业插件-FF6B35?style=flat&logo=cocos&logoColor=white)](https://store.cocos.com/app/detail/7823)
[![QQ群](https://img.shields.io/badge/QQ群-框架交流-1EAEDB?style=flat&logo=tencentqq&logoColor=white)](https://jq.qq.com/?_wv=1027&k=29w1Nud6)

</div>

## 架构原理

ECS Framework 采用多World + 多Scene的现代化架构设计：

```mermaid
graph TD
    subgraph Main["🎮 ECS Framework - 多World・多Scene架构"]
        direction TB
        
        subgraph CoreLayer["⚙️ 核心层 (Core Foundation)"]
            direction LR
            Core["🔧 <b>Core</b><br/>📋 生命周期管理<br/>⚙️ 配置系统<br/>🔗 平台兼容"]
            Registry["📝 <b>ComponentRegistry</b><br/>🏷️ 类型注册<br/>✨ 装饰器支持<br/>🔒 类型安全"]
            Pool["🔢 <b>IdentifierPool</b><br/>🆔 实体ID分配<br/>♻️ ID回收<br/>📊 BigInt兼容"]
            PoolMgr["♻️ <b>PoolManager</b><br/>🎯 对象池<br/>⚡ 内存优化<br/>📈 性能提升"]
            EventBus["📡 <b>EventBus</b><br/>🔄 事件系统<br/>⚡ 异步/同步<br/>🎭 类型安全"]
        end
        
        subgraph WorldLayer["🌍 世界管理层 (World Management)"]
            direction TB
            WorldMgr["🗺️ <b>WorldManager</b><br/>🚀 多World调度<br/>📊 资源管理<br/>🔍 统计监控<br/>🧹 自动清理"]
            
            subgraph WorldsContainer["多World容器"]
                direction LR
                World1["🌐 <b>GameWorld</b><br/>🎮 游戏逻辑<br/>🌟 全局系统<br/>🔄 跨Scene业务"]
                World2["🌐 <b>UIWorld</b><br/>🎨 界面管理<br/>⚡ 独立更新<br/>🔒 资源隔离"]
            end
            
            GlobalSys["🎭 <b>Global Systems</b><br/>🌐 NetworkSync<br/>👥 PlayerMgmt<br/>📡 跨Scene通信"]
        end
        
        subgraph SceneLayer["🎬 场景层 (Scene Management)"]
            direction LR
            Scene1["🎯 <b>BattleScene</b><br/>⚔️ 实体管理<br/>🎪 系统调度<br/>⚡ 高性能处理"]
            Scene2["🎯 <b>MenuScene</b><br/>🎨 界面逻辑<br/>🔄 生命周期<br/>💾 状态管理"]
            Scene3["🎯 <b>UIScene</b><br/>📦 组件存储<br/>🔍 查询引擎<br/>🎭 交互处理"]
        end
        
        subgraph ECLayer["🤖 实体组件层 (Entity-Component System)"]
            direction TB
            
            subgraph EntityMgmt["📦 实体管理 (Entity Management)"]
                direction LR
                EntityMgr["👥 <b>EntityManager</b><br/>📋 集合管理<br/>🌳 层次结构<br/>⚡ 高效操作"]
                Entities["🎭 <b>Entities</b><br/>👤 Player<br/>👹 Enemy<br/>💥 Bullet<br/>🎯 轻量容器"]
            end
            
            subgraph ComponentStore["🧩 组件存储 (Component Storage)"]
                direction LR
                Storage["💾 <b>ComponentStorage</b><br/>📊 SoA模式<br/>📚 AoS模式<br/>⚡ 内存优化"]
                StorageMgr["🗄️ <b>StorageManager</b><br/>🏷️ 类型管理<br/>🔄 脏标记<br/>📈 性能监控"]
                Components["🎲 <b>Components</b><br/>📍 Position<br/>🏃 Velocity<br/>❤️ Health<br/>📊 纯数据"]
            end
        end
        
        subgraph SystemLayer["⚡ 系统层 (System Processing)"]
            direction TB
            
            subgraph EntitySys["🔄 实体系统 (Entity Systems)"]
                direction LR
                EntitySystems["🎪 <b>EntitySystems</b><br/>🏃 MovementSystem<br/>🎨 RenderSystem<br/>🧠 AISystem<br/>⚡ 业务逻辑"]
                Processors["📋 <b>EntityProcessors</b><br/>🎯 调度管理<br/>📊 优先级<br/>⚡ 批量处理"]
            end
        end
        
        subgraph QueryLayer["🔍 查询优化层 (Query & Optimization)"]
            direction LR
            Matcher["🎯 <b>Matcher</b><br/>✅ withAll<br/>🔄 withAny<br/>❌ withNone<br/>🌊 流式API<br/>💾 智能缓存"]
            QuerySys["🔎 <b>QuerySystem</b><br/>⚡ 实时查询<br/>📦 批量优化<br/>🔄 自动更新"]
            Archetype["🏗️ <b>ArchetypeSystem</b><br/>📊 组件分组<br/>🎯 原型缓存<br/>💻 BitSet优化"]
        end
        
        subgraph DebugLayer["📊 监控调试层 (Debug & Monitoring)"]
            direction LR
            Debug["🐛 <b>DebugManager</b><br/>🌐 WebSocket调试<br/>🎮 Cocos Creator插件<br/>📸 内存快照"]
            Perf["📈 <b>PerformanceMonitor</b><br/>📊 性能统计<br/>⚠️ 阈值告警<br/>📱 实时监控"]
            Logger["📋 <b>Logger</b><br/>📊 分级日志<br/>🎨 彩色输出<br/>🔧 自定义处理器"]
        end
    end
    
    %% 连接关系 - 使用更丰富的箭头样式
    Core -.->|初始化| WorldMgr
    Core -.->|注册| Registry
    Core -.->|分配| Pool
    Core -.->|管理| PoolMgr
    Core -.->|事件| EventBus
    
    WorldMgr ==>|调度| World1
    WorldMgr ==>|调度| World2
    World1 -.->|管理| GlobalSys
    
    World1 ==>|包含| Scene1
    World1 ==>|包含| Scene2
    World2 ==>|包含| Scene3
    
    Scene1 -->|使用| EntityMgr
    Scene2 -->|使用| EntityMgr
    Scene3 -->|使用| EntityMgr
    
    EntityMgr -->|管理| Entities
    Entities -->|附加| Components
    
    Scene1 -->|存储| Storage
    Scene2 -->|存储| Storage
    Scene3 -->|存储| Storage
    Storage -->|管理| StorageMgr
    
    Scene1 -->|调度| EntitySystems
    Scene2 -->|调度| EntitySystems
    Scene3 -->|调度| EntitySystems
    EntitySystems -->|处理| Processors
    
    EntitySystems -->|查询| Matcher
    Matcher -->|缓存| QuerySys
    QuerySys -->|优化| Archetype
    
    Core -.->|调试| Debug
    Core -.->|监控| Perf
    Core -.->|日志| Logger
    
    %% 样式定义 - 使用Mermaid支持的语法
    classDef coreStyle fill:#E3F2FD,stroke:#1976D2,stroke-width:3px,color:#0D47A1
    classDef worldStyle fill:#F3E5F5,stroke:#7B1FA2,stroke-width:3px,color:#4A148C
    classDef sceneStyle fill:#FFF3E0,stroke:#F57C00,stroke-width:3px,color:#E65100
    classDef entityStyle fill:#E8F5E8,stroke:#388E3C,stroke-width:3px,color:#1B5E20
    classDef systemStyle fill:#FCE4EC,stroke:#C2185B,stroke-width:3px,color:#880E4F
    classDef queryStyle fill:#E0F2F1,stroke:#00695C,stroke-width:3px,color:#004D40
    classDef debugStyle fill:#FFF8E1,stroke:#F9A825,stroke-width:3px,color:#FF8F00
    
    class Core,Registry,Pool,PoolMgr,EventBus coreStyle
    class WorldMgr,World1,World2,GlobalSys worldStyle
    class Scene1,Scene2,Scene3 sceneStyle
    class EntityMgr,Entities,Storage,StorageMgr,Components entityStyle
    class EntitySystems,Processors systemStyle
    class Matcher,QuerySys,Archetype queryStyle
    class Debug,Perf,Logger debugStyle
```

### 核心概念

| 概念 | 职责 | 特点 |
|------|------|------|
| **Entity** | 游戏对象唯一标识 | 轻量级容器，无业务逻辑 |
| **Component** | 纯数据结构 | 描述实体属性，支持SoA优化 |
| **System** | 业务逻辑处理 | 操作组件数据，可热插拔 |
| **Scene** | 实体和系统容器 | 独立的游戏场景 |
| **World** | Scene和全局系统容器 | 支持跨Scene的全局逻辑 |
| **WorldManager** | 多World管理 | 统一调度和资源管理 |

## 特性

- **完整的 TypeScript 支持** - 强类型检查和代码提示
- **高效查询系统** - 流式 API 和智能缓存
- **性能优化技术** - SparseSet索引、Archetype 系统、脏标记
- **事件系统** - 类型安全的事件处理
- **调试工具** - 内置性能监控和 [Cocos Creator 可视化调试插件](https://store.cocos.com/app/detail/7823)

## 安装

```bash
npm install @esengine/ecs-framework
```

## 快速开始

### 1. 基础使用

```typescript
import { Core, Scene, Entity, Component, EntitySystem, ECSComponent, ECSSystem, Matcher, Time } from '@esengine/ecs-framework';

// 创建核心实例
const core = Core.create({ debug: true });
const scene = new Scene();
Core.setScene(scene);

// 定义组件
@ECSComponent('PositionComponent')
class PositionComponent extends Component {
    public x: number = 0;
    public y: number = 0;
    
    constructor(x: number = 0, y: number = 0) {
        super();
        this.x = x;
        this.y = y;
    }
}

@ECSComponent('VelocityComponent')
class VelocityComponent extends Component {
    public x: number = 0;
    public y: number = 0;
    
    constructor(x: number = 0, y: number = 0) {
        super();
        this.x = x;
        this.y = y;
    }
}

// 创建实体
const entity = scene.createEntity("Player");
entity.addComponent(new PositionComponent(100, 100));
entity.addComponent(new VelocityComponent(5, 0));

// 创建系统
@ECSSystem('MovementSystem')
class MovementSystem extends EntitySystem {
    constructor() {
        super(Matcher.all(PositionComponent, VelocityComponent));
    }
    
    protected override process(entities: Entity[]) {
        for (const entity of entities) {
            const position = entity.getComponent(PositionComponent)!;
            const velocity = entity.getComponent(VelocityComponent)!;
            
            position.x += velocity.x * Time.deltaTime;
            position.y += velocity.y * Time.deltaTime;
        }
    }
}

scene.addEntityProcessor(new MovementSystem());

// 游戏循环
Core.update(deltaTime);
```

### 2. 类型装饰器

在代码压缩混淆后，类名会改变导致框架无法识别组件类型。使用装饰器确保稳定性：

```typescript
import { ECSComponent, ECSSystem } from '@esengine/ecs-framework';

// 组件装饰器
@ECSComponent('PositionComponent')
class PositionComponent extends Component {
    public x: number = 0;
    public y: number = 0;
}

@ECSComponent('VelocityComponent') 
class VelocityComponent extends Component {
    public x: number = 0;
    public y: number = 0;
}

// 系统装饰器
@ECSSystem('MovementSystem')
class MovementSystem extends EntitySystem {
    constructor() {
        super(Matcher.all(PositionComponent, VelocityComponent));
    }
    
    protected override process(entities: Entity[]) {
        // 处理逻辑
    }
}
```

## 高级特性

### 查询系统

```typescript
import { Matcher, ECSSystem } from '@esengine/ecs-framework';

// 使用Matcher和EntitySystem进行高效查询
@ECSSystem('QuerySystem')
class QuerySystem extends EntitySystem {
    constructor() {
        super(Matcher.all(PositionComponent, VelocityComponent).none(HealthComponent));
    }
    
    protected override process(entities: Entity[]) {
        // 处理匹配的实体
        console.log(`Found ${entities.length} entities`);
    }
}

// 更复杂的查询条件
@ECSSystem('CombatSystem')
class CombatSystem extends EntitySystem {
    constructor() {
        super(
            Matcher
                .all(PositionComponent, HealthComponent)  // 必须有位置和血量
                .any(WeaponComponent, MagicComponent)     // 有武器或魔法
                .none(DeadComponent)                      // 不能是死亡状态
        );
    }
    
    protected override process(entities: Entity[]) {
        // 处理战斗逻辑
    }
}
```

### 事件系统

```typescript
import { EventHandler, ECSEventType, IEntityEventData } from '@esengine/ecs-framework';

class GameSystem {
    @EventHandler(ECSEventType.ENTITY_DESTROYED)
    onEntityDestroyed(data: IEntityEventData) {
        console.log('实体销毁:', data.entityName, '实体ID:', data.entityId);
    }
    
    @EventHandler(ECSEventType.ENTITY_CREATED) 
    onEntityCreated(data: IEntityEventData) {
        console.log('实体创建:', data.entityName, '标签:', data.entityTag);
    }
}
```

### SoA 存储优化

针对大规模实体处理的内存布局优化：

| 存储方式 | 内存布局 | 适用场景 | 性能特点 |
|----------|----------|----------|----------|
| **AoS** (Array of Structures) | `[{x,y,z}, {x,y,z}, {x,y,z}]` | 通用场景 | 访问灵活，缓存效率一般 |
| **SoA** (Structure of Arrays) | `{x:[1,2,3], y:[4,5,6], z:[7,8,9]}` | 批量处理 | SIMD优化，缓存友好 |

**SoA 优势：**
- 🚀 提升 2-4x 批量处理性能
- 💾 更好的CPU缓存利用率  
- 🔧 支持SIMD向量化操作
- ⚡ 减少内存访问跳跃

用法示例：

```typescript
import { EnableSoA, Float32, Int32 } from '@esengine/ecs-framework';

@EnableSoA
class OptimizedTransformComponent extends Component {
    @Float32 public x: number = 0;
    @Float32 public y: number = 0;
    @Float32 public rotation: number = 0;
}
```

**性能优势**：
- **缓存友好** - 连续内存访问，缓存命中率提升85%
- **批量处理** - 同类型数据处理速度提升2-3倍  
- **热切换** - 开发期AoS便于调试，生产期SoA提升性能
- **自动优化** - `@EnableSoA`装饰器自动转换存储结构

## 平台集成

### Cocos Creator

```typescript
update(deltaTime: number) {
    Core.update(deltaTime);
}
```

**专用调试插件**：
- [ECS 可视化调试插件](https://store.cocos.com/app/detail/7823) - 提供完整的可视化调试界面
- 实体查看器、组件编辑器、系统监控
- 性能分析和实时数据监控

### Laya 引擎
```typescript
Laya.timer.frameLoop(1, this, () => {
    Core.update(Laya.timer.delta / 1000);
});
```

### 原生浏览器
```typescript
function gameLoop(currentTime: number) {
    const deltaTime = (currentTime - lastTime) / 1000;
    Core.update(deltaTime);
    requestAnimationFrame(gameLoop);
}
```


## API 参考

### 核心类

| 类 | 描述 |
|---|---|
| `Core` | 框架核心管理 |
| `Scene` | 场景容器 |
| `Entity` | 实体对象 |
| `Component` | 组件基类 |
| `EntitySystem` | 系统基类 |
| `EntityManager` | 实体管理器 |

### 查询 API

```typescript
// Matcher API - 推荐方式，高效且类型安全
Matcher.all(...components)      // 包含所有组件
Matcher.any(...components)      // 包含任意组件  
Matcher.none(...components)     // 不包含组件

// 组合查询示例
Matcher
    .all(PositionComponent, VelocityComponent)  // 必须有这些组件
    .any(PlayerComponent, AIComponent)          // 其中之一
    .none(DeadComponent, DisabledComponent);    // 排除这些
```

## 文档

- [快速入门](docs/getting-started.md) - 详细教程和平台集成
- [技术概念](docs/concepts-explained.md) - ECS 架构和框架特性
- [组件设计](docs/component-design-guide.md) - 组件设计最佳实践
- [性能优化](docs/performance-optimization.md) - 性能优化技术
- [API 参考](docs/core-concepts.md) - 完整 API 文档

## 扩展库

- [路径寻找](https://github.com/esengine/ecs-astar) - A*、BFS、Dijkstra 算法
- [AI 系统](https://github.com/esengine/BehaviourTree-ai) - 行为树、效用 AI

## 社区

- QQ 群：[ecs游戏框架交流](https://jq.qq.com/?_wv=1027&k=29w1Nud6)
- GitHub：[提交 Issue](https://github.com/esengine/ecs-framework/issues)

## 许可证

[MIT](LICENSE)