# Scene Management

In the ECS architecture, a Scene is a container for the game world, responsible for managing the lifecycle of entities, systems, and components. Scenes provide a complete ECS runtime environment.

## Basic Concepts

Scene is the core container of the ECS framework, providing:
- Entity creation, management, and destruction
- System registration and execution scheduling
- Component storage and querying
- Event system support
- Performance monitoring and debugging information

## Scene Management Options

ECS Framework provides two scene management approaches:

1. **[SceneManager](./scene-manager)** - Suitable for 95% of game applications
   - Single-player games, simple multiplayer games, mobile games
   - Lightweight, simple and intuitive API
   - Supports scene transitions

2. **[WorldManager](./world-manager)** - Suitable for advanced multi-world isolation scenarios
   - MMO game servers, game room systems
   - Multi-World management, each World can contain multiple scenes
   - Completely isolated independent environments

This document focuses on the usage of the Scene class itself. For detailed information about scene managers, please refer to the corresponding documentation.

## Creating a Scene

### Inheriting the Scene Class

**Recommended: Inherit the Scene class to create custom scenes**

```typescript
import { Scene, EntitySystem } from '@esengine/ecs-framework';

class GameScene extends Scene {
  protected initialize(): void {
    // Set scene name
    this.name = "GameScene";

    // Add systems
    this.addSystem(new MovementSystem());
    this.addSystem(new RenderSystem());
    this.addSystem(new PhysicsSystem());

    // Create initial entities
    this.createInitialEntities();
  }

  private createInitialEntities(): void {
    // Create player
    const player = this.createEntity("Player");
    player.addComponent(new Position(400, 300));
    player.addComponent(new Health(100));
    player.addComponent(new PlayerController());

    // Create enemies
    for (let i = 0; i < 5; i++) {
      const enemy = this.createEntity(`Enemy_${i}`);
      enemy.addComponent(new Position(Math.random() * 800, Math.random() * 600));
      enemy.addComponent(new Health(50));
      enemy.addComponent(new EnemyAI());
    }
  }

  public onStart(): void {
    console.log("Game scene started");
    // Logic when scene starts
  }

  public unload(): void {
    console.log("Game scene unloaded");
    // Cleanup logic when scene unloads
  }
}
```

### Using Scene Configuration

```typescript
import { ISceneConfig } from '@esengine/ecs-framework';

const config: ISceneConfig = {
  name: "MainGame",
  enableEntityDirectUpdate: false
};

class ConfiguredScene extends Scene {
  constructor() {
    super(config);
  }
}
```

## Scene Lifecycle

Scene provides complete lifecycle management:

```typescript
class ExampleScene extends Scene {
  protected initialize(): void {
    // Scene initialization: setup systems and initial entities
    console.log("Scene initializing");
  }

  public onStart(): void {
    // Scene starts running: game logic begins execution
    console.log("Scene starting");
  }

  public unload(): void {
    // Scene unloading: cleanup resources
    console.log("Scene unloading");
  }
}

// Using scenes (lifecycle automatically managed by framework)
const scene = new ExampleScene();
// Scene's initialize(), begin(), update(), end() are automatically called by the framework
```

**Lifecycle Methods**:

1. `initialize()` - Scene initialization, setup systems and initial entities
2. `begin()` / `onStart()` - Scene starts running
3. `update()` - Per-frame update (called by scene manager)
4. `end()` / `unload()` - Scene unloading, cleanup resources

## Entity Management

### Creating Entities

```typescript
class EntityScene extends Scene {
  createGameEntities(): void {
    // Create single entity
    const player = this.createEntity("Player");

    // Batch create entities (high performance)
    const bullets = this.createEntities(100, "Bullet");

    // Add components to batch-created entities
    bullets.forEach((bullet, index) => {
      bullet.addComponent(new Position(index * 10, 100));
      bullet.addComponent(new Velocity(Math.random() * 200 - 100, -300));
    });
  }
}
```

### Finding Entities

```typescript
class SearchScene extends Scene {
  findEntities(): void {
    // Find by name
    const player = this.findEntity("Player");
    const player2 = this.getEntityByName("Player"); // Alias method

    // Find by ID
    const entity = this.findEntityById(123);

    // Find by tag
    const enemies = this.findEntitiesByTag(2);
    const enemies2 = this.getEntitiesByTag(2); // Alias method

    if (player) {
      console.log(`Found player: ${player.name}`);
    }

    console.log(`Found ${enemies.length} enemies`);
  }
}
```

