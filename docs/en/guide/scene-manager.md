# SceneManager

SceneManager is a lightweight scene manager provided by ECS Framework, suitable for 95% of game applications. It provides a simple and intuitive API with support for scene transitions and delayed loading.

## Use Cases

SceneManager is suitable for:
- Single-player games
- Simple multiplayer games
- Mobile games
- Games requiring scene transitions (menu, game, pause, etc.)
- Projects that don't need multi-World isolation

## Features

- Lightweight, zero extra overhead
- Simple and intuitive API
- Supports delayed scene transitions (avoids switching mid-frame)
- Automatic ECS fluent API management
- Automatic scene lifecycle handling
- Integrated with Core, auto-updated
- Supports [Persistent Entity](./persistent-entity) migration across scenes (v2.3.0+)

## Basic Usage

### Recommended: Using Core's Static Methods

This is the simplest and recommended approach, suitable for most applications:

```typescript
import { Core, Scene } from '@esengine/ecs-framework';

// 1. Initialize Core
Core.create({ debug: true });

// 2. Create and set scene
class GameScene extends Scene {
  protected initialize(): void {
    this.name = "GameScene";

    // Add systems
    this.addSystem(new MovementSystem());
    this.addSystem(new RenderSystem());

    // Create initial entities
    const player = this.createEntity("Player");
    player.addComponent(new Transform(400, 300));
    player.addComponent(new Health(100));
  }

  public onStart(): void {
    console.log("Game scene started");
  }
}

// 3. Set scene
Core.setScene(new GameScene());

// 4. Game loop (Core.update automatically updates the scene)
function gameLoop(deltaTime: number) {
  Core.update(deltaTime);  // Automatically updates all services and scenes
}

// Laya engine integration
Laya.timer.frameLoop(1, this, () => {
  const deltaTime = Laya.timer.delta / 1000;
  Core.update(deltaTime);
});

// Cocos Creator integration
update(deltaTime: number) {
  Core.update(deltaTime);
}
```

### Advanced: Using SceneManager Directly

If you need more control, you can use SceneManager directly:

```typescript
import { Core, SceneManager, Scene } from '@esengine/ecs-framework';

// Initialize Core
Core.create({ debug: true });

// Get SceneManager (already auto-created and registered by Core)
const sceneManager = Core.services.resolve(SceneManager);

// Set scene
const gameScene = new GameScene();
sceneManager.setScene(gameScene);

// Game loop (still use Core.update)
function gameLoop(deltaTime: number) {
  Core.update(deltaTime);  // Core automatically calls sceneManager.update()
}
```

**Important**: Regardless of which approach you use, you should only call `Core.update()` in the game loop. It automatically updates SceneManager and scenes. You don't need to manually call `sceneManager.update()`.

## Scene Transitions

### Immediate Transition

Use `Core.setScene()` or `sceneManager.setScene()` to immediately switch scenes:

```typescript
// Method 1: Using Core (recommended)
Core.setScene(new MenuScene());

// Method 2: Using SceneManager
const sceneManager = Core.services.resolve(SceneManager);
sceneManager.setScene(new MenuScene());
```

### Delayed Transition

Use `Core.loadScene()` or `sceneManager.loadScene()` for delayed scene transition, which takes effect on the next frame:

```typescript
// Method 1: Using Core (recommended)
Core.loadScene(new GameOverScene());

// Method 2: Using SceneManager
const sceneManager = Core.services.resolve(SceneManager);
sceneManager.loadScene(new GameOverScene());
```

When switching scenes from within a System, use delayed transitions:

```typescript
class GameOverSystem extends EntitySystem {
  process(entities: readonly Entity[]): void {
    const player = entities.find(e => e.name === 'Player');
    const health = player?.getComponent(Health);

    if (health && health.value <= 0) {
      // Delayed transition to game over scene (takes effect next frame)
      Core.loadScene(new GameOverScene());
      // Current frame continues execution, won't interrupt current system processing
    }
  }
}
```

## API Reference

### Core Static Methods (Recommended)

#### Core.setScene()

Immediately switch scenes.

```typescript
public static setScene<T extends IScene>(scene: T): T
```

**Parameters**:
- `scene` - The scene instance to set

**Returns**:
- Returns the set scene instance

**Example**:
```typescript
const gameScene = Core.setScene(new GameScene());
console.log(gameScene.name);
```

#### Core.loadScene()

Delayed scene loading (switches on next frame).

```typescript
public static loadScene<T extends IScene>(scene: T): void
```

**Parameters**:
- `scene` - The scene instance to load

**Example**:
```typescript
Core.loadScene(new GameOverScene());
```

#### Core.scene

Get the currently active scene.

```typescript
public static get scene(): IScene | null
```

**Returns**:
- Current scene instance, or null if no scene

**Example**:
```typescript
const currentScene = Core.scene;
if (currentScene) {
  console.log(`Current scene: ${currentScene.name}`);
}
```

### SceneManager Methods (Advanced)

If you need to use SceneManager directly, get it through the service container:

```typescript
const sceneManager = Core.services.resolve(SceneManager);
```

#### setScene()

Immediately switch scenes.

```typescript
public setScene<T extends IScene>(scene: T): T
```

