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

## filter / 結果運算（`composables/useResultTowns.ts`、`public/data/index.json`）

### 比值型指標的 `0` 是「完全沒有設施」＝最差，不是「數值最小」＝最好

- **症狀**：勾「醫療資源更多」，結果卻篩出高雄市茂林區（醫療院所平均每家服務人數 **0** 人、比較卡顯示 `-100%`）；勾「圖書館資源更多」同理篩出金門縣烏坵鄉（圖書館人口比 0）。PM 0730 回報。
- **原因**：這兩支指標是「人口 ÷ 設施家數」的比值，方向為 `lowerIsBetter`（每家服務人數越少＝資源越多）。但**家數為 0 時來源 xlsx 直接給 0**（分母為零，非缺值，故 `parseVal` 不會轉成 `null`），`val < refVal` 照數值比大小就讓「一家醫療院所／圖書館都沒有」的鄉鎮永遠排第一。
  - 受影響資料（現況）：指標 3 有 5 個 0（嘉義縣大埔鄉、屏東縣獅子鄉、高雄市茂林區、台南市左鎮區、金門縣烏坵鄉）、指標 9 有 1 個 0（金門縣烏坵鄉）。
  - **鏡像 bug（更難發現）**：現居地本身是 0 的使用者（上述 5 個鄉鎮），任何地區的值都 > 0，`val < refVal` 恆為 false → 該條件**永遠篩不出任何結果**（畫面像是「沒有更好的地區」，其實是比錯）。
- **修法**：以 metadata 標記而非在前端 hardcode id ——
  1. `scripts/lib/sources.mjs` 的 `ZERO_MEANS_NONE`（單一來源，與 `DIRECTION` 並列）→ `process-xlsx.mjs` 寫進 `index.json` 的 `zeroMeansNone` → `validate-sources.mjs` 交叉檢查（漏帶會 error，因為前端會靜默退回舊行為）。
  2. `useResultTowns` 的 `metricScore()` 把 0 換算成該方向的最差值（`lowerIsBetter` → `Infinity`），**候選地區與現居地兩端都要換算**：只換一端就會製造上述鏡像 bug；兩端皆 0 時 `Infinity < Infinity` 為 false，自然排除。
- **位置**：[useResultTowns.ts](../app/composables/useResultTowns.ts) `metricScore`、[sources.mjs](../scripts/lib/sources.mjs) `ZERO_MEANS_NONE`、[filter.ts](../app/types/filter.ts) `FilterMeta.zeroMeansNone`。
- **⚠️ 判斷是否該列入 `ZERO_MEANS_NONE`**：只有「0 是分母為零的副產物」才算。指標 14 大規模崩塌潛勢區數的 `0`＝真的沒有潛勢區＝**最好**，加進去會反向壞掉；指標 8（每萬名老人關懷據點數）雖有 17 個 0＝沒有據點，但方向是 `lowerIsBetter=false`（越高越好），0 本來就排最後，無需標記。新增指標時先問：這支的 0 是「沒有」還是「很少」？
- **延伸（未處理，已知）**：step 2 現居地資訊欄與 step 3 比較卡仍會把 0 顯示成「0 人」（看起來像最佳值），且 `pct()` 在現居地為 0 時回 `null`（不顯示百分比）。純顯示層問題，PM 本次只要求修篩選；若要處理，建議這類 0 顯示為「無」而非數字。

## data assets（`public/` 靜態資料，`utils/dataSource.ts`）

### `public/` 資產沒有 content hash——換了資料 URL 不變，快取會繼續給舊檔

