# 宜居城市互動地圖 — Wireflow

> 2026 九合一選舉 ‧ 聯合報互動專題
> 三步驟流程：**定位現居地 → 選擇條件 → 探索結果**

---

## 1. 步驟命名定案

| # | 內部代號 | 中文步驟名 | 對應元件 | 一句話任務 |
|---|----------|-----------|----------|-----------|
| 1 | `locate`   | **定位現居地** | [StepLocation.vue](../app/components/StepLocation.vue) | 主視覺進場 → 往下滑 → 告訴我你現在住哪（縣市＋鄉鎮市區） |
| 2 | `criteria` | **選擇條件**   | [StepCriteria.vue](../app/components/StepCriteria.vue) | 挑你最在意的居住指標 |
| 3 | `explore`  | **探索結果**   | [StepResult.vue](../app/components/StepResult.vue) | 看地圖、比較、微調篩選 |

- 進度指示／標題列統一使用「中文步驟名」。
- 程式內 step state 仍為 `currentStep: 1 | 2 | 3`，內部代號用於文件與日後重構對照。
- **`hero`（主視覺）非獨立步驟**：它是 `locate` 的進入區，使用者往下捲動即露出定位選單，期間不切換 step、仍停留在 step 1。

---

## 1b. Panel 命名總表

每個 panel 一個英文代號，前綴所屬步驟名（`locate-` / `criteria-` / `transition-` / `explore-`），編號對應 §2 流程節點。

| 編號 | Panel 代號 | 中文 | 所屬步驟 | codebase 對應 |
|------|-----------|------|---------|---------------|
| 1.1 | `locate-hero`          | 主視覺（大標 + 導言）   | ① locate | _待建（hero 區段）_ |
| 1.2 | `locate-form`          | 定位選單（縣市/鄉鎮 + 下一步） | ① locate | [StepLocation.vue](../app/components/StepLocation.vue) `.location-selects`（內含 `select-dropdown`）+ `.btn-next` |
| 2.1 | `criteria-stats`       | 現居地數據面板         | ② criteria | [StepCriteria.vue](../app/components/StepCriteria.vue) `.town-panel` |
| 2.2 | `criteria-cards`       | 居住條件卡片格         | ② criteria | [StepCriteria.vue](../app/components/StepCriteria.vue) `.criteria-panel` / `.card-grid` |
| 2.5a | `transition-loading`   | loading 畫面          | ②→③ 轉場 | _待建_ |
| 2.5b | `transition-hint`      | 簡單提示              | ②→③ 轉場 | _待建_ |
| 3.1 | `explore-sidebar`      | 左側篩選欄            | ③ explore | [StepResult.vue](../app/components/StepResult.vue) `.result-sidebar`（`.back-section` / `.filter-section`） |
| 3.2 | `explore-result-bar`   | 結果數／搜尋列「共 N 項結果」（**可展開為下拉**） | ③ explore | [StepResult.vue](../app/components/StepResult.vue) `.result-section`（現置於 sidebar 內，設計稿為地圖浮動框；展開用共用 `select-dropdown`） |
| 3.3 | `explore-map`          | 地圖 + 標點          | ③ explore | [app.vue](../app/app.vue) deck.gl 圖層 `towns`/`counties`/`result-markers`/`selected-pin` |
| 3.4 | `explore-compare`      | 比較／詳情浮卡（**可收合** + 左右 **paddle nav**） | ③ explore | [StepResult.vue](../app/components/StepResult.vue) `.detail-section`（現置於 sidebar 底、無收合/無切換，設計稿為地圖右下可收合浮卡，依 `explore-result-bar` 順序左右切換） |
| 3.5 | `explore-zoom`         | 地圖縮放控制（＋／−）+ ⓘ **hint 按鈕** | ③ explore | deck.gl `controller: true`（無自訂 UI；ⓘ 待建） |
| 3.6 | `explore-reloading`    | 重新篩選 loading（**無 lightbox**） | ③ explore | _待建（沿用 `watchEffect` 重算 `resultTowns`）_ |
| 3.7 | `explore-empty-dialog` | 「沒有結果」dialog（reloading 後 0 筆） | ③ explore | [StepResult.vue](../app/components/StepResult.vue) `.hint`「無符合條件的地區」（現為內嵌文字，設計稿升級為 dialog） |
| 3.8 | `explore-info-dialog`  | 資料來源 + 製作團隊說明（由 `explore-zoom` ⓘ 開啟） | ③ explore | _待建_ |

