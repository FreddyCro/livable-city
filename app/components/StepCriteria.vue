<template>
  <div class="step-criteria">
    <!-- Left: town stats (overlays map) -->
    <div class="town-panel">
      <div class="town-location">
        你現在居住的地區
        <strong>{{ countyName }}{{ townName }}</strong>
      </div>
      <div class="town-stats">
        <div v-for="f in filterIndex" :key="f.id" class="stat-row">
          <span class="stat-label">{{ f.name }}</span>
          <span class="stat-val">{{ formatVal(filterDataCache[f.id]?.[selectedTownCode]) }}</span>
        </div>
      </div>
    </div>

    <!-- Right: indicator cards -->
    <div class="criteria-panel">
      <button class="back-btn" @click="$emit('back')">◀ 返回</button>
      <p class="criteria-title">與現在居住的地區相比，你希望搬到......的地區</p>
      <p class="criteria-hint">請選擇你最重視（或想改善）的居住條件</p>
      <div class="card-grid">
        <div
          v-for="f in filterIndex"
          :key="f.id"
          class="criteria-card"
          :class="{ selected: selectedFilters.includes(f.id) }"
          @click="toggleFilter(f.id)"
        >
          <span class="card-icon">⌂</span>
          <span class="card-label">{{ f.name }}</span>
        </div>
      </div>
      <button :disabled="!selectedFilters.length" @click="$emit('next')" class="btn-next">
        查看你的理想居住地區 ▶
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  meta: any
  filterIndex: Array<{ id: string; name: string }>
  selectedTownCode: string
  filterDataCache: Record<string, Record<string, number | null>>
  selectedFilters: string[]
}>()

const emit = defineEmits<{
  'update:selectedFilters': [value: string[]]
  'next': []
  'back': []
}>()

const countyName = computed(() => {
  if (!props.meta || !props.selectedTownCode) return ''
  const town = props.meta.towns[props.selectedTownCode]
  return props.meta.counties[town?.COUNTYCODE]?.COUNTYNAME ?? ''
})

const townName = computed(() => {
  if (!props.meta || !props.selectedTownCode) return ''
  return props.meta.towns[props.selectedTownCode]?.TOWNNAME ?? ''
})

function toggleFilter(id: string) {
  const filters = [...props.selectedFilters]
  const idx = filters.indexOf(id)
  if (idx >= 0) filters.splice(idx, 1)
  else filters.push(id)
  emit('update:selectedFilters', filters)
}

function formatVal(val: number | null | undefined): string {
  if (val == null) return '—'
  return typeof val === 'number' ? val.toLocaleString() : String(val)
}
</script>

<style scoped>
.step-criteria {
  position: fixed;
  inset: 0;
  display: flex;
  pointer-events: none;
  z-index: 10;
}

.town-panel {
  width: 220px;
  margin: 12px;
  background: rgba(255, 255, 255, 0.97);
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 16px;
  font-size: 13px;
  pointer-events: auto;
  overflow-y: auto;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
  align-self: flex-start;
  max-height: calc(100% - 24px);
}

.town-location {
  font-size: 12px;
  color: #666;
  margin-bottom: 12px;
  line-height: 1.6;
}

.town-location strong {
  display: block;
  font-size: 14px;
  color: #111;
  margin-top: 2px;
}

.town-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
  font-size: 12px;
}

.stat-label {
  color: #666;
  flex: 1;
  line-height: 1.4;
}

.stat-val {
  font-weight: 600;
  white-space: nowrap;
  color: #111;
}

.criteria-panel {
  position: absolute;
  top: 12px;
  right: 12px;
  bottom: 12px;
  width: 460px;
  background: rgba(255, 255, 255, 0.97);
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 20px;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
}

.back-btn {
  align-self: flex-start;
  background: transparent;
  border: none;
  padding: 4px 0;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.back-btn:hover {
  color: #111;
}

.criteria-title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
  margin: 0;
  color: #111;
}

.criteria-hint {
  font-size: 13px;
  color: #888;
  margin: 0;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  flex: 1;
  align-content: start;
}

.criteria-card {
  padding: 14px 10px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  line-height: 1.4;
  transition: border-color 0.15s, background 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.criteria-card:hover {
  border-color: #9ca3af;
  background: #f9fafb;
}

.criteria-card.selected {
  border-color: #111;
  background: #f1f5f9;
}

.card-icon {
  font-size: 20px;
  line-height: 1;
}

.card-label {
  font-size: 12px;
  color: #374151;
}

.criteria-card.selected .card-label {
  font-weight: 600;
  color: #111;
}

.btn-next {
  padding: 12px;
  background: #111;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.btn-next:disabled {
  opacity: 0.35;
  cursor: default;
}
</style>
