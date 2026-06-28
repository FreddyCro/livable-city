# 宜居城市互動地圖 — Wireflow

> 2026 九合一選舉 ‧ 聯合報互動專題
> 三步驟流程：**定位現居地 → 選擇條件 → 探索結果**
>
> 註：本文同時記錄「設計稿（Figma）規劃」與「目前 codebase 實作狀態」。狀態欄 ✅=已建、🟡=部分、⬜=待建。

---

## 1. 步驟命名定案

| # | 內部代號 | 中文步驟名 | 對應元件 | 一句話任務 |
|---|----------|-----------|----------|-----------|
| 1 | `locate`   | **定位現居地** | [StepLocation.vue](../app/components/StepLocation/StepLocation.vue) | 主視覺進場 → 往下滑 → 告訴我你現在住哪（縣市＋鄉鎮市區） |
| 2 | `criteria` | **選擇條件**   | [StepCriteria.vue](../app/components/StepCriteria/StepCriteria.vue) | 挑你最在意的居住指標（需選滿 3 項） |
| 3 | `explore`  | **探索結果**   | [StepResult.vue](../app/components/StepResult/StepResult.vue) | 看地圖、比較、微調篩選 |

- 進度指示／標題列統一使用「中文步驟名」。
- 程式內 step state 仍為 `currentStep: 1 | 2 | 3`，內部代號用於文件與日後重構對照。
- **`hero`（主視覺）非獨立步驟**：它是 `locate` 的進入區，使用者往下捲動即露出定位選單，期間不切換 step、仍停留在 step 1。
- 三個 step 元件已改為**資料夾結構**（`StepX/StepX.vue` + `StepX.scss` + `StepX.logic.ts`），view 邏輯抽到 co-located 的 `*.logic.ts`（單一元件專用，明確 import）。

---

## 1b. Panel 命名總表

每個 panel 一個英文代號，前綴所屬步驟名（`locate-` / `criteria-` / `transition-` / `explore-`），編號對應 §2 流程節點。class 名採 BEM＋`lc-` 前綴（`lc-sl`=step-location、`lc-sc`=step-criteria、`lc-sr`=step-result）。

| 編號 | Panel 代號 | 中文 | 步驟 | 狀態 | codebase 對應 |
|------|-----------|------|------|:----:|---------------|
| 1.1 | `locate-hero`          | 主視覺（大標 + 導言）   | locate | ✅ | StepLocation `.lc-sl__visual-layer`（兩段式 reveal，往下滑切到 form-layer） |
| 1.2 | `locate-form`          | 定位選單（縣市/鄉鎮 + 下一步） | locate | ✅ | StepLocation `.lc-sl__form-layer`（`.lc-sl__selects` 內含 `UiSelectDropdown` ×2）+ `.lc-sl__next` |
| 2.1 | `criteria-stats`       | 現居地數據面板         | criteria | ✅ | StepCriteria `.lc-sc__info`（`.lc-sc__stats` 逐項列 `filterIndex`） |
| 2.2 | `criteria-cards`       | 居住條件卡片格         | criteria | ✅ | StepCriteria `.lc-sc__cards` / `.lc-sc__card`（圖示 + 動作語句 label） |
| 2.5a | `transition-loading`      | 載入視窗（放大鏡 +「載入中…」） | 轉場 | ⬜ | _未建_（`public/nmd-loading.*` 資產已備；規格見 §2.5。**與 3.6 共用視窗**） |
| 2.5b | `transition-result-count` | 符合條件視窗（「全台共有 N 個…」） | 轉場 | ⬜ | _未建_（規格見 §2.5） |
| 2.5c | `transition-empty`        | 無結果視窗（首次載入後 0 筆） | 轉場 | ⬜ | _未建_（規格見 §2.5。**與 3.7 共用視窗**） |
| 3.1 | `explore-sidebar`      | 左側篩選欄            | explore | ✅ | StepResult `.lc-sr__sidebar`（`.lc-sr__cards` checkbox + `.lc-sr__banners`；**返回鈕目前註解停用**） |
| 3.2 | `explore-result-bar`   | 結果數／清單「共 N 項結果」 | explore | ✅ | StepResult `.lc-sr__list`（**Reka Collapsible + Listbox**，浮於地圖；收合為膠囊、展開為清單。**已不再用 select-dropdown**） |
| 3.3 | `explore-map`          | 地圖 + 標點          | explore | ✅ | [TaiwanMap.vue](../app/components/TaiwanMap.vue) deck.gl 圖層 `towns`/`counties`/結果標點/現居 pin |
| 3.4 | `explore-compare`      | 比較／詳情浮卡         | explore | ✅ | StepResult `.lc-sr__compare-wrap`（浮於地圖右下、可收合、左右 **paddle nav**、標題含**人口**） |
| 3.5 | `explore-zoom`         | 地圖縮放（＋／−）+ ⓘ | explore | ✅ | StepResult `.lc-sr__zoom`（自訂 SVG ＋/−/ⓘ 圓鈕；ⓘ 開 info-dialog） |
| 3.6 | `explore-reloading`    | 重新篩選 loading（地圖中央浮「載入視窗」，不刷暗） | explore | ⬜ | `watchEffect` 重算 `resultTowns`（**目前無 loading UI**；規格見 §2.5「載入視窗」＋ §3.6） |
| 3.7 | `explore-empty`        | 無結果視窗（紅 ✕ +「沒有符合條件的地區！」） | explore | 🟡 | StepResult `.lc-sr__list-empty` 內嵌文字（`str.noResult`；**待升級為浮動視窗**，與 2.5c 共用，規格見 §2.5） |
| 3.8 | `explore-info-dialog`  | 資料來源 + 製作團隊（由 ⓘ 開啟） | explore | ✅ | StepResult `DialogRoot` + [InfoContent.vue](../app/components/InfoContent.vue)（內含 [AppFooter.vue](../app/components/AppFooter.vue) → 製作團隊 / 分享 / 版權） |

