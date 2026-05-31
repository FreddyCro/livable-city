<script setup lang="ts">
import { computed } from 'vue';
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
  <div class="lc-sl">
    <!-- <div class="lc-sl__hero">
      <p class="lc-sl__kicker">{{ str.kicker }}</p>
      <h1 class="lc-sl__title">{{ str.title }}</h1>
      <p class="lc-sl__subtitle">{{ str.subtitle }}</p>
    </div>
    <p class="lc-sl__intro">{{ str.intro }}</p>
    <p class="lc-sl__question">{{ str.question }}</p> -->
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
    <button :disabled="!townCode" @click="$emit('next')" class="lc-sl__next">
      {{ str.next }} ▶
    </button>
  </div>
</template>

<style scoped lang="scss">
// step-location
.lc-sl {
  position: fixed;
  inset: 0;
  background: var(--c-surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  z-index: 10;
  padding: 24px;
  text-align: center;

  // step-location__hero
  &__hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  // step-location__kicker
  &__kicker {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 2px;
    color: var(--c-text);
  }

  // step-location__title
  &__title {
    margin: 0;
    font-size: 48px;
    font-weight: 800;
    line-height: 1.1;
    color: var(--c-text);
  }

  // step-location__subtitle
  &__subtitle {
    margin: 0;
    padding: 2px 8px;
    font-size: 18px;
    font-weight: 600;
    color: var(--c-text);
    background: var(--c-primary);
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
}
</style>
