<script setup lang="ts">
// 轉場 / 載入浮動視窗的「殼」（PRD §2.5 + 3.6/3.7）：
// 負責 .lc-lo 容器 + dim 遮罩 + 共用關閉鈕（✕），依 variant 切換三個內容子元件（各自持有 SVG + 自走 CSS 動畫）。
// 關閉行為集中在此：✕ 與「點卡片外部」皆由殼發出 close；loading 無關閉鈕、亦不可點外關閉（維持自動轉場）。
// 由 app.vue 統一控制（介面不變：variant / dim / count / @close）。
// 樣式 non-scoped 共用：scoped 無法穿透子元件內部 DOM，class 皆在 lc-lo 命名空間下、無外洩風險。
import { useTemplateRef } from 'vue';
import OverlayLoading from './OverlayLoading.vue';
import OverlayResultCount from './OverlayResultCount.vue';
import OverlayEmpty from './OverlayEmpty.vue';
import { useClickOutside } from '../../composables/useClickOutside';

const props = defineProps<{
  variant: 'loading' | 'result-count' | 'empty';
  dim?: boolean;
  count?: number;
}>();
const emit = defineEmits<{ close: [] }>();

// 點卡片（.lc-lo__frame，含 ✕）以外任何地方即關閉；loading 例外（不可關）。
const frameEl = useTemplateRef<HTMLElement>('frameEl');
useClickOutside(frameEl, () => {
  if (props.variant !== 'loading') emit('close');
});
</script>

