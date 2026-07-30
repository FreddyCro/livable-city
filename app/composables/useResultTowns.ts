import { ref, computed, watch, type Ref, type ShallowRef } from 'vue'
import type { GeoMeta } from '../types/geo'
import type { FilterMeta, FilterDataCache } from '../types/filter'
import { byRank } from '../utils/sort'

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
 * 指標值 → 可比較的分數。zeroMeansNone 的指標（醫療院所平均每家服務人數、圖書館人口比）
 * 值為 0 代表「該地區完全沒有這項設施」，語意上是最差，故換算成該指標方向的最差值
 * （lowerIsBetter → +Infinity）；其餘指標原值直接比。
 *
 * ⚠️ 兩端（候選地區 val 與現居地 refVal）都要換算：
 *   - val=0 換成最差 → 沒有醫療院所的茂林區不再被「醫療資源更多」選出（PM 回報的問題）。
 *   - refVal=0 換成最差 → 現居地本身沒有設施時（如金門縣烏坵鄉），任何「有設施」的地區
 *     都算比它更好；若只換算 val 這端，這些使用者會永遠篩不出任何結果。
 *   - 兩端皆 0 → 最差 vs 最差不成立（Infinity < Infinity 為 false），一樣排除。
 */
function metricScore(val: number, meta: FilterMeta | undefined): number {
  if (!meta?.zeroMeansNone || val !== 0) return val
  return meta.lowerIsBetter ? Infinity : -Infinity
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
    const rank = m.townRank
    return Object.keys(m.towns)
      .filter(code => {
        if (code === selectedTownCode.value) return false
        return selectedFilters.value.every(fid => {
          const data = filterDataCache.value[fid]
          if (!data) return false
          const refVal = data[selectedTownCode.value]
          const val = data[code]
          if (refVal == null || val == null) return false
          const fm = filterMeta[fid]
          const score = metricScore(val, fm)
          const refScore = metricScore(refVal, fm)
          return fm?.lowerIsBetter ? score < refScore : score > refScore
        })
      })
      // 依 order.json 的官方順序排列，與 StepLocation 下拉一致（無 rank 者排到最後）
      .sort(byRank(rank, (code) => code))
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
