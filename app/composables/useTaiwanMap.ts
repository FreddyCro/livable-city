import { ref, shallowRef, watch, onMounted, onBeforeUnmount, type Ref } from 'vue'
import type { ResultTown } from './useResultTowns'
import type { GeoMeta } from '../types/geo'
import { dataSource } from '../utils/dataSource'
import { SELECTED_PIN_ICON } from '../utils/mapMarkers'

export interface HoverInfo {
  x: number
  y: number
  county: string
  district: string
}

export interface TownThumb {
  path: string
  width: number
  height: number
}

interface UseTaiwanMapOptions {
  canvasRef: Ref<HTMLCanvasElement | null>
  /** 鄉鎮/縣市 metadata（tw-towns-meta.json）；唯讀傳入，由 useGeoMeta 載入（載入前為 null） */
  meta: Ref<GeoMeta | null>
  currentStep: Ref<1 | 2 | 3>
  selectedTownCode: Ref<string>
  selectedResultCode: Ref<string | null>
  resultTowns: Ref<ResultTown[]>
}

/**
 * 地圖引擎層：封裝 deck.gl 的初始化、圖層建構、flyTo 動畫與 hover/縮圖狀態。
 *
 * 圖層會自動跟著 selection / step / 結果變化重繪；對外只暴露命令式的
 * 鏡頭操作（zoomBy / flyToCounty / flyToTaiwan / focusTown）與展示用狀態
 * （hovered / selectedTownThumb）。app.vue 不需要知道 setProps 的存在。
 */
export function useTaiwanMap(opts: UseTaiwanMapOptions) {
  const { canvasRef, meta, currentStep, selectedTownCode, selectedResultCode, resultTowns } = opts

  const hovered = ref<HoverInfo | null>(null)
  // Step-2 small-map thumbnail: normalized SVG path of the selected town only
  const selectedTownThumb = ref<TownThumb | null>(null)

  const deckInstance = shallowRef<any>(null)
  let GeoJsonLayerCtor: any = null
  let ScatterplotLayerCtor: any = null
  let IconLayerCtor: any = null
  let FlyToInterpolatorCtor: any = null
  let geoTowns: any = null
  let geoCounties: any = null
  const townCentroids: Map<string, [number, number]> = new Map()
  let deckViewState: any = { longitude: 120.9, latitude: 23.6, zoom: 7, minZoom: 5, maxZoom: 14 }

  function getFeatureBbox(feature: any): [number, number, number, number] {
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity
    const visit = (ring: [number, number][]) => {
      for (const [lng, lat] of ring) {
        if (lng < minLng) minLng = lng
        if (lat < minLat) minLat = lat
        if (lng > maxLng) maxLng = lng
        if (lat > maxLat) maxLat = lat
      }
    }
    const { type, coordinates } = feature.geometry
    if (type === 'Polygon') coordinates.forEach(visit)
    else if (type === 'MultiPolygon') coordinates.forEach((poly: [number, number][][]) => poly.forEach(visit))
    return [minLng, minLat, maxLng, maxLat]
  }

  // Build a normalized SVG path for a single town, used as the step-2 thumbnail.
  // Coordinates are projected (lng scaled by cos(lat) to avoid horizontal squish)
  // and emitted in a local viewBox so the SVG can stretch-fit the small-map block.
  function buildTownThumb(code: string): TownThumb | null {
    if (!geoTowns || !code) return null
    const f = geoTowns.features.find((ft: any) => ft.properties?.TOWNCODE === code)
    if (!f) return null
    const rings: [number, number][][] = []
    const { type, coordinates } = f.geometry
    if (type === 'Polygon') rings.push(...coordinates)
    else if (type === 'MultiPolygon') coordinates.forEach((poly: [number, number][][]) => rings.push(...poly))

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
      Object.entries(meta.value.towns)
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

  // Fly the camera to a single town (used when the user picks a result card).
  // Defaulting the result selection sets the code without calling this, so the
  // step-3 Taiwan overview stays put.
  function focusTown(code: string | null) {
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
  }

  // Step-3 zoom buttons (explore-zoom 3.5) → adjust deck zoom within bounds
  function zoomBy(delta: number) {
    if (!deckInstance.value) return
    const z = Math.min(14, Math.max(5, (deckViewState.zoom ?? 7) + delta))
    deckViewState = { ...deckViewState, zoom: z }
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
            const countyInfo = townInfo ? meta.value?.counties[townInfo.COUNTYCODE] : undefined
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
          getRadius: 4.5,
          radiusUnits: 'pixels',
          getFillColor: [244, 204, 52, 255], // #F4CC34
          getLineColor: [0, 0, 0, 255],
          lineWidthUnits: 'pixels',
          getLineWidth: 1,
          stroked: true,
          filled: true,
          pickable: false,
        }),
      )

      const selectedPosition = townCentroids.get(selectedTownCode.value)
      if (selectedPosition && IconLayerCtor) {
        layers.push(
          new IconLayerCtor({
            id: 'selected-pin',
            data: [{ position: selectedPosition }],
            getPosition: (d: any) => d.position,
            getIcon: () => SELECTED_PIN_ICON,
            getSize: 31,
            sizeUnits: 'pixels',
            pickable: false,
          }),
        )
      }
    }

    return layers
  }

  function refreshLayers() {
    deckInstance.value?.setProps({ layers: buildLayers() })
  }

  // Layers follow selection / step / results
  watch([selectedTownCode, selectedResultCode, currentStep, resultTowns], () => {
    refreshLayers()
  })

  // Step-2 thumbnail follows the selected town
  watch(selectedTownCode, () => {
    selectedTownThumb.value = buildTownThumb(selectedTownCode.value)
  })

  onMounted(async () => {
    const [{ Deck, MapView, FlyToInterpolator }, { GeoJsonLayer, ScatterplotLayer, IconLayer }, { feature }] = await Promise.all([
      import('@deck.gl/core'),
      import('@deck.gl/layers'),
      import('topojson-client'),
    ])
    GeoJsonLayerCtor = GeoJsonLayer
    ScatterplotLayerCtor = ScatterplotLayer
    IconLayerCtor = IconLayer
    FlyToInterpolatorCtor = FlyToInterpolator

    // meta 由 useGeoMeta 載入；這裡只取地圖底圖 topology
    const topo = await dataSource.geoTopology()
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

  return { hovered, selectedTownThumb, zoomBy, flyToCounty, flyToTaiwan, focusTown }
}
