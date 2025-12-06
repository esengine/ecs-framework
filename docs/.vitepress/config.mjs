import { defineConfig } from 'vitepress'
import Icons from 'unplugin-icons/vite'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const corePackageJson = JSON.parse(
  readFileSync(join(__dirname, '../../packages/core/package.json'), 'utf-8')
)

// Import i18n messages
import en from './i18n/en.json' with { type: 'json' }
import zh from './i18n/zh.json' with { type: 'json' }

// 创建侧边栏配置 | Create sidebar config
// prefix: 路径前缀，如 '' 或 '/en' | Path prefix like '' or '/en'
function createSidebar(t, prefix = '') {
  return {
    [`${prefix}/guide/`]: [
      {
        text: t.sidebar.gettingStarted,
        items: [
          { text: t.sidebar.quickStart, link: `${prefix}/guide/getting-started` },
          { text: t.sidebar.guideOverview, link: `${prefix}/guide/` }
        ]
      },
      {
        text: t.sidebar.coreConcepts,
        collapsed: false,
        items: [
          { text: t.sidebar.entity, link: `${prefix}/guide/entity` },
          { text: t.sidebar.hierarchy, link: `${prefix}/guide/hierarchy` },
          { text: t.sidebar.component, link: `${prefix}/guide/component` },
          { text: t.sidebar.entityQuery, link: `${prefix}/guide/entity-query` },
          {
            text: t.sidebar.system,
            link: `${prefix}/guide/system`,
            items: [
              { text: t.sidebar.workerSystem, link: `${prefix}/guide/worker-system` }
            ]
          },
          {
            text: t.sidebar.scene,
            link: `${prefix}/guide/scene`,
            items: [
              { text: t.sidebar.sceneManager, link: `${prefix}/guide/scene-manager` },
              { text: t.sidebar.worldManager, link: `${prefix}/guide/world-manager` },
              { text: t.sidebar.persistentEntity, link: `${prefix}/guide/persistent-entity` }
            ]
          },
          {
            text: t.sidebar.behaviorTree,
            link: `${prefix}/guide/behavior-tree/`,
            items: [
              { text: t.sidebar.btGettingStarted, link: `${prefix}/guide/behavior-tree/getting-started` },
              { text: t.sidebar.btCoreConcepts, link: `${prefix}/guide/behavior-tree/core-concepts` },
              { text: t.sidebar.btEditorGuide, link: `${prefix}/guide/behavior-tree/editor-guide` },
              { text: t.sidebar.btEditorWorkflow, link: `${prefix}/guide/behavior-tree/editor-workflow` },
              { text: t.sidebar.btCustomActions, link: `${prefix}/guide/behavior-tree/custom-actions` },
              { text: t.sidebar.btCocosIntegration, link: `${prefix}/guide/behavior-tree/cocos-integration` },
              { text: t.sidebar.btLayaIntegration, link: `${prefix}/guide/behavior-tree/laya-integration` },
              { text: t.sidebar.btAdvancedUsage, link: `${prefix}/guide/behavior-tree/advanced-usage` },
              { text: t.sidebar.btBestPractices, link: `${prefix}/guide/behavior-tree/best-practices` }
            ]
          },
          { text: t.sidebar.serialization, link: `${prefix}/guide/serialization` },
          { text: t.sidebar.eventSystem, link: `${prefix}/guide/event-system` },
          { text: t.sidebar.timeAndTimers, link: `${prefix}/guide/time-and-timers` },
          { text: t.sidebar.logging, link: `${prefix}/guide/logging` }
        ]
      },
      {
        text: t.sidebar.advancedFeatures,
        collapsed: false,
        items: [
          { text: t.sidebar.serviceContainer, link: `${prefix}/guide/service-container` },
          { text: t.sidebar.pluginSystem, link: `${prefix}/guide/plugin-system` }
        ]
      },
      {
        text: t.sidebar.platformAdapters,
        link: `${prefix}/guide/platform-adapter`,
        collapsed: false,
        items: [
          { text: t.sidebar.browserAdapter, link: `${prefix}/guide/platform-adapter/browser` },
          { text: t.sidebar.wechatAdapter, link: `${prefix}/guide/platform-adapter/wechat-minigame` },
          { text: t.sidebar.nodejsAdapter, link: `${prefix}/guide/platform-adapter/nodejs` }
        ]
      }
    ],
    [`${prefix}/examples/`]: [
      {
        text: t.sidebar.examples,
        items: [
          { text: t.sidebar.examplesOverview, link: `${prefix}/examples/` },
          { text: t.nav.workerDemo, link: `${prefix}/examples/worker-system-demo` }
        ]
      }
    ],
    [`${prefix}/api/`]: [
      {
        text: t.sidebar.apiReference,
        items: [
          { text: t.sidebar.overview, link: `${prefix}/api/README` },
          {
            text: t.sidebar.coreClasses,
            collapsed: false,
            items: [
              { text: 'Core', link: `${prefix}/api/classes/Core` },
              { text: 'Scene', link: `${prefix}/api/classes/Scene` },
              { text: 'World', link: `${prefix}/api/classes/World` },
              { text: 'Entity', link: `${prefix}/api/classes/Entity` },
              { text: 'Component', link: `${prefix}/api/classes/Component` },
              { text: 'EntitySystem', link: `${prefix}/api/classes/EntitySystem` }
            ]
          },
          {
            text: t.sidebar.systemClasses,
            collapsed: true,
            items: [
              { text: 'PassiveSystem', link: `${prefix}/api/classes/PassiveSystem` },
              { text: 'ProcessingSystem', link: `${prefix}/api/classes/ProcessingSystem` },
              { text: 'IntervalSystem', link: `${prefix}/api/classes/IntervalSystem` }
            ]
          },
          {
            text: t.sidebar.utilities,
            collapsed: true,
            items: [
              { text: 'Matcher', link: `${prefix}/api/classes/Matcher` },
              { text: 'Time', link: `${prefix}/api/classes/Time` },
              { text: 'PerformanceMonitor', link: `${prefix}/api/classes/PerformanceMonitor` },
              { text: 'DebugManager', link: `${prefix}/api/classes/DebugManager` }
            ]
          },
          {
            text: t.sidebar.interfaces,
            collapsed: true,
            items: [
              { text: 'IScene', link: `${prefix}/api/interfaces/IScene` },
              { text: 'IComponent', link: `${prefix}/api/interfaces/IComponent` },
              { text: 'ISystemBase', link: `${prefix}/api/interfaces/ISystemBase` },
              { text: 'ICoreConfig', link: `${prefix}/api/interfaces/ICoreConfig` }
            ]
          },
          {
            text: t.sidebar.decorators,
            collapsed: true,
            items: [
              { text: '@ECSComponent', link: `${prefix}/api/functions/ECSComponent` },
              { text: '@ECSSystem', link: `${prefix}/api/functions/ECSSystem` }
            ]
          },
          {
            text: t.sidebar.enums,
            collapsed: true,
            items: [
              { text: 'ECSEventType', link: `${prefix}/api/enumerations/ECSEventType` },
              { text: 'LogLevel', link: `${prefix}/api/enumerations/LogLevel` }
            ]
          }
        ]
      }
    ]
  }
}

