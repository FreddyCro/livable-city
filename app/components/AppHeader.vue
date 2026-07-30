<script setup lang="ts">
import {
  NmdHamburger,
  NmdHeader,
  NmdHeaderShare,
  NmdMenu,
  NmdMenuItem,
  NmdProgressbar,
} from '@udn-digital-center/common-components';
import { shareURL_fb, shareURL_line, shareURL_twitter } from '@/utils/share';
import str from '@/locales/common.json';

const menu = [
  {
    title: str.navbarMenu1Text,
    link: str.navbarMenu1Link,
    isCurrent: true,
  },
  {
    title: str.navbarMenu2Text,
    link: str.navbarMenu2Link,
  },
  {
    title: str.navbarMenu3Text,
    link: str.navbarMenu3Link,
  },
  {
    title: str.navbarMenu4Text,
    link: str.navbarMenu4Link,
  },
];
</script>

<template>
  <!-- app-header -->
  <div class="lc-hd">
    <NmdProgressbar />
    <NmdHeader>
      <ClientOnly>
        <NmdHeaderShare
          :facebook="{ href: shareURL_fb }"
          :line="{ href: shareURL_line, target: '_blank' }"
          :twitter="{ href: shareURL_twitter }"
        />
      </ClientOnly>
      <NmdHamburger />
    </NmdHeader>
    <NmdMenu>
      <NmdMenuItem
        v-for="(item, index) in menu"
        :key="index"
        :to="item.link"
        :is-current="item.isCurrent"
      >
        {{ item.title }}
      </NmdMenuItem>
    </NmdMenu>
  </div>
</template>

<style>
.nmd-header {
  background-color: var(--color-grey-0);
}

/*
 * common-components 的 .nmd-menu 是 @extend %font-serif（"Noto Serif TC",
 * source-han-serif-tc, serif）。本站主字體是 Noto Sans TC，故整個選單面板
 * （含 NmdMenuItem 與訂閱按鈕）覆寫回黑體，避免與其餘畫面不一致。
 * 非 scoped：.nmd-menu 由 vendor 元件渲染，scoped 的 data 屬性選不到。
 */
.nmd-menu {
  font-family: 'Noto Sans TC', sans-serif;
}
</style>