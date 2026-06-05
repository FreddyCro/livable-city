<script lang="ts">
// 共用型別（放在模組區塊，消費端可 import type）
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
export interface SelectOptionGroup {
  label: string;
  options: SelectOption[];
}
export type SelectItems = SelectOption[] | SelectOptionGroup[];
</script>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: string | null;
    options: SelectItems;
    placeholder?: string;
    disabled?: boolean;
    icon?: string;
  }>(),
  {
    placeholder: '請選擇',
    disabled: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

// 判斷 options 是否為分組結構（含 options 欄位即為 group）
const isGrouped = computed(
  () => props.options.length > 0 && 'options' in (props.options[0] as object),
);

// 統一成 group 陣列渲染：扁平 → 單一無標題 group
const renderGroups = computed<
  Array<{ label: string | null; options: SelectOption[] }>
>(() => {
  if (isGrouped.value) {
    return (props.options as SelectOptionGroup[]).map((g) => ({
      label: g.label,
      options: g.options,
    }));
  }
  return [{ label: null, options: props.options as SelectOption[] }];
});

function onUpdate(val: string) {
  emit('update:modelValue', val);
}
</script>

<template>
  <!-- 行為、鍵盤導航、type-ahead、focus 管理、ARIA 由 Reka UI 提供；樣式維持自有 lc-sd。
       選單刻意「不」用 SelectPortal：inline 渲染才能讓 .lc-sd 以 :has() 偵測選單方向，
       把 control 與選單接縫側的圓角去掉，呈現 Reka 前的連續容器外觀。 -->
  <SelectRoot
    :model-value="modelValue ?? undefined"
    :disabled="disabled"
    @update:model-value="onUpdate"
  >
    <div class="lc-sd">
      <!-- control -->
      <SelectTrigger class="lc-sd__control">
        <span v-if="$slots.icon || icon" class="lc-sd__icon">
          <slot name="icon">{{ icon }}</slot>
        </span>
        <SelectValue class="lc-sd__label" :placeholder="placeholder" />
        <span class="lc-sd__chevron" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 4.5 6 8l3.5-3.5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
      </SelectTrigger>

      <!-- menu（inline，非 portal；popper 提供碰撞翻轉 + data-side）。
           ⚠️ position="popper" 與「不包 SelectPortal」是樣式的硬相依，兩者皆不可移除：
           - data-side 由 popper 模式才會輸出，是 __menu / __control 接縫去圓角的依據；
           - --reka-select-trigger-width 亦僅 popper 模式才設，是選單寬度對齊 trigger 的依據；
           - inline（非 portal）才能讓 .lc-sd 以 :has() 讀到選單的 data-side。
           若改用 item-aligned 或 SelectPortal，接縫圓角與選單寬度都會失效。 -->
      <SelectContent
        class="lc-sd__menu"
        position="popper"
        :side-offset="-1"
        align="start"
      >
        <SelectViewport class="lc-sd__viewport">
          <SelectGroup
            v-for="(group, gi) in renderGroups"
            :key="gi"
            class="lc-sd__group"
          >
            <SelectLabel v-if="group.label !== null" class="lc-sd__group-label">
              <slot name="group-label" :group="group">{{ group.label }}</slot>
            </SelectLabel>
            <SelectItem
              v-for="opt in group.options"
              :key="opt.value"
              class="lc-sd__option"
              :value="opt.value"
              :disabled="opt.disabled"
            >
              <SelectItemText>
                <slot name="option" :option="opt">{{ opt.label }}</slot>
              </SelectItemText>
            </SelectItem>
          </SelectGroup>
        </SelectViewport>
      </SelectContent>
    </div>
  </SelectRoot>
</template>

<style scoped lang="scss">
// select-dropdown
.lc-sd {
  position: relative;

  // 展開時去掉 control 與選單接縫側的圓角，合成連續容器。
  // 選單 inline 渲染，故 .lc-sd 可用 :has() 讀到 SelectContent 的 data-side。
  &:has(&__menu[data-side='bottom']) &__control {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  &:has(&__menu[data-side='top']) &__control {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }

  // select-dropdown__control
  &__control {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 140px;
    padding: 10px 14px;
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: 8px;
    font-size: 14px;
    color: var(--c-text);
    font-family: 'Noto Sans TC', sans-serif;
    cursor: pointer;
    transition: border-color 0.15s;

    &:hover:not([data-disabled]) {
      border-color: $color-b03;
    }

    // 展開時（Reka 在 trigger 掛 data-state="open"）
    &[data-state='open'] {
      border-color: $color-b03;
    }

    // 停用（Reka 掛 data-disabled）
    &[data-disabled] {
      color: var(--c-text-faint);
      cursor: default;
      background: var(--c-surface-sunken);
    }
  }

  // select-dropdown__icon
  &__icon {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    color: $color-b03;
  }

  // select-dropdown__label
  &__label {
    flex: 1;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  // placeholder 態：Reka 在 trigger 掛 data-placeholder
  &__control[data-placeholder] &__label {
    color: var(--c-text-faint);
  }

  // select-dropdown__chevron
  &__chevron {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    color: var(--c-text-muted);
    transition: transform 0.18s ease;
  }

  &__control[data-state='open'] &__chevron {
    transform: rotate(180deg);
  }
}
</style>

<style lang="scss">
// select-dropdown（選單子樹）
// reka SelectContent 渲染出的元素不帶 Vue scoped 的 data-v 屬性（即使 inline 不 portal
// 也一樣，它與 .lc-sd 之間還隔著 reka 的 positioner wrapper），故此區改為 global。
// class 已以 lc-sd 命名空間隔離。control 的 :has() 接縫規則留在上方 scoped block
// （.lc-sd / .lc-sd__control 本身帶 scoped 屬性，:has() 內的 __menu 僅作條件比對）。
.lc-sd {
  // select-dropdown__menu（與 control 接合的連續容器；popper 寬度對齊 trigger）
  &__menu {
    z-index: 50;
    width: var(--reka-select-trigger-width);
    background: var(--c-surface);
    border: 1px solid $color-b03;
    border-radius: 8px;
    box-shadow: 0 6px 20px rgb(var(--c-shadow) / 0.12);
    overflow: hidden;

    // 接縫側去圓角（向下展開→去上緣；向上展開→去下緣）
    &[data-side='bottom'] {
      border-top-left-radius: 0;
      border-top-right-radius: 0;
    }

    &[data-side='top'] {
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
  }

  // select-dropdown__viewport（可捲動內容）
  // Reka 會注入 [data-reka-select-viewport]{scrollbar-width:none} 並隱藏 webkit 捲軸；
  // 以「class + data 屬性」提高權重蓋回，讓選單超出 280px 時仍有捲軸提示（縣市清單必超出）。
  &__viewport[data-reka-select-viewport] {
    max-height: 280px;
    overflow-y: auto;
    padding: 4px;
    scrollbar-width: thin;

    &::-webkit-scrollbar {
      display: block;
      width: 8px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--c-border-hover);
      border-radius: 4px;
    }
  }

  // select-dropdown__group
  &__group {
    & + & {
      border-top: 1px solid var(--c-border-subtle);
      margin-top: 4px;
      padding-top: 4px;
    }
  }

  // select-dropdown__group-label
  &__group-label {
    padding: 6px 10px 2px;
    font-size: 11px;
    font-weight: 700;
    color: var(--c-text-faint);
    letter-spacing: 0.03em;
  }

  // select-dropdown__option
  &__option {
    padding: 8px 10px;
    font-size: 14px;
    color: var(--c-text-secondary);
    border-radius: 6px;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    user-select: none;
    outline: none;

    // 鍵盤/滑鼠高亮：Reka 掛 data-highlighted
    &[data-highlighted] {
      background: $color-b02;
    }

    // 已選：Reka 掛 data-state="checked"
    &[data-state='checked'] {
      background: $color-b03;
      color: var(--c-text-inverse);
      font-weight: 500;
    }

    // select-dropdown__option--disabled：Reka 掛 data-disabled
    &[data-disabled] {
      color: var(--c-text-faint);
      cursor: default;
      background: transparent;
    }
  }
}
</style>
