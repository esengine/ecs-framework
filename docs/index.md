---
layout: page
title: ESEngine - 高性能 TypeScript ECS 框架
---

<ParticleHero />

<section class="news-section">
  <div class="news-container">
    <div class="news-header">
      <h2 class="news-title">快速入口</h2>
      <a href="/guide/" class="news-more">查看文档</a>
    </div>
    <div class="news-grid">
      <a href="/guide/getting-started" class="news-card">
        <div class="news-card-image" style="background: linear-gradient(135deg, #1e3a5f 0%, #1e1e1e 100%);">
          <div class="news-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"><path fill="#4fc1ff" d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9zm6.82 6L12 12.72L5.18 9L12 5.28zM17 16l-5 2.72L7 16v-3.73L12 15l5-2.73z"/></svg>
          </div>
          <span class="news-badge">快速开始</span>
        </div>
        <div class="news-card-content">
          <h3>5 分钟上手 ESEngine</h3>
          <p>从安装到创建第一个 ECS 应用，快速了解核心概念。</p>
        </div>
      </a>
      <a href="/guide/behavior-tree/" class="news-card">
        <div class="news-card-image" style="background: linear-gradient(135deg, #1e3a5f 0%, #1e1e1e 100%);">
          <div class="news-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"><path fill="#4ec9b0" d="M12 2a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2m3 20h-1v-7l-2-2l-2 2v7H9v-7.5l-2 2V22H6v-6l3-3l1-3.5c-.3.4-.6.7-1 1L6 9v1H4V8l5-3c.5-.3 1.1-.5 1.7-.5H11c.6 0 1.2.2 1.7.5l5 3v2h-2V9l-3 1.5c-.4-.3-.7-.6-1-1l1 3.5l3 3v6Z"/></svg>
          </div>
          <span class="news-badge">AI 系统</span>
        </div>
        <div class="news-card-content">
          <h3>行为树可视化编辑器</h3>
          <p>内置 AI 行为树系统，支持可视化编辑和实时调试。</p>
        </div>
      </a>
    </div>
  </div>
</section>

<section class="features-section">
  <div class="features-container">
    <h2 class="features-title">核心特性</h2>
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#4fc1ff" d="M13 2.05v2.02c3.95.49 7 3.85 7 7.93c0 1.45-.39 2.79-1.06 3.95l1.59 1.09A9.94 9.94 0 0 0 22 12c0-5.18-3.95-9.45-9-9.95M12 19c-3.87 0-7-3.13-7-7c0-3.53 2.61-6.43 6-6.92V2.05c-5.06.5-9 4.76-9 9.95c0 5.52 4.47 10 9.99 10c3.31 0 6.24-1.61 8.06-4.09l-1.6-1.1A7.93 7.93 0 0 1 12 19"/><path fill="#4fc1ff" d="M12 6a6 6 0 0 0-6 6c0 3.31 2.69 6 6 6a6 6 0 0 0 0-12m0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4s4 1.79 4 4s-1.79 4-4 4"/></svg>
        </div>
        <h3 class="feature-title">高性能 ECS 架构</h3>
        <p class="feature-desc">基于数据驱动的实体组件系统，支持大规模实体处理，缓存友好的内存布局。</p>
        <a href="/guide/entity" class="feature-link">了解更多 →</a>
      </div>
      <div class="feature-card">
        <div class="feature-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#569cd6" d="M3 3h18v18H3zm16.525 13.707c0-.795-.272-1.425-.816-1.89c-.544-.465-1.404-.804-2.58-1.016l-1.704-.296c-.616-.104-1.052-.26-1.308-.468c-.256-.21-.384-.468-.384-.776c0-.392.168-.7.504-.924c.336-.224.8-.336 1.392-.336c.56 0 1.008.124 1.344.372c.336.248.536.584.6 1.008h2.016c-.08-.96-.464-1.716-1.152-2.268c-.688-.552-1.6-.828-2.736-.828c-1.2 0-2.148.3-2.844.9c-.696.6-1.044 1.38-1.044 2.34c0 .76.252 1.368.756 1.824c.504.456 1.308.792 2.412.996l1.704.312c.624.12 1.068.28 1.332.48c.264.2.396.46.396.78c0 .424-.192.756-.576.996c-.384.24-.9.36-1.548.36c-.672 0-1.2-.14-1.584-.42c-.384-.28-.608-.668-.672-1.164H8.868c.048 1.016.46 1.808 1.236 2.376c.776.568 1.796.852 3.06.852c1.24 0 2.22-.292 2.94-.876c.72-.584 1.08-1.364 1.08-2.34z"/></svg>
        </div>
        <h3 class="feature-title">完整类型支持</h3>
        <p class="feature-desc">100% TypeScript 编写，完整的类型定义和编译时检查，提供最佳的开发体验。</p>
        <a href="/guide/component" class="feature-link">了解更多 →</a>
      </div>
      <div class="feature-card">
        <div class="feature-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#4ec9b0" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8m-5-8l4-4v3h4v2h-4v3z"/></svg>
        </div>
        <h3 class="feature-title">可视化行为树</h3>
        <p class="feature-desc">内置 AI 行为树系统，提供可视化编辑器，支持自定义节点和实时调试。</p>
        <a href="/guide/behavior-tree/" class="feature-link">了解更多 →</a>
      </div>
      <div class="feature-card">
        <div class="feature-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#c586c0" d="M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4zm19 2h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1m-1 9h-4v-7h4z"/></svg>
        </div>
        <h3 class="feature-title">多平台支持</h3>
        <p class="feature-desc">支持浏览器、Node.js、微信小游戏等多平台，可与主流游戏引擎无缝集成。</p>
        <a href="/guide/platform-adapter" class="feature-link">了解更多 →</a>
      </div>
      <div class="feature-card">
        <div class="feature-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#dcdcaa" d="M4 3h6v2H4v14h6v2H4c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2m9 0h6c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2h-6v-2h6V5h-6zm-1 7h4v2h-4z"/></svg>
        </div>
        <h3 class="feature-title">模块化设计</h3>
        <p class="feature-desc">核心功能独立打包，按需引入。支持自定义插件扩展，灵活适配不同项目。</p>
        <a href="/guide/plugin-system" class="feature-link">了解更多 →</a>
      </div>
      <div class="feature-card">
        <div class="feature-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#9cdcfe" d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9c-2-2-5-2.4-7.4-1.3L9 6L6 9L1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4"/></svg>
        </div>
        <h3 class="feature-title">开发者工具</h3>
        <p class="feature-desc">内置性能监控、调试工具、序列化系统等，提供完整的开发工具链。</p>
        <a href="/guide/logging" class="feature-link">了解更多 →</a>
      </div>
    </div>
  </div>
