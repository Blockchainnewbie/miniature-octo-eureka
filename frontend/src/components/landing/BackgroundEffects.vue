<template>
  <!-- Container für die Hintergrundeffekte -->
  <div>
    <!-- Animierter Hintergrundverlauf -->
    <div class="bg-animation"></div>
    <!-- Statisches Gitter-Overlay -->
    <div class="grid-overlay"></div>
  </div>
</template>

<script>
/**
 * BackgroundEffects Komponente
 * Erzeugt visuelle Effekte für den Hintergrund der Landing Page.
 * Besteht aus einer CSS-basierten Hintergrundanimation und einem Gitter-Overlay.
 */
export default {
  name: 'BackgroundEffects'
  // Diese Komponente benötigt keine spezifische JavaScript-Logik,
  // da die Effekte rein über CSS realisiert werden.
}
</script>

<style scoped>
/* Stil für die Hintergrundanimation */
.bg-animation {
  position: fixed; /* Fixiert relativ zum Viewport */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* Mehrschichtiger linearer Verlauf für einen dynamischen Effekt */
  background:
    linear-gradient(45deg, transparent 30%, rgba(0, 255, 255, 0.05) 50%, transparent 70%), /* Cyan-Verlauf */
    linear-gradient(-45deg, transparent 30%, rgba(255, 0, 255, 0.05) 50%, transparent 70%); /* Pink-Verlauf */
  background-size: 200% 200%; /* Hintergrundgröße verdoppeln, um Bewegung zu ermöglichen */
  /* Endlosschleifen-Animation für die Hintergrundbewegung */
  animation: bgMove 20s ease infinite;
  z-index: -2; /* Stellt sicher, dass der Effekt hinter anderen Inhalten liegt */
}

/* Keyframes für die Hintergrundbewegung */
@keyframes bgMove {
  0%, 100% { background-position: 0% 50%; } /* Start- und Endposition */
  50% { background-position: 100% 50%; } /* Mittelposition der Animation */
}

/* Stil für das Gitter-Overlay */
.grid-overlay {
  position: fixed; /* Fixiert relativ zum Viewport */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* Erzeugt ein Gittermuster mit linearen Verläufen */
  background-image:
    linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), /* Horizontale Linien */
    linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px); /* Vertikale Linien */
  background-size: 50px 50px; /* Größe der Gitterzellen */
  z-index: -1; /* Liegt über der Hintergrundanimation, aber unter dem Hauptinhalt */
  opacity: 0.3; /* Leichte Transparenz für einen subtilen Effekt */
}
</style>
