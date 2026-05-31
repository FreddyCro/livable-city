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
  // hover 的 x/y 是相對「地圖 canvas 左上角」的座標，但本元素定位相對滿版的 .lc-mv。
  // canvas 以 inset:$header-h 0 0 $explore-sidebar-w 內縮，故補上同一組偏移對齊原點。
  margin-left: $explore-sidebar-w;
  margin-top: $header-h;
  pointer-events: none;
  padding: 6px 10px;
  background: rgb(var(--color-grey-0) / 0.95);
  border: 1px solid var(--c-border);
  border-radius: 4px;
  font-size: 13px;
  transform: translate(8px, 8px);
  box-shadow: 0 2px 6px rgb(var(--c-shadow) / 0.1);
  z-index: 20;

  // map-tooltip__county
  &__county {
    font-weight: 600;
  }

  // map-tooltip__district
  &__district {
    color: var(--c-text-muted);
    font-size: 12px;
  }
}
</style>
