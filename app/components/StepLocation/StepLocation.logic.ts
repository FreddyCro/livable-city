import { computed, ref } from 'vue';
import type { GeoMeta } from '../../types/geo';
import { byRank } from '../../utils/sort';

export interface StepLocationProps {
  meta: GeoMeta | null;
  countyCode: string;
  townCode: string;
}

export interface StepLocationEmit {
  (e: 'update:countyCode', value: string): void;
  (e: 'update:townCode', value: string): void;
}

/**
 * StepLocation 的 view 邏輯（單一元件專用，與元件 co-locate）。
 * 兩階段顯示切換（首屏主視覺／表單）的互動、與依 order.json rank 排序的縣市/鄉鎮選單。
 * 勿解構 props（會失去 reactivity）。
 */
export function useStepLocation(props: StepLocationProps, emit: StepLocationEmit) {
  // 兩階段：false = 首屏主視覺（step 1-1），true = 內文＋表單（step 1-2）。可逆。
  const revealed = ref(false);
  const reveal = () => {
    revealed.value = true;
  };
  const collapse = () => {
    revealed.value = false;
  };

  // 滾輪：向下展開、向上收回。lock 避免單一手勢的連續事件造成抖動。
  let wheelLock = false;
  function onWheel(e: WheelEvent) {
    if (wheelLock || Math.abs(e.deltaY) < 8) return;
    // 在下拉選單內滾動時不切換階段，避免操作 select 時誤觸回主視覺
    if ((e.target as HTMLElement | null)?.closest?.('.lc-sd')) return;
    wheelLock = true;
    setTimeout(() => (wheelLock = false), 500);
    e.deltaY > 0 ? reveal() : collapse();
  }

  // 觸控：上滑展開、下滑收回（行動裝置等同滾動）
  let touchStartY = 0;
  function onTouchStart(e: TouchEvent) {
    touchStartY = e.touches[0]?.clientY ?? 0;
  }
  function onTouchMove(e: TouchEvent) {
    const dy = touchStartY - (e.touches[0]?.clientY ?? 0);
    if (Math.abs(dy) < 30) return;
    dy > 0 ? reveal() : collapse();
  }

  // 依 order.json 帶入的 rank 排序（唯一依據）；無 rank 的代碼排到最後且維持穩定順序。
  const countyOptions = computed(() => {
    if (!props.meta) return [];
    const rank = props.meta.countyRank;
    return Object.entries(props.meta.counties)
      .map(([code, info]) => ({ value: code, label: info.COUNTYNAME }))
      .sort(byRank(rank, (o) => o.value));
  });

  const townOptions = computed(() => {
    if (!props.meta || !props.countyCode) return [];
    const rank = props.meta.townRank;
    return Object.entries(props.meta.towns)
      .filter(([, info]) => info.COUNTYCODE === props.countyCode)
      .map(([code, info]) => ({ value: code, label: info.TOWNNAME }))
      .sort(byRank(rank, (o) => o.value));
  });

  function onCountySelect(val: string) {
    emit('update:countyCode', val);
    emit('update:townCode', '');
  }

  // 主視覺影片：前奏（0–4s）只在首播放一次；播到結尾後不回 0、而是回到 4s，
  // 之後固定 loop「4s → 結尾」段落（故 <video> 不加原生 loop，改由 ended 接管）。
  const VISUAL_LOOP_START = 4;
  const visualVideo = ref<HTMLVideoElement | null>(null);
  function onVisualEnded() {
    const el = visualVideo.value;
    if (!el) return;
    el.currentTime = VISUAL_LOOP_START;
    void el.play();
  }

  return {
    revealed,
    reveal,
    collapse,
    onWheel,
    onTouchStart,
    onTouchMove,
    countyOptions,
    townOptions,
    onCountySelect,
    visualVideo,
    onVisualEnded,
  };
}
