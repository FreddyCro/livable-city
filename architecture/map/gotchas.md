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
