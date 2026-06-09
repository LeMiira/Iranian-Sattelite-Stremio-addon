# Movie, Series & Subtitle Providers

This document explains the stream provider abstraction layer used to resolve streaming links and subtitles for movies and TV series.

---

## 🔌 MediaProvider Abstraction

Every movie or series provider must implement the `MediaProvider` interface:

```typescript
export interface MediaProvider {
  id: string;
  name: string;
  type: 'movie' | 'series' | 'both';
  enabled: boolean;
  search(query: string, type: 'movie' | 'series'): Promise<StremioMetaPreview[]>;
  getStreams(id: string, type: 'movie' | 'series'): Promise<StremioStream[]>;
}
```

By decoupling providers into isolated modules, we can append new sites, trackers, or scrapers without modifying the core server logic.

---

## 🎬 Configured Providers

1.  **UpTV Provider**: Scrapes Persian-dubbed and subbed movie assets from UpTV.
2.  **Film2Media Provider**: Scrapes direct MP4 and HLS streams for both series and movies from Film2Media.
3.  **Persian Stream Mapper**: Resolves standard English IMDb IDs (e.g. `tt1610192`) and maps them to Persian mirror links.
4.  **Persian Series Hub**: Resolves TV series episodes in the format `imdb_id:season:episode` (e.g., `tt14948834:1:1`).

---

## 🛡️ Error Insulation & Concurrency

When a user selects a video in Stremio, the addon queries all registered providers.
To maintain high responsiveness:
*   We run the queries concurrently using `Promise.allSettled()`.
*   We wrap each scraper call inside a `try-catch` block.
*   If a single provider crashes, times out, or gets blocked by cloudflare, it returns an empty array `[]`. Other providers continue working without interruption.

```
                  Stremio Stream Request
                            │
               ┌────────────┼────────────┐
               ▼            ▼            ▼
          [UpTV Prov]  [F2Media Prov]  [Mapper]
               │            │            │
            Success       Crash       Success
               │            │            │
               ▼            ▼            ▼
             Stream         []         Stream
               └────────────┼────────────┘
                            │
                            ▼
                   Merged Streams List
```

---

## 📝 Subtitles Resolution

Subtitles are resolved using the `SubtitlesProvider`. 
When a query arrives for an IMDb ID, the provider returns clean WebVTT/SRT URLs labeled with language code `fas` (Persian/Farsi). This displays automatically in the Stremio subtitles selector.
