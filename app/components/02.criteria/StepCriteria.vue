<script setup lang="ts">
import { ref } from 'vue';
import str from '../../locales/criteria.json';
import type { FilterMeta } from '../../types/filter';
import { useAssets } from '../../composables/useAssets';
import useTrackingEvent from '../../composables/useTrackingEvent';
import {
  useStepCriteria,
  MAX_SELECT,
  type StepCriteriaProps,
} from './StepCriteria.logic';

const props = defineProps<StepCriteriaProps>();
const emit = defineEmits<{
  'update:selectedFilters': [value: string[]];
  next: [];
}>();

// 圖示靜態檔（presentational；沿用 Figma 規格頁的 ic_ 命名，放 public/img/icon/）。
const { img } = useAssets();
const iconUrl = (name: string) => img(`icon/${name}.svg`);
const pinSrc = iconUrl('map_pin');

// 每個居住條件的圖示（presentational，criteria 專用），id 對應 index.json 的篩選 id。
// 顯示文字改由 filter data 的 label 提供（criteria 卡片與 result chip 共用同一來源）。
const cards = str.cards as Record<string, { icon: string }>;
function cardLabel(f: FilterMeta): string {
  return f.label ?? f.name;
}

// PM 指定的語意斷行：label → 在第 N 字後斷行；未列出者不斷（單行）。
//
// ⚠️ 同一個 label 在 MOB 與 PAD/PC 的斷點**不同**，因為兩者字級與可用寬度都不同。實測：
//   MOB   ：15px 字、label 可用寬 ＝ (viewport − 77.3) / 2 − 21.3
//           → 414 得 147px、390 得 135px、375 得 127.5px、320 得 100px（icon 隱藏、無 ✕）
//   PAD/PC：18px 字、卡片多出 40px icon ＋ 5px gap（PAD 2 欄／PC 3 欄）→ 可用寬僅約 119.7px
//   15px CJK 每字 15px、18px CJK 每字 18px：
//           11 字 label ＝ MOB 165px／PAD 198px，兩邊都放不下，必須斷
//           斷第 5 字 → MOB 75+90、PAD 90+108，兩邊都容得下
//           斷第 7 字 → MOB 105+60 容得下（＝Figma 414px-MOB-stage2 的畫法）
//                       但 PAD 第一段 126px > 119.7px 會溢出 → 故 PAD/PC 必須維持第 5 字
// 結論：`pad` 是兩段 span 的實際切點（PAD/PC 用 display:block 強制斷行），
//       `mob` 是 MOB 的斷點，靠第二段內的零寬空格（U+200B）表達，見 labelLines。
const LABEL_BREAK: Record<string, { pad: number; mob: number }> = {
  癌症發生率更低: { pad: 5, mob: 5 },
  交通事故死傷率更低: { pad: 4, mob: 7 },
  公托覆蓋率更高: { pad: 5, mob: 5 },
  圖書館資源更多: { pad: 5, mob: 5 },
  青壯年人口比率更高: { pad: 5, mob: 7 },
  餐飲及住宿店家密度更高: { pad: 5, mob: 7 },
  大規模崩塌災害風險更低: { pad: 5, mob: 7 },
  居住地綠地空間更大: { pad: 5, mob: 7 },
};
// 依斷點切成 1～2 段供逐行 span 渲染；完整字串仍由 cardLabel 提供給 GA / a11y。
//
// 第二段內插入一個零寬空格 U+200B，位置＝MOB 的斷點：
//   MOB   ：兩段是 inline、文字順接成一串，而 __card-label 套了 `word-break: keep-all`
//           禁止 CJK 在任意兩字之間斷行 → 這個零寬空格是**唯一**的斷行機會。
//           於是「放得下就單行、放不下才斷，且一定斷在語意邊界」由瀏覽器自己決定，
//           不必逐斷點寫死該不該斷（9 字 label 在 414 維持單行、375 才斷，即由此自動達成）。
//   PAD/PC：兩段各自 display:block，零寬空格落在第二行行首、寬度為 0，不影響外觀。
function labelLines(label: string): string[] {
  const cfg = LABEL_BREAK[label];
  if (!cfg) return [label];
  const { pad, mob } = cfg;
  // 用 \u200B escape 而非字面字元：零寬空格在編輯器裡看不見，寫成字面值等於埋一個隱形陷阱。
  const ZWSP = '\u200B';
  return [
    label.slice(0, pad),
    `${label.slice(pad, mob)}${ZWSP}${label.slice(mob)}`,
  ];
}

function criteriaIcon(id: string): string {
  const slug = cards[id]?.icon;
  return slug ? iconUrl(slug) : '';
}

// GA：stage2 事件（term = 條件文字／按鈕文字／區塊名）
const { gaClickOption, gaClickBtn, gaClickOpen } = useTrackingEvent();

