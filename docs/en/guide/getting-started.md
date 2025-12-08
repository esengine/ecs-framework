# Quick Start

This guide will help you get started with ECS Framework, from installation to creating your first ECS application.

## Installation

### NPM Installation

```bash
# Using npm
npm install @esengine/ecs-framework
```

## Initialize Core

### Basic Initialization

The core of ECS Framework is the `Core` class, a singleton that manages the entire framework lifecycle.

```typescript
import { Core } from '@esengine/ecs-framework'

// Method 1: Using config object (recommended)
const core = Core.create({
  debug: true,                    // Enable debug mode for detailed logs and performance monitoring
  debugConfig: {                 // Optional: Advanced debug configuration
    enabled: false,               // Whether to enable WebSocket debug server
    websocketUrl: 'ws://localhost:8080',
    debugFrameRate: 30,          // Debug data send frame rate
    channels: {
      entities: true,
      systems: true,
      performance: true,
      components: true,
      scenes: true
    }
  }
});

// Method 2: Simplified creation (backward compatible)
const core = Core.create(true);  // Equivalent to { debug: true }

// Method 3: Production environment configuration
const core = Core.create({
  debug: false                   // Disable debug in production
});
```

### Core Configuration Details

```typescript
interface ICoreConfig {
  /** Enable debug mode - affects log level and performance monitoring */
  debug?: boolean;

  /** Advanced debug configuration - for dev tools integration */
  debugConfig?: {
    enabled: boolean;                    // Enable debug server
    websocketUrl: string;               // WebSocket server URL
    autoReconnect?: boolean;            // Auto reconnect
    debugFrameRate?: 60 | 30 | 15;     // Debug data send frame rate
    channels: {                         // Data channel configuration
      entities: boolean;                // Entity data
      systems: boolean;                 // System data
      performance: boolean;             // Performance data
      components: boolean;              // Component data
      scenes: boolean;                  // Scene data
    };
  };
}
```

### Core Instance Management

Core uses singleton pattern, accessible via static property after creation:

```typescript
// Create instance
const core = Core.create(true);

// Get created instance
const instance = Core.Instance;  // Returns current instance, null if not created
```

### Game Loop Integration

**Important**: Before creating entities and systems, you need to understand how to integrate ECS Framework into your game engine.

`Core.update(deltaTime)` is the framework heartbeat, must be called every frame. It handles:
- Updating the built-in Time class
- Updating all global managers (timers, object pools, etc.)
- Updating all entity systems in all scenes
- Processing entity creation and destruction
- Collecting performance data (in debug mode)

