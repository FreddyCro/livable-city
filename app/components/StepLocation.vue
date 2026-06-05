<script setup lang="ts">
import { computed, ref } from 'vue';
import str from '../locales/locate.json';
import type { GeoMeta } from '../types/geo';

const props = defineProps<{
  meta: GeoMeta | null;
  countyCode: string;
  townCode: string;
}>();

const emit = defineEmits<{
  'update:countyCode': [value: string];
  'update:townCode': [value: string];
  next: [];
}>();

// 兩階段：false = 主視覺（階段 1），true = 內文＋表單（階段 2）。可逆。
const revealed = ref(false);
function reveal() {
  revealed.value = true;
}
function collapse() {
  revealed.value = false;
}

// 滾輪：向下展開、向上收回。lock 避免單一手勢的連續事件造成抖動。
let wheelLock = false;
function onWheel(e: WheelEvent) {
  if (wheelLock || Math.abs(e.deltaY) < 8) return;
  // 在下拉選單內滾動時不切換階段，避免操作 select 時誤觸回主視覺
  if ((e.target as HTMLElement | null)?.closest?.('.lc-sd')) return;
  wheelLock = true;
  setTimeout(() => (wheelLock = false), 500);
  e.deltaY > 0 ? reveal() : collapse();
}

// 觸控：上滑展開、下滑收回（行動裝置等同滾動）
let touchStartY = 0;
function onTouchStart(e: TouchEvent) {
  touchStartY = e.touches[0]?.clientY ?? 0;
}
function onTouchMove(e: TouchEvent) {
  const dy = touchStartY - (e.touches[0]?.clientY ?? 0);
  if (Math.abs(dy) < 30) return;
  dy > 0 ? reveal() : collapse();
}

const countyOptions = computed(() => {
  if (!props.meta) return [];
  return Object.entries(props.meta.counties).map(([code, info]) => ({
    value: code,
    label: info.COUNTYNAME,
  }));
});

const townOptions = computed(() => {
  if (!props.meta || !props.countyCode) return [];
  return Object.entries(props.meta.towns)
    .filter(([, info]) => info.COUNTYCODE === props.countyCode)
    .map(([code, info]) => ({ value: code, label: info.TOWNNAME }));
});

function onCountySelect(val: string) {
  emit('update:countyCode', val);
  emit('update:townCode', '');
}
</script>

