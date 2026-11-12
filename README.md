<h1 align="center">
  <img src="https://raw.githubusercontent.com/esengine/ecs-framework/master/docs/public/logo.svg" alt="ESEngine" width="180">
  <br>
  ESEngine
</h1>

<p align="center">
  <strong>Modular Game Framework for TypeScript</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@esengine/ecs-framework"><img src="https://img.shields.io/npm/v/@esengine/ecs-framework?style=flat-square&color=blue" alt="npm"></a>
  <a href="https://github.com/esengine/ecs-framework/actions"><img src="https://img.shields.io/github/actions/workflow/status/esengine/ecs-framework/ci.yml?branch=master&style=flat-square" alt="build"></a>
  <a href="https://github.com/esengine/ecs-framework/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="license"></a>
  <a href="https://github.com/esengine/ecs-framework/stargazers"><img src="https://img.shields.io/github/stars/esengine/ecs-framework?style=flat-square" alt="stars"></a>
  <img src="https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <a href="https://discord.gg/gCAgzXFW"><img src="https://img.shields.io/badge/Discord-Join%20Us-5865F2?style=flat-square&logo=discord&logoColor=white" alt="Discord"></a>
</p>

<p align="center">
  <b>English</b> | <a href="./README_CN.md">中文</a>
</p>

<p align="center">
  <a href="https://esengine.github.io/esengine/">Documentation</a> ·
  <a href="https://esengine.github.io/esengine/api/README">API Reference</a> ·
  <a href="./examples/">Examples</a>
</p>

---

## What is ESEngine?

ESEngine is a collection of **engine-agnostic game development modules** for TypeScript. Use them with Cocos Creator, Laya, Phaser, PixiJS, or any JavaScript game engine.

The core is a high-performance **ECS (Entity-Component-System)** framework, accompanied by optional modules for AI, networking, physics, and more.

```bash
npm install @esengine/ecs-framework
```

## Features

