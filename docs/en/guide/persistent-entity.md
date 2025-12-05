# Persistent Entity

> **Version**: v2.2.22+

Persistent Entity is a special type of entity that automatically migrates to the new scene during scene transitions. It is suitable for game objects that need to maintain state across scenes, such as players, game managers, audio managers, etc.

## Basic Concepts

In the ECS framework, entities have two lifecycle policies:

| Policy | Description | Default |
|--------|-------------|---------|
| `SceneLocal` | Scene-local entity, destroyed when scene changes | ✓ |
| `Persistent` | Persistent entity, automatically migrates during scene transitions | |

## Quick Start

### Creating a Persistent Entity

```typescript
import { Scene } from '@esengine/ecs-framework';

class GameScene extends Scene {
  protected initialize(): void {
    // Create a persistent player entity
    const player = this.createEntity('Player').setPersistent();
    player.addComponent(new Position(100, 200));
    player.addComponent(new PlayerData('Hero', 500));

    // Create a normal enemy entity (destroyed when scene changes)
    const enemy = this.createEntity('Enemy');
    enemy.addComponent(new Position(300, 200));
    enemy.addComponent(new EnemyAI());
  }
}
```

### Behavior During Scene Transitions

```typescript
import { Core, Scene } from '@esengine/ecs-framework';

// Initial scene
class Level1Scene extends Scene {
  protected initialize(): void {
    // Player - persistent, will migrate to the next scene
    const player = this.createEntity('Player').setPersistent();
    player.addComponent(new Position(0, 0));
    player.addComponent(new Health(100));

    // Enemy - scene-local, destroyed when scene changes
    const enemy = this.createEntity('Enemy');
    enemy.addComponent(new Position(100, 100));
  }
}

// Target scene
class Level2Scene extends Scene {
  protected initialize(): void {
    // New enemy
    const enemy = this.createEntity('Boss');
    enemy.addComponent(new Position(200, 200));
  }

  public onStart(): void {
    // Player has automatically migrated to this scene
    const player = this.findEntity('Player');
    console.log(player !== null); // true

    // Position and health data are fully preserved
    const position = player?.getComponent(Position);
    const health = player?.getComponent(Health);
    console.log(position?.x, position?.y); // 0, 0
    console.log(health?.value); // 100
  }
}

// Switch scenes
Core.create({ debug: true });
Core.setScene(new Level1Scene());

// Later switch to Level2
Core.loadScene(new Level2Scene());
// Player entity migrates automatically, Enemy entity is destroyed
```

## API Reference

### Entity Methods

#### setPersistent()

Marks the entity as persistent, preventing destruction during scene transitions.

```typescript
public setPersistent(): this
```

**Returns**: Returns the entity itself for method chaining

**Example**:
```typescript
const player = scene.createEntity('Player')
  .setPersistent();

player.addComponent(new Position(100, 200));
```

#### setSceneLocal()

Restores the entity to scene-local policy (default).

```typescript
public setSceneLocal(): this
```

**Returns**: Returns the entity itself for method chaining

**Example**:
```typescript
// Dynamically cancel persistence
player.setSceneLocal();
```

#### isPersistent

Checks if the entity is persistent.

```typescript
public get isPersistent(): boolean
```

**Example**:
```typescript
if (entity.isPersistent) {
  console.log('This is a persistent entity');
}
```

#### lifecyclePolicy

Gets the entity's lifecycle policy.

```typescript
public get lifecyclePolicy(): EEntityLifecyclePolicy
```

**Example**:
```typescript
import { EEntityLifecyclePolicy } from '@esengine/ecs-framework';

if (entity.lifecyclePolicy === EEntityLifecyclePolicy.Persistent) {
  console.log('Persistent entity');
}
```

### Scene Methods

#### findPersistentEntities()

Finds all persistent entities in the scene.

```typescript
public findPersistentEntities(): Entity[]
```

**Returns**: Array of persistent entities

**Example**:
```typescript
const persistentEntities = scene.findPersistentEntities();
console.log(`Scene has ${persistentEntities.length} persistent entities`);
```

#### extractPersistentEntities()

Extracts and removes all persistent entities from the scene (typically called internally by the framework).

```typescript
public extractPersistentEntities(): Entity[]
```

**Returns**: Array of extracted persistent entities

#### receiveMigratedEntities()

Receives migrated entities (typically called internally by the framework).

```typescript
public receiveMigratedEntities(entities: Entity[]): void
```

**Parameters**:
- `entities` - Array of entities to receive

## Use Cases

### 1. Player Entity Across Levels

