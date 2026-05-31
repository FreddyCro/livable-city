// 篩選資料型別（來源：public/data/index.json 與 public/data/{id}.json）

/** 單一篩選指標的描述（index.json 的每一筆） */
export interface FilterMeta {
  /** 指標代碼，對應 data/{id}.json 檔名 */
  id: string
  name: string
  /** true=值越低越好（房價、租金…），false=值越高越好（超商密度…） */
  lowerIsBetter: boolean
}

/** 單一指標的資料集（data/{id}.json）：鄉鎮代碼 → 數值（缺值為 null） */
export type FilterDataset = Record<string, number | null>

/** 已載入的指標資料集快取：指標 id → FilterDataset */
export type FilterDataCache = Record<string, FilterDataset>
