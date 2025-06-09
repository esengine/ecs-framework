# ECS事件系统使用指南

本文档介绍如何使用ECS框架的增强事件系统，包括类型安全的事件发布订阅、预定义的ECS事件类型和高级功能。

## 目录

1. [基础用法](#基础用法)
2. [预定义ECS事件](#预定义ecs事件)
3. [事件装饰器](#事件装饰器)
4. [高级功能](#高级功能)
5. [性能优化](#性能优化)
6. [最佳实践](#最佳实践)

## 基础用法

### 创建事件总线

```typescript
import { EventBus, GlobalEventBus } from './ECS';

// 方式1：创建独立的事件总线
const eventBus = new EventBus(true); // true启用调试模式

// 方式2：使用全局事件总线
const globalEventBus = GlobalEventBus.getInstance(true);
```

### 基本事件发布订阅

```typescript
// 定义事件数据类型
interface PlayerDiedEvent {
    playerId: number;
    cause: string;
    position: { x: number; y: number };
}

// 监听事件
const listenerId = eventBus.on<PlayerDiedEvent>('player:died', (data) => {
    console.log(`Player ${data.playerId} died at (${data.position.x}, ${data.position.y})`);
    console.log(`Cause: ${data.cause}`);
});

// 发射事件
eventBus.emit('player:died', {
    playerId: 123,
    cause: 'enemy_attack',
    position: { x: 100, y: 200 }
});

// 移除监听器
eventBus.off('player:died', listenerId);
```

### 一次性事件监听

```typescript
// 只监听一次
eventBus.once<PlayerDiedEvent>('player:died', (data) => {
    console.log('This will only be called once');
});
```

### 异步事件处理

```typescript
// 异步事件监听
eventBus.onAsync<PlayerDiedEvent>('player:died', async (data) => {
    await savePlayerDeathToDatabase(data);
    await updateLeaderboard(data.playerId);
});

// 异步事件发射
await eventBus.emitAsync('player:died', playerData);
```

## 预定义ECS事件

框架提供了完整的ECS事件类型定义，支持实体、组件、系统等核心概念的事件。

### 实体事件

```typescript
import { ECSEventType, IEntityEventData } from './ECS';

// 监听实体创建事件
eventBus.onEntityCreated((data: IEntityEventData) => {
    console.log(`Entity created: ${data.entityName} (ID: ${data.entityId})`);
});

// 监听实体销毁事件
eventBus.on<IEntityEventData>(ECSEventType.ENTITY_DESTROYED, (data) => {
    console.log(`Entity destroyed: ${data.entityName}`);
});

// 手动发射实体事件
eventBus.emitEntityCreated({
    timestamp: Date.now(),
    source: 'GameManager',
    entityId: 123,
    entityName: 'Player',
    entityTag: 'player'
});
```

### 组件事件

```typescript
import { IComponentEventData } from './ECS';

// 监听组件添加事件
eventBus.onComponentAdded((data: IComponentEventData) => {
    console.log(`Component ${data.componentType} added to entity ${data.entityId}`);
});

// 监听组件移除事件
eventBus.on<IComponentEventData>(ECSEventType.COMPONENT_REMOVED, (data) => {
    console.log(`Component ${data.componentType} removed from entity ${data.entityId}`);
});
```

### 系统事件

```typescript
import { ISystemEventData } from './ECS';

// 监听系统错误
eventBus.onSystemError((data: ISystemEventData) => {
    console.error(`System error in ${data.systemName}: ${data.systemType}`);
});

// 监听系统处理开始/结束
eventBus.on<ISystemEventData>(ECSEventType.SYSTEM_PROCESSING_START, (data) => {
    console.log(`System ${data.systemName} started processing`);
});
```

### 性能事件

```typescript
import { IPerformanceEventData } from './ECS';

// 监听性能警告
eventBus.onPerformanceWarning((data: IPerformanceEventData) => {
    console.warn(`Performance warning: ${data.operation} took ${data.executionTime}ms`);
});

// 监听内存使用过高
eventBus.on<IPerformanceEventData>(ECSEventType.MEMORY_USAGE_HIGH, (data) => {
    console.warn(`High memory usage: ${data.memoryUsage}MB`);
});
```

## 事件装饰器

使用装饰器可以自动注册事件监听器，简化代码编写。

### 基础装饰器

```typescript
import { EventHandler, AsyncEventHandler, EventPriority } from './ECS';

class GameManager {
    @EventHandler(ECSEventType.ENTITY_CREATED, { priority: EventPriority.HIGH })
    onEntityCreated(data: IEntityEventData) {
        console.log(`New entity: ${data.entityName}`);
    }
    
    @AsyncEventHandler(ECSEventType.ENTITY_DESTROYED)
    async onEntityDestroyed(data: IEntityEventData) {
        await this.cleanupEntityResources(data.entityId);
    }
    
    @EventHandler('custom:game:event', { once: true })
    onGameStart(data: any) {
        console.log('Game started!');
    }
    
    // 需要手动调用初始化方法
    constructor() {
        // 如果类有initEventListeners方法，会自动注册装饰器定义的监听器
        if (this.initEventListeners) {
            this.initEventListeners();
        }
    }
    
    private async cleanupEntityResources(entityId: number) {
        // 清理实体相关资源
    }
}
```

### 优先级和配置

```typescript
class SystemManager {
    @EventHandler(ECSEventType.SYSTEM_ERROR, { 
        priority: EventPriority.CRITICAL,
        context: this 
    })
    handleSystemError(data: ISystemEventData) {
        this.logError(data);
        this.restartSystem(data.systemName);
    }
    
    @AsyncEventHandler(ECSEventType.PERFORMANCE_WARNING, {
        priority: EventPriority.LOW,
        async: true
    })
    async handlePerformanceWarning(data: IPerformanceEventData) {
        await this.optimizePerformance(data);
    }
    
    private logError(data: ISystemEventData) {
        // 错误日志记录
    }
    
    private restartSystem(systemName: string) {
        // 重启系统
    }
    
    private async optimizePerformance(data: IPerformanceEventData) {
        // 性能优化逻辑
    }
}
```

## 高级功能

### 事件批处理

```typescript
// 设置批处理配置
eventBus.setBatchConfig('entity:update', 100, 16); // 批量100个，延迟16ms

// 发射事件（会被批处理）
for (let i = 0; i < 1000; i++) {
    eventBus.emit('entity:update', { entityId: i, data: 'update' });
}

// 手动刷新批处理队列
eventBus.flushBatch('entity:update');
```

### 事件统计和监控

```typescript
// 获取单个事件统计
const stats = eventBus.getStats('entity:created');
console.log(`Event triggered ${stats.triggerCount} times`);
console.log(`Average execution time: ${stats.averageExecutionTime}ms`);

// 获取所有事件统计
const allStats = eventBus.getStats();
if (allStats instanceof Map) {
    allStats.forEach((stat, eventType) => {
        console.log(`${eventType}: ${stat.triggerCount} triggers`);
    });
}

// 重置统计
eventBus.resetStats('entity:created');
```

### 事件类型验证

```typescript
import { EventTypeValidator } from './ECS';

// 检查事件类型是否有效
if (EventTypeValidator.isValid('entity:created')) {
    eventBus.emit('entity:created', data);
}

// 添加自定义事件类型
EventTypeValidator.addCustomType('game:custom:event');

// 获取所有有效事件类型
const validTypes = EventTypeValidator.getAllValidTypes();
console.log('Valid event types:', validTypes);
```

### 调试和日志

```typescript
// 启用调试模式
eventBus.setDebugMode(true);

// 设置最大监听器数量
eventBus.setMaxListeners(50);

// 检查是否有监听器
if (eventBus.hasListeners('entity:created')) {
    console.log('Has listeners for entity:created');
}

// 获取监听器数量
const count = eventBus.getListenerCount('entity:created');
console.log(`${count} listeners for entity:created`);
```

## 性能优化

### 事件过滤和条件监听

```typescript
// 使用条件过滤减少不必要的事件处理
eventBus.on<IEntityEventData>(ECSEventType.ENTITY_CREATED, (data) => {
    // 只处理玩家实体
    if (data.entityTag === 'player') {
        handlePlayerCreated(data);
    }
});

// 更好的方式：使用具体的事件类型
eventBus.on<IEntityEventData>('entity:player:created', handlePlayerCreated);
```

### 内存管理

```typescript
class EventManager {
    private listeners: string[] = [];
    
    public setupListeners() {
        // 保存监听器ID以便清理
        this.listeners.push(
            eventBus.on('event1', this.handler1.bind(this)),
            eventBus.on('event2', this.handler2.bind(this))
        );
    }
    
    public cleanup() {
        // 清理所有监听器
        this.listeners.forEach(id => {
            eventBus.off('event1', id);
            eventBus.off('event2', id);
        });
        this.listeners.length = 0;
    }
    
    private handler1(data: any) { /* ... */ }
    private handler2(data: any) { /* ... */ }
}
```

### 异步事件优化

```typescript
// 使用Promise.all并行处理多个异步事件
const promises = [
    eventBus.emitAsync('save:player', playerData),
    eventBus.emitAsync('update:leaderboard', scoreData),
    eventBus.emitAsync('notify:friends', notificationData)
];

await Promise.all(promises);
```

## 最佳实践

### 1. 事件命名规范

```typescript
// 推荐的事件命名格式：模块:对象:动作
const EVENT_NAMES = {
    // 实体相关
    ENTITY_PLAYER_CREATED: 'entity:player:created',
    ENTITY_ENEMY_DESTROYED: 'entity:enemy:destroyed',
    
    // 游戏逻辑相关
    GAME_LEVEL_COMPLETED: 'game:level:completed',
    GAME_SCORE_UPDATED: 'game:score:updated',
    
    // UI相关
    UI_MENU_OPENED: 'ui:menu:opened',
    UI_BUTTON_CLICKED: 'ui:button:clicked'
};
```

### 2. 类型安全

```typescript
// 定义强类型的事件数据接口
interface GameEvents {
    'player:levelup': { playerId: number; newLevel: number; experience: number };
    'inventory:item:added': { itemId: string; quantity: number; playerId: number };
    'combat:damage:dealt': { attackerId: number; targetId: number; damage: number };
}

// 创建类型安全的事件发射器
class TypedEventBus {
    private eventBus = new EventBus();
    
    emit<K extends keyof GameEvents>(eventType: K, data: GameEvents[K]) {
        this.eventBus.emit(eventType, data);
    }
    
    on<K extends keyof GameEvents>(
        eventType: K, 
        handler: (data: GameEvents[K]) => void
    ) {
        return this.eventBus.on(eventType, handler);
    }
}
```

### 3. 错误处理

```typescript
// 在事件处理器中添加错误处理
eventBus.on<IEntityEventData>(ECSEventType.ENTITY_CREATED, (data) => {
    try {
        processEntityCreation(data);
    } catch (error) {
        console.error('Error processing entity creation:', error);
        // 发射错误事件
        eventBus.emit(ECSEventType.ERROR_OCCURRED, {
            timestamp: Date.now(),
            source: 'EntityCreationHandler',
            error: error.message,
            context: data
        });
    }
});
```

### 4. 模块化事件管理

```typescript
// 为不同模块创建专门的事件管理器
class PlayerEventManager {
    constructor(private eventBus: EventBus) {
        this.setupListeners();
    }
    
    private setupListeners() {
        this.eventBus.onEntityCreated(this.onPlayerCreated.bind(this));
        this.eventBus.on('player:levelup', this.onPlayerLevelUp.bind(this));
        this.eventBus.on('player:died', this.onPlayerDied.bind(this));
    }
    
    private onPlayerCreated(data: IEntityEventData) {
        if (data.entityTag === 'player') {
            // 处理玩家创建逻辑
        }
    }
    
    private onPlayerLevelUp(data: any) {
        // 处理玩家升级逻辑
    }
    
    private onPlayerDied(data: any) {
        // 处理玩家死亡逻辑
    }
}
```

### 5. 与EntityManager集成

```typescript
import { EntityManager } from './ECS';

// EntityManager会自动设置事件总线
const entityManager = new EntityManager();

// 获取事件总线实例
const eventBus = entityManager.eventBus;

// 监听自动发射的ECS事件
eventBus.onEntityCreated((data) => {
    console.log('Entity created automatically:', data);
});

eventBus.onComponentAdded((data) => {
    console.log('Component added automatically:', data);
});

// 创建实体时会自动发射事件
const entity = entityManager.createEntity('Player');

// 添加组件时会自动发射事件
entity.addComponent(new HealthComponent(100));
```

## 总结

ECS框架的事件系统提供了：

- **类型安全**：完整的TypeScript类型支持
- **高性能**：批处理、缓存和优化机制
- **易用性**：装饰器、预定义事件类型
- **可扩展**：自定义事件类型和验证
- **调试友好**：详细的统计信息和调试模式

通过合理使用事件系统，可以实现松耦合的模块化架构，提高代码的可维护性和扩展性。 