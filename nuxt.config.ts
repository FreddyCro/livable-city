import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: ["reka-ui/nuxt"],

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

  vite: {
    optimizeDeps: {
      // vue-scrollto 為 CJS-only，預先 bundle 成 ESM 以提供 default export
      // （common-components 內部元件會 import 它）
      include: ["earcut", "deck.gl", "@deck.gl/core", "@deck.gl/layers", "vue-scrollto"],
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
