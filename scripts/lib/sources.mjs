// 資料來源處理的共用邏輯：產生（process-xlsx）與驗證（validate-sources）都引用這裡，
// 確保兩支腳本用「完全相同」的比對規則 —— 否則驗證通過但產生時卻漏資料，兩邊會 drift。

import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { default as XLSX } from 'xlsx';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../..');

// 路徑。來源固定放 sources/xlsx（每次更新覆蓋內容即可）；
// 若要臨時指向別的資料夾，可用環境變數覆蓋：
// 例：`SOURCES_DIR=sources/0712_數據final node scripts/process-xlsx.mjs`
export const PATHS = {
  sourcesDir: process.env.SOURCES_DIR
    ? resolve(process.env.SOURCES_DIR)
    : resolve(root, 'sources/xlsx'),
  outDir: resolve(root, 'public/data'),
  metaPath: resolve(root, 'public/tw-towns-meta.json'),
  indexPath: resolve(root, 'public/data/index.json'),
};

// 指標方向（lowerIsBetter）：true=值越低越好，false=值越高越好。
// 由 index.json 帶給前端排名邏輯（useResultTowns）使用。改方向只需改這裡。
export const DIRECTION = {
  '1': true,   // 大樓平均單價
  '2': true,   // 租金中位數
  '3': true,   // 醫療院所平均每家服務人數
  '4': true,   // 癌症發生率
  '5': true,   // 犯罪案件發生率
  '6': true,   // 交通事故每千人死傷人數
  '7': false,  // 公托覆蓋率
  '8': false,  // 每萬名老人社區照顧關懷據點數
  '9': true,   // 圖書館人口比（人／間）：每間館服務人數越少越好
  '10': true,  // 人口密度
  '11': false, // 青壯年人口比率
  '12': false, // 超商密度
  '13': false, // 餐飲及住宿店家密度
  '14': true,  // 大規模崩塌潛勢區數
  '15': false, // 公園、綠地及廣場用地面積
};

// 「值 0 代表該地區沒有這項設施」的指標：0 不是最好，而是**最差**。
// 這類指標是「人口 ÷ 設施家數」的比值（越低＝每家服務人數越少＝資源越多），
// 但家數為 0 時來源直接給 0（分母為零），照數值比大小會讓「完全沒有醫療院所／圖書館」
// 的鄉鎮排在最前面（PM 回報：選「醫療資源更多」卻篩出 0 家醫療院所的高雄市茂林區）。
// 由 index.json 的 zeroMeansNone 帶到前端，比較時把 0 換算成最差（見 useResultTowns）。
// ⚠️ 不是所有 0 都要列入：id 14 大規模崩塌潛勢區數的 0＝真的沒有潛勢區＝最好，不可加入。
export const ZERO_MEANS_NONE = new Set([
  '3', // 醫療院所平均每家服務人數（人）：0＝該地區沒有醫療院所
  '9', // 圖書館人口比（人／間）：0＝該地區沒有圖書館
]);

// 篩選按鈕的顯示文字（label）：對使用者的「方向性」描述（更低／更多／更高／更大），
// 對齊 Figma 居住條件按鈕。與 name（檔名衍生的原始指標名，用於比較面板/現居統計欄）刻意分開。
// 改文案只需改這裡，criteria 卡片與 result chip 共用。
export const LABELS = {
  '1': '購屋房價更低',
  '2': '房屋租金更低',
  '3': '醫療資源更多',
  '4': '癌症發生率更低',
  '5': '犯罪率更低',
  '6': '交通事故死傷率更低',
  '7': '公托覆蓋率更高',
  '8': '長照資源更多',
  '9': '圖書館資源更多',
  '10': '人口密度更低',
  '11': '青壯年人口比率更高',
  '12': '超商密度更高',
  '13': '餐飲及住宿店家密度更高',
  '14': '大規模崩塌災害風險更低',
  '15': '居住地綠地空間更大',
};

// 產出資料檔但不列入篩選清單（index.json）的 id。
// '0' 各鄉鎮市區人口數為背景/分母資料，非可勾選的宜居指標。
export const EXCLUDE_FROM_INDEX = new Set(['0']);

// 正規化縣市/鄉鎮名稱：臺→台、去空白。
export const norm = (s) => String(s ?? '').replace(/臺/g, '台').trim();

