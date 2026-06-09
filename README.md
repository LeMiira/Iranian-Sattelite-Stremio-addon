# Persian Satellite & IPTV Stremio Addon

A production-ready Stremio addon built from scratch using Nuxt 3, TypeScript, Nitro, and Pinia. This addon aggregates Persian Live TV channels, compiles custom local/remote M3U IPTV playlists, supports movies and series stream scrapers, and manages subtitles, all controllable via a premium glassmorphic admin dashboard.

---

## 🌟 Primary Features

1. **Persian Live TV Catalog**: Access major Persian-language TV channels (BBC Persian, Iran International, IRIB channels, GEM Network, PMC, iFilm, and more).
2. **IPTV Aggregation**: Dynamic remote M3U parser which aggregates custom channel lists from environment variables, filtering duplicates.
3. **Fail-safe Providers Integration**: Modular movie/series providers using isolated fetch handlers wrapped in `Promise.allSettled()` to prevent individual website failure from affecting others.
4. **Interactive Dashboard**: Modern, vanilla CSS frontend built with Nuxt 3, Pinia state sync, stream validators, status metrics, and direct catalog search testing block.
5. **Flexible Deployment**: Ready-to-go Docker, Docker Compose, Vercel, and local Node.js setups.

---

## 🛠️ Technology Stack

*   **Framework**: Nuxt 3 (Vue 3, Vite build engine)
*   **State Management**: Pinia
*   **Language**: fully-typed TypeScript
*   **Validation**: Zod
*   **Caching**: Unified Memory cache + optional Redis integration (`ioredis`)
*   **Styling**: Vanilla CSS (Premium dark mode, glassmorphism, responsive grid)

---

## 🚀 Quick Start

### 1. Local Development

```bash
# Clone the repository
git clone <repo-url>
cd Iranian-Sattelite-Stremio-addon

# Install dependencies (without running postinstall scripts to bypass node version issues)
npm install --no-scripts

# Build Nuxt preparations
npx nuxi prepare

# Run development server
npm run dev
```

The server will be available at `http://localhost:3000`. You can access the **Admin Dashboard** directly in your browser.

*   Addon manifest URL for Stremio: `http://localhost:3000/manifest.json`

### 2. Docker Setup

Using Docker Compose is the recommended way to spin up the addon along with its Redis caching backend:

```bash
docker-compose up -d --build
```

---

## ⚠️ Troubleshooting Stremio Web (Browser Player)

If you are playing streams inside the **Stremio Web App** (`web.strem.io`) on Chrome/Firefox instead of the **Stremio Desktop App**, you may encounter browser-level security blocks:

1.  **Local Network Access / OpaqueResponseBlocking (ORB)**: Secure HTTPS sites (like `web.strem.io`) are blocked from communicating with local ports (`127.0.0.1:11470`) to check or stream HLS video manifests.
2.  **Lack of Native HLS**: Windows/Linux browsers do not play `.m3u8` playlists natively, forcing Stremio Web to route queries to the local engine which triggers PNA blocks.

### Resolution Steps:
*   **Best Experience**: Use the official **Stremio Desktop App** or **Stremio Mobile/TV Apps**. They play HLS natively, bypass all browser PNA/CORS rules, and streams load instantly.
*   **For Stremio Web Browser**: Install a browser extension like **"Native HLS Playback"** or **"Play HLS M3u8"** for Chrome/Firefox. This allows the browser to play `.m3u8` streams natively, disabling the local `127.0.0.1` engine request.
*   **Select Proxy Server**: Select the **`Web Proxy (CORS Bypass)`** stream option in Stremio. This routes HLS chunks through your secure addon proxy domain to comply with browser CORS and HTTPS protocols.

---

## 📚 Detailed Documentation

*   [Architecture Design](file:///media/mira/Depo/miiiira/Iranian-Sattelite-Stremio-addon/docs/ARCHITECTURE.md)
*   [Environment Variables Config](file:///media/mira/Depo/miiiira/Iranian-Sattelite-Stremio-addon/docs/ENVIRONMENT_VARIABLES.md)
*   [Live TV Catalog & EPG](file:///media/mira/Depo/miiiira/Iranian-Sattelite-Stremio-addon/docs/LIVE_TV.md)
*   [Movie & Series Providers](file:///media/mira/Depo/miiiira/Iranian-Sattelite-Stremio-addon/docs/PROVIDERS.md)
*   [Deployment Guidelines](file:///media/mira/Depo/miiiira/Iranian-Sattelite-Stremio-addon/docs/DEPLOYMENT.md)