**共用元件**

- `select-dropdown`：下拉選單元件，由 `locate-form`（1.2，縣市/鄉鎮市區）與 `explore-result-bar`（3.2，展開態）共用。

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
        P2 -. 點卡片 toggle .-> P2a["卡片選取/取消（建議上限 3 項）"]
        P2a -. 至少選 1 項 .-> P2b["「查看你的理想居住地區」啟用"]
    end

    P2b -- 點「查看你的理想居住地區 ▶」 --> T25a["<b>2.5a transition-loading</b><br/>計算理想居住地中…（有 lightbox 全屏）"]
    T25a -- 運算完成 --> T25b["<b>2.5b transition-hint</b><br/>簡單提示（同一轉場 node）"]
    T25b -- 自動進入 --> P3
    P2 -- 點「◀ 返回」 --> P12

    subgraph STEP3 ["③ 探索結果 explore"]
        P3["<b>3 explore</b><br/>3.1 explore-sidebar｜3.2 explore-result-bar<br/>3.3 explore-map｜3.4 explore-compare｜3.5 explore-zoom"]
        P3 -. 點「共 N 項結果」 .-> P3r["3.2 explore-result-bar 展開<br/>下拉清單（select-dropdown）"]
        P3r -. 選一筆/收合 .-> P3
        P3 -. 點結果項/地圖標點 .-> P3a["3.3→3.4 地圖飛入該地區<br/>explore-compare 顯示（現居 vs 該地區）"]
        P3a -. 點「看更多 ∧」 .-> P3a2["explore-compare 展開<br/>完整指標比較"]
        P3a2 -. 點「收合 ∨」 .-> P3a
        P3a -. 點 ◀ ▶ paddle .-> P3a3["切換上/下一筆結果<br/>（依 explore-result-bar 順序）"]
        P3a3 -. 同步飛入 .-> P3a
        P3 -. 點 ⓘ hint（3.5 explore-zoom） .-> P3i["<b>3.8 explore-info-dialog</b><br/>資料來源 + 製作團隊"]
        P3i -. 關閉 .-> P3
        P3 -. 勾選/取消條件（3.1 explore-sidebar） .-> P3b["<b>3.6 explore-reloading</b><br/>再次 loading（**無 lightbox**、畫面微異）"]
        P3b -- 有結果 --> P3
        P3b -- 0 筆結果 --> P3c["<b>3.7 explore-empty-dialog</b><br/>「沒有結果」dialog"]
        P3c -. 關閉/調整條件 .-> P3
    end

    P3 -- 點「◀ 返回」(explore-sidebar) --> P2
```

---

## 3. 各步驟畫面與互動

### 全域（所有步驟共用）

- 頁首：聯合報 LOGO ‧「訂閱數位版」‧ 分享鍵 ‧ 選單鍵
- 地圖畫布常駐背景，僅步驟 ① 隱藏（`map-hidden`）
- 步驟切換使用 fade 轉場（`Transition name="fade"`）

### ① 定位現居地 `locate`

此步驟是一頁式縱向捲動，含兩個 panel：上方 `locate-hero` 主視覺，往下滑進入 `locate-form` 定位選單。期間不切換 step。

```
┌───────────────────────────────────────────────┐
│  1.1 locate-hero（主視覺）                        │
│  2026九合一選舉                                  │
│  宜居城市互動地圖                                 │
│  〔測測看你適合居住在哪個地區?〕                    │
│  （導言段落…回歸真實數據，找到理想居住地）           │
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

- **`locate-hero`**：大標題 + 導言主視覺，作為專題進入點；非獨立 step，往下滑即接定位選單
- **`locate-form`**：縣市（必選）、鄉鎮市區（依縣市過濾，必選）+ 下一步
- **狀態**：鄉鎮市區下拉在縣市未選時 `disabled`；下一步在鄉鎮市區未選時 `disabled`
- **去向**：下一步 → ② 選擇條件

### ② 選擇條件 `criteria`

