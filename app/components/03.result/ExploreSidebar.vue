<script setup lang="ts">
// 3.1 explore-sidebar：左側篩選欄（filter 卡片 + banners）。
// 純呈現元件；開合狀態（asideOpen）、勾選值（selectedFilters）由 StepResult 統籌，
// 透過 props 傳入、events 傳出（click-outside 收合亦由 parent 掛 ref 到本元件根）。
import type { AcceptableValue } from 'reka-ui';
import str from '../../locales/explore.json';
import type { FilterMeta } from '../../types/filter';
import { useAssets } from '../../composables/useAssets';
import useTrackingEvent from '../../composables/useTrackingEvent';

defineProps<{
  filterIndex: FilterMeta[];
  selectedFilters: string[];
  isMobile: boolean;
  asideOpen: boolean;
}>();

defineEmits<{
  'filters-change': [value: AcceptableValue[]];
  'aside-open-change': [value: boolean];
  reselect: [];
}>();

const { img } = useAssets();
const iconUrl = (name: string) => img(`icon/${name}.svg`);

// 語意斷行（PM 0729：這兩個 label 未選前也要完整顯示，不可截斷）。
// 只列 PM 指名的兩個 11 字 label，斷點對齊 Figma「414px-MOB-stage3」＝第 7 字後。
// 未列出者交給自然換行：9 字的三個（交通事故死傷率更低／青壯年人口比率更高／
// 居住地綠地空間更大）在 414px 剛好單行，較窄機型（390／375）會自然折成兩行、
// 可能剩單字孤行——已知且刻意接受，換取 414px 基準完全對齊設計稿。
// 背景數字：卡片半欄寬且永久預留 ✕ 的 21px，label 可用寬 ＝ (viewport - 44) / 2 - 41
// → 414px 得 144px、390px 得 132px、375px 得 124.5px；15px 的 CJK 每字剛好 15px。
const LABEL_BREAK: Record<string, number> = {
  餐飲及住宿店家密度更高: 7,
  大規模崩塌災害風險更低: 7,
};
// 依斷點切成 1～2 段供逐行 span 渲染；完整字串仍用於 GA / a11y。
function labelLines(label: string): string[] {
  const at = LABEL_BREAK[label];
  return at ? [label.slice(0, at), label.slice(at)] : [label];
}

// GA：result 側欄事件（term = 條件文字／按鈕文字／區塊名）
const { gaClickOption, gaClickBtn, gaClickOpen } = useTrackingEvent();
</script>

<template>
  <CollapsibleRoot
    as="aside"
    class="lc-sr__sidebar"
    :open="isMobile ? asideOpen : true"
    :disabled="!isMobile"
    :unmount-on-hide="false"
    @update:open="$emit('aside-open-change', $event)"
  >
    <!-- MOB（<768）：整個側欄改為底部可展開 filter sheet，故用 Reka Collapsible。
         桌機 / PAD：恆開（:open=true、:disabled），CollapsibleTrigger 失效、chevron 隱藏，外觀同原側欄。
         unmount-on-hide=false：收合時保留卡片 DOM。
         ⚠ 註解須置於根元素內（頂層 HTML 註解→多根 fragment→$el 失效→click-outside 失效）。 -->
    <div class="lc-sr__sidebar-top">
      <div class="lc-sr__head">
        <!-- 標題列＝MOB 收合 sheet 的可點 bar（trigger）；reselect 另置（避免 button 巢套） -->
        <CollapsibleTrigger
          class="lc-sr__head-toggle"
          @click="isMobile && !asideOpen && gaClickOpen('條件選單')"
        >
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
        <button
          class="lc-sr__reselect"
          @click="gaClickBtn(str.reselect); $emit('reselect')"
        >
          {{ str.reselect }} ↺
        </button>
      </div>

      <CollapsibleContent class="lc-sr__cards-body">
        <CheckboxGroupRoot
          class="lc-sr__cards"
          :model-value="selectedFilters"
          @update:model-value="$emit('filters-change', $event)"
        >
          <CheckboxRoot
            v-for="f in filterIndex"
            :key="f.id"
            :value="f.id"
            class="lc-sr__card"
            @click="gaClickOption(f.label ?? f.name)"
          >
            <span class="lc-sr__card-label">
              <span
                v-for="(line, i) in labelLines(f.label ?? f.name)"
                :key="i"
                class="lc-sr__card-line"
                >{{ line }}</span
              >
            </span>
            <!-- 圖示用 button_close（X circle）。force-mount：未勾選時也保留 DOM 佔位，
                 僅以 CSS（[data-state='unchecked'] → visibility:hidden）隱藏。
                 若讓它照預設「勾選才 render」，label 的可用寬度會在勾選瞬間少 21px，
                 長 label 就會從 2 行重排／被截斷 —— 卡片文字與高度都會跳動。 -->
            <CheckboxIndicator force-mount class="lc-sr__card-x">
              <img :src="iconUrl('button_close')" alt="" />
            </CheckboxIndicator>
          </CheckboxRoot>
        </CheckboxGroupRoot>
      </CollapsibleContent>
    </div>

    <div class="lc-sr__banners">
      <a
        class="lc-sr__banner lc-sr__banner--data"
        :href="str.banner1Link"
        target="_blank"
        rel="noopener"
        @click="gaClickBtn(str.banner1Title + ' ' + str.banner1Sub)"
      >
        <!-- 標題：MOB/PAD 用精簡文案、PC 用完整標題＋副標，兩者以 CSS 切換（同 step 2 title-pc/-mob 作法） -->
        <span class="lc-sr__banner-text"
          ><span class="lc-sr__banner-title--mob">{{
            str.banner1TitleMob
          }}</span
          ><span class="lc-sr__banner-title--pc">{{ str.banner1Title }}</span>
          <span class="lc-sr__banner-sub">{{ str.banner1Sub }}</span></span
        >
        <span class="lc-sr__banner-icon"
          ><img :src="iconUrl('button_external_link')" alt=""
        /></span>
      </a>
      <a
        class="lc-sr__banner lc-sr__banner--report"
        :href="str.banner2Link"
        target="_blank"
        rel="noopener"
        @click="gaClickBtn(str.banner2Title + ' ' + str.banner2Sub)"
      >
        <span class="lc-sr__banner-text"
          ><span class="lc-sr__banner-title--mob">{{
            str.banner2TitleMob
          }}</span
          ><span class="lc-sr__banner-title--pc">{{ str.banner2Title }}</span>
          <span class="lc-sr__banner-sub">{{ str.banner2Sub }}</span></span
        >
        <span class="lc-sr__banner-icon"
          ><img :src="iconUrl('button_external_link')" alt=""
        /></span>
      </a>
    </div>
  </CollapsibleRoot>
</template>
