<script setup lang="ts">
// 3.1 explore-sidebar：左側篩選欄（filter 卡片 + banners）。
// 純呈現元件；開合狀態（asideOpen）、勾選值（selectedFilters）由 StepResult 統籌，
// 透過 props 傳入、events 傳出（click-outside 收合亦由 parent 掛 ref 到本元件根）。
import type { AcceptableValue } from 'reka-ui';
import str from '../../locales/explore.json';
import type { FilterMeta } from '../../types/filter';
import { useAssets } from '../../composables/useAssets';

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
          @update:model-value="$emit('filters-change', $event)"
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
          ><img :src="iconUrl('button_external_link')" alt=""
        /></span>
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
          ><img :src="iconUrl('button_external_link')" alt=""
        /></span>
      </a>
    </div>
  </CollapsibleRoot>
</template>