```
   2.1 criteria-stats        2.2 criteria-cards
┌──────────────┬────────────────────────────────┐
│ 〔現居地縮圖〕 │  ◀ 返回                          │
│ 你現在居住的地區│  與現在居住的地區相比，           │
│  新北市汐止區  │  你希望搬到……的地區              │
│ ─────────── │  請選擇你最重視（或想改善）的居住條件  │
│ 房價  51.0萬 │  ┌────┐┌────┐┌────┐            │
│ 租金  15000  │  │房價 ││租金 ││醫療 │ … 指標卡片格  │
│ 醫療  1506人 │  └────┘└────┘└────┘            │
│ 癌症  564/萬 │  （點選 toggle，選取者高亮）          │
│ 犯罪  198/萬 │                                  │
│ 交通  12.9   │  ┌────────────────────────┐     │
│   …          │  │ 查看你的理想居住地區 ▶    │ ←至少 │
│              │  └────────────────────────┘ 選1項啟用│
└──────────────┴────────────────────────────────┘
```

- **`criteria-stats`（左）**：現居地名稱 + 全指標數據（`filterIndex` 逐項）
- **`criteria-cards`（右）**：指標卡片格，點擊 toggle 進 `selectedFilters`（畫面提示「已選 N/3」，建議上限 3 項）
- **去向**：返回 → ① 定位現居地；查看理想居住地區 → ③ 探索結果

### 2.5 ②→③ 轉場 ‧ loading + 簡單提示（同一 node）

點「查看你的理想居住地區」後、進入 explore 前，這個轉場 node 依序播兩段：先 `transition-loading`（載入/計算各指標資料並篩選結果），運算完成後閃一段 `transition-hint` **簡單提示**，再自動進入 explore。

```
2.5a transition-loading          2.5b transition-hint
┌─────────────────────┐        ┌─────────────────────┐
│                     │        │                     │
│       ⏳ / 動畫       │   →    │   💬 簡單提示文案       │
│   計算你的理想居住地中…  │  完成  │  （引導／說明一句話）    │
│                     │        │      ↓ 自動進入        │
└─────────────────────┘        └─────────────────────┘
```

- **時機**：`criteria → explore` 轉場；A→B→explore 全程自動，無需使用者操作
- **同一 node**：`transition-loading` 與 `transition-hint` 寫在同一個轉場 node（Figma node `633-16920` / `633-16492`）
- **對應程式**：step 3 進入時 `flyToTaiwan()`，並等待 `preloadAllFilters` / 選定指標資料載入完成後算出 `resultTowns`
- **待補**：簡單提示的實際文案、loading 與提示各自的顯示時長、loading 動畫形式、資料載入失敗的錯誤狀態

### ③ 探索結果 `explore`

五大 panel：`explore-sidebar`（左控制欄）、`explore-result-bar`（結果數/搜尋）、`explore-map`（地圖）、`explore-compare`（比較浮卡）、`explore-zoom`（縮放控制）。

```
  3.1 explore-sidebar      3.2 result-bar         3.5 zoom
┌──────────────┬───┌──────────────┐──────────┌──┐─┐
│ ◀ 返回／重選地區│   │ 共 N 項結果  🔍│           │＋││
│ 條件          │   └──────────────┘           │−││ 3.3
│ ☑房價 ☑租金   │         〔全台地圖〕            │ⓘ││ explore
│ ☐醫療 ☑治安   │      ● ○ ○ 結果標點           └──┘│ -map
│  …（全指標）   │        ◆ 現居地 pin                │
│ ───────────  │        ┌──────────────────────┐  │
│ 共 N 項結果    │        │ 新北市 三峽區 人口…  看更多│  │
│ ‧ 三峽區       │        │ 房價 44.04 〔-13%〕     │  │
│ ‧ 林口區       │        │  現居 50.88 / 全台 36  │  │
│ 〔banner×2〕   │        └──────────────────────┘  │
└──────────────┴──────── 3.4 explore-compare ──────┘
```

> 註：上圖依 Figma 設計稿排版（`explore-result-bar`、`explore-compare`、`explore-zoom` 為地圖上的浮動 panel）。目前 codebase 把 3.2／3.4 收進 `explore-sidebar` 內，3.5 用 deck.gl 內建 controller，詳見 §1b 對照。

- **`explore-sidebar`（3.1）**：返回／重選地區 + 全部條件 checkbox（可增減）+ 結果清單；設計稿底部含兩條 banner（城市戰力圖解／2026 選戰報導）
- **`explore-result-bar`（3.2）**：收合態顯示「共 N 項結果」（`resultTowns.length`）；點擊**展開為下拉清單**，可挑選/搜尋特定結果地區。下拉使用共用 `select-dropdown` 元件（與 `locate-form` 1.2 同一元件）。設計稿為地圖左上浮動框。

