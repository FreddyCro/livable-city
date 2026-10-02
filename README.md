# 宜居城市指南（livable-city）

Nuxt 4 靜態站（`nuxt generate`），框架說明見 [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction)。

## 環境需求

| 工具 | 版本 | 說明 |
| --- | --- | --- |
| Node.js | **22 LTS 以上**（開發時使用 24.x） | Nuxt 4 要求 `^20.19.0 \|\| >=22.12.0`；`.nvmrc` 固定為 24，`nvm use` / `fnm use` 會自動切換。 |
| pnpm | **11.x**（`package.json` 的 `packageManager` 鎖定 `11.1.0`） | 專案只維護 `pnpm-lock.yaml`，**不要**用 npm / yarn / bun 安裝，否則 lockfile 會對不上。 |

安裝 pnpm 建議用 Node 內建的 Corepack，會自動讀取 `packageManager` 欄位抓到正確版本：

```bash
corepack enable
pnpm -v   # 應顯示 11.1.0
```

> Node 25+ 已不內建 Corepack，改用 `npm i -g corepack` 或 `npm i -g pnpm@11` 安裝。

## 安裝與開發

```bash
pnpm install       # 安裝依賴（postinstall 會跑 nuxt prepare）
cp .env.development.example .env
pnpm dev           # http://localhost:3000
```

## 建置

```bash
pnpm generate      # 產生純靜態檔（不需 Node server）
pnpm preview       # 本機預覽建置結果
```

`pnpm generate` 的輸出在 `.output/public/`，根目錄的 `dist/` 是指向它的 symlink（兩者內容相同，`dist/` 已 gitignore）。這一整包就是要放到主機的東西，上線不需要 `pnpm build` 或執行 Node。

## 部署

本專案是**純靜態站**，上線的東西就是 `pnpm generate` 產生的 `dist/`（即 `.output/public/`）整包，放到主機對應目錄即可，主機不需要 Node。三個環境、三種 `.env`：

| 環境 | 網址 | env 範本 | 部署 branch |
| --- | --- | --- | --- |
| staging | GitHub Pages | `.env.ghpage.example` | `staging` |
| nmdap（測試機） | `https://nmdap.udn.com.tw/test/livable_city_map/` | `.env.nmdap.example` | `nmdap` |
| production（正式站） | `https://vip.udn.com/newmedia/2026/livable_city_map/` | `.env.production.example` | `prod`、`prod-noindex` |

### 正式站（vip.udn.com）

把檔案放上 vip.udn.com 的是 IT，前端不會碰主機。IT 需要的是 `dist/`，取得方式兩種，產物相同：

1. **IT 自己 generate**：clone repo → `cp .env.production.example .env` → `pnpm install` → `pnpm generate` → 拿 `dist/`。
2. **直接拿部署 branch 的 `docs/`**：前端跑 `./deploy-gh.sh production` 後，`prod` / `prod-noindex` branch 的 `docs/` 就是上述 generate 的輸出，已經 commit 在 GitHub 上，不用再 build。

不論誰來 generate，兩個條件要滿足，否則線上會出問題：

- **`.env` 必須是 `.env.production.example` 的內容**：它決定 `app.baseURL`（由 `NUXT_URL` 的 pathname 推得）和 `APP_ASSETS_PATH`，用錯 env 子路徑下的 `_nuxt/` 資源會 404。
- **從已 commit 的 HEAD generate**：`public/data/*.json` 的 cache busting 版號 `DATA_VERSION` 取自 HEAD 的 git short SHA，有未 commit 的資料變更會沿用舊版號，回訪者吃到快取的舊資料。

`./deploy-gh.sh production` 會同時從同一個 HEAD 產出兩個 branch：

- **`prod-noindex`**：`robots: noindex, nofollow`，預上線 / 內部驗收用。
- **`prod`**：`robots: index, follow`，正式對外開放。

兩者除了每頁 HTML 的 `<meta name="robots">` 之外完全相同（script 最後會自動 diff 驗證）。預上線先放 `prod-noindex`，確認沒問題後換成 `prod`；**換版後要 purge CDN 快取**，否則 edge 可能繼續吐快取的 noindex HTML。若 IT 走方式 1 自己 generate，noindex 版對應的 env 是 `.env.production-noindex.example`（只多一行 `NUXT_PUBLIC_NOINDEX=1`）。

script 開頭註解有完整步驟說明，陷阱整理在 [architecture/gotchas.md](architecture/gotchas.md)。

### 測試機 / staging

```bash
./deploy-gh.sh nmdap      # 推 nmdap branch，docs/ 即測試機要放的 dist/
./deploy-gh.sh staging    # 推 staging branch，GitHub Pages 以 docs/ 為根目錄發佈
```

## Data Scripts

### scripts/extract-metadata.mjs

從 `sources/tw-towns-simplified.json` 拆出兩個供瀏覽器載入的檔案：

- `public/tw-towns-optimized.json` — 精簡版 TopoJSON，geometry 只保留 `TOWNCODE` / `COUNTYCODE`
- `public/tw-towns-meta.json` — 名稱對照表 `{ towns: { [TOWNCODE]: ... }, counties: { [COUNTYCODE]: ... } }`

```bash
node scripts/extract-metadata.mjs
```

> 修改了 `sources/tw-towns-simplified.json` 之後重跑即可更新。

---

### scripts/process-xlsx.mjs

讀取 `sources/xlsx/` 下所有 xlsx 檔，依照檔名前綴（如 `1-2`）輸出至 `public/data/[編號].json`。

每個 xlsx 的格式：第一列為表頭，資料列為 `縣市 | 鄉鎮市區 | 數值`。  
輸出 JSON 以 TOWNSCODE 為 key，例如：

```json
{ "65000010": 28500, "65000020": 31000, ... }
```

```bash
node scripts/process-xlsx.mjs
```

> 新增或修改 `sources/xlsx/` 內的 xlsx 後重跑即可。未能對應到 TOWNSCODE 的列會印出警告。
