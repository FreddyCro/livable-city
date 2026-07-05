<script setup lang="ts">
// 2.5c / 3.7 無結果視窗：外部 SVG（empty.svg，靜態）+ 標題 + 說明。
// 樣式集中於 LoadingOverlay.vue（non-scoped）。
import { useTemplateRef } from 'vue';
import str from '../../locales/explore.json';
import { useAssets } from '../../composables/useAssets';
import { useClickOutside } from '../../composables/useClickOutside';

const emit = defineEmits<{ close: [] }>();

const { img } = useAssets();

// 點視窗（.lc-lo__window）以外任何地方即關閉（dim 遮罩或背景地圖皆視為外部）。
const windowEl = useTemplateRef<HTMLElement>('windowEl');
useClickOutside(windowEl, () => emit('close'));
</script>

<template>
  <div ref="windowEl" class="lc-lo__window lc-lo__window--empty">
    <button type="button" class="lc-lo__close" aria-label="關閉" @click="$emit('close')">✕</button>
    <img class="lc-lo__empty-fig" :src="img('overlay/empty.svg')" alt="" />
    <p class="lc-lo__title">{{ str.emptyTitle }}</p>
    <p class="lc-lo__hint">{{ str.emptyHint }}</p>
  </div>
</template>
