<template>
  <!-- Navigationsleiste mit Bootstrap-Klassen für Styling und Responsivität -->
  <nav class="navbar navbar-expand-lg navbar-dark">
    <!-- Container, um den Inhalt der Navbar zu zentrieren und zu begrenzen -->
    <div class="container">
      <!-- Markenname/Logo-Link -->
      <a class="navbar-brand" href="#">NAVARO</a>
      <!-- Hier könnte ein Navbar-Toggler für mobile Ansichten und weitere Nav-Items hinzugefügt werden -->
      <!-- Beispiel:
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
            <a class="nav-link active" aria-current="page" href="#">Home</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#">Features</a>
          </li>
        </ul>
      </div>
      -->
    </div>
  </nav>
</template>

<script>
/**
 * NavBar Komponente
 * Stellt eine einfache Navigationsleiste für die Anwendung dar.
 * Aktuell enthält sie nur den Markennamen.
 */
export default {
  name: 'NavBar'
  // Diese Komponente ist rein präsentationsorientiert und benötigt keine spezifische JavaScript-Logik.
}
</script>

<style scoped>
/* Styling für den Markennamen in der Navbar */
.navbar-brand {
  font-family: 'Orbitron', monospace; /* Futuristische Schriftart, passend zum Thema */
  font-weight: 900; /* Sehr fette Schrift für Hervorhebung */
  font-size: 2rem; /* Große Schriftgröße */
  color: var(--neon-cyan) !important; /* Neon-Cyan Farbe, !important um Bootstrap-Standard zu überschreiben */
  /* Textschatten-Effekt für einen leuchtenden Neon-Look */
  text-shadow:
    0 0 10px var(--neon-cyan),
    0 0 20px var(--neon-cyan),
    0 0 30px var(--neon-cyan);
  letter-spacing: 3px; /* Erhöhter Buchstabenabstand für stilistischen Effekt */
}

/* Allgemeine Navbar-Stile (könnten hier oder in einer globalen CSS-Datei sein) */
.navbar {
  /* Hintergrund und andere Stile könnten hier definiert werden,
     wenn sie nicht von übergeordneten Bootstrap-Klassen oder globalen Stilen kommen.
     z.B. background-color: var(--background-primary-dark); */
  padding-top: 1rem;
  padding-bottom: 1rem;
}
</style>
