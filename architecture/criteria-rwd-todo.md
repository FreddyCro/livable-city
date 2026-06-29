# Criteria（選擇條件）RWD 待修清單

> 來源設計稿（Figma「宜居城市指南_clone」）：
> - PC（base，≥1024）：現行實作 `StepCriteria.vue` / `StepCriteria.scss`
> - PAD（768–1023）：[633-10126](https://www.figma.com/design/4n4QX8IuoXVpcDe4yKUnPD/?node-id=633-10126)
> - MOB（<768）：[633-8109](https://www.figma.com/design/4n4QX8IuoXVpcDe4yKUnPD/?node-id=633-8109)、aside 展開 [633-8180](https://www.figma.com/design/4n4QX8IuoXVpcDe4yKUnPD/?node-id=633-8180)
>
> 斷點 mixin（`app/assets/styles/mixins.scss` + `$breakpoints`）：
> - PAD ＝ `@include rwd-between(sm, md)`（768 ~ 1023.98）
> - MOB ＝ `@include rwd-max(sm)`（< 768）
> - PC ＝ 預設值（desktop-first，無 media query）
>
> 結論：**PAD 維持左右兩欄、只縮窄＋改排版；MOB 改單欄＋資訊面板變底部可展開 sheet。**

---

## A. 共用（PAD + MOB 都要） ✅ 已實作（`@include rwd-max(md)`）

- [x] **A1** `__cards`：grid 3 欄 → **2 欄**
- [x] **A2** `__head`：置中 → **靠左**（`align-items:flex-start; text-align:left`）
- [x] **A3** `__submit`：`width:400px` → **滿版**（`width:100%`）

## B. PAD 專屬（`rwd-between(sm, md)`）— 維持左右兩欄 ✅ 已實作

- [x] **B1** `__inner`：`gap 24→16`、`max-width 904→696`（300 + 16 + 380）
- [x] **B2** `__main`：`flex-basis 580→380`
- [x] **B3** `__card`：`min-height ~80`（label 自然 2 行）；**保留 icon**
- [x] **B4** `__info`：維持左欄 `300px`，不變（無需改）

> 驗證：~835px viewport 實機確認——左欄 300、右欄縮窄、卡片 2 欄含 icon、標題/提示靠左且長版自動換行。

## C. MOB 專屬（`rwd-max(sm)`）— 改單欄

- [x] **C1** `__inner`：flex row → **單欄**（`flex-direction:column; gap:0; max-width:none`）；`__main` 滿版（`flex:1 1 auto; width:100%`）
- [x] **C2** **`__info` → 底部可展開 sheet**（已實作；自製 `infoOpen` state + CSS，未用 Reka）
  - 收合：`position:fixed` 底部 `max-height:60px`，只露 location bar（sticky header + chevron）
  - 展開（`--open`）：`max-height:72dvh; overflow-y:auto`，**疊在卡片上**（`z-index:5`，無遮罩）、整個 sheet 內部捲動；chevron 旋轉 180°
  - `.lc-sc` 加 `padding-bottom:80px` 讓卡片/CTA 不被收合 bar 蓋住
  - DOM 不動（桌機/pad 仍 map→location→divider→stats 左欄）；mobile 用 `order:-1` 把 location 提到頂、其餘隨 sheet 捲
- [x] **C3** `__card-icon`：**隱藏**（手機卡片只留文字 label）
- [x] **C4** `__card`：`justify-content:center→flex-start`、`min-height ~70`（label 可 2 行）
- [x] **C5** `__cards`：2 欄（由 A1 涵蓋）、容器滿版
- [x] **C6** `.lc-sc` padding：側邊 `24→27`、底部 `80`（避開收合 bar）
- [ ] **C7** `__head` 字級：標題沿用**長版文案自動換行**（決議 D1）；font-size 暫維持 PC（20/18），**待實機目視再決定是否降級**

> 進度：A / B / C 全數實作完成（僅 C7 字級微調待目視）。檔案：`StepCriteria.vue`（infoOpen + location toggle + chevron）、`StepCriteria.scss`（`rwd-max(sm)` sheet 規則）。
> 驗證註記：本 session 瀏覽器視窗無法縮到 <768（最大化視窗忽略 `resize_window`，截圖恆為 1568px 桌機版），故 **mobile 實機畫面未取得**；CSS/邏輯與 IDE 診斷皆無誤。建議用 devtools 響應式模式（414px）複核 sheet 收合/展開、卡片 2 欄無 icon、CTA 滿版。

## 已定決議

- **D1**（標題文案）：**不做手機專屬字串**，沿用 PC 長版「與你現在居住的地區相比，你希望搬到什麼樣的地區？」，手機讓它自動換行。
- **D2**（底部 sheet 行為）：展開時**疊在卡片上方、可捲動、不加遮罩**；收合僅留底部 bar。
- **D3**（AppHeader RWD）：**另案處理**，不在本清單範圍。

---

## 影響檔案（預估）

- `app/components/StepCriteria/StepCriteria.scss` — A1–A3、B1–B4、C1、C3–C6、C7
- `app/components/StepCriteria/StepCriteria.vue` — **C2**（底部 sheet 結構 + Collapsible）、C3（icon 條件顯示）
- `app/components/StepCriteria/StepCriteria.logic.ts` — C2 收合/展開狀態（若不直接用 Reka）
