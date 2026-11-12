<h1 align="center">
  @esengine/ecs-framework
</h1>

<p align="center">
  <strong>适用于 JavaScript 游戏引擎的高性能 ECS 框架</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@esengine/ecs-framework"><img src="https://img.shields.io/npm/v/@esengine/ecs-framework?style=flat-square&color=blue" alt="npm"></a>
  <a href="https://github.com/esengine/ecs-framework/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="license"></a>
  <img src="https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/zero-dependencies-brightgreen?style=flat-square" alt="零依赖">
</p>

<p align="center">
  <a href="./README.md">English</a> | <b>中文</b>
</p>

---

## 概述

一个独立的、零依赖的 ECS（实体-组件-系统）框架，可与**任何** JavaScript 游戏引擎配合使用：

- **Cocos Creator**
- **Laya**
- **Egret**
- **Phaser**
- **或你自己的引擎**

这个包是 [ESEngine](https://github.com/esengine/ecs-framework) 的核心，但可以完全独立使用。

## 安装

### npm / pnpm / yarn

```bash
npm install @esengine/ecs-framework
```

### 仅克隆源码

如果你只想要 ECS 框架源码（不需要完整的 ESEngine）：

```bash
# 第一步：克隆仓库骨架，不下载文件内容（需要 Git 2.25+）
git clone --filter=blob:none --sparse https://github.com/esengine/ecs-framework.git

# 第二步：进入目录
cd esengine

# 第三步：指定要检出的目录
git sparse-checkout set packages/core

# 完成！现在你只有 packages/core/ 目录，其他文件夹不会下载
```

## 快速开始

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

// 游戏循环（与你的引擎循环集成）
function update(dt: number) {
    Core.update(dt);
}
```

## 集成示例

### Cocos Creator

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
        // 注册你的系统...
        Core.setScene(this.scene);
    }

    update(dt: number) {
        Core.update(dt);
    }
}
```

### Laya

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

## 特性

| 特性 | 描述 |
|------|------|
| **零依赖** | 无外部运行时依赖 |
| **类型安全查询** | 流畅的 API，完整 TypeScript 支持 |
| **变更检测** | 基于 Epoch 的脏标记优化 |
| **序列化** | 内置场景序列化和快照 |
| **服务容器** | 系统的依赖注入 |
| **性能监控** | 内置性能分析工具 |

## 文档

- [API 参考](https://esengine.github.io/esengine/api/README)
- [架构指南](https://esengine.github.io/esengine/guide/)
- [完整 ESEngine 文档](https://esengine.github.io/esengine/)

## 许可证

MIT 协议 - 可自由用于商业和开源项目。

---

<p align="center">
  <a href="https://github.com/esengine/ecs-framework">ESEngine</a> 的一部分 · 可独立使用
</p>
