import { shallowRef, onMounted } from 'vue'
import type { FilterDataset } from '../types/filter'
import { dataSource } from '../utils/dataSource'

/**
 * 各鄉鎮人口資料（data/0.json：鄉鎮代碼 → 人口數）。
 * 非篩選指標，僅供 step 3 比較卡（explore-compare）標題顯示，
 * 故獨立於 useFilterData 之外載入。client 載入完成前為 null。
 * 載入失敗不致命（人口僅為標題附帶資訊），退回 null 不顯示。
 */
export function usePopulation() {
  const population = shallowRef<FilterDataset | null>(null)

  onMounted(async () => {
    population.value = await dataSource.population().catch(() => null)
  })

  return { population }
}
