// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      pageTransition: { name: "page", mode: "out-in" },
      layoutTransition: { name: "layout", mode: "out-in" },
      link: [{ rel: "icon", type: "image/x-icon", href: "/img/favicon.ico" }],
    },
  },
  compatibilityDate: "2024-11-01",
  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },
  modules: [
    "@nuxt/ui",
    "@nuxtjs/color-mode",
    "@nuxt/test-utils/module",
    "@nuxtjs/tailwindcss",
  ],
  css: ["~/assets/css/main.css"],
});
