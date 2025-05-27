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
