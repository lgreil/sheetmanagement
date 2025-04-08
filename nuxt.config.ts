// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      link: [
        { rel: "icon", type: "image/x-icon", href: "/img/favicon.ico" },
        // Preload fonts
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
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
    '@nuxt/ui',
    '@nuxtjs/i18n',
    '@nuxtjs/color-mode',
    '@nuxt/image',
  ],
  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
    hid: "nuxt-color-mode-script",
    globalName: "__NUXT_COLOR_MODE__",
    componentName: "ColorScheme",
    classPrefix: "",
    storageKey: "nuxt-color-mode",
  },
  ui: {
    global: true,
    icons: ['heroicons', 'lucide'],
    colors: ['primary', 'secondary', 'accent', 'success', 'warning', 'error', 'info'],
    primary: 'blue',
    secondary: 'slate',
    accent: 'emerald',
    gray: 'slate',
    notifications: {
      // Notification system configuration
      position: 'top-right',
      duration: 5000,
    },
    button: {
      default: {
        size: 'md',
        color: 'primary',
        variant: 'solid',
      },
    },
    input: {
      default: {
        size: 'md',
        color: 'primary',
      },
    },
  },
  css: [
    '~/assets/css/main.css'
  ],
  components: {
    dirs: ["~/components", "~/components/MusicTable"],
  },
  runtimeConfig: {
    public: {
      dev: process.env.NODE_ENV === "development",
      API_URL: process.env.API_URL || "http://localhost:3000",
    },
  },
  i18n: {
    defaultLocale: 'de',
    locales: [{
      code: 'de',
      name: 'Deutsch',
    }, {
      code: 'en',
      name: 'English',
    }]
  },
});