| Module | Description |
|--------|-------------|
| [**ECS Core**](https://esengine.github.io/esengine/en/guide/) | Entity-Component-System framework with reactive queries |
| [**Behavior Tree**](https://esengine.github.io/esengine/en/modules/behavior-tree/) | AI behavior trees with visual editor support |
| [**Blueprint**](https://esengine.github.io/esengine/en/modules/blueprint/) | Visual scripting system |
| [**FSM**](https://esengine.github.io/esengine/en/modules/fsm/) | Finite state machine |
| [**Timer**](https://esengine.github.io/esengine/en/modules/timer/) | Timer and cooldown systems |
| [**Spatial**](https://esengine.github.io/esengine/en/modules/spatial/) | Spatial indexing and queries (QuadTree, Grid) |
| [**Pathfinding**](https://esengine.github.io/esengine/en/modules/pathfinding/) | A* and navigation mesh pathfinding |
| [**Procgen**](https://esengine.github.io/esengine/en/modules/procgen/) | Procedural generation (noise, random, sampling) |
| [**RPC**](https://esengine.github.io/esengine/en/modules/rpc/) | High-performance RPC communication framework |
| [**Network**](https://esengine.github.io/esengine/en/modules/network/) | Client networking with prediction, AOI, delta compression |
| [**Database**](https://esengine.github.io/esengine/en/modules/database/) | Game database with Redis/Memory storage |
| [**World Streaming**](https://esengine.github.io/esengine/en/modules/world-streaming/) | Open world chunk loading and streaming |

> All modules are engine-agnostic and work with any rendering engine.

## Quick Start

### Using CLI (Recommended)

The easiest way to add ECS to your existing project:

```bash
# In your project directory
npx @esengine/cli init
```

The CLI automatically detects your project type (Cocos Creator 2.x/3.x, LayaAir 3.x, or Node.js) and generates the necessary integration code.

### Manual Setup

```typescript
import {
    Core, Scene, Entity, Component, EntitySystem,
    Matcher, Time, ECSComponent, ECSSystem
} from '@esengine/ecs-framework';

// Define components (data only)
@ECSComponent('Position')
class Position extends Component {
    x = 0;
    y = 0;
}

@ECSComponent('Velocity')
class Velocity extends Component {
    dx = 0;
    dy = 0;
}

// Define system (logic)
@ECSSystem('Movement')
class MovementSystem extends EntitySystem {
    constructor() {
        super(Matcher.all(Position, Velocity));
    }

    protected process(entities: readonly Entity[]): void {
        for (const entity of entities) {
            const pos = entity.getComponent(Position);
            const vel = entity.getComponent(Velocity);
            pos.x += vel.dx * Time.deltaTime;
            pos.y += vel.dy * Time.deltaTime;
        }
    }
}

// Initialize
Core.create();
const scene = new Scene();
scene.addSystem(new MovementSystem());

const player = scene.createEntity('Player');
player.addComponent(new Position());
player.addComponent(new Velocity());

Core.setScene(scene);

// Integrate with your game loop
function gameLoop(currentTime: number) {
    Core.update(currentTime / 1000);
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
```

## Using with Other Engines

ESEngine's framework modules are designed to work alongside your preferred rendering engine:

### With Cocos Creator

```typescript
import { Component as CCComponent, _decorator } from 'cc';
import { Core, Scene, Matcher, EntitySystem } from '@esengine/ecs-framework';
import { BehaviorTreeExecutionSystem } from '@esengine/behavior-tree';

const { ccclass } = _decorator;

@ccclass('GameManager')
export class GameManager extends CCComponent {
    private ecsScene!: Scene;

    start() {
        Core.create();
        this.ecsScene = new Scene();

        // Add ECS systems
        this.ecsScene.addSystem(new BehaviorTreeExecutionSystem());
        this.ecsScene.addSystem(new MyGameSystem());

        Core.setScene(this.ecsScene);
    }

    update(dt: number) {
        Core.update(dt);
    }
}
```

### With Laya 3.x

```typescript
import { Core, Scene } from '@esengine/ecs-framework';
import { FSMSystem } from '@esengine/fsm';

const { regClass } = Laya;

@regClass()
export class ECSManager extends Laya.Script {
    private ecsScene = new Scene();

    onAwake(): void {
        Core.create();
        this.ecsScene.addSystem(new FSMSystem());
        Core.setScene(this.ecsScene);
    }

    onUpdate(): void {
        Core.update(Laya.timer.delta / 1000);
    }

    onDestroy(): void {
        Core.destroy();
    }
}
```

## Packages

All packages are engine-agnostic with **zero rendering dependencies**:

```bash
npm install @esengine/ecs-framework      # Core ECS
npm install @esengine/ecs-framework-math # Math utilities
npm install @esengine/behavior-tree      # AI behavior trees
npm install @esengine/blueprint          # Visual scripting
npm install @esengine/fsm                # State machines
npm install @esengine/timer              # Timers & cooldowns
npm install @esengine/spatial            # Spatial indexing
npm install @esengine/pathfinding        # Pathfinding
npm install @esengine/procgen            # Procedural generation
npm install @esengine/rpc                # RPC framework
npm install @esengine/network            # Client networking
npm install @esengine/server             # Game server
npm install @esengine/database           # Database abstraction
npm install @esengine/transaction        # Transaction system
npm install @esengine/world-streaming    # World streaming
```

## Building from Source

```bash
git clone https://github.com/esengine/ecs-framework.git
cd esengine

pnpm install
pnpm build

# Type check framework packages
pnpm type-check:framework

# Run tests
pnpm test
```

## Documentation

- [ECS Framework Guide](https://esengine.github.io/esengine/en/guide/)
- [Behavior Tree Guide](https://esengine.github.io/esengine/en/modules/behavior-tree/)
- [API Reference](https://esengine.github.io/esengine/api/README)

## Community

- [GitHub Issues](https://github.com/esengine/ecs-framework/issues) - Bug reports and feature requests
- [GitHub Discussions](https://github.com/esengine/ecs-framework/discussions) - Questions and ideas
- [Discord](https://discord.gg/gCAgzXFW) - Chat with the community

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ESEngine is licensed under the [MIT License](LICENSE). Free for personal and commercial use.

---

<p align="center">
  Made with care by the ESEngine community
</p>
