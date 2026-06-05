/**
 * 靜態資源路徑：集中 public 資產的前綴邏輯（dev 為空 → /img/...，正式環境指向 CDN）。
 * 取代各元件各自重組 `${APP_ASSETS_PATH}/img/...` 字串。
 */
export function useAssets() {
  const base = useRuntimeConfig().public.APP_ASSETS_PATH

  /** public/img 下的資源 URL，例如 img('icon/ic_house_price.svg')。 */
  const img = (path: string) => `${base}/img/${path}`

  return { img }
}
