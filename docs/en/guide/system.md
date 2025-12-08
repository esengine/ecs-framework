# System Architecture

In ECS architecture, Systems are where business logic is processed. Systems are responsible for performing operations on entities that have specific component combinations, serving as the logic processing units of ECS architecture.

## Basic Concepts

Systems are concrete classes that inherit from the `EntitySystem` abstract base class, used for:
- Defining entity processing logic (such as movement, collision detection, rendering, etc.)
- Filtering entities based on component combinations
- Providing lifecycle management and performance monitoring
- Managing entity add/remove events

## System Types

The framework provides several different system base classes:

### EntitySystem - Base System

The most basic system class, all other systems inherit from it:

```typescript
import { EntitySystem, ECSSystem, Matcher } from '@esengine/ecs-framework';

@ECSSystem('Movement')
class MovementSystem extends EntitySystem {
  constructor() {
    // Use Matcher to define entity conditions to process
    super(Matcher.all(Position, Velocity));
  }

  protected process(entities: readonly Entity[]): void {
    for (const entity of entities) {
      const position = entity.getComponent(Position);
      const velocity = entity.getComponent(Velocity);

      if (position && velocity) {
        position.x += velocity.dx * Time.deltaTime;
        position.y += velocity.dy * Time.deltaTime;
      }
    }
  }
}
```

### ProcessingSystem - Processing System

Suitable for systems that don't need to process entities individually:

```typescript
@ECSSystem('Physics')
class PhysicsSystem extends ProcessingSystem {
  constructor() {
    super(); // No Matcher needed
  }

  public processSystem(): void {
    // Execute physics world step
    this.physicsWorld.step(Time.deltaTime);
  }
}
```

### PassiveSystem - Passive System

Passive systems don't actively process, mainly used for listening to entity add and remove events:

```typescript
@ECSSystem('EntityTracker')
class EntityTrackerSystem extends PassiveSystem {
  constructor() {
    super(Matcher.all(Health));
  }

  protected onAdded(entity: Entity): void {
    console.log(`Health entity added: ${entity.name}`);
  }

  protected onRemoved(entity: Entity): void {
    console.log(`Health entity removed: ${entity.name}`);
  }
}
```

### IntervalSystem - Interval System

Systems that execute at fixed time intervals:

```typescript
@ECSSystem('AutoSave')
class AutoSaveSystem extends IntervalSystem {
  constructor() {
    // Execute every 5 seconds
    super(5.0, Matcher.all(SaveData));
  }

  protected process(entities: readonly Entity[]): void {
    console.log('Executing auto save...');
    // Save game data
    this.saveGameData(entities);
  }

  private saveGameData(entities: readonly Entity[]): void {
    // Save logic
  }
}
```

### WorkerEntitySystem - Multi-threaded System

A Web Worker-based multi-threaded processing system, suitable for compute-intensive tasks, capable of fully utilizing multi-core CPU performance.

Worker systems provide true parallel computing capabilities, support SharedArrayBuffer optimization, and have automatic fallback support. Particularly suitable for physics simulation, particle systems, AI computation, and similar scenarios.

**For detailed content, please refer to: [Worker System](/guide/worker-system)**

## Entity Matcher

Matcher is used to define which entities a system needs to process. It provides flexible condition combinations:

### Basic Match Conditions

```typescript
// Must have both Position and Velocity components
const matcher1 = Matcher.all(Position, Velocity);

// Must have at least one of Health or Shield components
const matcher2 = Matcher.any(Health, Shield);

// Must not have Dead component
const matcher3 = Matcher.none(Dead);
```

### Compound Match Conditions

```typescript
// Complex combination conditions
const complexMatcher = Matcher.all(Position, Velocity)
  .any(Player, Enemy)
  .none(Dead, Disabled);

@ECSSystem('Combat')
class CombatSystem extends EntitySystem {
  constructor() {
    super(complexMatcher);
  }
}
```

### Special Match Conditions