See engine integration examples: [Game Engine Integration](#game-engine-integration)

## Create Your First ECS Application

### 1. Define Components

Components are pure data containers that store entity state:

```typescript
import { Component, ECSComponent } from '@esengine/ecs-framework'

// Position component
@ECSComponent('Position')
class Position extends Component {
  x: number = 0
  y: number = 0

  constructor(x: number = 0, y: number = 0) {
    super()
    this.x = x
    this.y = y
  }
}

// Velocity component
@ECSComponent('Velocity')
class Velocity extends Component {
  dx: number = 0
  dy: number = 0

  constructor(dx: number = 0, dy: number = 0) {
    super()
    this.dx = dx
    this.dy = dy
  }
}

// Sprite component
@ECSComponent('Sprite')
class Sprite extends Component {
  texture: string = ''
  width: number = 32
  height: number = 32

  constructor(texture: string, width: number = 32, height: number = 32) {
    super()
    this.texture = texture
    this.width = width
    this.height = height
  }
}
```

### 2. Create Entity Systems

Systems contain game logic and process entities with specific components. ECS Framework provides Matcher-based entity filtering:

```typescript
import { EntitySystem, Matcher, Time, ECSSystem } from '@esengine/ecs-framework'

// Movement system - handles position and velocity
@ECSSystem('MovementSystem')
class MovementSystem extends EntitySystem {

  constructor() {
    // Use Matcher to define target entities: must have both Position and Velocity
    super(Matcher.empty().all(Position, Velocity))
  }

  protected process(entities: readonly Entity[]): void {
    // process method receives all matching entities
    for (const entity of entities) {
      const position = entity.getComponent(Position)!
      const velocity = entity.getComponent(Velocity)!

      // Update position (using framework's Time class)
      position.x += velocity.dx * Time.deltaTime
      position.y += velocity.dy * Time.deltaTime

      // Boundary check example
      if (position.x < 0) position.x = 0
      if (position.y < 0) position.y = 0
    }
  }
}

// Render system - handles visible objects
@ECSSystem('RenderSystem')
class RenderSystem extends EntitySystem {

  constructor() {
    // Must have Position and Sprite, optional Velocity (for direction)
    super(Matcher.empty().all(Position, Sprite).any(Velocity))
  }

  protected process(entities: readonly Entity[]): void {
    for (const entity of entities) {
      const position = entity.getComponent(Position)!
      const sprite = entity.getComponent(Sprite)!
      const velocity = entity.getComponent(Velocity) // May be null

      // Flip sprite based on velocity direction (optional logic)
      let flipX = false
      if (velocity && velocity.dx < 0) {
        flipX = true
      }

      // Render logic (pseudocode here)
      this.drawSprite(sprite.texture, position.x, position.y, sprite.width, sprite.height, flipX)
    }
  }

  private drawSprite(texture: string, x: number, y: number, width: number, height: number, flipX: boolean = false) {
    // Actual render implementation depends on your game engine
    const direction = flipX ? '<-' : '->'
    console.log(`Render ${texture} at (${x.toFixed(1)}, ${y.toFixed(1)}) direction: ${direction}`)
  }
}
```


### 3. Create Scene

Recommended to extend Scene class for custom scenes:

```typescript
import { Scene } from '@esengine/ecs-framework'

// Recommended: Extend Scene for custom scene
class GameScene extends Scene {

  initialize(): void {
    // Scene initialization logic
    this.name = "MainScene";

    // Add systems to scene
    this.addSystem(new MovementSystem());
    this.addSystem(new RenderSystem());
  }

  onStart(): void {
    // Logic when scene starts running
    console.log("Game scene started");
  }

  unload(): void {
    // Cleanup logic when scene unloads
    console.log("Game scene unloaded");
  }
}

// Create and set scene
const gameScene = new GameScene();
Core.setScene(gameScene);
```

### 4. Create Entities

```typescript
// Create player entity
const player = gameScene.createEntity("Player");
player.addComponent(new Position(100, 100));
player.addComponent(new Velocity(50, 30));  // Move 50px/sec (x), 30px/sec (y)
player.addComponent(new Sprite("player.png", 64, 64));
```

## Scene Management

Core has built-in scene management, very simple to use:

```typescript
import { Core, Scene } from '@esengine/ecs-framework';

// Initialize Core
Core.create({ debug: true });

// Create and set scene
class GameScene extends Scene {
  initialize(): void {
    this.name = "GamePlay";
    this.addSystem(new MovementSystem());
    this.addSystem(new RenderSystem());
  }
}

const gameScene = new GameScene();
Core.setScene(gameScene);

// Game loop (auto-updates scene)
function gameLoop(deltaTime: number) {
  Core.update(deltaTime);  // Auto-updates global services and scene
}

// Switch scenes
Core.loadScene(new MenuScene());  // Delayed switch (next frame)
Core.setScene(new GameScene());   // Immediate switch

// Access current scene
const currentScene = Core.scene;

// Using fluent API
const player = Core.ecsAPI?.createEntity('Player')
  .addComponent(Position, 100, 100)
  .addComponent(Velocity, 50, 0);
```

### Advanced: Using WorldManager for Multi-World

Only for complex server-side applications (MMO game servers, game room systems, etc.):

```typescript
import { Core, WorldManager } from '@esengine/ecs-framework';

// Initialize Core
Core.create({ debug: true });

// Get WorldManager from service container (Core auto-creates and registers it)
const worldManager = Core.services.resolve(WorldManager);

// Create multiple independent game worlds
const room1 = worldManager.createWorld('room_001');
const room2 = worldManager.createWorld('room_002');

// Create scenes in each world
const gameScene1 = room1.createScene('game', new GameScene());
const gameScene2 = room2.createScene('game', new GameScene());

// Activate scenes
room1.setSceneActive('game', true);
room2.setSceneActive('game', true);

// Game loop (need to manually update worlds)
function gameLoop(deltaTime: number) {
  Core.update(deltaTime);       // Update global services
  worldManager.updateAll();     // Manually update all worlds
}
```

## Game Engine Integration

### Laya Engine Integration

```typescript
import { Stage } from "laya/display/Stage";
import { Laya } from "Laya";
import { Core } from '@esengine/ecs-framework';

// Initialize Laya
Laya.init(800, 600).then(() => {
  // Initialize ECS
  Core.create(true);
  Core.setScene(new GameScene());

  // Start game loop
  Laya.timer.frameLoop(1, this, () => {
    const deltaTime = Laya.timer.delta / 1000;
    Core.update(deltaTime);  // Auto-updates global services and scene
  });
});
```

### Cocos Creator Integration

```typescript
import { Component, _decorator } from 'cc';
import { Core } from '@esengine/ecs-framework';

const { ccclass } = _decorator;

@ccclass('ECSGameManager')
export class ECSGameManager extends Component {
  onLoad() {
    // Initialize ECS
    Core.create(true);
    Core.setScene(new GameScene());
  }

  update(deltaTime: number) {
    // Auto-updates global services and scene
    Core.update(deltaTime);
  }

  onDestroy() {
    // Cleanup resources
    Core.destroy();
  }
}
```


## Next Steps

You've successfully created your first ECS application! Next you can:

- Check the complete [API Documentation](/api/README)
- Explore more [practical examples](/examples/)

## FAQ

### Why isn't my system executing?

Ensure:
1. System is added to scene: `this.addSystem(system)` (in Scene's initialize method)
2. Scene is set: `Core.setScene(scene)`
3. Game loop is calling: `Core.update(deltaTime)`

### How to debug ECS applications?

Enable debug mode:

```typescript
Core.create({ debug: true })

// Get debug data
const debugData = Core.getDebugData()
console.log(debugData)
```
