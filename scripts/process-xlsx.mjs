// 把來源 xlsx 轉成前端用的 public/data/{id}.json 與 index.json。
// 比對規則與設定集中在 ./lib/sources.mjs，與 validate-sources.mjs 共用。
// 注意：本腳本對不到的列只會 warn 並略過；要把關資料品質請跑 `node scripts/validate-sources.mjs`。

import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import {
  PATHS, DIRECTION, EXCLUDE_FROM_INDEX,
  cleanName, parseVal, idOf, listXlsx, dataRows, loadLookup, matchRow,
} from './lib/sources.mjs';

const { lookup, countyNameToCode } = loadLookup();
mkdirSync(PATHS.outDir, { recursive: true });

const files = listXlsx();

for (const file of files) {
  const id = idOf(file);
  if (!id) {
    console.warn(`  skip (no number prefix): ${file}`);
    continue;
  }

  const result = {};
  let missing = 0;
  for (const { county, town, value } of dataRows(file)) {
    const code = matchRow(lookup, county, town);
    if (!code) {
      console.warn(`  [${id}] no match: "${county}" / "${town}"`);
      missing++;
      continue;
    }
    result[code] = parseVal(value);
  }

  const outPath = resolve(PATHS.outDir, `${id}.json`);
  writeFileSync(outPath, JSON.stringify(result));
  console.log(`${id}.json — ${Object.keys(result).length} entries, ${missing} unmatched → ${outPath}`);
}

const index = files
  .map(file => {
    const id = idOf(file);
    if (!id || EXCLUDE_FROM_INDEX.has(id)) return null;
    if (!(id in DIRECTION)) {
      console.warn(`  [index] no DIRECTION for id "${id}" (${file}) — defaulting lowerIsBetter=true`);
    }
    return { id, name: cleanName(file), lowerIsBetter: DIRECTION[id] ?? true };
  })
  .filter(Boolean);

writeFileSync(PATHS.indexPath, JSON.stringify(index));
console.log(`index.json — ${index.length} entries → ${PATHS.indexPath}`);

// 顯示順序的唯一依據：以「0. 各鄉鎮市區人口數」的列順序，產生縣市/鄉鎮碼的官方排序。
// 前端（StepLocation 下拉、StepResult 結果清單）依此排，取代 JS 物件 key 的數值排序。
const orderFile = files.find(file => idOf(file) === '0');
if (!orderFile) {
  console.warn('  [order] 找不到 id "0" 的檔案，略過 order.json（前端將回退為預設順序）');
} else {
  const counties = [];
  const seenCounty = new Set();
  const towns = [];
  let orphan = 0;
  for (const { county, town } of dataRows(orderFile)) {
    const ccode = countyNameToCode[county];
    if (ccode && !seenCounty.has(ccode)) { seenCounty.add(ccode); counties.push(ccode); }
    const tcode = matchRow(lookup, county, town);
    if (tcode) towns.push(tcode);
    else orphan++;
  }
  const orderPath = resolve(PATHS.outDir, 'order.json');
  writeFileSync(orderPath, JSON.stringify({ counties, towns }));
  console.log(`order.json — ${counties.length} counties, ${towns.length} towns${orphan ? `, ${orphan} 列對不到(已略過)` : ''} → ${orderPath}`);
}
