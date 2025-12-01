<script setup>
defineProps({
  title: String,
  description: String,
  icon: String,
  link: String,
  image: String
})
</script>

<template>
  <a :href="link" class="feature-card">
    <div class="card-image" v-if="image">
      <img :src="image" :alt="title" />
    </div>
    <div class="card-body">
      <div class="card-icon" v-if="icon && !image">{{ icon }}</div>
      <h3 class="card-title">{{ title }}</h3>
      <p class="card-description">{{ description }}</p>
    </div>
  </a>
</template>

<style scoped>
.feature-card {
  display: flex;
  flex-direction: column;
  background: var(--es-bg-elevated, #252526);
  border: 1px solid var(--es-border-default, #3e3e42);
  border-radius: 4px;
  overflow: hidden;
  text-decoration: none;
  transition: all 0.15s ease;
}

.feature-card:hover {
  border-color: var(--es-primary, #007acc);
  background: var(--es-bg-overlay, #2d2d2d);
}

.card-image {
  width: 100%;
  height: 160px;
  overflow: hidden;
  background: linear-gradient(135deg, #1e3a5f 0%, #1e1e1e 100%);
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.feature-card:hover .card-image img {
  transform: scale(1.05);
}

.card-body {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-icon {
  font-size: 1.5rem;
  margin-bottom: 12px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--es-bg-input, #3c3c3c);
  border-radius: 4px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--es-text-inverse, #ffffff);
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.card-description {
  font-size: 12px;
  color: var(--es-text-secondary, #9d9d9d);
  margin: 0;
  line-height: 1.6;
  flex: 1;
}
</style>
