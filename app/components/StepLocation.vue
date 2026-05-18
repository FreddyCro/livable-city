<template>
  <div class="step-location">
    <div class="location-selects">
      <div class="select-wrapper">
        <select :value="countyCode" @change="onCountyChange" class="location-select">
          <option value="">縣市</option>
          <option v-for="c in countyList" :key="c.code" :value="c.code">{{ c.name }}</option>
        </select>
        <span class="arrow">△</span>
      </div>
      <div class="select-wrapper">
        <select
          :value="townCode"
          @change="$emit('update:townCode', ($event.target as HTMLSelectElement).value)"
          :disabled="!countyCode"
          class="location-select"
        >
          <option value="">鄉鎮市區</option>
          <option v-for="t in filteredTowns" :key="t.code" :value="t.code">{{ t.name }}</option>
        </select>
        <span class="arrow">△</span>
      </div>
    </div>
    <button :disabled="!townCode" @click="$emit('next')" class="btn-next">
      下一步 ▶
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  meta: any
  countyCode: string
  townCode: string
}>()

const emit = defineEmits<{
  'update:countyCode': [value: string]
  'update:townCode': [value: string]
  'next': []
}>()

const countyList = computed(() => {
  if (!props.meta) return []
  return Object.entries<any>(props.meta.counties)
    .map(([code, info]) => ({ code, name: info.COUNTYNAME }))
})

const filteredTowns = computed(() => {
  if (!props.meta || !props.countyCode) return []
  return Object.entries<any>(props.meta.towns)
    .filter(([, info]) => info.COUNTYCODE === props.countyCode)
    .map(([code, info]) => ({ code, name: info.TOWNNAME }))
})

function onCountyChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value
  emit('update:countyCode', val)
  emit('update:townCode', '')
}
</script>

<style scoped>
.step-location {
  position: fixed;
  inset: 0;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  z-index: 10;
}

.location-selects {
  display: flex;
  gap: 12px;
}

.select-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.location-select {
  appearance: none;
  padding: 10px 36px 10px 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
  min-width: 140px;
  cursor: pointer;
}

.location-select:disabled {
  color: #aaa;
  cursor: default;
}

.arrow {
  position: absolute;
  right: 12px;
  font-size: 10px;
  color: #888;
  pointer-events: none;
}

.btn-next {
  padding: 12px 32px;
  background: #111;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-next:disabled {
  opacity: 0.35;
  cursor: default;
}
</style>
