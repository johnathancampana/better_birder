const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/cdn\.download\.ams\.cornell\.edu\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "macaulay-media",
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    {
      urlPattern: /^https:\/\/api\.ebird\.org\/v2\/ref\/.*/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "ebird-taxonomy",
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
      },
    },
    {
      urlPattern: /^https:\/\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
      },
    },
  ],
});

module.exports = withPWA({ reactStrictMode: true });