**共用元件**

- `UiSelectDropdown`（[ui/SelectDropdown.vue](../app/components/ui/SelectDropdown.vue)）：下拉選單，**目前僅 `locate-form`（1.2）使用**。`explore-result-bar`（3.2）已改用 Reka Collapsible + Listbox，不再共用此元件。

---

## 1c. 縣市／鄉鎮排序依據（重要）

下拉選單（`locate-form`）與結果清單（`explore-result-bar` / `explore-compare`）裡，**縣市與鄉鎮的順序唯一依據 `public/data/order.json`**：

- `order.json` 由資料管線（`scripts/process-xlsx.mjs`）從「**0. 各鄉鎮市區人口數**」的列序產生 —— 即官方**北→南、本島→離島**順序（台北→新北→…→澎湖→金門→連江）。
- [useGeoMeta.ts](../app/composables/useGeoMeta.ts) 載入時把它轉成 `countyRank` / `townRank` 併入 `meta`；元件用 [utils/sort.ts](../app/utils/sort.ts) 的 `byRank()` 排序。
- **不可依賴 JS 物件 key 順序**：行政區代碼是整數型字串，`Object.keys` 會被引擎強制以數值升冪重排（且帶前導零的金門/連江會被擠到最後）。詳見 [gotchas](./map/gotchas.md)。

> 資料管線：`process-xlsx.mjs`（`sources/xlsx/*.xlsx` → `public/data/{id}.json` + `index.json` + `order.json`）、`validate-sources.mjs`（把關鄉鎮名稱比對／覆蓋率，有錯 exit 1）、共用邏輯在 `scripts/lib/sources.mjs`。

---

