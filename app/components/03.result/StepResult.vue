<script setup lang="ts">
// 3 explore：探索結果頁的 orchestrator。
// 四個浮層區塊已抽為子元件（ExploreSidebar/ResultBar/Compare/Zoom，co-located 於 03.result）；
// 本元件僅保留 .lc-sr 容器、跨面板共享狀態與 click-outside 協調（見 StepResult.logic.ts）。
// 樣式（StepResult.scss）改為 non-scoped 共用：scoped 無法穿透子元件內部 DOM，
// 而 class 全在 lc-sr 命名空間下，無外洩風險（沿用 StepResult.global.scss 既有做法）。
import { useStepResult, type StepResultProps } from './StepResult.logic';

const props = defineProps<StepResultProps>();
const emit = defineEmits<{
  'update:selectedResultCode': [value: string | null];
  'update:selectedFilters': [value: string[]];
  // back: []; // 註解保留：back 按鈕目前停用，日後可一起復原
  reselect: [];
  'zoom-in': [];
  'zoom-out': [];
}>();

// view 邏輯抽至 co-located 的 StepResult.logic.ts（單一元件專用）。
// click-outside 需要的 sidebarEl / listEl / compareEl 三個 template ref
// 直接掛在對應子元件上，useClickOutside 會對元件實例取 $el（見 useClickOutside）。
const {
  compareState,
  cycleCompare,
  listOpen,
  asideOpen,
  isMobile,
  onAsideOpenChange,
  filterNameMap,
  allFilterIds,
  visibleFilterIds,
  homeCounty,
  homeName,
  detailTown,
  detailPopulation,
  hasPrev,
  hasNext,
  goBy,
  resultGroups,
  onFiltersChange,
  onResultSelect,
  pct,
  formatVal,
} = useStepResult(props, emit);
</script>

<template>
  <div class="lc-sr">
    <!-- 3.1 explore-sidebar -->
    <ExploreSidebar
      ref="sidebarEl"
      :filter-index="filterIndex"
      :selected-filters="selectedFilters"
      :is-mobile="isMobile"
      :aside-open="asideOpen"
      @filters-change="onFiltersChange"
      @aside-open-change="onAsideOpenChange"
      @reselect="$emit('reselect')"
    />

    <!-- 3.2 explore-result-bar -->
    <ExploreResultBar
      ref="listEl"
      v-model:list-open="listOpen"
      :result-towns="resultTowns"
      :result-groups="resultGroups"
      :selected-result-code="selectedResultCode"
      @result-select="onResultSelect"
    />

    <!-- 3.4 explore-compare（僅在選取結果地區時渲染） -->
    <ExploreCompare
      v-if="detailTown"
      ref="compareEl"
      :detail-town="detailTown"
      :detail-population="detailPopulation"
      :compare-state="compareState"
      :all-filter-ids="allFilterIds"
      :visible-filter-ids="visibleFilterIds"
      :filter-name-map="filterNameMap"
      :filter-data-cache="filterDataCache"
      :selected-result-code="selectedResultCode"
      :selected-town-code="selectedTownCode"
      :home-county="homeCounty"
      :home-name="homeName"
      :has-prev="hasPrev"
      :has-next="hasNext"
      :pct="pct"
      :format-val="formatVal"
      @go-by="goBy"
      @cycle-compare="cycleCompare"
    />

    <!-- 3.5 explore-zoom（含 3.8 info-dialog） -->
    <ExploreZoom @zoom-in="$emit('zoom-in')" @zoom-out="$emit('zoom-out')" />
  </div>
</template>

<style lang="scss" src="./StepResult.scss" />
<style lang="scss" src="./StepResult.global.scss" />