// 數值正規化：數字字串→number、"-"/空值→null。
// 必要性：前端以 val < refVal 比較排名，字串會做字典序比較（"9.5" > "61.3"）導致排序錯誤。
export const parseVal = (v) => {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  const s = String(v).trim();
  if (s === '' || s === '-' || s === '--') return null;
  const n = Number(s.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};

// 從檔名取得乾淨的指標名稱：去前綴編號、去已知後綴附註。
export const cleanName = (file) => file
  .replace(/^\d+(?:-\d+)*\.\s*/, '')        // 去 "12. " 編號前綴
  .replace(/-\d+年\d+月/, '')               // 去 "-2026年4月" 日期
  .replace(/（[^）]*更新）/g, '')           // 去資料更新附註（如「上線前數據會再更新」「0723更新」「資料有更新」）
  .replace(/\s*的副本/, '')
  .replace(/\.xlsx$/, '')
  .trim();

// 檔名數字前綴 → id（"12. 超商密度.xlsx" → "12"）。無前綴回 null。
export const idOf = (file) => {
  const m = /^(\d+(?:-\d+)*)\./.exec(file);
  return m ? m[1] : null;
};

// 讀第三欄表頭括號內的單位（"超商密度（間／平方公里）" → "間／平方公里"）。
// 單位寫在來源 xlsx 第三欄表頭，而非檔名；無括號（如「人口數」）回空字串。
export function headerUnit(file, dir = PATHS.sourcesDir) {
  const wb = XLSX.readFile(resolve(dir, file));
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  const third = String(rows[0]?.[2] ?? '');
  const m = /（(.+?)）/.exec(third);
  return m ? m[1].trim() : '';
}

// 列出來源目錄的 xlsx，依數字 id 排序。
export function listXlsx(dir = PATHS.sourcesDir) {
  return readdirSync(dir)
    .filter(f => f.endsWith('.xlsx'))
    .sort((a, b) => (Number(idOf(a)) || 0) - (Number(idOf(b)) || 0));
}

// 讀一個 xlsx 第一個工作表的資料列（跳過表頭與空列）。
// rowNum = Excel 列號（表頭為第 1 列，資料從第 2 列起），方便回報時直接定位。
export function dataRows(file, dir = PATHS.sourcesDir) {
  const wb = XLSX.readFile(resolve(dir, file));
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const [county, town, value] = rows[i] ?? [];
    if (county == null && town == null) continue;
    out.push({ rowNum: i + 1, county: norm(county), town: norm(town), value });
  }
  return out;
}

// 建查表：countyName → townName → TOWNSCODE，並回傳 code → "縣市 鄉鎮" 反查與縣市清單。
export function loadLookup(metaPath = PATHS.metaPath) {
  const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
  const lookup = {};
  const codeToName = {};
  const countyNameToCode = {};
  for (const [code, c] of Object.entries(meta.counties)) {
    countyNameToCode[norm(c.COUNTYNAME)] = code;
  }
  for (const [code, info] of Object.entries(meta.towns)) {
    const county = meta.counties[info.COUNTYCODE];
    if (!county) continue;
    const c = norm(county.COUNTYNAME);
    const t = norm(info.TOWNNAME);
    (lookup[c] ??= {})[t] = code;
    codeToName[code] = `${c} ${t}`;
  }
  return { lookup, allCounties: Object.keys(lookup), codeToName, countyNameToCode };
}

// 比對單列（county/town 須已 norm）→ TOWNSCODE 或 null。
export const matchRow = (lookup, county, town) => lookup[county]?.[town] ?? null;

// Levenshtein 編輯距離，供「對不到時建議最接近的正確名稱」使用。
const editDist = (a, b) => {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
};

// 去掉行政區層級後綴（鄉/鎮/市/區）後的「主名」，用來抓「對名字但層級寫錯」。
const baseName = (s) => s.replace(/[鄉鎮市區]$/, '');

// 對於對不到的 (縣市, 鄉鎮)，給出最可能的正確寫法。
export function suggest(lookup, allCounties, county, town) {
  if (!lookup[county]) {
    const near = allCounties
      .map(c => ({ c, d: editDist(county, c) }))
      .sort((a, b) => a.d - b.d)[0];
    return near && near.d <= 2 ? `縣市疑為「${near.c}」` : '縣市對不到，且無相近縣市';
  }
  const towns = Object.keys(lookup[county]);
  // 1) 同縣市內「主名相同、只是層級後綴不同」(布袋鄉→布袋鎮)
  const base = towns.find(t => baseName(t) === baseName(town) && t !== town);
  if (base) return `應為「${county} ${base}」(層級後綴不同)`;
  // 2) 否則取同縣市內編輯距離最近者 (太馬里鄉→太麻里鄉)
  const near = towns
    .map(t => ({ t, d: editDist(town, t) }))
    .sort((a, b) => a.d - b.d)[0];
  if (near && near.d <= 2) return `疑為「${county} ${near.t}」`;
  return `${county} 查無相近鄉鎮 —— 可能是多餘/錯置的列`;
}
