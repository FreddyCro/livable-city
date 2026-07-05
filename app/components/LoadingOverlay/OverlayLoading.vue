<script setup lang="ts">
// 2.5a 載入視窗 / 3.6 explore-reloading：台灣輪廓（tw，靜態底圖）+ 放大鏡（enlarger，旋轉）。
// 動畫為自走式 CSS（套在 <img> 上），SVG 皆為外部檔，不進 JS bundle。樣式集中於 LoadingOverlay.vue（non-scoped）。
import str from '../../locales/explore.json';
import { useAssets } from '../../composables/useAssets';

const { img } = useAssets();
</script>

<template>
  <div class="lc-lo__window lc-lo__window--loading">
    <div class="lc-lo__loading-fig">
      <img class="lc-lo__tw" :src="img('overlay/tw.svg')" alt="" />
      <img class="lc-lo__enlarger" :src="img('overlay/enlarger.svg')" alt="" />
    </div>
    <p class="lc-lo__text">{{ str.loading }}</p>
  </div>
</template>
