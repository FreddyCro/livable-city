// 資料來源層：集中所有 public 靜態資產的路徑、型別與載入邏輯。
//
// 為什麼集中：原本 fetch 散在 useGeoMeta / useFilterData / useTaiwanMap 三處，
// 路徑是裸字串、無型別、無錯誤處理、且寫死根路徑 `/...`（忽略 app.baseURL，
// 部署在子路徑時會 404）。這裡收斂為單一出口。
//
// SSR/CSR 邊界：這些資產一律在 client 端（onMounted 之後）載入，server render
// 階段資料為 null —— 屬刻意設計（資料量大、互動才需要，不阻塞首屏 SSR）。
// 呼叫端請務必在 onMounted 或事件處理中呼叫，勿在 setup 同步階段使用結果。

import type { GeoMeta, DisplayOrder } from '../types/geo'
import type { FilterMeta, FilterDataset } from '../types/filter'

// public/ 底下的相對檔名（不含 baseURL 前綴，由 assetUrl 補上）
const ASSET = {
  geoMeta: 'tw-towns-meta.json',
  geoTopology: 'tw-towns-optimized.json',
  displayOrder: 'data/order.json',
  filterIndex: 'data/index.json',
  filterDataset: (id: string) => `data/${id}.json`,
  // 人口資料（非篩選指標，獨立檔），供 step 3 比較卡標題顯示
  population: 'data/0.json',
} as const

// 補上部署 baseURL 前綴，確保部署於子路徑時 public/ 資產仍解析得到。
// 注意：要用 Nuxt 的 app.baseURL（public 資產服務於此前綴下），
// 不可用 import.meta.env.BASE_URL —— 那是 build assets 目錄（dev 下為 /_nuxt/），
// 用它會把資產導去 /_nuxt/xxx.json 而 404。
//
// 並附加 `?v={DATA_VERSION}` 做 cache busting：public/ 資產不像 _nuxt/ 的 build
// assets 帶 content hash，換了資料（如重跑 process-xlsx 產生新的 data/1.json）
// URL 仍然相同，瀏覽器／CDN 會繼續給舊檔 → 新 JS 配舊資料。版本字串於 build 時
// 由 nuxt.config 產生（git short SHA），每次部署自然換 URL。
// DATA_VERSION 為空時不附加（等於維持舊行為）。
function assetUrl(path: string): string {
  const config = useRuntimeConfig()
  const base = config.app.baseURL || '/'
  const url = base.endsWith('/') ? `${base}${path}` : `${base}/${path}`
  const v = config.public.DATA_VERSION
  return v ? `${url}?v=${encodeURIComponent(v)}` : url
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(assetUrl(path))
  if (!res.ok) throw new Error(`[dataSource] 載入失敗 ${path}：HTTP ${res.status}`)
  return res.json() as Promise<T>
}

/**
 * 靜態資料載入入口。每個方法綁定其回傳型別，呼叫端拿到的即是 typed data。
 * 地圖底圖 topology 結構由 topojson-client 動態解析，維持 any。
 */
export const dataSource = {
  /** 鄉鎮/縣市 metadata（tw-towns-meta.json） */
  geoMeta: () => fetchJson<GeoMeta>(ASSET.geoMeta),
  /** 縣市/鄉鎮顯示順序（data/order.json） */
  displayOrder: () => fetchJson<DisplayOrder>(ASSET.displayOrder),
  /** 地圖底圖 TopoJSON（tw-towns-optimized.json） */
  geoTopology: () => fetchJson<any>(ASSET.geoTopology),
  /** 篩選指標清單 manifest（data/index.json） */
  filterIndex: () => fetchJson<FilterMeta[]>(ASSET.filterIndex),
  /** 單一指標資料集（data/{id}.json） */
  filterDataset: (id: string) => fetchJson<FilterDataset>(ASSET.filterDataset(id)),
  /** 各鄉鎮人口資料（data/0.json：鄉鎮代碼 → 人口數） */
  population: () => fetchJson<FilterDataset>(ASSET.population),
}
