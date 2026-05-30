import { ref, computed, watch, type Ref, type ShallowRef } from 'vue'

export interface FilterMeta {
  id: string
  name: string
  lowerIsBetter: boolean
}

export interface ResultTown {
  code: string
  name: string
  county: string
}

interface UseResultTownsOptions {
  meta: ShallowRef<any>
  filterIndex: Ref<FilterMeta[]>
  filterDataCache: ShallowRef<Record<string, Record<string, number | null>>>
  selectedTownCode: Ref<string>
  selectedFilters: Ref<string[]>
  currentStep: Ref<1 | 2 | 3>
}

/**
 * 結果運算層：依「選定鄉鎮 + 篩選條件」算出勝過基準的鄉鎮清單，
 * 並維護 step 3 比較卡的預設選取（explore-compare 3.4）。
 *
 * suppressResultFly：step 3 進場時設預設結果，但不希望觸發地圖飛入，
 * 暫以 ref 暴露給地圖 watch 讀取；後續改由 focusTown({ animate:false }) 取代。
 */
export function useResultTowns(opts: UseResultTownsOptions) {
  const { meta, filterIndex, filterDataCache, selectedTownCode, selectedFilters, currentStep } = opts

  const selectedResultCode = ref<string | null>(null)
  const suppressResultFly = ref(false)

  const resultTowns = computed<ResultTown[]>(() => {
    if (!selectedTownCode.value || !selectedFilters.value.length || !meta.value) return []
    if (!selectedFilters.value.every(id => id in filterDataCache.value)) return []
    const filterMeta = Object.fromEntries(filterIndex.value.map(f => [f.id, f]))
    return Object.keys(meta.value.towns)
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
        const t = meta.value.towns[code]
        const c = meta.value.counties[t.COUNTYCODE]
        return { code, name: t.TOWNNAME, county: c?.COUNTYNAME ?? '' }
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
      suppressResultFly.value = true
      selectedResultCode.value = towns[0].code
    }
  }

  // 基準鄉鎮或篩選條件一變，先清掉先前的結果選取
  watch([selectedTownCode, selectedFilters], () => {
    selectedResultCode.value = null
  }, { deep: true })

  return { selectedResultCode, resultTowns, suppressResultFly, ensureDefaultResult }
}
