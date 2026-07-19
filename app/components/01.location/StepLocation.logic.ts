import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { GeoMeta } from '../../types/geo';
import { useAssets } from '../../composables/useAssets';
import { byRank } from '../../utils/sort';

export interface StepLocationProps {
  meta: GeoMeta | null;
  countyCode: string;
  townCode: string;
  /**
   * 掛載時的初始階段：預設 false（首屏主視覺）。app.vue 在「重新選擇」回程傳 true，
   * 讓使用者直接落在縣市/鄉鎮選單，跳過封面（仍可往上滑 collapse 回封面）。
   */
  startRevealed?: boolean;
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
export function useStepLocation(
  props: StepLocationProps,
  emit: StepLocationEmit,
) {
  // 兩階段：false = 首屏主視覺（step 1-1），true = 內文＋表單（step 1-2）。可逆。
  // 初值由 startRevealed 決定（僅掛載時取一次）：首次進站 false，重新選擇回程 true。
  const revealed = ref(props.startRevealed ?? false);
  const reveal = () => {
    revealed.value = true;
  };
  const collapse = () => {
    revealed.value = false;
  };

  // ── 區塊垂直置中位移（step2）───────────────────────────
  // 量測「標題＋前言＋表單」整組高度與 wrapper（視窗）高度，算出整組置中所需 translateY。
  // 上緣下限＝標題版位（--lc-sl-title-top ≈ header 下緣，與 step1 貼頂位置同源）：置中位置
  // 過高時改貼齊該線，確保區塊不鑽進固定 header。值經 --lc-sl-block-y 餵給 block 的 transform。
  const block = ref<HTMLElement | null>(null);
  const centerY = ref(0);
  function measureCenter() {
    const el = block.value;
    if (!el) return;
    const wrapperH = el.parentElement?.clientHeight ?? window.innerHeight;
    // header 下緣（＝標題版位）作為上緣下限；單一來源同步自 SCSS 的 --lc-sl-title-top，
    // 不在此硬寫各斷點 header 高度的魔術數字。
    const titleTop =
      parseFloat(getComputedStyle(el).getPropertyValue('--lc-sl-title-top')) ||
      0;
    centerY.value = Math.max(
      titleTop,
      Math.round((wrapperH - el.offsetHeight) / 2),
    );
  }
  let blockRo: ResizeObserver | null = null;

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
    pc: {
      webm: img('livable_city_map_bg_pc.webm'),
      mp4: img('livable_city_map_bg_pc.mp4'),
    },
    pad: {
      webm: img('livable_city_map_bg_pad.webm'),
      mp4: img('livable_city_map_bg_pad.mp4'),
    },
    mob: {
      webm: img('livable_city_map_bg_mob.webm'),
      mp4: img('livable_city_map_bg_mob.mp4'),
    },
  };

  // 影片來源改用 <source media>：瀏覽器在「解析 HTML 時」就依 media 挑對斷點來源
  // （SSR 首屏即正確、不必等 JS，桌機不會先抓 mob 再切）。跨斷點 resize 時再由 JS 呼叫
  // el.load()，讓瀏覽器重跑資源選擇、依 media 重挑來源（見下方 onBpChange）。
  // poster 無法用 media 選（單一 URL），仍由 bp 驅動（首屏 SSR 為 mob，掛載後修正）。
  const bp = ref<Bp>('mob');
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
  const resolveBp = (): Bp =>
    mqlPc?.matches ? 'pc' : mqlPad?.matches ? 'pad' : 'mob';

  // 跨斷點（change 事件只在「實際跨越」門檻時觸發，掛載當下不會，故不會多做一次重載）：
  //   1) 更新 bp → poster 換圖；
  //   2) el.load() 讓瀏覽器依 <source media> 重挑影片來源，載入後依前奏狀態決定起點。
  const onBpChange = () => {
    bp.value = resolveBp();
    const el = visualVideo.value;
    if (!el) return;
    el.load();
    const onReady = () => {
      el.currentTime = introDone.value ? VISUAL_LOOP_START : 0;
      void el.play();
      el.removeEventListener('loadeddata', onReady);
    };
    el.addEventListener('loadeddata', onReady);
  };

  onMounted(() => {
    mqlPad = window.matchMedia('(min-width: 768px)');
    mqlPc = window.matchMedia('(min-width: 1024px)');
    // 初值只同步 poster；影片首屏已由 <source media> 在解析時挑對，不需（也不該）在此重載。
    bp.value = resolveBp();
    mqlPad.addEventListener('change', onBpChange);
    mqlPc.addEventListener('change', onBpChange);

    // 量測置中位移：初次 + block 尺寸變動（字體載入／斷點 reflow）+ 視窗高度變動
    measureCenter();
    blockRo = new ResizeObserver(measureCenter);
    if (block.value) blockRo.observe(block.value);
    window.addEventListener('resize', measureCenter);
  });
  onBeforeUnmount(() => {
    mqlPad?.removeEventListener('change', onBpChange);
    mqlPc?.removeEventListener('change', onBpChange);
    blockRo?.disconnect();
    window.removeEventListener('resize', measureCenter);
  });

  return {
    revealed,
    reveal,
    collapse,
    block,
    centerY,
    onWheel,
    onTouchStart,
    onTouchMove,
    countyOptions,
    townOptions,
    onCountySelect,
    visualVideo,
    onVisualEnded,
    activePoster,
    videoSrc: visualVideoSrc,
  };
}