#### loadScene()

Delayed scene loading.

```typescript
public loadScene<T extends IScene>(scene: T): void
```

#### currentScene

Get the current scene.

```typescript
public get currentScene(): IScene | null
```

#### hasScene

Check if there's an active scene.

```typescript
public get hasScene(): boolean
```

#### hasPendingScene

Check if there's a pending scene transition.

```typescript
public get hasPendingScene(): boolean
```

## Best Practices

### 1. Use Core's Static Methods

```typescript
// Recommended: Use Core's static methods
Core.setScene(new GameScene());
Core.loadScene(new MenuScene());
const currentScene = Core.scene;

// Not recommended: Don't directly use SceneManager unless you have special needs
const sceneManager = Core.services.resolve(SceneManager);
sceneManager.setScene(new GameScene());
```

### 2. Only Call Core.update()

```typescript
// Correct: Only call Core.update()
function gameLoop(deltaTime: number) {
  Core.update(deltaTime);  // Automatically updates all services and scenes
}

// Incorrect: Don't manually call sceneManager.update()
function gameLoop(deltaTime: number) {
  Core.update(deltaTime);
  sceneManager.update();  // Duplicate update, will cause issues!
}
```

### 3. Use Delayed Transitions to Avoid Issues

When switching scenes from within a System, use `loadScene()` instead of `setScene()`:

```typescript
// Recommended: Delayed transition
class HealthSystem extends EntitySystem {
  process(entities: readonly Entity[]): void {
    for (const entity of entities) {
      const health = entity.getComponent(Health);
      if (health.value <= 0) {
        Core.loadScene(new GameOverScene());
        // Current frame continues processing other entities
      }
    }
  }
}

// Not recommended: Immediate transition may cause issues
class HealthSystem extends EntitySystem {
  process(entities: readonly Entity[]): void {
    for (const entity of entities) {
      const health = entity.getComponent(Health);
      if (health.value <= 0) {
        Core.setScene(new GameOverScene());
        // Scene switches immediately, other entities in current frame may not process correctly
      }
    }
  }
}
```

### 4. Scene Responsibility Separation

Each scene should be responsible for only one specific game state:

```typescript
// Good design - clear responsibilities
class MenuScene extends Scene {
  // Only handles menu-related logic
}

class GameScene extends Scene {
  // Only handles gameplay logic
}

class PauseScene extends Scene {
  // Only handles pause screen logic
}

// Avoid this design - mixed responsibilities
class MegaScene extends Scene {
  // Contains menu, game, pause, and all other logic
}
```

### 5. Resource Management

Clean up resources in the scene's `unload()` method:

```typescript
class GameScene extends Scene {
  private textures: Map<string, any> = new Map();
  private sounds: Map<string, any> = new Map();

  protected initialize(): void {
    this.loadResources();
  }

  private loadResources(): void {
    this.textures.set('player', loadTexture('player.png'));
    this.sounds.set('bgm', loadSound('bgm.mp3'));
  }

  public unload(): void {
    // Cleanup resources
    this.textures.clear();
    this.sounds.clear();
    console.log('Scene resources cleaned up');
  }
}
```

### 6. Event-Driven Scene Transitions

Use the event system to trigger scene transitions, keeping code decoupled:

```typescript
class GameScene extends Scene {
  protected initialize(): void {
    // Listen to scene transition events
    this.eventSystem.on('goto:menu', () => {
      Core.loadScene(new MenuScene());
    });

    this.eventSystem.on('goto:gameover', (data) => {
      Core.loadScene(new GameOverScene());
    });
  }
}

// Trigger events in System
class GameLogicSystem extends EntitySystem {
  process(entities: readonly Entity[]): void {
    if (levelComplete) {
      this.scene.eventSystem.emitSync('goto:gameover', {
        score: 1000,
        level: 5
      });
    }
  }
}
```

## Architecture Overview

SceneManager's position in ECS Framework:

```
Core (Global Services)
  └── SceneManager (Scene Management, auto-updated)
      └── Scene (Current Scene)
          ├── EntitySystem (Systems)
          ├── Entity (Entities)
          └── Component (Components)
```

## Comparison with WorldManager

| Feature | SceneManager | WorldManager |
|---------|--------------|--------------|
| Use Case | 95% of game applications | Advanced multi-world isolation scenarios |
| Complexity | Simple | Complex |
| Scene Count | Single scene (switchable) | Multiple Worlds, each with multiple scenes |
| Performance Overhead | Minimal | Higher |
| Usage | `Core.setScene()` | `worldManager.createWorld()` |

**When to use SceneManager**:
- Single-player games
- Simple multiplayer games
- Mobile games
- Scenes that need transitions but don't need to run simultaneously

**When to use WorldManager**:
- MMO game servers (one World per room)
- Game lobby systems (complete isolation per game room)
- Need to run multiple completely independent game instances

## Related Documentation

- [Persistent Entity](./persistent-entity) - Learn how to keep entities across scene transitions
- [WorldManager](./world-manager) - Learn about advanced multi-world isolation features

SceneManager provides simple yet powerful scene management capabilities for most games. Through Core's static methods, you can easily manage scene transitions.
