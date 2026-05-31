import { shallowRef, onMounted } from 'vue'

/**
 * 共用地理 metadata（tw-towns-meta.json：towns / counties）。
 * 由結果運算、地圖、各 Step 共同消費，因此獨立於地圖底圖載入，唯讀對外提供。
 */
export function useGeoMeta() {
  const meta = shallowRef<any>(null)

  onMounted(async () => {
    meta.value = await fetch('/tw-towns-meta.json').then(r => r.json())
  })

  return { meta }
}
