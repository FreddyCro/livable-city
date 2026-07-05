# 產品需求文件 PRD — 宜居城市互動地圖

> 2026 九合一選舉 ‧ 聯合報互動專題
> 三步驟流程：**定位現居地 → 選擇條件 → 探索結果**
>
> 本文以「產品需求」角度整理現行 codebase；流程細節（mermaid、逐節點時序）見 [wireflow.md](./wireflow.md)，狀態欄以本文為準。狀態標記：✅=已實作、🟡=部分、⬜=待建、⚠️=注意事項。

## 概述

單一頁面、以 **step 狀態機**驅動的互動式工具型專題。全站只有一個正式頁面（`/`），畫面依 `currentStep: 1 | 2 | 3` 在三個步驟元件間 fade 切換，背後疊一張**常駐的台灣地圖**（deck.gl）作為背景與第三步的主舞台。切分原則：**Page → Step → Panel → Component**，每個 panel／元件的功能以表格條列；跨步驟共用的功能另立區塊。

- 正式頁面：`/`（[app.vue](../app/app.vue)，本專案未用 `pages/`，`app.vue` 即根元件並持有所有共享狀態）
- 三個步驟元件：[StepLocation.vue](../app/components/01.location/StepLocation.vue)、[StepCriteria.vue](../app/components/02.criteria/StepCriteria.vue)、[StepResult.vue](../app/components/03.result/StepResult.vue)
- 常駐地圖背景：[TaiwanMap.vue](../app/components/TaiwanMap.vue) + [useTaiwanMap.ts](../app/composables/useTaiwanMap.ts)
- **狀態單一擁有者**：所有使用者選取狀態（`selectedCountyCode` / `selectedTownCode` / `selectedFilters` / `selectedResultCode`）與共享資料（`meta` / `filterIndex` / `filterDataCache` / `population`）都在 [app.vue](../app/app.vue) 建立，以 props 向下傳、以 emit 向上收；步驟元件不自持跨步驟狀態。
- **元件目錄慣例**：三個 step 各一個「數字前綴 ＋ 語意名」資料夾（`01.location` / `02.criteria` / `03.result`），使檔案總管依流程排序。[nuxt.config.ts](../nuxt.config.ts) 對這三個資料夾設 `pathPrefix: false`，故 auto-import 元件名**只取檔名、不含編號前綴**（`<StepLocation>` / `<StepCriteria>` / `<StepResult>`，及各自的專屬子元件 `<SelectDropdown>` / `<IconArrow>` / `<InfoContent>`）。最後的 `~/components` 沿用預設前綴規則（`ui/` → `Ui*`、`AppHeader`…）。
- **view 邏輯分離**：每個 step 的 view 邏輯抽到 co-located 的 `*.logic.ts`（`StepX.logic.ts`，單一元件專用、明確 import、不進 `composables/` 避免「可共用」誤導）。
- **SSR/CSR 邊界**：所有 `public/` 大型資料（地圖 topology、metadata、指標資料）一律在 **client 端 `onMounted` 後**載入，SSR 階段為 `null`——刻意設計，不阻塞首屏。呼叫端勿在 setup 同步階段依賴資料。

---

## 資料層（Data Layer）

所有靜態資料經單一出口 [dataSource.ts](../app/utils/dataSource.ts) 載入（集中路徑、型別、`baseURL` 前綴與錯誤處理）。資料由離線管線 `scripts/process-xlsx.mjs` 從 `sources/xlsx/*.xlsx` 產生到 `public/data/`。

