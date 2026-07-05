<script setup lang="ts">
// 轉場 / 載入浮動視窗的「殼」（wireflow §2.5 + 3.6/3.7）：
// 負責 .lc-lo 容器 + dim 遮罩，依 variant 切換三個內容子元件（各自持有外部 SVG + 自走 CSS 動畫）。
// 由 app.vue 統一控制（介面不變：variant / dim / count / @close）。
// 樣式 non-scoped 共用：scoped 無法穿透子元件內部 DOM，class 皆在 lc-lo 命名空間下、無外洩風險。
import OverlayLoading from './OverlayLoading.vue';
import OverlayResultCount from './OverlayResultCount.vue';
import OverlayEmpty from './OverlayEmpty.vue';

defineProps<{
  variant: 'loading' | 'result-count' | 'empty';
  dim?: boolean;
  count?: number;
}>();
defineEmits<{ close: [] }>();
</script>

<template>
  <div class="lc-lo" :class="{ 'lc-lo--dim': dim }">
    <OverlayLoading v-if="variant === 'loading'" />
    <OverlayResultCount
      v-else-if="variant === 'result-count'"
      :count="count"
      @close="$emit('close')"
    />
    <OverlayEmpty v-else @close="$emit('close')" />
  </div>
</template>

<!-- non-scoped：三個變體子元件的內部 DOM 需共用 .lc-lo__* 樣式，scoped 套不進去；class 已命名空間隔離 -->
<style lang="scss">
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
    gap: 12px;
    min-height: 200px;
    padding: 30px 40px;
    border: 0.5px solid var(--c-line-main); // 主線條 #403a2c
    border-radius: 20px;
    background: rgb(255 255 255 / 0.95);
    backdrop-filter: blur(2px);
    text-align: center;

    &--loading {
      width: 190px;
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

  // ── loading figure：台灣輪廓（tw，靜態）+ 放大鏡（enlarger，旋轉）───────
  &__loading-fig {
    position: relative;
    width: 104px;
    height: 96px;
  }

  &__tw {
    position: absolute;
    left: 2px;
    top: 3px;
    height: 90px;
    width: auto;
  }

  &__enlarger {
    position: absolute;
    right: 0;
    top: 14px;
    width: 66px;
    height: auto;
    // 小範圍「公轉」：放大鏡本身不自轉，中心沿小圓周移動（掃描感）。
    // 技巧：rotate(θ) translateX(R) rotate(-θ) → 位移繞圈但保持直立；R = 公轉半徑（小）。
    animation: lc-lo-orbit 2s linear infinite;
  }

  // ── result-count figure：折疊地圖（map，靜態）+ 定位 pin（上下浮動）─────
  &__result-fig {
    position: relative;
    width: 84px;
    height: 78px;
  }

  &__map {
    display: block;
    width: 84px;
    height: auto;
    margin-top: 8px;
  }

  &__pin {
    position: absolute;
    left: 50%;
    top: -4px;
    width: 34px;
    height: auto;
    animation: lc-lo-bob 1.1s ease-in-out infinite;
  }

  // ── empty figure（外部 SVG，靜態）──────────────────────────────
  &__empty-fig {
    width: auto;
    height: 84px;
    max-width: 140px;
  }

  // 尊重減少動態偏好：關閉自走動畫
  @media (prefers-reduced-motion: reduce) {
    .lc-lo__enlarger,
    .lc-lo__pin {
      animation: none;
    }
  }
}

// 放大鏡小範圍公轉（不自轉，保持直立）；R=7px 為公轉半徑，調大即擴大繞行範圍
@keyframes lc-lo-orbit {
  from {
    transform: rotate(0deg) translateX(7px) rotate(0deg);
  }
  to {
    transform: rotate(360deg) translateX(7px) rotate(-360deg);
  }
}

// pin 上下浮動（保留 translateX(-50%) 置中）
@keyframes lc-lo-bob {
  0%,
  100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(-8px);
  }
}
</style>
