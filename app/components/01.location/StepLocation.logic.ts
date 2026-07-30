import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { GeoMeta } from '../../types/geo';
import { useAssets } from '../../composables/useAssets';
import { byRank } from '../../utils/sort';
import useTrackingEvent from '../../composables/useTrackingEvent';

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

  // 任一下拉選單展開時，只許展開、不許「收回封面」，避免選縣市/鄉鎮滑動清單時誤退回首屏。
  // 用 DOM 偵測 open（Reka 在 trigger 掛 data-state="open"，與 SCSS chevron 判斷同源），
  // 不必把兩個 SelectDropdown 的 open 狀態往上拉到這層。
  const anyDropdownOpen = () =>
    !!document.querySelector('.lc-sd__control[data-state="open"]');

  // 滾輪：向下展開、向上收回。lock 避免單一手勢的連續事件造成抖動。
  let wheelLock = false;
  function onWheel(e: WheelEvent) {
    if (wheelLock || Math.abs(e.deltaY) < 8) return;
    // 在下拉選單內滾動時不切換階段，避免操作 select 時誤觸回主視覺
    if ((e.target as HTMLElement | null)?.closest?.('.lc-sd')) return;
    // 下拉選單展開時禁止收回（選單打開就不能退回封面；此時已展開，reveal 為 no-op）
    if (e.deltaY < 0 && anyDropdownOpen()) return;
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
    // 與 wheel 一致：在下拉選單內滑動不切換階段（原本觸控漏了這道守門，
    // 導致手機滑動縣市/鄉鎮清單時會誤觸收回首屏）。
    if ((e.target as HTMLElement | null)?.closest?.('.lc-sd')) return;
    // 下拉選單展開時禁止收回（選單打開就不能退回封面）
    if (dy < 0 && anyDropdownOpen()) return;
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

  // GA：stage1 縣市／鄉鎮選單點擊、下一步（term = 選到的名稱／按鈕文字）
  const { gaClickCity, gaClickDistrict, gaClickBtn } = useTrackingEvent();

  function onCountySelect(val: string) {
    const label = countyOptions.value.find((o) => o.value === val)?.label ?? val;
    gaClickCity(label);
    emit('update:countyCode', val);
    emit('update:townCode', '');
  }

  function onTownSelect(val: string) {
    const label = townOptions.value.find((o) => o.value === val)?.label ?? val;
    gaClickDistrict(label);
    emit('update:townCode', val);
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
  // poster 無法用 media 選（單一 URL）：改由 CSS media query 換背景圖（見 SCSS 的 --lc-sl-poster-*），
  // URL 經 template 的 CSS 變數從 visualPoster 帶入（含 CDN 前綴）。CSS 於各視口即選對圖，
  // SSR 正確、無 hydration 閃爍、桌機只下載命中的那張，故此處不再需要 bp / activePoster。

  // 前奏（0–4s）只在首播放一次；播到結尾後不回 0、而是回到 4s，之後固定 loop「4s → 結尾」
  // 段落（故 <video> 不加原生 loop，改由 ended 接管）。換片重載後若前奏已播畢，亦從 4s 續播。
  const VISUAL_LOOP_START = 4;
  const visualVideo = ref<HTMLVideoElement | null>(null);
  const introDone = ref(false);

  // autoplay 被瀏覽器政策擋下（WebKit 此時會在影片上疊原生播放鍵）。影片預設 pointer-events:none
  // 以免擋住下方互動，一旦被擋就連那顆播放鍵都點不到 → 用此旗標暫時開放點擊（見 SCSS 的
  // __visual--blocked）。成功播放後回復 false。
  const visualBlocked = ref(false);
  // webm 解碼失敗後已強制改吃 mp4（見 onVisualError）；斷點換片時要沿用同一條路，
  // 因為 src 屬性優先於 <source>，load() 不會再回頭重挑 <source>。
  let forcedMp4 = false;

  const currentBp = (): Bp => {
    if (window.matchMedia('(min-width: 1024px)').matches) return 'pc';
    if (window.matchMedia('(min-width: 768px)').matches) return 'pad';
    return 'mob';
  };

  // 統一的播放入口：Safari（尤其經 SPA 路由進來時）判斷能否 muted autoplay 看的是 muted DOM
  // property，而 Vue 的裸 <video muted> 只保證寫 attribute、不保證同步 property，故每次都補設。
  // play() 被拒（背景分頁、視窗未聚焦、Low Power Mode、Safari 站台「永不自動播放」…）無法由頁面
  // 覆蓋，但可以「稍後再試」：標記 visualBlocked，由 retryVisual 在回前景／使用者觸碰時重試。
  async function playVisual() {
    const el = visualVideo.value;
    if (!el) return;
    el.muted = true;
    el.playsInline = true;
    try {
      await el.play();
      visualBlocked.value = false;
    } catch (err) {
      visualBlocked.value = true;
      // 留一行診斷：在實機（尤其 iOS）上要靠這行分辨「政策擋下」還是「來源播不了」。
      console.warn('[visual] play rejected:', (err as Error)?.name, {
        currentSrc: el.currentSrc,
        readyState: el.readyState,
        errorCode: el.error?.code,
      });
    }
  }

  // 重載並依前奏狀態決定起點（換片／強制 fallback 共用）。先掛 loadeddata 再 load()，避免搶不到事件。
  function reloadVisual() {
    const el = visualVideo.value;
    if (!el) return;
    const onReady = () => {
      el.removeEventListener('loadeddata', onReady);
      el.currentTime = introDone.value ? VISUAL_LOOP_START : 0;
      void playVisual();
    };
    el.addEventListener('loadeddata', onReady);
    el.load();
  }

  // 影片層級的 error：代表「已選定的來源播不了」。webm(VP9) 在 WebKit 上最常見的失敗是
  // 容器解析成功、影格解不出來（MEDIA_ERR_DECODE=3）——此時規格上不會自動退回下一個 <source>，
  // 會直接卡死。故在此手動把 src 指到同斷點的 mp4 重載，補上這條缺失的 fallback。
  function onVisualError() {
    const el = visualVideo.value;
    if (!el || forcedMp4) return;
    console.warn('[visual] source failed, falling back to mp4:', {
      errorCode: el.error?.code,
      currentSrc: el.currentSrc,
    });
    forcedMp4 = true;
    el.src = visualVideoSrc[currentBp()].mp4;
    reloadVisual();
  }

  function onVisualEnded() {
    introDone.value = true;
    const el = visualVideo.value;
    if (!el) return;
    el.currentTime = VISUAL_LOOP_START;
    void playVisual();
  }

  // ── autoplay 被擋後的重試 ─────────────────────────────
  // WebKit 擋下 autoplay 後不會自己重試，因此需要三個時機補打：頁面回到前景（背景分頁開啟的情況）、
  // 影片已可播、以及使用者第一次觸碰畫面（在 user gesture 內 play() 幾乎必成功）。
  const retryVisual = () => {
    if (visualBlocked.value) void playVisual();
  };
  const onVisibilityChange = () => {
    if (!document.hidden) retryVisual();
  };

  // matchMedia 追蹤斷點：跨越門檻時重載影片，讓瀏覽器依 <source media> 重挑來源
  let mqlPad: MediaQueryList | null = null;
  let mqlPc: MediaQueryList | null = null;

  // 跨斷點（change 事件只在「實際跨越」門檻時觸發，掛載當下不會，故不會多做一次重載）：
  // 讓瀏覽器依 <source media> 重挑影片來源，載入後依前奏狀態決定起點。
  // （poster 由 CSS media query 自動換圖，無需在此處理。）
  const onBpChange = () => {
    if (forcedMp4) {
      const el = visualVideo.value;
      if (el) el.src = visualVideoSrc[currentBp()].mp4;
    }
    reloadVisual();
  };

  onMounted(() => {
    void playVisual();
    document.addEventListener('visibilitychange', onVisibilityChange);
    // pointerdown 涵蓋觸控與滑鼠；passive 不影響滑動效能。只在 visualBlocked 時才真的重試。
    window.addEventListener('pointerdown', retryVisual, { passive: true });
    visualVideo.value?.addEventListener('canplay', retryVisual);

    mqlPad = window.matchMedia('(min-width: 768px)');
    mqlPc = window.matchMedia('(min-width: 1024px)');
    // 只註冊跨斷點監聽：影片首屏已由 <source media> 在解析時挑對、poster 由 CSS media query 選圖，
    // 故掛載時不需（也不該）在此重載影片或同步任何斷點狀態。
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
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('pointerdown', retryVisual);
    visualVideo.value?.removeEventListener('canplay', retryVisual);
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
    onTownSelect,
    gaClickBtn,
    visualVideo,
    visualBlocked,
    onVisualEnded,
    onVisualError,
    videoPoster: visualPoster,
    videoSrc: visualVideoSrc,
  };
}
