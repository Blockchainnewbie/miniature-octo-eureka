<template>
  <!-- Hauptcontainer für den Hero-Inhalt -->
  <div class="hero-content">
    <!-- Hauptüberschrift, wird mit Schreibmaschinen-Effekt animiert -->
    <h1 class="hero-title">{{ title }}</h1>
    <!-- Untertitel des Hero-Bereichs -->
    <p class="hero-subtitle">{{ subtitle }}</p>
    <!-- Detaillierte Beschreibung oder Slogan -->
    <p class="hero-description">{{ description }}</p>
  </div>
</template>

<script>
/**
 * HeroContent Komponente
 * Stellt den Hauptinhalt des Hero-Bereichs auf der Landing Page dar.
 * Beinhaltet einen Titel mit Schreibmaschinen-Effekt, einen Untertitel und eine Beschreibung.
 */
export default {
  name: 'HeroContent',
  data() {
    return {
      /**
       * @property {string} title - Der Haupttitel, der animiert wird. Initial leer, wird durch den Schreibmaschinen-Effekt gefüllt.
       */
      title: 'NAVARO', // Der vollständige Titel, der getippt werden soll. Wird im mounted Hook initialisiert.
      /**
       * @property {string} subtitle - Der Untertitel des Hero-Bereichs.
       */
      subtitle: 'Where Humans Can\'t, Navaro Can',
      /**
       * @property {string} description - Eine längere Beschreibung oder ein Slogan für den Hero-Bereich.
       *                              \n wird für Zeilenumbrüche verwendet.
       */
      description: 'Navigate. Rescue. Repeat.\nAutonomous rescue vehicle designed for extreme terrain and hazardous environments. When every second counts, NAVARO delivers hope where humans cannot reach.',
      /**
       * @property {number} titleIndex - Aktueller Index für den Schreibmaschinen-Effekt des Titels.
       */
      titleIndex: 0,
      /**
       * @property {string} fullTitleForEffect - Speichert den ursprünglichen Titel für den Schreibmaschinen-Effekt.
       */
      fullTitleForEffect: 'NAVARO' // Der Text, der getippt werden soll.
    }
  },
  /**
   * Mounted Lifecycle Hook.
   * Wird aufgerufen, nachdem die Komponente in das DOM eingefügt wurde.
   * Startet hier den Schreibmaschinen-Effekt für den Titel.
   */
  mounted() {
    this.typewriterEffect();
  },
  methods: {
    /**
     * Implementiert einen Schreibmaschinen-Effekt für den Titel.
     * Der Titel wird Buchstabe für Buchstabe mit einer Verzögerung aufgebaut.
     */
    typewriterEffect() {
      // Den aktuellen Titel leeren, um ihn neu aufzubauen
      this.title = ''; 
      this.titleIndex = 0; // Index zurücksetzen

      /**
       * Interne Funktion, die rekursiv aufgerufen wird, um jeden Buchstaben zu tippen.
       */
      const typeChar = () => {
        // Prüfen, ob noch Buchstaben zum Tippen übrig sind
        if (this.titleIndex < this.fullTitleForEffect.length) {
          // Nächsten Buchstaben zum Titel hinzufügen
          this.title += this.fullTitleForEffect.charAt(this.titleIndex);
          this.titleIndex++;
          // Nächsten Aufruf mit Verzögerung planen
          setTimeout(typeChar, 150); // 150ms Verzögerung zwischen Buchstaben
        }
      };

      // Start des Schreibmaschinen-Effekts mit einer initialen Verzögerung
      setTimeout(typeChar, 500); // 500ms initiale Verzögerung
    }
  }
}
</script>

<style scoped>
/* Stil für die Hauptüberschrift im Hero-Bereich */
.hero-title {
  font-family: 'Orbitron', monospace; /* Futuristische Schriftart */
  font-weight: 900; /* Sehr fette Schrift */
  font-size: 4rem; /* Große Schriftgröße */
  /* Linearer Farbverlauf für den Text */
  background: linear-gradient(45deg, var(--neon-cyan), var(--neon-pink));
  -webkit-background-clip: text; /* Text als Maske für den Hintergrund verwenden (für Webkit-Browser) */
  -webkit-text-fill-color: transparent; /* Textfarbe transparent machen, damit Verlauf sichtbar wird */
  background-clip: text; /* Standard-Syntax für Text als Maske */
  margin-bottom: 1rem; /* Abstand nach unten */
  /* Glitch-Animation für einen dynamischen Effekt */
  animation: glitch 2s ease-in-out infinite alternate;
}

/* Keyframes für die Glitch-Animation des Titels */
@keyframes glitch {
  0% { 
    /* Textschatten-Effekt für den Glitch-Look */
    text-shadow: 2px 2px 0 var(--neon-pink), -2px -2px 0 var(--neon-cyan); 
  }
  100% { 
    /* Veränderter Textschatten für die Animation */
    text-shadow: -2px 2px 0 var(--neon-cyan), 2px -2px 0 var(--neon-pink); 
  }
}

/* Stil für den Untertitel im Hero-Bereich */
.hero-subtitle {
  font-size: 1.5rem; /* Mittlere Schriftgröße */
  color: var(--neon-cyan); /* Neon-Cyan Farbe */
  margin-bottom: 2rem; /* Abstand nach unten */
  letter-spacing: 2px; /* Erhöhter Buchstabenabstand */
}

/* Stil für die Beschreibung im Hero-Bereich */
.hero-description {
  font-size: 1.2rem; /* Etwas kleinere Schriftgröße */
  color: var(--text-secondary); /* Sekundäre Textfarbe */
  margin-bottom: 3rem; /* Größerer Abstand nach unten */
  line-height: 1.8; /* Erhöhter Zeilenabstand für bessere Lesbarkeit */
  white-space: pre-line; /* Erhält Zeilenumbrüche (\n) aus dem Text */
}
</style>
