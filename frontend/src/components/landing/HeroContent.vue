<template>
  <div class="hero-content">
    <h1 class="hero-title">{{ title }}</h1>
    <p class="hero-subtitle">{{ subtitle }}</p>
    <p class="hero-description">{{ description }}</p>
  </div>
</template>

<script>
export default {
  name: 'HeroContent',
  data() {
    return {
      title: 'NAVARO',
      subtitle: 'Where Humans Can\'t, Navaro Can',
      description: 'Navigate. Rescue. Repeat.\nAutonomous rescue vehicle designed for extreme terrain and hazardous environments. When every second counts, NAVARO delivers hope where humans cannot reach.',
      titleIndex: 0
    }
  },
  mounted() {
    this.typewriterEffect()
  },
  methods: {
    typewriterEffect() {
      const fullTitle = this.title
      this.title = ''

      const typeChar = () => {
        if (this.titleIndex < fullTitle.length) {
          this.title += fullTitle.charAt(this.titleIndex)
          this.titleIndex++
          setTimeout(typeChar, 150)
        }
      }

      setTimeout(typeChar, 500)
    }
  }
}
</script>

<style scoped>
.hero-title {
  font-family: 'Orbitron', monospace;
  font-weight: 900;
  font-size: 4rem;
  background: linear-gradient(45deg, var(--neon-cyan), var(--neon-pink));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
  animation: glitch 2s ease-in-out infinite alternate;
}

@keyframes glitch {
  0% { text-shadow: 2px 2px 0 var(--neon-pink), -2px -2px 0 var(--neon-cyan); }
  100% { text-shadow: -2px 2px 0 var(--neon-cyan), 2px -2px 0 var(--neon-pink); }
}

.hero-subtitle {
  font-size: 1.5rem;
  color: var(--neon-cyan);
  margin-bottom: 2rem;
  letter-spacing: 2px;
}

.hero-description {
  font-size: 1.2rem;
  color: var(--text-secondary);
  margin-bottom: 3rem;
  line-height: 1.8;
  white-space: pre-line;
}
</style>
