<script setup lang="ts">
// 2.5b 符合條件視窗：折疊地圖（map，靜態底圖）+ 定位 pin（上下浮動）。count 為文字、非 SVG。
// 純呈現：關閉鈕（✕）與「點外部關閉」由外層 LoadingOverlay.vue 統一處理。
// 動畫為自走式 CSS，SVG 為外部檔。樣式集中於 LoadingOverlay.vue（non-scoped）。
import str from '../../locales/explore.json';
import { useAssets } from '../../composables/useAssets';

defineProps<{ count?: number }>();

const { img } = useAssets();
</script>

<template>
  <div class="lc-lo__window lc-lo__window--result">
    <div class="lc-lo__result-fig">
      <img class="lc-lo__map" :src="img('overlay/map.svg')" alt="" />
      <img class="lc-lo__pin" :src="img('overlay/map-pin.svg')" alt="" />
    </div>
    <p class="lc-lo__text">
      {{ str.resultWindowPrefix }}<b>{{ count }}個</b>{{ str.resultWindowSuffix }}
    </p>
  </div>
</template>
