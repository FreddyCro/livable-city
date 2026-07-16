<script setup lang="ts">
import { ref, watch } from 'vue';
import StepLocation from './components/01.location/StepLocation.vue';
import StepCriteria from './components/02.criteria/StepCriteria.vue';
import StepResult from './components/03.result/StepResult.vue';
import TaiwanMap from './components/TaiwanMap.vue';
import AppHeader from './components/AppHeader.vue';
import LoadingOverlay from './components/LoadingOverlay/LoadingOverlay.vue';
import OverlayPreview from './components/LoadingOverlay/OverlayPreview.vue'; // dev 預覽（?preview 才顯示）
import { useGeoMeta } from './composables/useGeoMeta';
import { useFilterData } from './composables/useFilterData';
import { useResultTowns } from './composables/useResultTowns';
import { usePopulation } from './composables/usePopulation';
import { useAssets } from './composables/useAssets';
import type { TownThumb } from './composables/useTaiwanMap';
import { MAP_CAMERA } from './utils/mapCamera';
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

// JSON-LD 結構化資料（由 nuxt-jsonld 模組提供 useJsonld）
useJsonld({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: seoMeta.metaTitle,
  description: seoMeta.metaDesc,
});

// Step state
const currentStep = ref<1 | 2 | 3>(1);

// 「重新選擇」回程時讓 step 1 直接開在縣市/鄉鎮選單（跳過封面首屏）。
// 首次進站為 false（維持封面）；restart() 後恆為 true。StepLocation 走 v-if 重掛，
// 於 setup 取此值當初始 revealed（之後仍可往上滑 collapse 回封面）。
const locateStartRevealed = ref(false);

// 步驟轉場方向：前進（1→2→3）由右往左 PUSH（300ms）；後退（restart 3→1）反向。
// watch flush 預設 'pre'（早於重繪），故切 step 時 transition name 會先於 <Transition> 更新。
const stepTransition = ref<'push-forward' | 'push-back'>('push-forward');
watch(currentStep, (to, from) => {
  stepTransition.value = to > from ? 'push-forward' : 'push-back';
});

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

// ── Loading / 轉場視窗（PRD §2.5 + 3.6/3.7）─────────────────
// 先驗證「出現時機」：結果為同步 computed，故以計時器模擬載入時長顯示視窗（動態本身之後再做）。
type Overlay = { variant: 'loading' | 'result-count' | 'empty'; dim: boolean };
const overlay = ref<Overlay | null>(null);
let overlayTimer: ReturnType<typeof setTimeout> | undefined;

const TRANSITION_MS = 900; // 2.5a 載入視窗顯示時長（criteria→result）
const RELOAD_MS = 600; // 3.6 explore-reloading 顯示時長（filter 切換）

// Step-transition choreography: composables own layer/thumb/default updates;
// here we only sequence the per-step camera moves and filter preloading.
watch(currentStep, async (step) => {
  if (step === 2) {
    await preloadAllFilters();
    // 延到 PUSH 轉場 + 進場 fade-up 起始後再飛鏡頭（step 2 地圖隱藏、看不到），
    // 避免 deck setProps 這類同步重活卡住轉場/進場動畫的頭幾幀。
    if (selectedCountyCode.value) {
      setTimeout(
        () => mapRef.value?.flyToCounty(selectedCountyCode.value),
        MAP_CAMERA.transitionDelay.ms,
      );
    }
  } else if (step === 3) {
    // 進入結果頁 zoom in 到結果清單第一筆（與 useResultTowns 預設選取一致）；無結果則回退全台視角。
    // 延到 PUSH 轉場（300ms）後再飛鏡頭：deck setProps 為同步重活，若在轉場起始執行會卡住 slide 的頭幾幀。
    // （2→3 期間有 loading 遮罩覆蓋約 900ms，延遲飛鏡頭使用者看不到，安全。）
    const first = resultTowns.value[0];
    setTimeout(() => {
      if (first) mapRef.value?.focusTown(first.code);
      else mapRef.value?.flyToTaiwan();
    }, MAP_CAMERA.transitionDelay.ms);
  }
});