```
explore-result-bar ── 收合態           展開態（select-dropdown）
┌──────────────┐                  ┌──────────────┐
│ 共 N 項結果 🔍│      點擊展開  →    │ 共 N 項結果  ∧│
└──────────────┘                  ├──────────────┤
                                  │ 新北市 三峽區  │
                                  │ 新北市 林口區  │
                                  │ …（結果清單）  │
                                  └──────────────┘
```

- **`explore-map`（3.3）**：結果地區標點 + 現居地 pin + 選中區塊上色；點標點/結果項 → 飛入該地區
- **`explore-compare`（3.4）**：地圖右下**可收合**比較浮卡，兩側帶 **paddle nav（◀ ▶）**。收合態僅顯示地區名、人口與摘要；點「看更多 ∧」展開，列出選定指標的完整比較（該地區 vs 現居 vs 全台平均、% 差）；點「收合 ∨」收回。左右 paddle 依 `explore-result-bar` 的清單順序切換上/下一筆結果，切換時地圖同步飛入該地區、`explore-map` 高亮同步更新。

```
explore-compare ── 收合態              展開態（看更多 ∧）
   ┌──────────────────────┐       ┌──────────────────────┐
◀ │ 新北市 三峽區 人口…  看更多∧│ ▶  ◀ │ 新北市 三峽區 人口…   收合∨│ ▶
   │ 大樓房價 44.04 〔-13%〕  │  →    │ 大樓房價  現居50.88→44.04 │
   └──────────────────────┘  展開   │ 房屋租金  現居… → …       │
   ◀▶＝依 result-bar 順序切換          │ 醫療資源  現居… → …       │
      上/下一筆，地圖同步飛入            │ …（選定指標逐項，含全台平均）│
                                    └──────────────────────┘
```

- **`explore-zoom`（3.5）**：地圖縮放（＋／−）+ ⓘ **hint 按鈕**；點 ⓘ 開啟 `explore-info-dialog`
- **`explore-info-dialog`（3.8）**：由 `explore-zoom` 的 ⓘ 開啟，說明**資料來源**與**製作團隊**；關閉後回 explore

```
3.8 explore-info-dialog
┌──────────────────────────┐
│  資料來源                ✕│
│  ‧ XX 部會開放資料…        │
│  ‧ …                      │
│  製作團隊                  │
│  ‧ 記者／工程／設計…        │
└──────────────────────────┘
```

- **`explore-reloading`（3.6）**：在 `explore-sidebar` 勾選/取消任一條件，會**再次觸發 loading**後重算 `resultTowns`（3.2）與標點（3.3）。此 loading 是 explore 內變體：**畫面微異、無 lightbox**（不蓋全屏遮罩），有別於 ②→③ 的 `transition-loading`（全屏 lightbox）。
- **`explore-empty-dialog`（3.7）**：`explore-reloading` 重算後若 `resultTowns.length === 0`，跳出「沒有結果」dialog；關閉後回 explore，使用者再調整 `explore-sidebar` 條件。（codebase 目前是 `.hint`「無符合條件的地區」內嵌文字，設計稿升級為 dialog。）
- **去向**：返回（`explore-sidebar`）→ ② 選擇條件；重選地區 → ① 定位現居地（待建）

```
3.7 explore-empty-dialog（0 筆結果）
        ┌──────────────────────────┐
        │   找不到符合條件的地區        │
        │  試試減少或更換篩選條件        │
        │        ┌──────────┐        │
        │        │  關閉/調整 │        │
        │        └──────────┘        │
        └──────────────────────────┘
```

> **兩種 loading 對照**
> - `transition-loading`（2.5a）：②→③ 首次進入，**全屏 lightbox** + 接 `transition-hint`
> - `explore-reloading`（3.6）：explore 內改條件，**無 lightbox**、畫面微異、無提示，重算完直接更新地圖與清單

---

## 4. 待補/開放問題

- [ ] 步驟 ② 的「3 項上限」是硬性限制還是建議？（目前程式允許 ≥1 項即可前進）
- [ ] 是否需要在三步驟頂部加入可視化「進度指示器」（① ② ③）？
- [ ] 比較面板的指標呈現（百分比差、與全台平均對比）的完整規格
- [ ] 結果為 0 筆時的空狀態文案與引導
