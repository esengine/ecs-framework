# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ECS Framework is a high-performance TypeScript Entity-Component-System framework for game development. It's a Lerna monorepo supporting Laya, Cocos Creator, and Web platforms with unique features like multi-threaded Worker systems and SharedArrayBuffer optimizations.

## Development Commands

### Build Commands
```bash
# Build all packages in dependency order
npm run build

# Build specific packages
npm run build:core
npm run build:math
npm run build:network-shared
npm run build:network-client
npm run build:network-server

# Build for npm publishing (includes rollup bundling)
npm run build:npm
npm run build:npm:core  # For specific package
```

### Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci

# Run performance tests (packages/core only)
cd packages/core && npm run test:performance

# Watch mode for specific package
cd packages/core && npm run test:watch
```

Tests are located in `packages/*/tests/` directories. The core package uses Jest with ts-jest preset and requires minimum coverage thresholds.

### Linting & Formatting
```bash
# Lint all packages
npm run lint
npm run lint:fix

# Format code
npm run format
npm run format:check

# Type checking
npm run type-check
```

### Documentation
```bash
# Run docs dev server
npm run docs:dev

# Build documentation
npm run docs:build

# Generate API docs with TypeDoc
npm run docs:api
npm run docs:api:watch
```

## Monorepo Architecture

### Package Structure & Dependencies
```
packages/
├── core/                    - @esengine/ecs-framework (v2.2.12)
│                             Main ECS implementation, zero dependencies
├── math/                    - @esengine/ecs-framework-math (v1.0.5)
│                             2D math library, independent
├── network-shared/          - @esengine/network-shared (v1.0.2)
│                             Shared networking code (depends on: core)
├── network-client/          - @esengine/network-client (v1.0.1)
│                             Client networking (depends on: core, network-shared)
├── network-server/          - @esengine/network-server (v1.0.1)
│                             Node.js server (depends on: core, network-shared, ws)
├── behavior-tree/           - @esengine/behavior-tree (v1.0.1)
│                             Behavior tree system (peer: core ^2.2.8)
├── editor-core/             - @esengine/editor-core (v1.0.0)
│                             Plugin-based editor framework (peer: core ^2.2.8)
├── behavior-tree-editor/    - @esengine/behavior-tree-editor (v1.0.0)
│                             Visual behavior tree editor plugin
└── editor-app/              - @esengine/editor-app (v1.0.5, private)
                              Tauri + React desktop editor
```

**Build Order:** Always build in dependency order: `core → math → network-shared → network-client/server`

### Managing Versions
```bash
# Sync versions across packages
npm run sync:versions

# Bump versions (uses Lerna)
npm run version
```

## Core ECS Architecture

### Hierarchical Structure
```
Core (Singleton)
  └── WorldManager
      └── World[]                    - Isolated game rooms/modes
          └── Scene[]                - Multiple scenes per world
              ├── EntityList
              ├── EntitySystem[]     - Scene-level systems
              ├── QuerySystem        - BitMask64-based entity queries
              ├── EventSystem        - Type-safe event bus
              ├── ComponentStorageManager  - SoA storage for components
              └── ReferenceTracker   - Entity reference management
```

### Key Design Patterns

**1. ID-Based Entity Design**
- Entities store component type IDs, not instances
- Components retrieved from centralized `ComponentStorageManager`
- Enables efficient serialization and network sync
- Uses lazy-loaded component cache for performance

**2. BitMask64 Query System**
- Each component type gets a unique bit index (supports 64+ types)
- Entity stores component presence as bit mask
- Queries use bitwise operations (AND/OR/NOT)
- O(1) component presence checks
- Critical for performance with 1000+ entities

**3. SoA (Structure of Arrays) Storage**
- Components stored in type-specific arrays in `ComponentStorageManager`
- Cache-friendly memory layout
- Fast iteration for systems processing many entities
- Supports component pooling

**4. 3-Tier Entity Caching in Systems**
- **Frame cache**: Valid only during current update cycle
- **Persistent cache**: Maintained across frames
- **Tracked entities**: Change detection via event listeners
- Minimizes query overhead in hot loops

### WorkerEntitySystem (Multi-threading)

The framework's standout feature - true parallel processing on multiple CPU cores.

**Location:** `packages/core/src/ECS/Systems/WorkerEntitySystem.ts`

**Two Operating Modes:**

1. **Traditional Worker Mode**
   - Serializes entity data to worker threads
   - Processes in parallel across multiple workers
   - Good for complex computations

2. **SharedArrayBuffer Mode** (Zero-copy)
   - Entities written directly to SharedArrayBuffer
   - Workers read/write shared memory without serialization
   - Extremely fast for physics, particles with simple data
   - Requires browser headers: `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`

**Key Considerations:**
- Auto-detects platform support via `IPlatformAdapter`
- Validates worker count against `navigator.hardwareConcurrency`
- Graceful fallback: Worker → Sync mode if unsupported
- User processing functions must be serializable
- Use for CPU-bound tasks with 100+ entities

### Platform Adapters

**Location:** `packages/core/src/Platform/`

Abstraction layer for cross-platform compatibility:

**Supported Platforms:**
- Browser (Web Workers, SharedArrayBuffer)
- WeChat Mini-game
- ByteDance Mini-game
- Alipay Mini-game
- Node.js

**IPlatformAdapter Interface:**
- Worker support detection
- SharedArrayBuffer capability checks
- Hardware concurrency detection (CPU cores)
- Platform-specific configuration (worker limits, memory limits)

When adding platform support, implement `IPlatformAdapter` and register with `PlatformAdapterManager`.

### Service Container (DI)

**Location:** `packages/core/src/Core/ServiceContainer.ts`

Full dependency injection system:

**Features:**
- Singleton & Transient lifetimes
- Factory function registration
- Circular dependency detection
- `@Injectable`, `@Inject`, `@Updatable` decorators
- Auto-updates all `@Updatable` services in Core loop

**Usage Pattern:**
```typescript
@Injectable()
@ECSSystem('Physics')
class PhysicsSystem extends EntitySystem {
    constructor(@Inject(CollisionSystem) private collision: CollisionSystem) {
        super(Matcher.all(RigidBody));
    }
}

scene.addEntityProcessor(PhysicsSystem); // Auto-resolved via DI
```

## Code Conventions

### Commit Messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/) and Semantic Release for automatic versioning.

**Format:** `<type>(<scope>): <subject>`

**Types:**
- `feat`: New feature (bumps minor version)
- `fix`: Bug fix (bumps patch version)
- `perf`: Performance improvement (bumps patch version)
- `refactor`: Code refactoring (bumps patch version)
- `docs`: Documentation changes
- `test`: Test changes
- `build`: Build system changes
- `ci`: CI configuration changes
- `chore`: Other changes
- `BREAKING CHANGE`: Breaking API change (bumps major version)

**Scopes:** `core`, `math`, `network-client`, `network-server`, `network-shared`, `editor`, `docs`

**Examples:**
```bash
feat(core): add component pooling system
fix(core): fix entity deletion memory leak
perf(core): optimize query system with bit masking

feat(core): redesign system lifecycle
BREAKING CHANGE: System.initialize() now requires Scene parameter
```

### TypeScript Patterns

- Use decorators: `@ECSComponent`, `@ECSSystem`, `@Injectable`, `@Inject`
- Components extend `Component` base class and contain only data
- Systems extend `EntitySystem` or `WorkerEntitySystem`
- Use `Matcher.all()`, `Matcher.any()`, `Matcher.exclude()` for entity queries
- Entity references should use `EntityReference` for automatic cleanup
- Always call `super()` in Component/System constructors

### Testing Patterns

- Tests are in `packages/*/tests/` directories (not alongside source files)
- Use Jest with ts-jest preset
- Test files: `*.test.ts` or `*.spec.ts`
- Performance tests: `*.performance.test.ts` (excluded from normal test runs)
- Integration tests in `tests/integration/`
- Minimum coverage thresholds enforced in `jest.config.cjs`

## Important Implementation Notes

### Component Storage

Components are NOT stored in entities. Always use:
```typescript
entity.getComponent(Position)  // Retrieves from ComponentStorageManager
entity.addComponent(new Position(x, y))
entity.removeComponent(Position)
```

Never store component references long-term - they may be pooled.

### Entity Queries

Systems should use `Matcher` in constructor:
```typescript
super(Matcher.all(Position, Velocity).exclude(Frozen));
```

The QuerySystem uses bit masking internally - queries are extremely fast.

### Serialization

Scenes support full and incremental serialization:
- **Full:** Complete scene snapshot for save/load
- **Incremental:** Changed entities only, for network sync
- Components must implement serialization methods if they contain complex data

### Performance Considerations

- Use `WorkerEntitySystem` for CPU-bound tasks with 100+ entities
- Batch entity creation/destruction outside update loops
- Cache component references within a system's `process()` method scope only
- Use `@Updatable` decorator for services that need frame updates
- Profile systems using built-in `DebugPlugin` and performance monitoring

## Publishing

Publishing is automated via Semantic Release on push to `master`:

```bash
# Manual publish (rarely needed)
npm run prepare:publish  # Builds and runs pre-publish checks
npm run publish:all      # Publishes all packages
npm run publish:core:patch  # Quick patch bump for core
```

**Note:** Each package has its own semantic-release configuration. Commits trigger releases only if they affect that package's files.

## Cross-Platform Development

When modifying core framework:
- Test Worker systems in both Worker and SharedArrayBuffer modes
- Test on browsers with and without SharedArrayBuffer support
- Consider mini-game platform limitations (worker count, memory)
- Use platform adapters for platform-specific features
- Avoid browser-specific APIs in core package (use adapters)

## Editor Development

The desktop editor (`packages/editor-app`) uses:
- **Frontend:** React + TypeScript + Vite
- **Backend:** Tauri (Rust)
- **Plugin System:** Based on `editor-core` package
- **Hot Reload:** Supported for plugin development

Editor plugins should extend `EditorPlugin` class from `@esengine/editor-core`.
