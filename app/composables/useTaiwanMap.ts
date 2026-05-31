import { ref, shallowRef, watch, onMounted, onBeforeUnmount, type Ref } from 'vue'
import type { ResultTown } from './useResultTowns'

// Step-3 selected-town marker (teardrop pin). deck.gl can't render SVG directly,
// so we feed it to an IconLayer as a data-URI image. 26×31 viewBox; the tip sits
// at the bottom-centre, which becomes the icon anchor so it points at the town.
const SELECTED_PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="31" viewBox="0 0 26 31" fill="none"><path d="M12.75 0.25C16.0634 0.25 19.2423 1.55221 21.5869 3.87109C23.9315 6.1901 25.25 9.33628 25.25 12.6182C25.2499 17.4365 22.1307 21.8449 19.1113 24.9971C17.5912 26.5841 16.0724 27.8773 14.9346 28.7734C14.3653 29.2218 13.8903 29.5722 13.5566 29.8105C13.3898 29.9297 13.2574 30.0211 13.167 30.083C13.1221 30.1138 13.0873 30.1373 13.0635 30.1533C13.0517 30.1612 13.0425 30.1677 13.0361 30.1719C13.033 30.174 13.0301 30.1756 13.0283 30.1768L13.0264 30.1777L13.0254 30.1787C12.8792 30.2751 12.6947 30.2873 12.5391 30.2148L12.4746 30.1787C12.4741 30.1784 12.4726 30.1773 12.4717 30.1768C12.4699 30.1756 12.467 30.174 12.4639 30.1719C12.4575 30.1677 12.4483 30.1612 12.4365 30.1533C12.4127 30.1373 12.3779 30.1138 12.333 30.083C12.2426 30.0211 12.1102 29.9297 11.9434 29.8105C11.6097 29.5722 11.1347 29.2218 10.5654 28.7734C9.42759 27.8773 7.90884 26.5841 6.38867 24.9971C3.36932 21.8449 0.250053 17.4365 0.25 12.6182C0.250027 9.33628 1.5685 6.1901 3.91309 3.87109C6.2577 1.55221 9.43656 0.25 12.75 0.25ZM12.75 7.34277C10.541 7.34277 8.75025 9.11415 8.75 11.2988C8.75 13.4837 10.5409 15.2559 12.75 15.2559C14.9591 15.2559 16.75 13.4837 16.75 11.2988C16.7498 9.11415 14.959 7.34277 12.75 7.34277Z" fill="#D62E29"/><path d="M12.75 0.25V0.5C15.998 0.5 19.1136 1.77652 21.4111 4.04884L21.5869 3.87109L21.7627 3.69334C19.371 1.32791 16.1289 0 12.75 0V0.25ZM21.5869 3.87109L21.4111 4.04884C23.7085 6.3212 25 9.4035 25 12.6182L25.25 12.6182L25.5 12.6182C25.5 9.26907 24.1545 6.05901 21.7627 3.69335L21.5869 3.87109ZM25.25 12.6182L25 12.6182C24.9999 17.335 21.9404 21.6821 18.9308 24.8241L19.1113 24.9971L19.2919 25.17C22.3209 22.0077 25.4999 17.538 25.5 12.6182L25.25 12.6182ZM19.1113 24.9971L18.9308 24.8241C17.4208 26.4005 15.9113 27.686 14.7799 28.577L14.9346 28.7734L15.0893 28.9698C16.2335 28.0686 17.7615 26.7676 19.2919 25.17L19.1113 24.9971ZM14.9346 28.7734L14.7799 28.577C14.2139 29.0228 13.7421 29.3709 13.4113 29.6071L13.5566 29.8105L13.702 30.014C14.0386 29.7735 14.5167 29.4208 15.0892 28.9698L14.9346 28.7734ZM13.5566 29.8105L13.4113 29.6071C13.2463 29.725 13.1153 29.8154 13.0257 29.8768L13.167 30.083L13.3083 30.2893C13.3995 30.2268 13.5333 30.1344 13.702 30.014L13.5566 29.8105ZM13.167 30.083L13.0257 29.8768C12.9814 29.9071 12.9472 29.9302 12.9241 29.9458L13.0635 30.1533L13.2029 30.3608C13.2274 30.3444 13.2628 30.3204 13.3083 30.2893L13.167 30.083ZM13.0635 30.1533L12.9241 29.9458C12.9036 29.9596 12.9072 29.9574 12.8976 29.9638L13.0361 30.1719L13.1747 30.38C13.1777 30.378 13.1998 30.3629 13.2029 30.3608L13.0635 30.1533ZM13.0361 30.1719L12.8978 29.9636C12.9006 29.9618 12.9026 29.9606 12.9019 29.961C12.9016 29.9612 12.9017 29.9612 12.901 29.9615C12.9006 29.9618 12.8999 29.9622 12.8991 29.9627C12.8978 29.9635 12.8944 29.9656 12.8903 29.9683L13.0283 30.1768L13.1663 30.3852C13.1631 30.3873 13.1607 30.3888 13.1605 30.3889C13.1605 30.3889 13.1599 30.3893 13.1615 30.3883C13.1635 30.3871 13.1685 30.3841 13.1744 30.3801L13.0361 30.1719ZM13.0283 30.1768L12.9165 29.9532L12.9146 29.9541L13.0264 30.1777L13.1382 30.4013L13.1401 30.4004L13.0283 30.1768ZM13.0264 30.1777L12.8496 30.001L12.8486 30.0019L13.0254 30.1787L13.2022 30.3555L13.2031 30.3545L13.0264 30.1777ZM13.0254 30.1787L12.8878 29.97C12.8146 30.0182 12.7221 30.0243 12.6445 29.9882L12.5391 30.2148L12.4336 30.4415C12.6673 30.5502 12.9438 30.5319 13.163 30.3874L13.0254 30.1787ZM12.5391 30.2148L12.6613 29.9968L12.5969 29.9606L12.4746 30.1787L12.3524 30.3968L12.4168 30.4329L12.5391 30.2148ZM12.4746 30.1787L12.6129 29.9705C12.613 29.9705 12.6129 29.9704 12.6121 29.9699C12.6116 29.9696 12.6107 29.969 12.6099 29.9684L12.4717 30.1768L12.3335 30.3851C12.3335 30.3851 12.3335 30.3851 12.3335 30.3851C12.3336 30.3852 12.3337 30.3852 12.3338 30.3853C12.334 30.3854 12.3342 30.3856 12.3345 30.3858C12.3348 30.386 12.3357 30.3866 12.3363 30.387L12.4746 30.1787ZM12.4717 30.1768L12.6097 29.9683C12.6056 29.9656 12.6022 29.9635 12.6009 29.9627C12.6001 29.9622 12.5993 29.9618 12.5989 29.9615C12.5983 29.9611 12.5984 29.9612 12.5981 29.961C12.5974 29.9606 12.5994 29.9618 12.6022 29.9636L12.4639 30.1719L12.3255 30.3801C12.3315 30.3841 12.3365 30.3871 12.3385 30.3883C12.3402 30.3893 12.3395 30.3889 12.3395 30.3889C12.3393 30.3888 12.3369 30.3873 12.3336 30.3852L12.4717 30.1768ZM12.4639 30.1719L12.6024 29.9638C12.5928 29.9574 12.5964 29.9596 12.5759 29.9458L12.4365 30.1533L12.2971 30.3608C12.3002 30.3629 12.3223 30.378 12.3253 30.38L12.4639 30.1719ZM12.4365 30.1533L12.5759 29.9458C12.5528 29.9302 12.5186 29.9071 12.4743 29.8768L12.333 30.083L12.1917 30.2893C12.2372 30.3204 12.2726 30.3444 12.2971 30.3608L12.4365 30.1533ZM12.333 30.083L12.4743 29.8768C12.3847 29.8154 12.2537 29.725 12.0887 29.6071L11.9434 29.8105L11.798 30.014C11.9667 30.1344 12.1005 30.2268 12.1917 30.2893L12.333 30.083ZM11.9434 29.8105L12.0887 29.6071C11.7579 29.3709 11.2861 29.0228 10.7201 28.577L10.5654 28.7734L10.4108 28.9698C10.9833 29.4208 11.4614 29.7735 11.798 30.014L11.9434 29.8105ZM10.5654 28.7734L10.7201 28.577C9.58871 27.686 8.07924 26.4005 6.56921 24.8241L6.38867 24.9971L6.20813 25.17C7.73845 26.7676 9.26647 28.0686 10.4107 28.9698L10.5654 28.7734ZM6.38867 24.9971L6.56921 24.8241C3.55958 21.6821 0.500052 17.335 0.5 12.6182L0.25 12.6182L0 12.6182C5.43296e-05 17.538 3.17905 22.0077 6.20813 25.17L6.38867 24.9971ZM0.25 12.6182L0.5 12.6182C0.500026 9.4035 1.79147 6.3212 4.08889 4.04884L3.91309 3.87109L3.73728 3.69335C1.34553 6.05901 2.71648e-05 9.26907 0 12.6182L0.25 12.6182ZM3.91309 3.87109L4.08888 4.04884C6.38643 1.77652 9.50201 0.5 12.75 0.5V0.25V0C9.37112 0 6.12898 1.32791 3.73729 3.69334L3.91309 3.87109ZM12.75 7.34277V7.09277C10.4055 7.09277 8.50027 8.9735 8.5 11.2988L8.75 11.2988L9 11.2989C9.00023 9.2548 10.6765 7.59277 12.75 7.59277V7.34277ZM8.75 11.2988H8.5C8.5 13.6243 10.4053 15.5059 12.75 15.5059V15.2559V15.0059C10.6764 15.0059 9 13.3431 9 11.2988H8.75ZM12.75 15.2559V15.5059C15.0947 15.5059 17 13.6243 17 11.2988H16.75H16.5C16.5 13.3431 14.8236 15.0059 12.75 15.0059V15.2559ZM16.75 11.2988L17 11.2988C16.9997 8.9735 15.0945 7.09277 12.75 7.09277V7.34277V7.59277C14.8235 7.59277 16.4998 9.2548 16.5 11.2989L16.75 11.2988Z" fill="black"/></svg>`

const SELECTED_PIN_ICON = {
  url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SELECTED_PIN_SVG)}`,
  width: 26,
  height: 31,
  anchorX: 13,
  anchorY: 31,
}

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
  /** 鄉鎮/縣市 metadata（tw-towns-meta.json）；唯讀傳入，由 useGeoMeta 載入 */
  meta: Ref<any>
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
    const topo = await fetch('/tw-towns-optimized.json').then(r => r.json())
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
