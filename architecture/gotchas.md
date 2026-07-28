# Gotchas（已知陷阱）

> 光看程式碼不易察覺、重構時容易再次踩到的陷阱。以模組名稱分節，方便搜尋。

## map（地圖 / deck.gl，`app/app.vue`）

### deck.gl v9 的 `.deck-widget-container` 會攔截 canvas 滑鼠事件

- **症狀**：地圖無法用滑鼠拖曳 / 縮放，游標碰不到 canvas。
- **原因**：deck.gl v9 會在 canvas 上方插入一個 `.deck-widget-container` overlay DOM。
  若沒有載入 widget stylesheet（`@deck.gl/widgets/stylesheet.css`），它預設
  `pointer-events: auto`，會把拖曳 / 縮放事件吃掉，事件傳不到底下的 canvas
  （deck 的事件監聽掛在 canvas 上）。
- **修法**：自行補一條 **global（非 scoped）** CSS，讓 container 事件穿透、widget 子元素再設回 auto：
  ```css
  .deck-widget-container { pointer-events: none; }
  .deck-widget-container > * { pointer-events: auto; }
  ```
  必須是 global style：container 由 deck 在 Vue 模板外動態建立，scoped style 的
  data-attribute 不會套到它。
- **位置**：`app/app.vue` 底部的 global `<style>` 區塊。
- **延伸**：各 step 是否能碰地圖，是靠 canvas 的 `.map-hidden` class 切換
  `pointer-events`（step 1/2 為 none、step 3 為 auto），而非靠這條 global 規則。
  兩者各司其職。

### controlled `viewState` 殘留 flyTo transition 會讓地圖「卡住 / 被彈回」

- **症狀**：曾經呼叫過 `flyTo*()`（例如進 step 3 的 `flyToTaiwan()`）之後，
  地圖拖曳時每個微小位移都被重播動畫、感覺卡住或彈回原位。
- **原因**：地圖用 controlled `viewState`。`flyTo*()` 會把 `transitionInterpolator`
  + `transitionDuration` 塞進 `deckViewState` 且**從未清除**；使用者互動時
  `onViewStateChange` 又把帶著 transition 的 viewState `setProps` 回去，於是每次互動都被動畫干擾。
- **修法**：在 `onViewStateChange` 內，把使用者產生的 viewState 中的 `transition*`
  屬性（`transitionDuration` / `transitionInterpolator` / `transitionEasing` /
  `transitionInterruption`）清掉再存回。程式主動呼叫的 `flyTo*()` 不受影響
  （它們是另外主動加 transition）。
- **位置**：`app/app.vue` 的 `new Deck({ onViewStateChange })`。

### 疊在地圖上的 overlay panel 必須「根層 `pointer-events:none`、panel 設回 `auto`」

- **症狀**：新增一個浮在地圖上的 step overlay（如 StepResult / StepCriteria 的浮動 panel）後，地圖空白處又不能拖曳了。
- **原因**：step overlay（`.lc-sr` / `.lc-sc`）是 `position:fixed; inset:0` 蓋滿全螢幕、`z-index` 高於 deck canvas。若根層沒設 `pointer-events:none`，整片透明區都會吃掉地圖事件。
- **修法**：overlay 根層 `pointer-events:none`，只有實際 panel（sidebar / 浮卡 / 清單 / 縮放鈕）各自設 `pointer-events:auto`。如此 panel 之間的空白讓事件穿透到底下 canvas。
- **位置**：`app/components/StepResult/StepResult.vue`（`.lc-sr`）、`app/components/StepCriteria/StepCriteria.vue`（step 2 為不透明全屏面板，刻意覆蓋＝不可碰地圖）。
- **延伸**：與上面兩條 deck.gl 陷阱搭配，才完整決定「哪一步能不能碰地圖」。

## ordering（縣市/鄉鎮排序，`order.json` / `utils/sort.ts`）

### JS 物件對「整數型字串 key」會強制數值升冪重排——下拉順序不照插入順序

- **症狀**：縣市/鄉鎮下拉與結果清單的順序「怪怪的」——宜蘭排第一、金門/連江在最後，且改 `tw-towns-simplified.json` 的 geometry 排列也改不動。
- **原因**：`countyOptions` / `townOptions` 用 `Object.entries(meta.counties)`。行政區代碼是正規整數字串（`63000`、`10002010`），JS 引擎對這類 key **一律以數值升冪重排**，無視插入順序；帶前導零的 `09007`（連江）/`09020`（金門）才照插入順序排到最後。
- **修法**：順序唯一依據 `public/data/order.json`（由「0. 各鄉鎮市區人口數」列序產生＝官方北→南序），`useGeoMeta` 轉成 `countyRank`/`townRank` 併入 `meta`，元件用 `utils/sort.ts` 的 `byRank()` 排。**不要**改 geometry 順序試圖影響它。
- **位置**：`app/composables/useGeoMeta.ts`、`app/utils/sort.ts`、`scripts/process-xlsx.mjs`（產 order.json）。
- **陷阱中的陷阱**：`byRank` 目前是 `(rankA ?? Infinity) - (rankB ?? Infinity)`；當**兩者皆無 rank**（order.json 載入失敗 → rank 全 undefined）時回傳 `Infinity - Infinity = NaN`，NaN 比較器會讓 sort 亂序，與註解「退回原順序」不符。修法：相等（含皆 Infinity）時回 0。

