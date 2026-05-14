<template>
  <div class="map-wrapper">
    <div class="map-panel">
      <canvas ref="canvasRef" class="map-canvas" />
      <div v-if="hovered" class="tooltip" :style="{ left: hovered.x + 'px', top: hovered.y + 'px' }">
        <div class="county">{{ hovered.county }}</div>
        <div class="district">{{ hovered.district }}</div>
      </div>
    </div>

    <aside class="sidebar">
      <!-- Panel 1: 鄉鎮市區 -->
      <div class="panel">
        <p class="panel-title">鄉鎮市區</p>
        <select v-model="selectedTownCode" class="town-select">
          <option value="">請選擇…</option>
          <optgroup v-for="(towns, county) in townsByCounty" :key="String(county)" :label="String(county)">
            <option v-for="t in towns" :key="t.code" :value="t.code">{{ t.name }}</option>
          </optgroup>
        </select>
      </div>

      <!-- Panel 2: 比較項目 -->
      <div class="panel panel-filter">
        <p class="panel-title">比較項目</p>
        <div class="filter-list">
          <label v-for="f in filterIndex" :key="f.id" class="filter-item">
            <input type="checkbox" :value="f.id" v-model="selectedFilters" />
            {{ f.name }}
          </label>
        </div>
      </div>

      <!-- Panel 3: 結果 -->
      <div class="panel panel-result">
        <p class="panel-title">
          結果
          <span v-if="resultTowns.length" class="badge">{{ resultTowns.length }}</span>
        </p>
        <div v-if="!selectedTownCode" class="hint">請先選擇鄉鎮市區</div>
        <div v-else-if="!selectedFilters.length" class="hint">請選擇比較項目</div>
        <div v-else-if="!filtersLoaded" class="hint">載入中…</div>
        <div v-else-if="!resultTowns.length" class="hint">無符合條件</div>
        <div v-else class="result-list">
          <div
            v-for="t in resultTowns"
            :key="t.code"
            class="result-item"
            :class="{ active: selectedResultCode === t.code }"
            @click="selectedResultCode = selectedResultCode === t.code ? null : t.code"
          >
            <span class="result-county">{{ t.county }}</span>
            <span class="result-name">{{ t.name }}</span>
          </div>
        </div>
      </div>

      <!-- Panel 4: 詳細資料 -->
      <div v-if="selectedResultCode && detailTown" class="panel panel-detail">
        <p class="panel-title">
          <span class="detail-heading">{{ detailTown.county }} {{ detailTown.name }}</span>
        </p>
        <div class="detail-rows">
          <div v-for="fid in selectedFilters" :key="fid" class="detail-row">
            <span class="detail-filter-name">{{ filterNameMap[fid] ?? fid }}</span>
            <div class="detail-vals">
              <span class="val-ref">{{ formatVal(filterDataCache[fid]?.[selectedTownCode]) }}</span>
              <span class="val-arrow">→</span>
              <span class="val-result">{{ formatVal(filterDataCache[fid]?.[selectedResultCode!]) }}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, watchEffect, onMounted, onBeforeUnmount, shallowRef } from 'vue';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const hovered = ref<{ x: number; y: number; county: string; district: string } | null>(null);
const deckInstance = shallowRef<any>(null);
const meta = shallowRef<any>(null);
const filterIndex = ref<Array<{ id: string; name: string }>>([]);
const selectedTownCode = ref('');
const selectedFilters = ref<string[]>([]);
const filterDataCache = shallowRef<Record<string, Record<string, number | null>>>({});
const selectedResultCode = ref<string | null>(null);

let GeoJsonLayerCtor: any = null;
let FlyToInterpolatorCtor: any = null;
let geoTowns: any = null;
let geoCounties: any = null;
let deckViewState: any = { longitude: 120.9, latitude: 23.6, zoom: 7, minZoom: 5, maxZoom: 14 };
const loadingSet = new Set<string>();

const townsByCounty = computed(() => {
  if (!meta.value) return {} as Record<string, Array<{ code: string; name: string }>>;
  const groups: Record<string, Array<{ code: string; name: string }>> = {};
  for (const [code, info] of Object.entries<any>(meta.value.towns)) {
    const cName = meta.value.counties[info.COUNTYCODE]?.COUNTYNAME ?? '其他';
    if (!groups[cName]) groups[cName] = [];
    groups[cName].push({ code, name: info.TOWNNAME });
  }
  return groups;
});

const filtersLoaded = computed(() =>
  selectedFilters.value.length > 0 &&
  selectedFilters.value.every(id => id in filterDataCache.value)
);