| 檔案 | 內容 | 載入者 | 說明 |
| --- | --- | --- | --- |
| `public/tw-towns-optimized.json` | 地圖底圖 TopoJSON | [useTaiwanMap.ts](../app/composables/useTaiwanMap.ts) | 以 `topojson-client` 動態解析為鄉鎮／縣市 GeoJSON。 |
| `public/tw-towns-meta.json` | 鄉鎮／縣市 metadata（`towns` / `counties`） | [useGeoMeta.ts](../app/composables/useGeoMeta.ts) | 型別 [GeoMeta](../app/types/geo.ts)；供結果運算、地圖、各 step 共用。 |
| `public/data/order.json` | 縣市／鄉鎮**官方顯示順序**（北→南、本島→離島） | [useGeoMeta.ts](../app/composables/useGeoMeta.ts) | 轉成 `countyRank` / `townRank` 併入 `meta`，是下拉選單與結果清單排序的**唯一依據**（見下方 ⚠️）。 |
| `public/data/index.json` | 篩選指標 manifest（15 筆） | [useFilterData.ts](../app/composables/useFilterData.ts) | 每筆為 [FilterMeta](../app/types/filter.ts)：`id` / `name`（原始名，如「大樓平均單價」）/ `label`（按鈕方向性描述，如「購屋房價更低」）/ `unit` / `lowerIsBetter`。 |
| `public/data/{1..15}.json` | 各指標資料集（鄉鎮代碼 → 數值，缺值 `null`） | [useFilterData.ts](../app/composables/useFilterData.ts) | 型別 [FilterDataset](../app/types/filter.ts)；按需載入並快取（`filterDataCache`），去重（已快取／載入中則略過）。 |
| `public/data/0.json` | 各鄉鎮人口數 | [usePopulation.ts](../app/composables/usePopulation.ts) | 非篩選指標，僅供 step 3 比較卡標題顯示；載入失敗不致命（退回 `null` 不顯示）。 |
| `public/img/...` | 圖示／插圖／pin 等靜態圖 | [useAssets.ts](../app/composables/useAssets.ts) | `img('icon/xxx.svg')` 補上 `APP_ASSETS_PATH` 前綴（dev 為空、正式指向 CDN）。 |

> ⚠️ **排序不可依賴 JS 物件 key 順序**：行政區代碼是整數型字串，`Object.keys` 會被引擎強制以數值升冪重排（帶前導零的金門／連江被擠到最後）。一律用 [utils/sort.ts](../app/utils/sort.ts) 的 `byRank()` 依 `order.json` 排序。

> ⚠️ **`baseURL` 前綴**：`dataSource` 用 Nuxt `app.baseURL`（`public/` 資產服務前綴），**不可**用 `import.meta.env.BASE_URL`（那是 build assets 目錄，會導向 `/_nuxt/*.json` 而 404）。部署於子路徑時尤其重要。

---

## Page：首頁 `/`（[app.vue](../app/app.vue)）

由 `currentStep` 在三個步驟元件間切換（`<Transition name="fade" mode="out-in">`），地圖 [TaiwanMap.vue](../app/components/TaiwanMap.vue) 常駐於底層。app.vue 另負責 SEO／追蹤／JSON-LD（`useSeoMeta` + `useHead(useTracking())` + `useJsonld`，文案自 [meta.json](../app/locales/meta.json)）。

```
使用者進入 → ① 定位現居地 ──下一步──▶ ② 選擇條件 ──查看理想居住地區──▶ ③ 探索結果
                                    ◀── （返回 step 2 目前停用） ──┘
   探索結果任一處點「重新選擇 ↺」→ restart()：清空全部選取 → 回 ①
```

**導覽 / 轉場行為**

| 事件 | 行為 | 程式 |
| --- | --- | --- |
| ①→② 下一步 | `goToStep(2)`；watcher 觸發 `preloadAllFilters()` + `flyToCounty(縣市)` | [app.vue](../app/app.vue) `watch(currentStep)` |
| ②→③ 查看理想居住地區 | `enterResult()`：疊 `loading`（刷暗）視窗 → 900ms 後依結果數切 `result-count` / `empty` | [app.vue](../app/app.vue) `enterResult` |
| ③ 進入時相機 | 有結果 → `focusTown(第一筆)`；無結果 → `flyToTaiwan()` | `watch(currentStep)` step 3 |
| ③ 切換 filter | `watch(selectedFilters)`：疊 `loading`（**不**刷暗）→ 600ms 後 0 筆則 `empty`、有結果則收起 | [app.vue](../app/app.vue) `watch(selectedFilters)` |
| ③ 重新選擇 ↺ | `restart()`：`closeOverlay()` + 清空全部選取 + 回 step 1 | [app.vue](../app/app.vue) `restart` |

