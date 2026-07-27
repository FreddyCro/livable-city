import {
  ref,
  shallowRef,
  watch,
  onMounted,
  onBeforeUnmount,
  type Ref,
} from 'vue';
import type { ResultTown } from './useResultTowns';
import type { GeoMeta } from '../types/geo';
import { dataSource } from '../utils/dataSource';
import { SELECTED_PIN_ICON } from '../utils/mapMarkers';
import { MAP_CAMERA } from '../utils/mapCamera';

export interface HoverInfo {
  x: number;
  y: number;
  county: string;
  district: string;
}

export interface TownThumb {
  path: string;
  width: number;
  height: number;
}

interface UseTaiwanMapOptions {
  canvasRef: Ref<HTMLCanvasElement | null>;
  /** 鄉鎮/縣市 metadata（tw-towns-meta.json）；唯讀傳入，由 useGeoMeta 載入（載入前為 null） */
  meta: Ref<GeoMeta | null>;
  currentStep: Ref<1 | 2 | 3>;
  selectedTownCode: Ref<string>;
  selectedResultCode: Ref<string | null>;
  resultTowns: Ref<ResultTown[]>;
  /** 點選「有黃色 pin（即結果清單內）」的鄉鎮時回呼，交由父層更新選取的結果地區 */
  onSelectResult?: (code: string) => void;
}

/**
 * 地圖引擎層：封裝 deck.gl 的初始化、圖層建構、flyTo 動畫與 hover/縮圖狀態。
 *
 * 圖層會自動跟著 selection / step / 結果變化重繪；對外只暴露命令式的
 * 鏡頭操作（zoomBy / flyToCounty / flyToTaiwan / focusTown）與展示用狀態
 * （hovered / selectedTownThumb）。app.vue 不需要知道 setProps 的存在。
 */
