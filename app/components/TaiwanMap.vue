<script setup lang="ts">
import { ref, toRef, watch } from 'vue';
// import MapTooltip from './MapTooltip.vue'
import { useTaiwanMap, type TownThumb } from '../composables/useTaiwanMap';
import type { ResultTown } from '../composables/useResultTowns';
import type { GeoMeta } from '../types/geo';

const props = defineProps<{
  meta: GeoMeta | null;
  currentStep: 1 | 2 | 3;
  selectedTownCode: string;
  selectedResultCode: string | null;
  resultTowns: ResultTown[];
}>();

// Step-2 縮圖往上同步給父層（StepCriteria 使用）
const townThumb = defineModel<TownThumb | null>('townThumb', { default: null });

const canvasRef = ref<HTMLCanvasElement | null>(null);

const {
  hovered,
  selectedTownThumb,
  zoomBy,
  flyToCounty,
  flyToTaiwan,
  focusTown,
} = useTaiwanMap({
  canvasRef,
  meta: toRef(props, 'meta'),
  currentStep: toRef(props, 'currentStep'),
  selectedTownCode: toRef(props, 'selectedTownCode'),
  selectedResultCode: toRef(props, 'selectedResultCode'),
  resultTowns: toRef(props, 'resultTowns'),
});

watch(selectedTownThumb, (v) => {
  townThumb.value = v;
});

// 命令式相機操作，由父層在 step 轉場 / 選結果時呼叫
defineExpose({ zoomBy, flyToCounty, flyToTaiwan, focusTown });
</script>

<template>
  <!-- 多根 fragment：canvas 與 tooltip 直接掛在父層 .lc-mv 之下，維持原本 DOM/定位 -->
  <canvas
    ref="canvasRef"
    class="lc-mv__canvas"
    :class="{ 'lc-mv__canvas--hidden': currentStep !== 3 }"
  />
  <!-- <MapTooltip v-if="hovered && currentStep > 1" :info="hovered" /> -->
</template>

<style scoped lang="scss">
// map-view__canvas（block .lc-mv 定義於 app.vue 根容器）
// 只佔 header 下方、explore-sidebar 右側的剩餘空間（不再滿版）
.lc-mv__canvas {
  position: absolute;
  inset: $app-header-h 0 0 $explore-sidebar-w;
  display: block;
  background: var(--color-b02);
  transition: opacity 0.4s ease;

  // map-view__canvas--hidden
  &--hidden {
    opacity: 0;
    pointer-events: none;
  }
}
</style>