```typescript
// Match by tag
const tagMatcher = Matcher.byTag(1); // Match entities with tag 1

// Match by name
const nameMatcher = Matcher.byName("Player"); // Match entities named "Player"

// Single component match
const componentMatcher = Matcher.byComponent(Health); // Match entities with Health component

// Match no entities
const nothingMatcher = Matcher.nothing(); // For systems that only need lifecycle callbacks
```

### Empty Matcher vs Nothing Matcher

```typescript
// empty() - Empty condition, matches all entities
const emptyMatcher = Matcher.empty();

// nothing() - Matches no entities, for systems that only need lifecycle methods
const nothingMatcher = Matcher.nothing();

// Use case: Systems that only need onBegin/onEnd lifecycle
@ECSSystem('FrameTimer')
class FrameTimerSystem extends EntitySystem {
  constructor() {
    super(Matcher.nothing()); // Process no entities
  }

  protected onBegin(): void {
    // Execute at the start of each frame, e.g., record frame start time
    console.log('Frame started');
  }

  protected process(entities: readonly Entity[]): void {
    // Never called because there are no matching entities
  }

  protected onEnd(): void {
    // Execute at the end of each frame
    console.log('Frame ended');
  }
}
```

> **Tip**: For more details on Matcher and entity queries, please refer to the [Entity Query System](/guide/entity-query) documentation.

## System Lifecycle

Systems provide complete lifecycle callbacks:

```typescript
@ECSSystem('Example')
class ExampleSystem extends EntitySystem {
  protected onInitialize(): void {
    console.log('System initialized');
    // Called when system is added to scene, for initializing resources
  }

  protected onBegin(): void {
    // Called before each frame's processing begins
  }

  protected process(entities: readonly Entity[]): void {
    // Main processing logic
    for (const entity of entities) {
      // Process each entity
      // Safe to add/remove components here without affecting current iteration
    }
  }

  protected lateProcess(entities: readonly Entity[]): void {
    // Post-processing after main process
    // Safe to add/remove components here without affecting current iteration
  }

  protected onEnd(): void {
    // Called after each frame's processing ends
  }

  protected onDestroy(): void {
    console.log('System destroyed');
    // Called when system is removed from scene, for cleaning up resources
  }
}
```

## Entity Event Listening

Systems can listen for entity add and remove events:

```typescript
@ECSSystem('EnemyManager')
class EnemyManagerSystem extends EntitySystem {
  private enemyCount = 0;

  constructor() {
    super(Matcher.all(Enemy, Health));
  }

  protected onAdded(entity: Entity): void {
    this.enemyCount++;
    console.log(`Enemy joined battle, current enemy count: ${this.enemyCount}`);

    // Can set initial state for new enemies here
    const health = entity.getComponent(Health);
    if (health) {
      health.current = health.max;
    }
  }

  protected onRemoved(entity: Entity): void {
    this.enemyCount--;
    console.log(`Enemy removed, remaining enemies: ${this.enemyCount}`);

    // Check if all enemies are defeated
    if (this.enemyCount === 0) {
      this.scene?.eventSystem.emitSync('all_enemies_defeated');
    }
  }
}
```

### Important: Timing of onAdded/onRemoved Calls

> **Note**: `onAdded` and `onRemoved` callbacks are called **synchronously**, executing immediately **before** `addComponent`/`removeComponent` returns.

This means:

```typescript
// Wrong: Chain assignment executes after onAdded
const comp = entity.addComponent(new ClickComponent());
comp.element = this._element;  // At this point onAdded has already executed!

// Correct: Pass initial values through constructor
const comp = entity.addComponent(new ClickComponent(this._element));

// Or use the createComponent method
const comp = entity.createComponent(ClickComponent, this._element);
```

**Why this design?**

The event-driven design ensures that `onAdded`/`onRemoved` callbacks are not affected by system registration order. When a component is added, all systems listening for that component receive notification immediately, rather than waiting until the next frame.

**Best Practices:**

1. Component initial values should be passed through the **constructor**
2. Don't rely on setting properties after `addComponent` returns
3. If you need to access component properties in `onAdded`, ensure those properties are set at construction time

