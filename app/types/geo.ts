// 地理 metadata 型別（來源：public/tw-towns-meta.json）
//
// meta.json 結構：{ towns: Record<鄉鎮代碼, TownMeta>, counties: Record<縣市代碼, CountyMeta> }
// 代碼即 TOPOJSON feature 的 TOWNCODE / COUNTYCODE，字串型別。

/** 單一鄉鎮市區的 metadata（meta.towns[townCode]） */
export interface TownMeta {
  TOWNNAME: string
  TOWNENG: string
  /** 所屬縣市代碼，對應 counties 的 key */
  COUNTYCODE: string
}

/** 單一縣市的 metadata（meta.counties[countyCode]） */
export interface CountyMeta {
  COUNTYNAME: string
  COUNTYENG: string
}

/** tw-towns-meta.json 的整體結構 */
export interface GeoMeta {
  towns: Record<string, TownMeta>
  counties: Record<string, CountyMeta>
  /**
   * 顯示順序 rank（縣市代碼 → 序、鄉鎮代碼 → 序），數字越小越前面。
   * 來源：data/order.json（由「0. 各鄉鎮市區人口數」列序產生），於 useGeoMeta 載入時併入。
   * 未載入或代碼不在排序表中時，呼叫端應以 Infinity 作 fallback（排到最後、維持穩定）。
   */
  countyRank?: Record<string, number>
  townRank?: Record<string, number>
}

/** data/order.json 結構：依官方顯示順序排列的縣市 / 鄉鎮代碼陣列 */
export interface DisplayOrder {
  counties: string[]
  towns: string[]
}