export function useTaiwanMap(opts: UseTaiwanMapOptions) {
  const {
    canvasRef,
    meta,
    currentStep,
    selectedTownCode,
    selectedResultCode,
    resultTowns,
    onSelectResult,
  } = opts;

  const hovered = ref<HoverInfo | null>(null);
  // 滑鼠是否正懸停在「有黃色 pin（結果清單內）」的鄉鎮上 → 決定游標是否為 pointer
  const hoveringResult = ref(false);
  // 該鄉鎮是否在結果清單內（有黃色 pin）
  const isResultTown = (code: string | undefined) =>
    !!code && resultTowns.value.some((t) => t.code === code);
  // Step-2 small-map thumbnail: normalized SVG path of the selected town only
  const selectedTownThumb = ref<TownThumb | null>(null);

  const deckInstance = shallowRef<any>(null);
  let GeoJsonLayerCtor: any = null;
  let ScatterplotLayerCtor: any = null;
  let IconLayerCtor: any = null;
  let FlyToInterpolatorCtor: any = null;
  let polylabelFn: typeof import('polylabel').default | null = null;
  let geoTowns: any = null;
  let geoCounties: any = null;
  // 每個鄉鎮的 pin 落點（黃點 + 大 pin 共用）。用 pole of inaccessibility 而非
  // bbox/重心，確保凹形（彎月形沿海區）也一定落在區界內，不會跑到隔壁區。
  const townPinPoints: Map<string, [number, number]> = new Map();
  // 視角水平微調：右側留白把焦點像素往左推（內容約往左移 right/2 px），修正聚焦/初始畫面偏右的感覺。
  // 僅桌機 / 平板套用；手機（無 sidebar、地圖全幅）歸零以免變成偏左。數值見 MAP_CAMERA.nudge。
  let mapIsNarrow = false; // < pad（手機）→ 不做水平微調
  // 手機：改用底部 padding 把聚焦點往上推（避免被資訊圖卡擋住）；桌機/平板：右側 padding 往左推。
  const viewPadding = () => ({
    left: 0,
    top: 0,
    right: mapIsNarrow ? 0 : MAP_CAMERA.nudge.x,
    bottom: mapIsNarrow ? MAP_CAMERA.nudge.mobileBottom : 0,
  });
  let deckViewState: any = {
    longitude: MAP_CAMERA.view.longitude,
    latitude: MAP_CAMERA.view.latitude,
    zoom: MAP_CAMERA.view.zoom,
    minZoom: MAP_CAMERA.view.minZoom,
    maxZoom: MAP_CAMERA.view.maxZoom,
    padding: viewPadding(),
  };
  let mapMql: MediaQueryList | null = null;
  // 斷點切換時更新水平微調並重新套用（deck 會在新 canvas 尺寸下重新置中）
  const onMapMqlChange = () => {
    mapIsNarrow = mapMql?.matches ?? false;
    deckViewState = { ...deckViewState, padding: viewPadding() };
    deckInstance.value?.setProps({ viewState: deckViewState });
  };

  function getFeatureBbox(feature: any): [number, number, number, number] {
    let minLng = Infinity,
      minLat = Infinity,
      maxLng = -Infinity,
      maxLat = -Infinity;
    const visit = (ring: [number, number][]) => {
      for (const [lng, lat] of ring) {
        if (lng < minLng) minLng = lng;
        if (lat < minLat) minLat = lat;
        if (lng > maxLng) maxLng = lng;
        if (lat > maxLat) maxLat = lat;
      }
    };
    const { type, coordinates } = feature.geometry;
    if (type === 'Polygon') coordinates.forEach(visit);
    else if (type === 'MultiPolygon')
      coordinates.forEach((poly: [number, number][][]) => poly.forEach(visit));
    return [minLng, minLat, maxLng, maxLat];
  }

  // 外環面積（shoelace 絕對值），用來在 MultiPolygon 裡挑「最大的一塊」放 pin。
  function ringArea(ring: [number, number][]): number {
    let sum = 0;
    let prev = ring[ring.length - 1];
    for (const cur of ring) {
      if (prev) sum += (prev[0] + cur[0]) * (cur[1] - prev[1]);
      prev = cur;
    }
    return Math.abs(sum) / 2;
  }

  // 求一個鄉鎮的 pin 落點：pole of inaccessibility（多邊形內離邊界最遠的點）。
  // 對凹形／彎月形也保證落在區界內，且視覺上落在最大內接圓心，最自然。
  // MultiPolygon（離島等）取面積最大的那塊來算。polylabelFn 尚未載入時回傳 null。
  function labelPoint(feature: any): [number, number] | null {
    if (!feature || !polylabelFn) return null;
    const { type, coordinates } = feature.geometry;
    let polygon: [number, number][][] | null = null;
    if (type === 'Polygon') {
      polygon = coordinates;
    } else if (type === 'MultiPolygon') {
      let best = -Infinity;
      for (const poly of coordinates as [number, number][][][]) {
        const outer = poly[0];
        if (!outer) continue;
        const a = ringArea(outer);
        if (a > best) {
          best = a;
          polygon = poly;
        }
      }
    }
    if (!polygon || !polygon[0]?.length) return null;

    // precision 以區塊大小縮放（約數十公尺），兼顧精度與 mount 時的運算量。
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const [x, y] of polygon[0]) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
    const precision = Math.max(Math.max(maxX - minX, maxY - minY) / 1000, 1e-5);
    const p = polylabelFn(polygon, precision);
    return [p[0], p[1]];
  }

  // Build a normalized SVG path for a single town, used as the step-2 thumbnail.
  // Coordinates are projected (lng scaled by cos(lat) to avoid horizontal squish)
  // and emitted in a local viewBox so the SVG can stretch-fit the small-map block.
  function buildTownThumb(code: string): TownThumb | null {
    if (!geoTowns || !code) return null;
    const f = geoTowns.features.find(
      (ft: any) => ft.properties?.TOWNCODE === code,
    );
    if (!f) return null;
    const rings: [number, number][][] = [];
    const { type, coordinates } = f.geometry;
    if (type === 'Polygon') rings.push(...coordinates);
    else if (type === 'MultiPolygon')
      coordinates.forEach((poly: [number, number][][]) => rings.push(...poly));

    let minLng = Infinity,
      minLat = Infinity,
      maxLng = -Infinity,
      maxLat = -Infinity;
    for (const ring of rings) {
      for (const [lng, lat] of ring) {
        if (lng < minLng) minLng = lng;
        if (lat < minLat) minLat = lat;
        if (lng > maxLng) maxLng = lng;
        if (lat > maxLat) maxLat = lat;
      }
    }
    if (!isFinite(minLng)) return null;

    const midLat = (minLat + maxLat) / 2;
    const kx = Math.cos((midLat * Math.PI) / 180); // lng compression at this latitude
    const width = (maxLng - minLng) * kx;
    const height = maxLat - minLat;
    const toX = (lng: number) => ((lng - minLng) * kx).toFixed(5);
    const toY = (lat: number) => (maxLat - lat).toFixed(5); // flip Y for SVG

    const path = rings
      .map(
        (ring) =>
          ring
            .map(
              ([lng, lat], i) =>
                `${i === 0 ? 'M' : 'L'}${toX(lng)} ${toY(lat)}`,
            )
            .join(' ') + ' Z',
      )
      .join(' ');

    return { path, width, height };
  }

  function flyToCounty(countyCode: string) {
    if (
      !geoTowns ||
      !deckInstance.value ||
      !FlyToInterpolatorCtor ||
      !meta.value
    )
      return;
    const townCodes = new Set(
      Object.entries(meta.value.towns)
        .filter(([, info]) => info.COUNTYCODE === countyCode)
        .map(([code]) => code),
    );
    let minLng = Infinity,
      minLat = Infinity,
      maxLng = -Infinity,
      maxLat = -Infinity;
    for (const f of geoTowns.features) {
      if (!townCodes.has(f.properties?.TOWNCODE)) continue;
      const [a, b, c, d] = getFeatureBbox(f);
      if (a < minLng) minLng = a;
      if (b < minLat) minLat = b;
      if (c > maxLng) maxLng = c;
      if (d > maxLat) maxLat = d;
    }
    if (!isFinite(minLng)) return;
    const longitude = (minLng + maxLng) / 2;
    const latitude = (minLat + maxLat) / 2;
    const extent = Math.max(maxLng - minLng, maxLat - minLat);
    const zoom = Math.min(
      MAP_CAMERA.county.zoomMax,
      Math.max(
        MAP_CAMERA.county.zoomMin,
        Math.floor(Math.log2(MAP_CAMERA.county.extentBase / extent)),
      ),
    );
    deckViewState = {
      ...deckViewState,
      longitude,
      latitude,
      zoom,
      transitionDuration: MAP_CAMERA.fly.duration,
      transitionInterpolator: new FlyToInterpolatorCtor({
        speed: MAP_CAMERA.fly.speed,
      }),
    };
    deckInstance.value.setProps({ viewState: deckViewState });
  }

  function flyToTaiwan() {
    if (!deckInstance.value || !FlyToInterpolatorCtor) return;
    deckViewState = {
      ...deckViewState,
      longitude: MAP_CAMERA.view.longitude,
      latitude: MAP_CAMERA.view.latitude,
      zoom: MAP_CAMERA.view.zoom,
      transitionDuration: MAP_CAMERA.fly.duration,
      transitionInterpolator: new FlyToInterpolatorCtor({
        speed: MAP_CAMERA.fly.speed,
      }),
    };
    deckInstance.value.setProps({ viewState: deckViewState });
  }

  // Fly the camera to a single town (used when the user picks a result card).
  // Defaulting the result selection sets the code without calling this, so the
  // step-3 Taiwan overview stays put.
  function focusTown(code: string | null) {
    if (!code || !geoTowns || !deckInstance.value || !FlyToInterpolatorCtor)
      return;
    const feature = geoTowns.features.find(
      (f: any) => f.properties?.TOWNCODE === code,
    );
    if (!feature) return;
    const [minLng, minLat, maxLng, maxLat] = getFeatureBbox(feature);
    const longitude = (minLng + maxLng) / 2;
    const latitude = (minLat + maxLat) / 2;
    const extent = Math.max(maxLng - minLng, maxLat - minLat);
    const zoom = Math.min(
      MAP_CAMERA.town.zoomMax,
      Math.max(
        MAP_CAMERA.town.zoomMin,
        Math.floor(Math.log2(MAP_CAMERA.town.extentBase / extent)),
      ),
    );
    deckViewState = {
      ...deckViewState,
      longitude,
      latitude,
      zoom,
      transitionDuration: MAP_CAMERA.fly.duration,
      transitionInterpolator: new FlyToInterpolatorCtor({
        speed: MAP_CAMERA.fly.speed,
      }),
    };
    deckInstance.value.setProps({ viewState: deckViewState });
  }

  // Step-3 zoom buttons (explore-zoom 3.5) → adjust deck zoom within bounds
  // 每次縮放幅度為傳入 delta × MAP_CAMERA.zoomButton.factor（放慢按鈕縮放速度）
  function zoomBy(delta: number) {
    if (!deckInstance.value) return;
    const z = Math.min(
      MAP_CAMERA.zoomButton.zoomMax,
      Math.max(
        MAP_CAMERA.zoomButton.zoomMin,
        (deckViewState.zoom ?? MAP_CAMERA.view.zoom) +
          delta * MAP_CAMERA.zoomButton.factor,
      ),
    );
    deckViewState = { ...deckViewState, zoom: z };
    deckInstance.value.setProps({ viewState: deckViewState });
  }

  function buildLayers() {
    if (!GeoJsonLayerCtor || !geoTowns || !geoCounties) return [];
    const layers: any[] = [
      new GeoJsonLayerCtor({
        id: 'towns',
        data: geoTowns,
        filled: true,
        stroked: true,
        getFillColor: (d: any) => {
          const code = d.properties?.TOWNCODE;

          // 自己選取的現居地：B01 #e6f5fa
          if (code === selectedTownCode.value) return [230, 245, 250];

          // #227D92
          if (code === selectedResultCode.value) return [34, 125, 146];

          return [245, 245, 240];
        },
        getLineColor: [180, 180, 180],
        lineWidthMinPixels: 0.5,
        pickable: true,
        // 不對 hover 的鄉鎮做填色高亮（仍保留 pickable / onHover 供 tooltip 使用）
        autoHighlight: false,
        updateTriggers: {
          getFillColor: [selectedTownCode.value, selectedResultCode.value],
        },
        onHover: ({ object, x, y }: any) => {
          if (object) {
            const code = object.properties?.TOWNCODE;
            const townInfo = meta.value?.towns[code];
            const countyInfo = townInfo
              ? meta.value?.counties[townInfo.COUNTYCODE]
              : undefined;
            hovered.value = {
              x,
              y,
              county: countyInfo?.COUNTYNAME ?? '',
              district: townInfo?.TOWNNAME ?? '',
            };
            hoveringResult.value = isResultTown(code);
          } else {
            hovered.value = null;
            hoveringResult.value = false;
          }
        },
        // 只有「有黃色 pin」的鄉鎮可被選取；點擊後交由父層更新結果並飛入
        onClick: ({ object }: any) => {
          const code = object?.properties?.TOWNCODE;
          if (isResultTown(code)) onSelectResult?.(code);
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

    // Result + selected markers (step 3 only)
    if (currentStep.value === 3 && ScatterplotLayerCtor) {
      const resultPoints = resultTowns.value
        .map((t) => ({ code: t.code, position: townPinPoints.get(t.code) }))
        .filter((d) => d.position) as Array<{
        code: string;
        position: [number, number];
      }>;

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
      );

      const selectedPosition = townPinPoints.get(selectedTownCode.value);
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
        );
      }
    }

    return layers;
  }

  function refreshLayers() {
    deckInstance.value?.setProps({ layers: buildLayers() });
  }

  // Layers follow selection / step / results
  watch(
    [selectedTownCode, selectedResultCode, currentStep, resultTowns],
    () => {
      refreshLayers();
    },
  );

  // Step-2 thumbnail follows the selected town
  watch(selectedTownCode, () => {
    selectedTownThumb.value = buildTownThumb(selectedTownCode.value);
  });

  onMounted(async () => {
    const [
      { Deck, MapView, FlyToInterpolator },
      { GeoJsonLayer, ScatterplotLayer, IconLayer },
      { feature },
      { default: polylabel },
    ] = await Promise.all([
      import('@deck.gl/core'),
      import('@deck.gl/layers'),
      import('topojson-client'),
      import('polylabel'),
    ]);
    GeoJsonLayerCtor = GeoJsonLayer;
    ScatterplotLayerCtor = ScatterplotLayer;
    IconLayerCtor = IconLayer;
    FlyToInterpolatorCtor = FlyToInterpolator;
    polylabelFn = polylabel;

    // meta 由 useGeoMeta 載入；這裡只取地圖底圖 topology
    const topo = await dataSource.geoTopology();
    geoTowns = (feature as any)(topo, topo.objects.towns);
    geoCounties = (feature as any)(topo, topo.objects.counties);

    // Precompute per-town pin points (pole of inaccessibility, guaranteed inside
    // the polygon). Falls back to bbox centre only if polylabel yields nothing.
    for (const f of geoTowns.features) {
      const code = f.properties?.TOWNCODE;
      if (!code) continue;
      const pin = labelPoint(f);
      if (pin) {
        townPinPoints.set(code, pin);
        continue;
      }
      const [minLng, minLat, maxLng, maxLat] = getFeatureBbox(f);
      townPinPoints.set(code, [(minLng + maxLng) / 2, (minLat + maxLat) / 2]);
    }

    // Init step-2 thumbnail in case a town was already chosen before geo loaded
    selectedTownThumb.value = buildTownThumb(selectedTownCode.value);

    // 水平微調的斷點偵測：手機（<pad）歸零、其餘套用。建 Deck 前先定好初始 padding，
    // 斷點切換時更新並重新套用 viewState（deck 會在新 canvas 尺寸下重新置中）。
    mapMql = window.matchMedia(
      `(max-width: ${MAP_CAMERA.nudge.narrowMaxWidth}px)`,
    );
    mapIsNarrow = mapMql.matches;
    deckViewState = { ...deckViewState, padding: viewPadding() };
    mapMql.addEventListener('change', onMapMqlChange);

    deckInstance.value = new Deck({
      canvas: canvasRef.value!,
      views: new MapView({ repeat: false }),
      viewState: deckViewState,
      onViewStateChange: ({ viewState }: any) => {
        // Strip any lingering flyTo transition props, otherwise each user
        // pan/zoom step gets re-animated and the map feels stuck / snaps back.
        const next = { ...viewState };
        delete next.transitionDuration;
        delete next.transitionInterpolator;
        delete next.transitionEasing;
        delete next.transitionInterruption;
        next.padding = viewPadding(); // 拖曳/縮放後仍保留水平微調，否則互動一次就跑掉
        deckViewState = next;
        deckInstance.value?.setProps({ viewState: next });
      },
      controller: true,
      // 預設 deck 對任何 pickable 物件都顯示 pointer；改為僅「有黃色 pin」的鄉鎮顯示 pointer，其餘維持可拖曳的 grab
      getCursor: ({ isDragging }: any) =>
        isDragging ? 'grabbing' : hoveringResult.value ? 'pointer' : 'grab',
      layers: buildLayers(),
    });
  });

  onBeforeUnmount(() => {
    mapMql?.removeEventListener('change', onMapMqlChange);
    deckInstance.value?.finalize();
  });

  return {
    hovered,
    selectedTownThumb,
    zoomBy,
    flyToCounty,
    flyToTaiwan,
    focusTown,
  };
}
