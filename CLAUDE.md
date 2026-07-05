# CLAUDE.md

## Language

回答用繁體中文和英文，避免使用簡體字和中國慣用語。

## Memory

優先將 memory 存放在本專案的 `.claude/memory/` 目錄（`.claude\memory\`），而非全域 memory 目錄。MEMORY.md index 同樣存放於此目錄。

## Output Files

所有 skill 或任務產生的暫存、輸出檔案，優先寫入 `temp/` 目錄。若該子目錄不存在，先建立再寫入。

## Figma

- 設計稿來源：Figma「宜居城市指南_clone」（file key `4n4QX8IuoXVpcDe4yKUnPD`）。
  - 舊檔「宜居城市指南」（file key `5AQSXYi86R8w7bgzTjqnaU`）已不是現行來源。
- Figma personal access token 放在 `temp/figma-token.txt`（已 gitignore，不進 git）。它是給工具抓設計稿用的憑證，**不是 app 的 runtime 設定**，所以不放 `.env`。
- 取得設計內容時：若 Figma MCP 無法使用，改用 Figma REST API，例如
  `curl -H "X-Figma-Token: $(cat temp/figma-token.txt)" "https://api.figma.com/v1/files/<file_key>/nodes?ids=<node_id>"`。
- 注意：`/files/.../nodes` 這類讀檔 endpoint 是成本制限流，**不要短時間連續重試**，否則會被 429 並拉長冷卻時間。

## SCSS

### 命名

CSS / SCSS class 命名規範：

- 採用 **BEM**（Block-Element-Modifier）：`block__element--modifier`。
- **Block** 一律加 `lc-` 前綴（`lc` = livable-city），名稱用**縮寫**。
- 在 block 樣式定義的**上方加註解，寫出完整名稱**，方便對照縮寫。
- Element、Modifier 接在縮寫 block 之後（`lc-{block}__{element}--{modifier}`）。
- **BEM 最多一層 element**：巢狀結構用連字號延伸，不可疊兩個 `__`。
  - ✅ `block__list`、`block__list-item`
  - ❌ `block__list__item`

對照：`.location-selects` => `.lc-ls`（上方註解 `// location-selects`）。

### RWD

- RWD 寫在 BEM element 內部，用 `rwd-xxx` mixin 包住，不要按斷點把整份 scss 切成多區。
- 同一個 class 只定義一次，其各斷點樣式集中在同一處。

### 範例

```scss
// location-selects
.lc-ls {
  display: flex;
  gap: 12px;

  // location-selects__item
  &__item {
    width: 100%;

    // RWD 集中在 element 內，用 rwd-xxx mixin 包住
    @include rwd-md {
      width: 50%;
    }
  }

  // location-selects__item--disabled
  &__item--disabled {
    opacity: 0.5;
  }
}
```
