// 資料把關：把每一筆來源資料對一次官方鄉鎮表，並交叉檢查 index.json 與產出檔。
// 與 process-xlsx.mjs 共用 ./lib/sources.mjs，確保「驗證通過 == 產生時不會漏資料」。
//
// 用法：
//   node scripts/validate-sources.mjs                       # 用預設來源目錄
//   SOURCES_DIR=sources/0712_數據final node scripts/validate-sources.mjs
//
// 結束碼：有 error → 1（可接 CI / pre-commit 擋下）；只有 warning → 0。

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import {
  PATHS, DIRECTION, EXCLUDE_FROM_INDEX, ZERO_MEANS_NONE,
  cleanName, idOf, listXlsx, dataRows, loadLookup, matchRow, suggest,
} from './lib/sources.mjs';

const { lookup, allCounties, codeToName } = loadLookup();
const allCodes = Object.keys(codeToName);

const errors = [];    // 阻擋性（exit 1）
const warnings = [];   // 提示性（不擋）
const err = (file, msg) => errors.push(`[${file}] ${msg}`);
const warn = (file, msg) => warnings.push(`[${file}] ${msg}`);

const files = listXlsx();
if (!files.length) err(PATHS.sourcesDir, '來源目錄沒有任何 .xlsx');

// ---- 1) 每個來源檔：每一筆對一次鄉鎮表 ----
for (const file of files) {
  const id = idOf(file);
  if (!id) {
    warn(file, '檔名無數字前綴，會被略過（不會產生資料檔）');
    continue;
  }

  const seenAt = new Map();      // code → 第一次出現的 rowNum
  const matched = new Set();

  for (const { rowNum, county, town, value } of dataRows(file)) {
    const code = matchRow(lookup, county, town);
    if (!code) {
      err(file, `第 ${rowNum} 列對不到：「${county} ${town}」(值=${value}) → ${suggest(lookup, allCounties, county, town)}`);
      continue;
    }
    if (seenAt.has(code)) {
      err(file, `第 ${rowNum} 列與第 ${seenAt.get(code)} 列重複對到同一鄉鎮：${codeToName[code]}`);
    } else {
      seenAt.set(code, rowNum);
    }
    matched.add(code);
  }

  // 覆蓋率：哪些官方鄉鎮在此檔沒資料（可能是合理缺漏，列為提示）
  const missing = allCodes.filter(c => !matched.has(c));
  if (missing.length) {
    const preview = missing.slice(0, 8).map(c => codeToName[c]).join('、');
    warn(file, `${matched.size}/${allCodes.length} 鄉鎮有資料，缺 ${missing.length}：${preview}${missing.length > 8 ? ' …' : ''}`);
  }
}

// ---- 2) index.json 與產出檔交叉檢查 ----
const expectedIds = files.map(idOf).filter(id => id && !EXCLUDE_FROM_INDEX.has(id));

// DIRECTION 是否涵蓋所有要列入 index 的 id
for (const id of expectedIds) {
  if (!(id in DIRECTION)) err('DIRECTION', `id "${id}" 缺方向設定（lowerIsBetter），會 default true`);
}

if (!existsSync(PATHS.indexPath)) {
  warn('index.json', '尚未產生，請先跑 node scripts/process-xlsx.mjs');
} else {
  let index;
  try {
    index = JSON.parse(readFileSync(PATHS.indexPath, 'utf-8'));
  } catch (e) {
    err('index.json', `無法解析：${e.message}`);
    index = [];
  }
  const byId = new Map(index.map(e => [e.id, e]));
  const fileById = new Map(files.map(f => [idOf(f), f]));

  // 2a) 每個應列入的 id 都要在 index，且有對應資料檔
  for (const id of expectedIds) {
    if (!byId.has(id)) err('index.json', `缺少 id "${id}"（${fileById.get(id)}）`);
    if (!existsSync(resolve(PATHS.outDir, `${id}.json`))) err('public/data', `缺少資料檔 ${id}.json`);
  }

  // 2b) index 內每一筆都要合法：非孤兒、名稱/方向與設定一致
  for (const entry of index) {
    const { id, name, lowerIsBetter, zeroMeansNone } = entry ?? {};
    const file = fileById.get(id);
    if (!file) { err('index.json', `id "${id}" 沒有對應來源檔（孤兒項）`); continue; }
    if (EXCLUDE_FROM_INDEX.has(id)) err('index.json', `id "${id}" 應排除卻出現在 index`);
    const expectName = cleanName(file);
    if (name !== expectName) warn('index.json', `id "${id}" 名稱「${name}」與檔名推得的「${expectName}」不一致`);
    if (typeof lowerIsBetter !== 'boolean') err('index.json', `id "${id}" lowerIsBetter 非布林值`);
    else if (id in DIRECTION && lowerIsBetter !== DIRECTION[id]) err('index.json', `id "${id}" lowerIsBetter=${lowerIsBetter} 與 DIRECTION 設定(${DIRECTION[id]})不符`);
    // zeroMeansNone 漏帶會讓前端退回舊行為（0 被當成最好），故與 ZERO_MEANS_NONE 對齊檢查
    if (typeof zeroMeansNone !== 'boolean') err('index.json', `id "${id}" zeroMeansNone 非布林值（請重跑 process-xlsx.mjs）`);
    else if (zeroMeansNone !== ZERO_MEANS_NONE.has(id)) err('index.json', `id "${id}" zeroMeansNone=${zeroMeansNone} 與 ZERO_MEANS_NONE 設定(${ZERO_MEANS_NONE.has(id)})不符`);
  }
}

// ---- 3) order.json（顯示順序唯一依據）完整性 ----
const orderPath = resolve(PATHS.outDir, 'order.json');
if (!existsSync(orderPath)) {
  warn('order.json', '尚未產生，前端將回退為預設順序（請跑 node scripts/process-xlsx.mjs）');
} else {
  let order;
  try {
    order = JSON.parse(readFileSync(orderPath, 'utf-8'));
  } catch (e) {
    err('order.json', `無法解析：${e.message}`);
    order = { counties: [], towns: [] };
  }
  const towns = order.towns ?? [];
  const dup = towns.filter((c, i) => towns.indexOf(c) !== i);
  if (dup.length) err('order.json', `towns 有重複代碼：${[...new Set(dup)].join('、')}`);
  const invalid = towns.filter(c => !(c in codeToName));
  if (invalid.length) err('order.json', `towns 含未知代碼：${invalid.join('、')}`);
  const missing = allCodes.filter(c => !towns.includes(c));
  if (missing.length) err('order.json', `${missing.length} 個鄉鎮不在排序表（會排到最後）：${missing.slice(0, 8).map(c => codeToName[c]).join('、')}${missing.length > 8 ? ' …' : ''}`);
}

// ---- 報告 ----
console.log(`\n來源目錄：${PATHS.sourcesDir}`);
console.log(`檢查 ${files.length} 個來源檔，對照 ${allCodes.length} 個官方鄉鎮。\n`);

if (warnings.length) {
  console.log(`⚠️  ${warnings.length} 項提示（不擋）：`);
  warnings.forEach(w => console.log(`   - ${w}`));
  console.log('');
}
if (errors.length) {
  console.log(`❌ ${errors.length} 項錯誤（須修正）：`);
  errors.forEach(e => console.log(`   - ${e}`));
  console.log('\n修正來源 xlsx 後重跑此腳本確認，再跑 node scripts/process-xlsx.mjs 重產資料。');
  process.exitCode = 1;
} else {
  console.log('✅ 全部通過：每一筆資料都對得到官方鄉鎮，index.json 一致。');
}