## 2. 流程總覽（Wireflow）

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

    P12b -- 點「下一步 ▶」 --> P2

    subgraph STEP2 ["② 選擇條件 criteria"]
        P2["<b>2 criteria</b><br/>2.1 criteria-stats（左：現居地數據）<br/>2.2 criteria-cards（右：條件卡片格）"]
        P2 -. 點卡片 toggle .-> P2a["卡片選取/取消（上限 3 項）"]
        P2a -. 選滿 3 項 .-> P2b["「查看你的理想居住地區」啟用"]
    end

    P2b -- 點「查看你的理想居住地區 ▶」 --> P3
    P2 -- 點「◀ 返回」 --> P12

    subgraph STEP3 ["③ 探索結果 explore"]
        P3["<b>3 explore</b><br/>3.1 explore-sidebar｜3.2 explore-result-bar<br/>3.3 explore-map｜3.4 explore-compare｜3.5 explore-zoom"]
        P3 -. 點「共 N 項結果」 .-> P3r["3.2 explore-result-bar 展開<br/>結果清單（Collapsible + Listbox）"]
        P3r -. 選一筆/收合 .-> P3
        P3 -. 點結果項/地圖標點 .-> P3a["3.3→3.4 地圖飛入該地區<br/>explore-compare 顯示（現居 vs 該地區）"]
        P3a -. 點「展開 ∧」 .-> P3a2["explore-compare 展開<br/>完整指標比較"]
        P3a2 -. 點「收合 ∨」 .-> P3a
        P3a -. 點 ◀ ▶ paddle .-> P3a3["切換上/下一筆結果<br/>（依 explore-result-bar 順序）"]
        P3a3 -. 同步飛入 .-> P3a
        P3 -. 點 ⓘ（3.5 explore-zoom） .-> P3i["<b>3.8 explore-info-dialog</b><br/>資料來源 + 製作團隊"]
        P3i -. 關閉 .-> P3
        P3 -. 勾選/取消條件（3.1 explore-sidebar） .-> P3b["重算 resultTowns<br/>3.6 explore-reloading：地圖中央浮「載入視窗」"]
        P3b -- 有結果 --> P3
        P3b -- 0 筆結果 --> P3c["<b>3.7 explore-empty</b><br/>浮「無結果視窗」（紅✕，與 2.5c 共用）"]
        P3c -. 調整條件 .-> P3
    end

    P3 -- 點「重新選擇 ↺」(explore-sidebar) --> RESET["restart()：清空全部選取 → 回 ① locate"]
    RESET --> P12
```

> **導覽變動（vs 設計稿）**
> - ②→③ 目前**直接 fade 切換**，尚未實作 2.5 轉場/loading（PUSH + `transition-loading` 2.5a + `transition-result-count` 2.5b，規格見 §2.5）。
> - step 3「◀ 返回 step 2」按鈕目前**註解停用**；現存的全域導覽是「**重新選擇 ↺**」＝ `restart()`（清空 county/town/filters/result → 回 step 1）。
> - step 2 進入 step 3 為**硬性條件：需選滿 3 項**（見 §4）。

---

## 3. 各步驟畫面與互動

### 全域（所有步驟共用）

- 頁首 [AppHeader.vue](../app/components/AppHeader.vue)：聯合報 LOGO ‧「訂閱數位版」‧ 分享鍵 ‧ 選單鍵
- 地圖畫布常駐背景，僅步驟 ① / ② 不可互動（canvas `pointer-events` 切換）
- 步驟切換使用 fade 轉場（`Transition name="fade"`）
- SEO / 追蹤 / JSON-LD 集中於 [app.vue](../app/app.vue)（`useSeoMeta` + `useHead(useTracking())` + `useHead({link,script})` + `useJsonld`；追蹤碼於 `app/assets/js/tracking.js`）

### ① 定位現居地 `locate`

此步驟是一頁式縱向捲動，含兩個 panel：上方 `locate-hero` 主視覺，往下滑進入 `locate-form` 定位選單。期間不切換 step。

```
┌───────────────────────────────────────────────┐
│  1.1 locate-hero（主視覺）                        │
│  2026九合一選舉                                  │
│  宜居城市互動地圖                                 │
│                    ↓ 往下滑 scroll               │
├───────────────────────────────────────────────┤
│  1.2 locate-form                                │
│            你現在住在哪裡？                        │
│      ┌──────────┐   ┌──────────┐               │
│      │ 縣市    △ │   │ 鄉鎮市區 △ │   ← 縣市未選前停用 │
│      └──────────┘   └──────────┘               │
│            ┌───────────────┐                    │
│            │   下一步  ▶    │  ← 未選鄉鎮市區前停用   │
│            └───────────────┘                    │
└───────────────────────────────────────────────┘
```

- **`locate-hero`**：兩段式 reveal（`revealed` 狀態，滾輪/觸控切換），主視覺 → 定位選單；非獨立 step。
- **`locate-form`**：縣市（必選）、鄉鎮市區（依縣市過濾，必選）+ 下一步。選單順序依 `order.json`（§1c）。
- **狀態**：鄉鎮市區下拉在縣市未選時 `disabled`；下一步在鄉鎮市區未選時 `disabled`。
- **去向**：下一步 → ② 選擇條件。

### ② 選擇條件 `criteria`

```
   2.1 criteria-stats        2.2 criteria-cards
