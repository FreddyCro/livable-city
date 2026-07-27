# 產品需求文件 PRD — 宜居城市互動地圖

> 2026 九合一選舉 ‧ 聯合報互動專題
> 三步驟流程：**定位現居地 → 選擇條件 → 探索結果**
>
> 以「產品需求」角度整理現行 codebase：流程（mermaid）、UI（wireframe/功能表）與轉場規格（Figma）。狀態：✅ 已實作、🟡 部分、⬜ 待建、⚠️ 注意事項。

## 概述

單一頁面、以 **step 狀態機**驅動的工具型專題。全站只有一個正式頁面（`/`），依 `currentStep: 1 | 2 | 3` 在三個步驟元件間以 **PUSH 轉場**（300ms、右→左）切換，底層疊一張**常駐台灣地圖**（deck.gl）作背景與第三步主舞台。切分原則：**Page → Step → Panel → Component**。

- 正式頁面：`/`（[app.vue](../app/app.vue)；本專案未用 `pages/`，`app.vue` 即根元件並持有所有共享狀態）。
- 三步驟元件：[StepLocation.vue](../app/components/01.location/StepLocation.vue)、[StepCriteria.vue](../app/components/02.criteria/StepCriteria.vue)、[StepResult.vue](../app/components/03.result/StepResult.vue)；常駐地圖 [TaiwanMap.vue](../app/components/TaiwanMap.vue) + [useTaiwanMap.ts](../app/composables/useTaiwanMap.ts)。
- **狀態單一擁有者**：所有選取狀態（`selectedCountyCode` / `selectedTownCode` / `selectedFilters` / `selectedResultCode`）與共享資料（`meta` / `filterIndex` / `filterDataCache` / `population`）都在 [app.vue](../app/app.vue) 建立，props 下傳、emit 上收；步驟元件不自持跨步驟狀態。
- **元件目錄慣例**：三個 step 各一「數字前綴＋語意名」資料夾（`01.location` / `02.criteria` / `03.result`）依流程排序。[nuxt.config.ts](../nuxt.config.ts) 對這三個設 `pathPrefix: false`，故 auto-import 元件名**只取檔名、不含前綴**（`<StepLocation>` / `<SelectDropdown>` 等）；`~/components` 其餘沿用預設前綴（`ui/` → `Ui*`…）。
- **view 邏輯分離**：每個 step 的 view 邏輯抽到 co-located `StepX.logic.ts`（單一元件專用、明確 import、不進 `composables/`）。
- **SSR/CSR 邊界**：所有 `public/` 大型資料（topology、metadata、指標）一律在 **client `onMounted` 後**載入，SSR 階段為 `null`（不阻塞首屏）；呼叫端勿在 setup 同步階段依賴資料。

---

## 資料層（Data Layer）

靜態資料經單一出口 [dataSource.ts](../app/utils/dataSource.ts) 載入（集中路徑、型別、`baseURL` 前綴、錯誤處理）；資料由離線管線 `scripts/process-xlsx.mjs` 從 `sources/xlsx/*.xlsx` 產到 `public/data/`。

| 檔案 | 內容 | 載入者 | 說明 |
| --- | --- | --- | --- |
| `public/tw-towns-optimized.json` | 地圖底圖 TopoJSON | [useTaiwanMap.ts](../app/composables/useTaiwanMap.ts) | 以 `topojson-client` 動態解析為鄉鎮／縣市 GeoJSON。 |
| `public/tw-towns-meta.json` | 鄉鎮／縣市 metadata（`towns` / `counties`） | [useGeoMeta.ts](../app/composables/useGeoMeta.ts) | 型別 [GeoMeta](../app/types/geo.ts)；供結果運算、地圖、各 step 共用。 |
| `public/data/order.json` | 縣市／鄉鎮**官方顯示順序**（北→南、本島→離島） | [useGeoMeta.ts](../app/composables/useGeoMeta.ts) | 轉成 `countyRank` / `townRank` 併入 `meta`，是下拉與結果清單排序的**唯一依據**（見 ⚠️）。 |
| `public/data/index.json` | 篩選指標 manifest（15 筆） | [useFilterData.ts](../app/composables/useFilterData.ts) | 每筆為 [FilterMeta](../app/types/filter.ts)：`id` / `name`（原始名）/ `label`（方向性描述，如「購屋房價更低」）/ `unit` / `lowerIsBetter`。 |
| `public/data/{1..15}.json` | 各指標資料集（鄉鎮代碼 → 數值，缺值 `null`） | [useFilterData.ts](../app/composables/useFilterData.ts) | 型別 [FilterDataset](../app/types/filter.ts)；按需載入並快取（`filterDataCache`），已快取／載入中則略過。 |
| `public/data/0.json` | 各鄉鎮人口數 | [usePopulation.ts](../app/composables/usePopulation.ts) | 非篩選指標，僅供 step 3 比較卡標題；載入失敗退回 `null` 不顯示（不致命）。 |
| `public/img/...` | 圖示／插圖／pin | [useAssets.ts](../app/composables/useAssets.ts) | `img('icon/xxx.svg')` 補 `APP_ASSETS_PATH` 前綴（dev 空、正式指向 CDN）。 |