- **症狀**：重跑 `process-xlsx.mjs` 換好新資料、部署完成，但線上（尤其回訪者）看到的人口數／房價還是舊值；且**只有部分指標舊**（新 JS 配舊 JSON），畫面數字彼此矛盾。硬重載可能好，換個裝置又出現。
- **原因**：Nuxt 只對 `_nuxt/` 底下的 build assets 加 content hash；`public/` 是**原封不動複製**。所以 `data/0.json`、`data/1.json`、`index.json`、`order.json`、`tw-towns-*.json` 的 URL **永遠相同**，瀏覽器／CDN 無從得知內容已換。更無聲的是：來源 xlsx 檔名改了（`（0723更新）`）也不會影響產出檔名——`cleanName` 刻意剝掉更新註記，連 `index.json` 的 `name` 都一模一樣，整條鏈路對快取零信號。
- **修法**：`dataSource.assetUrl()` 附加 `?v={DATA_VERSION}`，版本字串在 **build 時**由 `nuxt.config.ts` 取 git short SHA（無 git 環境退回時間戳），每次部署自然換 URL。重點是**每次部署都必須變**，否則等於沒加；用 `NUXT_PUBLIC_DATA_VERSION` 覆寫時尤其注意，**設成空字串會直接關閉**（`assetUrl` 視為 falsy 就不附加）。
- **位置**：[app/utils/dataSource.ts](../app/utils/dataSource.ts) `assetUrl`、[nuxt.config.ts](../nuxt.config.ts) 頂端 `dataVersion` + `runtimeConfig.public.DATA_VERSION`。
- **延伸**：
  - `public/img/**` 走 `useAssets` 的 `APP_ASSETS_PATH`（正式指向 `nmdap.udn.com.tw` CDN），**刻意不加 `?v=`**——圖檔幾乎不改，每次 commit 都換 URL 只會白丟快取。真的換圖且被快取住，只能等 TTL 或請對方 purge（使用者自己硬重載清不掉 edge cache）。
  - 要診斷是否中快取：`curl -sI "<部署網址>/data/1.json"` 看 `Cache-Control` / `ETag` / `Age` / `x-cache`（有 `Age` 或 `x-cache: HIT` 表示前面有 CDN 在快取）。
  - 若主機 header 改得動，`data/*.json` 給 `Cache-Control: no-cache`（保留 ETag 走 304）是更省的做法；本專案部署在 udn 靜態主機、header 不一定能控，故選前端加版本參數。

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

### 父層自成 stacking context 時，它的「自身背景」永遠蓋不掉 `position:fixed` 抽離的子孫

- **症狀**：MOB 的 filter sheet（`lc-sr__sidebar`）展開後，頂部兩條 banner（`lc-sr__banners`）和「重選地區」pill（`lc-sr__reselect`）浮在 sheet **之上**。把 `__sidebar` 的 `z-index` 從 30 調到 999、或把 `__banners` 壓到 `z-index: -1`，都完全沒有效果。
- **原因**：這兩者在 MOB 都是 `position: fixed` 抽到視窗頂部，但 **DOM 上仍是 `__sidebar` 的子孫**；而 `__sidebar` 有 `z-index: 30` → 自成 stacking context，子孫全部被關在裡面，跟外界比不了。而 CSS painting order 的第 1 步就是「形成 stacking context 那個元素自身的 background / border」，之後才輪到 negative z-index 的子孫（第 2 步）。所以 **`__sidebar` 的底色一定畫在所有子孫下面**，連 `z-index: -1` 都在它上面（`z-index:-1` 只有在父層**不是** stacking context 時才會鑽到父層背景之後）。
- **修法**：把「可見表面」從 stacking context 那一層，下移到一個 **不定位的內流子元素**（painting order 第 3 步），再把要被蓋住的 fixed 子孫壓成 **負 z-index**（第 2 步）。本專案的做法：
  - MOB 時 `__sidebar` 保持 `background: transparent; border: 0; box-shadow: none; border-radius: 0`，底色／框線／圓角／陰影全掛在 `__sidebar-top`；
  - `__banners`、`__reselect` 的 MOB `z-index` 由 30／31 改成 `-1`；
  - `rwd-min(pad)` 再互換回來（PAD/PC 這兩者是內流排，無此問題）。