> ⚠️ deck.gl v9 會插入 `.deck-widget-container` overlay 蓋在 canvas 上、預設吃掉拖曳／縮放；[app.vue](../app/app.vue) 以全域樣式把它設為 `pointer-events: none`（子元素才 auto）。各 step 的地圖可互動性另由 canvas 的 `--hidden` modifier 控制。

---

### ① 定位現居地 `locate`（[StepLocation.vue](../app/components/01.location/StepLocation.vue)）

一頁式縱向捲動，含兩個 panel：上方主視覺、往下滑露出定位選單，期間**不切換 step**（仍在 step 1）。文案自 [locate.json](../app/locales/locate.json)，view 邏輯在 [StepLocation.logic.ts](../app/components/01.location/StepLocation.logic.ts)。

```
┌───────────────────────────────────────┐
│ 1.1 locate-hero（主視覺影片＋大標）        │
│    2026九合一選舉 / 宜居城市互動地圖        │
│                 ↓ 往下滑 scroll          │
├───────────────────────────────────────┤
│ 1.2 locate-form                        │
│         你現在住在哪裡？                   │
│   ┌────────┐  ┌──────────┐             │
│   │ 縣市  △ │  │ 鄉鎮市區 △│ ←縣市未選前停用 │
│   └────────┘  └──────────┘             │
│          ┌───────────┐                  │
│          │ 下一步 ▶  │ ←未選鄉鎮前停用       │
│          └───────────┘                  │
└───────────────────────────────────────┘
```

| 編號 | 元件 / 區塊 | 狀態 | 功能 | 說明 |
| --- | --- | :--: | --- | --- |
| 1.1 | `locate-hero`（`.lc-sl__visual-layer`） | ✅ | 進場主視覺 | 背景 `<video>`（autoplay/muted/playsinline）**依斷點換片**（`activeVideo` / `activePoster`，resize 跨斷點重載），左下角來源標註；「往下滑」提示鈕呼叫 `reveal()`。 |
| — | 兩段式 reveal（`.lc-sl--revealed`） | ✅ | 主視覺 → 選單 | `revealed` 狀態由滾輪 / 觸控（`onWheel` / `onTouchStart` / `onTouchMove`）或點提示鈕切換；`.lc-sl__block` 依 `centerY` 量測位移置中。非獨立 step。 |
| 1.2 | `locate-form`（`.lc-sl__form`） | ✅ | 定位選單 | 縣市、鄉鎮市區各一個 [SelectDropdown](../app/components/01.location/SelectDropdown.vue) + [UiNextButton](../app/components/ui/NextButton.vue)。選項 `countyOptions` / `townOptions` 依 `order.json` 排序。 |
| — | 選單連動與啟用條件 | ✅ | 依序解鎖 | 鄉鎮下拉在**縣市未選時 `disabled`**；選縣市（`onCountySelect`）會依縣市過濾鄉鎮；下一步在**鄉鎮未選時 `disabled`**。 |

**去向**：下一步 → ② 選擇條件。

---

### ② 選擇條件 `criteria`（[StepCriteria.vue](../app/components/02.criteria/StepCriteria.vue)）

左右兩欄：左為現居地資訊面板、右為條件卡片格。文案自 [criteria.json](../app/locales/criteria.json)，view 邏輯在 [StepCriteria.logic.ts](../app/components/02.criteria/StepCriteria.logic.ts)。

```
   2.1 criteria-stats        2.2 criteria-cards
┌──────────────┬────────────────────────────────┐
│ 〔現居地縮圖〕 │ 請選擇 3 項你最重視的居住條件        │
│ 你現在居住的地區│ ┌────┐┌────┐┌────┐            │
│  新北市汐止區  │ │房價││租金││醫療│ … 指標卡片格     │
│ ───────────  │ └────┘└────┘└────┘            │
│ 房價  51.0萬  │ （點選 toggle，已選 N/3）          │
│ 租金  15000   │ ┌────────────────────────┐     │
│   …（全指標）  │ │ 查看你的理想居住地區 ▶     │←選滿3啟用│
└──────────────┴────────────────────────────────┘
```

