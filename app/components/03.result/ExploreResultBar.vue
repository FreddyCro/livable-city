<script setup lang="ts">
// 3.2 explore-result-bar：結果數／清單「共 N 項結果」（Reka Collapsible + Listbox，浮於地圖）。
// 純呈現元件；開合（listOpen）與選取（selectedResultCode）由 StepResult 統籌。
import { computed } from 'vue';
import type { AcceptableValue } from 'reka-ui';
import str from '../../locales/explore.json';
import type { ResultTown } from '../../composables/useResultTowns';
import { useAssets } from '../../composables/useAssets';

const props = defineProps<{
  listOpen: boolean;
  resultTowns: ResultTown[];
  resultGroups: { county: string; towns: { code: string; name: string }[] }[];
  selectedResultCode: string | null;
}>();

defineEmits<{
  'update:listOpen': [value: boolean];
  'result-select': [value: AcceptableValue | undefined];
}>();

const { img } = useAssets();

// 只顯示有鄉鎮的 county group（item 為 0 的 group 不顯示，避免只剩孤立的縣市標題）
const groups = computed(() => props.resultGroups.filter((g) => g.towns.length > 0));
const iconUrl = (name: string) => img(`icon/${name}.svg`);
</script>

<template>
  <!-- 收合用 Reka Collapsible、選取用 Reka Listbox。
       unmount-on-hide=false：收合時以 hidden 保留 DOM（不卸載），維持清單捲動位置。 -->
  <CollapsibleRoot
    :open="listOpen"
    :unmount-on-hide="false"
    class="lc-sr__list"
    @update:open="$emit('update:listOpen', $event)"
  >
    <CollapsibleTrigger
      class="lc-sr__list-head"
      :class="{ 'lc-sr__list-head--open': listOpen }"
    >
      <!-- 展開態（State=clicked）：← 請選擇 -->
      <template v-if="listOpen">
        <svg
          class="lc-sr__list-back"
          viewBox="0 0 14 10"
          fill="none"
          stroke="currentColor"
          stroke-width="1"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M13 5H1M5 1 1 5l4 4" />
        </svg>
        <span class="lc-sr__list-label">{{ str.listPlaceholder }}</span>
      </template>
      <!-- 收合態（State=default）：共N項結果 + 放大鏡（button_search） -->
      <template v-else>
        <span class="lc-sr__list-label">
          {{ str.resultCountPrefix }} {{ resultTowns.length }}
          {{ str.resultCountSuffix }}
        </span>
        <img
          class="lc-sr__list-search"
          :src="iconUrl('button_search')"
          alt=""
        />
      </template>
    </CollapsibleTrigger>
    <CollapsibleContent class="lc-sr__list-body">
      <ListboxRoot
        v-if="resultTowns.length"
        :model-value="selectedResultCode ?? undefined"
        @update:model-value="$emit('result-select', $event)"
      >
        <!-- ListboxContent 才會掛 role=listbox 與方向鍵/Enter/type-ahead keydown -->
        <ListboxContent class="lc-sr__listbox">
          <ListboxGroup
            v-for="g in groups"
            :key="g.county"
            class="lc-sr__list-group"
          >
            <ListboxGroupLabel class="lc-sr__list-county">
              {{ g.county }}
            </ListboxGroupLabel>
            <ListboxItem
              v-for="t in g.towns"
              :key="t.code"
              :value="t.code"
              class="lc-sr__list-item"
            >
              {{ t.name }}
            </ListboxItem>
          </ListboxGroup>
        </ListboxContent>
      </ListboxRoot>
      <!-- 空狀態置於 listbox 之外，避免 role=listbox 內含非 option 內容 -->
      <div v-else class="lc-sr__list-empty">
        {{ str.noResult }}
      </div>
    </CollapsibleContent>
  </CollapsibleRoot>
</template>
