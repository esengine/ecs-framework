---
title: "蓝图编辑器使用指南"
description: "Cocos Creator 蓝图可视化脚本编辑器完整使用教程"
---

<script src="/js/blueprint-graph.js"></script>

本指南介绍如何在 Cocos Creator 中使用蓝图可视化脚本编辑器。

## 下载与安装

### 下载

从 GitHub Release 下载最新版本（免费）：

**[下载 Cocos Node Editor v1.2.4](https://github.com/esengine/ecs-framework/releases/tag/cocos-node-editor-v1.2.4)**

:::tip[更新]
**v1.2.4**：`@BlueprintProperty` / `@BlueprintInput` / `@BlueprintOutput` 现在支持**无 TS 类型注解**的属性（如 `current = 100`，类型取装饰器的 `type` 字段），此前只有写了 `current: number` 才会生成 Get/Set 节点。

用 Cocos 的 `@ccclass` + `@BlueprintExpose` 标记的组件，现在会正确生成方法/属性节点：`@BlueprintMethod` 生成带执行引脚的调用节点，`@BlueprintProperty` 生成 Get/Set 节点，节点标题使用装饰器里的 `displayName`。此前只有带 esengine ECS `@ECSComponent` 的组件才会生成这些节点。

**v1.2.3**：`@BlueprintMethod` 的 `params` 现在会在方法节点上生成对应的**参数输入引脚**（如 `heal(amount)` 的 `amount`），未填时按类型取默认值（`float` → 0），不再出现运行时参数为 `undefined`。
:::

:::caution[从 v1.2.0 升级]
v1.2.1 修复了一个严重问题：导出的蓝图在运行时完全不执行（连线按引脚 id 而非引脚名序列化），以及复制粘贴产生失效连线、节点检查器编辑不保存。**如果你在用 v1.2.0，请升级后把蓝图重新打开并保存一次**，让连线以正确格式重写。
:::

> 技术交流 QQ 群：**481923584** | 官网：[esengine.cn](https://esengine.cn/)

### 安装步骤

1. 解压 `cocos-node-editor.zip` 到项目的 `extensions` 目录：

```
your-project/
├── assets/
├── extensions/
│   └── cocos-node-editor/    ← 解压到这里
└── ...
```

2. 重启 Cocos Creator

3. 通过菜单 **扩展 → 扩展管理器** 确认插件已启用

4. 通过菜单 **面板 → Node Editor** 打开编辑器

## 界面介绍

- **工具栏** - 位于顶部，包含新建、打开、保存、撤销、重做等操作
- **变量面板** - 位于左上角，用于定义和管理蓝图变量
- **画布区域** - 主区域，用于放置和连接节点
- **节点菜单** - 右键点击画布空白处打开，按分类列出所有可用节点

## 画布操作

| 操作 | 方式 |
|------|------|
| 平移画布 | 鼠标中键拖拽 / Alt + 左键拖拽 |
| 缩放画布 | 鼠标滚轮 |
| 打开节点菜单 | 右键点击空白处 |
| 框选多个节点 | 在空白处拖拽 |
| 追加框选 | Ctrl + 拖拽 |
| 删除选中 | Delete 键 |

## 节点操作

### 添加节点

1. **从节点面板拖拽** - 将节点从左侧面板拖到画布
2. **右键菜单** - 右键点击画布空白处，选择节点

### 连接节点

1. 从输出引脚拖拽到输入引脚
2. 兼容类型的引脚会高亮显示
3. 松开鼠标完成连接

**引脚类型说明：**

| 引脚颜色 | 类型 | 说明 |
|---------|------|------|
| 白色 ▶ | Exec | 执行流程（控制执行顺序） |
| 青色 ◆ | Entity | 实体引用 |
| 紫色 ◆ | Component | 组件引用 |
| 浅蓝 ◆ | String | 字符串 |
| 绿色 ◆ | Number | 数值 |
| 红色 ◆ | Boolean | 布尔值 |
| 灰色 ◆ | Any | 任意类型 |

### 删除连接

点击连接线选中，按 Delete 键删除。

## 节点类型详解

### 事件节点 (Event)

事件节点是蓝图的入口点，当特定事件发生时触发执行。

| 节点 | 触发时机 | 输出 |
|------|---------|------|
| **Event BeginPlay** | 蓝图开始运行时 | Exec, Self (实体) |
| **Event Tick** | 每帧执行 | Exec, Delta Time |
| **Event EndPlay** | 蓝图停止时 | Exec |

**示例：游戏开始时打印消息**

<div class="bp-graph" style="" data-connections='[{"from":"eg1-exec","to":"eg1-print","type":"exec"}]'>
  <svg class="bp-connections"></svg>
  <div class="bp-node" style="left: 20px; top: 20px; width: 170px;">
    <div class="bp-node-header event">
      <span class="bp-node-header-icon"></span>
      <span class="bp-node-header-title">Event BeginPlay</span>
      <span class="bp-header-exec" data-pin="eg1-exec"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
    </div>
    <div class="bp-node-body">
      <div class="bp-pin-row output">
        <span class="bp-pin"><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="#00a0e0"/></svg></span>
        <span class="bp-pin-label">Self</span>
      </div>
    </div>
  </div>
  <div class="bp-node" style="left: 280px; top: 20px; width: 150px;">
    <div class="bp-node-header debug">Print</div>
    <div class="bp-node-body">
      <div class="bp-pin-row input">
        <span class="bp-pin" data-pin="eg1-print"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Exec</span>
      </div>
      <div class="bp-pin-row input">
        <span class="bp-pin"><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="none" stroke="#e060e0" stroke-width="2"/></svg></span>
        <span class="bp-pin-label">Message</span>
        <span class="bp-pin-value">"游戏开始!"</span>
      </div>
    </div>
  </div>
</div>

### 实体节点 (Entity)

操作 ECS 实体的节点。

| 节点 | 功能 | 输入 | 输出 |
|------|------|------|------|
| **Get Self** | 获取当前实体 | - | Entity |
| **Create Entity** | 创建新实体 | Exec, Name | Exec, Entity |
| **Destroy Entity** | 销毁实体 | Exec, Entity | Exec |
| **Find Entity By Name** | 按名称查找 | Name | Entity |
| **Find Entities By Tag** | 按标签查找 | Tag | Entity[] |
| **Is Valid** | 检查实体有效性 | Entity | Boolean |
| **Get/Set Entity Name** | 获取/设置名称 | Entity | String |
| **Set Active** | 设置激活状态 | Exec, Entity, Active | Exec |

**示例：创建新实体**

<div class="bp-graph" style="" data-connections='[{"from":"eg2-exec","to":"eg2-create","type":"exec"},{"from":"eg2-create-out","to":"eg2-add","type":"exec"},{"from":"eg2-entity","to":"eg2-add-entity","type":"entity"}]'>
  <svg class="bp-connections"></svg>
  <div class="bp-node" style="left: 20px; top: 20px; width: 170px;">
    <div class="bp-node-header event">
      <span class="bp-node-header-icon"></span>
      <span class="bp-node-header-title">Event BeginPlay</span>
      <span class="bp-header-exec" data-pin="eg2-exec"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
    </div>
  </div>
  <div class="bp-node" style="left: 280px; top: 20px; width: 150px;">
    <div class="bp-node-header function">Create Entity</div>
    <div class="bp-node-body">
      <div class="bp-pin-row input">
        <span class="bp-pin" data-pin="eg2-create"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Exec</span>
      </div>
      <div class="bp-pin-row input">
        <span class="bp-pin"><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="none" stroke="#e060e0" stroke-width="2"/></svg></span>
        <span class="bp-pin-label">Name</span>
        <span class="bp-pin-value">"Bullet"</span>
      </div>
      <div class="bp-pin-row output">
        <span class="bp-pin" data-pin="eg2-create-out"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Exec</span>
      </div>
      <div class="bp-pin-row output">
        <span class="bp-pin" data-pin="eg2-entity"><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="#00a0e0"/></svg></span>
        <span class="bp-pin-label">Entity</span>
      </div>
    </div>
  </div>
  <div class="bp-node" style="left: 520px; top: 20px; width: 150px;">
    <div class="bp-node-header function">Add Transform</div>
    <div class="bp-node-body">
      <div class="bp-pin-row input">
        <span class="bp-pin" data-pin="eg2-add"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Exec</span>
      </div>
      <div class="bp-pin-row input">
        <span class="bp-pin" data-pin="eg2-add-entity"><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="#00a0e0"/></svg></span>
        <span class="bp-pin-label">Entity</span>
      </div>
    </div>
  </div>
</div>

### 组件节点 (Component)

访问和操作 ECS 组件。

| 节点 | 功能 |
|------|------|
| **Has Component** | 检查实体是否有指定组件 |
| **Get Component** | 获取组件实例 |
| **Add Component** | 添加组件到实体 |
| **Remove Component** | 移除组件 |
| **Get/Set Property** | 获取/设置组件属性 |

**示例：修改 Transform 组件**

<div class="bp-graph" style="" data-connections='[{"from":"eg3-self","to":"eg3-getcomp","type":"entity"},{"from":"eg3-comp","to":"eg3-setprop","type":"component"}]'>
  <svg class="bp-connections"></svg>
  <div class="bp-node" style="left: 20px; top: 20px; width: 100px;">
    <div class="bp-node-header pure">Get Self</div>
    <div class="bp-node-body">
      <div class="bp-pin-row output">
        <span class="bp-pin" data-pin="eg3-self"><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="#00a0e0"/></svg></span>
        <span class="bp-pin-label">Entity</span>
      </div>
    </div>
  </div>
  <div class="bp-node" style="left: 200px; top: 20px; width: 150px;">
    <div class="bp-node-header pure">Get Component</div>
    <div class="bp-node-body">
      <div class="bp-pin-row input">
        <span class="bp-pin" data-pin="eg3-getcomp"><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="#00a0e0"/></svg></span>
        <span class="bp-pin-label">Entity</span>
      </div>
      <div class="bp-pin-row output">
        <span class="bp-pin" data-pin="eg3-comp"><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="#7030c0"/></svg></span>
        <span class="bp-pin-label">Transform</span>
      </div>
    </div>
  </div>
  <div class="bp-node" style="left: 430px; top: 20px; width: 130px;">
    <div class="bp-node-header function">Set Property</div>
    <div class="bp-node-body">
      <div class="bp-pin-row input">
        <span class="bp-pin"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Exec</span>
      </div>
      <div class="bp-pin-row input">
        <span class="bp-pin" data-pin="eg3-setprop"><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="#7030c0"/></svg></span>
        <span class="bp-pin-label">Target</span>
      </div>
      <div class="bp-pin-row input">
        <span class="bp-pin"><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="none" stroke="#7ecd32" stroke-width="2"/></svg></span>
        <span class="bp-pin-label">x</span>
        <span class="bp-pin-value">100</span>
      </div>
    </div>
  </div>
</div>

### 流程控制节点 (Flow)

控制执行流程的节点。

#### Branch (分支)

条件判断，类似 if/else。

<div class="bp-graph" style="" data-connections='[{"from":"eg4-true","to":"eg4-do1","type":"exec"},{"from":"eg4-false","to":"eg4-do2","type":"exec"}]'>
  <svg class="bp-connections"></svg>
  <div class="bp-node" style="left: 20px; top: 50px; width: 110px;">
    <div class="bp-node-header flow">Branch</div>
    <div class="bp-node-body">
      <div class="bp-pin-row input">
        <span class="bp-pin"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Exec</span>
      </div>
      <div class="bp-pin-row input">
        <span class="bp-pin"><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="none" stroke="#8c0000" stroke-width="2"/></svg></span>
        <span class="bp-pin-label">Condition</span>
      </div>
      <div class="bp-pin-row output">
        <span class="bp-pin" data-pin="eg4-true"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">True</span>
      </div>
      <div class="bp-pin-row output">
        <span class="bp-pin" data-pin="eg4-false"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">False</span>
      </div>
    </div>
  </div>
  <div class="bp-node" style="left: 220px; top: 20px; width: 130px;">
    <div class="bp-node-header function">DoSomething</div>
    <div class="bp-node-body">
      <div class="bp-pin-row input">
        <span class="bp-pin" data-pin="eg4-do1"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Exec</span>
      </div>
    </div>
  </div>
  <div class="bp-node" style="left: 220px; top: 110px; width: 130px;">
    <div class="bp-node-header function">DoOtherThing</div>
    <div class="bp-node-body">
      <div class="bp-pin-row input">
        <span class="bp-pin" data-pin="eg4-do2"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Exec</span>
      </div>
    </div>
  </div>
</div>

#### Sequence (序列)

按顺序执行多个分支。

<div class="bp-graph" style="" data-connections='[{"from":"eg5-then0","to":"eg5-step1","type":"exec"},{"from":"eg5-then1","to":"eg5-step2","type":"exec"},{"from":"eg5-then2","to":"eg5-step3","type":"exec"}]'>
  <svg class="bp-connections"></svg>
  <div class="bp-node" style="left: 20px; top: 20px; width: 110px;">
    <div class="bp-node-header flow">Sequence</div>
    <div class="bp-node-body">
      <div class="bp-pin-row input">
        <span class="bp-pin"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Exec</span>
      </div>
      <div class="bp-pin-row output">
        <span class="bp-pin" data-pin="eg5-then0"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Then 0</span>
      </div>
      <div class="bp-pin-row output">
        <span class="bp-pin" data-pin="eg5-then1"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Then 1</span>
      </div>
      <div class="bp-pin-row output">
        <span class="bp-pin" data-pin="eg5-then2"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Then 2</span>
      </div>
    </div>
  </div>
  <div class="bp-node" style="left: 220px; top: 20px; width: 100px;">
    <div class="bp-node-header function">Step 1</div>
    <div class="bp-node-body">
      <div class="bp-pin-row input">
        <span class="bp-pin" data-pin="eg5-step1"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Exec</span>
      </div>
    </div>
  </div>
  <div class="bp-node" style="left: 220px; top: 100px; width: 100px;">
    <div class="bp-node-header function">Step 2</div>
    <div class="bp-node-body">
      <div class="bp-pin-row input">
        <span class="bp-pin" data-pin="eg5-step2"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Exec</span>
      </div>
    </div>
  </div>
  <div class="bp-node" style="left: 220px; top: 180px; width: 100px;">
    <div class="bp-node-header function">Step 3</div>
    <div class="bp-node-body">
      <div class="bp-pin-row input">
        <span class="bp-pin" data-pin="eg5-step3"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Exec</span>
      </div>
    </div>
  </div>
</div>

#### For Loop (循环)

循环执行指定次数。

<div class="bp-graph" style="" data-connections='[{"from":"eg6-body","to":"eg6-iter","type":"exec"},{"from":"eg6-done","to":"eg6-finish","type":"exec"}]'>
  <svg class="bp-connections"></svg>
  <div class="bp-node" style="left: 20px; top: 20px; width: 140px;">
    <div class="bp-node-header flow">For Loop</div>
    <div class="bp-node-body">
      <div class="bp-pin-row input">
        <span class="bp-pin"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Exec</span>
      </div>
      <div class="bp-pin-row input">
        <span class="bp-pin"><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="none" stroke="#1cc4c4" stroke-width="2"/></svg></span>
        <span class="bp-pin-label">First Index</span>
        <span class="bp-pin-value">0</span>
      </div>
      <div class="bp-pin-row input">
        <span class="bp-pin"><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="none" stroke="#1cc4c4" stroke-width="2"/></svg></span>
        <span class="bp-pin-label">Last Index</span>
        <span class="bp-pin-value">10</span>
      </div>
      <div class="bp-pin-row output">
        <span class="bp-pin" data-pin="eg6-body"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Loop Body</span>
      </div>
      <div class="bp-pin-row output">
        <span class="bp-pin"><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="#1cc4c4"/></svg></span>
        <span class="bp-pin-label">Index</span>
      </div>
      <div class="bp-pin-row output">
        <span class="bp-pin" data-pin="eg6-done"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Completed</span>
      </div>
    </div>
  </div>
  <div class="bp-node" style="left: 250px; top: 80px; width: 130px;">
    <div class="bp-node-header function">每次迭代执行</div>
    <div class="bp-node-body">
      <div class="bp-pin-row input">
        <span class="bp-pin" data-pin="eg6-iter"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Exec</span>
      </div>
    </div>
  </div>
  <div class="bp-node" style="left: 250px; top: 160px; width: 140px;">
    <div class="bp-node-header function">循环结束后执行</div>
    <div class="bp-node-body">
      <div class="bp-pin-row input">
        <span class="bp-pin" data-pin="eg6-finish"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Exec</span>
      </div>
    </div>
  </div>
</div>

#### For Each (遍历)

遍历数组元素。

#### While Loop (条件循环)

当条件为真时持续循环。

#### Do Once (单次执行)

只执行一次，之后跳过。

#### Flip Flop (交替执行)

每次执行时交替触发 A 和 B 输出。

#### Gate (门)

可通过 Open/Close/Toggle 控制是否允许执行通过。

### 时间节点 (Time)

| 节点 | 功能 | 输出类型 |
|------|------|---------|
| **Delay** | 延迟指定时间后继续执行 | Exec |
| **Get Delta Time** | 获取帧间隔时间 | Number |
| **Get Time** | 获取运行总时间 | Number |

**示例：延迟 2 秒后执行**

<div class="bp-graph" style="" data-connections='[{"from":"eg7-exec","to":"eg7-delay","type":"exec"},{"from":"eg7-done","to":"eg7-print","type":"exec"}]'>
  <svg class="bp-connections"></svg>
  <div class="bp-node" style="left: 20px; top: 20px; width: 170px;">
    <div class="bp-node-header event">
      <span class="bp-node-header-icon"></span>
      <span class="bp-node-header-title">Event BeginPlay</span>
      <span class="bp-header-exec" data-pin="eg7-exec"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
    </div>
  </div>
  <div class="bp-node" style="left: 280px; top: 20px; width: 120px;">
    <div class="bp-node-header time">Delay</div>
    <div class="bp-node-body">
      <div class="bp-pin-row input">
        <span class="bp-pin" data-pin="eg7-delay"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Exec</span>
      </div>
      <div class="bp-pin-row input">
        <span class="bp-pin"><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="none" stroke="#7ecd32" stroke-width="2"/></svg></span>
        <span class="bp-pin-label">Duration</span>
        <span class="bp-pin-value">2.0</span>
      </div>
      <div class="bp-pin-row output">
        <span class="bp-pin" data-pin="eg7-done"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Done</span>
      </div>
    </div>
  </div>
  <div class="bp-node" style="left: 490px; top: 20px; width: 130px;">
    <div class="bp-node-header debug">Print</div>
    <div class="bp-node-body">
      <div class="bp-pin-row input">
        <span class="bp-pin" data-pin="eg7-print"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Exec</span>
      </div>
      <div class="bp-pin-row input">
        <span class="bp-pin"><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="none" stroke="#e060e0" stroke-width="2"/></svg></span>
        <span class="bp-pin-label">Msg</span>
        <span class="bp-pin-value">"2秒后执行"</span>
      </div>
    </div>
  </div>
</div>

### 数学节点 (Math)

| 节点 | 功能 |
|------|------|
| **Add / Subtract / Multiply / Divide** | 四则运算 |
| **Abs** | 绝对值 |
| **Clamp** | 限制在范围内 |
| **Lerp** | 线性插值 |
| **Min / Max** | 最小/最大值 |
| **Random Range** | 随机数 |
| **Sin / Cos / Tan** | 三角函数 |

### 调试节点 (Debug)

| 节点 | 功能 |
|------|------|
| **Print** | 输出到控制台 |

## 变量系统

变量用于在蓝图中存储和共享数据。

### 创建变量

1. 在变量面板点击 **+** 按钮
2. 输入变量名称
3. 选择变量类型
4. 设置默认值（可选）

### 使用变量

- **拖拽到画布** - 创建 Get 或 Set 节点
- **Get 节点** - 读取变量值
- **Set 节点** - 写入变量值

### 变量类型

| 类型 | 说明 | 默认值 |
|------|------|--------|
| Boolean | 布尔值 | false |
| Number | 数值 | 0 |
| String | 字符串 | "" |
| Entity | 实体引用 | null |
| Vector2 | 二维向量 | (0, 0) |
| Vector3 | 三维向量 | (0, 0, 0) |

### 变量节点错误状态

如果删除了一个变量，但画布上还有引用该变量的节点：
- 节点会显示 **红色边框** 和 **警告图标**
- 需要重新创建变量或删除这些节点

## 节点分组

可以将多个节点组织到一个可视化组框中，便于整理复杂蓝图。

### 创建组

1. 框选或 Ctrl+点击 选中多个节点（至少 2 个）
2. 右键点击选中的节点
3. 选择 **创建分组**
4. 组框会自动包裹所有选中的节点

### 组操作

| 操作 | 方式 |
|------|------|
| 移动组 | 拖拽组框头部，所有节点一起移动 |
| 取消分组 | 右键点击组框 → **取消分组** |

### 特性

- **动态大小**：组框会自动调整大小以包裹所有节点
- **独立移动**：可以单独移动组内的节点，组框会自动调整
- **仅编辑器**：组是纯视觉组织，不影响运行时逻辑

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + S` | 保存蓝图 |
| `Ctrl + Z` | 撤销 |
| `Ctrl + Shift + Z` | 重做 |
| `Ctrl + C` | 复制选中节点 |
| `Ctrl + X` | 剪切选中节点 |
| `Ctrl + V` | 粘贴节点 |
| `Delete` | 删除选中项 |
| `Ctrl + A` | 全选 |

## 保存与加载

### 保存蓝图

1. 点击工具栏 **保存** 按钮
2. 选择保存位置（**必须保存在 `assets/resources` 目录下**，否则 Cocos Creator 无法动态加载）
3. 文件扩展名为 `.blueprint.json`

> **重要提示**：蓝图文件必须放在 `resources` 目录下，游戏运行时才能通过 `cc.resources.load()` 加载。

### 加载蓝图

1. 点击工具栏 **打开** 按钮
2. 选择 `.blueprint.json` 文件

### 蓝图文件格式

蓝图保存为 JSON 格式，可与 `@esengine/blueprint` 运行时兼容：

```json
{
  "version": 1,
  "type": "blueprint",
  "metadata": {
    "name": "PlayerController",
    "description": "玩家控制逻辑"
  },
  "variables": [],
  "nodes": [],
  "connections": []
}
```

## 实战示例

### 示例 1：移动控制

实现每帧移动实体：

<div class="bp-graph" style="" data-connections='[{"from":"ex1-exec","to":"ex1-setprop","type":"exec"},{"from":"ex1-delta","to":"ex1-mul-a","type":"float"},{"from":"ex1-mul-result","to":"ex1-x","type":"float"}]'>
  <svg class="bp-connections"></svg>
  <div class="bp-node" style="left: 20px; top: 20px; width: 140px;">
    <div class="bp-node-header event">
      <span class="bp-node-header-icon"></span>
      <span class="bp-node-header-title">Event Tick</span>
      <span class="bp-header-exec" data-pin="ex1-exec"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
    </div>
    <div class="bp-node-body">
      <div class="bp-pin-row output">
        <span class="bp-pin" data-pin="ex1-delta"><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="#7ecd32"/></svg></span>
        <span class="bp-pin-label">Delta Time</span>
      </div>
    </div>
  </div>
  <div class="bp-node" style="left: 200px; top: 110px; width: 120px;">
    <div class="bp-node-header math">Multiply</div>
    <div class="bp-node-body">
      <div class="bp-pin-row input">
        <span class="bp-pin" data-pin="ex1-mul-a"><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="#7ecd32"/></svg></span>
        <span class="bp-pin-label">A</span>
      </div>
      <div class="bp-pin-row input">
        <span class="bp-pin"><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="none" stroke="#7ecd32" stroke-width="2"/></svg></span>
        <span class="bp-pin-label">B (Speed)</span>
        <span class="bp-pin-value">100</span>
      </div>
      <div class="bp-pin-row output">
        <span class="bp-pin" data-pin="ex1-mul-result"><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="#7ecd32"/></svg></span>
        <span class="bp-pin-label">Result</span>
      </div>
    </div>
  </div>
  <div class="bp-node" style="left: 380px; top: 20px; width: 150px;">
    <div class="bp-node-header function">Set Property</div>
    <div class="bp-node-body">
      <div class="bp-pin-row input">
        <span class="bp-pin" data-pin="ex1-setprop"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Exec</span>
      </div>
      <div class="bp-pin-row input">
        <span class="bp-pin"><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="none" stroke="#7030c0" stroke-width="2"/></svg></span>
        <span class="bp-pin-label">Target</span>
      </div>
      <div class="bp-pin-row input">
        <span class="bp-pin" data-pin="ex1-x"><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="#7ecd32"/></svg></span>
        <span class="bp-pin-label">x</span>
      </div>
    </div>
  </div>
</div>

### 示例 2：生命值系统

受伤后检查死亡逻辑。`Event OnDamage` 是一个自定义事件节点，可以通过代码 `vm.triggerCustomEvent('OnDamage', { damage: 50 })` 触发：

<div class="bp-graph" data-graph='{
  "nodes": [
    {
      "id": "event", "title": "Event OnDamage", "category": "event",
      "outputs": [
        {"id": "event-exec", "type": "exec", "inHeader": true},
        {"id": "event-self", "type": "entity", "label": "Self"},
        {"id": "event-damage", "type": "float", "label": "Damage"}
      ]
    },
    {
      "id": "getcomp", "title": "Get Component", "category": "function",
      "inputs": [
        {"id": "getcomp-exec", "type": "exec", "label": "Exec"},
        {"id": "getcomp-entity", "type": "entity", "label": "Entity"},
        {"id": "getcomp-type", "type": "string", "label": "Type", "value": "Health", "connected": false}
      ],
      "outputs": [
        {"id": "getcomp-out", "type": "exec"},
        {"id": "getcomp-comp", "type": "component", "label": "Component"}
      ]
    },
    {
      "id": "getprop", "title": "Get Property", "category": "pure",
      "inputs": [
        {"id": "getprop-target", "type": "component", "label": "Target"},
        {"id": "getprop-prop", "type": "string", "label": "Property", "value": "current", "connected": false}
      ],
      "outputs": [
        {"id": "getprop-val", "type": "float", "label": "Value"}
      ]
    },
    {
      "id": "sub", "title": "Subtract", "category": "math",
      "inputs": [
        {"id": "sub-exec", "type": "exec", "label": "Exec"},
        {"id": "sub-a", "type": "float", "label": "A"},
        {"id": "sub-b", "type": "float", "label": "B"}
      ],
      "outputs": [
        {"id": "sub-out", "type": "exec"},
        {"id": "sub-result", "type": "float", "label": "Result"}
      ]
    },
    {
      "id": "setprop", "title": "Set Property", "category": "function",
      "inputs": [
        {"id": "setprop-exec", "type": "exec", "label": "Exec"},
        {"id": "setprop-target", "type": "component", "label": "Target"},
        {"id": "setprop-prop", "type": "string", "label": "Property", "value": "current", "connected": false},
        {"id": "setprop-val", "type": "float", "label": "Value"}
      ],
      "outputs": [
        {"id": "setprop-out", "type": "exec"}
      ]
    },
    {
      "id": "lte", "title": "Less Or Equal", "category": "pure",
      "inputs": [
        {"id": "lte-a", "type": "float", "label": "A"},
        {"id": "lte-b", "type": "float", "label": "B", "value": "0", "connected": false}
      ],
      "outputs": [
        {"id": "lte-result", "type": "bool", "label": "Result"}
      ]
    },
    {
      "id": "branch", "title": "Branch", "category": "flow",
      "inputs": [
        {"id": "branch-exec", "type": "exec", "label": "Exec"},
        {"id": "branch-cond", "type": "bool", "label": "Condition"}
      ],
      "outputs": [
        {"id": "branch-true", "type": "exec", "label": "True"},
        {"id": "branch-false", "type": "exec", "label": "False"}
      ]
    },
    {
      "id": "destroy", "title": "Destroy Entity", "category": "function",
      "inputs": [
        {"id": "destroy-exec", "type": "exec", "label": "Exec"},
        {"id": "destroy-entity", "type": "entity", "label": "Entity"}
      ]
    }
  ],
  "connections": [
    {"from": "event-exec", "to": "getcomp-exec", "type": "exec"},
    {"from": "getcomp-out", "to": "sub-exec", "type": "exec"},
    {"from": "sub-out", "to": "setprop-exec", "type": "exec"},
    {"from": "setprop-out", "to": "branch-exec", "type": "exec"},
    {"from": "branch-true", "to": "destroy-exec", "type": "exec"},
    {"from": "event-self", "to": "getcomp-entity", "type": "entity"},
    {"from": "event-self", "to": "destroy-entity", "type": "entity"},
    {"from": "getcomp-comp", "to": "getprop-target", "type": "component"},
    {"from": "getcomp-comp", "to": "setprop-target", "type": "component"},
    {"from": "getprop-val", "to": "sub-a", "type": "float"},
    {"from": "event-damage", "to": "sub-b", "type": "float"},
    {"from": "sub-result", "to": "setprop-val", "type": "float"},
    {"from": "sub-result", "to": "lte-a", "type": "float"},
    {"from": "lte-result", "to": "branch-cond", "type": "bool"}
  ]
}'></div>

### 示例 3：延迟生成

每 2 秒生成一个敌人：

<div class="bp-graph" style="" data-connections='[{"from":"ex3-begin-exec","to":"ex3-loop","type":"exec"},{"from":"ex3-loop-body","to":"ex3-delay","type":"exec"},{"from":"ex3-delay-done","to":"ex3-create","type":"exec"}]'>
  <svg class="bp-connections"></svg>
  <div class="bp-node" style="left: 20px; top: 20px; width: 170px;">
    <div class="bp-node-header event">
      <span class="bp-node-header-icon"></span>
      <span class="bp-node-header-title">Event BeginPlay</span>
      <span class="bp-header-exec" data-pin="ex3-begin-exec"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
    </div>
  </div>
  <div class="bp-node" style="left: 240px; top: 20px; width: 130px;">
    <div class="bp-node-header flow">Do N Times</div>
    <div class="bp-node-body">
      <div class="bp-pin-row input">
        <span class="bp-pin" data-pin="ex3-loop"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Exec</span>
      </div>
      <div class="bp-pin-row input">
        <span class="bp-pin"><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="none" stroke="#1cc4c4" stroke-width="2"/></svg></span>
        <span class="bp-pin-label">N</span>
        <span class="bp-pin-value">10</span>
      </div>
      <div class="bp-pin-row output">
        <span class="bp-pin" data-pin="ex3-loop-body"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Loop Body</span>
      </div>
      <div class="bp-pin-row output">
        <span class="bp-pin"><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="#1cc4c4"/></svg></span>
        <span class="bp-pin-label">Index</span>
      </div>
      <div class="bp-pin-row output">
        <span class="bp-pin"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Completed</span>
      </div>
    </div>
  </div>
  <div class="bp-node" style="left: 430px; top: 20px; width: 120px;">
    <div class="bp-node-header time">Delay</div>
    <div class="bp-node-body">
      <div class="bp-pin-row input">
        <span class="bp-pin" data-pin="ex3-delay"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Exec</span>
      </div>
      <div class="bp-pin-row input">
        <span class="bp-pin"><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="none" stroke="#7ecd32" stroke-width="2"/></svg></span>
        <span class="bp-pin-label">Duration</span>
        <span class="bp-pin-value">2.0</span>
      </div>
      <div class="bp-pin-row output">
        <span class="bp-pin" data-pin="ex3-delay-done"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Done</span>
      </div>
    </div>
  </div>
  <div class="bp-node" style="left: 610px; top: 20px; width: 140px;">
    <div class="bp-node-header function">Create Entity</div>
    <div class="bp-node-body">
      <div class="bp-pin-row input">
        <span class="bp-pin" data-pin="ex3-create"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
        <span class="bp-pin-label">Exec</span>
      </div>
      <div class="bp-pin-row input">
        <span class="bp-pin"><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="none" stroke="#e060e0" stroke-width="2"/></svg></span>
        <span class="bp-pin-label">Name</span>
        <span class="bp-pin-value">"Enemy"</span>
      </div>
      <div class="bp-pin-row output">
        <span class="bp-pin"><svg width="12" height="12"><polygon points="1,1 11,6 1,11" fill="#fff"/></svg></span>
      </div>
      <div class="bp-pin-row output">
        <span class="bp-pin"><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="#00a0e0"/></svg></span>
        <span class="bp-pin-label">Entity</span>
      </div>
    </div>
  </div>
</div>

## 常见问题

### Q: 节点无法连接？

检查引脚类型是否匹配。执行引脚（白色）只能连接执行引脚，数据引脚需要类型兼容。

### Q: 蓝图不执行？

1. 确保实体添加了 `BlueprintComponent`
2. 确保场景添加了 `BlueprintSystem`
3. 检查 `autoStart` 是否为 `true`
4. 若脚本是普通 Cocos 组件（`cc.Component`，非 ECS 组件），改用 `BlueprintRunner`，见[运行时集成](/modules/blueprint/vm)

### Q: 如何调试？

使用 **Print** 节点输出变量值到控制台。

## 下一步

- [ECS 节点参考](/modules/blueprint/nodes) - 完整节点列表
- [自定义节点](/modules/blueprint/custom-nodes) - 创建自定义节点
- [运行时集成](/modules/blueprint/vm) - 蓝图虚拟机 API
- [实际示例](/modules/blueprint/examples) - 更多游戏逻辑示例
