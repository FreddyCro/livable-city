import { shallowRef, onMounted } from 'vue'
import type { GeoMeta } from '../types/geo'
import { dataSource } from '../utils/dataSource'

/**
 * 共用地理 metadata（tw-towns-meta.json：towns / counties）。
 * 由結果運算、地圖、各 Step 共同消費，因此獨立於地圖底圖載入，唯讀對外提供。
 * meta 在 client 載入完成前為 null。
 */
export function useGeoMeta() {
  const meta = shallowRef<GeoMeta | null>(null)

  onMounted(async () => {
    meta.value = await dataSource.geoMeta()
  })

  return { meta }
}
