<script setup lang="ts">
import str from '../../locales/locate.json';
import { useStepLocation, type StepLocationProps } from './StepLocation.logic';

const props = defineProps<StepLocationProps>();
const emit = defineEmits<{
  'update:countyCode': [value: string];
  'update:townCode': [value: string];
  next: [];
}>();

// view 邏輯（含主視覺影片斷點換片）抽至 co-located 的 StepLocation.logic.ts。
const {
  revealed,
  reveal,
  onWheel,
  onTouchStart,
  onTouchMove,
  countyOptions,
  townOptions,
  onCountySelect,
  visualVideo,
  onVisualEnded,
  activeVideo,
  activePoster,
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
      <!-- 主視覺背景影片（依斷點換片，resize 跨斷點重載；poster 沿用插圖、object-fit 裁切置中） -->
      <video
        ref="visualVideo"
        class="lc-sl__visual"
        autoplay
        muted
        playsinline
        :poster="activePoster"
        @ended="onVisualEnded"
      >
        <source :src="activeVideo.webm" type="video/webm" />
        <source :src="activeVideo.mp4" type="video/mp4" />
      </video>

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