### Destroying Entities

```typescript
class DestroyScene extends Scene {
  cleanupEntities(): void {
    // Destroy all entities
    this.destroyAllEntities();

    // Single entity destruction through the entity itself
    const enemy = this.findEntity("Enemy_1");
    if (enemy) {
      enemy.destroy(); // Entity is automatically removed from the scene
    }
  }
}
```

## System Management

### Adding and Removing Systems

```typescript
class SystemScene extends Scene {
  protected initialize(): void {
    // Add systems
    const movementSystem = new MovementSystem();
    this.addSystem(movementSystem);

    // Set system update order
    movementSystem.updateOrder = 1;

    // Add more systems
    this.addSystem(new PhysicsSystem());
    this.addSystem(new RenderSystem());
  }

  public removeUnnecessarySystems(): void {
    // Get system
    const physicsSystem = this.getEntityProcessor(PhysicsSystem);

    // Remove system
    if (physicsSystem) {
      this.removeSystem(physicsSystem);
    }
  }
}
```

## Event System

Scene has a built-in type-safe event system:

```typescript
class EventScene extends Scene {
  protected initialize(): void {
    // Listen to events
    this.eventSystem.on('player_died', this.onPlayerDied.bind(this));
    this.eventSystem.on('enemy_spawned', this.onEnemySpawned.bind(this));
    this.eventSystem.on('level_complete', this.onLevelComplete.bind(this));
  }

  private onPlayerDied(data: any): void {
    console.log('Player died event');
    // Handle player death
  }

  private onEnemySpawned(data: any): void {
    console.log('Enemy spawned event');
    // Handle enemy spawn
  }

  private onLevelComplete(data: any): void {
    console.log('Level complete event');
    // Handle level completion
  }

  public triggerGameEvent(): void {
    // Send event (synchronous)
    this.eventSystem.emitSync('custom_event', {
      message: "This is a custom event",
      timestamp: Date.now()
    });

    // Send event (asynchronous)
    this.eventSystem.emit('async_event', {
      data: "Async event data"
    });
  }
}
```

## Best Practices

### 1. Scene Responsibility Separation

```typescript
// Good scene design - clear responsibilities
class MenuScene extends Scene {
  // Only handles menu-related logic
}

class GameScene extends Scene {
  // Only handles gameplay logic
}

class InventoryScene extends Scene {
  // Only handles inventory logic
}

// Avoid this design - mixed responsibilities
class MegaScene extends Scene {
  // Contains menu, game, inventory, and all other logic
}
```

### 2. Proper System Organization

```typescript
class OrganizedScene extends Scene {
  protected initialize(): void {
    // Add systems by function and dependencies
    this.addInputSystems();
    this.addLogicSystems();
    this.addRenderSystems();
  }

  private addInputSystems(): void {
    this.addSystem(new InputSystem());
  }

  private addLogicSystems(): void {
    this.addSystem(new MovementSystem());
    this.addSystem(new PhysicsSystem());
    this.addSystem(new CollisionSystem());
  }

  private addRenderSystems(): void {
    this.addSystem(new RenderSystem());
    this.addSystem(new UISystem());
  }
}
```

### 3. Resource Management

```typescript
class ResourceScene extends Scene {
  private textures: Map<string, any> = new Map();
  private sounds: Map<string, any> = new Map();

  protected initialize(): void {
    this.loadResources();
  }

  private loadResources(): void {
    // Load resources needed by the scene
    this.textures.set('player', this.loadTexture('player.png'));
    this.sounds.set('bgm', this.loadSound('bgm.mp3'));
  }

  public unload(): void {
    // Cleanup resources
    this.textures.clear();
    this.sounds.clear();
    console.log('Scene resources cleaned up');
  }

  private loadTexture(path: string): any {
    // Load texture
    return null;
  }

  private loadSound(path: string): any {
    // Load sound
    return null;
  }
}
```

## Next Steps

- Learn about [SceneManager](./scene-manager) - Simple scene management for most games
- Learn about [WorldManager](./world-manager) - For scenarios requiring multi-world isolation
- Learn about [Persistent Entity](./persistent-entity) - Keep entities across scene transitions (v2.2.22+)

Scene is the core container of the ECS framework. Proper scene management makes your game architecture clearer, more modular, and easier to maintain.
