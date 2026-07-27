import { ref, computed, onMounted, onBeforeUnmount, useTemplateRef } from 'vue';
import type { AcceptableValue } from 'reka-ui';
import { useClickOutside, unrefElement } from '../../composables/useClickOutside';
import type { GeoMeta } from '../../types/geo';
import type { FilterMeta, FilterDataCache, FilterDataset } from '../../types/filter';
import type { ResultTown } from '../../composables/useResultTowns';

export interface StepResultProps {
  meta: GeoMeta | null;
  filterIndex: FilterMeta[];
  filterDataCache: FilterDataCache;
  selectedTownCode: string;
  selectedFilters: string[];
  resultTowns: ResultTown[];
  selectedResultCode: string | null;
  population: FilterDataset | null;
}

export interface StepResultEmit {
  (e: 'update:selectedResultCode', value: string | null): void;
  (e: 'update:selectedFilters', value: string[]): void;
}

/**
 * StepResult 的 view 邏輯。單一元件專用，故與元件 co-locate（不放全站 composables/，
 * 避免 auto-import 與「可共用」的語意誤導）。接收元件的 props 與 emit，
 * 回傳給 template 綁定的 computed / handler。
 *
 * 注意：勿解構 props（會失去 reactivity）；此處統一在 computed getter 內讀 props.xxx。
 */
