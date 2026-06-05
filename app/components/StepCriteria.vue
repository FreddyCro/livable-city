<script setup lang="ts">
import { computed } from 'vue';
import str from '../locales/criteria.json';
import type { GeoMeta } from '../types/geo';
import type { FilterMeta, FilterDataCache } from '../types/filter';
import type { TownThumb } from '../composables/useTaiwanMap';
import { useAssets } from '../composables/useAssets';

const MAX_SELECT = 3;

const props = defineProps<{
  meta: GeoMeta | null;
  filterIndex: FilterMeta[];
  selectedTownCode: string;
  filterDataCache: FilterDataCache;
  selectedFilters: string[];
  selectedTownThumb: TownThumb | null;
}>();

const emit = defineEmits<{
  'update:selectedFilters': [value: string[]];
  next: [];
}>();

// 圖示靜態檔（沿用 Figma 規格頁的 ic_ 命名，放 public/img/icon/）。
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

const countyName = computed(() => {
  const m = props.meta;
  if (!m || !props.selectedTownCode) return '';
  const town = m.towns[props.selectedTownCode];
  return (town ? m.counties[town.COUNTYCODE]?.COUNTYNAME : '') ?? '';
});

const townName = computed(() => {
  if (!props.meta || !props.selectedTownCode) return '';
  return props.meta.towns[props.selectedTownCode]?.TOWNNAME ?? '';
});

const atMax = computed(() => props.selectedFilters.length >= MAX_SELECT);

// 必須選滿 MAX_SELECT 項才能進入 step 3（與 hint「請選擇3項」一致）
const canProceed = computed(() => props.selectedFilters.length === MAX_SELECT);

const hintText = computed(
  () =>
    `${str.hint}（${str.selectedLabel}${props.selectedFilters.length}/${MAX_SELECT}）`,
);

function toggleFilter(id: string) {
  const filters = [...props.selectedFilters];
  const idx = filters.indexOf(id);
  if (idx >= 0) {
    filters.splice(idx, 1);
  } else {
    if (filters.length >= MAX_SELECT) return; // cap at MAX_SELECT
    filters.push(id);
  }
  emit('update:selectedFilters', filters);
}

function formatVal(val: number | null | undefined): string {
  if (val == null) return '—';
  return val.toLocaleString();
}
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

<style scoped lang="scss">
@use '../assets/styles/mixins' as *;

// step-criteria
.lc-sc {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  // top 留白避開 AppHeader（= header 高 + 26px，Figma 內容起點 y86）
  padding: ($app-header-h + 26px) 24px 24px;
  background: $color-b01; // B01 #e6f5fa
  overflow-y: auto;

  // step-criteria__inner（置中兩欄：面板 300 + 欄距 24 + 內容 580 = 904）
  &__inner {
    display: flex;
    gap: 24px;
    align-items: stretch;
    width: 100%;
    max-width: 904px;
    height: 600px;
    max-height: calc(100vh - 110px);
  }

  // ── 左欄：資訊面板 ──────────────────────────────────
  // step-criteria__info（毛玻璃面板）
  &__info {
    flex: 0 0 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    height: 100%;
    padding: 20px;
    border: 0.5px solid var(--c-line-main); // 主線條 #403a2c
    border-radius: 10px;
    background: rgb(255 255 255 / 0.8);
    @include blur(10px);
    overflow: hidden;
  }

  // step-criteria__map（小地圖：只顯示被選取鄉鎮）
  &__map {
    flex-shrink: 0;
    width: 191px;
    height: 160px;
  }

  // step-criteria__map-svg
  &__map-svg {
    width: 100%;
    height: 100%;
  }

  // step-criteria__map-shape（被選取鄉鎮色塊）
  &__map-shape {
    fill: var(--c-accent-teal); // B03 teal
    stroke: var(--c-accent-teal-dk);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  // step-criteria__location（pin + 標籤 + 地區名）
  &__location {
    display: flex;
    align-items: center;
    gap: 5px;
    width: 100%;
    font-size: 15px;
    line-height: 22px;
    color: #000;
  }

  // step-criteria__location-pin（定位圖示，public/img/icon/map_pin.svg）
  &__location-pin {
    flex-shrink: 0;
    width: 18px;
    height: 21px;
    object-fit: contain;
  }

  // step-criteria__location-label
  &__location-label {
    font-weight: 700;
    white-space: nowrap;
  }

  // step-criteria__location-area
  &__location-area {
    flex: 1;
    min-width: 0;
  }

  // step-criteria__divider（面板內分隔線）
  &__divider {
    flex-shrink: 0;
    width: 100%;
    height: 0;
    border-top: 0.5px solid #000;
  }

  // step-criteria__stats（指標清單；超出時內部捲動）
  &__stats {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    overflow-y: auto;
  }

  // step-criteria__stat
  &__stat {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    width: 100%;
    padding-bottom: 10px;
    border-bottom: 0.5px solid rgb(0 0 0 / 0.25);
    font-size: 15px;
    line-height: 22px;
    color: #000;

    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
  }

  // step-criteria__stat-label
  &__stat-label {
    flex: 0 0 110px;
    width: 110px;
    font-weight: 700;
  }

  // step-criteria__stat-val
  &__stat-val {
    flex: 1;
    text-align: right;
  }

  // ── 右欄：條件選擇 ──────────────────────────────────
  // step-criteria__main
  &__main {
    flex: 0 0 580px;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
  }

  // step-criteria__head（標題 + 提示）
  &__head {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    text-align: center;
    color: #000;
  }

  // step-criteria__title（主問句）
  &__title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    line-height: 32px;
  }

  // step-criteria__hint（選取提示，含已選計數）
  &__hint {
    margin: 0;
    font-size: 18px;
    font-weight: 400;
    line-height: 36px;
  }

  // step-criteria__cards（3 欄居住條件多選 grid）
  &__cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    width: 100%;
    padding: 10px 0;
  }

  // step-criteria__card（單張條件按鈕）
  &__card {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    min-height: 60px;
    padding: 10px;
    border: 0.5px solid #000;
    border-radius: 10px;
    background: transparent;
    cursor: pointer;
    transition:
      border-color 0.15s,
      background 0.15s;

    &:hover {
      background: rgb(255 255 255 / 0.6);
    }

    // step-criteria__card--selected（已選；註：Figma 未提供選中態，暫定淺藍底）
    &--selected {
      background: var(--color-b02); // 淺藍
      border-color: #000;

      &:hover {
        background: var(--color-b02);
      }
    }

    // step-criteria__card--disabled（已達選取上限的未選項）
    &--disabled {
      opacity: 0.4;
      cursor: not-allowed;

      &:hover {
        background: transparent;
      }
    }
  }

  // step-criteria__card-icon（指標圖示，public/img/icon/ic_*.svg）
  &__card-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    object-fit: contain;
  }

  // step-criteria__card-label
  &__card-label {
    flex: 1;
    font-size: 18px;
    font-weight: 400;
    line-height: 28px;
    text-align: left;
    color: #000;
  }

  &__card--selected &__card-label {
    font-weight: 700;
  }

  // step-criteria__submit（黃色膠囊主按鈕）
  &__submit {
    flex-shrink: 0;
    margin-top: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    width: 400px;
    height: 60px;
    border: none;
    border-radius: 50px;
    background: $color-y01; // Y01 #f4cc34
    font-size: 18px;
    line-height: 28px;
    color: #000;
    cursor: pointer;
    transition: opacity 0.2s;

    &:disabled {
      opacity: 0.4;
      cursor: default;
    }
  }
}
</style>
