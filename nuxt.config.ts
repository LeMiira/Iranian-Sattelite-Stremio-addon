// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },

  // Enable Pinia
  modules: ['@pinia/nuxt'],

  // App configurations
  app: {
    head: {
      title: 'Persian Satellite & IPTV Stremio Addon Dashboard',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { hid: 'description', name: 'description', content: 'Management dashboard for Persian Live TV and IPTV Stremio Addon' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap' }
      ]
    }
  },

  // Styling
  css: ['~/assets/css/index.css'],

  // Runtime config
  runtimeConfig: {
    redisUrl: process.env.REDIS_URL || '',
    m3uUrls: process.env.M3U_URLS || '',
    epgUrls: process.env.EPG_URLS || '',
    customChannels: process.env.CUSTOM_CHANNELS || '',
    public: {
      // client-accessible vars if any
    }
  },

  // Nitro config
  nitro: {
    preset: 'node-server',
    // We can specify route rules here if needed
  }
})
