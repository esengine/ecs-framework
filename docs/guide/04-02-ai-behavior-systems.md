# AI 与行为系统

本文档涵盖了与 ECS 框架集成的人工智能和行为系统，包括行为树、效用 AI 和寻路解决方案。这些系统为游戏开发者提供了创建智能代理行为、决策系统和导航功能的复杂工具。

有关这些 AI 系统集成的核心 ECS 架构信息，请参见[核心概念](02-core-ecs-framework.md)。有关 Cocos Creator 特定集成的详细信息，请参见[Cocos Creator 集成](04-01-cocos-creator-integration.md)。

## 目的与架构

该库提供了一个统一的 AI 框架，针对 Laya、Cocos Creator 和 Egret 等游戏引擎，同时保持与通用 TypeScript 应用程序的兼容性。系统基于三种互补的 AI 范式构建，可以独立使用或组合使用。