<template>
  <div
    class="lc-sl"
    :class="{ 'lc-sl--revealed': revealed }"
    @wheel.passive="onWheel"
    @touchstart.passive="onTouchStart"
    @touchmove.passive="onTouchMove"
  >
    <!-- 1 標題（兩階段皆顯示） -->
    <header class="lc-sl__header">
      <span class="lc-sl__badge">{{ str.badge }}</span>
      <h1 class="lc-sl__heading">{{ str.heading }}</h1>
    </header>

    <!-- 兩階段疊放於同一格，靠 class 切換做 fade / slide -->
    <div class="lc-sl__stage">
      <!-- 階段 1：2 主視覺 + 3 下滑提示 -->
      <div class="lc-sl__visual-layer">
        <button
          type="button"
          class="lc-sl__visual"
          @click="reveal"
        >
          {{ str.visualPlaceholder }}
        </button>
        <button type="button" class="lc-sl__scroll-hint" @click="reveal">
          <span>{{ str.scrollHint }}</span>
          <span class="lc-sl__scroll-hint-arrow" aria-hidden="true">↓</span>
        </button>
      </div>

      <!-- 階段 2：4 內文 + 5 表單（兩塊分別 slide up，錯開時間） -->
      <div class="lc-sl__form-layer">
        <p class="lc-sl__intro">{{ str.intro }}</p>
        <div class="lc-sl__form">
          <p class="lc-sl__question">{{ str.question }}</p>
          <div class="lc-sl__selects">
            <UiSelectDropdown
              :model-value="countyCode || null"
              :options="countyOptions"
              :placeholder="str.countyPlaceholder"
              @update:model-value="onCountySelect"
            />
            <UiSelectDropdown
              :model-value="townCode || null"
              :options="townOptions"
              :placeholder="str.townPlaceholder"
              :disabled="!countyCode"
              @update:model-value="$emit('update:townCode', $event)"
            />
          </div>
          <button
            :disabled="!townCode"
            @click="$emit('next')"
            class="lc-sl__next"
          >
            {{ str.next }} ▶
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
// step-location
.lc-sl {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 24px;
  background: var(--c-surface);
  text-align: center;
  overflow: hidden;

  // step-location__header（標題區，固定於上方、兩階段共用）
  &__header {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding-top: 32px;
  }

  // step-location__badge（膠囊標籤）
  &__badge {
    padding: 6px 16px;
    border-radius: 999px;
    background: var(--c-primary);
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 1px;
    color: var(--c-text);
  }

  // step-location__heading（主標題）
  &__heading {
    margin: 0;
    font-size: clamp(28px, 4.5vw, 44px);
    font-weight: 800;
    line-height: 1.2;
    color: var(--c-text);
  }

  // step-location__stage（兩階段疊放容器；填滿剩餘高度並置中內容）
  &__stage {
    position: relative;
    flex: 1 1 auto;
    width: 100%;
    min-height: 0;
    display: grid;
    place-items: center;
  }

  // 兩個 layer 疊在同一格，彼此覆蓋
  &__visual-layer,
  &__form-layer {
    grid-area: 1 / 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24px;
  }

  // ── 階段 1：主視覺層 ──────────────────────────────
  // step-location__visual-layer
  &__visual-layer {
    transition:
      opacity 0.45s ease,
      transform 0.45s ease;
  }

  // step-location__visual（灰底 placeholder）
  &__visual {
    display: flex;
    align-items: center;
    justify-content: center;
    width: min(560px, 80vw);
    aspect-ratio: 16 / 10;
    border: none;
    border-radius: 16px;
    background: var(--c-surface-sunken);
    color: var(--c-text-faint);
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 6px;
    cursor: pointer;
  }

  // step-location__scroll-hint（下滑提示）
  &__scroll-hint {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    border: none;
    background: transparent;
    font-size: 13px;
    color: var(--c-text-muted);
    cursor: pointer;
  }

  // step-location__scroll-hint-arrow
  &__scroll-hint-arrow {
    animation: lc-sl-bounce 1.4s ease-in-out infinite;
  }

  // ── 階段 2：內文＋表單層 ──────────────────────────
  // step-location__form-layer
  &__form-layer {
    pointer-events: none; // 收合時不可互動，展開後開啟
  }

  // 內文與表單初始狀態：下移＋透明（slide up 起點）
  &__intro,
  &__form {
    opacity: 0;
    transform: translateY(48px);
    transition:
      opacity 0.5s ease,
      transform 0.5s ease;
  }

  // step-location__intro
  &__intro {
    max-width: 720px;
    margin: 0;
    font-size: 16px;
    line-height: 1.9;
    text-align: left;
    color: var(--c-text-secondary);
  }

  // step-location__form（5：問句＋下拉＋下一步）
  &__form {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    width: min(560px, 100%);
  }

  // step-location__question
  &__question {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--c-text);
  }

  // step-location__selects
  &__selects {
    display: flex;
    gap: 12px;
    width: 100%;

    // 兩個 select 等分填滿（layout 屬於本容器，不外洩到共用的 .lc-sd）
    > * {
      flex: 1 1 0;
      min-width: 0;
    }
  }

  // step-location__next
  &__next {
    padding: 12px 32px;
    background: var(--c-surface-inverse);
    color: var(--c-text-inverse);
    border: none;
    border-radius: 6px;
    font-size: 15px;
    cursor: pointer;
    transition: opacity 0.2s;

    &:disabled {
      opacity: 0.35;
      cursor: default;
    }
  }

  // ── 展開狀態（階段 2）────────────────────────────
  // 主視覺：上移 + fade out
  &--revealed &__visual-layer {
    opacity: 0;
    transform: translateY(-48px);
    pointer-events: none;
  }

  // 表單層恢復互動
  &--revealed &__form-layer {
    pointer-events: auto;
  }

  // 內文先 slide up
  &--revealed &__intro {
    opacity: 1;
    transform: translateY(0);
    transition-delay: 0.15s;
  }

  // 表單後 slide up（與內文錯開）
  &--revealed &__form {
    opacity: 1;
    transform: translateY(0);
    transition-delay: 0.3s;
  }
}

@keyframes lc-sl-bounce {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  50% {
    transform: translateY(4px);
    opacity: 1;
  }
}

// 尊重「減少動態」偏好：關掉位移與彈跳，保留可用性
@media (prefers-reduced-motion: reduce) {
  .lc-sl__visual-layer,
  .lc-sl__intro,
  .lc-sl__form {
    transition-duration: 0.01ms;
    transform: none;
  }

  .lc-sl__scroll-hint-arrow {
    animation: none;
  }
}
</style>
