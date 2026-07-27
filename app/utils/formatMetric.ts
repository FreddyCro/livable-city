// 指標數值的顯示格式化（step 2 現居地資訊欄 statText 與 step 3 比較卡 formatVal 共用）。
//
// 小數位是「顯示層」設定、不是來源資料，故放前端；不寫進 public/data/index.json——
// 那是 scripts/process-xlsx.mjs 從 xlsx 產生的，手改會被重跑覆蓋。兩處共用同一份，
// 確保 step 2 與 step 3 對同一指標顯示一致。

// PM 指定固定小數位的指標（key = FilterMeta.id，對應 public/data/{id}.json）。
// 值 = 固定顯示的小數位數；未列入者維持原始精度（raw toLocaleString）。
const METRIC_DECIMALS: Record<string, number> = {
  '3': 0, // 醫療院所平均每家服務人數 → 取到個位數
  '4': 1, // 癌症發生率 → 取到小數點後第一位
  '8': 2, // 每萬名老人社區照顧關懷據點數 → 取到小數點後第二位
  '13': 2, // 餐飲及住宿店家密度 → 取到小數點後第二位
};

/**
 * 依指標 id 把數值格式化為顯示字串（不含單位；千分位沿用 toLocaleString）。
 * 有指定小數位者固定該位數並補零（如 21.10、452.6、1,978）；未指定者維持原始精度。
 */
export function formatMetricNumber(id: string, val: number): string {
  const decimals = METRIC_DECIMALS[id];
  if (decimals == null) return val.toLocaleString();
  return val.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