### Safely Modifying Components in process/lateProcess

When iterating entities in `process` or `lateProcess`, you can safely add or remove components without affecting the current iteration:

```typescript
@ECSSystem('Damage')
class DamageSystem extends EntitySystem {
  constructor() {
    super(Matcher.all(Health, DamageReceiver));
  }

  protected process(entities: readonly Entity[]): void {
    for (const entity of entities) {
      const health = entity.getComponent(Health);
      const damage = entity.getComponent(DamageReceiver);

      if (health && damage) {
        health.current -= damage.amount;

        // Safe: removing component won't affect current iteration
        entity.removeComponent(damage);

        if (health.current <= 0) {
          // Safe: adding component won't affect current iteration
          entity.addComponent(new Dead());
        }
      }
    }
  }
}
```

The framework creates a snapshot of the entity list before each `process`/`lateProcess` call, ensuring that component changes during iteration won't cause entities to be skipped or processed multiple times.

## Command Buffer (CommandBuffer)

> **v2.3.0+**

CommandBuffer provides a mechanism for deferred execution of entity operations. When you need to destroy entities or perform other operations that might affect iteration during processing, CommandBuffer allows you to defer these operations to the end of the frame.

### Basic Usage

Every EntitySystem has a built-in `commands` property:

```typescript
@ECSSystem('Damage')
class DamageSystem extends EntitySystem {
  constructor() {
    super(Matcher.all(Health, DamageReceiver));
  }

  protected process(entities: readonly Entity[]): void {
    for (const entity of entities) {
      const health = entity.getComponent(Health);
      const damage = entity.getComponent(DamageReceiver);

      if (health && damage) {
        health.current -= damage.amount;

        // Use command buffer to defer component removal
        this.commands.removeComponent(entity, DamageReceiver);

        if (health.current <= 0) {
          // Defer adding death marker
          this.commands.addComponent(entity, new Dead());
          // Defer entity destruction
          this.commands.destroyEntity(entity);
        }
      }
    }
  }
}
```

### Supported Commands

| Method | Description |
|--------|-------------|
| `addComponent(entity, component)` | Defer adding component |
| `removeComponent(entity, ComponentType)` | Defer removing component |
| `destroyEntity(entity)` | Defer destroying entity |
| `setEntityActive(entity, active)` | Defer setting entity active state |

### Execution Timing

Commands in the buffer are automatically executed after the `lateUpdate` phase of each frame. Execution order matches the order commands were queued.

```
Scene Update Flow:
1. onBegin()
2. process()
3. lateProcess()
4. onEnd()
5. flushCommandBuffers()  <-- Commands execute here
```

### Use Cases

CommandBuffer is suitable for:

1. **Destroying entities during iteration**: Avoid modifying collection being traversed
2. **Batch deferred operations**: Merge multiple operations to execute at end of frame
3. **Cross-system coordination**: One system marks, another system responds

```typescript
// Example: Enemy death system
@ECSSystem('EnemyDeath')
class EnemyDeathSystem extends EntitySystem {
  constructor() {
    super(Matcher.all(Enemy, Health));
  }

  protected process(entities: readonly Entity[]): void {
    for (const entity of entities) {
      const health = entity.getComponent(Health);
      if (health && health.current <= 0) {
        // Play death animation, spawn loot, etc.
        this.spawnLoot(entity);

        // Defer destruction, doesn't affect current iteration
        this.commands.destroyEntity(entity);
      }
    }
  }

  private spawnLoot(entity: Entity): void {
    // Loot spawning logic
  }
}
```

### Notes

- Commands skip already destroyed entities (safety check)
- Single command failure doesn't affect other commands
- Commands execute in queue order
- Command queue clears after each `flush()`

## System Properties and Methods

### Important Properties

