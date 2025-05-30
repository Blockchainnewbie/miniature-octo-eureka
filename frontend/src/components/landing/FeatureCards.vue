<template>
  <!-- Container für die Feature-Karten, verwendet Bootstrap Grid-System -->
  <div class="row g-3 mt-4">
    <!-- Iteriert über das 'features'-Array und erstellt für jedes Feature eine Karte -->
    <div class="col-md-4" v-for="feature in features" :key="feature.id">
      <!-- Einzelne Feature-Karte -->
      <div class="feature-card">
        <!-- Icon des Features -->
        <div class="feature-icon">{{ feature.icon }}</div>
        <!-- Titel des Features -->
        <h3 class="feature-title">{{ feature.title }}</h3>
        <!-- Beschreibung des Features -->
        <p>{{ feature.description }}</p>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * FeatureCards Komponente
 * Zeigt eine Reihe von Karten an, die die Hauptmerkmale oder -funktionen des Produkts hervorheben.
 * Die Daten für die Features sind lokal in der Komponente definiert.
 */
export default {
  name: 'FeatureCards',
  data() {
    return {
      /**
       * @property {Array<Object>} features - Ein Array von Feature-Objekten.
       * @property {number} features[].id - Eindeutige ID für das Feature (für v-for key).
       * @property {string} features[].icon - Emoji oder Icon-Klasse für das Feature.
       * @property {string} features[].title - Titel des Features.
       * @property {string} features[].description - Kurze Beschreibung des Features.
       */
      features: [
        {
          id: 1,
          icon: '🛰️', // Satelliten-Emoji als Icon
          title: 'NAVIGATE',
          description: 'Advanced terrain mapping' // Fortschrittliche Geländekartierung
        },
        {
          id: 2,
          icon: '🚨', // Alarm-Emoji als Icon
          title: 'RESCUE',
          description: 'Locate & assist victims' // Opfer lokalisieren & unterstützen
        },
        {
          id: 3,
          icon: '🔄', // Wiederholungs-Emoji als Icon
          title: 'REPEAT',
          description: 'Continuous operations' // Kontinuierlicher Betrieb
        }
      ]
    }
  }
}
</script>

<style scoped>
/* Stil für jede einzelne Feature-Karte */
.feature-card {
  background: rgba(26, 26, 26, 0.6); /* Halbtransparenter dunkler Hintergrund */
  border: 1px solid var(--neon-cyan); /* Neon-Cyan Rand */
  border-radius: 10px; /* Abgerundete Ecken */
  padding: 2rem; /* Innenabstand */
  text-align: center; /* Text zentriert */
  transition: all 0.3s ease; /* Sanfte Übergänge für Hover-Effekte */
  height: 100%; /* Stellt sicher, dass alle Karten in einer Reihe die gleiche Höhe haben */
}

/* Hover-Effekt für die Feature-Karte */
.feature-card:hover {
  transform: translateY(-10px); /* Karte leicht nach oben bewegen */
  border-color: var(--neon-pink); /* Randfarbe zu Neon-Pink ändern */
  /* Box-Schatten für einen leuchtenden Effekt */
  box-shadow:
    0 10px 30px rgba(255, 0, 255, 0.3), /* Äußerer Schatten */
    inset 0 0 20px rgba(255, 0, 255, 0.1); /* Innerer Leuchteffekt */
}

/* Stil für das Feature-Icon */
.feature-icon {
  font-size: 3rem; /* Große Schriftgröße für das Icon */
  margin-bottom: 1rem; /* Abstand nach unten */
  color: var(--neon-cyan); /* Neon-Cyan Farbe für das Icon */
}

/* Stil für den Feature-Titel */
.feature-title {
  font-family: 'Orbitron', monospace; /* Futuristische Schriftart */
  font-weight: 700; /* Fette Schrift */
  font-size: 1.3rem; /* Mittlere Schriftgröße */
  color: var(--neon-pink); /* Neon-Pink Farbe für den Titel */
  margin-bottom: 1rem; /* Abstand nach unten */
}
</style>
