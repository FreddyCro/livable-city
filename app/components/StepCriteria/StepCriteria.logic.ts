import { computed } from 'vue';
import str from '../../locales/criteria.json';
import type { GeoMeta } from '../../types/geo';
import type { FilterMeta, FilterDataCache } from '../../types/filter';
import type { TownThumb } from '../../composables/useTaiwanMap';

export const MAX_SELECT = 3;

export interface StepCriteriaProps {
  meta: GeoMeta | null;
  filterIndex: FilterMeta[];
  selectedTownCode: string;
  filterDataCache: FilterDataCache;
  selectedFilters: string[];
  selectedTownThumb: TownThumb | null;
}

export interface StepCriteriaEmit {
  (e: 'update:selectedFilters', value: string[]): void;
}

/**
 * StepCriteria 的 view 邏輯（單一元件專用，與元件 co-locate）。
 * 現居地區名稱、選取上限/可進入判斷、勾選提示、條件多選 toggle 與數值格式化。
 * 勿解構 props（會失去 reactivity）。
 */
export function useStepCriteria(props: StepCriteriaProps, emit: StepCriteriaEmit) {
  const countyName = computed(() => {
    const m = props.meta;
    if (!m || !props.selectedTownCode) return '';
    const town = m.towns[props.selectedTownCode];
    return (town ? m.counties[town.COUNTYCODE]?.COUNTYNAME : '') ?? '';
  });

  const townName = computed(() => {
    if (!props.meta || !props.selectedTownCode) return '';
    return props.meta.towns[props.selectedTownCode]?.TOWNNAME ?? '';
  });

  const atMax = computed(() => props.selectedFilters.length >= MAX_SELECT);

  // 必須選滿 MAX_SELECT 項才能進入 step 3（與 hint「請選擇3項」一致）
  const canProceed = computed(() => props.selectedFilters.length === MAX_SELECT);

  const hintText = computed(
    () =>
      `${str.hint}（${str.selectedLabel}${props.selectedFilters.length}/${MAX_SELECT}）`,
  );

  function toggleFilter(id: string) {
    const filters = [...props.selectedFilters];
    const idx = filters.indexOf(id);
    if (idx >= 0) {
      filters.splice(idx, 1);
    } else {
      if (filters.length >= MAX_SELECT) return; // cap at MAX_SELECT
      filters.push(id);
    }
    emit('update:selectedFilters', filters);
  }

  function formatVal(val: number | null | undefined): string {
    if (val == null) return '—';
    return val.toLocaleString();
  }

  // 現居地區資訊面板：數值後緊接單位（如「51.02萬／坪」「12.5%」）；缺值僅顯示「—」不接單位。
  function statText(f: FilterMeta): string {
    const val = props.filterDataCache[f.id]?.[props.selectedTownCode];
    if (val == null) return '—';
    return `${val.toLocaleString()}${f.unit ?? ''}`;
  }

  return {
    countyName,
    townName,
    atMax,
    canProceed,
    hintText,
    toggleFilter,
    formatVal,
    statText,
  };
}
