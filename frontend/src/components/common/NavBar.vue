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