// 创建导航配置 | Create nav config
// prefix: 路径前缀，如 '' 或 '/en' | Path prefix like '' or '/en'
function createNav(t, prefix = '') {
  return [
    { text: t.nav.home, link: `${prefix}/` },
    { text: t.nav.quickStart, link: `${prefix}/guide/getting-started` },
    { text: t.nav.guide, link: `${prefix}/guide/` },
    { text: t.nav.api, link: `${prefix}/api/README` },
    {
      text: t.nav.examples,
      items: [
        { text: t.nav.workerDemo, link: `${prefix}/examples/worker-system-demo` },
        { text: t.nav.lawnMowerDemo, link: 'https://github.com/esengine/lawn-mower-demo' }
      ]
    },
    { text: t.nav.changelog, link: `${prefix}/changelog` },
    {
      text: `v${corePackageJson.version}`,
      link: 'https://github.com/esengine/ecs-framework/releases'
    }
  ]
}

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
  title: 'ESEngine',
  appearance: 'force-dark',

  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      description: '高性能 TypeScript ECS 框架 - 为游戏开发而生',
      themeConfig: {
        nav: createNav(zh, ''),
        sidebar: createSidebar(zh, ''),
        editLink: {
          pattern: 'https://github.com/esengine/ecs-framework/edit/master/docs/:path',
          text: zh.common.editOnGithub
        },
        outline: {
          level: [2, 3],
          label: zh.common.onThisPage
        }
      }
    },
    en: {
      label: 'English',
      lang: 'en',
      link: '/en/',
      description: 'High-performance TypeScript ECS Framework for Game Development',
      themeConfig: {
        nav: createNav(en, '/en'),
        sidebar: createSidebar(en, '/en'),
        editLink: {
          pattern: 'https://github.com/esengine/ecs-framework/edit/master/docs/:path',
          text: en.common.editOnGithub
        },
        outline: {
          level: [2, 3],
          label: en.common.onThisPage
        }
      }
    }
  },

  themeConfig: {
    siteTitle: 'ESEngine',

    socialLinks: [
      { icon: 'github', link: 'https://github.com/esengine/ecs-framework' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 ECS Framework'
    },

    search: {
      provider: 'local'
    }
  },

  head: [
    ['meta', { name: 'theme-color', content: '#646cff' }],
    ['link', { rel: 'icon', href: '/favicon.ico' }]
  ],

  base: '/',
  cleanUrls: true,
  ignoreDeadLinks: true,

  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    }
  }
})
