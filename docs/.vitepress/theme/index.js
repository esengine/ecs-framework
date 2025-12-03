import DefaultTheme from 'vitepress/theme'
import ParticleHero from './components/ParticleHero.vue'
import ParticleHeroEn from './components/ParticleHeroEn.vue'
import FeatureCard from './components/FeatureCard.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ParticleHero', ParticleHero)
    app.component('ParticleHeroEn', ParticleHeroEn)
    app.component('FeatureCard', FeatureCard)
  }
}
