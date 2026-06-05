<script setup lang="ts">
import { ref, computed } from 'vue';
import type { AcceptableValue } from 'reka-ui';
import str from '../locales/explore.json';
// import common from '../locales/common.json'; // 隨 back 按鈕一併註解（唯一引用 common.back 在下方註解區塊內）
import InfoContent from './InfoContent.vue';
import type { GeoMeta } from '../types/geo';
import type { FilterMeta, FilterDataCache, FilterDataset } from '../types/filter';
import type { ResultTown } from '../composables/useResultTowns';
import { useAssets } from '../composables/useAssets';

// 圖示靜態檔（沿用 Figma 規格頁命名，放 public/img/icon/）。
const { img } = useAssets();
const iconUrl = (name: string) => img(`icon/${name}.svg`);

const props = defineProps<{
  meta: GeoMeta | null;
  filterIndex: FilterMeta[];
  filterDataCache: FilterDataCache;
  selectedTownCode: string;
  selectedFilters: string[];
  resultTowns: ResultTown[];
  selectedResultCode: string | null;
  population: FilterDataset | null;
}>();

const emit = defineEmits<{
  'update:selectedResultCode': [value: string | null];
  'update:selectedFilters': [value: string[]];
  // back: []; // 註解保留：back 按鈕目前停用（template 區塊一併註解），日後可一起復原
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

// 比較卡標題顯示的人口（取自 data/0.json，對應目前選取的結果鄉鎮）
const detailPopulation = computed(() =>
  props.selectedResultCode
    ? (props.population?.[props.selectedResultCode] ?? null)
    : null,
);

// Paddle nav：在結果清單（已扁平、已排序的 resultTowns）中前後切換選取地區
const currentResultIndex = computed(() =>
  props.selectedResultCode
    ? props.resultTowns.findIndex((t) => t.code === props.selectedResultCode)
    : -1,
);
const hasPrev = computed(() => currentResultIndex.value > 0);
const hasNext = computed(
  () =>
    currentResultIndex.value >= 0 &&
    currentResultIndex.value < props.resultTowns.length - 1,
);

// delta=-1 上一個 / +1 下一個；超出範圍（含未選取時的 -1）時 next 為 undefined，不動作
function goBy(delta: number) {
  if (currentResultIndex.value < 0) return;
  const next = props.resultTowns[currentResultIndex.value + delta];
  if (next) emit('update:selectedResultCode', next.code);
}

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
        <!-- <div class="lc-sr__topbar">
          <button class="lc-sr__back" @click="$emit('back')">
            ◀ {{ common.back }}
          </button>
        </div> -->

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
            <!-- CheckboxIndicator 僅在勾選時 render（等同原本 ✕ 的 v-if）；圖示用 button_close（X circle） -->
            <CheckboxIndicator class="lc-sr__card-x">
              <img :src="iconUrl('button_close')" alt="" />
            </CheckboxIndicator>
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
          <span class="lc-sr__banner-icon"
            ><img :src="iconUrl('button_external_link')" alt="" /></span
          >
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
          <span class="lc-sr__banner-icon"
            ><img :src="iconUrl('button_external_link')" alt="" /></span
          >
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
      <CollapsibleTrigger
        class="lc-sr__list-head"
        :class="{ 'lc-sr__list-head--open': listOpen }"
      >
        <!-- 展開態（State=clicked）：← 請選擇 -->
        <template v-if="listOpen">
          <svg
            class="lc-sr__list-back"
            viewBox="0 0 14 10"
            fill="none"
            stroke="currentColor"
            stroke-width="1"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M13 5H1M5 1 1 5l4 4" />
          </svg>
          <span class="lc-sr__list-label">{{ str.listPlaceholder }}</span>
        </template>
        <!-- 收合態（State=default）：共N項結果 + 放大鏡（button_search） -->
        <template v-else>
          <span class="lc-sr__list-label">
            {{ str.resultCountPrefix }} {{ resultTowns.length }}
            {{ str.resultCountSuffix }}
          </span>
          <img
            class="lc-sr__list-search"
            :src="iconUrl('button_search')"
            alt=""
          />
        </template>
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

    <!-- 3.4 explore-compare（外層 wrap 負責定位＋容納左右切換鈕；面板本身可圓角裁切） -->
    <div v-if="detailTown" class="lc-sr__compare-wrap">
      <!-- paddle nav：上一個地區（對齊 Figma「左右按鈕」） -->
      <button
        class="lc-sr__paddle lc-sr__paddle--prev"
        :disabled="!hasPrev"
        :aria-label="str.prevTown"
        @click="goBy(-1)"
      >
        <UiIconArrow direction="prev" />
      </button>

      <div class="lc-sr__compare">
        <div class="lc-sr__compare-head">
          <div class="lc-sr__compare-titles">
            <span class="lc-sr__compare-title">
              {{ detailTown.county }} {{ detailTown.name }}
            </span>
            <span v-if="detailPopulation != null" class="lc-sr__compare-pop">
              {{ str.population }}{{ detailPopulation.toLocaleString() }}
            </span>
          </div>
          <button
            class="lc-sr__compare-toggle"
            @click="compareCollapsed = !compareCollapsed"
          >
            {{ compareCollapsed ? str.expand : str.collapse }}
            <!-- chevron 取自 public/img/icon/menu_chevron_up/down.svg source；fill 用 currentColor 跟隨按鈕文字色 -->
            <svg
              class="lc-sr__compare-chevron"
              viewBox="0 0 15 8"
              fill="none"
              aria-hidden="true"
            >
              <path
                :d="
                  compareCollapsed
                    ? 'M7.5 1.09589L0.551471 8L0 7.45205L7.5 0L15 7.45205L14.4485 8L7.5 1.09589Z'
                    : 'M7.5 6.90411L14.4485 4.82111e-08L15 0.547945L7.5 8L-6.51479e-07 0.547946L0.55147 1.26313e-06L7.5 6.90411Z'
                "
                fill="currentColor"
              />
            </svg>
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

      <!-- paddle nav：下一個地區 -->
      <button
        class="lc-sr__paddle lc-sr__paddle--next"
        :disabled="!hasNext"
        :aria-label="str.nextTown"
        @click="goBy(1)"
      >
        <UiIconArrow direction="next" />
      </button>
    </div>

    <!-- 3.5 explore-zoom（按鈕圖示為完整圓鈕 SVG：button_zoom_in/out/information） -->
    <div class="lc-sr__zoom">
      <button
        class="lc-sr__zoom-btn"
        :aria-label="str.zoomIn"
        @click="$emit('zoom-in')"
      >
        <img :src="iconUrl('button_zoom_in')" alt="" />
      </button>
      <button
        class="lc-sr__zoom-btn"
        :aria-label="str.zoomOut"
        @click="$emit('zoom-out')"
      >
        <img :src="iconUrl('button_zoom_out')" alt="" />
      </button>
      <DialogRoot>
        <DialogTrigger class="lc-sr__zoom-btn" :aria-label="str.info">
          <img :src="iconUrl('button_information')" alt="" />
        </DialogTrigger>
        <DialogPortal>
          <DialogOverlay class="lc-sr__dialog-overlay" />
          <DialogContent class="lc-sr__dialog">
            <InfoContent />
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
    top: $app-header-h;
    left: 0;
    width: $explore-sidebar-w;
    height: calc(100vh - #{$app-header-h});
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

  // step-result__card-x（已選卸除圖示，button_close／X circle）
  &__card-x {
    display: flex;
    flex-shrink: 0;
    width: 16px;
    height: 16px;

    img {
      width: 100%;
      height: 100%;
      display: block;
    }
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

  // step-result__banner-icon（button_external_link，白色，襯在彩色 banner 上）
  &__banner-icon {
    display: flex;
    flex-shrink: 0;
    width: 16px;
    height: 16px;

    img {
      width: 100%;
      height: 100%;
      display: block;
    }
  }

  // step-result__list（3.2 explore-result-bar；對齊 Figma 結果搜尋元件：
  //   半透明白底＋0.5px 黑框＋backdrop-blur，收合為膠囊、展開為上下圓角卡片）
  &__list {
    position: absolute;
    top: #{$app-header-h};
    left: calc(#{$explore-sidebar-w} + 16px);
    width: 140px;
    max-height: calc(100vh - #{$app-header-h} - 32px);
    display: flex;
    flex-direction: column;
    background: rgb(255 255 255 / 0.8); // Figma：白 80%
    backdrop-filter: blur(2px);
    border: 0.5px solid var(--c-line-primary); // 0.5px 黑
    border-radius: 15px; // 收合 30px 高即為膠囊；展開時上下圓角
    overflow: hidden;
    pointer-events: auto;
  }

  // step-result__list-head（收合 toggle；收合態 justify-between、展開態靠左）
  &__list-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 5px;
    width: 100%;
    height: 30px;
    padding: 0 10px;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    flex-shrink: 0;

    // step-result__list-head--open（展開態：← 請選擇，靠左排）
    &--open {
      justify-content: flex-start;
      color: var(--c-text-faint); // 對齊 Figma 灰字（BK-40%）；箭頭以 currentColor 跟隨
    }
  }

  // step-result__list-label（收合：共N項結果 15px；展開：請選擇 12px 灰）
  &__list-label {
    font-size: 15px;
    color: var(--c-text-secondary);
  }

  &__list-head--open &__list-label {
    font-size: 12px;
    line-height: 18px;
    color: inherit;
  }

  // step-result__list-back（展開態 ← 細箭頭，inline currentColor）
  &__list-back {
    width: 13px;
    height: auto;
    flex-shrink: 0;
  }

  // step-result__list-search（收合態放大鏡，button_search）
  &__list-search {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
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
    padding: 10px 10px 4px;
    font-size: 14px;
    font-weight: 700;
    color: var(--c-text);
  }

  // step-result__list-item（ListboxItem）
  &__list-item {
    padding: 5px 10px;
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

  // step-result__compare-wrap（負責定位＋容納左右 paddle；不裁切，讓按鈕可溢出兩側）
  &__compare-wrap {
    position: absolute;
    left: calc(#{$explore-sidebar-w} + (100% - #{$explore-sidebar-w}) / 2);
    transform: translateX(-50%);
    bottom: 24px;
    width: min(760px, calc(100% - #{$explore-sidebar-w} - 40px));
    pointer-events: none; // 面板與按鈕各自開啟，縫隙仍可拖曳地圖
  }

  // step-result__compare（3.4 explore-compare，浮於地圖正下方、地圖區水平置中）
  &__compare {
    width: 100%;
    // 48vh ＝沿用舊版「48% of .lc-sr（fixed inset:0，撐滿視窗）」；
    // 改掛在 wrap 下後其高度不定，百分比無從解析，故改用等效的視窗高度
    max-height: 48vh;
    display: flex;
    flex-direction: column;
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: 14px;
    box-shadow: 0 4px 16px rgb(var(--c-shadow) / 0.1);
    overflow: hidden;
    pointer-events: auto;
  }

  // step-result__paddle（左右切換鈕；對齊 Figma「左右按鈕」：白圓鈕＋1px 硬陰影＋chevron）
  &__paddle {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 1px solid var(--c-line-main);
    border-radius: 999px;
    background: var(--c-surface);
    color: var(--c-text);
    cursor: pointer;
    pointer-events: auto;
    box-shadow: 1px 1px 0 var(--c-line-main);
    transition:
      background 0.15s,
      color 0.15s;

    &:hover:not(:disabled) {
      color: var(--c-text-inverse);
    }

    &:disabled {
      opacity: 0.4;
      cursor: default;
      box-shadow: none;
    }

    // step-result__paddle--prev（左：上一個地區）
    &--prev {
      left: -52px;

      &:hover:not(:disabled) {
        background: var(--c-accent-teal);
      }
    }

    // step-result__paddle--next（右：下一個地區）
    &--next {
      right: -52px;

      &:hover:not(:disabled) {
        background: var(--c-accent-green);
      }
    }
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

  // step-result__compare-titles（標題＋人口並排；對齊 Figma 標題列）
  &__compare-titles {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  // step-result__compare-title
  &__compare-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--c-text);
  }

  // step-result__compare-pop（人口；Figma 標題列灰字，與「收合」同色 #808080）
  &__compare-pop {
    font-size: 18px;
    color: var(--c-text-muted);
    white-space: nowrap;
  }

  // step-result__compare-toggle
  &__compare-toggle {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: transparent;
    border: none;
    font-size: 13px;
    color: var(--c-text-muted);
    cursor: pointer;
  }

  // step-result__compare-chevron（menu_chevron inline；fill=currentColor）
  &__compare-chevron {
    width: 11px;
    height: auto;
    flex-shrink: 0;
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
    top: #{$app-header-h};
    right: 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: auto;
  }

  // step-result__zoom-btn（圓底與描邊由 SVG 自帶，故按鈕本身透明、僅提供陰影與點擊範圍）
  &__zoom-btn {
    width: 40px;
    height: 40px;
    padding: 0;
    border: none;
    border-radius: 999px;
    background: transparent;
    cursor: pointer;
    box-shadow: 0 1px 4px rgb(var(--c-shadow) / 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: box-shadow 0.15s;

    img {
      width: 100%;
      height: 100%;
      display: block;
    }

    &:hover {
      box-shadow: 0 2px 8px rgb(var(--c-shadow) / 0.18);
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

  // step-result__dialog（置中浮層／box；對齊 Figma「蓋板資料來源視窗」。
  // 內容由 InfoContent 元件渲染，其 class 以 lc-info 命名空間另行定義）
  &__dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1001;
    display: flex;
    flex-direction: column;
    width: min(620px, calc(100vw - 32px));
    max-height: min(820px, calc(100vh - 48px));
    background: var(--c-surface);
    border: 0.5px solid var(--c-line-main);
    border-radius: 20px;
    box-shadow: 0 8px 32px rgb(var(--c-shadow) / 0.2);
    backdrop-filter: blur(2px);
    overflow: hidden; // 讓 footer 滿版且底部圓角能裁切；內距改由 InfoContent 各區塊自負
  }
}
</style>
