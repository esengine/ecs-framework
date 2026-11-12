// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import vue from '@astrojs/vue';
import tailwindcss from '@tailwindcss/vite';
import rehypeRaw from 'rehype-raw';

export default defineConfig({
  site: 'https://esengine.cn',
  base: '/',
  markdown: {
    rehypePlugins: [rehypeRaw],
  },
  integrations: [
    starlight({
      title: 'ESEngine',
      logo: {
        src: './src/assets/logo.svg',
        replacesTitle: false,
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/esengine/ecs-framework' }
      ],
      defaultLocale: 'root',
      locales: {
        root: {
          label: '简体中文',
          lang: 'zh-CN',
        },
        en: {
          label: 'English',
          lang: 'en',
        },
      },
      sidebar: [
        {
          label: '快速开始',
          translations: { en: 'Getting Started' },
          items: [
            { label: '快速入门', slug: 'guide/getting-started', translations: { en: 'Quick Start' } },
            { label: '指南概览', slug: 'guide', translations: { en: 'Guide Overview' } },
          ],
        },
        {
          label: '核心概念',
          translations: { en: 'Core Concepts' },
          items: [
            {
              label: '实体',
              translations: { en: 'Entity' },
              items: [
                { label: '概述', slug: 'guide/entity', translations: { en: 'Overview' } },
                { label: '组件操作', slug: 'guide/entity/component-operations', translations: { en: 'Component Operations' } },
                { label: '实体句柄', slug: 'guide/entity/entity-handle', translations: { en: 'Entity Handle' } },
                { label: '生命周期', slug: 'guide/entity/lifecycle', translations: { en: 'Lifecycle' } },
              ],
            },
            { label: '层级结构', slug: 'guide/hierarchy', translations: { en: 'Hierarchy' } },
            {
              label: '组件',
              translations: { en: 'Component' },
              items: [
                { label: '概述', slug: 'guide/component', translations: { en: 'Overview' } },
                { label: '生命周期', slug: 'guide/component/lifecycle', translations: { en: 'Lifecycle' } },
                { label: 'EntityRef 装饰器', slug: 'guide/component/entity-ref', translations: { en: 'EntityRef' } },
                { label: '最佳实践', slug: 'guide/component/best-practices', translations: { en: 'Best Practices' } },
              ],
            },
            {
              label: '实体查询',
              translations: { en: 'Entity Query' },
              items: [
                { label: '概述', slug: 'guide/entity-query', translations: { en: 'Overview' } },
                { label: 'Matcher API', slug: 'guide/entity-query/matcher-api', translations: { en: 'Matcher API' } },
                { label: '编译查询', slug: 'guide/entity-query/compiled-query', translations: { en: 'Compiled Query' } },
                { label: '最佳实践', slug: 'guide/entity-query/best-practices', translations: { en: 'Best Practices' } },
              ],
            },
            {
              label: '系统',
              translations: { en: 'System' },
              items: [
                { label: '概述', slug: 'guide/system', translations: { en: 'Overview' } },
                { label: '系统类型', slug: 'guide/system/types', translations: { en: 'System Types' } },
                { label: '生命周期', slug: 'guide/system/lifecycle', translations: { en: 'Lifecycle' } },
                { label: '命令缓冲区', slug: 'guide/system/command-buffer', translations: { en: 'Command Buffer' } },
                { label: '系统调度', slug: 'guide/system/scheduling', translations: { en: 'Scheduling' } },
                { label: '变更检测', slug: 'guide/system/change-detection', translations: { en: 'Change Detection' } },
                { label: '最佳实践', slug: 'guide/system/best-practices', translations: { en: 'Best Practices' } },
              ],
            },
            {
              label: '场景',
              translations: { en: 'Scene' },
              items: [
                { label: '概述', slug: 'guide/scene', translations: { en: 'Overview' } },
                { label: '生命周期', slug: 'guide/scene/lifecycle', translations: { en: 'Lifecycle' } },
                { label: '实体管理', slug: 'guide/scene/entity-management', translations: { en: 'Entity Management' } },
                { label: '系统管理', slug: 'guide/scene/system-management', translations: { en: 'System Management' } },
                { label: '事件系统', slug: 'guide/scene/events', translations: { en: 'Events' } },
                { label: '调试与监控', slug: 'guide/scene/debugging', translations: { en: 'Debugging' } },
                { label: '最佳实践', slug: 'guide/scene/best-practices', translations: { en: 'Best Practices' } },
              ],
            },
            { label: '场景管理器', slug: 'guide/scene-manager', translations: { en: 'SceneManager' } },
            { label: '持久实体', slug: 'guide/persistent-entity', translations: { en: 'Persistent Entity' } },
            {
              label: '序列化',
              translations: { en: 'Serialization' },
              items: [
                { label: '概述', slug: 'guide/serialization', translations: { en: 'Overview' } },
                { label: '装饰器与继承', slug: 'guide/serialization/decorators', translations: { en: 'Decorators & Inheritance' } },
                { label: '增量序列化', slug: 'guide/serialization/incremental', translations: { en: 'Incremental' } },
                { label: '版本迁移', slug: 'guide/serialization/migration', translations: { en: 'Migration' } },
                { label: '使用场景', slug: 'guide/serialization/use-cases', translations: { en: 'Use Cases' } },
              ],
            },
            { label: '事件系统', slug: 'guide/event-system', translations: { en: 'Event System' } },
            { label: '时间与定时器', slug: 'guide/time-and-timers', translations: { en: 'Time & Timers' } },
            { label: '日志系统', slug: 'guide/logging', translations: { en: 'Logging' } },
          ],
        },
        {
          label: '高级功能',
          translations: { en: 'Advanced Features' },
          items: [
            {
              label: '服务容器',
              translations: { en: 'Service Container' },
              items: [
                { label: '概述', slug: 'guide/service-container', translations: { en: 'Overview' } },
                { label: '内置服务', slug: 'guide/service-container/built-in-services', translations: { en: 'Built-in Services' } },
                { label: '依赖注入', slug: 'guide/service-container/dependency-injection', translations: { en: 'Dependency Injection' } },
                { label: 'PluginServiceRegistry', slug: 'guide/service-container/plugin-service-registry', translations: { en: 'PluginServiceRegistry' } },
                { label: '高级用法', slug: 'guide/service-container/advanced', translations: { en: 'Advanced' } },
              ],
            },
            {
              label: '插件系统',
              translations: { en: 'Plugin System' },
              items: [
                { label: '概述', slug: 'guide/plugin-system', translations: { en: 'Overview' } },
                { label: '插件开发', slug: 'guide/plugin-system/development', translations: { en: 'Development' } },
                { label: '服务与系统', slug: 'guide/plugin-system/services-systems', translations: { en: 'Services & Systems' } },
                { label: '依赖管理', slug: 'guide/plugin-system/dependencies', translations: { en: 'Dependencies' } },
                { label: '插件管理', slug: 'guide/plugin-system/management', translations: { en: 'Management' } },
                { label: '示例插件', slug: 'guide/plugin-system/examples', translations: { en: 'Examples' } },
                { label: '最佳实践', slug: 'guide/plugin-system/best-practices', translations: { en: 'Best Practices' } },
              ],
            },
            // TODO: Worker 系统文档待补充 | Worker System docs to be added
            // {
            //   label: 'Worker 系统',
            //   translations: { en: 'Worker System' },
            //   items: [
            //     { label: '概述', slug: 'guide/worker-system', translations: { en: 'Overview' } },
            //   ],
            // },
          ],
        },
        {
          label: '平台适配器',
          translations: { en: 'Platform Adapters' },
          items: [
            { label: '概览', slug: 'guide/platform-adapter', translations: { en: 'Overview' } },
            { label: '浏览器', slug: 'guide/platform-adapter/browser', translations: { en: 'Browser' } },
            { label: '微信小游戏', slug: 'guide/platform-adapter/wechat-minigame', translations: { en: 'WeChat Mini Game' } },
            { label: 'Node.js', slug: 'guide/platform-adapter/nodejs', translations: { en: 'Node.js' } },
          ],
        },
        {
          label: '模块',
          translations: { en: 'Modules' },
          items: [
            { label: '模块总览', slug: 'modules', translations: { en: 'Modules Overview' } },
            {
              label: 'AI 模块',
              translations: { en: 'AI Modules' },
              collapsed: true,
              items: [
                {
                  label: '行为树',
                  translations: { en: 'Behavior Tree' },
                  items: [
                    { label: '概述', slug: 'modules/behavior-tree', translations: { en: 'Overview' } },
                    { label: '快速开始', slug: 'modules/behavior-tree/getting-started', translations: { en: 'Getting Started' } },
                    { label: '核心概念', slug: 'modules/behavior-tree/core-concepts', translations: { en: 'Core Concepts' } },
                    { label: '编辑器指南', slug: 'modules/behavior-tree/editor-guide', translations: { en: 'Editor Guide' } },
                    { label: '编辑器工作流', slug: 'modules/behavior-tree/editor-workflow', translations: { en: 'Editor Workflow' } },
                    { label: '资产管理', slug: 'modules/behavior-tree/asset-management', translations: { en: 'Asset Management' } },
                    { label: '自定义节点', slug: 'modules/behavior-tree/custom-actions', translations: { en: 'Custom Actions' } },
                    { label: '高级用法', slug: 'modules/behavior-tree/advanced-usage', translations: { en: 'Advanced Usage' } },
                    { label: '最佳实践', slug: 'modules/behavior-tree/best-practices', translations: { en: 'Best Practices' } },
                    { label: 'Cocos 集成', slug: 'modules/behavior-tree/cocos-integration', translations: { en: 'Cocos Integration' } },
                    { label: 'Laya 集成', slug: 'modules/behavior-tree/laya-integration', translations: { en: 'Laya Integration' } },
                    { label: 'Node.js 使用', slug: 'modules/behavior-tree/nodejs-usage', translations: { en: 'Node.js Usage' } },
                  ],
                },
                {
                  label: '状态机',
                  translations: { en: 'FSM' },
                  items: [
                    { label: '概述', slug: 'modules/fsm', translations: { en: 'Overview' } },
                    { label: 'API 参考', slug: 'modules/fsm/api', translations: { en: 'API Reference' } },
                    { label: '实际示例', slug: 'modules/fsm/examples', translations: { en: 'Examples' } },
                  ],
                },
              ],
            },
            {
              label: '游戏逻辑',
              translations: { en: 'Game Logic' },
              collapsed: true,
              items: [
                {
                  label: '定时器',
                  translations: { en: 'Timer' },
                  items: [
                    { label: '概述', slug: 'modules/timer', translations: { en: 'Overview' } },
                    { label: 'API 参考', slug: 'modules/timer/api', translations: { en: 'API Reference' } },
                    { label: '实际示例', slug: 'modules/timer/examples', translations: { en: 'Examples' } },
                    { label: '最佳实践', slug: 'modules/timer/best-practices', translations: { en: 'Best Practices' } },
                  ],
                },
                {
                  label: '空间索引',
                  translations: { en: 'Spatial' },
                  items: [
                    { label: '概述', slug: 'modules/spatial', translations: { en: 'Overview' } },
                    { label: '空间索引 API', slug: 'modules/spatial/spatial-index', translations: { en: 'Spatial Index API' } },
                    { label: 'AOI 兴趣区域', slug: 'modules/spatial/aoi', translations: { en: 'AOI' } },
                    { label: '实际示例', slug: 'modules/spatial/examples', translations: { en: 'Examples' } },
                    { label: '工具与优化', slug: 'modules/spatial/utilities', translations: { en: 'Utilities' } },
                  ],
                },
                {
                  label: '寻路',
                  translations: { en: 'Pathfinding' },
                  items: [
                    { label: '概述', slug: 'modules/pathfinding', translations: { en: 'Overview' } },
                    { label: '网格地图 API', slug: 'modules/pathfinding/grid-map', translations: { en: 'Grid Map API' } },
                    { label: '高级寻路算法', slug: 'modules/pathfinding/advanced-algorithms', translations: { en: 'Advanced Algorithms' } },
                    { label: '增量寻路', slug: 'modules/pathfinding/incremental', translations: { en: 'Incremental Pathfinding' } },
                    { label: '导航网格 API', slug: 'modules/pathfinding/navmesh', translations: { en: 'NavMesh API' } },
                    { label: '路径平滑', slug: 'modules/pathfinding/smoothing', translations: { en: 'Path Smoothing' } },
                    { label: '局部避让 (ORCA)', slug: 'modules/pathfinding/local-avoidance', translations: { en: 'Local Avoidance (ORCA)' } },
                    { label: '统一导航系统', slug: 'modules/pathfinding/navigation-system', translations: { en: 'Navigation System' } },
                    { label: '实际示例', slug: 'modules/pathfinding/examples', translations: { en: 'Examples' } },
                  ],
                },
              ],
            },
            {
              label: '工具模块',
              translations: { en: 'Tool Modules' },
              collapsed: true,
              items: [
                {
                  label: '蓝图',
                  translations: { en: 'Blueprint' },
                  items: [
                    { label: '概述', slug: 'modules/blueprint', translations: { en: 'Overview' } },
                    { label: '编辑器使用指南', slug: 'modules/blueprint/editor-guide', translations: { en: 'Editor Guide' } },
                    { label: 'Cocos Creator 编辑器', slug: 'modules/blueprint/cocos-editor', translations: { en: 'Cocos Creator Editor' } },
                    { label: '虚拟机 API', slug: 'modules/blueprint/vm', translations: { en: 'VM API' } },
                    { label: '自定义节点', slug: 'modules/blueprint/custom-nodes', translations: { en: 'Custom Nodes' } },
                    { label: '内置节点', slug: 'modules/blueprint/nodes', translations: { en: 'Built-in Nodes' } },
                    { label: '蓝图组合', slug: 'modules/blueprint/composition', translations: { en: 'Composition' } },
                    { label: '实际示例', slug: 'modules/blueprint/examples', translations: { en: 'Examples' } },
                  ],
                },
                {
                  label: '数学库',
                  translations: { en: 'Math' },
                  items: [
                    { label: '概述', slug: 'modules/math', translations: { en: 'Overview' } },
                    { label: '蓝图节点', slug: 'modules/math/blueprint-nodes', translations: { en: 'Blueprint Nodes' } },
                  ],
                },
                {
                  label: '程序生成',
                  translations: { en: 'Procgen' },
                  items: [
                    { label: '概述', slug: 'modules/procgen', translations: { en: 'Overview' } },
                    { label: '噪声函数', slug: 'modules/procgen/noise', translations: { en: 'Noise Functions' } },
                    { label: '种子随机数', slug: 'modules/procgen/random', translations: { en: 'Seeded Random' } },
                    { label: '采样工具', slug: 'modules/procgen/sampling', translations: { en: 'Sampling' } },
                    { label: '实际示例', slug: 'modules/procgen/examples', translations: { en: 'Examples' } },
                  ],
                },
                {
                  label: '世界流式加载',
                  translations: { en: 'World Streaming' },
                  items: [
                    { label: '概述', slug: 'modules/world-streaming', translations: { en: 'Overview' } },
                    { label: '区块管理', slug: 'modules/world-streaming/chunk-manager', translations: { en: 'Chunk Manager' } },
                    { label: '流式系统', slug: 'modules/world-streaming/streaming-system', translations: { en: 'Streaming System' } },
                    { label: '序列化', slug: 'modules/world-streaming/serialization', translations: { en: 'Serialization' } },
                    { label: '实际示例', slug: 'modules/world-streaming/examples', translations: { en: 'Examples' } },
                  ],
                },
              ],
            },
            {
              label: '网络模块',
              translations: { en: 'Network Modules' },
              collapsed: true,
              items: [
                {
                  label: 'RPC 通信',
                  translations: { en: 'RPC' },
                  items: [
                    { label: '概述', slug: 'modules/rpc', translations: { en: 'Overview' } },
                    { label: '服务端', slug: 'modules/rpc/server', translations: { en: 'Server' } },
                    { label: '客户端', slug: 'modules/rpc/client', translations: { en: 'Client' } },
                    { label: '编解码', slug: 'modules/rpc/codec', translations: { en: 'Codec' } },
                  ],
                },
                {
                  label: '网络同步',
                  translations: { en: 'Network' },
                  items: [
                    { label: '概述', slug: 'modules/network', translations: { en: 'Overview' } },
                    { label: '客户端', slug: 'modules/network/client', translations: { en: 'Client' } },
                    { label: '服务器', slug: 'modules/network/server', translations: { en: 'Server' } },
                    { label: 'HTTP 路由', slug: 'modules/network/http', translations: { en: 'HTTP Routing' } },
                    { label: '认证系统', slug: 'modules/network/auth', translations: { en: 'Authentication' } },
                    { label: '速率限制', slug: 'modules/network/rate-limit', translations: { en: 'Rate Limiting' } },
                    { label: '分布式房间', slug: 'modules/network/distributed', translations: { en: 'Distributed Rooms' } },
                    { label: '状态同步', slug: 'modules/network/sync', translations: { en: 'State Sync' } },
                    { label: '定点数同步', slug: 'modules/network/fixed-point', translations: { en: 'Fixed-Point Sync' } },
                    { label: '客户端预测', slug: 'modules/network/prediction', translations: { en: 'Prediction' } },
                    { label: 'AOI 兴趣区域', slug: 'modules/network/aoi', translations: { en: 'AOI' } },
                    { label: '增量压缩', slug: 'modules/network/delta', translations: { en: 'Delta Compression' } },
                    { label: 'API 参考', slug: 'modules/network/api', translations: { en: 'API Reference' } },
                  ],
                },
                {
                  label: '事务系统',
                  translations: { en: 'Transaction' },
                  items: [
                    { label: '概述', slug: 'modules/transaction', translations: { en: 'Overview' } },
                    { label: '核心概念', slug: 'modules/transaction/core', translations: { en: 'Core Concepts' } },
                    { label: '存储层', slug: 'modules/transaction/storage', translations: { en: 'Storage Layer' } },
                    { label: '操作', slug: 'modules/transaction/operations', translations: { en: 'Operations' } },
                    { label: '分布式事务', slug: 'modules/transaction/distributed', translations: { en: 'Distributed' } },
                  ],
                },
              ],
            },
            {
              label: '数据库模块',
              translations: { en: 'Database Modules' },
              collapsed: true,
              items: [
                {
                  label: '数据库',
                  translations: { en: 'Database' },
                  items: [
                    { label: '概述', slug: 'modules/database', translations: { en: 'Overview' } },
                    { label: '仓储模式', slug: 'modules/database/repository', translations: { en: 'Repository' } },
                    { label: '用户仓储', slug: 'modules/database/user', translations: { en: 'User Repository' } },
                    { label: '查询构建器', slug: 'modules/database/query', translations: { en: 'Query Builder' } },
                  ],
                },
                {
                  label: '数据库驱动',
                  translations: { en: 'Database Drivers' },
                  items: [
                    { label: '概述', slug: 'modules/database-drivers', translations: { en: 'Overview' } },
                    { label: 'MongoDB', slug: 'modules/database-drivers/mongo', translations: { en: 'MongoDB' } },
                    { label: 'Redis', slug: 'modules/database-drivers/redis', translations: { en: 'Redis' } },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: '示例',
          translations: { en: 'Examples' },
          items: [
            { label: '示例总览', slug: 'examples', translations: { en: 'Examples Overview' } },
            { label: '导航系统演示', slug: 'examples/navigation-system-demo', translations: { en: 'Navigation System Demo' } },
            // TODO: Worker 系统演示文档待补充
            // { label: 'Worker 系统演示', slug: 'examples/worker-system-demo', translations: { en: 'Worker System Demo' } },
            { label: '网络同步演示', slug: 'examples/network-sync-demo', translations: { en: 'Network Sync Demo' } },
          ],
        },
        {
          label: 'API 参考',
          translations: { en: 'API Reference' },
          autogenerate: { directory: 'api' },
        },
        {
          label: '更新日志',
          translations: { en: 'Changelog' },
          items: [
            { label: '@esengine/ecs-framework', link: 'https://github.com/esengine/ecs-framework/blob/master/packages/framework/core/CHANGELOG.md', attrs: { target: '_blank' } },
            { label: '@esengine/behavior-tree', link: 'https://github.com/esengine/ecs-framework/blob/master/packages/framework/behavior-tree/CHANGELOG.md', attrs: { target: '_blank' } },
            { label: '@esengine/fsm', link: 'https://github.com/esengine/ecs-framework/blob/master/packages/framework/fsm/CHANGELOG.md', attrs: { target: '_blank' } },
            { label: '@esengine/timer', link: 'https://github.com/esengine/ecs-framework/blob/master/packages/framework/timer/CHANGELOG.md', attrs: { target: '_blank' } },
            { label: '@esengine/network', link: 'https://github.com/esengine/ecs-framework/blob/master/packages/framework/network/CHANGELOG.md', attrs: { target: '_blank' } },
            { label: '@esengine/transaction', link: 'https://github.com/esengine/ecs-framework/blob/master/packages/framework/transaction/CHANGELOG.md', attrs: { target: '_blank' } },
            { label: '@esengine/rpc', link: 'https://github.com/esengine/ecs-framework/blob/master/packages/framework/rpc/CHANGELOG.md', attrs: { target: '_blank' } },
            { label: '@esengine/cli', link: 'https://github.com/esengine/ecs-framework/blob/master/packages/tools/cli/CHANGELOG.md', attrs: { target: '_blank' } },
          ],
        },
      ],
      customCss: ['./src/styles/custom.css'],
      head: [
        { tag: 'meta', attrs: { name: 'theme-color', content: '#646cff' } },
      ],
      components: {
        Head: './src/components/Head.astro',
        ThemeSelect: './src/components/ThemeSelect.astro',
        Footer: './src/components/Footer.astro',
      },
    }),
    vue(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
