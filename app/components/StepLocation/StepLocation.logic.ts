import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { GeoMeta } from '../../types/geo';
import { useAssets } from '../../composables/useAssets';
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

  // ── 主視覺背景影片 ───────────────────────────────────
  const { img } = useAssets();
  type Bp = 'pc' | 'pad' | 'mob';
  // poster 三斷點圖
  const visualPoster: Record<Bp, string> = {
    pc: img('step1-visual-pc.png'),
    pad: img('step1-visual-pad.png'),
    mob: img('step1-visual-mob.png'),
  };
  // 影片三斷點 × webm/mp4
  const visualVideoSrc: Record<Bp, { webm: string; mp4: string }> = {
    pc: { webm: img('livable_city_map_bg_pc.webm'), mp4: img('livable_city_map_bg_pc.mp4') },
    pad: { webm: img('livable_city_map_bg_pad.webm'), mp4: img('livable_city_map_bg_pad.mp4') },
    mob: { webm: img('livable_city_map_bg_mob.webm'), mp4: img('livable_city_map_bg_mob.mp4') },
  };

  // 依視窗寬度的斷點。<video> 的 <source media> 只在初次載入評估、resize 不會重挑來源，
  // 故改由 JS 以 matchMedia 追蹤斷點，「跨斷點」時才換片並重載（同斷點 resize 不動，免閃爍）。
  const bp = ref<Bp>('mob');
  const activeVideo = computed(() => visualVideoSrc[bp.value]);
  const activePoster = computed(() => visualPoster[bp.value]);

  // 前奏（0–4s）只在首播放一次；播到結尾後不回 0、而是回到 4s，之後固定 loop「4s → 結尾」
  // 段落（故 <video> 不加原生 loop，改由 ended 接管）。換片重載後若前奏已播畢，亦從 4s 續播。
  const VISUAL_LOOP_START = 4;
  const visualVideo = ref<HTMLVideoElement | null>(null);
  const introDone = ref(false);
  function onVisualEnded() {
    introDone.value = true;
    const el = visualVideo.value;
    if (!el) return;
    el.currentTime = VISUAL_LOOP_START;
    void el.play();
  }

  // matchMedia 追蹤斷點
  let mqlPad: MediaQueryList | null = null;
  let mqlPc: MediaQueryList | null = null;
  const resolveBp = (): Bp => (mqlPc?.matches ? 'pc' : mqlPad?.matches ? 'pad' : 'mob');
  const syncBp = () => {
    bp.value = resolveBp();
  };

  // 換片：等 DOM 更新完 <source> 後再 load()（flush: 'post'），重載後依前奏狀態決定起點。
  watch(
    bp,
    () => {
      const el = visualVideo.value;
      if (!el) return;
      el.load();
      const onReady = () => {
        el.currentTime = introDone.value ? VISUAL_LOOP_START : 0;
        void el.play();
        el.removeEventListener('loadeddata', onReady);
      };
      el.addEventListener('loadeddata', onReady);
    },
    { flush: 'post' },
  );

  onMounted(() => {
    mqlPad = window.matchMedia('(min-width: 768px)');
    mqlPc = window.matchMedia('(min-width: 1024px)');
    bp.value = resolveBp();
    mqlPad.addEventListener('change', syncBp);
    mqlPc.addEventListener('change', syncBp);
  });
  onBeforeUnmount(() => {
    mqlPad?.removeEventListener('change', syncBp);
    mqlPc?.removeEventListener('change', syncBp);
  });

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
    activeVideo,
    activePoster,
  };
}