┌──────────────┬────────────────────────────────┐
│ 〔現居地縮圖〕 │  與現在居住的地區相比，           │
│ 你現在居住的地區│  你希望搬到……的地區              │
│  新北市汐止區  │  請選擇 3 項你最重視的居住條件      │
│ ─────────── │  ┌────┐┌────┐┌────┐            │
│ 房價  51.0萬 │  │房價 ││租金 ││醫療 │ … 指標卡片格  │
│ 租金  15000  │  └────┘└────┘└────┘            │
│   …          │  （點選 toggle，已選 N/3）          │
│              │  ┌────────────────────────┐     │
│              │  │ 查看你的理想居住地區 ▶    │ ←選滿 │
│              │  └────────────────────────┘ 3項啟用│
└──────────────┴────────────────────────────────┘
```

- **`criteria-stats`（左）**：現居地名稱 + 全指標數據（`filterIndex` 逐項）。
- **`criteria-cards`（右）**：指標卡片格，點擊 toggle 進 `selectedFilters`（上限 3 項，達上限後未選項 `--disabled`）。
- **進入條件**：**需選滿 3 項**（`canProceed = selectedFilters.length === 3`）才啟用「查看你的理想居住地區」。
- **去向**：查看理想居住地區 → ③ 探索結果。（設計稿的「◀ 返回」目前未接；step 2 無返回 step 1 的鈕。）

### 2.5 ②→③ 轉場 / Loading（⬜ 待建）

設計稿規劃 criteria 點「查看你的理想居住地區」後，以 **PUSH 轉場** 疊一層遮罩 + 兩段式載入視窗，計算完成才進入 explore。**目前未實作**：②→③ 直接 fade 切換（step 3 進入時 `flyToTaiwan()` + `preloadAllFilters()`）。`public/nmd-loading.*` 資產已備，待組成轉場元件。

**共用：背景遮罩（dim + blur）**

- 僅 **2.5a / 2.5b**（criteria→result 首次轉場）疊全幅遮罩：explore 已在底層 render，其上覆蓋半透明灰 + 模糊 `background: rgb(216 216 216 / 0.5)`、`backdrop-filter: blur(5px)`（header 以下整個 stage）。＝需求所述「背景模糊刷暗」。
- **3.6 / 3.7（filter 切換後的 reloading / 無結果）不刷暗**：sidebar、地圖、result-bar、compare 皆保持可見，僅地圖中央浮一個視窗。

**共用：三種浮動視窗（共同卡片樣式）**

白底、自身帶 `backdrop-filter: blur(2px)`、`border: 0.5px solid #403a2c`（主線條 `--c-line-main`）、`border-radius: 20px`、`padding: 30px 40px`、置中（flex column / center / `gap: 5px`）。內容三選一：

| 視窗 | 內容 | 用於 |
|------|------|------|
| **載入視窗** | 放大鏡 + 台灣輪廓 loading 動畫 +「載入中......」 | 2.5a（首次，刷暗）、**3.6**（filter 切換，不刷暗） |
| **結果數視窗** | 地圖縮圖 + pin +「全台共有 **N 個**…」 | 2.5b |
| **無結果視窗** | 紅 ✕ 圓圈 +「沒有符合條件的地區！」+「建議調整你的條件設定」+ 右上 ✕ | **2.5c**（首次載入後無結果）、**3.7**（filter 切換後無結果） |

