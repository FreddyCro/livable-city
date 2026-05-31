<script setup lang="ts">
import type { HoverInfo } from '../composables/useTaiwanMap';

defineProps<{ info: HoverInfo }>();
</script>

<template>
  <!-- map-tooltip -->
  <div class="lc-mtt" :style="{ left: info.x + 'px', top: info.y + 'px' }">
    <div class="lc-mtt__county">{{ info.county }}</div>
    <div class="lc-mtt__district">{{ info.district }}</div>
  </div>
</template>

<style scoped lang="scss">
// map-tooltip
.lc-mtt {
  position: absolute;
  pointer-events: none;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 13px;
  transform: translate(8px, 8px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  z-index: 20;

  // map-tooltip__county
  &__county {
    font-weight: 600;
  }

  // map-tooltip__district
  &__district {
    color: #666;
    font-size: 12px;
  }
}
</style>
