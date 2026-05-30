<template>
  <div class="map-wrapper">
    <!-- Map canvas: background layer, only shown on step 3 (result).
         Step 1/2 hide it; step 2's small-map block will later host it. -->
    <canvas
      ref="canvasRef"
      class="map-canvas"
      :class="{ 'map-hidden': currentStep !== 3 }"
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
        :selected-town-thumb="selectedTownThumb"
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
        @reselect="goToStep(1)"
        @zoom-in="zoomBy(1)"
        @zoom-out="zoomBy(-1)"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import StepLocation from './components/StepLocation.vue'
import StepCriteria from './components/StepCriteria.vue'
import StepResult from './components/StepResult.vue'
import { useResultTowns } from './composables/useResultTowns'
import { useFilterData } from './composables/useFilterData'
import seoMeta from './locales/meta.json'

// SEO meta（文案來自 locales/meta.json）
const config = useRuntimeConfig()
const APP_MODE = config.public.APP_MODE
const ASSETS_PATH = config.public.APP_ASSETS_PATH

useSeoMeta({
  title: seoMeta.metaTitle,
  description: seoMeta.metaDesc,
  ogTitle: seoMeta.metaTitle,
  ogDescription: seoMeta.metaXDesc,
  ogImage: `${ASSETS_PATH}/img/${seoMeta.metaImage}`,
  ogUrl: seoMeta.metaURL,
  twitterTitle: seoMeta.metaTitle,
  twitterDescription: seoMeta.metaXDesc,
  twitterCard: 'summary_large_image',
  keywords: seoMeta.metaKeywords,
  robots: APP_MODE === 'production' ? 'index, follow' : 'noindex, nofollow',
})

// Step state
const currentStep = ref<1 | 2 | 3>(1)

// Map state
const canvasRef = ref<HTMLCanvasElement | null>(null)
const hovered = ref<{ x: number; y: number; county: string; district: string } | null>(null)
const deckInstance = shallowRef<any>(null)
const meta = shallowRef<any>(null)

// Selection state
const selectedCountyCode = ref('')
const selectedTownCode = ref('')
const selectedFilters = ref<string[]>([])

// Data state: filter index + dataset cache
const { filterIndex, filterDataCache, preloadAllFilters, loadIndex } = useFilterData({ selectedFilters })

// Step-2 small-map thumbnail: normalized SVG path of the selected town only
const selectedTownThumb = ref<{ path: string; width: number; height: number } | null>(null)

let GeoJsonLayerCtor: any = null
let ScatterplotLayerCtor: any = null
let FlyToInterpolatorCtor: any = null
let geoTowns: any = null
let geoCounties: any = null
let townCentroids: Map<string, [number, number]> = new Map()
let deckViewState: any = { longitude: 120.9, latitude: 23.6, zoom: 7, minZoom: 5, maxZoom: 14 }

// Result computation (explore-compare 3.4)
const { selectedResultCode, resultTowns, suppressResultFly, ensureDefaultResult } = useResultTowns({
  meta,
  filterIndex,
  filterDataCache,
  selectedTownCode,
  selectedFilters,
  currentStep,
})

// Navigation

function goToStep(step: 1 | 2 | 3) {
  currentStep.value = step
}

