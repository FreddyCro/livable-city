# 待辦事項 TODO

> 依頁面組織的待辦清單，來源：
> - RM 回饋 [feedback/RM_FEEDBACK.md](./feedback/RM_FEEDBACK.md)（F1，僅取未完成項；`v` 者已完成）、[feedback/RM_FEEDBACK2.md](./feedback/RM_FEEDBACK2.md)（F2，全部）。
> - RWD 檢查表 [TODO/criteria-rwd-todo.md](./TODO/criteria-rwd-todo.md)、[TODO/result-rwd-todo.md](./TODO/result-rwd-todo.md)（多數已完成，僅剩項目列於下）。
>
> 截至 2026-07-05，已逐項對照 codebase；括號內斜體為現況查證註記。

## 首頁（locate）

- [ ] **標題與主視覺動畫文字重疊**（F1）— *ART 會重出素材，等資產。*
- [ ] **主視覺動畫加封面圖**（F2）
- [ ] **動畫與網頁底色有色差**，請工程確認可否解決（F2）

## step2（現居地選單 locate-form）

- [ ] **選單按鈕（SelectDropdown）大小 / 樣式待調整，高度與 Figma 不同**（F1 + F2 同題）— *[SelectDropdown.vue](../app/components/01.location/SelectDropdown.vue)。*
- [ ] **criteria C7｜條件頁標題字級**（RWD）— *`__title` 仍為 PC `20/32`、MOB 未降級（[StepCriteria.scss:182-195](../app/components/02.criteria/StepCriteria.scss#L182-L195)）；待 devtools 414px 目視決定是否降級。*

## 結果頁（explore）

- [ ] **彈跳視窗**（F1「還沒做上去」→ *現已用 [LoadingOverlay/](../app/components/LoadingOverlay/)（薄殼 + 三變體子元件）做出視窗、時序與視覺——放大鏡公轉 / pin 浮動 / empty 圖示*），剩下：
  - [x] **點畫面任何一處都可關閉**（F2）— *result-count / empty 已支援點視窗外關閉（`useClickOutside`，[OverlayResultCount.vue](../app/components/LoadingOverlay/OverlayResultCount.vue) / [OverlayEmpty.vue](../app/components/LoadingOverlay/OverlayEmpty.vue)）；loading 為過場、無關閉。*
  - [ ] **浮卡進場動畫 fade-up 300ms**（F2）— *彈窗**本身**出現時的 fade-up 尚未做（目前直接出現）。註：桌機 step 2 三區塊 fade-up 進場已做（另案）。*
- [ ] **左側選單按鈕高度與 Figma 不同 / 有些按鈕文字沒有完全顯示**（F2）— *結果側欄 filter cards（`.lc-sr__card`）。*
- [ ] **地圖有些地區的標點跑到地區外**（F2）— *質心目前取 bbox 中心，凹形/不規則區會落在多邊形外；需改真正的 point-on-surface。*
- [ ] **結果列表跑版**（F2）— *待重現確認斷點與情境。*
- [x] **資訊卡片（compare）點按收合後仍要顯示一項數據**（F2）— *已改為兩態：收合＝`half`（顯示首個指標），`collapsed`（不顯示）停用（[StepResult.logic.ts](../app/components/03.result/StepResult.logic.ts) `cycleCompare`）。*
- [ ] **「重新選擇地區」直接跳到首頁的縣市/地區選單處**（F2）— *目前 `restart()` 回 step 1 主視覺（hero），需改為直接落在定位表單（form）。*
- [ ] **result B4｜PAD compare 寬度上限**（RWD）— *`__compare-wrap` base `max-width:500`、PAD 無覆寫（[StepResult.scss:371](../app/components/03.result/StepResult.scss#L371)）；設計稿標 ≈400，PAD 應降為 `400px`。*

## 文件同步（housekeeping）

- [ ] **回勾 result-rwd-todo.md 的 checkbox**：A1–A3 / B1–B6 / C1–C8 實際已全數實作，但檔內 checkbox 仍為 `[ ]`（僅 B4 如上未完）。
- [ ] **更新兩份 RWD TODO 的「影響檔案」路徑**：目錄已改數字前綴，`StepCriteria/` → `02.criteria/`、`StepResult/` → `03.result/`。
