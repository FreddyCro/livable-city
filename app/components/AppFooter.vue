<script setup lang="ts">
import { NmdShare, NmdFooter } from '@udn-digital-center/common-components';
import dataSource from '../locales/dataSource.json';
import { shareURL_fb, shareURL_line, shareURL_twitter } from '../utils/share';
import InfoEditor from './InfoEditor.vue';
</script>

<template>
  <footer class="lc-af">
    <!-- 製作團隊（獨立元件） -->
    <InfoEditor :team="dataSource.team" />

    <!-- 分享本頁（NmdShare；網址來自 utils/share，依裝置切換 line 分享）。
         ClientOnly：分享網址含 navigator 偵測，避免 SSR/CSR hydration 不一致 -->
    <ClientOnly>
      <div class="lc-af__share">
        <NmdShare
          :facebook="{ href: shareURL_fb }"
          :line="{ href: shareURL_line, target: '_blank' }"
          :twitter="{ href: shareURL_twitter }"
          twitter-icon="x"
        />
      </div>
    </ClientOnly>

    <!-- 版權 + 聯合報官方社群連結（元件自帶深色底與年份） -->
    <NmdFooter />
  </footer>
</template>

<!-- 非 scoped：目前由 InfoContent 渲染於 Dialog portal（teleport 至 <body>），
     沿用相鄰 InfoContent 的做法；class 已以 lc-af 命名空間隔離。 -->
<style lang="scss">
// app-footer
.lc-af {
  // app-footer__share（分享本頁按鈕列；底色接續製作團隊的淺灰）
  &__share {
    display: flex;
    justify-content: center;
    gap: 20px;
    padding: 50px 0;
    background: var(--c-surface-sunken);
  }
}
</style>
