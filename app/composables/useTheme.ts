import { ref } from 'vue'

export type Theme = 'prod' | 'wireframe'

// Module-level singleton：UI 切換鈕與 deck.gl 圖層共用同一個 theme 狀態。
// 預設 wireframe（目前線框階段）；SSR 端由 nuxt.config 的 htmlAttrs 設定 data-theme，
// 兩者一致避免 hydration 閃爍。要改預設值，這裡與 nuxt.config 一起改。
const theme = ref<Theme>('wireframe')

/**
 * 主題切換：寫入 <html data-theme>，所有 var(--c-*) 瞬間重繪。
 * theme ref 供 JS（deck.gl 地圖）watch，在切換時重建圖層色。
 */
export function useTheme() {
  function setTheme(next: Theme) {
    theme.value = next
    if (import.meta.client) document.documentElement.dataset.theme = next
  }

  function toggle() {
    setTheme(theme.value === 'wireframe' ? 'prod' : 'wireframe')
  }

  return { theme, setTheme, toggle }
}
