<script setup lang="ts">
import { ref, watch } from 'vue';
import StepLocation from './components/StepLocation.vue';
import StepCriteria from './components/StepCriteria.vue';
import StepResult from './components/StepResult.vue';
import TaiwanMap from './components/TaiwanMap.vue';
import AppHeader from './components/AppHeader.vue';
import { useGeoMeta } from './composables/useGeoMeta';
import { useFilterData } from './composables/useFilterData';
import { useResultTowns } from './composables/useResultTowns';
import type { TownThumb } from './composables/useTaiwanMap';
import seoMeta from './locales/meta.json';

// SEO meta（文案來自 locales/meta.json）
const config = useRuntimeConfig();
const APP_MODE = config.public.APP_MODE;
const ASSETS_PATH = config.public.APP_ASSETS_PATH;

useSeoMeta({
  title: seoMeta.metaTitle,
  description: seoMeta.metaDesc,
  ogTitle: seoMeta.metaTitle,
  ogDescription: seoMeta.metaXDesc,
  ogImage: `${ASSETS_PATH}/img/${seoMeta.metaImage}`,
  ogUrl: seoMeta.metaURL,
  twitterTitle: seoMeta.metaTitle,
  twitterDescription: seoMeta.metaXDesc,
  twitterCard: 'summary_large_image',
  keywords: seoMeta.metaKeywords,
  robots: APP_MODE === 'production' ? 'index, follow' : 'noindex, nofollow',
});

// Step state
const currentStep = ref<1 | 2 | 3>(1);

// Selection state
const selectedCountyCode = ref('');
const selectedTownCode = ref('');
const selectedFilters = ref<string[]>([]);

// Shared geo metadata（唯讀，供結果運算 / 地圖 / 各 Step 共用）
const { meta } = useGeoMeta();

// Data state: filter index + dataset cache
const { filterIndex, filterDataCache, preloadAllFilters } = useFilterData({
  selectedFilters,
});

// Result computation (explore-compare 3.4)
const { selectedResultCode, resultTowns } = useResultTowns({
  meta,
  filterIndex,
  filterDataCache,
  selectedTownCode,
  selectedFilters,
  currentStep,
});

// Map component handle（命令式相機操作）＋它產出的 step-2 縮圖
const mapRef = ref<InstanceType<typeof TaiwanMap> | null>(null);
const selectedTownThumb = ref<TownThumb | null>(null);

// Navigation

function goToStep(step: 1 | 2 | 3) {
  currentStep.value = step;
}

// User picked a result card → select it and fly the map to it.
// (Auto-defaulting the result sets the code without flying — see useResultTowns.)
function selectResult(code: string | null) {
  selectedResultCode.value = code;
  if (code) mapRef.value?.focusTown(code);
}

// Step-transition choreography: composables own layer/thumb/default updates;
// here we only sequence the per-step camera moves and filter preloading.
watch(currentStep, async (step) => {
  if (step === 2) {
    await preloadAllFilters();
    if (selectedCountyCode.value) mapRef.value?.flyToCounty(selectedCountyCode.value);
  } else if (step === 3) {
    mapRef.value?.flyToTaiwan();
  }
});
</script>

<template>
  <AppHeader />
  <div class="lc-mv">
    <!-- Map background (canvas + hover tooltip). Only shown on step 3;
         step 1/2 hide it via the canvas --hidden modifier inside the component. -->
    <TaiwanMap
      ref="mapRef"
      v-model:town-thumb="selectedTownThumb"
      :meta="meta"
      :current-step="currentStep"
      :selected-town-code="selectedTownCode"
      :selected-result-code="selectedResultCode"
      :result-towns="resultTowns"
    />

    <Transition name="fade" mode="out-in">
      <StepLocation
        v-if="currentStep === 1"
        :meta="meta"
        :county-code="selectedCountyCode"
        :town-code="selectedTownCode"
        @update:county-code="selectedCountyCode = $event"
        @update:town-code="selectedTownCode = $event"
        @next="goToStep(2)"
      />
      <StepCriteria
        v-else-if="currentStep === 2"
        :meta="meta"
        :filter-index="filterIndex"
        :selected-town-code="selectedTownCode"
        :filter-data-cache="filterDataCache"
        :selected-filters="selectedFilters"
        :selected-town-thumb="selectedTownThumb"
        @update:selected-filters="selectedFilters = $event"
        @next="goToStep(3)"
        @back="goToStep(1)"
      />
      <StepResult
        v-else-if="currentStep === 3"
        :meta="meta"
        :filter-index="filterIndex"
        :filter-data-cache="filterDataCache"
        :selected-town-code="selectedTownCode"
        :selected-filters="selectedFilters"
        :result-towns="resultTowns"
        :selected-result-code="selectedResultCode"
        @update:selected-result-code="selectResult($event)"
        @update:selected-filters="selectedFilters = $event"
        @back="goToStep(2)"
        @reselect="goToStep(1)"
        @zoom-in="mapRef?.zoomBy(1)"
        @zoom-out="mapRef?.zoomBy(-1)"
      />
    </Transition>
  </div>
</template>

<style scoped lang="scss">
// map-view
// __canvas element 樣式定義於 TaiwanMap.vue（canvas 由該元件渲染）
.lc-mv {
  position: fixed;
  inset: 0;
  background: var(--c-bg);
  overflow: hidden;
}

// Vue <Transition name="fade"> state classes (framework-generated, not BEM)
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<!-- Global (non-scoped): deck.gl v9 inserts a `.deck-widget-container` overlay
     above the canvas. Without the widget stylesheet it defaults to
     pointer-events: auto and swallows drag/zoom before they reach the canvas.
     Make it pass-through; real widgets re-enable their own events.
     Per-step touchability is still governed by the canvas `.lc-mv__canvas--hidden`
     toggle (pointer-events: none on step 1/2, auto on step 3), so this stays global. -->
<style>
.deck-widget-container {
  pointer-events: none;
}

.deck-widget-container > * {
  pointer-events: auto;
}
</style>