**2.5a `transition-loading`「載入視窗」**（Figma [633-16492](https://www.figma.com/design/4n4QX8IuoXVpcDe4yKUnPD/?node-id=633-16492)）

- 視窗 150×200。
- 內容：載入 ICON 78×88（放大鏡 + 台灣輪廓，loading 動畫；資產 `public/nmd-loading.*`）＋文字「載入中......」（18px / line-height 36 / 黑）。
- 進場動畫：**fade + 向上位移（fade-up），300ms**。＝需求所述「動畫 300ms fade up 載入視窗」。

**2.5b `transition-result-count`「符合條件視窗」**（Figma [633-16920](https://www.figma.com/design/4n4QX8IuoXVpcDe4yKUnPD/?node-id=633-16920)）

- 視窗 269×200，右上角 ✕ 關閉鈕（20px）。
- 內容：地圖縮圖 + 定位 pin（map 63 + pin 40）＋文字「全台共有 **N 個** 地區符合你的理想居住條件！」（18px / 36；「N 個」粗體，N = `resultTowns.length`）。
- 換場動畫：載入完成、**且有結果**時，由 2.5a **fade-up** 接續切換為本視窗（符合結果視窗）。＝需求所述「loading 2 fade up 符合結果視窗」。
- 去向：✕ 關閉 / 自動 → 進入 explore 正常互動。

**2.5c `transition-empty`「無結果視窗」**（與 §3.7 explore-empty 共用樣式，Figma [633-16052](https://www.figma.com/design/4n4QX8IuoXVpcDe4yKUnPD/?node-id=633-16052)）

- 情境：2.5a 載入結束後若 `resultTowns.length === 0`，**不進 2.5b**，改 fade-up 顯示無結果視窗。
- 內容：紅 ✕ 圓圈圖示（R01 `#d62e29`）+「沒有符合條件的地區！」（18px 粗體）+「建議調整你的條件設定」（次要灰字）+ 右上 ✕ 關閉鈕。
- 去向：✕ 關閉 → 進入 explore（空結果，由 §3.7 接手）讓使用者於 sidebar 調整條件。

```
時序（criteria 送出後）
  ① PUSH：背景（explore）刷暗 + 模糊（灰 50% + blur 5px）
  ② 2.5a 載入視窗  ── fade-up 300ms 進場（計算 / preloadAllFilters 期間顯示）
  ③ 計算完成
       ├─ 有結果 → ④a 2.5b 結果數視窗 ── fade-up（「全台共有 N 個…」）
       └─ 0 筆   → ④b 2.5c 無結果視窗 ── fade-up（「沒有符合條件的地區！」）
  ⑤ ✕ 關閉 / 自動 → explore 正常互動
```

### ③ 探索結果 `explore`

五大 panel：`explore-sidebar`（左控制欄）、`explore-result-bar`（結果清單）、`explore-map`（地圖）、`explore-compare`（比較浮卡）、`explore-zoom`（縮放控制）。

```
  3.1 explore-sidebar      3.2 result-bar         3.5 zoom
┌──────────────┬───┌──────────────┐──────────┌──┐─┐
│ 重新選擇 ↺     │   │ 共 N 項結果  🔍│           │＋││
│ 條件          │   └──────────────┘           │−││ 3.3
│ ☑房價 ☑租金   │         〔全台地圖〕            │ⓘ││ explore
│ ☐醫療 ☑治安   │      ● ○ ○ 結果標點           └──┘│ -map
│  …（全指標）   │        ◆ 現居地 pin                │
│ 〔banner×2〕   │        ┌──────────────────────┐  │
│              │     ◀ │ 新北市 三峽區 人口…  收合│ ▶ │
│              │        │ 房價 44.04 〔-13%〕     │  │
└──────────────┴──────── 3.4 explore-compare ──────┘
```

> 實作已對齊設計稿：`explore-result-bar`、`explore-compare`、`explore-zoom` 皆為**地圖上的浮動 panel**（不再收進 sidebar）。

- **`explore-sidebar`（3.1）**：全部條件 checkbox（可增減）+ 結果清單摘要；底部兩條 banner。頂部「重新選擇 ↺」→ `restart()`（清空全部、回 step 1）。設計稿的「◀ 返回 step 2」目前註解停用。
- **`explore-result-bar`（3.2）**：Reka **Collapsible**（收合膠囊「共 N 項結果 🔍」↔ 展開「← 請選擇」）+ **Listbox**（依縣市分組、依 `order.json` 排序的結果清單）。點清單項 → 飛入並更新 compare。

```
explore-result-bar ── 收合態           展開態
┌──────────────┐                  ┌──────────────┐
│ 共 N 項結果 🔍│      點擊展開  →    │ ← 請選擇      │
└──────────────┘                  ├──────────────┤
                                  │ 新北市        │
                                  │   三峽區      │
                                  │   林口區 …    │
                                  └──────────────┘
```

- **`explore-map`（3.3）**：結果標點 + 現居地 pin + 選中區塊上色；點標點/結果項 → 飛入。hover 顯示 [MapTooltip.vue](../app/components/MapTooltip.vue)。
- **`explore-compare`（3.4）**：地圖右下**可收合**比較浮卡，兩側帶 **paddle nav（◀ ▶）**。標題列顯示「縣市 鄉鎮」+ **人口數**（取自 `data/0.json` via `usePopulation`）。展開列出全指標比較（該地區 vs 現居，含 % 差）；左右 paddle 依結果清單順序切換上/下一筆並同步飛入。

```
explore-compare ── 收合態              展開態
   ┌──────────────────────┐       ┌──────────────────────┐
◀ │ 新北市 三峽區 人口…  收合∨│ ▶  ◀ │ 新北市 三峽區 人口…   收合∧│ ▶
   └──────────────────────┘  →    │ 大樓房價  現居50.88→44.04 │
   ◀▶＝依 result-bar 順序切換          │ …（全指標逐項，含 % 差）   │
      上/下一筆，地圖同步飛入            └──────────────────────┘
```

- **`explore-zoom`（3.5）**：自訂 SVG 圓鈕，地圖縮放（＋／−，`zoomBy`）+ ⓘ；點 ⓘ 開 `explore-info-dialog`。
- **`explore-info-dialog`（3.8）**：Reka `DialogRoot`，內容由 [InfoContent.vue](../app/components/InfoContent.vue) 渲染（資料來源逐項 + 頁尾 [AppFooter.vue](../app/components/AppFooter.vue)：製作團隊 / 分享 / 版權）。**註**：渲染於 Dialog portal，樣式採 non-scoped（見 gotchas）。

```
3.8 explore-info-dialog
┌──────────────────────────┐
│  資料來源                ✕│
│  ‧ 各指標來源逐項…          │
│  ── 頁尾（AppFooter）──     │
│  製作團隊 / 分享 / 版權      │
└──────────────────────────┘
```

- **`explore-reloading`（3.6，⬜）**：**每次切換 filter**（sidebar 勾選/取消）即由 `watchEffect` 重算 `resultTowns`；設計稿規劃計算期間於**地圖中央浮「載入視窗」**（放大鏡 +「載入中......」，同 2.5a 但**不刷暗背景**），算完即消失。**目前無 loading UI**。
- **`explore-empty`（3.7，🟡）**：`resultTowns.length === 0` 時，設計稿為**地圖中央浮「無結果視窗」**（紅 ✕ 圓圈 +「沒有符合條件的地區！」+「建議調整你的條件設定」+ 右上 ✕，與 2.5c 共用）；目前僅 `.lc-sr__list-empty` 內嵌文字，**待升級**。
- **去向**：重新選擇 ↺ → ① 定位現居地（`restart()`）。

---

## 4. 待補/開放問題

- [x] 步驟 ②「3 項上限」是硬性還是建議？→ **已定案：硬性「需選滿 3 項」**（`StepCriteria.logic.ts` `canProceed = length === 3`），未滿 3 項禁止進入 step 3。
- [x] 縣市/鄉鎮排序依據？→ **已定案：`order.json`（官方北→南序）**，見 §1c。
- [ ] ②→③ 轉場（PUSH + `transition-loading` 2.5a + `transition-result-count` 2.5b，fade-up 300ms，規格見 §2.5）尚未實作；`nmd-loading.*` 資產已備。
- [ ] step 3 改條件的 `explore-reloading`（3.6）loading 呈現：地圖中央浮「載入視窗」（同 2.5a，不刷暗），規格見 §2.5。
- [ ] 0 筆結果由內嵌文字升級為 `explore-empty`（3.7）浮動「無結果視窗」（與 2.5c 共用），規格見 §2.5。
- [ ] step 3「◀ 返回 step 2」是否恢復（目前註解停用，僅留「重新選擇 ↺」回 step 1）。
- [ ] 是否需要頂部可視化「進度指示器」（① ② ③）。
- [ ] `useResultTowns`：當**現居地本身**某選定指標缺值時，結果會是空清單（與「真的無更佳地區」無法區分）——待補診斷/提示。