- **⚠ 反例（踩過一次）**：第一版把表面掛在 `__sidebar-top` 並給它 `position: relative; z-index: 31`（> banners 的 30）——banners 修好了，但 `__reselect` 巢在 `__sidebar-top` **裡面**，`__sidebar-top` 自成 stacking context 後又把它關進來，pill 照樣浮在自己的表面之上，**同一個坑只是往下移一層**。承載表面的那層若有任何要被它蓋住的子孫，就**不能**自成 stacking context（別給 `position` + `z-index`，也別給 `transform` / `filter` / `opacity < 1` / `contain` 等）。
- **位置**：`StepResult.scss` 的 `&__sidebar`、`&__sidebar-top`、`&__banners`、`&__reselect`；markup 見 [ExploreSidebar.vue](../app/components/03.result/ExploreSidebar.vue)（`__banners` 是 `CollapsibleRoot` 的直接子節點，`__reselect` 巢在 `__sidebar-top > __head` 內）。
- **延伸 1（負 z-index 不會把它們踢到地圖底下）**：負值只排序 `__sidebar` **自己這個 stacking context 內部**；整個側欄子樹仍以 `z-index: 30` 疊在 `.lc-sr` 裡，所以 banners／pill 依舊浮在地圖、`__list`（z 10）、compare（z auto）之上。
- **延伸 2（何時才看得到）**：sheet 上限 `80vh`（`rwd-short-phone` 再放寬到 `100vh - 60px`），banners 底緣 `60 + 44 = 104px`、pill 底緣 143px。以 80vh 計，重疊條件是 `100vh - 80vh < 104` ⇒ **視窗高 < 520px**：直立手機（667／736／812）不會重疊，**橫向手機**（如 667×375、寬度仍 < 768 走 MOB 版型）與矮螢幕手機才會——所以在直立模擬器裡測不出來。

### iPadOS Safari 旋轉時 `window.resize` 讀到的是「舊尺寸」——量測要用 ResizeObserver 掛在視窗盒上

- **症狀**：iPad Pro 在 step 1 第二階段（`lc-sl--revealed`）**直式轉橫式**後，標題上方留下一大條空白、底部「下一步」被切掉且捲不到。橫式重新整理就正常，只有「轉過去」才壞。
- **原因**：那段上方空白不是 CSS 排出來的，是 `StepLocation.logic.ts` 的 `measureCenter()` 量完寫成**絕對 px** 餵給 `--lc-sl-block-y`（`transform: translateY()`）。原本的更新時機只有 `window.addEventListener('resize')` 與掛在 `block` 自己身上的 ResizeObserver：
  - iPadOS Safari 在**旋轉途中**就派送 `resize`，此時同步讀 `clientHeight` / `offsetHeight` 拿到的還是舊版面，而且**之後不會再補派一次** → `centerY` 永久停在直式的值。
  - `block` 的 RO 只看自己的盒子，管不到視窗高度。
  - 加上 `.lc-sl` 是 `overflow: hidden`，被推出視窗的 CTA 完全捲不到，是硬傷不是視覺瑕疵。
  - 數字（iPad Pro 12.9）：直式 `centerY ≈ 284`，橫式應為 `≈ 136`；沿用 284 就讓整組底緣超出可視區。
- **修法**：
  1. **ResizeObserver 加掛 `block.parentElement`（`.lc-sl`，`position: fixed; inset: 0` ＝視窗盒）**。RO 在 **layout 之後、paint 之前**派送，讀到的必定是新版面，天生繞開上述時序問題；同一個 RO `observe()` 兩個節點即可。這是主力，`resize` 事件只當備援。
  2. **夾住上界** `Math.min(wrapperH - blockH, …)`：`overflow: hidden` 沒有補救機會，夾住後就算某次量測失準也只是置中略偏，不會讓 CTA 消失。
  3. 補 `window.visualViewport` 的 `resize`：iOS/iPadOS 工具列收放會改變可視高度，但**不觸發** `window.resize`。
