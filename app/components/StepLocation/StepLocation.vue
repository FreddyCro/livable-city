<script setup lang="ts">
import str from '../../locales/locate.json';
import { useAssets } from '../../composables/useAssets';
import { useStepLocation, type StepLocationProps } from './StepLocation.logic';

const props = defineProps<StepLocationProps>();
const emit = defineEmits<{
  'update:countyCode': [value: string];
  'update:townCode': [value: string];
  next: [];
}>();

// 主視覺三斷點圖檔（presentational；於 setup 期算一次，不必每次 render 重組字串）。
const { img } = useAssets();
const visualSrc = {
  pc: img('step1-visual-pc.png'),
  pad: img('step1-visual-pad.png'),
  mob: img('step1-visual-mob.png'),
};

// view 邏輯抽至 co-located 的 StepLocation.logic.ts（單一元件專用）。
const {
  revealed,
  reveal,
  onWheel,
  onTouchStart,
  onTouchMove,
  countyOptions,
  townOptions,
  onCountySelect,
} = useStepLocation(props, emit);
</script>

<template>
  <div
    class="lc-sl"
    :class="{ 'lc-sl--revealed': revealed }"
    @wheel.passive="onWheel"
    @touchstart.passive="onTouchStart"
    @touchmove.passive="onTouchMove"
  >
    <!-- ── 固定標題（step 1-1／1-2 共用，切換時不動、不淡出）──── -->
    <header class="lc-sl__title lc-sl__title--top">
      <span class="lc-sl__badge">{{ str.badge }}</span>
      <h1 class="lc-sl__heading">{{ str.heading }}</h1>
    </header>

    <!-- ── step 1-1：首屏主視覺（標題下方）──────────────── -->
    <div class="lc-sl__visual-layer">
      <!-- 主視覺插圖（含房價／公托／公園綠地等數據標註，依斷點換圖） -->
      <picture class="lc-sl__visual">
        <source media="(min-width: 1024px)" :srcset="visualSrc.pc" />
        <source media="(min-width: 768px)" :srcset="visualSrc.pad" />
        <img :src="visualSrc.mob" alt="" />
      </picture>

      <!-- 下滑提示（手機／平板置中下方；電腦靠右） -->
      <button type="button" class="lc-sl__scroll-hint" @click="reveal">
        <span class="lc-sl__scroll-hint-text">{{ str.scrollHint }}</span>
        <span class="lc-sl__scroll-hint-line" aria-hidden="true"></span>
      </button>
    </div>

    <!-- ── step 1-2：內文＋表單（標題下方）──────────────── -->
    <div class="lc-sl__form-layer">
      <div class="lc-sl__content">
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
            type="button"
            class="lc-sl__next"
            :disabled="!townCode"
            @click="$emit('next')"
          >
            <span>{{ str.next }}</span>
            <UiIconArrowCircle />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./StepLocation.scss"></style>
