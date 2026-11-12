<h1 align="center">
  <img src="https://raw.githubusercontent.com/esengine/ecs-framework/master/docs/public/logo.svg" alt="ESEngine" width="180">
  <br>
  ESEngine
</h1>

<p align="center">
  <strong>TypeScript 模块化游戏框架</strong>
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
  <a href="./README.md">English</a> | <b>中文</b>
</p>

<p align="center">
  <a href="https://esengine.github.io/esengine/">文档</a> ·
  <a href="https://esengine.github.io/esengine/api/README">API 参考</a> ·
  <a href="./examples/">示例</a>
</p>

---

## ESEngine 是什么？

ESEngine 是一套**引擎无关的游戏开发模块**，可与 Cocos Creator、Laya、Phaser、PixiJS 等任何 JavaScript 游戏引擎配合使用。

核心是一个高性能的 **ECS（实体-组件-系统）** 框架，配套 AI、网络、物理等可选模块。

```bash
npm install @esengine/ecs-framework
```

## 功能模块

| 模块 | 描述 |
|------|------|
| [**ECS 核心**](https://esengine.github.io/esengine/guide/) | 实体-组件-系统框架，支持响应式查询 |
| [**行为树**](https://esengine.github.io/esengine/modules/behavior-tree/) | AI 行为树，支持可视化编辑 |
| [**蓝图**](https://esengine.github.io/esengine/modules/blueprint/) | 可视化脚本系统 |
| [**状态机**](https://esengine.github.io/esengine/modules/fsm/) | 有限状态机 |
| [**定时器**](https://esengine.github.io/esengine/modules/timer/) | 定时器和冷却系统 |
| [**空间索引**](https://esengine.github.io/esengine/modules/spatial/) | 空间查询（四叉树、网格） |
| [**寻路**](https://esengine.github.io/esengine/modules/pathfinding/) | A* 和导航网格寻路 |
| [**程序化生成**](https://esengine.github.io/esengine/modules/procgen/) | 噪声、随机、采样等生成算法 |
| [**RPC**](https://esengine.github.io/esengine/modules/rpc/) | 高性能 RPC 通信框架 |
| [**网络**](https://esengine.github.io/esengine/modules/network/) | 客户端网络，支持预测、AOI、增量压缩 |
| [**数据库**](https://esengine.github.io/esengine/modules/database/) | 游戏数据库，支持 Redis/内存存储 |
| [**世界流送**](https://esengine.github.io/esengine/modules/world-streaming/) | 开放世界分块加载和流送 |

> 所有模块均为引擎无关设计，可与任何渲染引擎配合使用。

## 快速开始

### 使用 CLI（推荐）

在现有项目中添加 ECS 的最简单方式：

```bash
# 在项目目录中运行
npx @esengine/cli init
```

CLI 会自动检测项目类型（Cocos Creator 2.x/3.x、LayaAir 3.x 或 Node.js）并生成相应的集成代码。

### 手动配置

```typescript
import {
    Core, Scene, Entity, Component, EntitySystem,
    Matcher, Time, ECSComponent, ECSSystem
} from '@esengine/ecs-framework';

// 定义组件（纯数据）
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

// 定义系统（逻辑）
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

// 集成到你的游戏循环
function gameLoop(currentTime: number) {
    Core.update(currentTime / 1000);
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
```

## 与其他引擎配合使用

ESEngine 的框架模块设计为可与你喜欢的渲染引擎配合使用：

### 与 Cocos Creator 配合

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

        // 添加 ECS 系统
        this.ecsScene.addSystem(new BehaviorTreeExecutionSystem());
        this.ecsScene.addSystem(new MyGameSystem());

        Core.setScene(this.ecsScene);
    }

    update(dt: number) {
        Core.update(dt);
    }
}
```

### 与 Laya 3.x 配合

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

## 包列表

所有包均为引擎无关，**零渲染依赖**：

```bash
npm install @esengine/ecs-framework      # ECS 核心
npm install @esengine/ecs-framework-math # 数学工具
npm install @esengine/behavior-tree      # AI 行为树
npm install @esengine/blueprint          # 可视化脚本
npm install @esengine/fsm                # 状态机
npm install @esengine/timer              # 定时器和冷却
npm install @esengine/spatial            # 空间索引
npm install @esengine/pathfinding        # 寻路
npm install @esengine/procgen            # 程序化生成
npm install @esengine/rpc                # RPC 框架
npm install @esengine/network            # 客户端网络
npm install @esengine/server             # 游戏服务器
npm install @esengine/database           # 数据库抽象
npm install @esengine/transaction        # 事务系统
npm install @esengine/world-streaming    # 世界流送
```

## 从源码构建

```bash
git clone https://github.com/esengine/ecs-framework.git
cd esengine

pnpm install
pnpm build

# 框架包类型检查
pnpm type-check:framework

# 运行测试
pnpm test
```

## 文档

- [ECS 框架指南](https://esengine.github.io/esengine/guide/)
- [行为树指南](https://esengine.github.io/esengine/modules/behavior-tree/)
- [API 参考](https://esengine.github.io/esengine/api/README)

## 社区

- [QQ 交流群](https://jq.qq.com/?_wv=1027&k=29w1Nud6) - 中文社区
- [Discord](https://discord.gg/gCAgzXFW) - 国际社区
- [GitHub Issues](https://github.com/esengine/ecs-framework/issues) - Bug 反馈和功能建议
- [GitHub Discussions](https://github.com/esengine/ecs-framework/discussions) - 问题和想法

## 贡献

欢迎贡献代码！提交 PR 前请阅读贡献指南。

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交修改 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 发起 Pull Request

## 许可证

ESEngine 基于 [MIT 协议](LICENSE) 开源，个人和商业使用均免费。

---

<p align="center">
  由 ESEngine 社区用心打造
</p>
