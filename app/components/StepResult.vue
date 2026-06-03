<script setup lang="ts">
import { ref, computed } from 'vue';
import type { AcceptableValue } from 'reka-ui';
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
const listOpen = ref(true);

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

// CheckboxGroup 多選：reka 回傳更新後的勾選值陣列（值均為 filter id 字串）
function onFiltersChange(value: AcceptableValue[]) {
  emit('update:selectedFilters', value as string[]);
}

// Listbox 單選 + 預設 toggle 行為：點未選項→選取，點已選項→回傳 undefined（取消）
function onResultSelect(val: AcceptableValue | undefined) {
  emit('update:selectedResultCode', (val as string | undefined) ?? null);
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

        <CheckboxGroupRoot
          class="lc-sr__cards"
          :model-value="selectedFilters"
          @update:model-value="onFiltersChange"
        >
          <CheckboxRoot
            v-for="f in filterIndex"
            :key="f.id"
            :value="f.id"
            class="lc-sr__card"
          >
            <span class="lc-sr__card-label">{{ f.name }}</span>
            <!-- CheckboxIndicator 僅在勾選時 render，等同原本 ✕ 的 v-if -->
            <CheckboxIndicator class="lc-sr__card-x">✕</CheckboxIndicator>
          </CheckboxRoot>
        </CheckboxGroupRoot>
      </div>

      <div class="lc-sr__banners">
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
      </div>
    </aside>

    <!-- 3.2 explore-result-bar（清單態）；收合用 Reka Collapsible、選取用 Reka Listbox。
         unmount-on-hide=false：收合時以 hidden 保留 DOM（不卸載），維持清單捲動位置。 -->
    <CollapsibleRoot
      v-model:open="listOpen"
      :unmount-on-hide="false"
      class="lc-sr__list"
    >
      <CollapsibleTrigger class="lc-sr__list-head">
        <span class="lc-sr__list-label">
          {{
            listOpen
              ? str.listPlaceholder
              : `${str.resultCountPrefix} ${resultTowns.length} ${str.resultCountSuffix}`
          }}
        </span>
        <span class="lc-sr__list-chevron">{{ listOpen ? '∧' : '∨' }}</span>
      </CollapsibleTrigger>
      <CollapsibleContent class="lc-sr__list-body">
        <ListboxRoot
          v-if="resultTowns.length"
          :model-value="selectedResultCode ?? undefined"
          @update:model-value="onResultSelect"
        >
          <!-- ListboxContent 才會掛 role=listbox 與方向鍵/Enter/type-ahead keydown -->
          <ListboxContent class="lc-sr__listbox">
            <ListboxGroup
              v-for="g in resultGroups"
              :key="g.county"
              class="lc-sr__list-group"
            >
              <ListboxGroupLabel class="lc-sr__list-county">
                {{ g.county }}
              </ListboxGroupLabel>
              <ListboxItem
                v-for="t in g.towns"
                :key="t.code"
                :value="t.code"
                class="lc-sr__list-item"
              >
                {{ t.name }}
              </ListboxItem>
            </ListboxGroup>
          </ListboxContent>
        </ListboxRoot>
        <!-- 空狀態置於 listbox 之外，避免 role=listbox 內含非 option 內容 -->
        <div v-else class="lc-sr__list-empty">
          {{ str.noResult }}
        </div>
      </CollapsibleContent>
    </CollapsibleRoot>

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
      <DialogRoot>
        <DialogTrigger
          class="lc-sr__zoom-btn lc-sr__zoom-btn--info"
          title="info"
        >
          ⓘ
        </DialogTrigger>
        <DialogPortal>
          <DialogOverlay class="lc-sr__dialog-overlay" />
          <DialogContent class="lc-sr__dialog">
            <DialogTitle class="lc-sr__dialog-title">說明</DialogTitle>
            <DialogDescription class="lc-sr__dialog-desc">
              這裡之後會放地圖與指標的說明內容（佔位）。
            </DialogDescription>
            <DialogClose class="lc-sr__dialog-close" aria-label="關閉">
              ✕
            </DialogClose>
          </DialogContent>
        </DialogPortal>
      </DialogRoot>
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

    // 已選：Reka CheckboxRoot 掛 data-state="checked"（樣式沿用原 --selected）
    &[data-state='checked'] {
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
    flex-shrink: 0;

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

  // step-result__list-body（CollapsibleContent；撐滿剩餘高度並自行捲動）
  &__list-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding: 4px 0;
  }

  // step-result__listbox（ListboxRoot；可聚焦容器，移除預設外框）
  &__listbox {
    outline: none;
  }

  // step-result__list-county（ListboxGroupLabel）
  &__list-county {
    padding: 10px 14px 4px;
    font-size: 14px;
    font-weight: 700;
    color: var(--c-text);
  }

  // step-result__list-item（ListboxItem）
  &__list-item {
    padding: 5px 14px;
    font-size: 13px;
    color: var(--c-text-secondary);
    cursor: pointer;
    user-select: none;
    outline: none;

    &:hover {
      background: var(--c-info-bg);
    }

    // 鍵盤導航高亮：Reka 掛 data-highlighted
    &[data-highlighted] {
      background: var(--c-info-bg);
    }

    // 已選：Reka 掛 data-state="checked"
    &[data-state='checked'] {
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

<style lang="scss">
// step-result（Dialog 經 DialogPortal teleport 至 <body>，
// Vue scoped 屬性套不到 portal 內元素，故此區改為 global；class 已以 lc-sr 命名空間隔離）
.lc-sr {
  // step-result__dialog-overlay
  &__dialog-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgb(var(--c-shadow) / 0.45);
  }

  // step-result__dialog（置中浮層）
  &__dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1001;
    width: min(440px, calc(100vw - 32px));
    padding: 28px 24px 24px;
    background: var(--c-surface);
    border-radius: 14px;
    box-shadow: 0 8px 32px rgb(var(--c-shadow) / 0.2);
  }

  // step-result__dialog-title
  &__dialog-title {
    margin: 0 0 8px;
    font-size: 18px;
    font-weight: 700;
    color: var(--c-text);
  }

  // step-result__dialog-desc
  &__dialog-desc {
    margin: 0;
    font-size: 14px;
    line-height: 1.7;
    color: var(--c-text-secondary);
  }

  // step-result__dialog-close（右上角關閉）
  &__dialog-close {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 999px;
    background: transparent;
    font-size: 14px;
    color: var(--c-text-muted);
    cursor: pointer;

    &:hover {
      background: var(--c-surface-sunken);
    }
  }
}
</style>
