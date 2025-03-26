// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  app: {
    head: {
      pageTransition: { name: "page", mode: "out-in" },
      layoutTransition: { name: "layout", mode: "out-in" },
      link: [
        { rel: "icon", type: "image/x-icon", href: "/img/favicon.ico" },
        // Preload fonts if any
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
      ],
    },
  },
  compatibilityDate: "2024-11-01",
  devtools: {
    enabled: true,
    timeline: {
      enabled: true,
    },
  },  
  experimental: {
    // Enable inlined styles
    inlineSSRStyles: true,
    // Improve initial page load
    payloadExtraction: true,
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
    // Optimize CSS loading
    build: {
      cssCodeSplit: true,
      cssMinify: true,
    },
  },
  modules: [
    "@nuxt/ui",
    "@nuxtjs/color-mode",
    "@nuxt/test-utils/module",
    "@formkit/auto-animate",
  ],
  css: [
    "~/assets/css/main.css",
    "~/assets/css/music-table.css"
  ],
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.ts',
    viewer: true,
    // Add exposeConfig for better optimization
    exposeConfig: true,
    // Enable JIT mode for faster compilation
    jit: true,
  },
  components: {
    dirs: [
      '~/components',
      '~/components/MusicTable'
    ]
  },
  runtimeConfig: {
    public: {
      dev: process.env.NODE_ENV === 'development',
      API_URL: process.env.API_URL || 'http://localhost:3000',
    },
  },
  ui: {
    icons: ['heroicons']
  }
});