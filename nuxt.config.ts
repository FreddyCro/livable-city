// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  vite: {
    optimizeDeps: {
      include: ['earcut', 'deck.gl', '@deck.gl/core', '@deck.gl/layers'],
    },
    plugins: [
      {
        name: 'earcut-cjs-to-esm',
        apply: 'serve',
        transform(code: string, id: string) {
          if (/[/\\]earcut[/\\]src[/\\]earcut\.js/.test(id)) {
            const esm = code
              .replace("'use strict';", '')
              .replace('module.exports = earcut;', '')
              .replace('module.exports.default = earcut;', '')
              + '\nexport default earcut;\n';
            return { code: esm, map: null };
          }
        },
      },
    ],
  },
})
