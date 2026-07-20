<script setup lang="ts">
// GA 事件測試元件：點按鈕送出一筆測試事件，用來驗證 GA / gtag 串接是否生效。
// 事件形狀對齊參考專案 the-love-report：action='click_btn' / category='term' / label='testing'。
// 驗證方式：GA4 realtime / DebugView，或在 devtools 觀察 window.dataLayer 的 push。
import { ref } from 'vue';
import useTrackingEvent from '../composables/useTrackingEvent';

const { sendGA } = useTrackingEvent();
const sentCount = ref(0);

function handleTestClick() {
  sendGA({ action: 'click_btn', category: 'term', label: 'testing' });
  sentCount.value += 1;
}
</script>

<template>
  <!-- test-ga -->
  <section class="lc-tga">
    <div class="lc-tga__content">
      <h2 class="lc-tga__title">GA Testing Section</h2>
      <div class="lc-tga__desc">
        <div>點擊下方按鈕送出一筆測試 GA 事件</div>
        <div>action: <strong>click_btn</strong></div>
        <div>category: <strong>term</strong></div>
        <div>label: <strong>testing</strong></div>
      </div>
      <button type="button" class="lc-tga__btn" @click="handleTestClick">
        Send GA Test Event
      </button>
      <p class="lc-tga__count">已送出：{{ sentCount }} 次</p>
    </div>
  </section>
</template>

<style lang="scss" scoped>
// test-ga（GA 事件測試區塊）
.lc-tga {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  padding: 4rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  // test-ga__content
  &__content {
    text-align: center;
    color: #fff;
  }

  // test-ga__title
  &__title {
    margin-bottom: 1rem;
    font-size: 2rem;
    font-weight: 700;
  }

  // test-ga__desc
  &__desc {
    margin-bottom: 2rem;
    font-size: 1.125rem;
    line-height: 1.8;
    opacity: 0.9;
  }

  // test-ga__btn
  &__btn {
    padding: 1rem 2rem;
    font-size: 1rem;
    font-weight: 600;
    color: #667eea;
    background: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }

  // test-ga__count
  &__count {
    margin-top: 1rem;
    font-size: 0.875rem;
    opacity: 0.85;
  }
}
</style>