- **位置**：[StepLocation.logic.ts](../app/components/01.location/StepLocation.logic.ts) 的 `measureCenter` / `onMounted` / `onBeforeUnmount`。
- **延伸（為什麼不直接改純 CSS）**：`transform` 的百分比是「元素自身尺寸」（同檔 `translateX(-50%)` 已在用這個性質），所以置中理論上可寫成 `translateY(max(var(--lc-sl-title-top), calc(50dvh - 50%)))`，`50dvh` 取代 `wrapperH`、`50%` 取代 `offsetHeight`，數學上與 JS 版一對一等價，且兩端都還是 `transform`、**保留 0.5s 揭露轉場**（改用 flex `margin: auto` 則會失去轉場，不可行）。尚未採用的原因有二，需實機驗過再換：① 兩端都是含 `%` 的 `calc`/`max` 時，iPadOS WebKit 的 transform interpolation 可能退化成瞬跳；② `100dvh` 不保證等於 `.lc-sl` 的 `clientHeight`。

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

### Reka `CheckboxIndicator` 預設「勾選才 render」——會讓卡片文字在勾選瞬間重排

- **症狀**：result 側欄的居住條件卡片，一勾選文字就從完整變成截斷／從一行變兩行，卡片高度跟著跳動。
- **原因**：`CheckboxIndicator` 內部包 `Presence`，`present = forceMount || state === true`，**預設未勾選時整個節點不存在**。它是 flex 的一個 item（16px + gap 5 = **21px**），所以勾選前後 label 的可用寬度差 21px。
- **修法**：加 `force-mount`，改用 CSS 依 `data-state` 隱藏（`&[data-state='unchecked'] { visibility: hidden; }`）——`visibility` 保留盒子，`display:none` 不行。`data-state` 由 Reka 的 `getState()` 產生，值為 `checked` / `unchecked` / `indeterminate`。
- **位置**：[ExploreSidebar.vue](../app/components/03.result/ExploreSidebar.vue) 的 `CheckboxIndicator`、`StepResult.scss` 的 `&__card-x`。
- **延伸（取捨，不是 bug）**：預留這 21px 是有代價的——MOB 兩欄下 label 可用寬 ＝ `(viewport - 32 - 12) / 2 - 20 - 21`，故 414px（Figma 基準）得 144px、390px 得 132px、375px 得 124.5px。15px 的 CJK 每字剛好 15px，所以 **9 字 label（如「交通事故死傷率更低」＝135px）在 414 放得下、在 390/375 就會折行**且可能只剩一個字孤行。11 字的兩個 label（PM 0729 指名）已用 `LABEL_BREAK` 語意斷行（第 7 字後，對齊 Figma）；**9 字的三個刻意留給自然換行**——曾評估過「9 字也加語意斷行」，但那會讓 414px（設計稿基準）也變兩行，故決議不做，接受 390/375 折行＋可能孤字。文字在任何寬度都不會被截斷（`card-label` 已無 ellipsis），PM 的需求成立。若日後 PM 反應窄機型的孤字，再加 `LABEL_BREAK` 條目即可，不需動 CSS。

## figma（設計稿量測 / MCP `get_metadata`、REST `/nodes`）

### 旋轉過的 instance，回傳的 `x`/`y` 是「旋轉後的原點角」，不是 bounding box 左上角

- **症狀**：量「左右按鈕」這種靠 180° 旋轉做出反向鏡像的成對元件時，兩顆鈕的座標完全不成對——例如 prev 回 `x=10 y=152`，next 回 `x=76 y=182`，看起來 next 既右移 66 又下移 30，跟畫面上「兩顆同高並排、間距 6px」對不起來。`width`/`height` 還會帶一串浮點尾數（`30.000002622682587`）。
- **原因**：`x`/`y` 來自節點的 `relativeTransform`（平移分量），也就是**套用旋轉後的局部原點**落在父座標系的位置。轉 180° 時局部原點是原本的右下角，所以回傳值＝bounding box 的**右下角**。浮點尾數就是旋轉矩陣的殘差，可直接視為整數。
- **修法**：看到座標「不成對」或 `width`/`height` 帶浮點尾數，先假設它被旋轉：轉 180° 時 bbox 左上 ＝ `(x - width, y - height)`。上例 next 實為 `x=46 y=152`，於是 prev `10..40`、next `46..76`，間距 6px、同一 `y`，與畫面一致。必要時用 `get_screenshot` 目視覆核，別直接把回傳座標當 CSS `left`/`top`。
- **位置**：實作 `lc-sr__paddle`（`< 375` 斷點，設計稿 `633-20327` / `633-22551`）時踩到；見 `app/components/03.result/StepResult.scss` 的 `&__paddle`。

