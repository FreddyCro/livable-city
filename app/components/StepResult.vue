<script setup lang="ts">
import { ref, computed } from 'vue';
import str from '../locales/explore.json';
import common from '../locales/common.json';
import type { GeoMeta } from '../types/geo';
import type { FilterMeta, FilterDataCache } from '../types/filter';
import type { ResultTown } from '../composables/useResultTowns';

const props = defineProps<{
  meta: GeoMeta | null;
  filterIndex: FilterMeta[];
  filterDataCache: FilterDataCache;
  selectedTownCode: string;
  selectedFilters: string[];
  resultTowns: ResultTown[];
  selectedResultCode: string | null;
}>();

const emit = defineEmits<{
  'update:selectedResultCode': [value: string | null];
  'update:selectedFilters': [value: string[]];
  back: [];
  reselect: [];
  'zoom-in': [];
  'zoom-out': [];
}>();

const compareCollapsed = ref(false);
const listCollapsed = ref(false);

const filterNameMap = computed(() =>
  Object.fromEntries(props.filterIndex.map((f) => [f.id, f.name])),
);

// explore-compare 顯示「全部指標」，不受 explore-sidebar 勾選影響
const allFilterIds = computed(() => props.filterIndex.map((f) => f.id));

// Home (current) town name
const homeCounty = computed(() => {
  const m = props.meta;
  if (!m || !props.selectedTownCode) return '';
  const t = m.towns[props.selectedTownCode];
  return (t ? m.counties[t.COUNTYCODE]?.COUNTYNAME : '') ?? '';
});
const homeName = computed(() => {
  const m = props.meta;
  if (!m || !props.selectedTownCode) return '';
  return m.towns[props.selectedTownCode]?.TOWNNAME ?? '';
});

// Target (selected result) town
const detailTown = computed(() => {
  const m = props.meta;
  if (!props.selectedResultCode || !m) return null;
  const t = m.towns[props.selectedResultCode];
  const c = t ? m.counties[t.COUNTYCODE] : undefined;
  return { name: t?.TOWNNAME ?? '', county: c?.COUNTYNAME ?? '' };
});

// Result list grouped by county
const resultGroups = computed(() => {
  const map = new Map<string, Array<{ code: string; name: string }>>();
  for (const t of props.resultTowns) {
    if (!map.has(t.county)) map.set(t.county, []);
    map.get(t.county)!.push({ code: t.code, name: t.name });
  }
  return Array.from(map, ([county, towns]) => ({ county, towns }));
});

function toggleFilter(id: string) {
  const filters = [...props.selectedFilters];
  const idx = filters.indexOf(id);
  if (idx >= 0) filters.splice(idx, 1);
  else filters.push(id);
  emit('update:selectedFilters', filters);
}

function toggleResult(code: string) {
  emit(
    'update:selectedResultCode',
    props.selectedResultCode === code ? null : code,
  );
}

// % diff of target vs home (e.g. "-13%"); null when not computable
function pct(fid: string): string | null {
  const home = props.filterDataCache[fid]?.[props.selectedTownCode];
  const target = props.selectedResultCode
    ? props.filterDataCache[fid]?.[props.selectedResultCode]
    : null;
  if (home == null || target == null || home === 0) return null;
  const p = Math.round(((target - home) / home) * 100);
  return `${p > 0 ? '+' : ''}${p}%`;
}

function formatVal(val: number | null | undefined): string {
  if (val == null) return '—';
  return typeof val === 'number' ? val.toLocaleString() : String(val);
}
</script>

