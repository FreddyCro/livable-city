<script setup lang="ts">
// next-button（CTA 膠囊鈕）：文字 + 圓框箭頭，step1「下一步」/ step2「查看結果」共用。
// 停用時轉描邊幽靈樣式並隱藏箭頭。寬度/版位由消費端容器決定（本元件預設 width:100%）。
// click 透過原生 <button> 屬性 fallthrough 給消費端，不另外宣告 emit。
defineProps<{
  label: string;
  disabled?: boolean;
}>();
</script>

<template>
  <button type="button" class="lc-nb" :disabled="disabled">
    <span class="lc-nb__label">{{ label }}</span>
    <UiIconArrowCircle v-if="!disabled" />
  </button>
</template>

<style scoped lang="scss">
// next-button
.lc-nb {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 100%;
  height: 50px;
  border: none;
  border-radius: 50px;
  background: $color-y01; // Y01 #f4cc34
  font-size: 18px;
  line-height: 28px;
  color: #000;
  cursor: pointer;
  transition:
    background 0.2s,
    border-color 0.2s,
    color 0.2s;

  @include rwd-min(pc) {
    height: 60px;
  }

  // next-button（停用）：描邊幽靈樣式（箭頭隱藏見 template v-if）
  &:disabled {
    cursor: default;
    border: 0.5px solid rgba(0, 0, 0, 0.4);
    background: transparent;
    color: rgba(0, 0, 0, 0.4);
  }
}
</style>
