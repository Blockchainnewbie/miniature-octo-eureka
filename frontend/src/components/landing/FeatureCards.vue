<template>
  <div class="row g-3 mt-4">
    <div class="col-md-4" v-for="feature in features" :key="feature.id">
      <div class="feature-card">
        <div class="feature-icon">{{ feature.icon }}</div>
        <h3 class="feature-title">{{ feature.title }}</h3>
        <p>{{ feature.description }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FeatureCards',
  data() {
    return {
      features: [
        {
          id: 1,
          icon: '🛰️',
          title: 'NAVIGATE',
          description: 'Advanced terrain mapping'
        },
        {
          id: 2,
          icon: '🚨',
          title: 'RESCUE',
          description: 'Locate & assist victims'
        },
        {
          id: 3,
          icon: '🔄',
          title: 'REPEAT',
          description: 'Continuous operations'
        }
      ]
    }
  }
}
</script>

<style scoped>
.feature-card {
  background: rgba(26, 26, 26, 0.6);
  border: 1px solid var(--neon-cyan);
  border-radius: 10px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
  height: 100%;
}

.feature-card:hover {
  transform: translateY(-10px);
  border-color: var(--neon-pink);
  box-shadow:
    0 10px 30px rgba(255, 0, 255, 0.3),
    inset 0 0 20px rgba(255, 0, 255, 0.1);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--neon-cyan);
}

.feature-title {
  font-family: 'Orbitron', monospace;
  font-weight: 700;
  font-size: 1.3rem;
  color: var(--neon-pink);
  margin-bottom: 1rem;
}
</style>
