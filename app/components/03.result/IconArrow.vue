<script setup lang="ts">
// 細線箭頭圖示（左／右）：箭頭頭＋水平軸線，對齊 Figma「左右按鈕」內的 Arrow 向量。
// 顏色用 currentColor，跟隨按鈕文字色（paddle hover 變白即靠此）。
defineProps<{ direction: 'prev' | 'next' }>();
</script>

<template>
  <svg
    class="lc-ic-arrow2"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="direction === 'prev' ? 'M19 12H5M12 5l-7 7 7 7' : 'M5 12h14M12 5l7 7-7 7'" />
  </svg>
</template>

<style scoped lang="scss">
// icon-arrow（線性方向箭頭，與 icon-arrow-circle 區隔）
.lc-ic-arrow2 {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
}
</style>
