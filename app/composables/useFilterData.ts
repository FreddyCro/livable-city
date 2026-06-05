import { ref, shallowRef, watchEffect, onMounted, type Ref } from 'vue'
import type { FilterMeta, FilterDataCache } from '../types/filter'
import { dataSource } from '../utils/dataSource'

interface UseFilterDataOptions {
  selectedFilters: Ref<string[]>
}

/**
 * 篩選資料載入層：管理篩選清單（index.json）與各篩選的資料集快取。
 * loadFilters 統一去重（已快取或載入中則略過），preload 與 watchEffect 共用。
 */
export function useFilterData(opts: UseFilterDataOptions) {
  const { selectedFilters } = opts

  const filterIndex = ref<FilterMeta[]>([])
  const filterDataCache = shallowRef<FilterDataCache>({})
  const loadingSet = new Set<string>()

  // 抓取並合併指定的篩選資料集，跳過已快取或正在載入中的
  async function loadFilters(ids: string[]) {
    const toLoad = ids.filter(id => !(id in filterDataCache.value) && !loadingSet.has(id))
    if (!toLoad.length) return
    toLoad.forEach(id => loadingSet.add(id))
    const results = await Promise.all(
      toLoad.map(async id => {
        const data = await dataSource.filterDataset(id)
        return [id, data] as const
      })
    )
    results.forEach(([id]) => loadingSet.delete(id))
    filterDataCache.value = { ...filterDataCache.value, ...Object.fromEntries(results) }
  }

  // Load all filter data (for step 2 stats panel)
  function preloadAllFilters() {
    return loadFilters(filterIndex.value.map(f => f.id))
  }

  // 載入篩選清單 manifest（data/index.json）；client 端掛載後抓取
  onMounted(async () => {
    filterIndex.value = await dataSource.filterIndex()
  })

  // Load selected filter data on demand (for result computation)
  watchEffect(() => {
    loadFilters(selectedFilters.value)
  })

  return { filterIndex, filterDataCache, loadFilters, preloadAllFilters }
}
