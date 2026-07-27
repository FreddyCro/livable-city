import { ref, shallowRef, watchEffect, onMounted, type Ref } from 'vue'
import type { FilterMeta, FilterDataCache } from '../types/filter'
import { dataSource } from '../utils/dataSource'

interface UseFilterDataOptions {
  selectedFilters: Ref<string[]>
}

/**
 * 篩選資料載入層：管理篩選清單（index.json）與各篩選的資料集快取。
 * loadFilters 逐檔載入、逐檔 commit（哪支先回來就先顯示，不被最慢的一支拖住），
 * 並以 inflight map 去重；`await loadFilters(ids)` 會在這些 id 全部就緒
 * （含由他處—如 preloadAllFilters—已在載入中的）時才 resolve，故可拿來當「資料就緒」的閘門。
 */
export function useFilterData(opts: UseFilterDataOptions) {
  const { selectedFilters } = opts

  const filterIndex = ref<FilterMeta[]>([])
  const filterDataCache = shallowRef<FilterDataCache>({})
  // 進行中的單檔載入：id → promise。去重之餘仍能被 await——
  // 舊版用 Set 只記「載入中」而略過，會導致 await 等不到他處已啟動的載入。
  const inflight = new Map<string, Promise<void>>()

  // 載入指定篩選資料集。逐檔 commit、全部就緒才 resolve。
  // 單檔失敗只讓該指標維持缺值（「—」），不影響其餘與呼叫端（載入失敗不致命，同 usePopulation）。
  async function loadFilters(ids: string[]): Promise<void> {
    const missing = ids.filter((id) => !(id in filterDataCache.value))
    if (!missing.length) return
    await Promise.all(
      missing.map((id) => {
        let p = inflight.get(id)
        if (!p) {
          p = (async () => {
            try {
              const data = await dataSource.filterDataset(id)
              // 逐檔 commit：每支各自替換 shallowRef，隨到隨觸發畫面更新
              filterDataCache.value = { ...filterDataCache.value, [id]: data }
            } catch (err) {
              console.error(err)
            } finally {
              inflight.delete(id)
            }
          })()
          inflight.set(id, p)
        }
        return p
      }),
    )
  }

  // 載入全部篩選資料（step 2 stats 面板 / 進 step 3 前預載）
  function preloadAllFilters() {
    return loadFilters(filterIndex.value.map((f) => f.id))
  }

  // 載入篩選清單 manifest（data/index.json）；client 端掛載後抓取
  onMounted(async () => {
    filterIndex.value = await dataSource.filterIndex()
  })

  // 依 selectedFilters 按需載入（供結果運算）
  watchEffect(() => {
    loadFilters(selectedFilters.value)
  })

  return { filterIndex, filterDataCache, loadFilters, preloadAllFilters }
}
