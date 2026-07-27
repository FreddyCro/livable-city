# GA 事件追蹤

本頁彙整全站 GA（GA4 / gtag）事件與其接入位置，供對照分析規格與日後維護。

## 機制

- Composable：[`app/composables/useTrackingEvent.ts`](../app/composables/useTrackingEvent.ts)，100% 對齊參考專案（the-love-report / leo-vis）的 `sendGA`。
- 送出 payload：

  ```js
  gtag('event', action, { event_category: category, [category]: label })
  ```

- 呼叫慣例：`category` 固定 `'term'`、`label` = 連結文字。故實際送出的參數為 `event_category='term'` 與 `term=<連結文字>`。
- **依規格不送 `area`**（階段）。事件表中的 `area` 欄為分區文件用途，不是送出的參數；因此 stage2 與 result 的相同 `click_option` 在 GA 中會落在同一 `term`（已確認可接受）。
- gtag 本體由 [`app/assets/js/tracking.js`](../app/assets/js/tracking.js) 的 `gtmConfig` 定義、經 `app.vue` 的 `useHead` 注入。

### Wrapper → action

| Wrapper | action | 參數 |
| --- | --- | --- |
| `gaClickCity(label)` | `click_city` | label = 縣市名 |
| `gaClickDistrict(label)` | `click_district` | label = 鄉鎮市區名 |
| `gaClickOption(label)` | `click_option` | label = 條件文字 |
| `gaClickOpen(label)` | `click_open` | label = 區塊名 |
| `gaClickBtn(label)` | `click_btn` | label = 按鈕文字 |

## 已接入的事件

| area | 事件 (action) | 觸發區塊 | 元件 / 位置 | term |
| --- | --- | --- | --- | --- |
| stage1 | `click_city` | 縣市選單點擊 | `StepLocation.logic.ts` `onCountySelect` | 縣市名 |
| stage1 | `click_district` | 鄉鎮市區選單點擊 | `StepLocation.logic.ts` `onTownSelect` | 鄉鎮市區名 |
| stage1 | `click_btn` | 下一步 | `StepLocation.vue` UiNextButton | `下一步` |
| stage2 | `click_option` | 居住條件卡片 | `StepCriteria.vue` `lc-sc__card` | 條件文字 |
| stage2 | `click_btn` | 查看你的理想居住地區 | `StepCriteria.vue` UiNextButton | `查看你的理想居住地區` |
| stage2 | `click_open` | 現居地區資訊展開 | `StepCriteria.vue` `toggleInfo` | `現居地區資訊` |
| result | `click_open` | 條件選單展開 | `ExploreSidebar.vue` CollapsibleTrigger | `條件選單` |
| result | `click_btn` | 重選地區 | `ExploreSidebar.vue` `lc-sr__reselect` | `重選地區` |
| result | `click_option` | 篩選卡（條件） | `ExploreSidebar.vue` CheckboxRoot | 條件文字 |
| result | `click_btn` | 圖解全台城市戰力 banner | `ExploreSidebar.vue` `lc-sr__banner--data` | `圖解全台城市戰力 透視全台15項關鍵數據指標` |
| result | `click_btn` | 2026選戰最新報導 banner | `ExploreSidebar.vue` `lc-sr__banner--report` | `2026選戰最新報導 看2026選戰最新報導` |
| result | `click_open` | 結果列表展開 | `ExploreResultBar.vue` CollapsibleTrigger | `結果列表` |
| result | `click_open` | 資訊卡片展開（看更多） | `ExploreCompare.vue` `lc-sr__compare-toggle` | `資訊卡片` |
| result | `click_btn` | 資料說明 ⓘ | `ExploreZoom.vue` DialogTrigger | `資料說明` |

檔案位置：`app/components/01.location/`、`02.criteria/`、`03.result/`。

## 實作註記

1. **展開類（`click_open`）只在「展開」時送、收合不送**；term 用固定區塊名（現居地區資訊 / 條件選單 / 結果列表 / 資訊卡片），因為它們是 toggle、無單一「連結文字」。
2. **資料說明是 icon 鈕**（無文字），term 直接用 `資料說明`。
3. **兩個 banner 的 term = 實際顯示文字**（`explore.json` 的 title + sub）。與分析規格表的用詞（「城市戰力圖解…」「誰能打造宜居城市？…」）不同——目前 locale 文案即如此；若要與表格一致，需改 locale 或改送出的字串。
4. **`click_option` 不帶 area**，stage2 與 result 在 GA 會落在同一 `term`（見上方機制說明）。

## 驗證

以 GA4 DebugView 走一輪 stage1 → stage2 → result，確認每個事件均進站。特別留意掛在 Reka 元件（CheckboxRoot / CollapsibleTrigger / DialogTrigger）上的 `@click` 是否有 forward。
