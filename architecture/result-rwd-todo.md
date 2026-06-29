# Result（結果頁）RWD 待修清單

> ## ✅ 實作狀態（2026-06-29 完成，已於 dev server 768/414/PC 三斷點實機驗證、無 console error）
>
> **採 CSS 變數單一來源做法**（沿用協作者在 `theme.css` / `variables.scss` 建好的 `--explore-sidebar-w`）：
> - `base.scss`：`@include rwd-between(sm, md)` 覆寫 `--explore-sidebar-w: 240px`、`rwd-max(sm)` 覆寫 `0px`。
>   側欄寬、地圖左內縮（`TaiwanMap`）、`MapTooltip`、`__list`/`__compare-wrap` 的 width/left calc 全部自動跟著縮。
> - `StepResult.scss`：PAD（`rwd-between(sm,md)`）只剩內距與卡片單欄；MOB（`rwd-max(sm)`）為大改版區塊（見 C 各項）。
> - `StepResult.vue`：側欄改 `CollapsibleRoot`（桌機 `:open=true :disabled` 恆開；MOB 為底部 sheet），
>   標題列＝`CollapsibleTrigger`、`reselect` 移出 trigger、卡片包進 `CollapsibleContent`、banner 副標包 `__banner-sub`。
> - `StepResult.logic.ts`：`isMobile`（matchMedia，沿用 StepLocation 模式）、`asideOpen`、`onAsideOpenChange`。
>
> A1–A3 / B1–B6 / C1–C8 皆已實作；E1–E4 決議全數落地。