| 編號 | 元件 / 區塊 | 狀態 | 功能 | 說明 |
| --- | --- | :--: | --- | --- |
| 2.1 | `criteria-stats`（`.lc-sc__info`） | ✅ | 現居地數據面板 | 頂部小地圖（僅渲染被選鄉鎮輪廓，`selectedTownThumb` 正規化 SVG path 由地圖產出）＋現居地名稱＋**全 15 指標數據**逐項（`statText(f)`）。行動版（<768）改為底部可展開 sheet，location 列當 toggle（`infoOpen`）。 |
| 2.2 | `criteria-cards`（`.lc-sc__cards`） | ✅ | 居住條件卡片格 | 每個 `filterIndex` 一張卡（圖示 + `label` 方向性文字）。點擊 `toggleFilter(id)` 進 `selectedFilters`。 |
| — | 選取上限與啟用條件 | ✅ | 硬性選滿 3 項 | 達上限（`atMax`）後未選卡片加 `--disabled`；`canProceed = selectedFilters.length === 3` 才啟用「查看你的理想居住地區」（[UiNextButton](../app/components/ui/NextButton.vue)）。提示文字 `hintText` 隨已選數更新。 |

**去向**：查看理想居住地區 → ②→③ 轉場 → ③ 探索結果。（設計稿「◀ 返回」step 1 目前未接。）

---

### 2.5 ②→③ 轉場 / Loading（[LoadingOverlay.vue](../app/components/LoadingOverlay.vue)）

由 [app.vue](../app/app.vue) 以計時器編排（`TRANSITION_MS = 900`）。三種變體共用一張置中卡片（白底 + `blur(2px)` + `0.5px #403a2c` 框 + `radius 20px`）；`dim=true` 時整面刷暗＋模糊（`rgb(216 216 216 / 0.5)` + `blur(5px)`）、`dim=false` 時僅浮卡、背景仍可互動。

```
criteria 送出後：
  ① loading（刷暗）──900ms──▶ 依結果數：
       ├─ 有結果 → result-count（刷暗）「全台共有 N 個…」
       └─ 0 筆   → empty（刷暗）「沒有符合條件的地區！」
  ② ✕ 關閉 → explore 正常互動
```

| 編號 | 變體 | 狀態 | 功能 | 說明 |
| --- | --- | :--: | --- | --- |
| 2.5a | `loading` | 🟡 | 載入視窗（刷暗） | 出現時機＋卡片已實作；**放大鏡 + 台灣輪廓 loading 動畫尚未做**（`LoadingOverlay.vue` TODO，目前僅文字「載入中…」）。與 3.6 共用同一變體。 |
| 2.5b | `result-count` | 🟡 | 符合條件視窗 | 「全台共有 **N 個**…」（`count = resultTowns.length`）＋右上 ✕。**地圖縮圖 + pin 視覺尚未做**（TODO）。 |
| 2.5c | `empty` | 🟡 | 無結果視窗 | 紅 ✕ 圓圈 +「沒有符合條件的地區！」+「建議調整你的條件設定」+ 右上 ✕。與 3.7 共用。 |

> 進場動畫（設計稿要求 fade-up 300ms）與豐富視覺（loading 動態、縮圖 pin）為待補項；目前為出現／消失的時序驗證版。

---

### ③ 探索結果 `explore`（[StepResult.vue](../app/components/03.result/StepResult.vue)）

地圖成為主舞台，其上疊多個浮動 panel。view 邏輯與 click-outside 收合在 [StepResult.logic.ts](../app/components/03.result/StepResult.logic.ts)，文案自 [explore.json](../app/locales/explore.json)。

