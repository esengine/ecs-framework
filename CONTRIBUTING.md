# 贡献指南 / Contributing Guide

感谢你对 ECS Framework 的关注！

Thank you for your interest in contributing to ECS Framework!

## Commit 规范 / Commit Convention

本项目使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### 格式 / Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型 / Types

- **feat**: 新功能 / New feature
- **fix**: 错误修复 / Bug fix
- **docs**: 文档变更 / Documentation changes
- **style**: 代码格式（不影响代码运行） / Code style changes
- **refactor**: 重构（既不是新功能也不是修复） / Code refactoring
- **perf**: 性能优化 / Performance improvements
- **test**: 测试相关 / Test changes
- **build**: 构建系统或依赖变更 / Build system changes
- **ci**: CI 配置变更 / CI configuration changes
- **chore**: 其他变更 / Other changes

### 范围 / Scope

- **core**: 核心包 @esengine/ecs-framework
- **math**: 数学库包
- **editor**: 编辑器
- **docs**: 文档

### 示例 / Examples

```bash
# 新功能
feat(core): add component pooling system

# 错误修复
fix(core): fix entity deletion memory leak

# 破坏性变更
feat(core): redesign system lifecycle

BREAKING CHANGE: System.initialize() now requires Scene parameter
```

## 自动发布 / Automatic Release

本项目使用 Semantic Release 自动发布。

This project uses Semantic Release for automatic publishing.

### 版本规则 / Versioning Rules

根据你的 commit 类型，版本号会自动更新：

Based on your commit type, the version will be automatically updated:

- `feat`: 增加 **minor** 版本 (0.x.0)
- `fix`, `perf`, `refactor`: 增加 **patch** 版本 (0.0.x)
- `BREAKING CHANGE`: 增加 **major** 版本 (x.0.0)

### 发布流程 / Release Process

1. 提交代码到 `master` 分支 / Push commits to `master` branch
2. GitHub Actions 自动运行测试 / GitHub Actions runs tests automatically
3. Semantic Release 分析 commits / Semantic Release analyzes commits
4. 自动更新版本号 / Version is automatically updated
5. 自动生成 CHANGELOG.md / CHANGELOG.md is automatically generated
6. 自动发布到 npm / Package is automatically published to npm
7. 自动创建 GitHub Release / GitHub Release is automatically created

## 开发流程 / Development Workflow

1. Fork 本仓库 / Fork this repository
2. 创建特性分支 / Create a feature branch
   ```bash
   git checkout -b feat/my-feature
   ```
3. 提交你的变更 / Commit your changes
   ```bash
   git commit -m "feat(core): add new feature"
   ```
4. 推送到你的 Fork / Push to your fork
   ```bash
   git push origin feat/my-feature
   ```
5. 创建 Pull Request / Create a Pull Request

## 本地测试 / Local Testing

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 构建
npm run build

# 代码检查
npm run lint

# 代码格式化
npm run format
```

## 问题反馈 / Issue Reporting

如果你发现了 bug 或有新功能建议，请[创建 Issue](https://github.com/esengine/esengine/issues/new)。

If you find a bug or have a feature request, please [create an issue](https://github.com/esengine/esengine/issues/new).

## 许可证 / License

通过贡献代码，你同意你的贡献将遵循 MIT 许可证。

By contributing, you agree that your contributions will be licensed under the MIT License.