> ⚠️ **排序不可依賴 JS 物件 key 順序**：行政區代碼是整數型字串，`Object.keys` 會被引擎強制數值升冪重排（帶前導零的金門／連江被擠到最後）。一律用 [utils/sort.ts](../app/utils/sort.ts) 的 `byRank()` 依 `order.json` 排序。

> ⚠️ **`baseURL` 前綴**：`dataSource` 用 Nuxt `app.baseURL`（`public/` 資產前綴），**不可**用 `import.meta.env.BASE_URL`（那是 build assets 目錄，會導向 `/_nuxt/*.json` 而 404）。部署於子路徑時尤其重要。

---

## Page：首頁 `/`（[app.vue](../app/app.vue)）

由 `currentStep` 在三步驟間切換（`<Transition :name="stepTransition">` **方向感知 PUSH**：前進 1→2、2→3 右→左推入，restart 3→1 反向，各 **300ms**，CSS `@keyframes` 驅動以免重繪卡住轉場起始），地圖常駐底層。app.vue 另負責 SEO／追蹤／JSON-LD（`useSeoMeta` + `useHead(useTracking())` + `useJsonld`，文案自 [meta.json](../app/locales/meta.json)）。

```mermaid
flowchart TD
    Start([使用者進入頁面]) --> P11

    subgraph STEP1 ["① 定位現居地 locate"]
        P11["<b>1.1 locate-hero</b><br/>主視覺：大標 + 導言"]
        P11 == 往下滑 scroll ==> P12
        P12["<b>1.2 locate-form</b><br/>你現在住在哪裡？縣市 / 鄉鎮市區"]
        P12 -. 選縣市 .-> P12a["鄉鎮市區下拉解鎖、依縣市過濾"]
        P12a -. 選鄉鎮市區 .-> P12b["「下一步」啟用"]
    end

    P12b -- 點「下一步 ▶」（PUSH） --> P2

    subgraph STEP2 ["② 選擇條件 criteria"]
        P2["<b>2 criteria</b><br/>2.1 criteria-stats（左：現居地數據）<br/>2.2 criteria-cards（右：條件卡片格）"]
        P2 -. 點卡片 toggle .-> P2a["卡片選取/取消（上限 3 項）"]
        P2a -. 選滿 3 項 .-> P2b["「查看你的理想居住地區」啟用"]
    end

    P2b -- 點「查看你的理想居住地區 ▶」（PUSH + loading 浮卡） --> P3

    subgraph STEP3 ["③ 探索結果 explore"]
        P3["<b>3 explore</b><br/>3.1 explore-sidebar｜3.2 explore-result-bar<br/>3.3 explore-map｜3.4 explore-compare｜3.5 explore-zoom"]
        P3 -. 點「共 N 項結果」 .-> P3r["3.2 explore-result-bar 展開<br/>結果清單（Collapsible + Listbox）"]
        P3r -. 選一筆/收合 .-> P3
        P3 -. 點結果項/地圖標點 .-> P3a["3.3→3.4 地圖飛入該地區<br/>explore-compare 顯示（現居 vs 該地區，預設 half）"]
        P3a -. 點「看更多 ∧」 .-> P3a2["explore-compare 展開 open<br/>完整指標比較"]
        P3a2 -. 點「收合 ∨」 .-> P3a
        P3a -. 點 ◀ ▶ paddle .-> P3a3["切換上/下一筆結果<br/>（依 explore-result-bar 順序）"]
        P3a3 -. 同步飛入 .-> P3a
        P3 -. 點 ⓘ（3.5 explore-zoom） .-> P3i["<b>3.8 explore-info-dialog</b><br/>資料來源 + 製作團隊"]
        P3i -. 關閉 .-> P3
        P3 -. 勾選/取消條件（3.1 explore-sidebar） .-> P3b["重算 resultTowns<br/>3.6 explore-reloading：loading 浮卡（不刷暗）"]
        P3b -- 有結果 → 飛入第一筆 --> P3
        P3b -- 0 筆結果 --> P3c["<b>3.7 explore-empty</b><br/>無結果浮卡（紅✕，與 2.5c 共用）"]
        P3c -. 調整條件 .-> P3
    end

    P3 -- 點「重新選擇 ↺」（explore-sidebar；PUSH 反向） --> RESET["restart()：清空全部選取 → 回 ① locate"]
    RESET --> P11
```