```typescript
@ECSSystem('Example')
class ExampleSystem extends EntitySystem {
  showSystemInfo(): void {
    console.log(`System name: ${this.systemName}`);        // System name
    console.log(`Update order: ${this.updateOrder}`);      // Update order
    console.log(`Is enabled: ${this.enabled}`);            // Enabled state
    console.log(`Entity count: ${this.entities.length}`);  // Number of matched entities
    console.log(`Scene: ${this.scene?.name}`);             // Parent scene
  }
}
```

### Entity Access

```typescript
protected process(entities: readonly Entity[]): void {
  // Method 1: Use entity list from parameter
  for (const entity of entities) {
    // Process entity
  }

  // Method 2: Use this.entities property (same as parameter)
  for (const entity of this.entities) {
    // Process entity
  }
}
```

### Controlling System Execution

```typescript
@ECSSystem('Conditional')
class ConditionalSystem extends EntitySystem {
  private shouldProcess = true;

  protected onCheckProcessing(): boolean {
    // Return false to skip this processing
    return this.shouldProcess && this.entities.length > 0;
  }

  public pause(): void {
    this.shouldProcess = false;
  }

  public resume(): void {
    this.shouldProcess = true;
  }
}
```

## Event System Integration

Systems can conveniently listen for and send events:

```typescript
@ECSSystem('GameLogic')
class GameLogicSystem extends EntitySystem {
  protected onInitialize(): void {
    // Add event listeners (automatically cleaned up when system is destroyed)
    this.addEventListener('player_died', this.onPlayerDied.bind(this));
    this.addEventListener('level_complete', this.onLevelComplete.bind(this));
  }

  private onPlayerDied(data: any): void {
    console.log('Player died, restarting game');
    // Handle player death logic
  }

  private onLevelComplete(data: any): void {
    console.log('Level complete, loading next level');
    // Handle level completion logic
  }

  protected process(entities: readonly Entity[]): void {
    // Send events during processing
    for (const entity of entities) {
      const health = entity.getComponent(Health);
      if (health && health.current <= 0) {
        this.scene?.eventSystem.emitSync('entity_died', { entity });
      }
    }
  }
}
```

## Performance Monitoring

Systems have built-in performance monitoring:

```typescript
@ECSSystem('Performance')
class PerformanceSystem extends EntitySystem {
  protected onEnd(): void {
    // Get performance data
    const perfData = this.getPerformanceData();
    if (perfData) {
      console.log(`Execution time: ${perfData.executionTime.toFixed(2)}ms`);
    }

    // Get performance statistics
    const stats = this.getPerformanceStats();
    if (stats) {
      console.log(`Average execution time: ${stats.averageTime.toFixed(2)}ms`);
    }
  }

  public resetPerformance(): void {
    this.resetPerformanceData();
  }
}
```

## System Management

### Adding Systems to Scene

The framework provides two ways to add systems: pass an instance or pass a type (automatic dependency injection).

```typescript
// Add systems in scene subclass
class GameScene extends Scene {
  protected initialize(): void {
    // Method 1: Pass instance
    this.addSystem(new MovementSystem());
    this.addSystem(new RenderSystem());

    // Method 2: Pass type (automatic dependency injection)
    this.addEntityProcessor(PhysicsSystem);

    // Set system update order
    const movementSystem = this.getSystem(MovementSystem);
    if (movementSystem) {
      movementSystem.updateOrder = 1;
    }
  }
}
```

### System Dependency Injection

Systems implement the `IService` interface and support obtaining other services or systems through dependency injection:

```typescript
import { ECSSystem, Injectable, Inject } from '@esengine/ecs-framework';

@Injectable()
@ECSSystem('Physics')
class PhysicsSystem extends EntitySystem {
  constructor(
    @Inject(CollisionService) private collision: CollisionService
  ) {
    super(Matcher.all(Transform, RigidBody));
  }

  protected process(entities: readonly Entity[]): void {
    // Use injected service
    this.collision.detectCollisions(entities);
  }

  // Implement IService interface dispose method
  public dispose(): void {
    // Clean up resources
  }
}

// Just pass the type when using, framework will auto-inject dependencies
class GameScene extends Scene {
  protected initialize(): void {
    // Automatic dependency injection
    this.addEntityProcessor(PhysicsSystem);
  }
}
```

