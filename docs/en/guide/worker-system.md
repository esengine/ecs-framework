# Worker System

The Worker System (WorkerEntitySystem) is a multi-threaded processing system based on Web Workers in the ECS framework. It's designed for compute-intensive tasks, fully utilizing multi-core CPU performance for true parallel computing.

## Core Features

- **True Parallel Computing**: Execute compute-intensive tasks in background threads using Web Workers
- **Automatic Load Balancing**: Automatically distribute workload based on CPU core count
- **SharedArrayBuffer Optimization**: Zero-copy data sharing for improved large-scale computation performance
- **Graceful Degradation**: Automatic fallback to main thread processing when Workers are not supported
- **Type Safety**: Full TypeScript support and type checking

## Basic Usage

### Simple Physics System Example

```typescript
interface PhysicsData {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
}

@ECSSystem('Physics')
class PhysicsWorkerSystem extends WorkerEntitySystem<PhysicsData> {
  constructor() {
    super(Matcher.all(Position, Velocity, Physics), {
      enableWorker: true,              // Enable Worker parallel processing
      workerCount: 8,                  // Worker count, auto-limited to hardware capacity
      entitiesPerWorker: 100,          // Entities per Worker
      useSharedArrayBuffer: true,      // Enable SharedArrayBuffer optimization
      entityDataSize: 7,               // Data size per entity
      maxEntities: 10000,              // Maximum entity count
      systemConfig: {                  // Configuration passed to Worker
        gravity: 100,
        friction: 0.95
      }
    });
  }

  // Data extraction: Convert Entity to serializable data
  protected extractEntityData(entity: Entity): PhysicsData {
    const position = entity.getComponent(Position);
    const velocity = entity.getComponent(Velocity);
    const physics = entity.getComponent(Physics);

    return {
      id: entity.id,
      x: position.x,
      y: position.y,
      vx: velocity.x,
      vy: velocity.y,
      mass: physics.mass,
      radius: physics.radius
    };
  }

  // Worker processing function: Pure function executed in Worker
  protected workerProcess(
    entities: PhysicsData[],
    deltaTime: number,
    config: any
  ): PhysicsData[] {
    return entities.map(entity => {
      // Apply gravity
      entity.vy += config.gravity * deltaTime;

      // Update position
      entity.x += entity.vx * deltaTime;
      entity.y += entity.vy * deltaTime;

      // Apply friction
      entity.vx *= config.friction;
      entity.vy *= config.friction;

      return entity;
    });
  }

  // Apply results: Apply Worker processing results back to Entity
  protected applyResult(entity: Entity, result: PhysicsData): void {
    const position = entity.getComponent(Position);
    const velocity = entity.getComponent(Velocity);

    position.x = result.x;
    position.y = result.y;
    velocity.x = result.vx;
    velocity.y = result.vy;
  }

  // SharedArrayBuffer optimization support
  protected getDefaultEntityDataSize(): number {
    return 7; // id, x, y, vx, vy, mass, radius
  }

  protected writeEntityToBuffer(entityData: PhysicsData, offset: number): void {
    if (!this.sharedFloatArray) return;

    this.sharedFloatArray[offset + 0] = entityData.id;
    this.sharedFloatArray[offset + 1] = entityData.x;
    this.sharedFloatArray[offset + 2] = entityData.y;
    this.sharedFloatArray[offset + 3] = entityData.vx;
    this.sharedFloatArray[offset + 4] = entityData.vy;
    this.sharedFloatArray[offset + 5] = entityData.mass;
    this.sharedFloatArray[offset + 6] = entityData.radius;
  }

  protected readEntityFromBuffer(offset: number): PhysicsData | null {
    if (!this.sharedFloatArray) return null;

    return {
      id: this.sharedFloatArray[offset + 0],
      x: this.sharedFloatArray[offset + 1],
      y: this.sharedFloatArray[offset + 2],
      vx: this.sharedFloatArray[offset + 3],
      vy: this.sharedFloatArray[offset + 4],
      mass: this.sharedFloatArray[offset + 5],
      radius: this.sharedFloatArray[offset + 6]
    };
  }
}
```

## Configuration Options

The Worker system supports rich configuration options:

```typescript
interface WorkerSystemConfig {
  /** Enable Worker parallel processing */
  enableWorker?: boolean;
  /** Worker count, defaults to CPU core count, auto-limited to system maximum */
  workerCount?: number;
  /** Entities per Worker for load distribution control */
  entitiesPerWorker?: number;
  /** System configuration data passed to Worker */
  systemConfig?: any;
  /** Enable SharedArrayBuffer optimization */
  useSharedArrayBuffer?: boolean;
  /** Float32 count per entity in SharedArrayBuffer */
  entityDataSize?: number;
  /** Maximum entity count (for SharedArrayBuffer pre-allocation) */
  maxEntities?: number;
  /** Pre-compiled Worker script path (for platforms like WeChat Mini Game that don't support dynamic scripts) */
  workerScriptPath?: string;
}
```

### Configuration Recommendations

```typescript
constructor() {
  super(matcher, {
    // Decide based on task complexity
    enableWorker: this.shouldUseWorker(),

    // Worker count: System auto-limits to hardware capacity
    workerCount: 8, // Request 8 Workers, actual count limited by CPU cores

    // Entities per Worker (optional)
    entitiesPerWorker: 200, // Precise load distribution control

    // Enable SharedArrayBuffer for many simple calculations
    useSharedArrayBuffer: this.entityCount > 1000,

    // Set according to actual data structure
    entityDataSize: 8, // Ensure it matches data structure

    // Estimated maximum entity count
    maxEntities: 10000,

    // Global configuration passed to Worker
    systemConfig: {
      gravity: 9.8,
      friction: 0.95,
      worldBounds: { width: 1920, height: 1080 }
    }
  });
}

private shouldUseWorker(): boolean {
  // Decide based on entity count and complexity
  return this.expectedEntityCount > 100;
}

// Get system info
getSystemInfo() {
  const info = this.getWorkerInfo();
  console.log(`Worker count: ${info.workerCount}/${info.maxSystemWorkerCount}`);
  console.log(`Entities per Worker: ${info.entitiesPerWorker || 'auto'}`);
  console.log(`Current mode: ${info.currentMode}`);
}
```

## Processing Modes

The Worker system supports two processing modes:

### 1. Traditional Worker Mode

Data is serialized and passed between main thread and Workers:

```typescript
// Suitable for: Complex computation logic, moderate entity count
constructor() {
  super(matcher, {
    enableWorker: true,
    useSharedArrayBuffer: false, // Use traditional mode
    workerCount: 2
  });
}

protected workerProcess(entities: EntityData[], deltaTime: number): EntityData[] {
  // Complex algorithm logic
  return entities.map(entity => {
    // AI decisions, pathfinding, etc.
    return this.complexAILogic(entity, deltaTime);
  });
}
```

### 2. SharedArrayBuffer Mode

Zero-copy data sharing, suitable for many simple calculations:

```typescript
// Suitable for: Many entities with simple calculations
constructor() {
  super(matcher, {
    enableWorker: true,
    useSharedArrayBuffer: true, // Enable shared memory
    entityDataSize: 6,
    maxEntities: 10000
  });
}

protected getSharedArrayBufferProcessFunction(): SharedArrayBufferProcessFunction {
  return function(sharedFloatArray: Float32Array, startIndex: number, endIndex: number, deltaTime: number, config: any) {
    const entitySize = 6;
    for (let i = startIndex; i < endIndex; i++) {
      const offset = i * entitySize;

      // Read data
      let x = sharedFloatArray[offset];
      let y = sharedFloatArray[offset + 1];
      let vx = sharedFloatArray[offset + 2];
      let vy = sharedFloatArray[offset + 3];

      // Physics calculations
      vy += config.gravity * deltaTime;
      x += vx * deltaTime;
      y += vy * deltaTime;

      // Write back data
      sharedFloatArray[offset] = x;
      sharedFloatArray[offset + 1] = y;
      sharedFloatArray[offset + 2] = vx;
      sharedFloatArray[offset + 3] = vy;
    }
  };
}
```

## Use Cases

The Worker system is particularly suitable for:

