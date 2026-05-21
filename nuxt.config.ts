// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

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
      include: ["earcut", "deck.gl", "@deck.gl/core", "@deck.gl/layers"],
    },
    plugins: [
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
  },
});
