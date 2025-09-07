# 贡献指南

感谢你对 ECS Framework 的关注！我们欢迎所有形式的贡献，包括但不限于：

## 贡献类型

### 代码贡献
- 新功能开发
- Bug 修复
- 性能优化
- 代码重构

### 文档贡献
- 完善 API 文档
- 添加使用示例
- 翻译文档内容
- 修复文档错误

### 社区贡献
- 报告 Bug
- 提出功能建议
- 参与讨论
- 帮助其他用户

## 开发环境搭建

### 前置要求
- Node.js >= 16.0.0
- npm >= 7.0.0 或 yarn >= 1.22.0
- Git

### 克隆项目
```bash
git clone https://github.com/esengine/ecs-framework.git
cd ecs-framework
```

### 安装依赖
```bash
npm install
# 或
yarn install
```

### 运行测试
```bash
npm test
```

### 构建项目
```bash
npm run build
```

## 提交规范

### Commit 消息格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type 类型
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式化
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

#### 示例
```
feat(core): 添加多 World 支持

支持同时运行多个 World 实例，每个 World 可以包含多个 Scene。
这将为复杂游戏提供更好的架构支持。

Closes #123
```

### Pull Request 规范
1. 基于 `develop` 分支创建功能分支
2. 确保代码通过所有测试
3. 添加必要的测试用例
4. 更新相关文档
5. 填写详细的 PR 描述

## 代码规范

### TypeScript 规范
- 使用严格的 TypeScript 配置
- 为所有公共 API 添加类型定义
- 使用 JSDoc 注释

```typescript
/**
 * 创建新的实体
 * @param name 实体名称
 * @param tag 实体标签（可选）
 * @returns 新创建的实体实例
 */
createEntity(name: string, tag?: string): Entity {
  // 实现代码
}
```

### 命名规范
- 类名使用 PascalCase: `EntityManager`
- 方法名使用 camelCase: `createEntity`
- 常量使用 UPPER_SNAKE_CASE: `MAX_ENTITIES`
- 接口名以 I 开头: `IComponent`

### 注释规范
- 类和公共方法必须有 JSDoc 注释
- 复杂逻辑需要行内注释
- 不要写无意义的注释

## 测试规范

### 测试覆盖率
- 新功能必须包含测试用例
- 目标测试覆盖率 > 80%
- 关键路径必须 100% 覆盖

### 测试命名
```typescript
describe('EntityManager', () => {
  describe('createEntity', () => {
    it('应该创建具有指定名称的实体', () => {
      // 测试实现
    })
    
    it('应该为实体分配唯一ID', () => {
      // 测试实现
    })
  })
})
```

### 性能测试
对于性能敏感的功能，需要添加性能基准测试：

```typescript
describe('Performance', () => {
  it('批量创建1000个实体应该在10ms内完成', () => {
    const start = performance.now()
    
    for (let i = 0; i < 1000; i++) {
      scene.createEntity(`Entity${i}`)
    }
    
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(10)
  })
})
```

## 文档规范

### API 文档
- 使用 TypeDoc 生成 API 文档
- 所有公共 API 必须有完整的文档
- 包含使用示例和注意事项

### 示例代码
- 示例代码必须可以运行
- 包含必要的错误处理
- 添加详细的注释说明

### 文档结构
```
docs/
├── guide/          # 用户指南
├── api/           # API 参考
├── examples/      # 示例代码
└── contributing.md # 贡献指南
```

## 发布流程

### 版本号规范
遵循 [Semantic Versioning](https://semver.org/):
- `MAJOR`: 不兼容的 API 变更
- `MINOR`: 向后兼容的功能新增
- `PATCH`: 向后兼容的问题修正

### 发布检查清单
- [ ] 所有测试通过
- [ ] 更新 CHANGELOG.md
- [ ] 更新版本号
- [ ] 更新文档
- [ ] 创建 Git 标签
- [ ] 发布到 npm

## 获得帮助

### 社区渠道
- QQ 群：[ecs游戏框架交流](https://jq.qq.com/?_wv=1027&k=29w1Nud6)
- GitHub Issues: [提交问题](https://github.com/esengine/ecs-framework/issues)
- GitHub Discussions: [参与讨论](https://github.com/esengine/ecs-framework/discussions)

### 联系维护者
如有紧急问题或私密问题，可以直接联系项目维护者。

---

再次感谢你的贡献！每一个贡献都让 ECS Framework 变得更好。