Notes:
- Use `@Injectable()` decorator to mark systems that need dependency injection
- Use `@Inject()` decorator in constructor parameters to declare dependencies
- Systems must implement the `dispose()` method (IService interface requirement)
- Use `addEntityProcessor(Type)` instead of `addSystem(new Type())` to enable dependency injection

### System Update Order

System execution order is determined by the `updateOrder` property. Lower values execute first:

```typescript
@ECSSystem('Input')
class InputSystem extends EntitySystem {
  constructor() {
    super(Matcher.all(InputComponent));
    this.updateOrder = -100; // Input system executes first
  }
}

@ECSSystem('Physics')
class PhysicsSystem extends EntitySystem {
  constructor() {
    super(Matcher.all(RigidBody));
    this.updateOrder = 0; // Default order
  }
}

@ECSSystem('Render')
class RenderSystem extends EntitySystem {
  constructor() {
    super(Matcher.all(Sprite, Transform));
    this.updateOrder = 100; // Render system executes last
  }
}
```

#### Stable Sorting: addOrder

When multiple systems have the same `updateOrder`, the framework uses `addOrder` (add order) as a secondary sorting criterion to ensure stable and predictable results:

```typescript
// Both systems have default updateOrder of 0
@ECSSystem('SystemA')
class SystemA extends EntitySystem { /* ... */ }

@ECSSystem('SystemB')
class SystemB extends EntitySystem { /* ... */ }

// Add order determines execution order
scene.addSystem(new SystemA()); // addOrder = 0, executes first
scene.addSystem(new SystemB()); // addOrder = 1, executes second
```

> **Note**: `addOrder` is automatically set by the framework when calling `addSystem`, no manual management needed. This ensures systems with the same `updateOrder` execute in their addition order, avoiding random behavior from unstable sorting.

## Complex System Examples

### Collision Detection System

```typescript
@ECSSystem('Collision')
class CollisionSystem extends EntitySystem {
  constructor() {
    super(Matcher.all(Transform, Collider));
  }

  protected process(entities: readonly Entity[]): void {
    // Simple n² collision detection
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        this.checkCollision(entities[i], entities[j]);
      }
    }
  }

  private checkCollision(entityA: Entity, entityB: Entity): void {
    const transformA = entityA.getComponent(Transform);
    const transformB = entityB.getComponent(Transform);
    const colliderA = entityA.getComponent(Collider);
    const colliderB = entityB.getComponent(Collider);

    if (this.isColliding(transformA, colliderA, transformB, colliderB)) {
      // Send collision event
      this.scene?.eventSystem.emitSync('collision', {
        entityA,
        entityB
      });
    }
  }

  private isColliding(transformA: Transform, colliderA: Collider,
                     transformB: Transform, colliderB: Collider): boolean {
    // Collision detection logic
    return false; // Simplified example
  }
}
```

### State Machine System

```typescript
@ECSSystem('StateMachine')
class StateMachineSystem extends EntitySystem {
  constructor() {
    super(Matcher.all(StateMachine));
  }

  protected process(entities: readonly Entity[]): void {
    for (const entity of entities) {
      const stateMachine = entity.getComponent(StateMachine);
      if (stateMachine) {
        stateMachine.updateTimer(Time.deltaTime);
        this.updateState(entity, stateMachine);
      }
    }
  }

  private updateState(entity: Entity, stateMachine: StateMachine): void {
    switch (stateMachine.currentState) {
      case EntityState.Idle:
        this.handleIdleState(entity, stateMachine);
        break;
      case EntityState.Moving:
        this.handleMovingState(entity, stateMachine);
        break;
      case EntityState.Attacking:
        this.handleAttackingState(entity, stateMachine);
        break;
    }
  }

  private handleIdleState(entity: Entity, stateMachine: StateMachine): void {
    // Idle state logic
  }

  private handleMovingState(entity: Entity, stateMachine: StateMachine): void {
    // Moving state logic
  }

  private handleAttackingState(entity: Entity, stateMachine: StateMachine): void {
    // Attacking state logic
  }
}
```