```
  3.1 explore-sidebar     3.2 result-bar        3.5 zoom
┌──────────────┬──┌──────────────┐────────┌──┐┐
│ 重新選擇 ↺     │  │ 共 N 項結果 🔍│         │＋││
│ ☑房價 ☑租金   │  └──────────────┘         │−││
│ ☐醫療 ☑治安   │      〔全台地圖〕          │ⓘ││ 3.3
│  …（全指標）   │    ● ○ ○ 結果黃點         └──┘│ map
│ 〔banner×2〕   │      ◆ 現居地 pin              │
│              │   ◀┌────────────────────┐▶  │
│              │    │新北市 三峽區 人口… 收合│    │
└──────────────┴─── 3.4 explore-compare ──────┘
```

| 編號 | 元件 / 區塊 | 狀態 | 功能 | 說明 |
| --- | --- | :--: | --- | --- |
| 3.1 | `explore-sidebar`（`.lc-sr__sidebar`） | ✅ | 左側篩選欄 | 全 15 指標 checkbox（Reka `CheckboxGroup`，可增減，即時重算結果）＋底部兩條 banner。頂部「重新選擇 ↺」→ `restart()`。行動版改為底部可展開 sheet（Reka `Collapsible`，`asideOpen`）。**設計稿「◀ 返回 step 2」目前註解停用。** |
| 3.2 | `explore-result-bar`（`.lc-sr__list`） | ✅ | 結果清單「共 N 項結果」 | Reka **Collapsible + Listbox**：收合為膠囊（「共 N 項結果 🔍」）、展開為依縣市分組（`resultGroups`）、依 `order.json` 排序的清單（「← 請選擇」）。點清單項 → 選取並飛入。**非**共用 SelectDropdown（見「共用元件」）。 |
| 3.3 | `explore-map`（[TaiwanMap.vue](../app/components/TaiwanMap.vue)） | ✅ | 地圖 + 標點 | 見下方「地圖引擎」。點結果黃點 / 清單項 → 飛入並顯示比較卡。 |
| — | hover tooltip（[MapTooltip.vue](../app/components/MapTooltip.vue)） | ⬜ | 滑過鄉鎮顯示縣市／區名 | 元件已存在，但**目前在 [TaiwanMap.vue](../app/components/TaiwanMap.vue) 內被註解停用**，尚未實際渲染。 |
| 3.4 | `explore-compare`（`.lc-sr__compare-wrap`） | ✅ | 比較 / 詳情浮卡 | 地圖下方可收合浮卡，兩側 **paddle nav（◀ ▶）** 依結果清單順序切換上／下一筆並同步飛入。標題含「縣市 鄉鎮」+ **人口數**（`usePopulation`）。三態 `compareState`：`collapsed`（只剩標題）/ `half`（首個指標）/ `open`（全指標，含 vs 現居的 % 差）。 |
| 3.5 | `explore-zoom`（`.lc-sr__zoom`） | ✅ | 縮放 + ⓘ | 自訂 SVG 圓鈕：＋ / −（`zoomBy`）+ ⓘ（開 info-dialog）。 |
| 3.6 | `explore-reloading` | 🟡 | 切換 filter 的載入呈現 | 每次改 filter 由 app.vue 疊 `loading` 浮卡（**不刷暗**，`RELOAD_MS = 600`）；豐富動畫同 2.5a 為待補。 |
| 3.7 | `explore-empty` | 🟡 | 無結果視窗 | 0 筆時疊 `empty` 浮卡（與 2.5c 共用）。清單內另有 `.lc-sr__list-empty` 內嵌文字 fallback。 |
| 3.8 | `explore-info-dialog` | ✅ | 資料來源 + 製作團隊 | Reka `DialogRoot`，內容由 [InfoContent.vue](../app/components/03.result/InfoContent.vue) 渲染（資料來源逐段 + 底部嵌 [AppFooter.vue](../app/components/AppFooter.vue)）。資料自 [dataSource.json](../app/locales/dataSource.json)。 |

**click-outside 收合**（[useClickOutside.ts](../app/composables/useClickOutside.ts)，於 [StepResult.logic.ts](../app/components/03.result/StepResult.logic.ts) 接線）：三個浮動 panel 點外部即關閉——

- **sidebar**：僅行動版底部 sheet（`asideOpen`）會收合（桌機恆開）。
- **result-bar**：點清單外部收合（點清單項屬內部，維持展開可連續瀏覽）。
- **compare**：點外部收合為 `collapsed`；⚠️ **排除點在結果清單內**（點清單是「切換要比較的鄉鎮」，行動版隱藏 paddle、正靠清單切換，不應收合）。

