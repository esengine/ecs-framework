<h1 align="center">
  @esengine/ecs-framework
</h1>

<p align="center">
  <strong>High-performance ECS Framework for JavaScript Game Engines</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@esengine/ecs-framework"><img src="https://img.shields.io/npm/v/@esengine/ecs-framework?style=flat-square&color=blue" alt="npm"></a>
  <a href="https://github.com/esengine/ecs-framework/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="license"></a>
  <img src="https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/zero-dependencies-brightgreen?style=flat-square" alt="zero dependencies">
</p>

<p align="center">
  <b>English</b> | <a href="./README_CN.md">中文</a>
</p>

---

## Overview

A standalone, zero-dependency ECS (Entity-Component-System) framework designed for use with **any** JavaScript game engine:

- **Cocos Creator**
- **Laya**
- **Egret**
- **Phaser**
- **Or your own engine**

This package is the core of [ESEngine](https://github.com/esengine/ecs-framework), but can be used completely independently.

## Installation

### npm / pnpm / yarn

```bash
npm install @esengine/ecs-framework
```

### Clone Source Code Only

If you only want the ECS framework source code (not the full ESEngine):

```bash
# Step 1: Clone repo skeleton without downloading files (requires Git 2.25+)
git clone --filter=blob:none --sparse https://github.com/esengine/ecs-framework.git

# Step 2: Enter directory
cd esengine

# Step 3: Specify which folder to checkout
git sparse-checkout set packages/core

# Now you only have packages/core/ - other folders are not downloaded
```

## Quick Start

```typescript
import {
    Core, Scene, Entity, Component, EntitySystem,
    Matcher, Time, ECSComponent, ECSSystem
} from '@esengine/ecs-framework';

// Define components (pure data)
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

// Game loop (integrate with your engine's loop)
function update(dt: number) {
    Core.update(dt);
}
```

## Integration Examples

### With Cocos Creator

```typescript
import { _decorator, Component as CCComponent } from 'cc';
import { Core, Scene } from '@esengine/ecs-framework';

const { ccclass } = _decorator;

@ccclass('GameManager')
export class GameManager extends CCComponent {
    private scene: Scene;

    onLoad() {
        Core.create();
        this.scene = new Scene();
        // Register your systems...
        Core.setScene(this.scene);
    }

    update(dt: number) {
        Core.update(dt);
    }
}
```

### With Laya

```typescript
import { Core, Scene } from '@esengine/ecs-framework';

export class Main {
    private scene: Scene;

    constructor() {
        Core.create();
        this.scene = new Scene();
        Core.setScene(this.scene);

        Laya.timer.frameLoop(1, this, this.onUpdate);
    }

    onUpdate() {
        Core.update(Laya.timer.delta / 1000);
    }
}
```

## Features

| Feature | Description |
|---------|-------------|
| **Zero Dependencies** | No external runtime dependencies |
| **Type-Safe Queries** | Fluent API with full TypeScript support |
| **Change Detection** | Epoch-based dirty tracking for optimization |
| **Serialization** | Built-in scene serialization and snapshots |
| **Service Container** | Dependency injection for systems |
| **Performance Monitoring** | Built-in profiling tools |

## Documentation

- [API Reference](https://esengine.github.io/esengine/api/README)
- [Architecture Guide](https://esengine.github.io/esengine/guide/)
- [Full ESEngine Documentation](https://esengine.github.io/esengine/)

## License

MIT License - Use freely in commercial and open source projects.

---

<p align="center">
  Part of <a href="https://github.com/esengine/ecs-framework">ESEngine</a> · Can be used standalone
</p>
