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
}
