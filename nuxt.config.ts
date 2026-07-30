import { execSync } from "node:child_process";
import tailwindcss from "@tailwindcss/vite";

// 資料版本（cache busting）：public/ 底下的資產（data/*.json、tw-towns-*.json）
// 不像 _nuxt/ 的 build assets 會帶 content hash，換了內容 URL 仍相同 →
// 瀏覽器／CDN 會繼續給舊檔（換資料時最容易中）。故在 build 時算出一個版本字串，
// 由 dataSource 以 `?v=` 附加到每個 public 資產請求上，讓每次部署自然換 URL。
//
// 取 git short SHA（每次 commit 必變、同一版重 build 仍命中快取）；
// 無 git 環境（CI shallow copy / zip 部署）退回 build 時間戳。
// 可用 NUXT_PUBLIC_DATA_VERSION 覆寫；⚠️ 設成空字串等於關閉 cache busting。
const dataVersion = (() => {
  try {
    return execSync("git rev-parse --short HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return String(Date.now());
  }
})();

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: ["reka-ui/nuxt", "nuxt-jsonld", "@nuxtjs/google-fonts"],

  // 元件掃描：三個 step 目錄加 01/02/03 編號前綴（對齊流程順序），
  // pathPrefix: false 讓「目錄名（含編號）不進入 component 名稱」，
  // 故 StepLocation / StepCriteria / StepResult 名稱不變，各自的專屬子元件
  // （SelectDropdown、IconArrow、InfoContent）也以無前綴短名註冊。
  // 最後的 "~/components" 沿用預設前綴規則（ui/ → Ui*、AppHeader…）。
  components: [
    { path: "~/components/01.location", pathPrefix: false },
    { path: "~/components/02.criteria", pathPrefix: false },
    { path: "~/components/03.result", pathPrefix: false },
    "~/components",
  ],

  css: [
    "~/assets/styles/theme.css", // 色彩 token（CSS 變數，data-theme 切換）；需早於使用它的樣式
    "~/assets/styles/tailwind.css",
    "~/assets/styles/base.scss",
  ],

  // 讓區網設備可以使用，例如手機
  // devServer: {
  //   host: "0.0.0.0",
  //   port: 3000,
  // },

  ssr: true,

  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: false,
    },
  },

  runtimeConfig: {
    public: {
      APP_MODE: "",
      APP_ASSETS_PATH: "",
      // public/ 靜態資料的 cache busting 版本（見檔案頂端 dataVersion）
      DATA_VERSION: dataVersion,
    },
  },

  app: {
    baseURL: (() => {
      const nuxtUrl = process.env.NUXT_URL;
      if (!nuxtUrl) return "/";
      try {
        return new URL(nuxtUrl).pathname;
      } catch {
        return "/";
      }
    })(),
  },

  // 字型：app 全域宣告 Noto Sans TC（base.scss），外部選單 NmdMenu 用 Noto Serif TC。
  // 專案先前未載入任何字型檔 → 各裝置各自 fallback 到系統字型（iOS 選單落到宋體、Windows 新細明體…），
  // 造成「同一畫面在不同裝置字體跑掉」。此處以 @nuxtjs/google-fonts 載入，確保跨裝置一致。
  // weight 依 app 實際用量：Sans 300/400/500/600/700（app 預設字型）、Serif 600（選單項目）。
  //
  // ⚠️ 不要開 self-host（download / outputDir）：@nuxtjs/google-fonts 的下載模式對 CJK 會把
  //   Google 上百個中文分片全塌縮成一個「僅約 250 字」的小 woff2，缺字依 unicode-range 語意不會
  //   fallback 而是直接變豆腐字（實測「宜居城市指南」6 字全缺）。故用 runtime <link> 模式：
  //   download:false → 瀏覽器向 Google 依 unicode-range 按需抓分片，CJK 完整且只載實際用到的字。
  //   （runtime <link> 走 Google 絕對網址，不受本站 sub-path 影響，無 baseURL 問題。）
  googleFonts: {
    families: {
      "Noto+Sans+TC": [300, 400, 500, 600, 700],
      "Noto+Serif+TC": [600],
    },
    display: "swap",
    download: false,
    preconnect: true,
  },

  vite: {
    optimizeDeps: {
      // 預先 pre-bundle，避免 dev 期間「runtime 才發現依賴」觸發整頁 reload。
      // vue-scrollto 為 CJS-only，預先 bundle 成 ESM 以提供 default export
      // （common-components 內部元件會 import 它）。
      // common-components / topojson-client 是延遲載入（AppHeader / useTaiwanMap），
      // Vite 初掃描不到，故明確列入。
      include: [
        "earcut",
        "deck.gl",
        "@deck.gl/core",
        "@deck.gl/layers",
        "vue-scrollto",
        "@udn-digital-center/common-components",
        "topojson-client",
      ],
    },
    plugins: [
      tailwindcss(),
      {
        name: "earcut-cjs-to-esm",
        apply: "serve",
        transform(code: string, id: string) {
          if (/[/\\]earcut[/\\]src[/\\]earcut\.js/.test(id)) {
            const esm =
              code
                .replace("'use strict';", "")
                .replace("module.exports = earcut;", "")
                .replace("module.exports.default = earcut;", "") +
              "\nexport default earcut;\n";
            return { code: esm, map: null };
          }
        },
      },
    ],
    css: {
      preprocessorOptions: {
        scss: {
          // common-components 的每個 index.scss 是各自的編譯進入點，且用相對路徑 @import，
          // quietDeps 不涵蓋這種情況，故直接關閉 import 棄用類別。
          // （自家 assets/styles 用 @use，不受影響；保留 quietDeps 壓其餘 deps 警告。）
          quietDeps: true,
          silenceDeprecations: ["import"],
          additionalData: `
            @use "@/assets/styles/mixins.scss" as *;
            @use "@/assets/styles/variables.scss" as *;
          `,
        },
      },
    },
  },
});
