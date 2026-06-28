<script setup lang="ts">
import str from '../locales/explore.json';

// 轉場 / 載入浮動視窗（wireflow §2.5 + 3.6/3.7）。三種變體共用一張卡片：
//   loading      — 2.5a 載入視窗 / 3.6 explore-reloading（放大鏡動畫暫略，僅文字）
//   result-count — 2.5b 符合條件視窗（「全台共有 N 個…」）
//   empty        — 2.5c / 3.7 無結果視窗（紅 ✕ + 提示）
// dim=true 時整面刷暗+模糊（2.5 首次轉場）；dim=false 時僅浮卡、背景仍可互動（3.6/3.7）。
defineProps<{
  variant: 'loading' | 'result-count' | 'empty';
  dim?: boolean;
  count?: number;
}>();
defineEmits<{ close: [] }>();
</script>

<template>
  <div class="lc-lo" :class="{ 'lc-lo--dim': dim }">
    <!-- 2.5a / 3.6 載入視窗 -->
    <div v-if="variant === 'loading'" class="lc-lo__window lc-lo__window--loading">
      <!-- TODO: 放大鏡 + 台灣輪廓 loading 動畫（先不做動態） -->
      <p class="lc-lo__text">{{ str.loading }}</p>
    </div>

    <!-- 2.5b 符合條件視窗 -->
    <div v-else-if="variant === 'result-count'" class="lc-lo__window lc-lo__window--result">
      <button type="button" class="lc-lo__close" aria-label="關閉" @click="$emit('close')">✕</button>
      <!-- TODO: 地圖縮圖 + 定位 pin（先不做） -->
      <p class="lc-lo__text">
        {{ str.resultWindowPrefix }}<b>{{ count }}個</b>{{ str.resultWindowSuffix }}
      </p>
    </div>

    <!-- 2.5c / 3.7 無結果視窗 -->
    <div v-else class="lc-lo__window lc-lo__window--empty">
      <button type="button" class="lc-lo__close" aria-label="關閉" @click="$emit('close')">✕</button>
      <span class="lc-lo__error" aria-hidden="true">✕</span>
      <p class="lc-lo__title">{{ str.emptyTitle }}</p>
      <p class="lc-lo__hint">{{ str.emptyHint }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
// loading-overlay
.lc-lo {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none; // 預設不擋互動；dim 遮罩與視窗各自開啟

  // loading-overlay--dim（2.5a/b/c：背景刷暗 + 模糊）
  &--dim {
    pointer-events: auto;
    background: rgb(216 216 216 / 0.5);
    backdrop-filter: blur(5px);
  }

  // loading-overlay__window（三變體共用卡片）
  &__window {
    position: relative;
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    min-height: 200px;
    padding: 30px 40px;
    border: 0.5px solid var(--c-line-main); // 主線條 #403a2c
    border-radius: 20px;
    background: rgb(255 255 255 / 0.95);
    backdrop-filter: blur(2px);
    text-align: center;

    &--loading {
      width: 150px;
    }

    &--result {
      width: 269px;
    }

    &--empty {
      width: 260px;
    }
  }

  // loading-overlay__close（右上 ✕）
  &__close {
    position: absolute;
    top: 10px;
    right: 12px;
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--c-text-muted);
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
  }

  // loading-overlay__text（載入中 / 結果數）
  &__text {
    margin: 0;
    font-size: 18px;
    line-height: 36px;
    color: #000;

    b {
      font-weight: 700;
    }
  }

  // loading-overlay__error（無結果紅 ✕ 圓圈；暫以字元替代圖示）
  &__error {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 999px;
    background: var(--color-r01); // 紅 #d62e29
    color: #fff;
    font-size: 24px;
    line-height: 1;
  }

  // loading-overlay__title（無結果標題）
  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    line-height: 28px;
    color: #000;
  }

  // loading-overlay__hint（無結果說明）
  &__hint {
    margin: 0;
    font-size: 15px;
    line-height: 22px;
    color: var(--c-text-muted);
  }
}
</style>
