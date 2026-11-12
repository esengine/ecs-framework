---
title: "Blueprint Visual Scripting"
description: "Visual scripting system deeply integrated with ECS framework"
---

`@esengine/blueprint` provides a visual scripting system deeply integrated with the ECS framework, supporting node-based programming to control entity behavior.

## Editor Download

Blueprint Editor Plugin for Cocos Creator (Free):

**[Download Cocos Node Editor v1.2.0](https://github.com/esengine/ecs-framework/releases/tag/cocos-node-editor-v1.2.0)**

> QQ Group: **481923584** | Website: [esengine.cn](https://esengine.cn/)

For detailed usage instructions, see [Editor User Guide](./editor-guide).

## Runtime Installation

```bash
npm install @esengine/blueprint
```

## Core Features

- **Deep ECS Integration** - Built-in Entity and Component operation nodes
- **Auto-generated Component Nodes** - Use decorators to mark components, auto-generate Get/Set/Call nodes
- **Runtime Blueprint Execution** - Efficient virtual machine executes blueprint logic

## Quick Start

### 1. Add Blueprint System

```typescript
import { Scene, Core } from '@esengine/ecs-framework';
import { BlueprintSystem } from '@esengine/blueprint';

// Create scene and add blueprint system
const scene = new Scene();
scene.addSystem(new BlueprintSystem());

// Set scene
Core.setScene(scene);
```

### 2. Add Blueprint to Entity

```typescript
import { BlueprintComponent } from '@esengine/blueprint';

// Create entity
const player = scene.createEntity('Player');

// Add blueprint component
const blueprint = new BlueprintComponent();
blueprint.blueprintAsset = await loadBlueprintAsset('player.blueprint.json');
blueprint.autoStart = true;
player.addComponent(blueprint);
```

### 3. Mark Components (Auto-generate Blueprint Nodes)

```typescript
import {
    BlueprintExpose,
    BlueprintProperty,
    BlueprintMethod
} from '@esengine/blueprint';
import { Component, ECSComponent } from '@esengine/ecs-framework';

@ECSComponent('Health')
@BlueprintExpose({ displayName: 'Health', category: 'gameplay' })
export class HealthComponent extends Component {
    @BlueprintProperty({ displayName: 'Current Health', type: 'float' })
    current: number = 100;

    @BlueprintProperty({ displayName: 'Max Health', type: 'float' })
    max: number = 100;

    @BlueprintMethod({
        displayName: 'Heal',
        params: [{ name: 'amount', type: 'float' }]
    })
    heal(amount: number): void {
        this.current = Math.min(this.current + amount, this.max);
    }

    @BlueprintMethod({ displayName: 'Take Damage' })
    takeDamage(amount: number): boolean {
        this.current -= amount;
        return this.current <= 0;
    }
}
```

After marking, the following nodes will appear in the blueprint editor:
- **Get Health** - Get Health component
- **Get Current Health** - Get current property
- **Set Current Health** - Set current property
- **Heal** - Call heal method
- **Take Damage** - Call takeDamage method

## ECS Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Core.update()                        │
│                              ↓                               │
│                    Scene.updateSystems()                     │
│                              ↓                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  BlueprintSystem                       │  │
│  │                                                        │  │
│  │  Matcher.all(BlueprintComponent)                       │  │
│  │                       ↓                                │  │
│  │  process(entities) → blueprint.tick() for each entity  │  │
│  │                       ↓                                │  │
│  │              BlueprintVM.tick(dt)                      │  │
│  │                       ↓                                │  │
│  │         Execute Event/ECS/Flow Nodes                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Node Types

| Category | Description | Color |
|----------|-------------|-------|
| `event` | Event nodes (BeginPlay, Tick, EndPlay) | Red |
| `entity` | ECS entity operations | Blue |
| `component` | ECS component access | Cyan |
| `flow` | Flow control (Branch, Sequence, Loop) | Gray |
| `math` | Math operations | Green |
| `time` | Time utilities (Delay, GetDeltaTime) | Cyan |
| `debug` | Debug utilities (Print) | Gray |

## Blueprint Asset Structure

Blueprints are saved as `.blueprint.json` files:

```typescript
interface BlueprintAsset {
    version: number;
    type: 'blueprint';
    metadata: {
        name: string;
        description?: string;
    };
    variables: BlueprintVariable[];
    nodes: BlueprintNode[];
    connections: BlueprintConnection[];
}
```

## Documentation Navigation

- [Editor User Guide](./editor-guide) - Cocos Creator Blueprint Editor tutorial
- [Virtual Machine API](./vm) - BlueprintVM and ECS integration
- [ECS Node Reference](./nodes) - Built-in ECS operation nodes
- [Custom Nodes](./custom-nodes) - Create custom ECS nodes
- [Blueprint Composition](./composition) - Fragment reuse
- [Examples](./examples) - ECS game logic examples
