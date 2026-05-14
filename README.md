# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

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
