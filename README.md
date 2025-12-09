<h1 align="center">
  <img src="https://raw.githubusercontent.com/esengine/esengine/master/docs/public/logo.svg" alt="ESEngine" width="180">
  <br>
  ESEngine
</h1>

<p align="center">
  <strong>Cross-platform 2D Game Engine</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@esengine/ecs-framework"><img src="https://img.shields.io/npm/v/@esengine/ecs-framework?style=flat-square&color=blue" alt="npm"></a>
  <a href="https://github.com/esengine/esengine/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="license"></a>
  <a href="https://github.com/esengine/esengine/stargazers"><img src="https://img.shields.io/github/stars/esengine/esengine?style=flat-square" alt="stars"></a>
</p>

<p align="center">
  <b>English</b> | <a href="./README_CN.md">中文</a>
</p>

<p align="center">
  <a href="https://esengine.cn/">Documentation</a> ·
  <a href="https://esengine.cn/api/README">API Reference</a> ·
  <a href="https://github.com/esengine/esengine/releases">Download Editor</a> ·
  <a href="./examples/">Examples</a>
</p>

---

ESEngine is a cross-platform 2D game engine for creating games from a unified interface. It provides a comprehensive set of common tools so that developers can focus on making games without having to reinvent the wheel.

Games can be exported to multiple platforms including Web browsers, WeChat Mini Games, and other mini-game platforms.

## Free and Open Source

ESEngine is completely free and open source under the MIT license. No strings attached, no royalties. Your games are yours.

## Features

- **Data-Driven Architecture**: Built on Entity-Component-System (ECS) pattern for flexible and performant game logic
- **High-Performance Rendering**: Rust/WebAssembly 2D renderer with sprite batching and WebGL 2.0 backend
- **Visual Editor**: Cross-platform desktop editor with scene management, asset browser, and visual tools
- **Modular Design**: Use only what you need. Each feature is a separate module that can be included independently
- **Multi-Platform**: Deploy to Web, WeChat Mini Games, and more from a single codebase

## Getting the Engine

### Using npm

```bash
npm install @esengine/ecs-framework
```

### Building from Source

See [Building from Source](#building-from-source) for detailed instructions.

### Editor Download

Pre-built editor binaries are available on the [Releases](https://github.com/esengine/esengine/releases) page for Windows and macOS.

## Quick Start

```typescript
import {
    Core, Scene, Entity, Component, EntitySystem,
    Matcher, Time, ECSComponent, ECSSystem
} from '@esengine/ecs-framework';

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

Core.create();
const scene = new Scene();
scene.addSystem(new MovementSystem());

const player = scene.createEntity('Player');
player.addComponent(new Position());
player.addComponent(new Velocity());

Core.setScene(scene);

// Game loop
let lastTime = 0;
function gameLoop(currentTime: number) {
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    Core.update(deltaTime);
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
```

## Modules

ESEngine is organized into modular packages. Each feature has a runtime module and an optional editor extension.

### Core

| Package | Description |
|---------|-------------|
| `@esengine/ecs-framework` | Core ECS framework with entity management, component system, and queries |
| `@esengine/math` | Vector, matrix, and mathematical utilities |
| `@esengine/engine` | Rust/WASM 2D renderer |
| `@esengine/engine-core` | Engine module system and lifecycle management |

### Runtime Modules

| Package | Description |
|---------|-------------|
| `@esengine/sprite` | 2D sprite rendering and animation |
| `@esengine/tilemap` | Tile-based map rendering with animation support |
| `@esengine/physics-rapier2d` | 2D physics simulation powered by Rapier |
| `@esengine/behavior-tree` | Behavior tree AI system |
| `@esengine/blueprint` | Visual scripting runtime |
| `@esengine/camera` | Camera control and management |
| `@esengine/audio` | Audio playback |
| `@esengine/ui` | UI components |
| `@esengine/material-system` | Material and shader system |
| `@esengine/asset-system` | Asset loading and management |

### Editor Extensions

| Package | Description |
|---------|-------------|
| `@esengine/sprite-editor` | Sprite inspector and tools |
| `@esengine/tilemap-editor` | Visual tilemap editor with brush tools |
| `@esengine/physics-rapier2d-editor` | Physics collider visualization and editing |
| `@esengine/behavior-tree-editor` | Visual behavior tree editor |
| `@esengine/blueprint-editor` | Visual scripting editor |
| `@esengine/material-editor` | Material and shader editor |
| `@esengine/shader-editor` | Shader code editor |

### Platform

| Package | Description |
|---------|-------------|
| `@esengine/platform-common` | Platform abstraction interfaces |
| `@esengine/platform-web` | Web browser runtime |
| `@esengine/platform-wechat` | WeChat Mini Game runtime |

## Editor

ESEngine Editor is a cross-platform desktop application built with Tauri and React.

### Features

- Scene hierarchy and entity management
- Component inspector with custom editors
- Asset browser with drag-and-drop support
- Tilemap editor with paint, fill, and selection tools
- Behavior tree visual editor
- Blueprint visual scripting
- Material and shader editing
- Built-in performance profiler
- Localization support (English, Chinese)

### Screenshot

![ESEngine Editor](screenshots/main_screetshot.png)

## Supported Platforms

| Platform | Runtime | Editor |
|----------|---------|--------|
| Web Browser | Yes | - |
| Windows | - | Yes |
| macOS | - | Yes |
| WeChat Mini Game | In Progress | - |
| Playable Ads | Planned | - |
| Android | Planned | - |
| iOS | Planned | - |
| Windows Native | Planned | - |
| Other Platforms | Planned | - |

## Building from Source

### Prerequisites

- Node.js 18 or later
- pnpm 10 or later
- Rust toolchain (for WASM renderer)
- wasm-pack

### Setup

```bash
# Clone repository
git clone https://github.com/esengine/esengine.git
cd esengine

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Build WASM renderer (optional)
pnpm build:wasm
```

### Running the Editor

```bash
cd packages/editor-app
pnpm tauri:dev
```

### Project Structure

```
esengine/
├── packages/           Engine packages (runtime, editor, platform)
├── docs/               Documentation source
├── examples/           Example projects
├── scripts/            Build utilities
└── thirdparty/         Third-party dependencies
```

## Documentation

- [Getting Started](https://esengine.cn/guide/getting-started.html)
- [Architecture Guide](https://esengine.cn/guide/)
- [API Reference](https://esengine.cn/api/README)

## Community

- [GitHub Issues](https://github.com/esengine/esengine/issues) - Bug reports and feature requests
- [GitHub Discussions](https://github.com/esengine/esengine/discussions) - Questions and ideas

## Contributing

Contributions are welcome. Please read the contributing guidelines before submitting a pull request.

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## License

ESEngine is licensed under the [MIT License](LICENSE).
