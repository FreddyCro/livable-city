<template>
  <div class="step-result">
    <div class="result-sidebar">
      <!-- Back button -->
      <div class="back-section">
        <button class="back-btn" @click="$emit('back')">◀ 返回</button>
      </div>

      <!-- All filter toggles -->
      <div class="filter-section">
        <p class="section-label">條件</p>
        <div class="filter-tags">
          <label
            v-for="f in filterIndex"
            :key="f.id"
            class="filter-tag"
            :class="{ selected: selectedFilters.includes(f.id) }"
          >
            <input
              type="checkbox"
              :checked="selectedFilters.includes(f.id)"
              @change="toggleFilter(f.id)"
            />
            {{ f.name }}
          </label>
        </div>
      </div>

      <!-- Result count + list -->
      <div class="result-section">
        <p class="section-label">共 {{ resultTowns.length }} 項結果</p>
        <div v-if="!resultTowns.length" class="hint">無符合條件的地區</div>
        <div v-else class="result-list">
          <div
            v-for="t in resultTowns"
            :key="t.code"
            class="result-item"
            :class="{ active: selectedResultCode === t.code }"
            @click="toggleResult(t.code)"
          >
            <span class="result-county">{{ t.county }}</span>
            <span class="result-name">{{ t.name }}</span>
          </div>
        </div>
      </div>

      <!-- Detail card -->
      <div v-if="selectedResultCode && detailTown" class="detail-section">
        <p class="detail-title">{{ detailTown.county }} {{ detailTown.name }}</p>
        <div class="detail-rows">
          <div v-for="fid in selectedFilters" :key="fid" class="detail-row">
            <span class="detail-label">{{ filterNameMap[fid] ?? fid }}</span>
            <div class="detail-vals">
              <span class="val-ref">{{ formatVal(filterDataCache[fid]?.[selectedTownCode]) }}</span>
              <span class="val-arrow">→</span>
              <span class="val-result">{{ formatVal(filterDataCache[fid]?.[selectedResultCode!]) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  meta: any
  filterIndex: Array<{ id: string; name: string }>
  filterDataCache: Record<string, Record<string, number | null>>
  selectedTownCode: string
  selectedFilters: string[]
  resultTowns: Array<{ code: string; name: string; county: string }>
  selectedResultCode: string | null
}>()

const emit = defineEmits<{
  'update:selectedResultCode': [value: string | null]
  'update:selectedFilters': [value: string[]]
  'back': []
}>()

function toggleFilter(id: string) {
  const filters = [...props.selectedFilters]
  const idx = filters.indexOf(id)
  if (idx >= 0) filters.splice(idx, 1)
  else filters.push(id)
  emit('update:selectedFilters', filters)
}

const filterNameMap = computed(() =>
  Object.fromEntries(props.filterIndex.map(f => [f.id, f.name]))
)

const detailTown = computed(() => {
  if (!props.selectedResultCode || !props.meta) return null
  const t = props.meta.towns[props.selectedResultCode]
  const c = props.meta.counties[t?.COUNTYCODE]
  return { name: t?.TOWNNAME ?? '', county: c?.COUNTYNAME ?? '' }
})

function toggleResult(code: string) {
  emit('update:selectedResultCode', props.selectedResultCode === code ? null : code)
}

function formatVal(val: number | null | undefined): string {
  if (val == null) return '—'
  return typeof val === 'number' ? val.toLocaleString() : String(val)
}
</script>

<style scoped>
.step-result {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 10;
}

.result-sidebar {
  position: absolute;
  top: 12px;
  left: 12px;
  bottom: 12px;
  width: 280px;
  background: rgba(255, 255, 255, 0.97);
  border: 1px solid #d1d5db;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  pointer-events: auto;
  font-size: 13px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
}

.section-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #888;
  margin: 0 0 8px;
}

.filter-section {
  padding: 12px 14px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 99px;
  padding: 3px 10px;
  font-size: 12px;
  color: #9ca3af;
  cursor: pointer;
  user-select: none;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}

.filter-tag:hover {
  border-color: #cbd5e1;
}

.filter-tag.selected {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #111;
  font-weight: 500;
}

.filter-tag input[type="checkbox"] {
  margin: 0;
  width: 12px;
  height: 12px;
  cursor: pointer;
}

.back-section {
  padding: 10px 14px;
  border-bottom: 1px solid #eee;
}

.back-btn {
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

.result-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 12px 14px;
}

.hint {
  color: #bbb;
  font-size: 12px;
}

.result-list {
  flex: 1;
  overflow-y: auto;
}

.result-item {
  display: flex;
  gap: 8px;
  padding: 5px 6px;
  border-bottom: 1px solid #f0f0f0;
  align-items: baseline;
  cursor: pointer;
  border-radius: 4px;
}

.result-item:hover {
  background: #f5f7ff;
}

.result-item.active {
  background: #eff6ff;
}

.result-item:last-child {
  border-bottom: none;
}

.result-county {
  color: #aaa;
  font-size: 11px;
  white-space: nowrap;
  flex-shrink: 0;
}

.result-name {
  font-size: 13px;
}

.result-item.active .result-name {
  font-weight: 600;
  color: #1d4ed8;
}

.detail-section {
  border-top: 1px solid #eee;
  padding: 12px 14px;
  overflow-y: auto;
  max-height: 220px;
  flex-shrink: 0;
}

.detail-title {
  font-size: 12px;
  font-weight: 700;
  color: #222;
  margin: 0 0 10px;
}

.detail-rows {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 11px;
  color: #999;
  line-height: 1.3;
}

.detail-vals {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.val-ref {
  color: #888;
}

.val-arrow {
  color: #ccc;
  font-size: 11px;
}

.val-result {
  color: #2563eb;
  font-weight: 600;
}
</style>
