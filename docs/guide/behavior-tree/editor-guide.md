# 行为树编辑器使用指南

行为树编辑器提供了可视化的方式来创建和编辑行为树。

## 启动编辑器

```bash
cd packages/editor-app
npm run tauri:dev
```

## 基本操作

### 打开行为树编辑器

通过以下方式打开行为树编辑器窗口：

1. 在资产浏览器中双击 `.btree` 文件
2. 菜单栏：`窗口` → 选择行为树编辑器相关插件

### 创建新行为树

在行为树编辑器窗口的工具栏中点击"新建"按钮（加号图标）

### 保存行为树

在行为树编辑器窗口的工具栏中点击"保存"按钮（磁盘图标）

### 添加节点

从左侧节点面板拖拽节点到画布：
- 复合节点：Selector、Sequence、Parallel
- 装饰器：Inverter、Repeater、UntilFail等
- 动作节点：ExecuteAction、Wait等
- 条件节点：Condition

### 连接节点

拖拽父节点底部的连接点到子节点顶部建立连接

### 删除节点

选中节点后按 `Delete` 或 `Backspace` 键

### 编辑属性

点击节点后在右侧属性面板中编辑节点参数

## 黑板变量

在黑板面板中管理共享数据：

1. 点击"添加变量"按钮
2. 输入变量名、选择类型并设置默认值
3. 在节点中通过变量名引用黑板变量

支持的变量类型：
- String：字符串
- Number：数字
- Boolean：布尔值
- Vector2：二维向量
- Vector3：三维向量
- Object：对象引用
- Array：数组

## 导出运行时资产

### 导出步骤

1. 点击工具栏的"导出"按钮
2. 选择导出模式：
   - 当前文件：仅导出当前打开的行为树
   - 工作区导出：导出项目中所有行为树
3. 选择资产输出路径
4. 选择TypeScript类型定义输出路径
5. 为每个文件选择导出格式：
   - 二进制：.btree.bin（默认，文件更小，加载更快）
   - JSON：.btree.json（可读性好，便于调试）
6. 点击"导出"按钮

### 加载运行时资产

编辑器导出的文件是编辑器格式，包含UI布局信息。当前版本中，从编辑器导出的资产可以使用Builder API在代码中重新构建，或者等待资产加载系统的完善。

推荐使用Builder API创建行为树：

```typescript
import { BehaviorTreeBuilder, BehaviorTreeStarter } from '@esengine/behavior-tree';
import { Core, Scene } from '@esengine/ecs-framework';

// 使用Builder创建行为树
const tree = BehaviorTreeBuilder.create('EnemyAI')
    .defineBlackboardVariable('health', 100)
    .defineBlackboardVariable('target', null)
    .selector('MainBehavior')
        .sequence('AttackBranch')
            .blackboardCompare('health', 50, 'greater')
            .log('攻击玩家', 'Attack')
        .end()
        .log('逃离战斗', 'Flee')
    .end()
    .build();

// 启动行为树
const entity = scene.createEntity('Enemy');
BehaviorTreeStarter.start(entity, tree);
```

## 支持的操作

- `Delete` / `Backspace`：删除选中的节点或连线
- `Ctrl` + 点击：多选节点
- 框选：拖拽空白区域进行框选
- 拖拽画布：按住鼠标中键或空格键拖拽

## 下一步

- 查看[编辑器工作流](./editor-workflow.md)了解完整的开发流程
- 查看[自定义节点执行器](./custom-actions.md)学习如何扩展节点
