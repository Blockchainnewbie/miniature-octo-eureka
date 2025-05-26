#!/bin/bash

# NAVARO Frontend Setup Script
# Erstellt die Ordnerstruktur und Placeholder-Dateien

echo "🚀 Setting up NAVARO Frontend Structure..."

# Create directory structure
mkdir -p frontend/src/views
mkdir -p frontend/src/components/landing
mkdir -p frontend/src/components/common
mkdir -p frontend/src/services
mkdir -p frontend/src/stores

echo "📁 Directories created"

# Create placeholder files with TODO comments
cat > frontend/src/components/landing/BackgroundEffects.vue << 'EOF'
<template>
  <div>
    <div class="bg-animation"></div>
    <div class="grid-overlay"></div>
  </div>
</template>

<script>
export default {
  name: 'BackgroundEffects'
}
</script>

<style scoped>
.bg-animation {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
    linear-gradient(45deg, transparent 30%, rgba(0, 255, 255, 0.05) 50%, transparent 70%),
    linear-gradient(-45deg, transparent 30%, rgba(255, 0, 255, 0.05) 50%, transparent 70%);
  background-size: 200% 200%;
  animation: bgMove 20s ease infinite;
  z-index: -2;
}

@keyframes bgMove {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.grid-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  z-index: -1;
  opacity: 0.3;
}
</style>
EOF

cat > frontend/src/components/landing/HeroContent.vue << 'EOF'
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
EOF

cat > frontend/src/components/landing/FeatureCards.vue << 'EOF'
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
EOF

cat > frontend/src/components/common/NavBar.vue << 'EOF'
<template>
  <nav class="navbar navbar-expand-lg navbar-dark">
    <div class="container">
      <a class="navbar-brand" href="#">NAVARO</a>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'NavBar'
}
</script>

<style scoped>
.navbar-brand {
  font-family: 'Orbitron', monospace;
  font-weight: 900;
  font-size: 2rem;
  color: var(--neon-cyan) !important;
  text-shadow:
    0 0 10px var(--neon-cyan),
    0 0 20px var(--neon-cyan),
    0 0 30px var(--neon-cyan);
  letter-spacing: 3px;
}
</style>
EOF

# Install dependencies
echo "📦 Installing dependencies..."
cd frontend
npm install bootstrap@5.3.0 @popperjs/core
npm install @fontsource/orbitron @fontsource/rajdhani
npm install axios pinia

echo "✅ NAVARO Frontend setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Copy the Vue components from Claude's artifacts to their respective folders"
echo "2. Update your router configuration"
echo "3. Update main.js with the imports"
echo "4. Run 'npm run dev' to start the development server"
