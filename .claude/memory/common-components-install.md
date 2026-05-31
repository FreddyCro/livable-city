---
name: common-components-install
description: 安裝 @udn-digital-center/common-components（header/footer）的兩個必踩雷區與解法
metadata:
  type: reference
---

`@udn-digital-center/common-components` 直接發佈原始碼（.vue/.ts/.scss），安裝時有兩個會卡住 `pnpm dev` 的非顯而易見問題：

1. **`vue-scrollto` 必須裝成直接相依**（決定性解法）。套件內部 import CJS-only 的 `vue-scrollto`，它只是間接相依（在 `.pnpm/` 裡），Vite `optimizeDeps` 無法預打包 → 瀏覽器 `does not provide an export named 'default'`。解法：`pnpm add vue-scrollto` **＋** `nuxt.config` 的 `vite.optimizeDeps.include` 加 `"vue-scrollto"`。**不要**用 `build.transpile` 包這個套件（反而讓內部 vue-scrollto import 不被預打包）。

2. **pnpm 11 build script 放行（`vue-demi`）**。`@vueuse/core@8` 帶 `vue-demi`（有 postinstall），pnpm 11 預設擋下 → `ERR_PNPM_IGNORED_BUILDS` → `pnpm install` exit 1 → `pnpm dev` pre-run 檢查失敗。放行清單在 **`pnpm-workspace.yaml` 的 `allowBuilds:`**（不是 package.json 的 `pnpm.onlyBuiltDependencies`，pnpm 11.1.0 不讀）。設 `vue-demi: false`。

改了 `optimizeDeps` 後要 `rm -rf node_modules/.vite .nuxt` 再重啟 dev。

完整指南：`temp/common-components-setup.md`（含 share util / locale keys / 元件清單）。

**Why:** 這兩點都不在套件文件裡，且錯誤訊息（default export / ERR_PNPM_IGNORED_BUILDS）不會直接指向「vue-scrollto 要直接裝」「放行清單在 workspace yaml」。
**How to apply:** 之後在本專案或其他 Nuxt4 + pnpm11 專案裝這個套件，照上述兩步處理即可。