// explore 內每次切換 filter：3.6 載入視窗（不刷暗）→ 0 筆則 3.7 無結果視窗，有結果則收起。
// 注意：restart() 會先清空 filters 再切回 step 1，watcher 為 flush 後執行，屆時 currentStep 已是 1，故自動略過。
watch(selectedFilters, () => {
  if (currentStep.value !== 3) return;
  overlay.value = { variant: 'loading', dim: false };
  clearTimeout(overlayTimer);
  overlayTimer = setTimeout(() => {
    overlay.value =
      resultTowns.value.length > 0 ? null : { variant: 'empty', dim: false };
  }, RELOAD_MS);
});

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
  locateStartRevealed.value = true; // 回程直接開選單、跳過封面（見宣告處說明）
  goToStep(1);
}

// User picked a result card → select it and fly the map to it.
// (Auto-defaulting the result sets the code without flying — see useResultTowns.)
function selectResult(code: string | null) {
  selectedResultCode.value = code;
  if (code) mapRef.value?.focusTown(code);
}

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
    overlay.value =
      resultTowns.value.length > 0
        ? { variant: 'result-count', dim: true }
        : { variant: 'empty', dim: true };
  }, TRANSITION_MS);
}
</script>

<template>
  <!-- dev 預覽：三個 overlay 狀態並排 -->
  <!-- <OverlayPreview /> -->

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

    <Transition :name="stepTransition">
      <StepLocation
        v-if="currentStep === 1"
        :meta="meta"
        :county-code="selectedCountyCode"
        :town-code="selectedTownCode"
        :start-revealed="locateStartRevealed"
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

// 步驟 PUSH 轉場（framework-generated classes, not BEM）：300ms、由右往左推入；restart 後退反向。
// 用 CSS animation（非 transition）驅動：動畫在 -active class 掛上（元件插入）當下即自走，
// 不依賴 Vue 以 rAF 移除 -enter-from，故不會被 step 切換的重繪（focusTown / 結果重算）卡住起始。
// step 根皆 position:fixed inset:0，translateX 100% 即整屏位移；fill both 避免起訖跳動。
.push-forward-enter-active {
  animation: lc-push-in 0.3s ease both;
}
.push-forward-leave-active {
  animation: lc-push-out 0.3s ease both;
}
.push-back-enter-active {
  animation: lc-push-in-rev 0.3s ease both;
}
.push-back-leave-active {
  animation: lc-push-out-rev 0.3s ease both;
}

// 前進：新頁自右進、舊頁往左出
@keyframes lc-push-in {
  from {
    transform: translateX(100%);
  }
}
@keyframes lc-push-out {
  to {
    transform: translateX(-100%);
  }
}

// 後退（restart）：新頁自左進、舊頁往右出
@keyframes lc-push-in-rev {
  from {
    transform: translateX(-100%);
  }
}
@keyframes lc-push-out-rev {
  to {
    transform: translateX(100%);
  }
}
</style>

<!-- Global (non-scoped): deck.gl v9 adds `.deck-widget-container` to the canvas's
     parent (.lc-mv). Keep it pass-through so map drags reach the canvas.
     ⚠️ 不要用 `> *` re-enable 全部子元素：.lc-sr / .lc-lo 也是 .lc-mv 的直接子元素
     （inset:0 蓋在地圖上），會被一起變成 pointer-events:auto → 吞掉地圖拖曳（手機無法拖曳的元兇）。
     canvas 在 TaiwanMap.vue 自行 `pointer-events:auto`；.lc-sr / .lc-lo 各自維持 none 並由內部面板 re-enable。 -->
<style>
.deck-widget-container {
  pointer-events: none;
}
</style>
