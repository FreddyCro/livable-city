<script setup lang="ts">
import str from '../../locales/criteria.json';
import type { FilterMeta } from '../../types/filter';
import { useAssets } from '../../composables/useAssets';
import { useStepCriteria, type StepCriteriaProps } from './StepCriteria.logic';

const props = defineProps<StepCriteriaProps>();
const emit = defineEmits<{
  'update:selectedFilters': [value: string[]];
  next: [];
}>();

// 圖示靜態檔（presentational；沿用 Figma 規格頁的 ic_ 命名，放 public/img/icon/）。
const { img } = useAssets();
const iconUrl = (name: string) => img(`icon/${name}.svg`);
const pinSrc = iconUrl('map_pin');

// 每個居住條件的呈現用 metadata（動作語句 label + 圖示檔名 icon），id 對應 index.json
// 的篩選 id。label 與 icon 成對放一起，元件不再各自維護兩份 id 對照。
const cards = str.cards as Record<string, { label: string; icon: string }>;
function cardLabel(f: FilterMeta): string {
  return cards[f.id]?.label ?? f.name;
}
function criteriaIcon(id: string): string {
  const slug = cards[id]?.icon;
  return slug ? iconUrl(slug) : '';
}

// view 邏輯抽至 co-located 的 StepCriteria.logic.ts（單一元件專用）。
const { countyName, townName, atMax, canProceed, hintText, toggleFilter, formatVal } =
  useStepCriteria(props, emit);
</script>

<template>
  <div class="lc-sc">
    <div class="lc-sc__inner">
      <!-- ── 左：現居地區資訊面板 ──────────────────────── -->
      <aside class="lc-sc__info">
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

        <div class="lc-sc__location">
          <img class="lc-sc__location-pin" :src="pinSrc" alt="" aria-hidden="true" />
          <span class="lc-sc__location-label">{{ str.currentArea }}</span>
          <span class="lc-sc__location-area">{{ countyName }}{{ townName }}</span>
        </div>

        <div class="lc-sc__divider" aria-hidden="true"></div>

        <div class="lc-sc__stats">
          <div v-for="f in filterIndex" :key="f.id" class="lc-sc__stat">
            <span class="lc-sc__stat-label">{{ f.name }}</span>
            <span class="lc-sc__stat-val">{{
              formatVal(filterDataCache[f.id]?.[selectedTownCode])
            }}</span>
          </div>
        </div>
      </aside>

      <!-- ── 右：條件選擇 ──────────────────────────────── -->
      <section class="lc-sc__main">
        <header class="lc-sc__head">
          <h2 class="lc-sc__title">{{ str.title }}</h2>
          <p class="lc-sc__hint">{{ hintText }}</p>
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

        <button
          type="button"
          class="lc-sc__submit"
          :disabled="!canProceed"
          @click="$emit('next')"
        >
          <span>{{ str.viewResults }}</span>
          <UiIconArrowCircle />
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./StepCriteria.scss"></style>
