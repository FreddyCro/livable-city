<script setup lang="ts">
// 3.5 explore-zoom：地圖縮放（＋／−）+ ⓘ；ⓘ 開 info-dialog（3.8，內容為 InfoContent）。
// 縮放為純 UI 觸發，透過 zoom-in / zoom-out 事件通知 parent 操作地圖。
import str from '../../locales/explore.json';
import InfoContent from './InfoContent.vue';
import { useAssets } from '../../composables/useAssets';

defineEmits<{
  'zoom-in': [];
  'zoom-out': [];
}>();

const { img } = useAssets();
const iconUrl = (name: string) => img(`icon/${name}.svg`);
</script>

<template>
  <!-- 按鈕圖示為完整圓鈕 SVG：button_zoom_in/out/information -->
  <div class="lc-sr__zoom">
    <button
      class="lc-sr__zoom-btn"
      :aria-label="str.zoomIn"
      @click="$emit('zoom-in')"
    >
      <img :src="iconUrl('button_zoom_in')" alt="" />
    </button>
    <button
      class="lc-sr__zoom-btn"
      :aria-label="str.zoomOut"
      @click="$emit('zoom-out')"
    >
      <img :src="iconUrl('button_zoom_out')" alt="" />
    </button>

    <DialogRoot>
      <DialogTrigger class="lc-sr__zoom-btn lc-sr__zoom-btn--info" :aria-label="str.info">
        <img :src="iconUrl('button_information')" alt="" />
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay class="lc-sr__dialog-overlay" />
        <DialogContent class="lc-sr__dialog">
          <InfoContent />
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
