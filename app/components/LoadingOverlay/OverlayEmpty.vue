<script setup lang="ts">
// 2.5c / 3.7 無結果視窗：inline SVG（放大鏡 → 圈中紅 X 的變形）+ 標題 + 說明。
// 純呈現：關閉鈕（✕）與「點外部關閉」由外層 LoadingOverlay.vue 統一處理。
// 為何 inline：要驅動 SVG「內部」形變（圈框放大、手柄滑入圈中變 X），
// <img> 外部檔是不透明盒子、外層 CSS 觸不到內部 path，故改 inline 由元件 CSS 帶動。
// 幾何取自 public/img/overlay/enlarger.svg（放大鏡）與 empty.svg（圈中 X）。
// 樣式與 @keyframes 集中於 LoadingOverlay.vue（non-scoped）。
import str from '../../locales/explore.json';
</script>

<template>
  <div class="lc-lo__window lc-lo__window--empty">
    <svg
      class="lc-lo__empty-fig"
      viewBox="0 0 68 68"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <!-- 放大鏡框 / 無結果圈（morph 期間 scale 放大） -->
      <g class="lc-lo__empty-ring">
        <circle cx="34" cy="34" r="30" fill="#227D92" stroke="#000" stroke-width="0.5" />
        <circle cx="34" cy="34" r="25" fill="#fff" stroke="#000" stroke-width="0.5" />
      </g>
      <!-- 放大鏡手柄 →（滑入圈中變）X 的「\」筆畫：起始在圈外、teal、縮小 -->
      <!-- non-scaling-stroke：手柄用 scale(0.42) 縮短，但筆畫粗細不隨之縮，全程維持 5.5（見 morph 回饋 #2） -->
      <line
        class="lc-lo__empty-slash"
        x1="21"
        y1="21"
        x2="47"
        y2="47"
        stroke="#227D92"
        stroke-width="5.5"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
      />
      <!-- X 的「/」筆畫：morph 後段以 stroke-dashoffset 畫入 -->
      <!-- 同加 non-scaling-stroke，確保終態 X 兩筆等寬（不受 viewBox 縮放差異影響） -->
      <line
        class="lc-lo__empty-cross"
        x1="47"
        y1="21"
        x2="21"
        y2="47"
        stroke="#D62E29"
        stroke-width="5.5"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>
    <p class="lc-lo__title">{{ str.emptyTitle }}</p>
    <p class="lc-lo__hint">{{ str.emptyHint }}</p>
  </div>
</template>
