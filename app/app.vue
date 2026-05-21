<template>
  <div class="map-wrapper">
    <!-- Map canvas: always in background, hidden only on step 1 -->
    <canvas
      ref="canvasRef"
      class="map-canvas"
      :class="{ 'map-hidden': currentStep === 1 }"
    />
    <div
      v-if="hovered && currentStep > 1"
      class="tooltip"
      :style="{ left: hovered.x + 'px', top: hovered.y + 'px' }"
    >
      <div class="county">{{ hovered.county }}</div>
      <div class="district">{{ hovered.district }}</div>
    </div>

    <Transition name="fade" mode="out-in">
      <StepLocation
        v-if="currentStep === 1"
        :meta="meta"
        :county-code="selectedCountyCode"
        :town-code="selectedTownCode"
        @update:county-code="selectedCountyCode = $event"
        @update:town-code="selectedTownCode = $event"
        @next="goToStep(2)"
      />
      <StepCriteria
        v-else-if="currentStep === 2"
        :meta="meta"
        :filter-index="filterIndex"
        :selected-town-code="selectedTownCode"
        :filter-data-cache="filterDataCache"
        :selected-filters="selectedFilters"
        @update:selected-filters="selectedFilters = $event"
        @next="goToStep(3)"
        @back="goToStep(1)"
      />
      <StepResult
        v-else-if="currentStep === 3"
        :meta="meta"
        :filter-index="filterIndex"
        :filter-data-cache="filterDataCache"
        :selected-town-code="selectedTownCode"
        :selected-filters="selectedFilters"
        :result-towns="resultTowns"
        :selected-result-code="selectedResultCode"
        @update:selected-result-code="selectedResultCode = $event"
        @update:selected-filters="selectedFilters = $event"
        @back="goToStep(2)"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, watchEffect, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import StepLocation from './components/StepLocation.vue'
import StepCriteria from './components/StepCriteria.vue'
import StepResult from './components/StepResult.vue'

// Step state
const currentStep = ref<1 | 2 | 3>(1)

// Map state
const canvasRef = ref<HTMLCanvasElement | null>(null)
const hovered = ref<{ x: number; y: number; county: string; district: string } | null>(null)
const deckInstance = shallowRef<any>(null)
const meta = shallowRef<any>(null)

// Data state
const filterIndex = ref<Array<{ id: string; name: string; lowerIsBetter: boolean }>>([])
const filterDataCache = shallowRef<Record<string, Record<string, number | null>>>({})

// Selection state
const selectedCountyCode = ref('')
const selectedTownCode = ref('')
const selectedFilters = ref<string[]>([])
const selectedResultCode = ref<string | null>(null)

let GeoJsonLayerCtor: any = null
let ScatterplotLayerCtor: any = null
let FlyToInterpolatorCtor: any = null
let geoTowns: any = null
let geoCounties: any = null
let townCentroids: Map<string, [number, number]> = new Map()
let deckViewState: any = { longitude: 120.9, latitude: 23.6, zoom: 7, minZoom: 5, maxZoom: 14 }
const loadingSet = new Set<string>()

// Computed

const resultTowns = computed(() => {
  if (!selectedTownCode.value || !selectedFilters.value.length || !meta.value) return []
  if (!selectedFilters.value.every(id => id in filterDataCache.value)) return []
  const filterMeta = Object.fromEntries(filterIndex.value.map(f => [f.id, f]))
  return Object.keys(meta.value.towns)
    .filter(code => {
      if (code === selectedTownCode.value) return false
      return selectedFilters.value.every(fid => {
        const data = filterDataCache.value[fid]
        if (!data) return false
        const refVal = data[selectedTownCode.value]
        const val = data[code]
        if (refVal == null || val == null) return false
        return filterMeta[fid]?.lowerIsBetter ? val < refVal : val > refVal
      })
    })
    .map(code => {
      const t = meta.value.towns[code]
      const c = meta.value.counties[t.COUNTYCODE]
      return { code, name: t.TOWNNAME, county: c?.COUNTYNAME ?? '' }
    })
})

// Navigation

function goToStep(step: 1 | 2 | 3) {
  currentStep.value = step
}

// Map helpers

function getFeatureBbox(feature: any): [number, number, number, number] {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity
  const visit = (ring: number[][]) => {
    for (const [lng, lat] of ring) {
      if (lng < minLng) minLng = lng
      if (lat < minLat) minLat = lat
      if (lng > maxLng) maxLng = lng
      if (lat > maxLat) maxLat = lat
    }
  }
  const { type, coordinates } = feature.geometry
  if (type === 'Polygon') coordinates.forEach(visit)
  else if (type === 'MultiPolygon') coordinates.forEach((poly: number[][][]) => poly.forEach(visit))
  return [minLng, minLat, maxLng, maxLat]
}

