<script setup lang="ts">
// ⚙️ Dev 預覽工具：三個 overlay 狀態並排 + 重播，供調整動態時對照。
// 改用真正的 <LoadingOverlay> 殼渲染，這樣共用的 ✕（住在殼裡）也會一起出現；
// 只在下方 scoped 覆寫定位：把殼的 fixed 全螢幕改成 inline，才能三張並排。
// ✕ / 點外部會發出 close → 這裡收成「隱藏該張卡」，按「↻ 重播」還原並重播動畫。
import { reactive, ref } from 'vue';
import LoadingOverlay from './LoadingOverlay.vue';

type Variant = 'loading' | 'result-count' | 'empty';
const STAGES: { variant: Variant; tag: string }[] = [
  { variant: 'loading', tag: 'loading（2.5a / 3.6）' },
  { variant: 'result-count', tag: 'result-count（2.5b）' },
  { variant: 'empty', tag: 'empty（2.5c / 3.7）' },
];

// ++ 即 remount 全部、重播一次性動畫（empty morph 為 one-shot，靠這個重看）。
const replayKey = ref(0);
const closed = reactive<Record<Variant, boolean>>({
  loading: false,
  'result-count': false,
  empty: false,
});

function replay() {
  (Object.keys(closed) as Variant[]).forEach((k) => (closed[k] = false));
  replayKey.value++;
}
</script>

<template>
  <div class="lc-lop">
    <div class="lc-lop__bar">
      <span class="lc-lop__title">Overlay 預覽</span>
      <button type="button" class="lc-lop__btn" @click="replay">↻ 重播動畫</button>
    </div>
    <div class="lc-lop__row">
      <div v-for="s in STAGES" :key="s.variant" class="lc-lop__cell">
        <span class="lc-lop__tag">{{ s.tag }}</span>
        <LoadingOverlay
          v-if="!closed[s.variant]"
          :key="`${s.variant}${replayKey}`"
          class="lc-lop__stage"
          :variant="s.variant"
          :count="8"
          @close="closed[s.variant] = true"
        />
        <button v-else type="button" class="lc-lop__btn" @click="closed[s.variant] = false">
          已關閉，點此還原
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
// loading-overlay-preview（dev 工具）
.lc-lop {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 9999;
  padding: 12px 24px 24px;
  background: rgb(238 238 238 / 0.96);
  border-bottom: 1px solid #ccc;
  overflow-x: auto;

  // loading-overlay-preview__bar（頂部工具列）
  &__bar {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 12px;
  }

  // loading-overlay-preview__title
  &__title {
    font-size: 13px;
    font-weight: 700;
    color: #333;
  }

  // loading-overlay-preview__btn（重播 / 還原）
  &__btn {
    padding: 6px 14px;
    border: 1px solid #888;
    border-radius: 8px;
    background: #fff;
    font-size: 13px;
    cursor: pointer;
  }

  // loading-overlay-preview__row（三狀態並排）
  &__row {
    display: flex;
    gap: 24px;
    align-items: flex-start;
    justify-content: center;
    min-width: max-content;
  }

  // loading-overlay-preview__cell（單一狀態 + 標籤）
  &__cell {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
  }

  // loading-overlay-preview__tag
  &__tag {
    font-size: 12px;
    color: #555;
  }

  // loading-overlay-preview__stage：把 <LoadingOverlay> 殼（.lc-lo）從 fixed 全螢幕改為 inline，才能三張並排
  // padding: 0 抵銷 --float（非 dim）的地圖區內縮，否則預覽被 sidebar 寬的左內縮撐開
  &__stage.lc-lo {
    position: static;
    inset: auto;
    padding: 0;
    pointer-events: auto;
  }
}
</style>