**去向**：重新選擇 ↺ → ① 定位現居地（`restart()`）。

---

## 地圖引擎（explore-map）

[TaiwanMap.vue](../app/components/TaiwanMap.vue) 為薄殼（掛 `<canvas>`、轉接 props、`defineExpose` 相機 API），引擎邏輯在 [useTaiwanMap.ts](../app/composables/useTaiwanMap.ts)。deck.gl 依賴（`@deck.gl/core`、`@deck.gl/layers`、`topojson-client`）於 `onMounted` 動態 import。

**對外相機 API（`defineExpose`，app.vue 命令式呼叫）**

| 方法 | 作用 | 說明 |
| --- | --- | --- |
| `flyToCounty(countyCode)` | 飛入某縣市 | 依該縣市所有鄉鎮 bbox 置中，zoom 夾 7–12，800ms `FlyToInterpolator`。①→② 時用。 |
| `flyToTaiwan()` | 回全台總覽 | lng 120.9 / lat 23.6 / zoom 7。step 3 無結果時用。 |
| `focusTown(code \| null)` | 飛入單一鄉鎮 | zoom 夾 9–13；`null` 不動作（保持全台視角）。選結果 / paddle 切換時用。 |
| `zoomBy(delta)` | 縮放 | zoom 夾 5–14，**實際幅度為 delta 的一半**（刻意放慢）。 |

**deck.gl 圖層與 step 可見性**

| 圖層 | 類型 | 出現時機 | 說明 |
| --- | --- | --- | --- |
| `towns` | GeoJsonLayer | 全程 | 填色：現居地=淺藍、`selectedResultCode`=藍、其餘=米白。`pickable`；`onClick` 僅對「有黃點（在結果清單內）」的鄉鎮觸發 `update:selectedResultCode`。 |
| `counties` | GeoJsonLayer | 全程 | 僅描邊，不可點。 |
| `result-markers` | ScatterplotLayer | **僅 step 3** | 結果鄉鎮質心黃點（`#F4CC34` + 黑描邊）。 |
| `selected-pin` | IconLayer | **僅 step 3** | 現居地淚滴 pin（`#D62E29`，尖端錨定該鄉鎮；icon 為內聯 data-URI SVG，見 [mapMarkers.ts](../app/utils/mapMarkers.ts)）。 |

- **v-model `townThumb`**：step 2 用的現居鄉鎮正規化 SVG 縮圖，由地圖產出、上傳給 [StepCriteria.vue](../app/components/02.criteria/StepCriteria.vue) 的小地圖。
- **canvas 可見性**：僅 `currentStep === 3` 顯示；非 step 3 時加 `.lc-mv__canvas--hidden`（`opacity:0` + `pointer-events:none` 淡出，非 `display:none`）。
- ⚠️ **flyTo 殘留清除**：使用者拖曳／縮放時 `onViewStateChange` 必須清掉 `transitionDuration/Interpolator/...`，否則每步都被重新動畫而「卡住／彈回」；並每次重設 `padding`。
- ⚠️ **視角水平微調**（`MAP_NUDGE_X`）：桌機／平板右側留白把焦點往左推修正偏右感，手機（<768）歸零，斷點切換以 `matchMedia` 重套。
- **游標**：僅「有黃點」的鄉鎮顯示 `pointer`，其餘 `grab` / 拖曳中 `grabbing`。

---

## 跨步驟共用功能

常駐或跨步驟複用，作用於整個頁面。

