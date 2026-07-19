<script setup lang="ts">
import { ref } from 'vue';
import str from '../../locales/criteria.json';
import type { FilterMeta } from '../../types/filter';
import { useAssets } from '../../composables/useAssets';
import {
  useStepCriteria,
  MAX_SELECT,
  type StepCriteriaProps,
} from './StepCriteria.logic';

const props = defineProps<StepCriteriaProps>();
const emit = defineEmits<{
  'update:selectedFilters': [value: string[]];
  next: [];
}>();

// 圖示靜態檔（presentational；沿用 Figma 規格頁的 ic_ 命名，放 public/img/icon/）。
const { img } = useAssets();
const iconUrl = (name: string) => img(`icon/${name}.svg`);
const pinSrc = iconUrl('map_pin');

// 每個居住條件的圖示（presentational，criteria 專用），id 對應 index.json 的篩選 id。
// 顯示文字改由 filter data 的 label 提供（criteria 卡片與 result chip 共用同一來源）。
const cards = str.cards as Record<string, { icon: string }>;
function cardLabel(f: FilterMeta): string {
  return f.label ?? f.name;
}
function criteriaIcon(id: string): string {
  const slug = cards[id]?.icon;
  return slug ? iconUrl(slug) : '';
}

// 行動版（<768）：資訊面板改為底部可展開 sheet，location 列當 toggle。
// 桌機/pad 為常駐左欄，此 state 無 CSS 作用（媒體查詢內才參照 --open）。
const infoOpen = ref(false);
function toggleInfo() {
  infoOpen.value = !infoOpen.value;
}

// view 邏輯抽至 co-located 的 StepCriteria.logic.ts（單一元件專用）。
const { countyName, townName, atMax, canProceed, hintText, toggleFilter, statText } =
  useStepCriteria(props, emit);
</script>

<template>
  <div class="lc-sc">
    <div class="lc-sc__inner">
      <!-- ── 左：現居地區資訊面板（行動版＝底部可展開 sheet）──── -->
      <aside class="lc-sc__info" :class="{ 'lc-sc__info--open': infoOpen }">
        <!-- 小地圖：只渲染被選取鄉鎮的輪廓，geometry 由 app.vue 以正規化 SVG path 傳入 -->
        <div class="lc-sc__map" aria-hidden="true">
          <svg
            v-if="selectedTownThumb"
            class="lc-sc__map-svg"
            :viewBox="`0 0 ${selectedTownThumb.width} ${selectedTownThumb.height}`"
            preserveAspectRatio="xMidYMid meet"
          >
            <path :d="selectedTownThumb.path" class="lc-sc__map-shape" />
          </svg>
        </div>

        <!-- location 列：桌機/pad 為靜態資訊；行動版兼作 sheet 收合/展開的 toggle -->
        <div
          class="lc-sc__location"
          :aria-expanded="infoOpen"
          @click="toggleInfo"
        >
          <img class="lc-sc__location-pin" :src="pinSrc" alt="" aria-hidden="true" />
          <span class="lc-sc__location-label">{{ str.currentArea }}</span>
          <span class="lc-sc__location-area">{{ countyName }}{{ townName }}</span>
          <!-- 展開箭頭（僅行動版顯示；展開時旋轉 180°） -->
          <svg
            class="lc-sc__location-chevron"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M6 15l6-6 6 6" />
          </svg>
        </div>

        <div class="lc-sc__divider" aria-hidden="true"></div>

        <div class="lc-sc__stats">
          <div v-for="f in filterIndex" :key="f.id" class="lc-sc__stat">
            <span class="lc-sc__stat-label">{{ f.name }}</span>
            <span class="lc-sc__stat-val">{{ statText(f) }}</span>
          </div>
        </div>
      </aside>

      <!-- ── 右：條件選擇 ──────────────────────────────── -->
      <section class="lc-sc__main">
        <header class="lc-sc__head">
          <!-- 標題：桌機/pad 用完整版；手機（<sm）改用精簡版，兩者以 CSS 切換 -->
          <h2 class="lc-sc__title">
            <span class="lc-sc__title-pc">{{ str.title }}</span>
            <span class="lc-sc__title-mob">{{ str.titleMob }}</span>
          </h2>
          <p class="lc-sc__hint">
            <!-- 手機（<pad）：接續標題的說明文字 + 已選計數膠囊 -->
            <!-- prettier-ignore -->
            <span class="lc-sc__hint-mob">{{ str.hint }}<span class="lc-sc__hint-count">{{ selectedFilters.length }}/{{ MAX_SELECT }}</span></span>
            <!-- 平板以上：完整提示文字（含括號計數）-->
            <span class="lc-sc__hint-pc">{{ hintText }}</span>
          </p>
        </header>

        <div class="lc-sc__cards">
          <button
            v-for="f in filterIndex"
            :key="f.id"
            type="button"
            class="lc-sc__card"
            :class="{
              'lc-sc__card--selected': selectedFilters.includes(f.id),
              'lc-sc__card--disabled': !selectedFilters.includes(f.id) && atMax,
            }"
            :aria-pressed="selectedFilters.includes(f.id)"
            @click="toggleFilter(f.id)"
          >
            <img
              class="lc-sc__card-icon"
              :src="criteriaIcon(f.id)"
              alt=""
              aria-hidden="true"
            />
            <span class="lc-sc__card-label">{{ cardLabel(f) }}</span>
          </button>
        </div>

        <div class="lc-sc__submit">
          <UiNextButton
            :label="str.viewResults"
            :disabled="!canProceed"
            @click="$emit('next')"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./StepCriteria.scss"></style>
