<script setup lang="ts">
import { computed } from 'vue';
import str from '../locales/criteria.json';
import common from '../locales/common.json';
import type { GeoMeta } from '../types/geo';
import type { FilterMeta, FilterDataCache } from '../types/filter';
import type { TownThumb } from '../composables/useTaiwanMap';

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
  back: [];
}>();

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

const hintText = computed(
  () =>
    `${str.hint}（${str.selectedLabel} ${props.selectedFilters.length}/${MAX_SELECT}）`,
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
  return typeof val === 'number' ? val.toLocaleString() : String(val);
}
</script>

<template>
  <div class="lc-sc">
    <!-- Left: current-area info panel -->
    <aside class="lc-sc__info">
      <!-- Small map: renders ONLY the selected town's shape, stretch-fit to the
           block. Geometry comes from app.vue as a normalized SVG path. -->
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
        <span class="lc-sc__location-pin">📍</span>
        <span class="lc-sc__location-label">{{ str.currentArea }}</span>
        <strong class="lc-sc__location-area"
          >{{ countyName }}{{ townName }}</strong
        >
      </div>

      <div class="lc-sc__stats">
        <div v-for="f in filterIndex" :key="f.id" class="lc-sc__stat">
          <span class="lc-sc__stat-label">{{ f.name }}</span>
          <span class="lc-sc__stat-val">{{
            formatVal(filterDataCache[f.id]?.[selectedTownCode])
          }}</span>
        </div>
      </div>
    </aside>

    <!-- Right: criteria selection -->
    <section class="lc-sc__criteria">
      <button class="lc-sc__back" @click="$emit('back')">
        ◀ {{ common.back }}
      </button>

      <h2 class="lc-sc__title">{{ str.title }}</h2>
      <p class="lc-sc__hint">{{ hintText }}</p>

      <div class="lc-sc__cards">
        <button
          v-for="f in filterIndex"
          :key="f.id"
          class="lc-sc__card"
          :class="{
            'lc-sc__card--selected': selectedFilters.includes(f.id),
            'lc-sc__card--disabled': !selectedFilters.includes(f.id) && atMax,
          }"
          @click="toggleFilter(f.id)"
        >
          <span class="lc-sc__card-icon">⌂</span>
          <span class="lc-sc__card-label">{{ f.name }}</span>
        </button>
      </div>

      <button
        class="lc-sc__submit"
        :disabled="!selectedFilters.length"
        @click="$emit('next')"
      >
        {{ str.viewResults }} ▶
      </button>
    </section>
  </div>
</template>

<style scoped lang="scss">
// step-criteria
.lc-sc {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 24px;
  padding: 88px 40px 40px;
  background: #fff;
  overflow-y: auto;

  // step-criteria__info（左側：現居地區資訊）
  &__info {
    flex: 0 0 320px;
    max-width: 320px;
    border: 1px solid #d9dde3;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  // step-criteria__map（小地圖區塊：只顯示被選取的鄉鎮市區，stretch-fit）
  &__map {
    width: 100%;
    aspect-ratio: 4 / 3;
    border-radius: 8px;
    background: #eef1f4;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  // step-criteria__map-svg
  &__map-svg {
    width: 100%;
    height: 100%;
  }

  // step-criteria__map-shape（被選取鄉鎮的色塊）
  &__map-shape {
    fill: #2f7f8d;
    stroke: #20606b;
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  // step-criteria__location
  &__location {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: #666;
    padding-bottom: 12px;
    border-bottom: 1px solid #e5e7eb;
  }

  // step-criteria__location-pin
  &__location-pin {
    color: #e3000f;
  }

  // step-criteria__location-area
  &__location-area {
    font-size: 14px;
    color: #111;
  }

  // step-criteria__stats
  &__stats {
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    max-height: 420px;
  }

  // step-criteria__stat
  &__stat {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;
    font-size: 13px;
  }

  // step-criteria__stat-label
  &__stat-label {
    flex: 1;
    color: #444;
    font-weight: 600;
    line-height: 1.4;
  }

  // step-criteria__stat-val
  &__stat-val {
    white-space: nowrap;
    color: #111;
  }

  // step-criteria__criteria（右側：條件選擇）
  &__criteria {
    flex: 1 1 760px;
    max-width: 760px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  // step-criteria__back
  &__back {
    align-self: flex-start;
    background: transparent;
    border: none;
    padding: 0;
    font-size: 13px;
    color: #6b7280;
    cursor: pointer;

    &:hover {
      color: #111;
    }
  }

  // step-criteria__title
  &__title {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    line-height: 1.4;
    color: #111;
  }

  // step-criteria__hint
  &__hint {
    margin: 0;
    font-size: 14px;
    color: #888;
  }

  // step-criteria__cards
  &__cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  // step-criteria__card
  &__card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 18px 16px;
    border: 1px solid #d9dde3;
    border-radius: 12px;
    background: #fff;
    text-align: left;
    cursor: pointer;
    transition:
      border-color 0.15s,
      background 0.15s;

    &:hover {
      border-color: #9ca3af;
    }

    // step-criteria__card--selected
    &--selected {
      border-color: #111;
      background: #f1f5f9;
    }

    // step-criteria__card--disabled（已達選取上限）
    &--disabled {
      opacity: 0.4;
      cursor: not-allowed;

      &:hover {
        border-color: #d9dde3;
      }
    }
  }

  // step-criteria__card-icon
  &__card-icon {
    font-size: 24px;
    line-height: 1;
    flex-shrink: 0;
  }

  // step-criteria__card-label
  &__card-label {
    font-size: 15px;
    line-height: 1.4;
    color: #374151;
  }

  &__card--selected &__card-label {
    font-weight: 600;
    color: #111;
  }

  // step-criteria__submit
  &__submit {
    align-self: center;
    margin-top: 8px;
    padding: 16px 48px;
    background: #f7d44c;
    color: #111;
    border: none;
    border-radius: 999px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.2s;

    &:disabled {
      opacity: 0.4;
      cursor: default;
    }
  }
}
</style>
