<script setup lang="ts">
import str from '../../locales/explore.json';
// import common from '../../locales/common.json'; // 隨 back 按鈕一併註解（唯一引用 common.back 在下方註解區塊內）
import InfoContent from '../InfoContent.vue';
import { useAssets } from '../../composables/useAssets';
import { useStepResult, type StepResultProps } from './StepResult.logic';

// 圖示靜態檔（沿用 Figma 規格頁命名，放 public/img/icon/）。
const { img } = useAssets();
const iconUrl = (name: string) => img(`icon/${name}.svg`);

const props = defineProps<StepResultProps>();
const emit = defineEmits<{
  'update:selectedResultCode': [value: string | null];
  'update:selectedFilters': [value: string[]];
  // back: []; // 註解保留：back 按鈕目前停用（template 區塊一併註解），日後可一起復原
  reselect: [];
  'zoom-in': [];
  'zoom-out': [];
}>();

// view 邏輯抽至 co-located 的 StepResult.logic.ts（單一元件專用）。
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
    <!-- 3.1 explore-sidebar
         MOB（<768）：整個側欄改為底部可展開 filter sheet，故用 Reka Collapsible。
         桌機 / PAD：恆開（:open=true、:disabled），CollapsibleTrigger 失效、chevron 隱藏，外觀同原側欄。
         unmount-on-hide=false：收合時保留卡片 DOM。 -->
    <CollapsibleRoot
      as="aside"
      class="lc-sr__sidebar"
      :open="isMobile ? asideOpen : true"
      :disabled="!isMobile"
      :unmount-on-hide="false"
      @update:open="onAsideOpenChange"
    >
      <div class="lc-sr__sidebar-top">
        <div class="lc-sr__head">
          <!-- 標題列＝MOB 收合 sheet 的可點 bar（trigger）；reselect 另置（避免 button 巢套） -->
          <CollapsibleTrigger class="lc-sr__head-toggle">
            <span class="lc-sr__title">{{ str.sidebarTitle }}</span>
            <!-- chevron 僅 MOB 顯示：收合→向上（可展開）/ 展開→向下（可收合） -->
            <svg
              class="lc-sr__head-chevron"
              viewBox="0 0 15 8"
              fill="none"
              aria-hidden="true"
            >
              <path
                :d="
                  asideOpen
                    ? 'M7.5 6.90411L14.4485 4.82111e-08L15 0.547945L7.5 8L-6.51479e-07 0.547946L0.55147 1.26313e-06L7.5 6.90411Z'
                    : 'M7.5 1.09589L0.551471 8L0 7.45205L7.5 0L15 7.45205L14.4485 8L7.5 1.09589Z'
                "
                fill="currentColor"
              />
            </svg>
          </CollapsibleTrigger>
          <button class="lc-sr__reselect" @click="$emit('reselect')">
            {{ str.reselect }} ↺
          </button>
        </div>

        <CollapsibleContent class="lc-sr__cards-body">
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
              <span class="lc-sr__card-label">{{ f.label ?? f.name }}</span>
              <!-- CheckboxIndicator 僅在勾選時 render（等同原本 ✕ 的 v-if）；圖示用 button_close（X circle） -->
              <CheckboxIndicator class="lc-sr__card-x">
                <img :src="iconUrl('button_close')" alt="" />
              </CheckboxIndicator>
            </CheckboxRoot>
          </CheckboxGroupRoot>
        </CollapsibleContent>
      </div>

      <div class="lc-sr__banners">
        <a
          class="lc-sr__banner lc-sr__banner--data"
          href="#"
          target="_blank"
          rel="noopener"
        >
          <span class="lc-sr__banner-text"
            ><strong>{{ str.banner1Title }}</strong>
            <span class="lc-sr__banner-sub">{{ str.banner1Sub }}</span></span
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
            ><strong>{{ str.banner2Title }}</strong>
            <span class="lc-sr__banner-sub">{{ str.banner2Sub }}</span></span
          >
          <span class="lc-sr__banner-icon"
            ><img :src="iconUrl('button_external_link')" alt="" /></span
          >
        </a>
      </div>
    </CollapsibleRoot>

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
          <button class="lc-sr__compare-toggle" @click="cycleCompare">
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

<style scoped lang="scss" src="./StepResult.scss"></style>
<style lang="scss" src="./StepResult.global.scss"></style>
