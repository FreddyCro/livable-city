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
</style>