</section>

<style>
/* 隐藏 VitePress 默认样式 */
.VPDoc {
  padding: 0 !important;
}

.vp-doc {
  padding: 0 !important;
}

.VPContent {
  padding: 0 !important;
}

.news-section {
  background: #0d0d0d;
  padding: 64px 0;
  border-top: 1px solid #2a2a2a;
}

.news-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 48px;
}

.news-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.news-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}

.news-more {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  color: #a0a0a0;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
}

.news-more:hover {
  background: #252525;
  color: #ffffff;
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.news-card {
  display: flex;
  background: #1f1f1f;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  overflow: hidden;
  text-decoration: none;
  transition: all 0.2s;
}

.news-card:hover {
  border-color: #3b9eff;
}

.news-card-image {
  width: 200px;
  min-height: 140px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  gap: 12px;
}

.news-icon {
  opacity: 0.9;
}

.news-badge {
  display: inline-block;
  padding: 4px 12px;
  background: transparent;
  border: 1px solid #3a3a3a;
  border-radius: 16px;
  color: #a0a0a0;
  font-size: 0.75rem;
  font-weight: 500;
}

.news-card-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.news-card-content h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 8px 0;
}

.news-card-content p {
  font-size: 0.875rem;
  color: #707070;
  margin: 0;
  line-height: 1.6;
}

.features-section {
  background: #0d0d0d;
  padding: 64px 0;
}

.features-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 48px;
}

.features-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 32px 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.feature-card {
  background: #1f1f1f;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  padding: 24px;
  transition: all 0.15s ease;
}

.feature-card:hover {
  border-color: #3b9eff;
  background: #252525;
}

.feature-icon {
  width: 48px;
  height: 48px;
  background: #0d0d0d;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.feature-title {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 8px 0;
}

.feature-desc {
  font-size: 14px;
  color: #707070;
  line-height: 1.7;
  margin: 0 0 16px 0;
}

.feature-link {
  font-size: 14px;
  color: #3b9eff;
  text-decoration: none;
  font-weight: 500;
}

.feature-link:hover {
  text-decoration: underline;
}

@media (max-width: 1024px) {
  .news-container,
  .features-container {
    padding: 0 24px;
  }

  .news-grid {
    grid-template-columns: 1fr;
  }

  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .news-card {
    flex-direction: column;
  }

  .news-card-image {
    width: 100%;
    min-height: 120px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>
