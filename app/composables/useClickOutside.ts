import { onBeforeUnmount, onMounted, type Ref } from 'vue';

/** 目標來源：原生元素，或會 expose `$el` 的元件實例（如 Reka UI 元件） */
type ElementSource = HTMLElement | { $el?: unknown } | null | undefined;

/** 可為 null/undefined 的目標 ref（含 useTemplateRef 回傳的唯讀 ref、Reka 元件實例 ref） */
export type MaybeElementRef = Readonly<Ref<ElementSource>>;

/** 從 ref 值解析出真實 DOM 元素；元件實例取其 $el，取不到則回傳 null */
export function unrefElement(value: ElementSource): HTMLElement | null {
  if (!value) return null;
  if (value instanceof HTMLElement) return value;
  const el = (value as { $el?: unknown }).$el;
  return el instanceof HTMLElement ? el : null;
}

/**
 * 偵測「點擊在 target 之外」並觸發 handler。
 * 常見用途：點外部時關閉選單 / 彈窗 / 下拉。
 *
 * - 監聽 document 的 pointerdown（涵蓋滑鼠 / 觸控 / 觸控筆），
 *   在 capture 階段判斷點擊落點是否在 target 之內。
 * - target 尚未掛載（null）或點擊落在 target 內時皆不觸發。
 * - 監聽只在 onMounted 後掛上（Nuxt 中等同 client-only），SSR 期間不執行；
 *   元件卸載時自動移除。
 *
 * 注意：若選單以 portal/teleport 渲染到 target 之外，點擊選單會被判為「外部」。
 * 呼叫端請把 target 指向「同時包住觸發器與選單」的容器（inline 渲染即符合）。
 */
export function useClickOutside(
  target: MaybeElementRef,
  handler: (event: PointerEvent) => void,
): void {
  function onPointerDown(event: PointerEvent) {
    const el = unrefElement(target.value);
    if (!el) return;
    const node = event.target as Node | null;
    if (node && !el.contains(node)) handler(event);
  }

  onMounted(() => {
    document.addEventListener('pointerdown', onPointerDown, true);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', onPointerDown, true);
  });
}
