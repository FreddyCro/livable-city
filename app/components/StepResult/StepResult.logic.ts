import { ref, computed } from 'vue';
import type { AcceptableValue } from 'reka-ui';
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
  const compareCollapsed = ref(false);
  const listOpen = ref(false);

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

  // Listbox 單選 + 預設 toggle 行為：點未選項→選取，點已選項→回傳 undefined（取消）
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

  return {
    compareCollapsed,
    listOpen,
    filterNameMap,
    allFilterIds,
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