### 1. Physics Simulation
- **Gravity systems**: Gravity calculations for many entities
- **Collision detection**: Complex collision algorithms
- **Fluid simulation**: Particle fluid systems
- **Cloth simulation**: Vertex physics calculations

### 2. AI Computation
- **Pathfinding**: A*, Dijkstra algorithms
- **Behavior trees**: Complex AI decision logic
- **Swarm intelligence**: Boid, fish school algorithms
- **Neural networks**: Simple AI inference

### 3. Data Processing
- **Bulk entity updates**: State machines, lifecycle management
- **Statistical calculations**: Game data analysis
- **Image processing**: Texture generation, effect calculations
- **Audio processing**: Sound synthesis, spectrum analysis

## Best Practices

### 1. Worker Function Requirements

```typescript
// Recommended: Worker processing function is a pure function
protected workerProcess(entities: PhysicsData[], deltaTime: number, config: any): PhysicsData[] {
  // Only use parameters and standard JavaScript APIs
  return entities.map(entity => {
    // Pure computation logic, no external state dependencies
    entity.y += entity.velocity * deltaTime;
    return entity;
  });
}

// Avoid: Using external references in Worker function
protected workerProcess(entities: PhysicsData[], deltaTime: number): PhysicsData[] {
  // this and external variables are not available in Worker
  return entities.map(entity => {
    entity.y += this.someProperty; // Error
    return entity;
  });
}
```

### 2. Data Design

```typescript
// Recommended: Reasonable data design
interface SimplePhysicsData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  // Keep data structure simple for easy serialization
}

// Avoid: Complex nested objects
interface ComplexData {
  transform: {
    position: { x: number; y: number };
    rotation: { angle: number };
  };
  // Complex nested structures increase serialization overhead
}
```

### 3. Worker Count Control

```typescript
// Recommended: Flexible Worker configuration
constructor() {
  super(matcher, {
    // Specify needed Worker count, system auto-limits to hardware capacity
    workerCount: 8,                     // Request 8 Workers
    entitiesPerWorker: 100,            // 100 entities per Worker
    enableWorker: this.shouldUseWorker(), // Conditional enable
  });
}

private shouldUseWorker(): boolean {
  // Decide based on entity count and complexity
  return this.expectedEntityCount > 100;
}

// Get actual Worker info
checkWorkerConfiguration() {
  const info = this.getWorkerInfo();
  console.log(`Requested Workers: 8`);
  console.log(`Actual Workers: ${info.workerCount}`);
  console.log(`System maximum: ${info.maxSystemWorkerCount}`);
  console.log(`Entities per Worker: ${info.entitiesPerWorker || 'auto'}`);
}
```

### 4. Performance Monitoring

```typescript
// Recommended: Performance monitoring
public getPerformanceMetrics(): WorkerPerformanceMetrics {
  return {
    ...this.getWorkerInfo(),
    entityCount: this.entities.length,
    averageProcessTime: this.getAverageProcessTime(),
    workerUtilization: this.getWorkerUtilization()
  };
}
```

## Performance Optimization Tips

### 1. Compute Intensity Assessment
Only use Workers for compute-intensive tasks to avoid thread overhead for simple calculations.

### 2. Data Transfer Optimization
- Use SharedArrayBuffer to reduce serialization overhead
- Keep data structures simple and flat
- Avoid frequent large data transfers

### 3. Degradation Strategy
Always provide main thread fallback to ensure normal operation in environments without Worker support.

### 4. Memory Management
Clean up Worker pools and shared buffers promptly to avoid memory leaks.

### 5. Load Balancing
Use `entitiesPerWorker` parameter to precisely control load distribution, avoiding idle Workers while others are overloaded.

## WeChat Mini Game Support

WeChat Mini Game has special Worker limitations and doesn't support dynamic Worker script creation. ESEngine provides the `@esengine/worker-generator` CLI tool to solve this problem.

### WeChat Mini Game Worker Limitations

| Feature | Browser | WeChat Mini Game |
|---------|---------|------------------|
| Dynamic scripts (Blob URL) | Supported | Not supported |
| Worker count | Multiple | Maximum 1 |
| Script source | Any | Must be in code package |
| SharedArrayBuffer | Requires COOP/COEP | Limited support |

### Using Worker Generator CLI

#### 1. Install the Tool

