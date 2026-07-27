import { shallowRef, onMounted } from 'vue'
import type { GeoMeta } from '../types/geo'
import { dataSource } from '../utils/dataSource'

/**
 * 共用地理 metadata（tw-towns-meta.json：towns / counties）。
 * 由結果運算、地圖、各 Step 共同消費，因此獨立於地圖底圖載入，唯讀對外提供。
 * meta 在 client 載入完成前為 null。
 *
 * 顯示順序：另載入 data/order.json（縣市/鄉鎮的官方排序），轉成 rank 表併入 meta，
 * 供下拉選單與結果清單作為排序唯一依據。order.json 缺失或載入失敗時不致命，
 * 僅退回各處原本的預設順序（rank 為 undefined → 呼叫端以 Infinity fallback）。
 */
export function useGeoMeta() {
  const meta = shallowRef<GeoMeta | null>(null)

  onMounted(async () => {
    // 兩支獨立請求並行，省一個 round-trip；order.json 失敗不阻斷（維持預設順序）。
    const [base, order] = await Promise.all([
      dataSource.geoMeta(),
      dataSource.displayOrder().catch(() => null),
    ])
    if (order) {
      const toRank = (codes: string[]) =>
        Object.fromEntries(codes.map((code, i) => [code, i]))
      base.countyRank = toRank(order.counties)
      base.townRank = toRank(order.towns)
    }
    meta.value = base
  })

  return { meta }
}