// Step-3 zoom buttons (explore-zoom 3.5) → adjust deck zoom within bounds
function zoomBy(delta: number) {
  if (!deckInstance.value) return
  const z = Math.min(14, Math.max(5, (deckViewState.zoom ?? 7) + delta))
  deckViewState = { ...deckViewState, zoom: z }
  deckInstance.value.setProps({ viewState: deckViewState })
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

// Build a normalized SVG path for a single town, used as the step-2 thumbnail.
// Coordinates are projected (lng scaled by cos(lat) to avoid horizontal squish)
// and emitted in a local viewBox so the SVG can stretch-fit the small-map block.
function buildTownThumb(code: string) {
  if (!geoTowns || !code) return null
  const f = geoTowns.features.find((ft: any) => ft.properties?.TOWNCODE === code)
  if (!f) return null
  const rings: number[][][] = []
  const { type, coordinates } = f.geometry
  if (type === 'Polygon') rings.push(...coordinates)
  else if (type === 'MultiPolygon') coordinates.forEach((poly: number[][][]) => rings.push(...poly))

  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity
  for (const ring of rings) {
    for (const [lng, lat] of ring) {
      if (lng < minLng) minLng = lng
      if (lat < minLat) minLat = lat
      if (lng > maxLng) maxLng = lng
      if (lat > maxLat) maxLat = lat
    }
  }
  if (!isFinite(minLng)) return null

  const midLat = (minLat + maxLat) / 2
  const kx = Math.cos((midLat * Math.PI) / 180) // lng compression at this latitude
  const width = (maxLng - minLng) * kx
  const height = maxLat - minLat
  const toX = (lng: number) => ((lng - minLng) * kx).toFixed(5)
  const toY = (lat: number) => (maxLat - lat).toFixed(5) // flip Y for SVG

  const path = rings
    .map(ring => ring.map(([lng, lat], i) => `${i === 0 ? 'M' : 'L'}${toX(lng)} ${toY(lat)}`).join(' ') + ' Z')
    .join(' ')

  return { path, width, height }
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

watch(selectedResultCode, (code) => {
  deckInstance.value?.setProps({ layers: buildLayers() })
  if (suppressResultFly.value) {
    suppressResultFly.value = false
    return
  }
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
  selectedTownThumb.value = buildTownThumb(selectedTownCode.value)
})

watch(currentStep, async (step) => {
  deckInstance.value?.setProps({ layers: buildLayers() })
  if (step === 2) {
    await preloadAllFilters()
    if (selectedCountyCode.value) flyToCounty(selectedCountyCode.value)
  } else if (step === 3) {
    flyToTaiwan()
    ensureDefaultResult()
  }
})

watch(resultTowns, () => {
  if (currentStep.value === 3) {
    ensureDefaultResult()
    deckInstance.value?.setProps({ layers: buildLayers() })
  }
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

  // 篩選清單由 useFilterData 載入；與地圖底圖/meta 並行抓取
  const indexReady = loadIndex()
  const [topoRes, metaRes] = await Promise.all([
    fetch('/tw-towns-optimized.json'),
    fetch('/tw-towns-meta.json'),
  ])
  const [topo, metaData] = await Promise.all([topoRes.json(), metaRes.json()])

  meta.value = metaData
  geoTowns = (feature as any)(topo, topo.objects.towns)
  geoCounties = (feature as any)(topo, topo.objects.counties)

  // Precompute town centroids (bbox center)
  for (const f of geoTowns.features) {
    const code = f.properties?.TOWNCODE
    if (!code) continue
    const [minLng, minLat, maxLng, maxLat] = getFeatureBbox(f)
    townCentroids.set(code, [(minLng + maxLng) / 2, (minLat + maxLat) / 2])
  }

  // Init step-2 thumbnail in case a town was already chosen before geo loaded
  selectedTownThumb.value = buildTownThumb(selectedTownCode.value)

  await indexReady

  deckInstance.value = new Deck({
    canvas: canvasRef.value!,
    views: new MapView({ repeat: false }),
    viewState: deckViewState,
    onViewStateChange: ({ viewState }: any) => {
      // Strip any lingering flyTo transition props, otherwise each user
      // pan/zoom step gets re-animated and the map feels stuck / snaps back.
      const next = { ...viewState }
      delete next.transitionDuration
      delete next.transitionInterpolator
      delete next.transitionEasing
      delete next.transitionInterruption
      deckViewState = next
      deckInstance.value?.setProps({ viewState: next })
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

<!-- Global (non-scoped): deck.gl v9 inserts a `.deck-widget-container` overlay
     above the canvas. Without the widget stylesheet it defaults to
     pointer-events: auto and swallows drag/zoom before they reach the canvas.
     Make it pass-through; real widgets re-enable their own events.
     Per-step touchability is still governed by the canvas `.map-hidden` toggle
     (pointer-events: none on step 1/2, auto on step 3), so this stays global. -->
<style>
.deck-widget-container {
  pointer-events: none;
}

.deck-widget-container > * {
  pointer-events: auto;
}
</style>