```bash
pnpm add -D @esengine/worker-generator
```

#### 2. Configure workerScriptPath

Configure `workerScriptPath` in your WorkerEntitySystem subclass:

```typescript
@ECSSystem('Physics')
class PhysicsWorkerSystem extends WorkerEntitySystem<PhysicsData> {
  constructor() {
    super(Matcher.all(Position, Velocity, Physics), {
      enableWorker: true,
      workerScriptPath: 'workers/physics-worker.js', // Specify Worker file path
      systemConfig: {
        gravity: 100,
        friction: 0.95
      }
    });
  }

  protected workerProcess(
    entities: PhysicsData[],
    deltaTime: number,
    config: any
  ): PhysicsData[] {
    // Physics calculation logic
    return entities.map(entity => {
      entity.vy += config.gravity * deltaTime;
      entity.x += entity.vx * deltaTime;
      entity.y += entity.vy * deltaTime;
      return entity;
    });
  }

  // ... other methods
}
```

#### 3. Generate Worker Files

Run the CLI tool to automatically extract `workerProcess` functions and generate WeChat Mini Game compatible Worker files:

```bash
# Basic usage
npx esengine-worker-gen --src ./src --wechat

# Full options
npx esengine-worker-gen \
  --src ./src \           # Source directory
  --wechat \              # Generate WeChat Mini Game compatible code
  --mapping \             # Generate worker-mapping.json
  --verbose               # Verbose output
```

The CLI tool will:
1. Scan source directory for all `WorkerEntitySystem` subclasses
2. Read each class's `workerScriptPath` configuration
3. Extract `workerProcess` method body
4. Convert to ES5 syntax (WeChat Mini Game compatible)
5. Generate to configured path

#### 4. Configure game.json

Configure workers directory in WeChat Mini Game's `game.json`:

```json
{
  "deviceOrientation": "portrait",
  "workers": "workers"
}
```

#### 5. Project Structure

```
your-game/
├── game.js
├── game.json           # Configure "workers": "workers"
├── src/
│   └── systems/
│       └── PhysicsSystem.ts  # workerScriptPath: 'workers/physics-worker.js'
└── workers/
    ├── physics-worker.js     # Auto-generated
    └── worker-mapping.json   # Auto-generated
```

### Temporarily Disabling Workers

If you need to temporarily disable Workers (e.g., for debugging), there are two ways:

#### Method 1: Configuration Disable

```typescript
constructor() {
  super(matcher, {
    enableWorker: false, // Disable Worker, use main thread processing
    // ...
  });
}
```

#### Method 2: Platform Adapter Disable

Return Worker not supported in custom platform adapter:

```typescript
class MyPlatformAdapter implements IPlatformAdapter {
  isWorkerSupported(): boolean {
    return false; // Return false to disable Worker
  }
  // ...
}
```

### Important Notes

1. **Re-run CLI tool after each `workerProcess` modification** to generate new Worker files

2. **Worker functions must be pure functions**, cannot depend on `this` or external variables:
   ```typescript
   // Correct: Only use parameters
   protected workerProcess(entities, deltaTime, config) {
     return entities.map(e => {
       e.y += config.gravity * deltaTime;
       return e;
     });
   }

   // Wrong: Using this
   protected workerProcess(entities, deltaTime, config) {
     return entities.map(e => {
       e.y += this.gravity * deltaTime; // Cannot access this in Worker
       return e;
     });
   }
   ```

3. **Pass configuration data via `systemConfig`**, not class properties

4. **Developer tool warnings can be ignored**:
   - `getNetworkType:fail not support` - WeChat DevTools internal behavior
   - `SharedArrayBuffer will require cross-origin isolation` - Development environment warning, won't appear on real devices

## Online Demo

See the complete Worker system demo: [Worker System Demo](https://esengine.github.io/ecs-framework/demos/worker-system/)

The demo showcases:
- Multi-threaded physics computation
- Real-time performance comparison
- SharedArrayBuffer optimization
- Parallel processing of many entities

The Worker system provides powerful parallel computing capabilities for the ECS framework, allowing you to fully utilize modern multi-core processor performance, offering efficient solutions for complex game logic and compute-intensive tasks.
