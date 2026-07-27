<script setup lang="ts">
import { NmdAuthor } from '@udn-digital-center/common-components';

// team：以職稱為 key、姓名為 value（NmdAuthor 的 slot 名稱＝職稱，內容為姓名）
defineProps<{ team: Record<string, string> }>();
</script>

<template>
  <!-- info-editor 製作團隊；底色對齊 Figma black/B6 #f1f1f1，
       表格排版由 NmdAuthor 的 .author-grid 樣式負責 -->
  <div class="lc-ie">
    <NmdAuthor>
      <template #統籌製作>{{ team.統籌製作 }}</template>
      <template #視覺設計>{{ team.視覺設計 }}</template>
      <template #工程>{{ team.工程 }}</template>
      <template #監製>{{ team.監製 }}</template>
      <template #製作單位>{{ team.製作單位 }}</template>
      <template #上線日期>{{ team.上線日期 }}</template>
    </NmdAuthor>
  </div>
</template>

<!-- 非 scoped：本元件渲染於 Dialog portal 內（teleport 至 <body>），scoped 屬性套不到 -->
<style lang="scss">
// info-editor（製作團隊；底色接續頁尾，與分享列同為 #f1f1f1）
.lc-ie {
  padding: 40px 20px 0;
  background: var(--c-surface-sunken);
}
</style>
