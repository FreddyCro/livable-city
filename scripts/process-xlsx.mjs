import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { default as XLSX } from 'xlsx';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sourcesDir = resolve(__dirname, '../sources/xlsx');
const outDir = resolve(__dirname, '../public/data');
const metaPath = resolve(__dirname, '../public/tw-towns-meta.json');

const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));

const norm = (s) => String(s ?? '').replace(/臺/g, '台').trim();

// Build lookup: countyName -> townName -> TOWNSCODE
const lookup = {};
for (const [code, info] of Object.entries(meta.towns)) {
  const county = meta.counties[info.COUNTYCODE];
  if (!county) continue;
  const c = norm(county.COUNTYNAME);
  const t = norm(info.TOWNNAME);
  if (!lookup[c]) lookup[c] = {};
  lookup[c][t] = code;
}

mkdirSync(outDir, { recursive: true });

const xlsxFiles = readdirSync(sourcesDir).filter(f => f.endsWith('.xlsx'));

for (const file of xlsxFiles) {
  const match = /^(\d+(?:-\d+)*)\./.exec(file);
  if (!match) {
    console.warn(`  skip (no number prefix): ${file}`);
    continue;
  }
  const prefix = match[1];

  const wb = XLSX.readFile(resolve(sourcesDir, file));
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  const result = {};
  let missing = 0;

  for (let i = 1; i < rows.length; i++) {
    const [county, town, value] = rows[i];
    if (county == null && town == null) continue;
    const c = norm(county);
    const t = norm(town);
    const code = lookup[c]?.[t];
    if (!code) {
      console.warn(`  [${prefix}] no match: "${c}" / "${t}"`);
      missing++;
      continue;
    }
    result[code] = value ?? null;
  }

  const outPath = resolve(outDir, `${prefix}.json`);
  writeFileSync(outPath, JSON.stringify(result));
  console.log(`${prefix}.json — ${Object.keys(result).length} entries, ${missing} unmatched → ${outPath}`);
}

const index = xlsxFiles
  .map(file => {
    const match = /^(\d+(?:-\d+)*)\./.exec(file);
    if (!match) return null;
    const id = match[1];
    const name = file
      .replace(/^\d+(?:-\d+)*\.\s*/, '')
      .replace(/\s*的副本\.xlsx$/, '')
      .replace(/\.xlsx$/, '');
    return { id, name };
  })
  .filter(Boolean);

const indexPath = resolve(outDir, 'index.json');
writeFileSync(indexPath, JSON.stringify(index));
console.log(`index.json — ${index.length} entries → ${indexPath}`);
