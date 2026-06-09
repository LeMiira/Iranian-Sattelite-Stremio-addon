# Live Persian TV & IPTV Integration

This document outlines the architecture, channels database, and EPG mapping logic for the Live TV module.

---

## 📺 Default Builtin Persian Channels

The addon includes a database of pre-configured Persian satellite channels:
1.  **News**: BBC Persian, Iran International.
2.  **General**: IRIB TV 1, IRIB TV 2.
3.  **Sports**: IRIB TV 3, IRIB Varzesh.
4.  **Movies & Serials**: IRIB Namayesh, iFilm Persian, GEM Bollywood.
5.  **Kids**: IRIB Pooya.
6.  **Entertainment**: IRIB Nasim, GEM TV, GEM Drama.
7.  **Music**: PMC Music.

These are defined statically in [live-tv/index.ts](file:///media/mira/Depo/miiiira/Iranian-Sattelite-Stremio-addon/server/providers/live-tv/index.ts) along with their default public streaming HLS links, category keys, and logos.

---

## 📥 Dynamic IPTV Aggregation

IPTV lists are loaded dynamically from:
1.  **Remote Lists**: Parsed via M3U links supplied in `M3U_URLS` (using `iptv-org` Fas list by default).
2.  **Custom Injectors**: Loaded via the `CUSTOM_CHANNELS` JSON environment variable.

### De-duplication Rule
If an IPTV channel uses the same streaming URL as a built-in channel or another loaded item, the M3U parser automatically filters it out to prevent cluttering the Stremio interface.

---

## 🗺️ Stremio Catalog and Genre Filtering

The Stremio catalog handler maps live channels based on their `category` attribute.
In Stremio, users can select a **Genre** dropdown to filter:
*   `All` (all channels combined)
*   `News`
*   `Entertainment`
*   `Sports`
*   `Movies`
*   `Kids`
*   `Music`
*   `Religious`
*   `General`

Selecting any category will call the `/catalog/channel/persian-live/genre={category}.json` endpoint which returns the matching meta previews.

---

## 📊 Stream Health & Status Indicators

The addon periodically monitors the health of stream URLs.
1.  **GET/Range Check**: Sends a GET request requesting only the first 1KB of data. This validates if the stream server is accepting HLS connections without consuming large data.
2.  **HEAD Request Check (Fallback)**: If the server fails to handle Byte Range requests, the checker sends a HEAD request to verify resource availability.
3.  **Caching Statuses**: Checks are throttled to run concurrently (max 10 parallel queries) to prevent overloading the system, and statuses are cached in Memory/Redis for **5 minutes**.

Status types display on the dashboard as:
*   🟢 `ONLINE` (Responsive stream URL)
*   🔴 `OFFLINE` (Connection failure, timeout, or 404/500 error)
*   🟡 `UNKNOWN` (Stream has not been checked yet)

---

## 📅 EPG (Electronic Program Guide) Ready

EPGs allow Stremio to show what is currently playing on each channel. Each channel object contains an `epgId` attribute (e.g. `BBCPersian.uk`, `GEMTV.ae`) matching standard XMLTV identifiers. 

In a future iteration, an XMLTV guide parser can easily map EPG schedules to the `description` or `videos` metadata array within the `/meta/channel/{id}.json` endpoint, allowing Stremio to display real-time TV schedules.