> **導覽備註**
> - ①→②、②→③ 為 **PUSH**（300ms、右→左）；restart（3→1）反向。②→③ 另疊 loading → result-count / empty 浮卡（見 §2.5）。
> - step 2「◀ 返回」設計稿有、目前**註解停用**；全域回退是「**重新選擇 ↺**」＝ `restart()`（清空 county/town/filters/result → 回 step 1）。
> - step 2 → step 3 為**硬性條件：需選滿 3 項**（`canProceed = length === 3`）。

**導覽 / 轉場行為**

| 事件 | 行為 | 程式 |
| --- | --- | --- |
| 步驟切換動畫 | 方向感知 **PUSH**（300ms、右→左；restart 反向），CSS `@keyframes`；`stepTransition` 依 `to > from` 設 `push-forward` / `push-back` | [app.vue](../app/app.vue) `watch(currentStep)` + `<Transition>` |
| ①→② 下一步 | `goToStep(2)`；watcher `preloadAllFilters()` + `flyToCounty(縣市)`（**延後 320ms**，避免 deck setProps 卡住轉場；step 2 地圖隱藏看不到）。**桌機（≥1024）** 轉場後三區塊依序 fade-up（見 ② criteria） | `watch(currentStep)` |
| ②→③ 查看理想居住地區 | `enterResult()`：`goToStep(3)`（PUSH 播於下方）+ 疊 `loading`（刷暗）→ 900ms 後依結果數切 `result-count` / `empty`。⚠️ **PUSH 目前播在 loading 遮罩底下**（半透明可見） | `enterResult` |
| ③ 進入時相機 | 有結果 → `focusTown(第一筆)`；無結果 → `flyToTaiwan()`（皆**延後 320ms**，轉場後才飛） | `watch(currentStep)` step 3 |
| ③ 切換 filter | `watch(selectedFilters)`：疊 `loading`（**不**刷暗）→ 600ms 後 0 筆則 `empty`；有結果則收起浮卡並 `focusTown` 飛入**重設後的 active（第一筆）**（比照 resultbar 選取） | `watch(selectedFilters)` |
| ③ 重新選擇 ↺ | `restart()`：`closeOverlay()` + 清空全部選取 + 回 step 1（PUSH 反向） | `restart` |

