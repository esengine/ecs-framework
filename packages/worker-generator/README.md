# @esengine/worker-generator

CLI tool to generate Worker files from `WorkerEntitySystem` classes for WeChat Mini Game and other platforms that don't support dynamic Worker scripts.

## Why This Tool?

WeChat Mini Game has strict Worker limitations:
- Cannot create Workers from Blob URLs or dynamic scripts
- Worker scripts must be pre-compiled files in the code package
- Maximum 1 Worker allowed

This tool extracts your `workerProcess` method and generates compatible Worker files automatically.

## Installation

```bash
npm install -D @esengine/worker-generator
# or
pnpm add -D @esengine/worker-generator
```

## Usage

### 1. Configure your WorkerEntitySystem

Add `workerScriptPath` to specify where the Worker file should be generated:

```typescript
@ECSSystem('Physics')
class PhysicsWorkerSystem extends WorkerEntitySystem<PhysicsData> {
  constructor() {
    super(Matcher.all(Position, Velocity), {
      enableWorker: true,
      workerScriptPath: 'workers/physics-worker.js', // Output path
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
    return entities.map(entity => {
      entity.vy += config.gravity * deltaTime;
      entity.x += entity.vx * deltaTime;
      entity.y += entity.vy * deltaTime;
      return entity;
    });
  }
}
```

### 2. Run the Generator

```bash
# Basic usage
npx esengine-worker-gen --src ./src --wechat

# Full options
npx esengine-worker-gen \
  --src ./src \           # Source directory to scan
  --out ./workers \       # Default output directory (if no workerScriptPath)
  --wechat \              # Generate WeChat Mini Game compatible code (ES5)
  --mapping \             # Generate worker-mapping.json
  --verbose               # Verbose output
```

### 3. Configure game.json (WeChat Mini Game)

```json
{
  "workers": "workers"
}
```

## CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `-s, --src <dir>` | Source directory to scan | `./src` |
| `-o, --out <dir>` | Output directory for Worker files | `./workers` |
| `-w, --wechat` | Generate WeChat Mini Game compatible code | `false` |
| `-m, --mapping` | Generate worker-mapping.json file | `true` |
| `-t, --tsconfig <path>` | Path to tsconfig.json | Auto-detect |
| `-v, --verbose` | Verbose output | `false` |

## Output

The tool generates:

1. **Worker files** - JavaScript files containing the extracted `workerProcess` logic
2. **worker-mapping.json** - Mapping of class names to Worker file paths

Example output:
```
workers/
├── physics-worker.js
└── worker-mapping.json
```

## Important Notes

1. **Pure Functions**: Your `workerProcess` must be a pure function - it cannot use `this` or external variables

   ```typescript
   // Correct
   protected workerProcess(entities, deltaTime, config) {
     return entities.map(e => {
       e.y += config.gravity * deltaTime; // Use config parameter
       return e;
     });
   }

   // Wrong
   protected workerProcess(entities, deltaTime, config) {
     return entities.map(e => {
       e.y += this.gravity * deltaTime; // Cannot access this!
       return e;
     });
   }
   ```

2. **Re-run after changes**: Run the generator again after modifying `workerProcess`

3. **ES5 Conversion**: When using `--wechat`, the tool converts:
   - Arrow functions → regular functions
   - `const`/`let` → `var`
   - Spread operator → `Object.assign`
   - Template literals → string concatenation

## License

MIT