const resultTowns = computed(() => {
  if (!selectedTownCode.value || !selectedFilters.value.length || !meta.value || !filtersLoaded.value) return [];
  return Object.keys(meta.value.towns)
    .filter(code => {
      if (code === selectedTownCode.value) return false;
      return selectedFilters.value.every(fid => {
        const data = filterDataCache.value[fid];
        if (!data) return false;
        const refVal = data[selectedTownCode.value];
        const val = data[code];
        return refVal != null && val != null && val > refVal;
      });
    })
    .map(code => {
      const t = meta.value.towns[code];
      const c = meta.value.counties[t.COUNTYCODE];
      return { code, name: t.TOWNNAME, county: c?.COUNTYNAME ?? '' };
    });
});

const detailTown = computed(() => {
  if (!selectedResultCode.value || !meta.value) return null;
  const t = meta.value.towns[selectedResultCode.value];
  const c = meta.value.counties[t?.COUNTYCODE];
  return { code: selectedResultCode.value, name: t?.TOWNNAME ?? '', county: c?.COUNTYNAME ?? '' };
});

const filterNameMap = computed(() =>
  Object.fromEntries(filterIndex.value.map(f => [f.id, f.name]))
);

function formatVal(val: number | null | undefined): string {
  if (val == null) return '—';
  return typeof val === 'number' ? val.toLocaleString() : String(val);
}

function getFeatureBbox(feature: any): [number, number, number, number] {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  const visit = (ring: number[][]) => {
    for (const [lng, lat] of ring) {
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
    }
  };
  const { type, coordinates } = feature.geometry;
  if (type === 'Polygon') coordinates.forEach(visit);
  else if (type === 'MultiPolygon') coordinates.forEach((poly: number[][][]) => poly.forEach(visit));
  return [minLng, minLat, maxLng, maxLat];
}

watch([selectedTownCode, selectedFilters], () => {
  selectedResultCode.value = null;
}, { deep: true });

watch(selectedResultCode, (code) => {
  deckInstance.value?.setProps({ layers: buildLayers() });
  if (!code || !geoTowns || !deckInstance.value || !FlyToInterpolatorCtor) return;
  const feature = geoTowns.features.find((f: any) => f.properties?.TOWNCODE === code);
  if (!feature) return;
  const [minLng, minLat, maxLng, maxLat] = getFeatureBbox(feature);
  const longitude = (minLng + maxLng) / 2;
  const latitude = (minLat + maxLat) / 2;
  const extent = Math.max(maxLng - minLng, maxLat - minLat);
  const zoom = Math.min(13, Math.max(9, Math.floor(Math.log2(400 / extent))));
  deckViewState = { ...deckViewState, longitude, latitude, zoom, minZoom: 5, maxZoom: 14,
    transitionDuration: 800, transitionInterpolator: new FlyToInterpolatorCtor({ speed: 1.5 }) };
  deckInstance.value.setProps({ viewState: deckViewState });
});

function buildLayers() {
  if (!GeoJsonLayerCtor || !geoTowns || !geoCounties) return [];
  return [
    new GeoJsonLayerCtor({
      id: 'towns',
      data: geoTowns,
      filled: true,
      stroked: true,
      getFillColor: (d: any) => {
        const code = d.properties?.TOWNCODE;
        if (code === selectedTownCode.value) return [255, 165, 0, 220];
        if (code === selectedResultCode.value) return [59, 130, 246, 200];
        return [245, 245, 240];
      },
      getLineColor: [180, 180, 180],
      lineWidthMinPixels: 0.5,
      pickable: true,
      autoHighlight: true,
      highlightColor: [200, 220, 255, 160],
      updateTriggers: { getFillColor: [selectedTownCode.value, selectedResultCode.value] },
      onHover: ({ object, x, y }: any) => {
        if (object) {
          const code = object.properties?.TOWNCODE;
          const townInfo = meta.value?.towns[code];
          const countyInfo = meta.value?.counties[townInfo?.COUNTYCODE];
          hovered.value = { x, y, county: countyInfo?.COUNTYNAME ?? '', district: townInfo?.TOWNNAME ?? '' };
        } else {
          hovered.value = null;
        }
      },
    }),
    new GeoJsonLayerCtor({
      id: 'counties',
      data: geoCounties,
      filled: false,
      stroked: true,
      getLineColor: [80, 80, 80],
      lineWidthMinPixels: 1.2,
      pickable: false,
    }),
  ];
}

watch(selectedTownCode, () => {
  deckInstance.value?.setProps({ layers: buildLayers() });
});