export function useStepResult(props: StepResultProps, emit: StepResultEmit) {
  // compare 狀態：'half' 半開（只顯示第一個指標）/ 'open' 全開（顯示全部）；預設 'half'。
  // 'collapsed'（只剩標題列）功能保留於型別與 template 判斷，但目前流程不會進入此狀態。
  const compareState = ref<'collapsed' | 'half' | 'open'>('half');
  // 切換鈕僅在 half ↔ open 間來回：half → open（看更多）、open → half（收合為半開）。
  function cycleCompare() {
    compareState.value = compareState.value === 'open' ? 'half' : 'open';
  }
  const listOpen = ref(false);

  // RWD：MOB（< sm / <768）時，左側欄改為底部可展開 sheet（filter）。
  // 桌機 / PAD 恆開（CollapsibleRoot :open=true、:disabled），故只在 MOB 追蹤開合與斷點。
  // 斷點偵測沿用 StepLocation 的原生 matchMedia 模式（無 VueUse）。
  const asideOpen = ref(false);
  const isMobile = ref(false);
  let mqlMob: MediaQueryList | null = null;
  const syncMob = () => {
    isMobile.value = mqlMob?.matches ?? false;
    // 由 MOB 切回桌機時重置收合狀態，避免下次回到 MOB 仍記得展開
    if (!isMobile.value) asideOpen.value = false;
  };
  // CollapsibleRoot @update:open：僅 MOB 可切換（桌機 disabled 不會觸發，仍防呆）
  function onAsideOpenChange(value: boolean) {
    if (isMobile.value) asideOpen.value = value;
  }
  onMounted(() => {
    mqlMob = window.matchMedia('(max-width: 767.98px)');
    isMobile.value = mqlMob.matches;
    mqlMob.addEventListener('change', syncMob);
  });
  onBeforeUnmount(() => {
    mqlMob?.removeEventListener('change', syncMob);
  });

  // 比較面板的指標標題：名稱後接括號單位（如「大樓平均單價（萬元／坪）」），單位空白時僅顯示名稱
  const filterNameMap = computed(() =>
    Object.fromEntries(
      props.filterIndex.map((f) => [f.id, f.unit ? `${f.name}（${f.unit}）` : f.name]),
    ),
  );

  // explore-compare 只顯示 explore-sidebar 有勾選的指標（依 filterIndex 原始順序排列）
  const allFilterIds = computed(() =>
    props.filterIndex.map((f) => f.id).filter((id) => props.selectedFilters.includes(id)),
  );

  // compare body 實際渲染的指標：半開只取第一個，全開取全部（收合時 body 不渲染）
  const visibleFilterIds = computed(() =>
    compareState.value === 'half' ? allFilterIds.value.slice(0, 1) : allFilterIds.value,
  );

  // Home (current) town name
  const homeCounty = computed(() => {
    const m = props.meta;
    if (!m || !props.selectedTownCode) return '';
    const t = m.towns[props.selectedTownCode];
    return (t ? m.counties[t.COUNTYCODE]?.COUNTYNAME : '') ?? '';
  });
  const homeName = computed(() => {
    const m = props.meta;
    if (!m || !props.selectedTownCode) return '';
    return m.towns[props.selectedTownCode]?.TOWNNAME ?? '';
  });

  // Target (selected result) town
  const detailTown = computed(() => {
    const m = props.meta;
    if (!props.selectedResultCode || !m) return null;
    const t = m.towns[props.selectedResultCode];
    const c = t ? m.counties[t.COUNTYCODE] : undefined;
    return { name: t?.TOWNNAME ?? '', county: c?.COUNTYNAME ?? '' };
  });

  // 比較卡標題顯示的人口（取自 data/0.json，對應目前選取的結果鄉鎮）
  const detailPopulation = computed(() =>
    props.selectedResultCode
      ? (props.population?.[props.selectedResultCode] ?? null)
      : null,
  );

  // Paddle nav：在結果清單（已扁平、已排序的 resultTowns）中前後切換選取地區
  const currentResultIndex = computed(() =>
    props.selectedResultCode
      ? props.resultTowns.findIndex((t) => t.code === props.selectedResultCode)
      : -1,
  );
  const hasPrev = computed(() => currentResultIndex.value > 0);
  const hasNext = computed(
    () =>
      currentResultIndex.value >= 0 &&
      currentResultIndex.value < props.resultTowns.length - 1,
  );

  // delta=-1 上一個 / +1 下一個；超出範圍（含未選取時的 -1）時 next 為 undefined，不動作
  function goBy(delta: number) {
    if (currentResultIndex.value < 0) return;
    const next = props.resultTowns[currentResultIndex.value + delta];
    if (next) emit('update:selectedResultCode', next.code);
  }

  // Result list grouped by county
  const resultGroups = computed(() => {
    const map = new Map<string, Array<{ code: string; name: string }>>();
    for (const t of props.resultTowns) {
      if (!map.has(t.county)) map.set(t.county, []);
      map.get(t.county)!.push({ code: t.code, name: t.name });
    }
    return Array.from(map, ([county, towns]) => ({ county, towns }));
  });

  // CheckboxGroup 多選：reka 回傳更新後的勾選值陣列（值均為 filter id 字串）
  function onFiltersChange(value: AcceptableValue[]) {
    emit('update:selectedFilters', value as string[]);
  }

  // Listbox 單選、不可取消（ListboxRoot selection-behavior=replace）：只會收到被點的 item 值，
  // 已選項再次點擊維持選取、不回傳 undefined。?? null 僅為型別保險。
  function onResultSelect(val: AcceptableValue | undefined) {
    emit('update:selectedResultCode', (val as string | undefined) ?? null);
  }

  // % diff of target vs home (e.g. "-13%"); null when not computable
  function pct(fid: string): string | null {
    const home = props.filterDataCache[fid]?.[props.selectedTownCode];
    const target = props.selectedResultCode
      ? props.filterDataCache[fid]?.[props.selectedResultCode]
      : null;
    if (home == null || target == null || home === 0) return null;
    const p = Math.round(((target - home) / home) * 100);
    return `${p > 0 ? '+' : ''}${p}%`;
  }

  function formatVal(val: number | null | undefined): string {
    if (val == null) return '—';
    return typeof val === 'number' ? val.toLocaleString() : String(val);
  }

  // ── click-outside 收合 ─────────────────────────────────────────
  // 三個面板都是 .lc-sr（fixed 全螢幕、pointer-events:none）內的浮層，地圖在其後。
  // 點地圖時事件 target 不落在任何面板內，即視為「外部」→ 收合對應面板。
  // 三塊面板已抽為子元件（ExploreSidebar/ResultBar/Compare），ref 掛在子元件實例上，
  // 透過 $el 取其根 DOM（單一根元素）；unrefElement 會處理元件實例 → $el（見 useClickOutside）。
  const sidebarEl = useTemplateRef<{ $el?: HTMLElement }>('sidebarEl');
  const listEl = useTemplateRef<{ $el?: HTMLElement }>('listEl');
  const compareEl = useTemplateRef<{ $el?: HTMLElement }>('compareEl');

  // 3.1 explore-sidebar：僅 MOB 的底部 filter sheet 會開合（桌機恆開），點外部收合
  useClickOutside(sidebarEl, () => {
    if (isMobile.value && asideOpen.value) asideOpen.value = false;
  });

  // 3.2 explore-result-bar：點清單外部即收合；點清單項目屬「內部」，維持展開可連續瀏覽
  useClickOutside(listEl, () => {
    if (listOpen.value) listOpen.value = false;
  });

  // 3.4 explore-compare：點外部收合為 half（半開；collapsed 已停用，最小狀態改為 half）。
  // 但點在結果清單內是「切換要比較的鄉鎮」（MOB 隱藏左右鈕、正靠清單切換），不收合。
  useClickOutside(compareEl, (event) => {
    const node = event.target as Node | null;
    const list = unrefElement(listEl.value);
    if (node && list?.contains(node)) return;
    if (compareState.value !== 'half') compareState.value = 'half';
  });

  return {
    compareState,
    cycleCompare,
    listOpen,
    asideOpen,
    isMobile,
    onAsideOpenChange,
    filterNameMap,
    allFilterIds,
    visibleFilterIds,
    homeCounty,
    homeName,
    detailTown,
    detailPopulation,
    hasPrev,
    hasNext,
    goBy,
    resultGroups,
    onFiltersChange,
    onResultSelect,
    pct,
    formatVal,
  };
}