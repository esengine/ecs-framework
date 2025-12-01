<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const canvasRef = ref(null)
let animationId = null
let particles = []
let animationStartTime = null
let glowStartTime = null

// ESEngine 粒子颜色 - VS Code 风格配色（与编辑器统一）
const colors = ['#569CD6', '#4EC9B0', '#9CDCFE', '#C586C0', '#DCDCAA']

class Particle {
  constructor(x, y, targetX, targetY) {
    this.x = x
    this.y = y
    this.targetX = targetX
    this.targetY = targetY
    this.size = Math.random() * 2 + 1.5
    this.alpha = Math.random() * 0.5 + 0.5
    this.color = colors[Math.floor(Math.random() * colors.length)]
  }
}

function createParticles(canvas, text, fontSize) {
  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')
  if (!tempCtx) return []

  tempCtx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`
  const textMetrics = tempCtx.measureText(text)
  const textWidth = textMetrics.width
  const textHeight = fontSize

  tempCanvas.width = textWidth + 40
  tempCanvas.height = textHeight + 40
  tempCtx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`
  tempCtx.textAlign = 'center'
  tempCtx.textBaseline = 'middle'
  tempCtx.fillStyle = '#ffffff'
  tempCtx.fillText(text, tempCanvas.width / 2, tempCanvas.height / 2)

  const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
  const pixels = imageData.data
  const newParticles = []
  const gap = 3

  const width = canvas.width / (window.devicePixelRatio || 1)
  const height = canvas.height / (window.devicePixelRatio || 1)
  const offsetX = (width - tempCanvas.width) / 2
  const offsetY = (height - tempCanvas.height) / 2

  for (let y = 0; y < tempCanvas.height; y += gap) {
    for (let x = 0; x < tempCanvas.width; x += gap) {
      const index = (y * tempCanvas.width + x) * 4
      const alpha = pixels[index + 3] || 0

      if (alpha > 128) {
        const angle = Math.random() * Math.PI * 2
        const distance = Math.random() * Math.max(width, height)

        newParticles.push(new Particle(
          width / 2 + Math.cos(angle) * distance,
          height / 2 + Math.sin(angle) * distance,
          offsetX + x,
          offsetY + y
        ))
      }
    }
  }

  return newParticles
}

function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4)
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

function animate(canvas, ctx) {
  const dpr = window.devicePixelRatio || 1
  const width = canvas.width / dpr
  const height = canvas.height / dpr

  const currentTime = performance.now()
  const duration = 2500
  const glowDuration = 600

  const elapsed = currentTime - animationStartTime
  const progress = Math.min(elapsed / duration, 1)
  const easedProgress = easeOutQuart(progress)

  // 透明背景
  ctx.clearRect(0, 0, width, height)

  // 计算发光进度
  let glowProgress = 0
  if (progress >= 1) {
    if (glowStartTime === null) {
      glowStartTime = currentTime
    }
    glowProgress = Math.min((currentTime - glowStartTime) / glowDuration, 1)
    glowProgress = easeOutCubic(glowProgress)
  }

  const text = 'ESEngine'
  const fontSize = Math.min(width / 4, height / 3, 80)
  const textY = height / 2

  for (const particle of particles) {
    const moveProgress = Math.min(easedProgress * 1.2, 1)
    const currentX = particle.x + (particle.targetX - particle.x) * moveProgress
    const currentY = particle.y + (particle.targetY - particle.y) * moveProgress

    ctx.beginPath()
    ctx.arc(currentX, currentY, particle.size, 0, Math.PI * 2)
    ctx.fillStyle = particle.color
    ctx.globalAlpha = particle.alpha * (1 - glowProgress * 0.3)
    ctx.fill()
  }

  ctx.globalAlpha = 1

  if (glowProgress > 0) {
    ctx.save()
    ctx.shadowColor = '#3b9eff'
    ctx.shadowBlur = 30 * glowProgress
    ctx.fillStyle = `rgba(255, 255, 255, ${glowProgress})`
    ctx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, width / 2, textY)
    ctx.restore()
  }

  if (glowProgress >= 1) {
    const breathe = 0.8 + Math.sin(currentTime / 1000) * 0.2
    ctx.save()
    ctx.shadowColor = '#3b9eff'
    ctx.shadowBlur = 20 * breathe
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, width / 2, textY)
    ctx.restore()
  }

  animationId = requestAnimationFrame(() => animate(canvas, ctx))
}

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const container = canvas.parentElement
  const width = container.offsetWidth
  const height = container.offsetHeight

  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  ctx.scale(dpr, dpr)

  const text = 'ESEngine'
  const fontSize = Math.min(width / 4, height / 3, 80)

  particles = createParticles(canvas, text, fontSize)
  animationStartTime = performance.now()
  glowStartTime = null

  if (animationId) {
    cancelAnimationFrame(animationId)
  }

  animate(canvas, ctx)
}

