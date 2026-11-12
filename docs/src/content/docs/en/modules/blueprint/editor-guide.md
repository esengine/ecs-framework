---
title: "Blueprint Editor User Guide"
description: "Complete guide for using the Cocos Creator Blueprint Visual Scripting Editor"
---

<script src="/js/blueprint-graph.js"></script>

This guide covers how to use the Blueprint Visual Scripting Editor in Cocos Creator.

## Download & Installation

### Download

Download the latest version from GitHub Release (Free):

**[Download Cocos Node Editor v1.2.4](https://github.com/esengine/ecs-framework/releases/tag/cocos-node-editor-v1.2.4)**

:::tip[What's new]
**v1.2.4**: `@BlueprintProperty` / `@BlueprintInput` / `@BlueprintOutput` now support properties **without a TS type annotation** (e.g. `current = 100`, type taken from the decorator's `type` field); previously only `current: number` would generate Get/Set nodes.

Components marked with Cocos's `@ccclass` + `@BlueprintExpose` now correctly generate method/property nodes: `@BlueprintMethod` becomes a callable node with exec pins, `@BlueprintProperty` generates Get/Set nodes, and node titles use the decorator `displayName`. Previously only esengine ECS `@ECSComponent` components generated these nodes.

**v1.2.3**: `@BlueprintMethod` `params` now generate the corresponding **parameter input pins** on the method node (e.g. `amount` for `heal(amount)`); when left unset they default by type (`float` → 0), so method arguments are no longer `undefined` at runtime.
:::

:::caution[Upgrade from v1.2.0]
v1.2.1 fixes a critical bug where exported blueprints did not execute at runtime (connections were serialized by pin id instead of pin name), plus copy/paste producing broken links and node inspector edits not being saved. **If you are on v1.2.0, upgrade and re-open + re-save your blueprints once** so connections are rewritten in the correct format.
:::

> QQ Group: **481923584** | Website: [esengine.cn](https://esengine.cn/)

### Installation Steps

1. Extract `cocos-node-editor.zip` to your project's `extensions` directory:

```
your-project/
├── assets/
├── extensions/
│   └── cocos-node-editor/    ← Extract here
└── ...
```

2. Restart Cocos Creator

3. Confirm the plugin is enabled via **Extensions → Extension Manager**

4. Open the editor via **Panel → Node Editor**

## Interface Overview

- **Toolbar** - Located at the top, contains New, Open, Save, Undo, Redo operations
- **Variables Panel** - Located at the top-left, for defining and managing blueprint variables
- **Canvas Area** - Main area for placing and connecting nodes
- **Node Menu** - Right-click on empty canvas to open, lists all available nodes by category

## Canvas Operations

| Operation | Method |
|-----------|--------|
| Pan canvas | Middle-click drag / Alt + Left-click drag |
| Zoom canvas | Mouse wheel |
| Open node menu | Right-click on empty space |
| Box select nodes | Drag on empty canvas |
| Additive select | Ctrl + Drag |
| Delete selected | Delete key |

## Node Operations

### Adding Nodes

1. **Drag from Node Panel** - Drag nodes from the left panel onto the canvas
2. **Right-click Menu** - Right-click on empty canvas space to select nodes

### Connecting Nodes

1. Drag from an output pin to an input pin
2. Compatible pins will highlight
3. Release to complete the connection

**Pin Type Reference:**

| Pin Color | Type | Description |
|-----------|------|-------------|
| White ▶ | Exec | Execution flow (controls order) |
| Cyan ◆ | Entity | Entity reference |
| Purple ◆ | Component | Component reference |
| Light Blue ◆ | String | String value |
| Green ◆ | Number | Numeric value |
| Red ◆ | Boolean | Boolean value |
| Gray ◆ | Any | Any type |

### Deleting Connections

Click a connection line to select it, then press Delete.

## Node Types Reference

### Event Nodes

Event nodes are entry points for blueprint execution, triggered when specific events occur.

| Node | Trigger | Outputs |
|------|---------|---------|
| **Event BeginPlay** | When blueprint starts | Exec, Self (Entity) |
| **Event Tick** | Every frame | Exec, Delta Time |
| **Event EndPlay** | When blueprint stops | Exec |

**Example: Print message on game start**
```
[Event BeginPlay] ──Exec──→ [Print]
                              └─ Message: "Game Started!"
```

### Entity Nodes

Nodes for operating on ECS entities.

| Node | Function | Inputs | Outputs |
|------|----------|--------|---------|
| **Get Self** | Get current entity | - | Entity |
| **Create Entity** | Create new entity | Exec, Name | Exec, Entity |
| **Destroy Entity** | Destroy entity | Exec, Entity | Exec |
| **Find Entity By Name** | Find by name | Name | Entity |
| **Find Entities By Tag** | Find by tag | Tag | Entity[] |
| **Is Valid** | Check entity validity | Entity | Boolean |
| **Get/Set Entity Name** | Get/Set name | Entity | String |
| **Set Active** | Set active state | Exec, Entity, Active | Exec |

**Example: Create new entity**
```
[Event BeginPlay] ──→ [Create Entity] ──→ [Add Component]
                        └─ Name: "Bullet"     └─ Type: Transform
```

### Component Nodes

Access and manipulate ECS components.

| Node | Function |
|------|----------|
| **Has Component** | Check if entity has component |
| **Get Component** | Get component instance |
| **Add Component** | Add component to entity |
| **Remove Component** | Remove component |
| **Get/Set Property** | Get/Set component property |

**Example: Modify Transform component**
```
[Get Self] ─Entity─→ [Get Component: Transform] ─Component─→ [Set Property]
                                                               ├─ Property: x
                                                               └─ Value: 100
```

### Flow Control Nodes

Nodes that control execution flow.

#### Branch

Conditional branching, similar to if/else.

```
         ┌─ True ──→ [DoSomething]
[Branch]─┤
         └─ False ─→ [DoOtherThing]
```

#### Sequence

Execute multiple branches in order.

```
           ┌─ Then 0 ──→ [Step1]
[Sequence]─┼─ Then 1 ──→ [Step2]
           └─ Then 2 ──→ [Step3]
```

#### For Loop

Execute a specified number of times.

```
[For Loop] ─Loop Body─→ [Execute each iteration]
    │
    └─ Completed ────→ [Execute after loop ends]
```

| Input | Description |
|-------|-------------|
| First Index | Starting index |
| Last Index | Ending index |

| Output | Description |
|--------|-------------|
| Loop Body | Execute each iteration |
| Index | Current index |
| Completed | Execute after loop ends |

#### For Each

Iterate over array elements.

#### While Loop

Loop while condition is true.

#### Do Once

Execute only once, skip afterwards.

#### Flip Flop

Alternate between A and B outputs each execution.

#### Gate

Control whether execution passes through via Open/Close/Toggle.

### Time Nodes

| Node | Function | Output Type |
|------|----------|-------------|
| **Delay** | Delay execution by specified time | Exec |
| **Get Delta Time** | Get frame delta time | Number |
| **Get Time** | Get total runtime | Number |

**Example: Execute after 2 second delay**
```
[Event BeginPlay] ──→ [Delay] ──→ [Print]
                       └─ Duration: 2.0   └─ "Executed after 2s"
```

### Math Nodes

| Node | Function |
|------|----------|
| **Add / Subtract / Multiply / Divide** | Arithmetic operations |
| **Abs** | Absolute value |
| **Clamp** | Clamp to range |
| **Lerp** | Linear interpolation |
| **Min / Max** | Minimum/Maximum value |
| **Random Range** | Random number |
| **Sin / Cos / Tan** | Trigonometric functions |

### Debug Nodes

| Node | Function |
|------|----------|
| **Print** | Output to console |

## Variable System

Variables store and share data within a blueprint.

### Creating Variables

1. Click the **+** button in the Variables panel
2. Enter variable name
3. Select variable type
4. Set default value (optional)

### Using Variables

- **Drag to canvas** - Creates Get or Set node
- **Get Node** - Read variable value
- **Set Node** - Write variable value

### Variable Types

| Type | Description | Default |
|------|-------------|---------|
| Boolean | Boolean value | false |
| Number | Numeric value | 0 |
| String | String value | "" |
| Entity | Entity reference | null |
| Vector2 | 2D vector | (0, 0) |
| Vector3 | 3D vector | (0, 0, 0) |

### Variable Node Error State

If you delete a variable but nodes still reference it:
- Nodes display a **red border** and **warning icon**
- You need to recreate the variable or delete these nodes

## Node Grouping

You can organize multiple nodes into a visual group box to help manage complex blueprints.

### Creating a Group

1. Box-select or Ctrl+click to select multiple nodes (at least 2)
2. Right-click on the selected nodes
3. Choose **Create Group**
4. A group box will automatically wrap all selected nodes

### Group Operations

| Action | Method |
|--------|--------|
| Move group | Drag the group header, all nodes move together |
| Ungroup | Right-click on group box → **Ungroup** |

### Features

- **Dynamic sizing**: Group box automatically resizes to wrap all nodes
- **Independent movement**: You can move nodes within the group individually, and the box adjusts
- **Editor only**: Groups are purely visual organization, no runtime impact

## Keyboard Shortcuts

| Shortcut | Function |
|----------|----------|
| `Ctrl + S` | Save blueprint |
| `Ctrl + Z` | Undo |
| `Ctrl + Shift + Z` | Redo |
| `Ctrl + C` | Copy selected nodes |
| `Ctrl + X` | Cut selected nodes |
| `Ctrl + V` | Paste nodes |
| `Delete` | Delete selected items |
| `Ctrl + A` | Select all |

## Save & Load

### Saving Blueprints

1. Click the **Save** button in the toolbar
2. Choose save location (**must be saved in `assets/resources` directory**, otherwise Cocos Creator cannot load dynamically)
3. File extension is `.blueprint.json`

> **Important**: Blueprint files must be placed in the `resources` directory for runtime loading via `cc.resources.load()`.

### Loading Blueprints

1. Click the **Open** button in the toolbar
2. Select a `.blueprint.json` file

### Blueprint File Format

Blueprints are saved as JSON, compatible with `@esengine/blueprint` runtime:

```json
{
  "version": 1,
  "type": "blueprint",
  "metadata": {
    "name": "PlayerController",
    "description": "Player control logic"
  },
  "variables": [],
  "nodes": [],
  "connections": []
}
```

## Practical Examples

### Example 1: Movement Control

Move entity every frame:

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

### Example 2: Health System

Check death after taking damage. `Event OnDamage` is a custom event node that can be triggered from code via `vm.triggerCustomEvent('OnDamage', { damage: 50 })`:

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

### Example 3: Delayed Spawning

Spawn an enemy every 2 seconds:

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

## Troubleshooting

### Q: Nodes won't connect?

Check if pin types are compatible. Execution pins (white) can only connect to execution pins. Data pins need matching types.

### Q: Blueprint not executing?

1. Ensure entity has `BlueprintComponent` attached
2. Ensure scene has `BlueprintSystem` added
3. Check if `autoStart` is `true`
4. If the script is a plain Cocos component (`cc.Component`, not an ECS component), use `BlueprintRunner` instead — see [Runtime Integration](/en/modules/blueprint/vm)

### Q: How to debug?

Use **Print** nodes to output variable values to the console.

## Next Steps

- [ECS Node Reference](/en/modules/blueprint/nodes) - Complete node list
- [Custom Nodes](/en/modules/blueprint/custom-nodes) - Create custom nodes
- [Runtime Integration](/en/modules/blueprint/vm) - Blueprint VM API
- [Examples](/en/modules/blueprint/examples) - More game logic examples
