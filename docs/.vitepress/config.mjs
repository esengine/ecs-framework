/**
 * VitePress 配置文件 (ESM)
 * 
 * 此文件定义了整个文档站点的基础配置，包括：
 * - 站点元信息（标题、描述、基础路径等）
 * - 主题配置（导航菜单、侧边栏、页脚等）
 * - Markdown 扩展配置
 * - 构建和部署相关配置
 * 
 * @see https://vitepress.dev/reference/site-config
 */
import { defineConfig } from 'vitepress'

export default defineConfig({
  // === 基础站点配置 ===
  
  /** 站点标题，显示在浏览器标签页和页面标题中 */
  title: 'ECS Framework',
  
  /** 站点描述，用于 SEO 和社交媒体分享 */
  description: 'TypeScript ECS 框架 - 专为游戏开发设计的高性能实体组件系统',
  
  /** 站点语言，影响 HTML lang 属性 */
  lang: 'zh-CN',
  
  /** 
   * 基础路径配置
   * 如果部署在子路径下（如 GitHub Pages 项目页面），需要配置此项
   * 例如：'/ecs-framework/' 
   */
  base: '/',
  
  /** 是否清理 URL 中的 .html 后缀 */
  cleanUrls: true,
  
  /** 最后更新时间显示 */
  lastUpdated: true,
  
  /** 排除有问题的API文档文件 */
  srcExclude: [
    '**/api/**/*.md'
  ],
  
  /** 忽略死链接检查 */
  ignoreDeadLinks: true,
  
  // === Head 配置 ===
  head: [
    // 网站图标
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    
    // SEO 相关 meta 标签
    ['meta', { name: 'theme-color', content: '#646cff' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'zh_CN' }],
    ['meta', { name: 'og:site_name', content: 'ECS Framework' }],
    
    // 移动端适配
    ['meta', { name: 'viewport', content: 'width=device-width,initial-scale=1' }]
  ],
  
  // === 主题配置 ===
  themeConfig: {
    /** 站点标题，显示在导航栏左侧 */
    siteTitle: 'ECS Framework',
    
    /** Logo 配置 */
    logo: '/logo.svg',
    
    /** 
     * 导航栏配置
     * 定义网站主要导航结构
     */
    nav: [
      { 
        text: '指南', 
        link: '/guide/',
        activeMatch: '/guide/'
      },
      { 
        text: 'API 参考', 
        link: '/api/',
        activeMatch: '/api/'
      },
      { 
        text: '示例', 
        link: 'https://github.com/esengine/lawn-mower-demo'
      }
    ],
    
    /**
     * 侧边栏配置
     * 定义各个部分的详细导航结构
     */
    sidebar: {
      '/guide/': [
        {
          text: 'ECS Framework 文档',
          items: [
            { 
              text: '概述', 
              link: '/guide/01-overview',
              items: [
                { text: '架构概述', link: '/guide/01-01-architecture-overview' },
                { text: '快速开始', link: '/guide/01-02-getting-started' },
                { text: '包结构', link: '/guide/01-03-package-structure' }
              ]
            },
            { 
              text: '核心 ECS 框架', 
              link: '/guide/02-core-ecs-framework',
              items: [
                { text: '实体与实体管理', link: '/guide/02-01-entities-and-entity-management' },
                { text: '组件与存储', link: '/guide/02-02-components-and-storage' },
                { text: '系统与处理', link: '/guide/02-03-systems-and-processing' },
                { text: '场景与世界', link: '/guide/02-04-scenes-and-worlds' }
              ]
            },
            { 
              text: '高级特性', 
              link: '/guide/03-advanced-features',
              items: [
                { text: '查询系统与性能', link: '/guide/03-01-query-system-and-performance' },
                { text: '事件系统', link: '/guide/03-02-event-system' }
              ]
            },
            { 
              text: '平台集成', 
              link: '/guide/04-platform-integrations',
              items: [
                { text: 'Cocos Creator 集成', link: '/guide/04-01-cocos-creator-integration' },
                { 
                  text: 'AI 与行为系统', 
                  link: '/guide/04-02-ai-behavior-systems',
                  items: [
                    { 
                      text: '快速开始', 
                      link: '/guide/04-02-01-getting-started',
                      items: [
                        { text: 'BehaviorTreeBuilder', link: '/guide/04-02-01-01-behaviortreebuilder' },
                        { text: '复合节点', link: '/guide/04-02-01-02-composite-nodes' },
                        { text: '装饰器节点', link: '/guide/04-02-01-03-decorator-nodes' },
                        { text: '行动节点', link: '/guide/04-02-01-04-action-nodes' },
                        { text: '运行时执行', link: '/guide/04-02-01-05-runtime-execution' },
                        { text: '黑板系统', link: '/guide/04-02-01-06-blackboard-system' },
                        { text: '事件系统', link: '/guide/04-02-01-07-event-system' }
                      ]
                    },
                    { text: '行为树', link: '/guide/04-02-02-behavior-trees' },
                    { text: '效用 AI', link: '/guide/04-02-03-utility-ai' },
                    { text: '有限状态机', link: '/guide/04-02-04-finite-state-machine' },
                    { text: '性能与优化', link: '/guide/04-02-05-performance-optimization' }
                  ]
                },
                { 
                  text: 'MVVM UI 框架', 
                  link: '/guide/04-03-mvvm-ui-framework',
                  items: [
                    { text: '快速开始', link: '/guide/04-03-01-getting-started' },
                    { 
                      text: '核心 MVVM 组件', 
                      link: '/guide/04-03-02-core-mvvm-components',
                      items: [
                        { text: 'ViewModel 系统', link: '/guide/04-03-02-01-viewmodel-system' },
                        { text: '数据绑定', link: '/guide/04-03-02-02-data-binding' },
                        { text: '命令系统', link: '/guide/04-03-02-03-command-system' },
                        { text: '装饰器', link: '/guide/04-03-02-04-decorators' }
                      ]
                    },
                    { 
                      text: 'UI 管理系统', 
                      link: '/guide/04-03-03-ui-management-system',
                      items: [
                        { text: 'UIManager 核心', link: '/guide/04-03-03-01-uimanager-core' },
                        { text: 'UI 操作', link: '/guide/04-03-03-02-ui-operations' },
                        { text: 'UI 配置与层', link: '/guide/04-03-03-03-ui-configuration-layers' },
                        { text: '引擎集成', link: '/guide/04-03-03-04-engine-integration' }
                      ]
                    },
                    { 
                      text: '高级功能', 
                      link: '/guide/04-03-04-advanced-features',
                      items: [
                        { text: '类型安全', link: '/guide/04-03-04-01-type-safety' },
                        { text: '值转换器', link: '/guide/04-03-04-02-value-converters' },
                        { text: '自定义命令', link: '/guide/04-03-04-03-custom-commands' }
                      ]
                    },
                    { 
                      text: 'API 参考', 
                      link: '/guide/04-03-05-api-reference',
                      items: [
                        { text: 'Core APIs', link: '/guide/04-03-05-01-core-apis' },
                        { text: 'Data Binding APIs', link: '/guide/04-03-05-02-data-binding-apis' },
                        { text: 'UI Management APIs', link: '/guide/04-03-05-03-ui-management-apis' }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      '/api/': [],
      '/examples/': []
    },
    
    /** 
     * 页脚配置
     */
    footer: {
      message: '基于 MIT 许可证发布',
      copyright: 'Copyright © 2025 ESEngine Team'
    },
    
    /**
     * 社交链接配置
     */
    socialLinks: [
      { 
        icon: 'github', 
        link: 'https://github.com/esengine/ecs-framework' 
      }
    ],
    
    /**
     * 编辑链接配置
     * 允许用户直接编辑文档页面
     */
    editLink: {
      pattern: 'https://github.com/esengine/ecs-framework/edit/master/docs/:path',
      text: '在 GitHub 上编辑此页面'
    },
    
    /**
     * 搜索配置
     * 使用本地搜索功能
     */
    search: {
      provider: 'local',
      options: {
        locales: {
          zh: {
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档'
              },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: {
                  selectText: '选择',
                  navigateText: '切换'
                }
              }
            }
          }
        }
      }
    },
    
    /**
     * 文档页面配置
     */
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },
    
    /**
     * 大纲配置
     */
    outline: {
      label: '页面导航',
      level: [2, 3]
    },
    
    /**
     * 最后更新时间配置
     */
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    },
    
    /**
     * 返回顶部按钮
     */
    returnToTopLabel: '回到顶部',
    
    /**
     * 暗色模式开关
     */
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式'
  },
  
  // === Markdown 配置 ===
  markdown: {
    /** 代码行号显示 */
    lineNumbers: true,
    
    /** 代码块主题配置 */
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    }
  },
  
  // === 构建配置 ===
  
  /** 构建输出目录 */
  outDir: '.vitepress/dist',
  
  /** 缓存目录 */
  cacheDir: './.vitepress/cache',
  
  /** 
   * Vite 配置
   * 用于自定义构建过程
   */
  vite: {
    // 可以在这里添加自定义的 Vite 配置
    define: {
      __VUE_OPTIONS_API__: false
    }
  },
  
  /**
   * 站点地图生成
   */
  sitemap: {
    hostname: 'https://esengine.github.io/ecs-framework'
  }
})