<template>
  <div class="lc-lo" :class="{ 'lc-lo--dim': dim }">
    <!-- frame：包住卡片，作為 ✕ 的定位基準與「點外部關閉」的判定範圍 -->
    <div ref="frameEl" class="lc-lo__frame">
      <OverlayLoading v-if="variant === 'loading'" />
      <OverlayResultCount
        v-else-if="variant === 'result-count'"
        :count="count"
      />
      <OverlayEmpty v-else />

      <!-- 共用關閉鈕（loading 不顯示）。要換成靜態圖片，改此處內容即可，
           例：<img :src="img('overlay/close.svg')" alt="" />（記得在 script 引入 useAssets 的 img） -->
      <button
        v-if="variant !== 'loading'"
        type="button"
        class="lc-lo__close"
        aria-label="關閉"
        @click="emit('close')"
      >
        <svg
          width="21"
          height="21"
          viewBox="0 0 21 21"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13.25 7.25L7.25 13.25M7.25 7.25L13.25 13.25M20.25 10.25C20.25 15.7728 15.7728 20.25 10.25 20.25C4.72715 20.25 0.25 15.7728 0.25 10.25C0.25 4.72715 4.72715 0.25 10.25 0.25C15.7728 0.25 20.25 4.72715 20.25 10.25Z"
            stroke="#1E1E1E"
            stroke-width="0.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
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

  // loading-overlay__frame（包卡片：✕ 的定位基準 + 點外關閉判定範圍）
  // 為 .lc-lo 唯一的 flex 子元素，尺寸即卡片大小，故 ✕（absolute）對齊卡片右上角。
  &__frame {
    position: relative;
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
    padding: 20px 40px;
    border: 0.5px solid var(--c-line-main); // 主線條 #403a2c
    border-radius: 20px;
    background: rgb(255 255 255 / 0.95);
    backdrop-filter: blur(2px);
    text-align: center;

    &--loading {
      width: 150px;
      padding: 20px 30px;
    }

    &--result {
      width: 270px;
    }

    &--empty {
      width: 270px;
    }
  }

  // loading-overlay__close（右上 ✕；由殼渲染、定位基準為 .lc-lo__frame）
  &__close {
    position: absolute;
    top: 10px;
    right: 12px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background: transparent;
    cursor: pointer;
    pointer-events: auto; // 非 dim（3.7）時 .lc-lo 為 none，需自行開啟才可點
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
    width: 78px;
    height: 88px;
  }

  &__tw {
    position: absolute;
    left: 2px;
    top: 3px;
    width: 46px;
  }

  &__enlarger {
    position: absolute;
    right: 0;
    top: 14px;
    width: 48px;
    // 小範圍「公轉」：放大鏡本身不自轉，中心沿小圓周移動（掃描感）。
    // 技巧：rotate(θ) translateX(R) rotate(-θ) → 位移繞圈但保持直立；R = 公轉半徑（小）。
    animation: lc-lo-orbit 2s linear infinite;
  }

  // ── result-count figure：折疊地圖（map，靜態）+ 定位 pin（上下浮動）─────
  &__result-fig {
    position: relative;
    width: 64px;
    height: 74px;
    transform: translateY(8px); // 讓 pin 浮動時不被地圖遮住（z-index 失效）
  }

  &__map {
    display: block;
    width: 64px;
    height: auto;
    margin-top: 8px;
  }

  &__pin {
    position: absolute;
    left: 50%;
    top: -8px;
    width: 40px;
    animation: lc-lo-bob 1.1s ease-in-out infinite;
  }

  // ── empty figure（inline SVG：放大鏡 → 圈中紅 X 的變形）──────────────
  &__empty-fig {
    width: 60px;
    height: 60px;
  }

  // empty morph 三軌共用起始停留：delay 1s + both fill → 先定住初始（放大鏡）畫面
  // 一段時間讓使用者看清初始狀態，再開始 morph（見回饋 #1）。三軌 delay 必須一致以保持同步。

  // empty__ring：圈框（morph 期間 scale 由 0.86 放大到 1）
  &__empty-ring {
    transform-box: fill-box;
    transform-origin: center;
    animation: lc-lo-empty-ring 1s ease 0.5s both;
  }

  // empty__slash：手柄 →「\」筆畫（圈外 teal 縮小 → 滑入圈中置中、轉紅）
  &__empty-slash {
    transform-box: fill-box;
    transform-origin: center;
    animation: lc-lo-empty-slash 1s ease 0.35s both;
  }

  // empty__cross：X 的「/」筆畫（後段以 stroke-dashoffset 畫入）
  &__empty-cross {
    stroke-dasharray: 37;
    stroke-dashoffset: 37;
    animation: lc-lo-empty-cross 1s ease 0.5s both;
  }

  // 尊重減少動態偏好：關閉自走動畫；empty 直接定格在「圈中紅 X」終態
  @media (prefers-reduced-motion: reduce) {
    .lc-lo__enlarger,
    .lc-lo__pin {
      animation: none;
    }
    .lc-lo__empty-ring {
      animation: none;
      transform: none;
    }
    .lc-lo__empty-slash {
      animation: none;
      transform: none;
      stroke: #d62e29;
    }
    .lc-lo__empty-cross {
      animation: none;
      stroke-dashoffset: 0;
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

// ── empty morph：放大鏡 → 圈中紅 X（三段各自時序，one-shot 定格終態）──────
// 圈框放大（0.86 → 1）
@keyframes lc-lo-empty-ring {
  0% {
    transform: scale(0.86);
  }
  55%,
  100% {
    transform: scale(1);
  }
}

// 手柄（圈外、縮小、teal）滑入圈中 →「\」筆畫（置中、原尺寸、red）
// translate(24,24) scale(0.42)：以線段自身中心 (34,34) 縮到手柄長、移到圈右下外緣銜接。
// 顏色維持 teal 到 40%，再於進圈時（40%→55%）轉紅，避免全程 teal↔red 過久的混色。
@keyframes lc-lo-empty-slash {
  0%,
  10% {
    transform: translate(24px, 24px) scale(0.42);
    stroke: #227d92;
  }
  40% {
    stroke: #227d92;
  }
  55%,
  100% {
    transform: translate(0, 0) scale(1);
    stroke: #d62e29;
  }
}

// X 的「/」筆畫後段畫入（dashoffset 37 → 0）
@keyframes lc-lo-empty-cross {
  0%,
  45% {
    stroke-dashoffset: 37;
  }
  80%,
  100% {
    stroke-dashoffset: 0;
  }
}
</style>
