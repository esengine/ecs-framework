---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "ECS Framework"
  text: "TypeScript 游戏开发框架"
  tagline: 高性能实体组件系统，专为现代游戏开发设计
  image:
    src: /logo.svg
    alt: ECS Framework
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/
    - theme: alt
      text: 查看示例
      link: /examples/
    - theme: alt
      text: GitHub
      link: https://github.com/esengine/ecs-framework

features:
  - icon: ⚡
    title: 高性能架构
    details: 采用 SoA 存储优化、Archetype 系统和脏标记技术，提供卓越的运行时性能
    
  - icon: 🛡️
    title: 类型安全
    details: 完整的 TypeScript 支持，强类型检查和代码提示，减少运行时错误
    
  - icon: 🔍
    title: 高效查询
    details: 流式 API 和智能缓存的查询系统，轻松筛选和操作游戏实体
    
  - icon: 🎮
    title: 多平台支持
    details: 支持 Cocos Creator、Laya Engine 和原生浏览器，一套代码多平台运行
    
  - icon: 🔧
    title: 调试工具
    details: 内置性能监控和 Cocos Creator 可视化调试插件，开发效率倍增
    
  - icon: 📦
    title: 模块化设计
    details: 灵活的架构设计，支持热插拔系统和组件，易于扩展和维护
---