watchEffect(async () => {
  const toLoad = selectedFilters.value.filter(id => !(id in filterDataCache.value) && !loadingSet.has(id));
  if (!toLoad.length) return;
  toLoad.forEach(id => loadingSet.add(id));
  const results = await Promise.all(
    toLoad.map(async id => {
      const data = await fetch(`/data/${id}.json`).then(r => r.json());
      return [id, data] as const;
    })
  );
  results.forEach(([id]) => loadingSet.delete(id));
  filterDataCache.value = { ...filterDataCache.value, ...Object.fromEntries(results) };
});

onMounted(async () => {
  const [{ Deck, MapView, FlyToInterpolator }, { GeoJsonLayer }, { feature }] = await Promise.all([
    import('@deck.gl/core'),
    import('@deck.gl/layers'),
    import('topojson-client'),
  ]);
  GeoJsonLayerCtor = GeoJsonLayer;
  FlyToInterpolatorCtor = FlyToInterpolator;

  const [topoRes, metaRes, indexRes] = await Promise.all([
    fetch('/tw-towns-optimized.json'),
    fetch('/tw-towns-meta.json'),
    fetch('/data/index.json'),
  ]);
  const [topo, metaData, indexData] = await Promise.all([
    topoRes.json(), metaRes.json(), indexRes.json(),
  ]);

  meta.value = metaData;
  filterIndex.value = indexData;
  geoTowns = (feature as any)(topo, topo.objects.towns);
  geoCounties = (feature as any)(topo, topo.objects.counties);

  deckInstance.value = new Deck({
    canvas: canvasRef.value!,
    views: new MapView({ repeat: false }),
    viewState: deckViewState,
    onViewStateChange: ({ viewState }: any) => {
      deckViewState = viewState;
      deckInstance.value?.setProps({ viewState });
    },
    controller: true,
    layers: buildLayers(),
  });
});

onBeforeUnmount(() => {
  deckInstance.value?.finalize();
});
</script>

<style scoped>
.map-wrapper {
  position: fixed;
  inset: 0;
  background: #e8eaed;
}

/* Map panel */
.map-panel {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 284px; /* 260 sidebar + 12 gap + 12 sidebar-right-margin */
  bottom: 12px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
  background: #fafafa;
}
.map-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
.tooltip {
  position: absolute;
  pointer-events: none;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 13px;
  transform: translate(8px, 8px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}
.county { font-weight: 600; }
.district { color: #666; font-size: 12px; }

/* Sidebar */
.sidebar {
  position: absolute;
  top: 12px;
  right: 12px;
  bottom: 12px;
  width: 260px;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.97);
  border: 1px solid #d1d5db;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
  font-size: 13px;
}
.panel {
  padding: 12px 14px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}
.panel-filter {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex-shrink: 1;
}
.panel-result {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 80px;
}
.panel-detail {
  max-height: 240px;
  overflow-y: auto;
  border-bottom: none;
}
.panel-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #888;
  margin: 0 0 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.detail-heading {
  font-size: 12px;
  color: #222;
  font-weight: 700;
  text-transform: none;
  letter-spacing: 0;
}
.badge {
  background: #3b82f6;
  color: #fff;
  border-radius: 99px;
  padding: 1px 7px;
  font-size: 11px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
}
.town-select {
  width: 100%;
  padding: 5px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  background: #fff;
}
.filter-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  max-height: 200px;
}
.filter-item {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  cursor: pointer;
  line-height: 1.4;
}
.filter-item input {
  margin-top: 2px;
  flex-shrink: 0;
}
.hint {
  color: #bbb;
  font-size: 12px;
}
.result-list {
  flex: 1;
  overflow-y: auto;
}
.result-item {
  display: flex;
  gap: 8px;
  padding: 5px 6px;
  border-bottom: 1px solid #f0f0f0;
  align-items: baseline;
  cursor: pointer;
  border-radius: 4px;
}
.result-item:hover { background: #f5f7ff; }
.result-item.active { background: #eff6ff; }
.result-item:last-child { border-bottom: none; }
.result-county {
  color: #aaa;
  font-size: 11px;
  white-space: nowrap;
  flex-shrink: 0;
}
.result-name { font-size: 13px; }
.result-item.active .result-name {
  font-weight: 600;
  color: #1d4ed8;
}

/* Detail panel */
.detail-rows {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.detail-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.detail-filter-name {
  font-size: 11px;
  color: #999;
  line-height: 1.3;
}
.detail-vals {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}
.val-ref { color: #888; }
.val-arrow { color: #ccc; font-size: 11px; }
.val-result { color: #2563eb; font-weight: 600; }
</style>