## fonts（字型 / `@nuxtjs/google-fonts`，`nuxt.config.ts`）

### `@nuxtjs/google-fonts` 的 self-host（`download`/`outputDir`）模式會把 CJK 字型「塌縮」成豆腐字

- **症狀**：開了 self-host（設 `outputDir`）後，中文大量變 **豆腐字（口口口）**，比不載字型還糟。
- **原因**：CJK 被 Google 切成上百個 unicode-range 分片，此模組下載時全塌縮成同一個 `*-text.woff2`（只剩約 250 字）；缺字依 `unicode-range` 語意不 fallback，直接 render notdef。
- **修法**：不要開 self-host，用 runtime `<link>`：`googleFonts: { download: false, preconnect: true }`。真要自架須改 `@nuxt/fonts` 或 `cn-font-split` 靜態子集。
- **位置**：`nuxt.config.ts` 的 `googleFonts`。

## video（主視覺背景影片，`app/components/01.location/`）

### `<source>` 選中 webm 後解碼失敗**不會**退回 mp4——WebKit 上等於整支影片死掉

- **症狀**：首屏主視覺影片在 MacBook Safari、iPhone Safari／Chrome（iOS Chrome 也是 WebKit）不自動播放，畫面停在 poster 並疊一顆 WebKit 原生播放鍵；桌機 Chrome／Firefox 正常。
- **原因**：兩層疊加。
  1. `<source type="video/webm">` 只寫容器不寫 codecs 時，WebKit 的 `canPlayType` 會回 `"maybe"` → 資源選擇演算法**挑中 webm 就定案**。之後若 VP9 影格解不出來（容器解析成功、解碼才失敗 → `MEDIA_ERR_DECODE`＝3），規格上**不會**為 decode 失敗退回下一個 `<source>`，直接卡死。iOS 對 WebM `<video>` 播放的支援很晚才有，且 SE2（A13）沒有 VP9 硬解。
  2. WebKit 擋下 autoplay 後（背景分頁開啟、視窗未聚焦、Low Power Mode、Safari 站台「永不自動播放」）**不會自己重試**，`play()` 的 rejection 若被吞掉就永久停在封面。
- **修法**：
  - webm 的 `type` 寫明 `codecs="vp9"`（不支援者直接跳過）；mp4 的 `type` 反而**要留裸容器** `video/mp4`，才能永遠當候選。
  - 補上規格缺的 fallback：監聽 `<video>` 的 `error`，手動把 `el.src` 指到同斷點 mp4 再 `load()`。注意 **`src` 屬性優先於 `<source>`**，之後跨斷點換片必須自己再設 `el.src`，`load()` 不會回頭重挑 `<source>`。
  - `play()` 被拒時標記狀態並在「回前景 / `canplay` / 使用者第一次 `pointerdown`」重試（user gesture 內幾乎必成功）。
- **位置**：[StepLocation.vue](../app/components/01.location/StepLocation.vue) 的 `<video>`、[StepLocation.logic.ts](../app/components/01.location/StepLocation.logic.ts) 的 `playVisual` / `onVisualError` / `retryVisual`。
- **延伸**：影片設 `pointer-events: none`（讓點擊穿透到下方內容）時，autoplay 被擋後**連那顆原生播放鍵都點不到**，等於沒有救援路徑。故只在被擋時加 `lc-sl__visual--blocked` 暫時開放點擊。
- **診斷**：實機（iOS 用 Mac Safari 的 Web Inspector 連線）看 `video.currentSrc`（選到 webm 還是 mp4）、`video.error?.code`（3=DECODE、4=SRC_NOT_SUPPORTED）、`play()` rejection 的 `err.name`（`NotAllowedError`＝政策擋下）。兩者要分清楚，修法完全不同。
