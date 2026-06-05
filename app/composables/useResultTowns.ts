import { ref, computed, watch, type Ref, type ShallowRef } from 'vue'
import type { GeoMeta } from '../types/geo'
import type { FilterMeta, FilterDataCache } from '../types/filter'

export interface ResultTown {
  code: string
  name: string
  county: string
}

interface UseResultTownsOptions {
  meta: ShallowRef<GeoMeta | null>
  filterIndex: Ref<FilterMeta[]>
  filterDataCache: ShallowRef<FilterDataCache>
  selectedTownCode: Ref<string>
  selectedFilters: Ref<string[]>
  currentStep: Ref<1 | 2 | 3>
}

/**
 * 結果運算層：依「選定鄉鎮 + 篩選條件」算出勝過基準的鄉鎮清單，
 * 並維護 step 3 比較卡的預設選取（explore-compare 3.4）。
 *
 * 預設選取只設值、不觸發地圖飛入；飛入由 app.vue 在使用者明確點選結果時
 * 呼叫 map.focusTown() 處理。
 */
export function useResultTowns(opts: UseResultTownsOptions) {
  const { meta, filterIndex, filterDataCache, selectedTownCode, selectedFilters, currentStep } = opts

  const selectedResultCode = ref<string | null>(null)

  const resultTowns = computed<ResultTown[]>(() => {
    const m = meta.value
    if (!selectedTownCode.value || !selectedFilters.value.length || !m) return []
    if (!selectedFilters.value.every(id => id in filterDataCache.value)) return []
    const filterMeta = Object.fromEntries(filterIndex.value.map(f => [f.id, f]))
    return Object.keys(m.towns)
      .filter(code => {
        if (code === selectedTownCode.value) return false
        return selectedFilters.value.every(fid => {
          const data = filterDataCache.value[fid]
          if (!data) return false
          const refVal = data[selectedTownCode.value]
          const val = data[code]
          if (refVal == null || val == null) return false
          return filterMeta[fid]?.lowerIsBetter ? val < refVal : val > refVal
        })
      })
      .map(code => {
        const t = m.towns[code]
        const c = t ? m.counties[t.COUNTYCODE] : undefined
        return { code, name: t?.TOWNNAME ?? '', county: c?.COUNTYNAME ?? '' }
      })
  })

  // Step 3: default the compare card to the first result.
  // Sets selection without flying in, so the Taiwan overview stays put.
  function ensureDefaultResult() {
    if (currentStep.value !== 3) return
    const towns = resultTowns.value
    if (!towns.length) {
      selectedResultCode.value = null
      return
    }
    if (!selectedResultCode.value || !towns.some(t => t.code === selectedResultCode.value)) {
      selectedResultCode.value = towns[0]!.code
    }
  }

  // 基準鄉鎮或篩選條件一變，先清掉先前的結果選取
  watch([selectedTownCode, selectedFilters], () => {
    selectedResultCode.value = null
  }, { deep: true })

  // Step 3 進場或結果清單變動時，自動把比較卡預設到第一筆
  watch([currentStep, resultTowns], () => {
    ensureDefaultResult()
  })

  return { selectedResultCode, resultTowns }
}