function flyToCounty(countyCode: string) {
  if (!geoTowns || !deckInstance.value || !FlyToInterpolatorCtor || !meta.value) return
  const townCodes = new Set(
    Object.entries<any>(meta.value.towns)
      .filter(([, info]) => info.COUNTYCODE === countyCode)
      .map(([code]) => code)
  )
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity
  for (const f of geoTowns.features) {
    if (!townCodes.has(f.properties?.TOWNCODE)) continue
    const [a, b, c, d] = getFeatureBbox(f)
    if (a < minLng) minLng = a
    if (b < minLat) minLat = b
    if (c > maxLng) maxLng = c
    if (d > maxLat) maxLat = d
  }
  if (!isFinite(minLng)) return
  const longitude = (minLng + maxLng) / 2
  const latitude = (minLat + maxLat) / 2
  const extent = Math.max(maxLng - minLng, maxLat - minLat)
  const zoom = Math.min(12, Math.max(7, Math.floor(Math.log2(400 / extent))))
  deckViewState = {
    ...deckViewState, longitude, latitude, zoom,
    transitionDuration: 800, transitionInterpolator: new FlyToInterpolatorCtor({ speed: 1.5 }),
  }
  deckInstance.value.setProps({ viewState: deckViewState })
}

function flyToTaiwan() {
  if (!deckInstance.value || !FlyToInterpolatorCtor) return
  deckViewState = {
    ...deckViewState, longitude: 120.9, latitude: 23.6, zoom: 7,
    transitionDuration: 800, transitionInterpolator: new FlyToInterpolatorCtor({ speed: 1.5 }),
  }
  deckInstance.value.setProps({ viewState: deckViewState })
}