onMounted(() => {
  initCanvas()
  window.addEventListener('resize', initCanvas)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  window.removeEventListener('resize', initCanvas)
})
</script>

<template>
  <section class="hero-section">
    <div class="hero-container">
      <!-- 左侧文字区域 -->
      <div class="hero-text">
        <div class="hero-logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" stroke="#9147ff" stroke-width="2"/>
            <path d="M10 10h8v2h-6v3h5v2h-5v3h6v2h-8v-12z" fill="#9147ff"/>
          </svg>
          <span>ESENGINE</span>
        </div>
        <h1 class="hero-title">
          我们构建框架。<br/>
          而你将创造游戏。
        </h1>
        <p class="hero-description">
          ESEngine 是一个高性能的 TypeScript ECS 框架，为游戏开发者提供现代化的实体组件系统。
          无论是 2D 还是 3D 游戏，都能帮助你快速构建可扩展的游戏架构。
        </p>
        <div class="hero-actions">
          <a href="/guide/getting-started" class="btn-primary">开始使用</a>
          <a href="https://github.com/esengine/ecs-framework" class="btn-secondary" target="_blank">了解更多</a>
        </div>
      </div>

      <!-- 右侧粒子动画区域 -->
      <div class="hero-visual">
        <div class="visual-container">
          <canvas ref="canvasRef" class="particle-canvas"></canvas>
          <div class="visual-label">
            <span class="label-title">Entity Component System</span>
            <span class="label-subtitle">High Performance Framework</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-section {
  background: #0d0d0d;
  padding: 80px 0;
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
}

.hero-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 48px;
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 64px;
  align-items: center;
}

/* 左侧文字 */
.hero-text {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hero-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.2;
  margin: 0;
}

.hero-description {
  font-size: 1.125rem;
  color: #707070;
  line-height: 1.7;
  margin: 0;
  max-width: 480px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 28px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.9375rem;
  text-decoration: none;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #3b9eff;
  color: #ffffff;
  border: 1px solid #3b9eff;
  border-radius: 6px;
}

.btn-primary:hover {
  background: #5aadff;
  border-color: #5aadff;
}

.btn-secondary {
  background: #1a1a1a;
  color: #a0a0a0;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
}

.btn-secondary:hover {
  background: #252525;
  color: #ffffff;
}

.hero-visual {
  display: flex;
  justify-content: center;
}

.visual-container {
  position: relative;
  width: 100%;
  max-width: 600px;
  aspect-ratio: 4 / 3;
  background: linear-gradient(135deg, #1a2a3a 0%, #1a1a1a 50%, #0d0d0d 100%);
  border-radius: 12px;
  border: 1px solid #2a2a2a;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(59, 158, 255, 0.1);
}

.particle-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.visual-label {
  position: absolute;
  bottom: 24px;
  left: 24px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #ffffff;
}

.label-subtitle {
  font-size: 0.875rem;
  color: #737373;
}

/* 响应式 */
@media (max-width: 1024px) {
  .hero-container {
    grid-template-columns: 1fr;
    gap: 48px;
    padding: 0 24px;
  }

  .hero-section {
    padding: 48px 0;
    min-height: auto;
  }

  .hero-title {
    font-size: 2.25rem;
  }

  .hero-description {
    font-size: 1rem;
  }

  .visual-container {
    max-width: 100%;
    aspect-ratio: 16 / 9;
  }
}

@media (max-width: 640px) {
  .hero-title {
    font-size: 1.75rem;
  }

  .hero-actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }
}
</style>