### 排名比較需要 number，字串值會變字典序

- **症狀**：某指標（如青壯年比率）排名結果不對，「9.5」排在「61.3」前面。
- **原因**：xlsx 某些欄位值是字串（`"61.3"`）。前端 `useResultTowns` 以 `val < refVal` 比較，**兩邊皆字串時是字典序**（`"9" > "6"`）。
- **修法**：資料管線 `parseVal()` 把數字字串轉 `number`、`"-"`/`"--"`/空 → `null`。改資料來源解析時務必保留此正規化。
- **位置**：`scripts/lib/sources.mjs` `parseVal`、`app/composables/useResultTowns.ts`。

## build / SFC（Nuxt 4 / Vue 3.5 編譯）

### `defineProps<ImportedType>()` 需要專案安裝 `typescript`

- **症狀**：`Failed to load TypeScript, which is required for resolving imported types`。
- **原因**：把 props 型別抽到 `*.logic.ts` 再 `defineProps<StepResultProps>()`，Vue 編譯器要**跨檔解析 import 的型別**來產生 runtime props 宣告，這需要 `typescript` 套件。本專案雖到處 `lang="ts"`，但靠 esbuild 剝型別、原本沒裝 tsc。
- **修法**：`pnpm add -D typescript`（已裝）。或改用「就地定義」的字面型別 `defineProps<{…}>()`（不跨檔即免 tsc）。
- **位置**：`app/components/*/*.logic.ts` + 對應 `.vue`。

## scss / 樣式

### Dialog portal 內 scoped 樣式套不到 → 用 non-scoped + `lc-` 命名隔離

- **症狀**：放進 `DialogPortal`（teleport 至 `<body>`）的內容，scoped 樣式沒生效。
- **原因**：portal 內元素在 Vue 模板樹外，scoped 的 data-attribute 套不到。
- **修法**：該區 `<style>` 改 **non-scoped**，靠 `lc-` BEM 命名空間隔離。
- **位置**：`InfoContent.vue`、`AppFooter.vue`、`StepResult/StepResult.global.scss`（與 scoped 的 `StepResult.scss` 分檔，用 `<style src>` 各自引入）。
- **延伸**：`nuxt.config.ts` 的 `css.preprocessorOptions.scss.additionalData` 會把 `mixins`/`variables` 注入**每個** scss（含 `<style src>` 外部檔），故外部 `.scss` 用 `$app-header-h`、`@include rwd-min(...)` 免再手動 `@use`。

### `max-height: calc(100vh - …)` 在 iOS/iPadOS 會超出可視區 → 用 `dvh`

- **症狀**：iPad（尤其橫向）上，`position:fixed` 的浮層／對話框（如 info-dialog）上下超出視窗、底部被切掉。
- **原因**：iOS/iPadOS Safari（及 iPad 上 WebKit 系瀏覽器）的 `100vh` 是「工具列隱藏時」的**大視窗**、比實際可視區高；以 `calc(100vh - …)` 當 `max-height` 會算出比可見範圍還大的高度，盒子底部就掉出畫面。
- **修法**：改 `100dvh`（dynamic viewport height，會扣掉工具列）。老瀏覽器 fallback：`100vh` 打底 + `@supports (height: 100dvh) { … }` 覆蓋（dvh 支援起於 iOS 15.4 / Chrome 108）。純「畫面外起始位移」用途的 vh（如 fly-in keyframe，只要夠遠即可）不受影響、免改。
- **位置**：`StepResult.global.scss`（info-dialog `&__dialog`）。專案他處早已知此坑並避開：`StepLocation.scss`（改用 `100%`）、`StepCriteria.scss`（用 `dvh`）——唯獨此對話框當時漏改。
- **位置（`height` 版）**：`StepResult.scss`（`&__sidebar` 的 `rwd-min(pad)`，`height: calc(100vh - 60px)` → 改 `calc(100% - 60px)`，父層 `.lc-sr` 為 `fixed inset:0`＝可視視窗）。
- **延伸：寫在 `height` 上會「被裁切但不出現卷軸」**：side effect 更難察覺。iPad Pro 橫式（1194×834）下側欄可視高 ≈ 643px、宣告高 = `100vh-60` = 774px、內容 ≈ 710px → 內容超出**可視區**但仍小於**元素高度**，`overflow: hidden auto` 判定「裝得下」而不給卷軸，超出的 ~70px 被 `.lc-mv { overflow: hidden }` 裁掉，畫面就是「切一半又捲不動」。內容再多、突破 774px 才會冒卷軸，故不是每次都看得出來。診斷依據：同層 `fixed inset:0` 內的元素（compare 卡 `bottom:24px`、paddle）位置正常，只有寫 `vh` 的盒子超出 → 即 large/small viewport 落差。
- **無法用桌機 Chrome 重製**：桌機 Chrome 沒有可收起的工具列，`100vh` == `innerHeight` == `fixed inset:0` 高度，落差為 0；DevTools 的 iPad Pro 模擬只改 viewport 尺寸與 UA，**不模擬 large/small viewport 落差**。要驗證請用真機 Safari，或 Android Chrome（同樣有動態工具列）。

