<script setup lang="ts">
import { NmdShare, NmdFooter } from '@udn-digital-center/common-components';
import dataSource from '../locales/dataSource.json';
import { shareURL_fb, shareURL_line, shareURL_twitter } from '../utils/share';
import InfoEditor from './InfoEditor.vue';
</script>

<template>
  <!-- info 資料來源說明（多根：直接作為 DialogContent 的子節點，維持其 flex column 版面）。
       DialogTitle / DialogDescription / DialogClose 透過 DialogRoot 的 inject 取得上下文，
       跨元件仍可運作。dialog box 本身無內距，水平內距由各區塊自負，footer 才能滿版。 -->
  <DialogTitle class="lc-info__title">{{ dataSource.title }}</DialogTitle>
  <hr class="lc-info__rule" />
  <div class="lc-info__body">
    <DialogDescription class="lc-info__intro">{{
      dataSource.intro
    }}</DialogDescription>

    <template v-for="(s, i) in dataSource.sections" :key="i">
      <hr class="lc-info__rule lc-info__rule--thin" />
      <section class="lc-info__source">
        <h3 class="lc-info__source-title">{{ s.title }}</h3>
        <p class="lc-info__source-text">
          <!-- prettier-ignore -->
          <span>{{ s.before }}</span><a
            v-if="s.link"
            class="lc-info__source-link"
            :href="s.link.url"
            target="_blank"
            rel="noopener"
          >{{ s.link.label }}</a><span v-if="s.after">{{ s.after }}</span>
        </p>
        <p v-if="s.extra" class="lc-info__source-text">{{ s.extra }}</p>
        <p v-if="s.note" class="lc-info__source-note">{{ s.note }}</p>
      </section>
    </template>

    <!-- 頁尾（滿版）：製作團隊 + 分享本頁 + 版權／官方社群 -->
    <footer class="lc-info__foot">
      <!-- 製作團隊（獨立元件） -->
      <InfoEditor :team="dataSource.team" />

      <!-- 分享本頁（NmdShare；網址來自 utils/share，依裝置切換 line 分享）。
           ClientOnly：分享網址含 navigator 偵測，避免 SSR/CSR hydration 不一致 -->
      <ClientOnly>
        <div class="lc-info__share">
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
  </div>
  <DialogClose class="lc-info__close" aria-label="關閉">✕</DialogClose>
</template>

<!-- 非 scoped：本元件渲染於 Dialog portal 內（teleport 至 <body>），scoped 屬性套不到；
     class 已以 lc-info 命名空間隔離。 -->
<style lang="scss">
// info（資料來源說明 dialog 內容）
.lc-info {
  // info__title（pc/pc_H3：Noto Sans TC Bold 20/32，置中）
  &__title {
    flex-shrink: 0;
    margin: 0;
    padding: 20px 20px 0;
    font-size: 20px;
    font-weight: 700;
    line-height: 32px;
    text-align: center;
    color: var(--c-text);
  }

  // info__rule（標題下分隔線；--thin 為段落間細線）
  &__rule {
    flex-shrink: 0;
    margin: 10px 20px;
    border: none;
    border-top: 1px solid var(--c-line-primary);

    // info__rule--thin（段落間細線，無左右內縮、貼齊 body 內距）
    &--thin {
      margin: 0;
      border-top: 0.5px solid var(--c-line-secondary);
    }
  }

  // info__body（捲動區；水平內距 20px，footer 以負邊距滿版）
  &__body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 0 20px;
  }

  // info__intro（前言）
  &__intro {
    margin: 0;
    font-size: 15px;
    line-height: 22px;
    color: var(--c-text);
  }

  // info__source（單一指標來源段落）
  &__source {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  // info__source-title（指標名稱，粗體）
  &__source-title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    line-height: 22px;
    color: var(--c-text);
  }

  // info__source-text（說明內文）
  &__source-text {
    margin: 0;
    font-size: 15px;
    line-height: 22px;
    color: var(--c-text);
  }

  // info__source-link（來源連結）
  &__source-link {
    color: var(--c-accent-teal);
    text-decoration: underline;

    &:hover {
      color: var(--c-accent-teal-dk);
    }
  }

  // info__source-note（備註，12/18 灰字）
  &__source-note {
    margin: 4px 0 0;
    font-size: 12px;
    line-height: 18px;
    color: var(--c-text-muted);
  }

  // info__foot（頁尾滿版：抵銷 body 的 20px 水平內距與底部，貼齊 dialog 邊緣）
  &__foot {
    margin: 0 -20px;
  }

  // info__share（分享本頁按鈕列；底色接續製作團隊的 #f1f1f1）
  &__share {
    display: flex;
    justify-content: center;
    gap: 20px;
    padding: 50px 0;
    background: var(--c-surface-sunken);
  }

  // info__close（右上角關閉）
  &__close {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 999px;
    background: transparent;
    font-size: 14px;
    color: var(--c-text-muted);
    cursor: pointer;

    &:hover {
      background: var(--c-surface-sunken);
    }
  }
}
</style>
