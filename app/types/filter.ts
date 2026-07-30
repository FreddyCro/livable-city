// 篩選資料型別（來源：public/data/index.json 與 public/data/{id}.json）

/** 單一篩選指標的描述（index.json 的每一筆） */
export interface FilterMeta {
  /** 指標代碼，對應 data/{id}.json 檔名 */
  id: string
  /** 原始指標名（如「大樓平均單價」）；用於比較面板、現居統計欄 */
  name: string
  /** 篩選按鈕顯示文字：對使用者的方向性描述（如「購屋房價更低」），對齊 Figma 居住條件按鈕 */
  label: string
  /** 數值單位（來源 xlsx 第三欄表頭括號內），如「萬元／坪」「%」；無單位為空字串 */
  unit: string
  /** true=值越低越好（房價、租金…），false=值越高越好（超商密度…） */
  lowerIsBetter: boolean
  /**
   * true=值為 0 代表「該地區沒有這項設施」＝最差，不是「數值最小＝最好」。
   * 用於「人口 ÷ 設施家數」的比值指標（醫療院所平均每家服務人數、圖書館人口比），
   * 家數為 0 時來源給 0。排名比較前需先換算成最差值（見 useResultTowns）。
   * 來源：index.json，由 scripts/lib/sources.mjs 的 ZERO_MEANS_NONE 產生。
   */
  zeroMeansNone: boolean
}

/** 單一指標的資料集（data/{id}.json）：鄉鎮代碼 → 數值（缺值為 null） */
export type FilterDataset = Record<string, number | null>

/** 已載入的指標資料集快取：指標 id → FilterDataset */
export type FilterDataCache = Record<string, FilterDataset>