### `overflow-y: auto` 會連帶把 `overflow-x` 變 `auto` → 冒出非預期的水平 scrollbar

- **症狀**：只想垂直捲動的容器卻出現水平 scrollbar（如 info-dialog 內塞入為整頁滿版設計的 `NmdFooter`）。
- **原因**：CSS 規範——一軸設成非 `visible`（`auto`/`scroll`/`hidden`）時，另一軸的 `visible` 會被**強制計算成 `auto`**。故 `overflow-y: auto` 等同同時給了 `overflow-x: auto`，只要有子元素比容器寬就冒水平 scrollbar。
- **修法**：明確寫 `overflow: hidden auto`（x 裁掉、y 捲動）；若子元素本不該撐寬，另外約束其寬度（例如把外部滿版元件設 `max-width:100%`）。
- **位置**：`InfoContent.vue`（`&__body`）、`StepResult.scss`（`&__sidebar` 的 `rwd-min(pad)`；PAD/PC 常駐左側欄，`__banners` 用 `margin:0 -20px` 滿版出血剛好貼齊 padding box，屬刀刃寫法，已改 `overflow: hidden auto` 根除）。

### flex 面板設 `height: 100%` 會鎖死高度 → 無法隨內容（子項數量）伸縮

- **症狀**：`lc-sr__compare` 比較卡在 PAD/PC 恆為固定高（`half` 只有 1 個 `lc-sr__metric` 也是滿版一大片空白），改 `compareState` half↔open 或增減 metric 都不影響高度。
- **原因**：面板設了 `height: 100%`（撐滿 `__compare-wrap`）再配 `max-height`，等於把高度鎖成 `min(wrap 高, max-height)` 的**固定值**，與內容多寡無關。`max-height` 只在 `height:auto`（內容決定高度）時才有「上限」語意。MOB 版沒設 `height`（預設 auto）故正常。
- **修法**：面板改 `height: auto` + `max-height`（上限用 `min(600px, 100%)`：`100%` 兼顧短視窗不超出 wrap，等效舊天花板但不鎖死）；捲動交給內部 body：flex 子項加 `flex: 1 1 auto; min-height: 0; overflow-y: auto`（`min-height:0` 解除 flex item 預設 `min-height:auto`，未達上限不捲、達上限才縮並自捲），header 加 `flex-shrink: 0` 免被壓縮。此即 header＋可捲 body 的標準 modal 版型。
- **位置**：`StepResult.scss`（`&__compare` 的 `rwd-min(pad)`、`&__compare-head`、`&__compare-body`）。
- **延伸**：Sass（Dart Sass ≥ 1.11）對混合單位的 `min(600px, 100%)` 會原樣輸出成 CSS `min()`（px 與 % 無法化簡故不當 Sass 函式算），可安心使用。

## fonts（字型 / `@nuxtjs/google-fonts`，`nuxt.config.ts`）

### `@nuxtjs/google-fonts` 的 self-host（`download`/`outputDir`）模式會把 CJK 字型「塌縮」成豆腐字

- **症狀**：開了 self-host（設 `outputDir`）後，中文大量變 **豆腐字（口口口）**，比不載字型還糟。
- **原因**：CJK 被 Google 切成上百個 unicode-range 分片，此模組下載時全塌縮成同一個 `*-text.woff2`（只剩約 250 字）；缺字依 `unicode-range` 語意不 fallback，直接 render notdef。
- **修法**：不要開 self-host，用 runtime `<link>`：`googleFonts: { download: false, preconnect: true }`。真要自架須改 `@nuxt/fonts` 或 `cn-font-split` 靜態子集。
- **位置**：`nuxt.config.ts` 的 `googleFonts`。
