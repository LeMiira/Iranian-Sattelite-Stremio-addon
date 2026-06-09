// Stremio Addon Protocol Types

export interface StremioManifest {
  id: string;
  version: string;
  name: string;
  description?: string;
  logo?: string;
  background?: string;
  types: ('movie' | 'series' | 'channel' | 'tv' | 'other')[];
  resources: (string | { name: string; types: string[]; prefixes?: string[] })[];
  catalogs: StremioCatalogDefinition[];
  idPrefixes?: string[];
  behaviorHints?: {
    configurable?: boolean;
    configurationRequired?: boolean;
    adult?: boolean;
    p2p?: boolean;
  };
}

export interface StremioCatalogDefinition {
  type: string;
  id: string;
  name: string;
  extra?: {
    name: string;
    isRequired?: boolean;
    options?: string[];
    optionsLimit?: number;
  }[];
}

export interface StremioMetaPreview {
  id: string;
  type: 'movie' | 'series' | 'channel' | 'tv' | 'other';
  name: string;
  poster?: string;
  posterShape?: 'landscape' | 'portrait' | 'square';
  banner?: string;
  description?: string;
  background?: string;
}

export interface StremioCatalogResponse {
  metas: StremioMetaPreview[];
  cacheMaxAge?: number; // Cache-Control max-age in seconds
  staleRevalidate?: number;
  staleError?: number;
}

export interface StremioVideo {
  id: string;
  title: string;
  released: string;
  season?: number;
  episode?: number;
  thumbnail?: string;
  overview?: string;
  streams?: StremioStream[];
}

export interface StremioMetaDetail {
  id: string;
  type: 'movie' | 'series' | 'channel' | 'tv' | 'other';
  name: string;
  poster?: string;
  posterShape?: 'landscape' | 'portrait' | 'square';
  banner?: string;
  background?: string;
  logo?: string;
  description?: string;
  releaseInfo?: string;
  released?: string;
  runtime?: string;
  genres?: string[];
  cast?: string[];
  directors?: string[];
  writers?: string[];
  imdbRating?: string;
  videos?: StremioVideo[];
  behaviorHints?: {
    defaultVideoId?: string;
    hasAddonCatalog?: boolean;
  };
}

export interface StremioMetaResponse {
  meta: StremioMetaDetail;
  cacheMaxAge?: number;
  staleRevalidate?: number;
  staleError?: number;
}

export interface StremioStream {
  title: string;
  url?: string; // Direct HTTP/HLS stream URL
  externalUrl?: string; // Stream to open externally
  infoHash?: string; // Torrent info hash (hex)
  fileIdx?: number; // Torrent file index
  behaviorHints?: {
    bingeGroup?: string;
    notWebReady?: boolean;
    proxyHeaders?: {
      request?: Record<string, string>;
      response?: Record<string, string>;
    };
  };
}

export interface StremioStreamResponse {
  streams: StremioStream[];
  cacheMaxAge?: number;
  staleRevalidate?: number;
  staleError?: number;
}

export interface StremioSubtitle {
  id: string;
  url: string;
  lang: string; // ISO 639-2 lang code
}

export interface StremioSubtitleResponse {
  subtitles: StremioSubtitle[];
  cacheMaxAge?: number;
}

// Internal Provider and Service Types

export interface LiveChannel {
  id: string; // e.g. "bbc-persian" or "iptv:123"
  name: string;
  logo?: string;
  category: string; // e.g. "News", "Sports"
  streamUrl: string;
  fallbackUrls?: string[];
  isCustom?: boolean; // True if loaded from M3U_URLS or CUSTOM_CHANNELS
  epgId?: string;
  status: 'online' | 'offline' | 'unknown';
  lastChecked?: string;
}

export interface MediaProvider {
  id: string;
  name: string;
  type: 'movie' | 'series' | 'subtitles' | 'both';
  enabled: boolean;
  search(query: string, type: 'movie' | 'series'): Promise<StremioMetaPreview[]>;
  getStreams(id: string, type: 'movie' | 'series'): Promise<StremioStream[]>;
}