> 來源設計稿（Figma「宜居城市指南_clone」, file key `4n4QX8IuoXVpcDe4yKUnPD`）：
> - PC（base，≥1024）：現行實作 `StepResult.vue` / `StepResult.scss`
> - PAD（768–1023）：
>   - 預設 [633-11031](https://www.figma.com/design/4n4QX8IuoXVpcDe4yKUnPD/?node-id=633-11031)
>   - compare 全開 [633-12299](https://www.figma.com/design/4n4QX8IuoXVpcDe4yKUnPD/?node-id=633-12299)
>   - result bar 展開 [633-12721](https://www.figma.com/design/4n4QX8IuoXVpcDe4yKUnPD/?node-id=633-12721)
> - MOB（<768）：
>   - 預設 [633-17957](https://www.figma.com/design/4n4QX8IuoXVpcDe4yKUnPD/?node-id=633-17957)
>   - compare 全開 [633-18758](https://www.figma.com/design/4n4QX8IuoXVpcDe4yKUnPD/?node-id=633-18758)
>   - result bar 展開 [633-19157](https://www.figma.com/design/4n4QX8IuoXVpcDe4yKUnPD/?node-id=633-19157)
>   - filter aside 展開 [633-9481](https://www.figma.com/design/4n4QX8IuoXVpcDe4yKUnPD/?node-id=633-9481)
>
> 斷點 mixin（`app/assets/styles/mixins.scss` + `$breakpoints`）：
> - PAD ＝ `@include rwd-between(sm, md)`（768 ~ 1023.98）
> - MOB ＝ `@include rwd-max(sm)`（< 768）
> - PC ＝ 預設值（desktop-first，無 media query）
>
> 變數（`variables.scss`）：`$app-header-h: 60px`、`$explore-sidebar-w: 420px`
>
> 結論：**PAD 維持「左側欄＋兩浮層（result bar / compare）」的 PC 架構，只縮窄側欄、卡片改單欄、compare 縮窄；
> MOB 大改結構 —— 側欄三段拆解（banners 移頂部橫列、重選地區移頂部工具列、filter cards 改底部可展開 sheet），
> compare 改底部近滿版 sheet。**

---

## A. 共用（PAD + MOB 都要）

- [ ] **A1** `__list`（result bar）：`left` 不能再硬綁 `$explore-sidebar-w + 16`
  - PAD：緊鄰縮窄後的側欄
  - MOB：貼齊地圖左上（不再有左側欄偏移）
  - 展開 overlay 沿用 `max-height` 上限 + 面板內捲動（現行已具備）
- [ ] **A2** `__compare-wrap`：`left` 目前以 `$explore-sidebar-w` 為左偏移基準計算地圖區中心，
      PAD（窄欄）與 MOB（無欄）都需重算定位基準
- [ ] **A3** `__zoom`：維持右上，確認不被 MOB 頂部 banners／工具列遮擋（必要時下移 `top`）

## B. PAD 專屬（`rwd-between(sm, md)`）— 維持左側欄＋雙浮層

> 設計稿量測（節點 633-11031）：側欄 `選擇條件面板-pad` 寬 **240**；result bar `結果搜尋` x=259 / w=140；
> compare 面板 `指標資訊選單-pc` x=302 / w=**400**（置中於地圖區）；左右按鈕在 x≈252 / x≈752（地圖區左右邊）。

- [ ] **B1** `__sidebar`：`width 420 → 240`
- [ ] **B2** `__cards`：grid `2 欄 → 1 欄`（`grid-template-columns: 1fr`）；卡片單欄滿版
- [ ] **B3** `__card`：單欄滿版後 label 較長，`min-height` 視 2 行調整；icon（`__card-x`）保留
- [ ] **B4** `__compare-wrap`：`max-width 500 → 400`。wrap 置中於地圖區後，現行 `__paddle ±52px`
      會自動落在地圖區左右邊（≈252 / 752），符合設計稿；paddle 規則不需另改
- [ ] **B5** `__banners`：維持側欄底部滿版（沿用 PC，不變）
- [ ] **B6** `__list.left`（現 `$explore-sidebar-w + 16`）與 `__compare-wrap.left`（現以 `$explore-sidebar-w` 算地圖區中心）
      在 PAD 需改用 240 為基準重算（見 A1 / A2）。result bar 落點 ≈ `240 + 19`，與量測 259 一致

## C. MOB 專屬（`rwd-max(sm)`）— 改單欄、側欄三段拆解

- [ ] **C1** `__sidebar` 解構：MOB 不再是左側固定欄，內容拆到三處（需改 DOM 結構，非純 CSS）
  - `__banners` → 移到 AppHeader 下方**頂部橫列**（2 欄並排、滿版）
  - `__reselect`（重選地區）→ 移到**頂部工具列**（與 result bar 同一列、靠右）
  - `__cards`（filter）→ 改為**底部可展開 sheet**（見 C2）
  - `__head` / `__title`（選擇更多條件…）→ 成為 filter sheet 的標題列文字
- [ ] **C2** **filter → 底部可展開 sheet**（最大項，需互動＋改結構）
  - 收合：固定底部 bar＝`選擇更多條件，以進行精確篩選 ⌃`
  - 展開：由下往上長高、**疊在地圖上方**（無遮罩 / 不刷暗），內容 = `__cards` **2 欄**，面板內可捲動；chevron 轉向
  - 建議用 **Reka Collapsible**（比照 criteria C2 / `explore-result-bar` 既有模式），開合狀態存於 StepResult
- [ ] **C3** **頂部工具列**：`__list`（共N項結果 pill）+ `__reselect`（重選地區）同一列，置於 banners 橫列下方、地圖上方
- [ ] **C4** `__compare`：改**底部近滿版 sheet**（移除/放寬 `max-width 500`，左右留小 margin）；
      維持三態（collapsed / half / open）與 chevron；位於 filter bar **之上**
- [ ] **C5** `__paddle`（左右切換鈕）：**MOB 隱藏**（決議 E1）。改由點地圖標記／result 清單切換地區；
      `v-if`／CSS `display:none` 皆可，保留 `goBy`/`hasPrev`/`hasNext` 邏輯供桌機與清單用
- [ ] **C6** `__banners` 頂部橫列：2 欄等寬（`--data` / `--report`），取代 PC 的側欄底部直列
- [ ] **C7** `__list` 展開 overlay：自頂部工具列下方往下展開、可捲動（沿用現行 Collapsible）
- [ ] **C8** 層疊 / 互動：filter sheet 與 compare sheet 皆錨定底部。**filter sheet 展開時直接疊在最上、蓋住 compare**
      （決議 E2）；filter 收合後 compare 還原原本狀態。filter sheet 的 `z-index` 需高於 compare sheet

## 已定決議

- **E1**（MOB paddle）：**MOB 隱藏左右切換鈕**，改由點地圖標記／result 清單切換選取地區。
- **E2**（MOB 雙底部面板）：filter sheet 展開時**直接疊在最上、蓋住 compare**（不互相聯動收合）；filter 收合後 compare 維持原狀態。
- **E3**（MOB 位移歸屬）：頂部 banners 橫列與工具列（共N項結果＋重選地區）由 **`StepResult` 自行 render／重排 DOM**，AppHeader 不動。
- **E4**（PAD 側欄寬）：`240px`（設計稿節點 `選擇條件面板-pad` 實際標註）。

---

## 影響檔案（預估）

- `app/components/StepResult/StepResult.scss` — A1–A3、B1–B6、C2–C7 的樣式
- `app/components/StepResult/StepResult.vue` — **C1**（DOM 重排：banners/reselect/filter 容器）、**C2**（filter Collapsible 結構）、**C4**（compare sheet）、C5（paddle 條件顯示）
- `app/components/StepResult/StepResult.logic.ts` — **C2** filter sheet 開合狀態（若不直接用 Reka v-model）、**C8** 兩面板互動聯動
</content>
</invoke>
