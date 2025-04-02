// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      link: [
        { rel: "icon", type: "image/x-icon", href: "/img/favicon.ico" },
        // Preload fonts if any
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
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
    // Improve initial page load
    payloadExtraction: true,
  },
  modules: [
    "@nuxt/ui",
    "@nuxtjs/color-mode",
    "@formkit/auto-animate",
    "@nuxt/image",
  ],
  colorMode: {
    preference: "system", // default value of $colorMode.preference
    fallback: "light", // fallback value if the system preference can't be detected
    hid: "nuxt-color-mode-script",
    globalName: "__NUXT_COLOR_MODE__",
    componentName: "ColorScheme",
    classPrefix: "",
    classSuffix: "-mode",
    storageKey: "nuxt-color-mode",
  },
  css: ["~/assets/css/main.css"],
  components: {
    dirs: ["~/components", "~/components/MusicTable"],
  },
  runtimeConfig: {
    public: {
      dev: process.env.NODE_ENV === "development",
      API_URL: process.env.API_URL || "http://localhost:3000",
    },
  },
});