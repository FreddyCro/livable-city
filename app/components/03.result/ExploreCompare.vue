<script setup lang="ts">
// 3.4 explore-compare：比較／詳情浮卡（浮於地圖、可收合、左右 paddle nav、標題含人口）。
// 純呈現元件；compareState（half/open 兩態，collapsed 保留未用）、切換（goBy / cycleCompare）、衍生值（computed）與
// 格式化 helper（pct / formatVal）皆由 StepResult 統籌後以 props 傳入（輕量抽取，不重算邏輯）。
import str from '../../locales/explore.json';
import type { FilterDataCache } from '../../types/filter';

defineProps<{
  detailTown: { name: string; county: string };
  detailPopulation: number | null;
  compareState: 'collapsed' | 'half' | 'open';
  allFilterIds: string[];
  visibleFilterIds: string[];
  filterNameMap: Record<string, string>;
  filterDataCache: FilterDataCache;
  selectedResultCode: string | null;
  selectedTownCode: string;
  homeCounty: string;
  homeName: string;
  hasPrev: boolean;
  hasNext: boolean;
  // 格式化 helper 由 parent 傳入：pct 依賴 filterDataCache/選取地區，維持單一計算來源
  pct: (fid: string) => string | null;
  formatVal: (val: number | null | undefined) => string;
}>();

defineEmits<{
  'go-by': [delta: number];
  'cycle-compare': [];
}>();
</script>

<template>
  <div class="lc-sr__compare-wrap">
    <!-- 外層 wrap 負責定位＋容納左右切換鈕；面板本身可圓角裁切。
         ⚠ 註解須置於根元素內（頂層 HTML 註解→多根 fragment→$el 失效→click-outside 失效）。 -->
    <!-- paddle nav：上一個地區（對齊 Figma「左右按鈕」） -->
    <button
      class="lc-sr__paddle lc-sr__paddle--prev"
      :disabled="!hasPrev"
      :aria-label="str.prevTown"
      @click="$emit('go-by', -1)"
    >
      <IconArrow direction="prev" />
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
        <button class="lc-sr__compare-toggle" @click="$emit('cycle-compare')">
          {{ compareState === 'open' ? str.collapse : str.seeMore }}
          <!-- chevron 取自 public/img/icon/menu_chevron_up/down.svg source；fill 用 currentColor 跟隨按鈕文字色。
               全開→向下（收合）；收合／半開→向上（看更多，面板自底部往上展開） -->
          <svg
            class="lc-sr__compare-chevron"
            viewBox="0 0 15 8"
            fill="none"
            aria-hidden="true"
          >
            <path
              :d="
                compareState === 'open'
                  ? 'M7.5 6.90411L14.4485 4.82111e-08L15 0.547945L7.5 8L-6.51479e-07 0.547946L0.55147 1.26313e-06L7.5 6.90411Z'
                  : 'M7.5 1.09589L0.551471 8L0 7.45205L7.5 0L15 7.45205L14.4485 8L7.5 1.09589Z'
              "
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
      <div v-if="compareState !== 'collapsed'" class="lc-sr__compare-body">
        <div v-if="!allFilterIds.length" class="lc-sr__compare-empty">—</div>
        <div v-for="fid in visibleFilterIds" :key="fid" class="lc-sr__metric">
          <p class="lc-sr__metric-name">{{ filterNameMap[fid] ?? fid }}</p>
          <div class="lc-sr__metric-row">
            <span class="lc-sr__metric-area"
              >{{ detailTown.county }}{{ detailTown.name }}</span
            >
            <div class="lc-sr__metric-right">
              <span v-if="pct(fid) !== null" class="lc-sr__metric-pct">{{
                pct(fid)
              }}</span>
              <span class="lc-sr__metric-val">{{
                formatVal(filterDataCache[fid]?.[selectedResultCode!])
              }}</span>
            </div>
          </div>
          <div class="lc-sr__metric-row lc-sr__metric-row--home">
            <span class="lc-sr__metric-area"
              >{{ homeCounty }}{{ homeName }}</span
            >
            <div class="lc-sr__metric-right">
              <span class="lc-sr__metric-val">{{
                formatVal(filterDataCache[fid]?.[selectedTownCode])
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- paddle nav：下一個地區 -->
    <button
      class="lc-sr__paddle lc-sr__paddle--next"
      :disabled="!hasNext"
      :aria-label="str.nextTown"
      @click="$emit('go-by', 1)"
    >
      <IconArrow direction="next" />
    </button>
  </div>
</template>
