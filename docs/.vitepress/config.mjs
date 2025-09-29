import { defineConfig } from 'vitepress'
import Icons from 'unplugin-icons/vite'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const corePackageJson = JSON.parse(
  readFileSync(join(__dirname, '../../packages/core/package.json'), 'utf-8')
)

export default defineConfig({
  vite: {
    plugins: [
      Icons({
        compiler: 'vue3',
        autoInstall: true
      })
    ],
    server: {
      fs: {
        allow: ['..']
      },
      middlewareMode: false,
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin'
      }
    }
  },
  title: 'ECS Framework',
  description: '高性能TypeScript ECS框架 - 为游戏开发而生',
  lang: 'zh-CN',

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '快速开始', link: '/guide/getting-started' },
      { text: '指南', link: '/guide/' },
      { text: 'API', link: '/api/README' },
      {
        text: '示例',
        items: [
          { text: 'Worker系统演示', link: '/examples/worker-system-demo' },
          { text: '割草机演示', link: 'https://github.com/esengine/lawn-mower-demo' }
        ]
      },
      {
        text: `v${corePackageJson.version}`,
        link: 'https://github.com/esengine/ecs-framework/releases'
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始使用',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '指南概览', link: '/guide/' }
          ]
        },
        {
          text: '核心概念',
          collapsed: false,
          items: [
            { text: '实体类 (Entity)', link: '/guide/entity' },
            { text: '组件系统 (Component)', link: '/guide/component' },
            {
              text: '系统架构 (System)',
              link: '/guide/system',
              items: [
                { text: 'Worker系统 (多线程)', link: '/guide/worker-system' }
              ]
            },
            { text: '场景管理 (Scene)', link: '/guide/scene' },
            { text: '事件系统 (Event)', link: '/guide/event-system' },
            { text: '时间和定时器 (Time)', link: '/guide/time-and-timers' },
            { text: '日志系统 (Logger)', link: '/guide/logging' }
          ]
        },
        {
          text: '平台适配器',
          link: '/guide/platform-adapter',
          collapsed: false,
          items: [
            { text: '浏览器适配器', link: '/guide/platform-adapter/browser' },
            { text: '微信小游戏适配器', link: '/guide/platform-adapter/wechat-minigame' },
            { text: 'Node.js适配器', link: '/guide/platform-adapter/nodejs' }
          ]
        }
      ],
      '/examples/': [
        {
          text: '示例',
          items: [
            { text: '示例概览', link: '/examples/' },
            { text: 'Worker系统演示', link: '/examples/worker-system-demo' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '概述', link: '/api/README' },
            {
              text: '核心类',
              collapsed: false,
              items: [
                { text: 'Core', link: '/api/classes/Core' },
                { text: 'Scene', link: '/api/classes/Scene' },
                { text: 'World', link: '/api/classes/World' },
                { text: 'Entity', link: '/api/classes/Entity' },
                { text: 'Component', link: '/api/classes/Component' },
                { text: 'EntitySystem', link: '/api/classes/EntitySystem' }
              ]
            },
            {
              text: '系统类',
              collapsed: true,
              items: [
                { text: 'PassiveSystem', link: '/api/classes/PassiveSystem' },
                { text: 'ProcessingSystem', link: '/api/classes/ProcessingSystem' },
                { text: 'IntervalSystem', link: '/api/classes/IntervalSystem' }
              ]
            },
            {
              text: '工具类',
              collapsed: true,
              items: [
                { text: 'Matcher', link: '/api/classes/Matcher' },
                { text: 'Time', link: '/api/classes/Time' },
                { text: 'PerformanceMonitor', link: '/api/classes/PerformanceMonitor' },
                { text: 'DebugManager', link: '/api/classes/DebugManager' }
              ]
            },
            {
              text: '接口',
              collapsed: true,
              items: [
                { text: 'IScene', link: '/api/interfaces/IScene' },
                { text: 'IComponent', link: '/api/interfaces/IComponent' },
                { text: 'ISystemBase', link: '/api/interfaces/ISystemBase' },
                { text: 'ICoreConfig', link: '/api/interfaces/ICoreConfig' }
              ]
            },
            {
              text: '装饰器',
              collapsed: true,
              items: [
                { text: '@ECSComponent', link: '/api/functions/ECSComponent' },
                { text: '@ECSSystem', link: '/api/functions/ECSSystem' }
              ]
            },
            {
              text: '枚举',
              collapsed: true,
              items: [
                { text: 'ECSEventType', link: '/api/enumerations/ECSEventType' },
                { text: 'LogLevel', link: '/api/enumerations/LogLevel' }
              ]
            }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/esengine/ecs-framework' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 ECS Framework'
    },

    editLink: {
      pattern: 'https://github.com/esengine/ecs-framework/edit/master/docs/:path',
      text: '在 GitHub 上编辑此页'
    },

    search: {
      provider: 'local'
    },

    outline: {
      level: [2, 3],
      label: '目录'
    }
  },

  head: [
    ['meta', { name: 'theme-color', content: '#646cff' }],
    ['link', { rel: 'icon', href: '/favicon.ico' }]
  ],

  base: '/ecs-framework/',
  cleanUrls: true,

  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    }
  }
})