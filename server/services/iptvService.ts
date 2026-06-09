import { LiveChannel } from '../types';
import { parseM3U } from '../utils/m3uParser';
import { cache } from '../cache';
import { liveTvProvider, BUILTIN_CHANNELS } from '../providers/live-tv';

const PLAYLIST_CACHE_KEY = 'iptv:aggregated_channels';
const HEALTH_CHECK_CACHE_KEY_PREFIX = 'iptv:health:';

export class IptvService {
  private isRefreshing = false;
  private lastRefreshed: Date | null = null;

  async getAggregatedChannels(forceRefresh = false): Promise<LiveChannel[]> {
    if (!forceRefresh) {
      const cached = await cache.get<LiveChannel[]>(PLAYLIST_CACHE_KEY);
      if (cached) {
        return cached;
      }
    }

    await this.refreshPlaylists();
    
    // Fallback if refresh fails
    const cached = await cache.get<LiveChannel[]>(PLAYLIST_CACHE_KEY);
    return cached || BUILTIN_CHANNELS;
  }

  async refreshPlaylists(): Promise<void> {
    if (this.isRefreshing) return;
    this.isRefreshing = true;
    console.log('[IPTV] Refreshing IPTV playlists...');

    try {
      const config = useRuntimeConfig();
      const m3uUrlsEnv = config.m3uUrls || '';
      
      const urls = m3uUrlsEnv
        .split(',')
        .map((url: string) => url.trim())
        .filter((url: string) => url.length > 0);

      let aggregated: LiveChannel[] = [...BUILTIN_CHANNELS];

      // Fetch remote playlists
      for (const url of urls) {
        try {
          console.log(`[IPTV] Fetching remote playlist: ${url}`);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (!res.ok) throw new Error(`Status ${res.status}`);
          const text = await res.text();
          
          const parsed = parseM3U(text);
          console.log(`[IPTV] Successfully parsed ${parsed.length} channels from ${url}`);
          
          aggregated = this.mergeChannels(aggregated, parsed);
        } catch (err: any) {
          console.error(`[IPTV] Failed to fetch playlist ${url}:`, err.message);
        }
      }

      // Parse custom channels from env JSON if defined
      const customChannelsEnv = config.customChannels;
      if (customChannelsEnv) {
        try {
          const parsedCustom = JSON.parse(customChannelsEnv) as LiveChannel[];
          if (Array.isArray(parsedCustom)) {
            aggregated = this.mergeChannels(aggregated, parsedCustom.map(c => ({
              ...c,
              isCustom: true,
              status: c.status || 'unknown'
            })));
            console.log(`[IPTV] Integrated ${parsedCustom.length} custom channels from config`);
          }
        } catch (err) {
          console.error('[IPTV] Failed to parse CUSTOM_CHANNELS JSON:', err);
        }
      }

      // Set inside our live tv provider
      liveTvProvider.setChannels(aggregated);
      
      // Save to cache (cache for 1 hour)
      await cache.set(PLAYLIST_CACHE_KEY, aggregated, 3600);
      
      this.lastRefreshed = new Date();
      console.log(`[IPTV] Aggregation complete. Total active channels: ${aggregated.length}`);
    } catch (err) {
      console.error('[IPTV] Playlist refresh error:', err);
    } finally {
      this.isRefreshing = false;
    }
  }

  private mergeChannels(base: LiveChannel[], extra: LiveChannel[]): LiveChannel[] {
    const urls = new Set(base.map(c => c.streamUrl));
    const merged = [...base];

    for (const channel of extra) {
      if (!urls.has(channel.streamUrl)) {
        merged.push(channel);
        urls.add(channel.streamUrl);
      }
    }
    return merged;
  }

  async checkStreamHealth(channel: LiveChannel): Promise<'online' | 'offline'> {
    const cacheKey = `${HEALTH_CHECK_CACHE_KEY_PREFIX}${channel.id}`;
    const cachedStatus = await cache.get<'online' | 'offline'>(cacheKey);
    if (cachedStatus) {
      return cachedStatus;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 seconds timeout for stream checks

      // Send a GET request with Range header to avoid fetching the whole stream
      const res = await fetch(channel.streamUrl, {
        method: 'GET',
        headers: {
          'Range': 'bytes=0-1024',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const status = res.ok || res.status === 206 ? 'online' : 'offline';
      
      // Cache stream status for 5 minutes
      await cache.set(cacheKey, status, 300);
      return status;
    } catch (err) {
      // Some servers fail on GET range, try HEAD as a fallback
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(channel.streamUrl, {
          method: 'HEAD',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const status = res.ok ? 'online' : 'offline';
        await cache.set(cacheKey, status, 300);
        return status;
      } catch (headErr) {
        await cache.set(cacheKey, 'offline', 300);
        return 'offline';
      }
    }
  }

  async checkAllStreamsHealth(): Promise<Record<string, 'online' | 'offline'>> {
    const channels = liveTvProvider.getChannels();
    const results: Record<string, 'online' | 'offline'> = {};

    // Use concurrency throttle to avoid flooding channels
    const batchSize = 10;
    for (let i = 0; i < channels.length; i += batchSize) {
      const batch = channels.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (ch) => {
          const status = await this.checkStreamHealth(ch);
          ch.status = status;
          ch.lastChecked = new Date().toISOString();
          results[ch.id] = status;
        })
      );
    }

    // Update aggregated cache with updated statuses
    await cache.set(PLAYLIST_CACHE_KEY, channels, 3600);
    return results;
  }

  getLastRefreshed(): string {
    return this.lastRefreshed ? this.lastRefreshed.toISOString() : 'Never';
  }
}

export const iptvService = new IptvService();