## Best Practices

### 1. Single Responsibility for Systems

```typescript
// Good system design - single responsibility
@ECSSystem('Movement')
class MovementSystem extends EntitySystem {
  constructor() {
    super(Matcher.all(Position, Velocity));
  }
}

@ECSSystem('Rendering')
class RenderingSystem extends EntitySystem {
  constructor() {
    super(Matcher.all(Sprite, Transform));
  }
}

// Avoid - too many responsibilities
@ECSSystem('GameSystem')
class GameSystem extends EntitySystem {
  // One system handling movement, rendering, sound effects, and more
}
```

### 2. Use @ECSSystem Decorator

`@ECSSystem` is a required decorator for system classes, providing type identification and metadata management.

#### Why It's Required

| Feature | Description |
|---------|-------------|
| **Type Identification** | Provides stable system names that remain correct after code obfuscation |
| **Debug Support** | Shows readable system names in performance monitoring, logs, and debug tools |
| **System Management** | Find and manage systems by name |
| **Serialization Support** | Records system configuration during scene serialization |

#### Basic Syntax

```typescript
@ECSSystem(systemName: string)
```

- `systemName`: The system's name, recommend using descriptive names

#### Usage Example

```typescript
// Correct usage
@ECSSystem('Physics')
class PhysicsSystem extends EntitySystem {
  // System implementation
}

// Recommended: Use descriptive names
@ECSSystem('PlayerMovement')
class PlayerMovementSystem extends EntitySystem {
  constructor() {
    super(Matcher.all(Player, Position, Velocity));
  }
}

// Wrong - no decorator
class BadSystem extends EntitySystem {
  // Systems defined this way may have issues in production:
  // 1. Class name changes after code minification, can't identify correctly
  // 2. Performance monitoring and debug tools show incorrect names
}
```

#### System Name Usage

```typescript
@ECSSystem('Combat')
class CombatSystem extends EntitySystem {
  protected onInitialize(): void {
    // Access system name using systemName property
    console.log(`System ${this.systemName} initialized`);  // Output: System Combat initialized
  }
}

// Find system by name
const combat = scene.getSystemByName('Combat');

// Performance monitoring displays system name
const perfData = combatSystem.getPerformanceData();
console.log(`${combatSystem.systemName} execution time: ${perfData?.executionTime}ms`);
```

### 3. Proper Update Order

```typescript
// Set system update order by logical sequence
@ECSSystem('Input')
class InputSystem extends EntitySystem {
  constructor() {
    super();
    this.updateOrder = -100; // Process input first
  }
}

@ECSSystem('Logic')
class GameLogicSystem extends EntitySystem {
  constructor() {
    super();
    this.updateOrder = 0; // Process game logic
  }
}

@ECSSystem('Render')
class RenderSystem extends EntitySystem {
  constructor() {
    super();
    this.updateOrder = 100; // Render last
  }
}
```

### 4. Avoid Direct References Between Systems

```typescript
// Avoid: Direct system references
@ECSSystem('Bad')
class BadSystem extends EntitySystem {
  private otherSystem: SomeOtherSystem; // Avoid direct references to other systems
}

// Recommended: Communicate through event system
@ECSSystem('Good')
class GoodSystem extends EntitySystem {
  protected process(entities: readonly Entity[]): void {
    // Communicate with other systems through event system
    this.scene?.eventSystem.emitSync('data_updated', { entities });
  }
}
```

### 5. Clean Up Resources Promptly

```typescript
@ECSSystem('Resource')
class ResourceSystem extends EntitySystem {
  private resources: Map<string, any> = new Map();

  protected onDestroy(): void {
    // Clean up resources
    for (const [key, resource] of this.resources) {
      if (resource.dispose) {
        resource.dispose();
      }
    }
    this.resources.clear();
  }
}
```

Systems are the logic processing core of ECS architecture. Properly designing and using systems makes your game code more modular, efficient, and maintainable.
