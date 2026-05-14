<template>
  <div class="map-wrapper">
    <canvas ref="canvasRef" class="map-canvas" />
    <div v-if="hovered" class="tooltip" :style="{ left: hovered.x + 'px', top: hovered.y + 'px' }">
      <div class="county">{{ hovered.county }}</div>
      <div class="district">{{ hovered.district }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, shallowRef } from 'vue';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const hovered = ref<{ x: number; y: number; county: string; district: string } | null>(null);
const deckInstance = shallowRef<any>(null);

onMounted(async () => {
  const [{ Deck, MapView }, { GeoJsonLayer }, { feature }] = await Promise.all([
    import('@deck.gl/core'),
    import('@deck.gl/layers'),
    import('topojson-client'),
  ]);

  const [topoRes, metaRes] = await Promise.all([
    fetch('/tw-towns-optimized.json'),
    fetch('/tw-towns-meta.json'),
  ]);
  const [topo, meta] = await Promise.all([topoRes.json(), metaRes.json()]);

  const towns = (feature as any)(topo, topo.objects.towns);
  const counties = (feature as any)(topo, topo.objects.counties);

  deckInstance.value = new Deck({
    canvas: canvasRef.value!,
    views: new MapView({ repeat: false }),
    initialViewState: {
      longitude: 120.9,
      latitude: 23.6,
      zoom: 7,
      minZoom: 5,
      maxZoom: 14,
    },
    controller: true,
    layers: [
      new GeoJsonLayer({
        id: 'towns',
        data: towns,
        filled: true,
        stroked: true,
        getFillColor: [245, 245, 240],
        getLineColor: [180, 180, 180],
        lineWidthMinPixels: 0.5,
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 200, 100, 180],
        onHover: ({ object, x, y }: any) => {
          if (object) {
            const townCode = object.properties?.TOWNCODE;
            const townInfo = meta.towns[townCode];
            const countyInfo = meta.counties[townInfo?.COUNTYCODE];
            hovered.value = {
              x, y,
              county: countyInfo?.COUNTYNAME ?? '',
              district: townInfo?.TOWNNAME ?? '',
            };
          } else {
            hovered.value = null;
          }
        },
      }),
      new GeoJsonLayer({
        id: 'counties',
        data: counties,
        filled: false,
        stroked: true,
        getLineColor: [80, 80, 80],
        lineWidthMinPixels: 1.2,
        pickable: false,
      }),
    ],
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
</style>