```typescript
class PlayerSetupScene extends Scene {
  protected initialize(): void {
    // Player maintains state across all levels
    const player = this.createEntity('Player').setPersistent();
    player.addComponent(new Transform(0, 0));
    player.addComponent(new Health(100));
    player.addComponent(new Inventory());
    player.addComponent(new PlayerStats());
  }
}

class Level1 extends Scene { /* ... */ }
class Level2 extends Scene { /* ... */ }
class Level3 extends Scene { /* ... */ }

// Player entity automatically migrates between all levels
Core.setScene(new PlayerSetupScene());
// ... game progresses
Core.loadScene(new Level1());
// ... level complete
Core.loadScene(new Level2());
// Player data (health, inventory, stats) fully preserved
```

### 2. Global Managers

```typescript
class BootstrapScene extends Scene {
  protected initialize(): void {
    // Audio manager - persists across scenes
    const audioManager = this.createEntity('AudioManager').setPersistent();
    audioManager.addComponent(new AudioController());

    // Achievement manager - persists across scenes
    const achievementManager = this.createEntity('AchievementManager').setPersistent();
    achievementManager.addComponent(new AchievementTracker());

    // Game settings - persists across scenes
    const settings = this.createEntity('GameSettings').setPersistent();
    settings.addComponent(new SettingsData());
  }
}
```

### 3. Dynamically Toggling Persistence

```typescript
class GameScene extends Scene {
  protected initialize(): void {
    // Initially created as a normal entity
    const companion = this.createEntity('Companion');
    companion.addComponent(new Transform(0, 0));
    companion.addComponent(new CompanionAI());

    // Listen for recruitment event
    this.eventSystem.on('companion:recruited', () => {
      // After recruitment, become persistent
      companion.setPersistent();
      console.log('Companion joined the party, will follow player across scenes');
    });

    // Listen for dismissal event
    this.eventSystem.on('companion:dismissed', () => {
      // After dismissal, restore to scene-local
      companion.setSceneLocal();
      console.log('Companion left the party, will no longer persist across scenes');
    });
  }
}
```

## Best Practices

### 1. Clearly Identify Persistent Entities

```typescript
// Recommended: Mark immediately when creating
const player = this.createEntity('Player').setPersistent();

// Not recommended: Marking after creation (easy to forget)
const player = this.createEntity('Player');
// ... lots of code ...
player.setPersistent(); // Easy to forget
```

### 2. Use Persistence Appropriately

```typescript
// ✓ Entities suitable for persistence
const player = this.createEntity('Player').setPersistent();      // Player
const gameManager = this.createEntity('GameManager').setPersistent(); // Global manager
const audioManager = this.createEntity('AudioManager').setPersistent(); // Audio system

// ✗ Entities that should NOT be persistent
const bullet = this.createEntity('Bullet'); // Temporary objects
const enemy = this.createEntity('Enemy');   // Level-specific enemies
const particle = this.createEntity('Particle'); // Effect particles
```

### 3. Check Migrated Entities

```typescript
class NewScene extends Scene {
  public onStart(): void {
    // Check if expected persistent entities exist
    const player = this.findEntity('Player');
    if (!player) {
      console.error('Player entity did not migrate correctly!');
      // Handle error case
    }
  }
}
```

### 4. Avoid Circular References

```typescript
// ✗ Avoid: Persistent entity referencing scene-local entity
class BadScene extends Scene {
  protected initialize(): void {
    const player = this.createEntity('Player').setPersistent();
    const enemy = this.createEntity('Enemy');

    // Dangerous: player is persistent but enemy is not
    // After scene change, enemy is destroyed, reference becomes invalid
    player.addComponent(new TargetComponent(enemy));
  }
}

// ✓ Recommended: Use ID references or event system
class GoodScene extends Scene {
  protected initialize(): void {
    const player = this.createEntity('Player').setPersistent();
    const enemy = this.createEntity('Enemy');

    // Store ID instead of direct reference
    player.addComponent(new TargetComponent(enemy.id));

    // Or use event system for communication
  }
}
```

## Important Notes

1. **Destroyed entities will not migrate**: If an entity is destroyed before scene transition, it will not migrate even if marked as persistent.

2. **Component data is fully preserved**: All components and their state are preserved during migration.

3. **Scene reference is updated**: After migration, the entity's `scene` property will point to the new scene.

4. **Query system is updated**: Migrated entities are automatically registered in the new scene's query system.

5. **Delayed transitions also work**: Persistent entities migrate when using `Core.loadScene()` for delayed transitions as well.

## Related Documentation

- [Scene](./scene) - Learn the basics of scenes
- [SceneManager](./scene-manager) - Learn about scene transitions
- [WorldManager](./world-manager) - Learn about multi-world management
