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
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';

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
  open: [];
  close: [];
}>();

const rootRef = ref<HTMLElement | null>(null);
const controlRef = ref<HTMLButtonElement | null>(null);
const open = ref(false);
const direction = ref<'down' | 'up'>('down');

// 估算 menu 高度上限，與 .lc-sd__menu 的 max-height 對齊
const MENU_MAX_HEIGHT = 280;

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

const allOptions = computed<SelectOption[]>(() =>
  renderGroups.value.flatMap((g) => g.options),
);

const selectedLabel = computed<string | null>(
  () =>
    allOptions.value.find((o) => o.value === props.modelValue)?.label ?? null,
);

function toggle() {
  if (props.disabled) return;
  open.value ? close() : openMenu();
}

async function openMenu() {
  open.value = true;
  emit('open');
  await nextTick();
  updateDirection();
}

function close() {
  if (!open.value) return;
  open.value = false;
  emit('close');
}

function select(opt: SelectOption) {
  if (opt.disabled) return;
  emit('update:modelValue', opt.value);
  close();
}

// 依視窗可用空間判斷向下 / 向上展開（client only）
function updateDirection() {
  const el = controlRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  direction.value =
    spaceBelow < MENU_MAX_HEIGHT && spaceAbove > spaceBelow ? 'up' : 'down';
}

function onDocPointer(e: Event) {
  if (!open.value) return;
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) close();
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close();
}

function onViewportChange() {
  if (open.value) updateDirection();
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointer);
  document.addEventListener('keydown', onKeydown);
  window.addEventListener('resize', onViewportChange);
  window.addEventListener('scroll', onViewportChange, true);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointer);
  document.removeEventListener('keydown', onKeydown);
  window.removeEventListener('resize', onViewportChange);
  window.removeEventListener('scroll', onViewportChange, true);
});
</script>

<template>
  <div
    ref="rootRef"
    class="lc-sd"
    :class="{
      'lc-sd--open': open,
      'lc-sd--disabled': disabled,
      [`lc-sd--${direction}`]: open,
    }"
  >
    <!-- control -->
    <button
      ref="controlRef"
      type="button"
      class="lc-sd__control"
      :disabled="disabled"
      aria-haspopup="listbox"
      :aria-expanded="open"
      @click="toggle"
    >
      <span v-if="$slots.icon || icon" class="lc-sd__icon">
        <slot name="icon">{{ icon }}</slot>
      </span>
      <span
        class="lc-sd__label"
        :class="{ 'lc-sd__label--placeholder': selectedLabel === null }"
      >
        {{ selectedLabel ?? placeholder }}
      </span>
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
    </button>

    <!-- menu -->
    <Transition :name="direction === 'up' ? 'lc-sd-up' : 'lc-sd-down'">
      <div
        v-if="open"
        class="lc-sd__menu"
        :class="`lc-sd__menu--${direction}`"
        role="listbox"
      >
        <div
          v-for="(group, gi) in renderGroups"
          :key="gi"
          class="lc-sd__group"
          role="group"
        >
          <div v-if="group.label !== null" class="lc-sd__group-label">
            <slot name="group-label" :group="group">{{ group.label }}</slot>
          </div>
          <div
            v-for="opt in group.options"
            :key="opt.value"
            class="lc-sd__option"
            :class="{
              'lc-sd__option--selected': opt.value === modelValue,
              'lc-sd__option--disabled': opt.disabled,
            }"
            role="option"
            :aria-selected="opt.value === modelValue"
            @click="select(opt)"
          >
            <slot name="option" :option="opt">{{ opt.label }}</slot>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
// select-dropdown
.lc-sd {
  position: relative;
  display: inline-block;
  font-family: 'Noto Sans TC', sans-serif;

  // select-dropdown__control
  &__control {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 140px;
    padding: 10px 14px;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 14px;
    color: #222;
    cursor: pointer;
    transition: border-color 0.15s;

    &:hover:not(:disabled) {
      border-color: $color-b03;
    }

    &:disabled {
      color: #aaa;
      cursor: default;
      background: #f7f7f7;
    }
  }

  &--open &__control {
    border-color: $color-b03;
  }

  // 展開時 control 與 menu 接合側去圓角（合成連續容器，方向 class 在 open 時掛於 root）
  &--open#{&}--down &__control {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  &--open#{&}--up &__control {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
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

    // select-dropdown__label--placeholder
    &--placeholder {
      color: #999;
    }
  }

  // select-dropdown__chevron
  &__chevron {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    color: #888;
    transition: transform 0.18s ease;
  }

  &--open &__chevron {
    transform: rotate(180deg);
  }

  // select-dropdown__menu
  &__menu {
    position: absolute;
    left: 0;
    right: 0;
    z-index: 50;
    max-height: 280px;
    overflow-y: auto;
    background: #fff;
    border: 1px solid $color-b03;
    border-radius: 8px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
    padding: 4px;

    // select-dropdown__menu--down（接在 control 下方、接縫去圓角、邊框重疊 1px 合併）
    &--down {
      top: 100%;
      margin-top: -1px;
      border-top-left-radius: 0;
      border-top-right-radius: 0;
    }

    // select-dropdown__menu--up（接在 control 上方）
    &--up {
      bottom: 100%;
      margin-bottom: -1px;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
  }

  // select-dropdown__group
  &__group {
    & + & {
      border-top: 1px solid #f0f0f0;
      margin-top: 4px;
      padding-top: 4px;
    }
  }

  // select-dropdown__group-label
  &__group-label {
    padding: 6px 10px 2px;
    font-size: 11px;
    font-weight: 700;
    color: #999;
    letter-spacing: 0.03em;
  }

  // select-dropdown__option
  &__option {
    padding: 8px 10px;
    font-size: 14px;
    color: #333;
    border-radius: 6px;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:hover {
      background: $color-b02;
    }

    // select-dropdown__option--selected
    &--selected {
      background: $color-b03;
      color: #fff;
      font-weight: 500;
    }

    // select-dropdown__option--disabled
    &--disabled {
      color: #ccc;
      cursor: default;
      background: transparent;
    }
  }
}

// menu transitions（Vue <Transition> 全域 class，非 BEM）
.lc-sd-down-enter-active,
.lc-sd-down-leave-active,
.lc-sd-up-enter-active,
.lc-sd-up-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.lc-sd-down-enter-from,
.lc-sd-down-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.lc-sd-up-enter-from,
.lc-sd-up-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
