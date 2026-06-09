# System Architecture Design

This document details the architectural layout, routing, and caching flow of the Persian Satellite & IPTV Stremio Addon.

---

## 🏛️ Directory Structure

```
/
├── app/                      # Nuxt 3 Client Dashboard
│   ├── app.vue               # Dashboard layout and UI logic
│   └── assets/
│       └── css/
│           └── index.css     # Premium Vanilla CSS style system
├── docs/                     # Technical specifications docs
├── public/                   # Static public assets
├── server/                   # Backend Server (Nitro Engine)
│   ├── api/                  # API and Stremio resource handlers
│   │   ├── manifest.json.ts  # Addon manifest endpoint
│   │   ├── catalog/          # Stremio catalog streams list
│   │   ├── meta/             # Detailed media info
│   │   ├── stream/           # Direct HLS/MP4 streams
│   │   ├── health.ts         # Addon health checker
│   │   ├── stats.ts          # Cache & memory stats exporter
│   │   └── providers.ts      # Active stream providers configuration
│   ├── cache/                # Cache service (In-memory + Redis)
│   ├── middleware/           # Nitro Stremio path rewriter middleware
│   ├── providers/            # Isolated movie, series, and live TV scrapers
│   ├── services/             # IPTV aggregation & health check services
│   ├── utils/                # M3U parser and helper functions
│   └── types/                # Strict TypeScript declaration types
├── stores/                   # Pinia State Management
│   └── dashboard.ts          # Frontend API state coordinator
├── tsconfig.json             # TypeScript configuration
├── nuxt.config.ts            # Nuxt framework configuration
├── vercel.json               # Vercel serverless mapping
├── Dockerfile                # Multi-stage production container definition
└── docker-compose.yml        # Orchestration containing application and Redis
```

---

## 🔀 Stremio Protocol Routing & Middleware Rewrite

The Stremio protocol requires resources to be fetched using exact path structures:
*   `GET /manifest.json`
*   `GET /catalog/{type}/{id}/{extra}.json`
*   `GET /stream/{type}/{id}.json`
*   `GET /meta/{type}/{id}.json`

Nuxt 3 routes anything in the `server/api/` folder under the `/api/` prefix (e.g. `/api/manifest.json`).
To adhere to the user directory specification while maintaining standard root domain installation for Stremio, we implemented a global Nitro middleware: [stremioRewriter.ts](file:///media/mira/Depo/miiiira/Iranian-Sattelite-Stremio-addon/server/middleware/stremioRewriter.ts).

```
Incoming Request               Rewrite Middleware                Target Nitro API
----------------               ------------------                ----------------
/manifest.json          ===>   Adds /api prefix   ===>    server/api/manifest.json.ts
/catalog/tv/live.json   ===>   Adds /api prefix   ===>    server/api/catalog/[...path].get.ts
/health                 ===>   Adds /api prefix   ===>    server/api/health.ts
```

We clean and strip any `.json` extensions inside the handlers manually so variables like `type` and `id` map properly.

---

## 🔒 Isolation and Fault Tolerance

Scrapers for movies and TV series websites are isolated into specific classes implementing the `MediaProvider` interface. When resolving streams, the stream coordinator runs all scrapers in parallel using `Promise.allSettled()`.

If one scraper crashes or encounters a connection timeout, the system absorbs the exception, logs it, and returns the results from the surviving scrapers. The addon never returns a 500 error due to a provider failure.

---

## ⚡ Caching Strategy

The system features a unified cache wrapper: [cache/index.ts](file:///media/mira/Depo/miiiira/Iranian-Sattelite-Stremio-addon/server/cache/index.ts).

1.  **Redis Cache (Recommended)**: If `REDIS_URL` is set, the system uses Redis to share caches across multiple serverless server instances (e.g. on Vercel) or docker nodes.
2.  **In-memory Cache (Fallback)**: If Redis is absent or fails to connect, the system falls back to a Javascript `Map` in memory.

**TTL (Time-To-Live) Policies**:
*   *M3U Playlist Aggregations*: Cached for **1 hour**.
*   *Stream Health Status*: Cached for **5 minutes** (prevents flooding streams during checks).
*   *Stremio Catalogs*: Cached for **10 minutes** via HTTP headers and local cache.
*   *Detailed Metadata*: Cached for **1 hour**.

---

## 🎛️ State Management (Pinia)

The Admin Dashboard relies on a unified Pinia store [stores/dashboard.ts](file:///media/mira/Depo/miiiira/Iranian-Sattelite-Stremio-addon/stores/dashboard.ts) to manage:
*   Fetch stats & health check results.
*   Filter state for channels table (category, search string).
*   Mock testing parameters (running real addon queries and displaying the JSON response tree directly in the panel).