function buildLayers() {
  if (!GeoJsonLayerCtor || !geoTowns || !geoCounties) return []
  const layers: any[] = [
    new GeoJsonLayerCtor({
      id: 'towns',
      data: geoTowns,
      filled: true,
      stroked: true,
      getFillColor: (d: any) => {
        const code = d.properties?.TOWNCODE
        if (code === selectedTownCode.value) return [255, 165, 0, 220]
        if (code === selectedResultCode.value) return [59, 130, 246, 200]
        return [245, 245, 240]
      },
      getLineColor: [180, 180, 180],
      lineWidthMinPixels: 0.5,
      pickable: true,
      autoHighlight: true,
      highlightColor: [200, 220, 255, 160],
      updateTriggers: { getFillColor: [selectedTownCode.value, selectedResultCode.value] },
      onHover: ({ object, x, y }: any) => {
        if (object) {
          const code = object.properties?.TOWNCODE
          const townInfo = meta.value?.towns[code]
          const countyInfo = meta.value?.counties[townInfo?.COUNTYCODE]
          hovered.value = { x, y, county: countyInfo?.COUNTYNAME ?? '', district: townInfo?.TOWNNAME ?? '' }
        } else {
          hovered.value = null
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
  ]

  // Result + selected markers (step 3 only)
  if (currentStep.value === 3 && ScatterplotLayerCtor) {
    const resultPoints = resultTowns.value
      .map(t => ({ code: t.code, position: townCentroids.get(t.code) }))
      .filter(d => d.position) as Array<{ code: string; position: [number, number] }>

    layers.push(
      new ScatterplotLayerCtor({
        id: 'result-markers',
        data: resultPoints,
        getPosition: (d: any) => d.position,
        getRadius: 5,
        radiusUnits: 'pixels',
        getFillColor: [217, 217, 217, 255],
        getLineColor: [0, 0, 0, 255],
        lineWidthUnits: 'pixels',
        getLineWidth: 2,
        stroked: true,
        filled: true,
        pickable: false,
      }),
    )

    const selectedPosition = townCentroids.get(selectedTownCode.value)
    if (selectedPosition) {
      layers.push(
        new ScatterplotLayerCtor({
          id: 'selected-pin',
          data: [{ position: selectedPosition }],
          getPosition: (d: any) => d.position,
          getRadius: 9,
          radiusUnits: 'pixels',
          getFillColor: [217, 217, 217, 255],
          getLineColor: [0, 0, 0, 255],
          lineWidthUnits: 'pixels',
          getLineWidth: 3,
          stroked: true,
          filled: true,
          pickable: false,
        }),
      )
    }
  }

  return layers
}

// Watches

watch([selectedTownCode, selectedFilters], () => {
  selectedResultCode.value = null
}, { deep: true })

watch(selectedResultCode, (code) => {
  deckInstance.value?.setProps({ layers: buildLayers() })
  if (!code || !geoTowns || !deckInstance.value || !FlyToInterpolatorCtor) return
  const feature = geoTowns.features.find((f: any) => f.properties?.TOWNCODE === code)
  if (!feature) return
  const [minLng, minLat, maxLng, maxLat] = getFeatureBbox(feature)
  const longitude = (minLng + maxLng) / 2
  const latitude = (minLat + maxLat) / 2
  const extent = Math.max(maxLng - minLng, maxLat - minLat)
  const zoom = Math.min(13, Math.max(9, Math.floor(Math.log2(400 / extent))))
  deckViewState = {
    ...deckViewState, longitude, latitude, zoom,
    transitionDuration: 800, transitionInterpolator: new FlyToInterpolatorCtor({ speed: 1.5 }),
  }
  deckInstance.value.setProps({ viewState: deckViewState })
})

watch(selectedTownCode, () => {
  deckInstance.value?.setProps({ layers: buildLayers() })
})

watch(currentStep, async (step) => {
  deckInstance.value?.setProps({ layers: buildLayers() })
  if (step === 2) {
    await preloadAllFilters()
    if (selectedCountyCode.value) flyToCounty(selectedCountyCode.value)
  } else if (step === 3) {
    flyToTaiwan()
  }
})

watch(resultTowns, () => {
  if (currentStep.value === 3) {
    deckInstance.value?.setProps({ layers: buildLayers() })
  }
})

// Load all filter data (for step 2 stats panel)
async function preloadAllFilters() {
  const toLoad = filterIndex.value
    .map(f => f.id)
    .filter(id => !(id in filterDataCache.value) && !loadingSet.has(id))
  if (!toLoad.length) return
  toLoad.forEach(id => loadingSet.add(id))
  const results = await Promise.all(
    toLoad.map(async id => {
      const data = await fetch(`/data/${id}.json`).then(r => r.json())
      return [id, data] as const
    })
  )
  results.forEach(([id]) => loadingSet.delete(id))
  filterDataCache.value = { ...filterDataCache.value, ...Object.fromEntries(results) }
}

// Load selected filter data (for result computation)
watchEffect(async () => {
  const toLoad = selectedFilters.value.filter(id => !(id in filterDataCache.value) && !loadingSet.has(id))
  if (!toLoad.length) return
  toLoad.forEach(id => loadingSet.add(id))
  const results = await Promise.all(
    toLoad.map(async id => {
      const data = await fetch(`/data/${id}.json`).then(r => r.json())
      return [id, data] as const
    })
  )
  results.forEach(([id]) => loadingSet.delete(id))
  filterDataCache.value = { ...filterDataCache.value, ...Object.fromEntries(results) }
})

onMounted(async () => {
  const [{ Deck, MapView, FlyToInterpolator }, { GeoJsonLayer, ScatterplotLayer }, { feature }] = await Promise.all([
    import('@deck.gl/core'),
    import('@deck.gl/layers'),
    import('topojson-client'),
  ])
  GeoJsonLayerCtor = GeoJsonLayer
  ScatterplotLayerCtor = ScatterplotLayer
  FlyToInterpolatorCtor = FlyToInterpolator

  const [topoRes, metaRes, indexRes] = await Promise.all([
    fetch('/tw-towns-optimized.json'),
    fetch('/tw-towns-meta.json'),
    fetch('/data/index.json'),
  ])
  const [topo, metaData, indexData] = await Promise.all([
    topoRes.json(), metaRes.json(), indexRes.json(),
  ])

  meta.value = metaData
  filterIndex.value = indexData
  geoTowns = (feature as any)(topo, topo.objects.towns)
  geoCounties = (feature as any)(topo, topo.objects.counties)

  // Precompute town centroids (bbox center)
  for (const f of geoTowns.features) {
    const code = f.properties?.TOWNCODE
    if (!code) continue
    const [minLng, minLat, maxLng, maxLat] = getFeatureBbox(f)
    townCentroids.set(code, [(minLng + maxLng) / 2, (minLat + maxLat) / 2])
  }

  deckInstance.value = new Deck({
    canvas: canvasRef.value!,
    views: new MapView({ repeat: false }),
    viewState: deckViewState,
    onViewStateChange: ({ viewState }: any) => {
      deckViewState = viewState
      deckInstance.value?.setProps({ viewState })
    },
    controller: true,
    layers: buildLayers(),
  })
})

onBeforeUnmount(() => {
  deckInstance.value?.finalize()
})
</script>

<style scoped>
.map-wrapper {
  position: fixed;
  inset: 0;
  background: #e8eaed;
  overflow: hidden;
}

.map-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  transition: opacity 0.4s ease;
}

.map-hidden {
  opacity: 0;
  pointer-events: none;
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
  z-index: 20;
}

.county {
  font-weight: 600;
}

.district {
  color: #666;
  font-size: 12px;
}

/* Step transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