> ⚠️ deck.gl v9 會在 canvas 父層 `.lc-mv` 加 class `.deck-widget-container` 並吃掉拖曳／縮放；[app.vue](../app/app.vue) 以全域樣式把它設為 `pointer-events: none` 讓拖曳穿透到 canvas。各元素的可互動性由**各自宣告** pointer-events 控制，**不可批次開啟**——見「[pointer-events 分層](#pointer-events-分層各-step-的地圖可互動性)」。

---

### ① 定位現居地 `locate`（[StepLocation.vue](../app/components/01.location/StepLocation.vue)）

一頁式縱向捲動，含兩 panel：上方主視覺、往下滑露出定位選單，期間**不切換 step**。文案 [locate.json](../app/locales/locate.json)、view 邏輯 [StepLocation.logic.ts](../app/components/01.location/StepLocation.logic.ts)。

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
| 1.1 | `locate-hero`（`.lc-sl__visual-layer`） | ✅ | 進場主視覺 | 背景 `<video>`（autoplay/muted/playsinline）**依斷點換片**（`activeVideo` / `activePoster`，resize 跨斷點重載），左下角來源標註；「往下滑」鈕呼叫 `reveal()`。 |
| — | 兩段式 reveal（`.lc-sl--revealed`） | ✅ | 主視覺 → 選單 | `revealed` 由滾輪 / 觸控（`onWheel` / `onTouchStart` / `onTouchMove`）或點提示鈕切換；`.lc-sl__block` 依 `centerY` 量測位移置中。非獨立 step。 |
| 1.2 | `locate-form`（`.lc-sl__form`） | ✅ | 定位選單 | 縣市、鄉鎮市區各一 [SelectDropdown](../app/components/01.location/SelectDropdown.vue) + [UiNextButton](../app/components/ui/NextButton.vue)。`countyOptions` / `townOptions` 依 `order.json` 排序。 |
| — | 選單連動與啟用條件 | ✅ | 依序解鎖 | 鄉鎮下拉在**縣市未選時 `disabled`**；選縣市（`onCountySelect`）依縣市過濾鄉鎮；下一步在**鄉鎮未選時 `disabled`**。 |

**去向**：下一步 → ② 選擇條件。

---

### ② 選擇條件 `criteria`（[StepCriteria.vue](../app/components/02.criteria/StepCriteria.vue)）

左右兩欄：左為現居地資訊面板、右為條件卡片格。文案 [criteria.json](../app/locales/criteria.json)、view 邏輯 [StepCriteria.logic.ts](../app/components/02.criteria/StepCriteria.logic.ts)。

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
| 2.1 | `criteria-stats`（`.lc-sc__info`） | ✅ | 現居地數據面板 | 頂部小地圖（僅渲染被選鄉鎮輪廓，`selectedTownThumb` 正規化 SVG path 由地圖產出）＋現居地名稱＋**全 15 指標數據**逐項（`statText(f)`；數值小數位由 [formatMetric](../app/utils/formatMetric.ts) 統一，與 step 3 比較卡一致）。行動版（<768）改為底部可展開 sheet，location 列當 toggle（`infoOpen`）。 |
| 2.2 | `criteria-cards`（`.lc-sc__cards`） | ✅ | 居住條件卡片格 | 每個 `filterIndex` 一張卡（圖示 + `label` 方向性文字）。點擊 `toggleFilter(id)` 進 `selectedFilters`。 |
| — | 選取上限與啟用條件 | ✅ | 硬性選滿 3 項 | 達上限（`atMax`）後未選卡片加 `--disabled`；`canProceed = length === 3` 才啟用「查看你的理想居住地區」。已選計數以膠囊 `lc-sc__hint-count`（全尺寸通用）顯示、隨已選數更新。 |
| — | 桌機進場動畫 | ✅ | fade-up 依序進場 | **僅桌機（≥1024）**：1→2 PUSH 走完後，① `.lc-sc__info` → ② `.lc-sc__head`+`.lc-sc__cards` → ③ `.lc-sc__submit` 依序 fade-up（各 500ms、間隔 300ms；`@keyframes lc-sc-fadeup`）。pad / 手機不套用。 |

**去向**：查看理想居住地區 → ②→③ 轉場 → ③ 探索結果。（設計稿「◀ 返回」step 1 目前未接。）

---

### 2.5 ②→③ 轉場 / Loading（[LoadingOverlay/](../app/components/LoadingOverlay/)）

由 [app.vue](../app/app.vue) 以計時器編排（`TRANSITION_MS = 900`）。薄殼 [LoadingOverlay.vue](../app/components/LoadingOverlay/LoadingOverlay.vue) 負責 `.lc-lo` 容器 + 遮罩，依 `variant` 切換三個內容子元件（[OverlayLoading](../app/components/LoadingOverlay/OverlayLoading.vue) / [OverlayResultCount](../app/components/LoadingOverlay/OverlayResultCount.vue) / [OverlayEmpty](../app/components/LoadingOverlay/OverlayEmpty.vue)，各持 SVG + 自走 CSS 動畫）。三變體共用一張置中卡片（白底 + `blur(2px)` + `0.5px #403a2c` 框 + `radius 20px`）。`dim`（prop）決定版面：`--dim`（2.5a/b/c）整面刷暗＋模糊（`rgb(216 216 216 / 0.5)` + `blur(5px)`），`--float`（3.6/3.7）不刷暗、僅浮卡且背景可互動。**result-count / empty 點視窗外關閉**（`useClickOutside`）；loading 為過場、無關閉鈕。

```
criteria 送出後：
  ① loading（刷暗）──900ms──▶ 依結果數：
       ├─ 有結果 → result-count（刷暗）「全台共有 N 個…」
       └─ 0 筆   → empty（刷暗）「沒有符合條件的地區！」
  ② ✕ 關閉 → explore 正常互動
```

| 編號 | 變體 | 狀態 | 功能 | 說明 |
| --- | --- | :--: | --- | --- |
| 2.5a | `loading` | ✅ | 載入視窗（刷暗） | 台灣輪廓（`tw.svg` 靜態）+ 放大鏡（`enlarger.svg`）**小範圍公轉**（CSS 自走）+「載入中…」。與 3.6 共用變體。 |
| 2.5b | `result-count` | ✅ | 符合條件視窗 | 折疊地圖（`map.svg`）+ 定位 pin（`map-pin.svg`）**上下浮動** +「全台共有 **N 個**…」（`count = resultTowns.length`）＋右上 ✕。點外關閉。 |
| 2.5c | `empty` | ✅ | 無結果視窗 | **inline SVG「放大鏡 → 圈中紅 X」形變**（圈框放大 + 手柄滑入轉紅 + 斜線畫入，one-shot）+「沒有符合條件的地區！」+「建議調整你的條件設定」+ 右上 ✕。點外關閉。與 3.7 共用。 |

**設計規格（Figma 對應）** — 尺寸為設計稿標註；卡片共用樣式見上。

| 變體 | Figma node | 尺寸 | 內容規格 |
| --- | --- | --- | --- |
| 2.5a loading | [633-16492](https://www.figma.com/design/4n4QX8IuoXVpcDe4yKUnPD/?node-id=633-16492) | 150×200 | 載入 ICON 78×88（放大鏡 + 台灣輪廓）+「載入中……」（18/36 黑） |
| 2.5b result-count | [633-16920](https://www.figma.com/design/4n4QX8IuoXVpcDe4yKUnPD/?node-id=633-16920) | 269×200 | 地圖縮圖 63 + pin 40 +「全台共有 **N 個**…」（18/36，N 粗體）+ 右上 ✕（20px） |
| 2.5c empty | [633-16052](https://www.figma.com/design/4n4QX8IuoXVpcDe4yKUnPD/?node-id=633-16052) | — | 紅 ✕ 圓圈（R01 `#d62e29`）+「沒有符合條件的地區！」（18 粗）+「建議調整你的條件設定」（次要灰）+ 右上 ✕ |

- **遮罩規則**：2.5a / 2.5b（criteria→result 首次轉場）疊全幅遮罩（灰 50% + `blur(5px)`，header 以下）；3.6 / 3.7（filter 切換後）**不刷暗**，僅浮卡。
- ⬜ **浮卡進場 fade-up 300ms 待補**：內部 SVG 動畫已做，但**浮卡本身出現／消失**仍為直接切換（設計稿為 fade + 上移 300ms 進場，並在 2.5a 完成後 fade-up 切 2.5b/2.5c）。

---

### ③ 探索結果 `explore`（[StepResult.vue](../app/components/03.result/StepResult.vue)）

地圖為主舞台，上疊多個浮動 panel。**[StepResult.vue](../app/components/03.result/StepResult.vue) 為 orchestrator**（`.lc-sr` 容器 + 共享狀態 + click-outside 協調），四區塊抽為 co-located 子元件：[ExploreSidebar](../app/components/03.result/ExploreSidebar.vue)（3.1）/ [ExploreResultBar](../app/components/03.result/ExploreResultBar.vue)（3.2）/ [ExploreCompare](../app/components/03.result/ExploreCompare.vue)（3.4）/ [ExploreZoom](../app/components/03.result/ExploreZoom.vue)（3.5，內含 InfoContent）；`IconArrow` / `InfoContent` 亦 co-locate。view 邏輯與 click-outside 在 [StepResult.logic.ts](../app/components/03.result/StepResult.logic.ts)，文案 [explore.json](../app/locales/explore.json)。樣式 `StepResult.scss` 為 **non-scoped 共用**（scoped 無法穿透子元件內部 DOM；見「pointer-events 分層」）。

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
| 3.1 | `explore-sidebar`（`.lc-sr__sidebar`） | ✅ | 左側篩選欄 | 全 15 指標 checkbox（Reka `CheckboxGroup`，即時重算結果）＋底部兩條 banner；頂部「重新選擇 ↺」→ `restart()`。行動版改為底部可展開 sheet（Reka `Collapsible`，`asideOpen`）。改條件後地圖飛入重設後的 active（見 §Page ③ 切換 filter）。**設計稿「◀ 返回 step 2」目前註解停用。** |
| 3.2 | `explore-result-bar`（`.lc-sr__list`） | ✅ | 結果清單「共 N 項結果」 | Reka **Collapsible + Listbox**：收合為膠囊（「共 N 項結果 🔍」）、展開為依縣市分組（`resultGroups`，**0 筆 group 不顯示**）、依 `order.json` 排序（「← 請選擇」）。點清單項 → 選取並飛入。單選**不可取消**（`selection-behavior="replace"`，已選項再點維持選取）。**非**共用 SelectDropdown。 |
| 3.3 | `explore-map`（[TaiwanMap.vue](../app/components/TaiwanMap.vue)） | ✅ | 地圖 + 標點 | 見「地圖引擎」。點結果黃點 / 清單項 → 飛入並顯示比較卡。 |
| — | hover tooltip（[MapTooltip.vue](../app/components/MapTooltip.vue)） | ⬜ | 滑過鄉鎮顯示縣市／區名 | 元件已存在，但**目前在 [TaiwanMap.vue](../app/components/TaiwanMap.vue) 內註解停用**，尚未渲染。 |
| 3.4 | `explore-compare`（`.lc-sr__compare-wrap`） | ✅ | 比較 / 詳情浮卡 | 地圖下方可收合浮卡，兩側 **paddle nav（◀ ▶）** 依結果清單順序切換上／下一筆並同步飛入。標題含「縣市 鄉鎮」+ **人口數**（`usePopulation`）。**兩態 `compareState`：`half`（首個指標，預設）/ `open`（全指標，含 vs 現居的 % 差）；切換鈕在兩態間來回，點外部收合為 `half`。`collapsed`（只剩標題）型別／template 保留但流程不再進入**。數值（target／home 兩排）小數位由 [formatMetric](../app/utils/formatMetric.ts) 的 `formatVal(id, val)` 統一，與 step 2 現居地資訊欄一致。 |
| 3.5 | `explore-zoom`（`.lc-sr__zoom`） | ✅ | 縮放 + ⓘ | 自訂 SVG 圓鈕：＋ / −（`zoomBy`）+ ⓘ（開 info-dialog）。 |
| 3.6 | `explore-reloading` | 🟡 | 切換 filter 的載入呈現 | 改 filter 由 app.vue 疊 `loading` 浮卡（**不刷暗**，`RELOAD_MS = 600`）；豐富動畫同 2.5a 待補。 |
| 3.7 | `explore-empty` | 🟡 | 無結果視窗 | 0 筆時疊 `empty` 浮卡（與 2.5c 共用）。清單內另有 `.lc-sr__list-empty` 內嵌文字 fallback。 |
| 3.8 | `explore-info-dialog` | ✅ | 資料來源 + 製作團隊 | Reka `DialogRoot`，內容由 [InfoContent.vue](../app/components/03.result/InfoContent.vue) 渲染（資料來源逐段 + 底部嵌 [AppFooter.vue](../app/components/AppFooter.vue)）。資料自 [dataSource.json](../app/locales/dataSource.json)。 |

**click-outside 收合**（[useClickOutside.ts](../app/composables/useClickOutside.ts)，於 [StepResult.logic.ts](../app/components/03.result/StepResult.logic.ts) 接線）：

- **sidebar**：僅行動版底部 sheet（`asideOpen`）收合（桌機恆開）。
- **result-bar**：點清單外部收合（點清單項屬內部，維持展開可連續瀏覽）。
- **compare**：點外部收合為 `half`；⚠️ **排除點在結果清單內**（點清單是「切換要比較的鄉鎮」，行動版隱藏 paddle、正靠清單切換，不應收合）。

**去向**：重新選擇 ↺ → ① 定位現居地（`restart()`）。

---

## 地圖引擎（explore-map）

[TaiwanMap.vue](../app/components/TaiwanMap.vue) 為薄殼（掛 `<canvas>`、轉接 props、`defineExpose` 相機 API），引擎邏輯在 [useTaiwanMap.ts](../app/composables/useTaiwanMap.ts)。deck.gl 依賴（`@deck.gl/core`、`@deck.gl/layers`、`topojson-client`）與 `polylabel`（pin 落點，見 ⚠️）於 `onMounted` 動態 import。

**對外相機 API（`defineExpose`，app.vue 命令式呼叫）**

| 方法 | 作用 | 說明 |
| --- | --- | --- |
| `flyToCounty(countyCode)` | 飛入某縣市 | 依該縣市所有鄉鎮 bbox 置中，zoom 夾 7–12，800ms `FlyToInterpolator`。①→② 用。 |
| `flyToTaiwan()` | 回全台總覽 | lng 120.9 / lat 23.6 / zoom 7。step 3 無結果時用。 |
| `focusTown(code \| null)` | 飛入單一鄉鎮 | zoom 夾 9–13；`null` 不動作（保持全台視角）。選結果 / paddle 切換 / 改 filter 後飛入 active 時用。 |
| `zoomBy(delta)` | 縮放 | zoom 夾 5–14，**實際幅度為 delta 的一半**（刻意放慢）。 |

**deck.gl 圖層與 step 可見性**

| 圖層 | 類型 | 出現時機 | 說明 |
| --- | --- | --- | --- |
| `towns` | GeoJsonLayer | 全程 | 填色：現居地=淺藍、`selectedResultCode`=藍、其餘=米白。`pickable`；`onClick` 僅對「有黃點（在結果清單內）」的鄉鎮觸發 `update:selectedResultCode`。 |
| `counties` | GeoJsonLayer | 全程 | 僅描邊，不可點。 |
| `result-markers` | ScatterplotLayer | **僅 step 3** | 結果鄉鎮黃點（`#F4CC34` + 黑描邊）。落點為 pole of inaccessibility（共用 `townPinPoints`，見 ⚠️），保證在區界內。 |
| `selected-pin` | IconLayer | **僅 step 3** | 現居地淚滴 pin（`#D62E29`，尖端錨定該鄉鎮；落點同 `result-markers`；icon 為內聯 data-URI SVG，見 [mapMarkers.ts](../app/utils/mapMarkers.ts)）。 |

- **v-model `townThumb`**：step 2 用的現居鄉鎮正規化 SVG 縮圖，由地圖產出、上傳給 [StepCriteria.vue](../app/components/02.criteria/StepCriteria.vue) 的小地圖。
- **canvas 可見性**：僅 `currentStep === 3` 顯示；非 step 3 加 `.lc-mv__canvas--hidden`（`opacity:0` + `pointer-events:none` 淡出，非 `display:none`）。
- ⚠️ **flyTo 殘留清除**：拖曳／縮放時 `onViewStateChange` 必須清掉 `transitionDuration/Interpolator/...`，否則每步都被重新動畫而「卡住／彈回」；並每次重設 `padding`。
- ⚠️ **視角水平微調**（`MAP_NUDGE_X`）：桌機／平板右側留白把焦點往左推修正偏右感，手機（<768）歸零，斷點切換以 `matchMedia` 重套。
- ⚠️ **pin 落點用 pole of inaccessibility**（`polylabel`；`useTaiwanMap.ts` 的 `labelPoint`，mount 時預算成 `townPinPoints`，黃點與現居 pin 共用）：早期用 **bbox 中心**（≈質心），在**凹形／彎月形沿海區**（蘇澳、番路、南化、貢寮）與**離島 MultiPolygon**（馬公、南竿）會落到區界**外**（實測 368 區中 19 區出包）。改取多邊形內離邊界最遠的點（MultiPolygon 取最大塊），保證落在區內；極端情況 fallback 回 bbox 中心。`precision` 依 bbox 大小縮放（約數十公尺）。
- **游標**：僅「有黃點」的鄉鎮顯示 `pointer`，其餘 `grab` / 拖曳中 `grabbing`。

---

## pointer-events 分層（各 step 的地圖可互動性）

地圖常駐底層、step 面板疊其上，可互動性完全靠 `pointer-events` 分層。兩個前提：

1. deck.gl v9 在 canvas 父層 `.lc-mv` 加 class `.deck-widget-container`，[app.vue](../app/app.vue) 全域樣式設為 `pointer-events: none`（讓拖曳穿透到 canvas）。
2. **`pointer-events` 可繼承**：`.lc-mv` 的直接子層（canvas、各 step 面板、overlay）若不自行宣告，會**繼承 `none`** 而不可互動。

**⇒ 核心原則：每個直接子層各自宣告 pointer-events，不可依賴父層或「一次開啟全部子層」的批次規則。**

**狀態表（pointer-events 不隨 RWD 斷點改變；斷點只改 layout 位置/尺寸）**

| 元素 | ① locate | ② criteria | ③ explore | 宣告位置 |
| --- | :--: | :--: | :--: | --- |
| `.lc-mv`（deck 容器） | none | none | none | deck.gl runtime + [app.vue](../app/app.vue) 全域樣式 |
| `.lc-mv__canvas`（地圖） | none（`--hidden`） | none（`--hidden`） | **auto** | [TaiwanMap.vue](../app/components/TaiwanMap.vue)（覆寫 base 的 `canvas{none}`） |
| `.lc-sl`（step1 面板） | **auto** | — | — | [StepLocation.scss](../app/components/01.location/StepLocation.scss) root |
| `.lc-sc`（step2 面板） | — | **auto** | — | [StepCriteria.scss](../app/components/02.criteria/StepCriteria.scss) root |
| `.lc-sr`（step3 容器） | — | — | **none** | [StepResult.scss](../app/components/03.result/StepResult.scss) root（縫隙讓地圖可拖曳） |
| `.lc-sr__sidebar/list/compare/zoom` | — | — | **auto** | StepResult.scss（各浮動面板自行 re-enable） |
| `.lc-lo`（overlay 殼） | none | none | none | [LoadingOverlay.vue](../app/components/LoadingOverlay/LoadingOverlay.vue)（`--dim` 遮罩、`__frame` 卡片自行 `auto`） |

- **整頁面板（locate / criteria）** = `auto`：整片互動、覆蓋地圖（step 1/2 canvas `--hidden` 不互動）。
- **explore 容器 `.lc-sr`** = `none`：pass-through，讓地圖在面板縫隙可拖曳；其內各浮動面板各自 `auto`。
- **canvas** 僅 step 3 `auto`（含手機觸控拖曳）；step 1/2 `--hidden` → `none`；覆寫 base.scss 全域 `canvas { pointer-events: none }`。

> ⚠️ **不要用 `.deck-widget-container > * { pointer-events: auto }` 之類「批次開啟所有子層」的規則**。`.lc-sr` / `.lc-lo` 是刻意 pass-through 的全螢幕容器（`inset:0` 蓋在地圖上），被批次設 `auto` 會整片吞掉地圖拖曳（**手機曾因此完全無法拖曳地圖**）。現改為「canvas 與各 step 面板各自宣告」。
>
> ⚠️ scoped 樣式特異性較高（`.lc-sr[data-v]` = 0,2,0）。若把某 step 樣式從 `scoped` 改 non-scoped，`.lc-sr{none}` 特異性降到 0,1,0，可能輸給同分規則而失效——改 scoped 狀態時務必複驗 pointer-events。

---

## 跨步驟共用功能

| 元件 / 模組 | 功能 | 說明 |
| --- | --- | --- |
| [AppHeader.vue](../app/components/AppHeader.vue) | 頂部固定 Header | 以 `@udn-digital-center/common-components` 組成：進度條 `NmdProgressbar` + `NmdHeader`（含 `NmdHeaderShare` FB/LINE/X + `NmdHamburger`）+ `NmdMenu`（四導覽項，自 [common.json](../app/locales/common.json)）。分享區用 `<ClientOnly>` 包（分享網址依 `navigator` 偵測，避免 hydration 不一致）。 |
| [AppFooter.vue](../app/components/AppFooter.vue) | 頁尾 | [InfoEditor](../app/components/InfoEditor.vue)（製作團隊，自 [dataSource.json](../app/locales/dataSource.json)）+ `NmdShare` + `NmdFooter`。⚠️ 樣式**非 scoped**（會被 InfoContent 渲染進 Dialog portal），靠 `lc-af` 命名空間隔離。 |
| [InfoContent.vue](../app/components/03.result/InfoContent.vue) | 資料來源 Dialog 內容 | `DialogTitle` / `DialogDescription` + `dataSource.sections` 逐段 + 底部嵌 AppFooter。⚠️ 非 scoped（Dialog portal 到 `<body>`）。 |
| [LoadingOverlay/](../app/components/LoadingOverlay/) | 轉場 / 載入浮動視窗 | 薄殼 + 三變體子元件（`OverlayLoading` / `OverlayResultCount` 外部 SVG / `OverlayEmpty` inline SVG 形變），皆自走 CSS 動畫。`dim` 控制刷暗；result-count / empty 點外部關閉。用於 2.5a/b/c 與 3.6/3.7。 |
| [SelectDropdown.vue](../app/components/01.location/SelectDropdown.vue) | 下拉選單（Reka Select） | **目前僅 `locate-form`（1.2）使用**。支援扁平／分組；`v-model:open` 接管開合，配 [useClickOutside](../app/composables/useClickOutside.ts) 點外部關閉。inline（非 portal）渲染以維持接縫圓角。 |
| [NextButton.vue](../app/components/ui/NextButton.vue) | 主要行動按鈕（`<UiNextButton>`） | step 1「下一步」、step 2「查看理想居住地區」共用，`disabled` 由各 step 條件控制。 |
| [useClickOutside.ts](../app/composables/useClickOutside.ts) | click-outside composable | 監聽 `document` capture 階段 `pointerdown`，點在 target 外呼叫 handler；target 可為原生元素或 Reka 元件實例（解析 `$el`）。SSR 安全（`onMounted` 才掛、卸載自動移除）。 |
| [share.ts](../app/utils/share.ts) | 社群分享連結 | `shareURL_fb` / `shareURL_line`（依裝置切手機／桌機版）/ `shareURL_twitter`，文案網址自 [meta.json](../app/locales/meta.json)；`detectMob()` 供 `<ClientOnly>` 判斷。 |
| [utils/sort.ts](../app/utils/sort.ts) | `byRank()` 排序 | 依 `order.json` rank 排序縣市／鄉鎮（無 rank 者排最後）。 |
| [utils/formatMetric.ts](../app/utils/formatMetric.ts) | 指標數值顯示格式化 | `formatMetricNumber(id, val)`：step 2 現居地資訊欄（`statText`）與 step 3 比較卡（`formatVal`）**共用**，確保同一指標兩處小數位一致。PM 指定固定小數位者**補零**：`3` 醫療院所平均每家服務人數→**0 位**、`4` 癌症發生率→**1 位**、`8` 每萬名老人…關懷據點數→**2 位**、`13` 餐飲及住宿店家密度→**2 位**；未列入的指標維持原始精度（raw `toLocaleString`）。屬**顯示層**設定，**不寫進 index.json**（那由 `process-xlsx` 產生、手改會被覆蓋）。 |

---

## 待補 / 開放問題

- [ ] **Loading 浮卡進場 fade-up 300ms**：三個彈窗**本身出現**時的 fade-up 尚未做（目前直接出現／消失；內部 SVG 動畫已做）。
- [ ] **hover tooltip（3.3）**：[MapTooltip.vue](../app/components/MapTooltip.vue) 已備但在 [TaiwanMap.vue](../app/components/TaiwanMap.vue) 內註解停用，待接回。
- [ ] **②→③ PUSH 與 loading 遮罩的關係**：PUSH 已實作，但目前播在 loading 刷暗遮罩底下（半透明可見）；若要 PUSH 完整露出，需調整 `enterResult` 的遮罩時機（待定）。
- [ ] **step 3「◀ 返回 step 2」**：目前註解停用，僅留「重新選擇 ↺」回 step 1；是否恢復待定。
- [ ] **頂部進度指示器**（① ② ③）是否需要。
- [ ] **[useResultTowns.ts](../app/composables/useResultTowns.ts) 缺值診斷**：當**現居地本身**某選定指標缺值時，結果為空清單，與「真的無更佳地區」無法區分——待補提示。
