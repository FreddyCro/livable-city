<script setup lang="ts">
// 圓框右箭頭圖示（CTA 主按鈕共用：step1 下一步 / step2 查看結果）。
// 顏色用 currentColor，跟隨按鈕文字色。
</script>

<template>
  <svg class="lc-ic-arrow" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <circle cx="9" cy="9" r="8" stroke="currentColor" stroke-width="1" />
    <path
      d="M7.5 6 11 9l-3.5 3"
      stroke="currentColor"
      stroke-width="1"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<style scoped lang="scss">
// icon-arrow-circle
.lc-ic-arrow {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
</style>
