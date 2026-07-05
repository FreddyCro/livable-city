<script setup lang="ts">
import { ref, watch } from 'vue';
import StepLocation from './components/01.location/StepLocation.vue';
import StepCriteria from './components/02.criteria/StepCriteria.vue';
import StepResult from './components/03.result/StepResult.vue';
import TaiwanMap from './components/TaiwanMap.vue';
import AppHeader from './components/AppHeader.vue';
import LoadingOverlay from './components/LoadingOverlay/LoadingOverlay.vue';
import { useGeoMeta } from './composables/useGeoMeta';
import { useFilterData } from './composables/useFilterData';
import { useResultTowns } from './composables/useResultTowns';
import { usePopulation } from './composables/usePopulation';
import { useAssets } from './composables/useAssets';
import type { TownThumb } from './composables/useTaiwanMap';
import seoMeta from './locales/meta.json';
import { useTracking } from '~/assets/js/tracking.js';

// SEO meta（文案來自 locales/meta.json）
const config = useRuntimeConfig();
const APP_MODE = config.public.APP_MODE;
const ASSETS_PATH = config.public.APP_ASSETS_PATH;
const { img } = useAssets();

useSeoMeta({
  title: seoMeta.metaTitle,
  description: seoMeta.metaDesc,
  ogTitle: seoMeta.metaTitle,
  ogDescription: seoMeta.metaXDesc,
  ogImage: img(seoMeta.metaImage),
  ogUrl: seoMeta.metaURL,
  twitterTitle: seoMeta.metaTitle,
  twitterDescription: seoMeta.metaXDesc,
  twitterCard: 'summary_large_image',
  keywords: seoMeta.metaKeywords,
  robots: APP_MODE === 'production' ? 'index, follow' : 'noindex, nofollow',
});

// UDN 追蹤碼（GTM / comScore / alexa / etu…），集中於 assets/js/tracking.js
useHead(useTracking());

// 第三方資源：UDN icons、nmd loading 動畫、protico
// useHead({
//   link: [
//     {
//       rel: 'stylesheet',
//       href: 'https://newmedia.udn.com.tw/cms_assets/icons_v4/icons.css',
//       tagPosition: 'bodyOpen',
//     },
//     {
//       rel: 'stylesheet',
//       href: `${ASSETS_PATH}/nmd-loading.css`,
//       tagPosition: 'bodyOpen',
//     },
//   ],
//   script: [
//     {
//       type: 'text/javascript',
//       src: `${ASSETS_PATH}/nmd-loading.min.js`,
//       tagPosition: 'bodyOpen',
//     },
//   ],
// });

// JSON-LD 結構化資料（由 nuxt-jsonld 模組提供 useJsonld）
useJsonld({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: seoMeta.metaTitle,
  description: seoMeta.metaDesc,
});

// Step state
const currentStep = ref<1 | 2 | 3>(1);

// Selection state
const selectedCountyCode = ref('');
const selectedTownCode = ref('');
const selectedFilters = ref<string[]>([]);

// Shared geo metadata（唯讀，供結果運算 / 地圖 / 各 Step 共用）
const { meta } = useGeoMeta();

// 各鄉鎮人口（供 step 3 比較卡標題顯示）
const { population } = usePopulation();

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

// 全域重置：清空所有使用者選取狀態，回到「全新開始」。
// selectedResultCode 本會在 town/filters 變動時由 useResultTowns 自動清空，
// 這裡仍顯式歸零，讓此函式不依賴該副作用、單獨呼叫也保證乾淨。
function resetSelections() {
  selectedCountyCode.value = '';
  selectedTownCode.value = '';
  selectedFilters.value = [];
  selectedResultCode.value = null;
  selectedTownThumb.value = null;
}

// 「重新選擇」：先重置再回到 step 1（重來一次）。
function restart() {
  closeOverlay(); // 關掉所有彈出視窗（載入 / 結果數 / 無結果）並取消待觸發計時器
  resetSelections();
  goToStep(1);
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
    // 進入結果頁直接 zoom in 到結果清單第一筆（與 useResultTowns 預設選取一致）；無結果則回退全台視角
    const first = resultTowns.value[0];
    if (first) mapRef.value?.focusTown(first.code);
    else mapRef.value?.flyToTaiwan();
  }
});

// ── Loading / 轉場視窗（wireflow §2.5 + 3.6/3.7）─────────────────
// 先驗證「出現時機」：結果為同步 computed，故以計時器模擬載入時長顯示視窗（動態本身之後再做）。
type Overlay = { variant: 'loading' | 'result-count' | 'empty'; dim: boolean };
const overlay = ref<Overlay | null>(null);
let overlayTimer: ReturnType<typeof setTimeout> | undefined;

const TRANSITION_MS = 900; // 2.5a 載入視窗顯示時長（criteria→result）
const RELOAD_MS = 600; // 3.6 explore-reloading 顯示時長（filter 切換）

// 關閉所有彈出視窗並取消待觸發的計時器（✕ 關閉、reset 皆共用）。
function closeOverlay() {
  clearTimeout(overlayTimer);
  overlay.value = null;
}

// criteria 點「查看你的理想居住地區」：2.5a 載入（刷暗）→ 依結果數切到 2.5b / 2.5c。
function enterResult() {
  overlay.value = { variant: 'loading', dim: true };
  goToStep(3);
  clearTimeout(overlayTimer);
  overlayTimer = setTimeout(() => {
    overlay.value = resultTowns.value.length > 0
      ? { variant: 'result-count', dim: true }
      : { variant: 'empty', dim: true };
  }, TRANSITION_MS);
}

// explore 內每次切換 filter：3.6 載入視窗（不刷暗）→ 0 筆則 3.7 無結果視窗，有結果則收起。
// 注意：restart() 會先清空 filters 再切回 step 1，watcher 為 flush 後執行，屆時 currentStep 已是 1，故自動略過。
watch(selectedFilters, () => {
  if (currentStep.value !== 3) return;
  overlay.value = { variant: 'loading', dim: false };
  clearTimeout(overlayTimer);
  overlayTimer = setTimeout(() => {
    overlay.value = resultTowns.value.length > 0 ? null : { variant: 'empty', dim: false };
  }, RELOAD_MS);
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
      @update:selected-result-code="selectResult($event)"
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
        @next="enterResult()"
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
        :population="population"
        @update:selected-result-code="selectResult($event)"
        @update:selected-filters="selectedFilters = $event"
        @back="goToStep(2)"
        @reselect="restart"
        @zoom-in="mapRef?.zoomBy(1)"
        @zoom-out="mapRef?.zoomBy(-1)"
      />
    </Transition>

    <!-- 轉場 / 載入視窗（2.5a/b/c 刷暗、3.6/3.7 浮卡不刷暗）；先驗證出現時機 -->
    <LoadingOverlay
      v-if="overlay"
      :variant="overlay.variant"
      :dim="overlay.dim"
      :count="resultTowns.length"
      @close="closeOverlay()"
    />
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
