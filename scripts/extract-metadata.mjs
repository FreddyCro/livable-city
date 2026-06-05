import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '../public');

const topo = JSON.parse(readFileSync(resolve(publicDir, 'tw-towns-simplified.json'), 'utf-8'));

const townsMeta = {};
for (const geom of topo.objects.towns.geometries) {
  const p = geom.properties;
  townsMeta[p.TOWNCODE] = {
    TOWNNAME: p.TOWNNAME,
    TOWNENG:  p.TOWNENG,
    COUNTYCODE: p.COUNTYCODE,
  };
  geom.properties = { TOWNCODE: p.TOWNCODE };
}

const countiesMeta = {};
for (const geom of topo.objects.counties.geometries) {
  const p = geom.properties;
  countiesMeta[p.COUNTYCODE] = {
    COUNTYNAME: p.COUNTYNAME,
    COUNTYENG:  p.COUNTYENG,
  };
  geom.properties = { COUNTYCODE: p.COUNTYCODE };
}

const topoOut = resolve(publicDir, 'tw-towns-optimized.json');
writeFileSync(topoOut, JSON.stringify(topo));

const metaOut = resolve(publicDir, 'tw-towns-meta.json');
writeFileSync(metaOut, JSON.stringify({ towns: townsMeta, counties: countiesMeta }));

console.log(`towns: ${Object.keys(townsMeta).length} entries`);
console.log(`counties: ${Object.keys(countiesMeta).length} entries`);
console.log(`written → ${topoOut}`);
console.log(`written → ${metaOut}`);
