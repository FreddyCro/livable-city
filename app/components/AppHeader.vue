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
 * ⚠️ 不要把 .nmd-menu 覆寫成 Noto Sans TC。
 * common-components 的 .nmd-menu 是 @extend %font-serif（"Noto Serif TC",
 * source-han-serif-tc, serif），而 Figma 的漢堡選單本來就是明體 —— vendor 預設即正解。
 * 曾為了「與本站主字體 Noto Sans TC 一致」覆寫成黑體，但那與設計稿不符：選單項目
 * （.nmd-menu__list-item）帶 font-weight: 600，覆寫成 sans 後就渲染成黑體半粗。
 * nuxt.config.ts 的 googleFonts 早已專為這份選單載入 Noto Serif TC 600（見該檔註解）。
 */
</style>