| 元件 / 模組 | 功能 | 說明 |
| --- | --- | --- |
| [AppHeader.vue](../app/components/AppHeader.vue) | 頂部固定 Header | 以 `@udn-digital-center/common-components` 組成：頂部進度條 `NmdProgressbar` + `NmdHeader`（含 `NmdHeaderShare` FB/LINE/X 分享 + `NmdHamburger`）+ `NmdMenu`（四個導覽項，自 [common.json](../app/locales/common.json)）。分享區用 `<ClientOnly>` 包（分享網址依 `navigator` 偵測，避免 hydration 不一致）。 |
| [AppFooter.vue](../app/components/AppFooter.vue) | 頁尾 | [InfoEditor](../app/components/InfoEditor.vue)（製作團隊，自 [dataSource.json](../app/locales/dataSource.json)）+ `NmdShare` 分享本頁 + `NmdFooter`（版權／社群）。⚠️ 樣式**非 scoped**（會被 InfoContent 渲染進 Dialog portal），靠 `lc-af` 命名空間隔離。 |
| [InfoContent.vue](../app/components/03.result/InfoContent.vue) | 資料來源 Dialog 內容 | `DialogTitle` / `DialogDescription` + `dataSource.sections` 逐段（含連結／備註）+ 底部嵌 AppFooter。⚠️ 非 scoped（Dialog portal 到 `<body>`）。 |
| [LoadingOverlay.vue](../app/components/LoadingOverlay.vue) | 轉場 / 載入浮動視窗 | 三變體 `loading` / `result-count` / `empty` 共用卡片；`dim` 控制是否刷暗。用於 2.5a/b/c 與 3.6/3.7。 |
| [SelectDropdown.vue](../app/components/01.location/SelectDropdown.vue) | 下拉選單（Reka Select） | **目前僅 `locate-form`（1.2）使用**。支援扁平／分組選項；`v-model:open` 接管開合，配 [useClickOutside](../app/composables/useClickOutside.ts) 點外部關閉。選單 inline（非 portal）渲染以維持接縫圓角。 |
| [NextButton.vue](../app/components/ui/NextButton.vue) | 主要行動按鈕（`<UiNextButton>`） | step 1「下一步」、step 2「查看理想居住地區」共用，`disabled` 由各 step 條件控制。 |
| [useClickOutside.ts](../app/composables/useClickOutside.ts) | click-outside composable | 監聽 `document` capture 階段 `pointerdown`，點在 target 外呼叫 handler；target 可為原生元素或 Reka 元件實例（解析 `$el`）。SSR 安全（`onMounted` 才掛、卸載自動移除）。 |
| [share.ts](../app/utils/share.ts) | 社群分享連結 | `shareURL_fb` / `shareURL_line`（依裝置切換手機／桌機版）/ `shareURL_twitter`，標題描述網址自 [meta.json](../app/locales/meta.json)；`detectMob()` 供 `<ClientOnly>` 判斷。 |
| [utils/sort.ts](../app/utils/sort.ts) | `byRank()` 排序 | 依 `order.json` 的 rank 排序縣市／鄉鎮（無 rank 者排最後）。 |

---

## 待補 / 開放問題

- [ ] **②→③ 轉場動畫**：`transition-loading` 的放大鏡 + 台灣輪廓 loading 動畫、`result-count` 的地圖縮圖 + pin、以及進場 fade-up 300ms（目前為出現時序驗證版，見 [LoadingOverlay.vue](../app/components/LoadingOverlay.vue) TODO）。
- [ ] **hover tooltip（3.3）**：[MapTooltip.vue](../app/components/MapTooltip.vue) 已備但在 [TaiwanMap.vue](../app/components/TaiwanMap.vue) 內註解停用，待接回。
- [ ] **PUSH 轉場遮罩**：設計稿 ②→③ 為 PUSH 疊層，目前為 fade 切換 + 刷暗遮罩。
- [ ] **step 3「◀ 返回 step 2」**：目前註解停用，僅留「重新選擇 ↺」回 step 1；是否恢復待定。
- [ ] **頂部進度指示器**（① ② ③）是否需要。
- [ ] **[useResultTowns.ts](../app/composables/useResultTowns.ts) 缺值診斷**：當**現居地本身**某選定指標缺值時，結果為空清單，與「真的無更佳地區」無法區分——待補提示。
- [x] 步驟②「3 項上限」為**硬性「需選滿 3 項」**（`canProceed = length === 3`）。
- [x] 縣市／鄉鎮排序依據為 **`order.json`（官方北→南序）**。