// 行動版（<768）：資訊面板改為底部可展開 sheet，location 列當 toggle。
// 桌機/pad 為常駐左欄，此 state 無 CSS 作用（媒體查詢內才參照 --open）。
const infoOpen = ref(false);
function toggleInfo() {
  if (!infoOpen.value) gaClickOpen('現居地區資訊'); // click_open 只在展開時送
  infoOpen.value = !infoOpen.value;
}

// view 邏輯抽至 co-located 的 StepCriteria.logic.ts（單一元件專用）。
const { countyName, townName, atMax, canProceed, toggleFilter, statText } =
  useStepCriteria(props, emit);
</script>

<template>
  <div class="lc-sc">
    <div class="lc-sc__inner">
      <!-- ── 左：現居地區資訊面板（行動版＝底部可展開 sheet）──── -->
      <aside class="lc-sc__info" :class="{ 'lc-sc__info--open': infoOpen }">
        <!-- 小地圖：只渲染被選取鄉鎮的輪廓，geometry 由 app.vue 以正規化 SVG path 傳入 -->
        <div class="lc-sc__map" aria-hidden="true">
          <svg
            v-if="selectedTownThumb"
            class="lc-sc__map-svg"
            :viewBox="`0 0 ${selectedTownThumb.width} ${selectedTownThumb.height}`"
            preserveAspectRatio="xMidYMid meet"
          >
            <path :d="selectedTownThumb.path" class="lc-sc__map-shape" />
          </svg>
        </div>

        <!-- location 列：桌機/pad 為靜態資訊；行動版兼作 sheet 收合/展開的 toggle -->
        <div
          class="lc-sc__location"
          :aria-expanded="infoOpen"
          @click="toggleInfo"
        >
          <img class="lc-sc__location-pin" :src="pinSrc" alt="" aria-hidden="true" />
          <span class="lc-sc__location-label">{{ str.currentArea }}</span>
          <span class="lc-sc__location-area">{{ countyName }}{{ townName }}</span>
          <!-- 展開箭頭（僅行動版顯示；展開時旋轉 180°） -->
          <svg
            class="lc-sc__location-chevron"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M6 15l6-6 6 6" />
          </svg>
        </div>

        <div class="lc-sc__divider" aria-hidden="true"></div>

        <div class="lc-sc__stats">
          <div v-for="f in filterIndex" :key="f.id" class="lc-sc__stat">
            <span class="lc-sc__stat-label">{{ f.name }}</span>
            <span class="lc-sc__stat-val">{{ statText(f) }}</span>
          </div>
        </div>
      </aside>

      <!-- ── 右：條件選擇 ──────────────────────────────── -->
      <section class="lc-sc__main">
        <header class="lc-sc__head">
          <!-- 標題：桌機/pad 用完整版；手機（<sm）改用精簡版，兩者以 CSS 切換 -->
          <h2 class="lc-sc__title">
            <span class="lc-sc__title-pc">{{ str.title }}</span>
            <span class="lc-sc__title-mob">{{ str.titleMob }}</span>
          </h2>
          <p class="lc-sc__hint">
            <!-- 手機（<pad）：接續標題的精簡說明；平板以上：完整說明。兩者以 CSS 切換 -->
            <span class="lc-sc__hint-mob">{{ str.hintMob }}</span>
            <span class="lc-sc__hint-pc">{{ str.hint }}</span>
            <!-- 已選計數膠囊：全尺寸通用，接在說明文字後 -->
            <span class="lc-sc__hint-count">{{ selectedFilters.length }}/{{ MAX_SELECT }}</span>
          </p>
        </header>

        <div class="lc-sc__cards">
          <button
            v-for="f in filterIndex"
            :key="f.id"
            type="button"
            class="lc-sc__card"
            :class="{
              'lc-sc__card--selected': selectedFilters.includes(f.id),
              'lc-sc__card--disabled': !selectedFilters.includes(f.id) && atMax,
            }"
            :aria-pressed="selectedFilters.includes(f.id)"
            @click="gaClickOption(cardLabel(f)); toggleFilter(f.id)"
          >
            <img
              class="lc-sc__card-icon"
              :src="criteriaIcon(f.id)"
              alt=""
              aria-hidden="true"
            />
            <span class="lc-sc__card-label">
              <span
                v-for="(line, i) in labelLines(cardLabel(f))"
                :key="i"
                class="lc-sc__card-line"
                >{{ line }}</span
              >
            </span>
          </button>
        </div>

        <div class="lc-sc__submit">
          <UiNextButton
            :label="str.viewResults"
            :disabled="!canProceed"
            @click="gaClickBtn(str.viewResults); $emit('next')"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./StepCriteria.scss"></style>
