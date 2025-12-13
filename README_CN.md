<h1 align="center">
  <img src="https://raw.githubusercontent.com/esengine/esengine/master/docs/public/logo.svg" alt="ESEngine" width="180">
  <br>
  ESEngine
</h1>

<p align="center">
  <strong>跨平台 2D 游戏引擎</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@esengine/ecs-framework"><img src="https://img.shields.io/npm/v/@esengine/ecs-framework?style=flat-square&color=blue" alt="npm"></a>
  <a href="https://github.com/esengine/esengine/actions"><img src="https://img.shields.io/github/actions/workflow/status/esengine/esengine/ci.yml?branch=master&style=flat-square" alt="build"></a>
  <a href="https://github.com/esengine/esengine/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="license"></a>
  <a href="https://github.com/esengine/esengine/stargazers"><img src="https://img.shields.io/github/stars/esengine/esengine?style=flat-square" alt="stars"></a>
  <img src="https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
</p>

<p align="center">
  <a href="./README.md">English</a> | <b>中文</b>
</p>

<p align="center">
  <a href="https://esengine.cn/">文档</a> ·
  <a href="https://esengine.cn/api/README">API 参考</a> ·
  <a href="https://github.com/esengine/esengine/releases">下载编辑器</a> ·
  <a href="./examples/">示例</a>
</p>

---

## 概述

ESEngine 是一款基于现代 Web 技术从零构建的跨平台 2D 游戏引擎。它提供完整的工具集，让开发者专注于游戏创作而非基础设施搭建。

一套代码即可导出到 Web 浏览器、微信小游戏等多个平台。

## 核心特性

| 特性 | 描述 |
|-----|------|
| **ECS 架构** | 数据驱动的实体-组件-系统模式，提供灵活且缓存友好的游戏逻辑 |
| **高性能渲染** | Rust/WebAssembly 2D 渲染器，支持自动精灵批处理和 WebGL 2.0 |
| **可视化编辑器** | 基于 Tauri 的跨平台桌面编辑器，支持场景管理和资源工作流 |
| **模块化设计** | 按需引入，每个功能都是独立的包 |
| **多平台导出** | 一套代码部署到 Web、微信小游戏等平台 |
| **物理集成** | 基于 Rapier 的 2D 物理，支持编辑器可视化 |
| **可视化脚本** | 行为树和蓝图系统，适合策划使用 |

## 技术栈

- **运行时**: TypeScript, Rust, WebAssembly
- **渲染器**: WebGL 2.0, WGPU (计划中)
- **编辑器**: Tauri, React, Zustand
- **物理**: Rapier2D
- **构建**: pnpm, Turborepo, Rollup

## 许可证

ESEngine **完全免费开源**，采用 [MIT 协议](LICENSE)。无版税，无附加条件。

## 安装

### npm

```bash
npm install @esengine/ecs-framework
```

### 编辑器

从 [Releases](https://github.com/esengine/esengine/releases) 页面下载预编译版本（支持 Windows、macOS）。

## 快速开始

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

// 初始化
Core.create();
const scene = new Scene();
scene.addSystem(new MovementSystem());

const player = scene.createEntity('Player');
player.addComponent(new Position());
player.addComponent(new Velocity());

Core.setScene(scene);

// 游戏循环
function gameLoop(currentTime: number) {
    Core.update(currentTime / 1000);
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
```

## 模块

ESEngine 采用 Monorepo 组织，包含多个模块化包。

### 核心

| 包名 | 描述 |
|------|------|
| `@esengine/ecs-framework` | ECS 框架核心，包含实体管理、组件系统和查询 |
| `@esengine/math` | 向量、矩阵和数学工具 |
| `@esengine/engine` | Rust/WASM 2D 渲染器 |
| `@esengine/engine-core` | 引擎模块系统和生命周期管理 |

### 运行时

| 包名 | 描述 |
|------|------|
| `@esengine/sprite` | 2D 精灵渲染和动画 |
| `@esengine/tilemap` | Tilemap 渲染 |
| `@esengine/physics-rapier2d` | 2D 物理模拟 (Rapier) |
| `@esengine/behavior-tree` | 行为树 AI 系统 |
| `@esengine/blueprint` | 可视化脚本运行时 |
| `@esengine/camera` | 相机控制和管理 |
| `@esengine/audio` | 音频播放 |
| `@esengine/ui` | UI 组件 |
| `@esengine/material-system` | 材质和着色器系统 |
| `@esengine/asset-system` | 资源加载和管理 |

### 编辑器扩展

| 包名 | 描述 |
|------|------|
| `@esengine/sprite-editor` | 精灵检视器和工具 |
| `@esengine/tilemap-editor` | 可视化 Tilemap 编辑器 |
| `@esengine/physics-rapier2d-editor` | 物理碰撞体可视化 |
| `@esengine/behavior-tree-editor` | 可视化行为树编辑器 |
| `@esengine/blueprint-editor` | 可视化脚本编辑器 |
| `@esengine/material-editor` | 材质编辑器 |

### 平台

| 包名 | 描述 |
|------|------|
| `@esengine/platform-common` | 平台抽象接口 |
| `@esengine/platform-web` | Web 浏览器运行时 |
| `@esengine/platform-wechat` | 微信小游戏运行时 |

## 编辑器

ESEngine 编辑器是基于 Tauri 和 React 构建的跨平台桌面应用。

### 功能

- 场景层级和实体管理
- 组件检视器，支持自定义属性编辑器
- 资源浏览器，支持拖放
- Tilemap 编辑器，支持绘制和填充工具
- 行为树可视化编辑器
- 蓝图可视化脚本
- 材质和着色器编辑
- 内置性能分析器
- 多语言支持（英文、中文）

### 截图

![ESEngine Editor](screenshots/main_screetshot.png)

## 平台支持

| 平台 | 运行时 | 编辑器 |
|------|:------:|:------:|
| Web 浏览器 | ✓ | - |
| Windows | - | ✓ |
| macOS | - | ✓ |
| 微信小游戏 | 开发中 | - |
| Playable 可玩广告 | 计划中 | - |
| Android | 计划中 | - |
| iOS | 计划中 | - |

## 从源码构建

### 前置要求

- Node.js 18+
- pnpm 10+
- Rust 工具链（用于 WASM 渲染器）
- wasm-pack

### 安装

```bash
git clone https://github.com/esengine/esengine.git
cd esengine

pnpm install
pnpm build

# 可选：构建 WASM 渲染器
pnpm build:wasm
```

### 运行编辑器

```bash
cd packages/editor-app
pnpm tauri:dev
```

### 项目结构

```
esengine/
├── packages/           # 引擎包（运行时、编辑器、平台）
├── docs/               # 文档源码
├── examples/           # 示例项目
├── scripts/            # 构建工具
└── thirdparty/         # 第三方依赖
```

## 文档

- [快速入门](https://esengine.cn/guide/getting-started.html)
- [架构指南](https://esengine.cn/guide/)
- [API 参考](https://esengine.cn/api/README)

## 社区

- [GitHub Issues](https://github.com/esengine/esengine/issues) - Bug 反馈和功能建议
- [GitHub Discussions](https://github.com/esengine/esengine/discussions) - 问题和想法
- [QQ 交流群](https://jq.qq.com/?_wv=1027&k=29w1Nud6) - 中文社区

## 贡献

欢迎贡献代码。提交 PR 前请阅读贡献指南。

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交修改 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 发起 Pull Request

## 许可证

ESEngine 基于 [MIT 协议](LICENSE) 开源。

---

<p align="center">
  由 ESEngine 团队用 ❤️ 打造
</p>
