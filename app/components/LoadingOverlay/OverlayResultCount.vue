<script setup lang="ts">
// 2.5b 符合條件視窗：折疊地圖（map，靜態底圖）+ 定位 pin（上下浮動）。count 為文字、非 SVG。
// 動畫為自走式 CSS，SVG 為外部檔。樣式集中於 LoadingOverlay.vue（non-scoped）。
import { useTemplateRef } from 'vue';
import str from '../../locales/explore.json';
import { useAssets } from '../../composables/useAssets';
import { useClickOutside } from '../../composables/useClickOutside';

defineProps<{ count?: number }>();
const emit = defineEmits<{ close: [] }>();

const { img } = useAssets();

// 點視窗（.lc-lo__window）以外任何地方即關閉（dim 遮罩或背景地圖皆視為外部）。
const windowEl = useTemplateRef<HTMLElement>('windowEl');
useClickOutside(windowEl, () => emit('close'));
</script>

<template>
  <div ref="windowEl" class="lc-lo__window lc-lo__window--result">
    <button type="button" class="lc-lo__close" aria-label="關閉" @click="$emit('close')">✕</button>
    <div class="lc-lo__result-fig">
      <img class="lc-lo__map" :src="img('overlay/map.svg')" alt="" />
      <img class="lc-lo__pin" :src="img('overlay/map-pin.svg')" alt="" />
    </div>
    <p class="lc-lo__text">
      {{ str.resultWindowPrefix }}<b>{{ count }}個</b>{{ str.resultWindowSuffix }}
    </p>
  </div>
</template>