<template>
  <div class="lc-sr">
    <!-- 3.1 explore-sidebar -->
    <aside class="lc-sr__sidebar">
      <div class="lc-sr__sidebar-top">
        <div class="lc-sr__topbar">
          <button class="lc-sr__back" @click="$emit('back')">
            ◀ {{ common.back }}
          </button>
        </div>

        <div class="lc-sr__head">
          <p class="lc-sr__title">{{ str.sidebarTitle }}</p>
          <button class="lc-sr__reselect" @click="$emit('reselect')">
            {{ str.reselect }} ↺
          </button>
        </div>

        <div class="lc-sr__cards">
          <button
            v-for="f in filterIndex"
            :key="f.id"
            class="lc-sr__card"
            :class="{ 'lc-sr__card--selected': selectedFilters.includes(f.id) }"
            @click="toggleFilter(f.id)"
          >
            <span class="lc-sr__card-label">{{ f.name }}</span>
            <span v-if="selectedFilters.includes(f.id)" class="lc-sr__card-x"
              >✕</span
            >
          </button>
        </div>
      </div>

      <!-- <div class="lc-sr__banners">
        <a
          class="lc-sr__banner lc-sr__banner--data"
          href="#"
          target="_blank"
          rel="noopener"
        >
          <span class="lc-sr__banner-text"
            ><strong>{{ str.banner1Title }}</strong> {{ str.banner1Sub }}</span
          >
          <span class="lc-sr__banner-icon">↗</span>
        </a>
        <a
          class="lc-sr__banner lc-sr__banner--report"
          href="#"
          target="_blank"
          rel="noopener"
        >
          <span class="lc-sr__banner-text"
            ><strong>{{ str.banner2Title }}</strong> {{ str.banner2Sub }}</span
          >
          <span class="lc-sr__banner-icon">↗</span>
        </a>
      </div> -->
    </aside>

    <!-- 3.2 explore-result-bar（清單態） -->
    <div class="lc-sr__list">
      <button class="lc-sr__list-head" @click="listCollapsed = !listCollapsed">
        <span class="lc-sr__list-label">
          {{
            listCollapsed
              ? `${str.resultCountPrefix} ${resultTowns.length} ${str.resultCountSuffix}`
              : str.listPlaceholder
          }}
        </span>
        <span class="lc-sr__list-chevron">{{ listCollapsed ? '∨' : '∧' }}</span>
      </button>
      <div v-show="!listCollapsed" class="lc-sr__list-body">
        <template v-for="g in resultGroups" :key="g.county">
          <div class="lc-sr__list-county">{{ g.county }}</div>
          <div
            v-for="t in g.towns"
            :key="t.code"
            class="lc-sr__list-item"
            :class="{
              'lc-sr__list-item--active': selectedResultCode === t.code,
            }"
            @click="toggleResult(t.code)"
          >
            {{ t.name }}
          </div>
        </template>
        <div v-if="!resultTowns.length" class="lc-sr__list-empty">
          {{ str.noResult }}
        </div>
      </div>
    </div>

    <!-- 3.4 explore-compare -->
    <div v-if="detailTown" class="lc-sr__compare">
      <div class="lc-sr__compare-head">
        <div class="lc-sr__compare-title">
          {{ detailTown.county }} {{ detailTown.name }}
        </div>
        <button
          class="lc-sr__compare-toggle"
          @click="compareCollapsed = !compareCollapsed"
        >
          {{ compareCollapsed ? str.expand : str.collapse }}
          {{ compareCollapsed ? '∧' : '∨' }}
        </button>
      </div>
      <div v-if="!compareCollapsed" class="lc-sr__compare-body">
        <div v-if="!allFilterIds.length" class="lc-sr__compare-empty">—</div>
        <div v-for="fid in allFilterIds" :key="fid" class="lc-sr__metric">
          <p class="lc-sr__metric-name">{{ filterNameMap[fid] ?? fid }}</p>
          <div class="lc-sr__metric-row">
            <span class="lc-sr__metric-area"
              >{{ detailTown.county }}{{ detailTown.name }}</span
            >
            <span v-if="pct(fid) !== null" class="lc-sr__metric-pct">{{
              pct(fid)
            }}</span>
            <span class="lc-sr__metric-val">{{
              formatVal(filterDataCache[fid]?.[selectedResultCode!])
            }}</span>
          </div>
          <div class="lc-sr__metric-row lc-sr__metric-row--home">
            <span class="lc-sr__metric-area"
              >{{ homeCounty }}{{ homeName }}</span
            >
            <span class="lc-sr__metric-val">{{
              formatVal(filterDataCache[fid]?.[selectedTownCode])
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 3.5 explore-zoom -->
    <div class="lc-sr__zoom">
      <button class="lc-sr__zoom-btn" @click="$emit('zoom-in')">＋</button>
      <button class="lc-sr__zoom-btn" @click="$emit('zoom-out')">－</button>
      <button class="lc-sr__zoom-btn lc-sr__zoom-btn--info" title="info">
        ⓘ
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
// step-result
.lc-sr {
  position: fixed;
  inset: 0;
  z-index: 10;
  pointer-events: none; // panels re-enable; map stays draggable in the gaps

  // step-result__sidebar（3.1 explore-sidebar）
  &__sidebar {
    position: absolute;
    top: $header-h;
    left: 0;
    width: $explore-sidebar-w;
    height: calc(100vh - #{$header-h});
    max-height: 1080px;
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    padding: 24px 32px 0;
    pointer-events: auto;
    background: var(--c-surface);
    box-shadow: 2px 0 12px rgb(var(--c-shadow) / 0.06);
    overflow-y: auto;
  }

  // step-result__topbar
  &__topbar {
    margin-bottom: 12px;
  }

  // step-result__back
  &__back {
    background: transparent;
    border: none;
    padding: 0;
    font-size: 13px;
    color: var(--c-text-muted);
    cursor: pointer;

    &:hover {
      color: var(--c-text);
    }
  }

  // step-result__head
  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 16px;
    margin-bottom: 18px;
    border-bottom: 1px solid var(--c-border-subtle);
  }

  // step-result__title
  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: var(--c-text);
  }

  // step-result__reselect
  &__reselect {
    flex-shrink: 0;
    border: 1px solid var(--c-border);
    border-radius: 999px;
    padding: 6px 14px;
    background: var(--c-surface);
    font-size: 13px;
    color: var(--c-text-secondary);
    cursor: pointer;
    white-space: nowrap;

    &:hover {
      border-color: var(--c-border-hover);
    }
  }

  // step-result__cards
  &__cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  // step-result__card
  &__card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 16px 18px;
    border: 1px solid var(--c-border);
    border-radius: 10px;
    background: var(--c-surface);
    font-size: 15px;
    color: var(--c-text-secondary);
    text-align: left;
    cursor: pointer;
    transition:
      border-color 0.15s,
      background 0.15s;

    &:hover {
      border-color: var(--c-border-hover);
    }

    // step-result__card--selected
    &--selected {
      background: var(--c-primary);
      border-color: var(--c-primary);
      color: var(--c-text);
      font-weight: 700;
    }
  }

  // step-result__card-x
  &__card-x {
    font-size: 12px;
    color: var(--c-text);
  }

  // step-result__banners（沿側邊欄底部滿版）
  &__banners {
    margin: 24px -32px -24px;
    display: flex;
    flex-direction: column;
  }

  // step-result__banner
  &__banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 24px;
    color: var(--c-text-inverse);
    text-decoration: none;
    font-size: 14px;

    strong {
      font-weight: 700;
    }

    // step-result__banner--data
    &--data {
      background: var(--c-accent-teal);
    }

    // step-result__banner--report
    &--report {
      background: var(--c-accent-green);
    }
  }

  // step-result__banner-icon
  &__banner-icon {
    flex-shrink: 0;
  }

  // step-result__list（3.2 explore-result-bar 清單態，浮於地圖）
  &__list {
    position: absolute;
    top: #{$header-h};
    left: calc(#{$explore-sidebar-w} + 16px);
    width: 172px;
    max-height: calc(100vh - #{$header-h} - 32px);
    display: flex;
    flex-direction: column;
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: 12px;
    box-shadow: 0 2px 10px rgb(var(--c-shadow) / 0.08);
    overflow: hidden;
    pointer-events: auto;
  }

  // step-result__list-head（可收合 toggle）
  &__list-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    padding: 12px 14px;
    border: none;
    border-bottom: 1px solid var(--c-border-subtle);
    background: transparent;
    font-size: 13px;
    color: var(--c-text-secondary);
    cursor: pointer;
    text-align: left;

    &:hover {
      color: var(--c-text);
    }
  }

  // step-result__list-label
  &__list-label {
    font-weight: 600;
  }

  // step-result__list-chevron
  &__list-chevron {
    flex-shrink: 0;
    color: var(--c-text-faint);
  }

  // step-result__list-body
  &__list-body {
    overflow-y: auto;
    padding: 4px 0;
  }

  // step-result__list-county
  &__list-county {
    padding: 10px 14px 4px;
    font-size: 14px;
    font-weight: 700;
    color: var(--c-text);
  }

  // step-result__list-item
  &__list-item {
    padding: 5px 14px;
    font-size: 13px;
    color: var(--c-text-secondary);
    cursor: pointer;

    &:hover {
      background: var(--c-info-bg);
    }

    // step-result__list-item--active
    &--active {
      background: var(--c-info-bg);
      color: var(--c-info);
      font-weight: 600;
    }
  }

  // step-result__list-empty
  &__list-empty {
    padding: 14px;
    font-size: 12px;
    color: var(--c-text-faint);
  }

  // step-result__compare（3.4 explore-compare，浮於地圖正下方、地圖區水平置中）
  &__compare {
    position: absolute;
    left: calc(#{$explore-sidebar-w} + (100% - #{$explore-sidebar-w}) / 2);
    transform: translateX(-50%);
    bottom: 24px;
    width: min(760px, calc(100% - #{$explore-sidebar-w} - 40px));
    max-height: 48%;
    display: flex;
    flex-direction: column;
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: 14px;
    box-shadow: 0 4px 16px rgb(var(--c-shadow) / 0.1);
    overflow: hidden;
    pointer-events: auto;
  }

  // step-result__compare-head
  &__compare-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 18px 22px;
    border-bottom: 1px solid var(--c-border-subtle);
  }

  // step-result__compare-title
  &__compare-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--c-text);
  }

  // step-result__compare-toggle
  &__compare-toggle {
    background: transparent;
    border: none;
    font-size: 13px;
    color: var(--c-text-muted);
    cursor: pointer;
  }

  // step-result__compare-body
  &__compare-body {
    overflow-y: auto;
    padding: 6px 22px 18px;
  }

  // step-result__compare-empty
  &__compare-empty {
    padding: 16px 0;
    color: var(--c-text-faint);
  }

  // step-result__metric
  &__metric {
    padding: 14px 0;
    border-bottom: 1px solid var(--c-border-subtle);

    &:last-child {
      border-bottom: none;
    }
  }

  // step-result__metric-name
  &__metric-name {
    margin: 0 0 8px;
    font-size: 15px;
    font-weight: 700;
    color: var(--c-text);
  }

  // step-result__metric-row
  &__metric-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 3px 0;
    font-size: 14px;

    // step-result__metric-row--home
    &--home {
      color: var(--c-text-muted);
    }
  }

  // step-result__metric-area
  &__metric-area {
    flex: 1;
  }

  // step-result__metric-pct
  &__metric-pct {
    background: var(--c-danger);
    color: var(--c-text-inverse);
    font-size: 12px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 4px;
    white-space: nowrap;
  }

  // step-result__metric-val
  &__metric-val {
    min-width: 60px;
    text-align: right;
    font-weight: 700;
    color: var(--c-text);
  }

  &__metric-row--home &__metric-val {
    color: var(--c-text-muted);
  }

  // step-result__zoom（3.5 explore-zoom）
  &__zoom {
    position: absolute;
    top: #{$header-h};
    right: 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: auto;
  }

  // step-result__zoom-btn
  &__zoom-btn {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    border: 1px solid var(--c-border);
    background: var(--c-surface);
    font-size: 18px;
    color: var(--c-text-secondary);
    cursor: pointer;
    box-shadow: 0 1px 4px rgb(var(--c-shadow) / 0.1);
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: var(--c-surface-sunken);
    }

    // step-result__zoom-btn--info
    &--info {
      color: var(--c-text-muted);
    }
  }
}
</style>
