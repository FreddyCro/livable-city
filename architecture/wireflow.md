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
| 2.5a | `transition-loading`   | loading 畫面          | 轉場 | ⬜ | _未建_（`public/nmd-loading.*` 資產已備，尚未組成轉場元件） |
| 2.5b | `transition-hint`      | 簡單提示              | 轉場 | ⬜ | _未建_ |
| 3.1 | `explore-sidebar`      | 左側篩選欄            | explore | ✅ | StepResult `.lc-sr__sidebar`（`.lc-sr__cards` checkbox + `.lc-sr__banners`；**返回鈕目前註解停用**） |
| 3.2 | `explore-result-bar`   | 結果數／清單「共 N 項結果」 | explore | ✅ | StepResult `.lc-sr__list`（**Reka Collapsible + Listbox**，浮於地圖；收合為膠囊、展開為清單。**已不再用 select-dropdown**） |
| 3.3 | `explore-map`          | 地圖 + 標點          | explore | ✅ | [TaiwanMap.vue](../app/components/TaiwanMap.vue) deck.gl 圖層 `towns`/`counties`/結果標點/現居 pin |
| 3.4 | `explore-compare`      | 比較／詳情浮卡         | explore | ✅ | StepResult `.lc-sr__compare-wrap`（浮於地圖右下、可收合、左右 **paddle nav**、標題含**人口**） |
| 3.5 | `explore-zoom`         | 地圖縮放（＋／−）+ ⓘ | explore | ✅ | StepResult `.lc-sr__zoom`（自訂 SVG ＋/−/ⓘ 圓鈕；ⓘ 開 info-dialog） |
| 3.6 | `explore-reloading`    | 重新篩選 loading      | explore | ⬜ | `watchEffect` 重算 `resultTowns`（**無 loading UI**） |
| 3.7 | `explore-empty-dialog` | 「沒有結果」dialog     | explore | 🟡 | StepResult `.lc-sr__list-empty` 內嵌文字（`str.noResult`；**尚未升級為 dialog**） |
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
        P3 -. 勾選/取消條件（3.1 explore-sidebar） .-> P3b["重算 resultTowns（3.6 explore-reloading，無 loading UI）"]
        P3b -- 有結果 --> P3
        P3b -- 0 筆結果 --> P3c["<b>3.7</b> 內嵌「無符合條件的地區」（待升級 dialog）"]
        P3c -. 調整條件 .-> P3
    end

    P3 -- 點「重新選擇 ↺」(explore-sidebar) --> RESET["restart()：清空全部選取 → 回 ① locate"]
    RESET --> P12
```

> **導覽變動（vs 設計稿）**
> - ②→③ 目前**直接切換**，尚未實作 `transition-loading`/`transition-hint`（2.5）。
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

### 2.5 ②→③ 轉場（⬜ 待建）

設計稿規劃 `transition-loading`（計算/載入）→ `transition-hint`（提示）→ 自動進入 explore。**目前未實作**：②→③ 直接切換，step 3 進入時 `flyToTaiwan()` 並 `preloadAllFilters()`。`public/nmd-loading.*` 資產已備，待組成轉場元件。

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

- **`explore-reloading`（3.6，⬜）**：改條件即由 `watchEffect` 重算 `resultTowns`，**無 loading UI**。
- **`explore-empty-dialog`（3.7，🟡）**：`resultTowns.length === 0` 時顯示 `.lc-sr__list-empty` 內嵌文字「無符合條件的地區」；**尚未升級為設計稿的 dialog**。
- **去向**：重新選擇 ↺ → ① 定位現居地（`restart()`）。

---

## 4. 待補/開放問題

- [x] 步驟 ②「3 項上限」是硬性還是建議？→ **已定案：硬性「需選滿 3 項」**（`StepCriteria.logic.ts` `canProceed = length === 3`），未滿 3 項禁止進入 step 3。
- [x] 縣市/鄉鎮排序依據？→ **已定案：`order.json`（官方北→南序）**，見 §1c。
- [ ] ②→③ 轉場（`transition-loading` / `transition-hint`，2.5）尚未實作；`nmd-loading.*` 資產已備。
- [ ] step 3 改條件的 `explore-reloading`（3.6）loading 呈現。
- [ ] 0 筆結果由內嵌文字升級為 `explore-empty-dialog`（3.7）。
- [ ] step 3「◀ 返回 step 2」是否恢復（目前註解停用，僅留「重新選擇 ↺」回 step 1）。
- [ ] 是否需要頂部可視化「進度指示器」（① ② ③）。
- [ ] `useResultTowns`：當**現居地本身**某選定指標缺值時，結果會是空清單（與「真的無更佳地區」無法區分）——待補診斷/提示。
