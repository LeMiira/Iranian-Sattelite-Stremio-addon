import { defineEventHandler, createError } from 'h3';
import { StremioStreamResponse, StremioStream } from '../../types';
import { liveTvProvider } from '../../providers/live-tv';
import { iptvService } from '../../services/iptvService';
import { movieProviders } from '../../providers/movies';
import { seriesProviders } from '../../providers/series';

export default defineEventHandler(async (event) => {
  try {
    const rawPath = event.context.params?.path || '';
    if (!rawPath) {
      throw createError({ statusCode: 400, statusMessage: 'Bad Request: Missing path parameters' });
    }

    // Parse path and strip .json extension from the last segment
    const segments = rawPath.split('/');
    if (segments.length > 0) {
      const lastIndex = segments.length - 1;
      if (segments[lastIndex].endsWith('.json')) {
        segments[lastIndex] = segments[lastIndex].substring(0, segments[lastIndex].length - 5);
      }
    }

    const type = segments[0]; // 'channel', 'movie', 'series'
    const id = segments[1]; // channel ID or IMDb/TMDB ID

    const streams: StremioStream[] = [];

    if (type === 'channel') {
      const allChannels = await iptvService.getAggregatedChannels();
      const ch = liveTvProvider.getChannelById(id);
      if (ch) {
        // 1. Primary stream
        streams.push({
          title: `🎥 ${ch.name} | Server 1 (HLS/MP4)`,
          url: ch.streamUrl,
          behaviorHints: {
            notWebReady: false,
          }
        });

        // 2. Builtin backup streams
        if (ch.fallbackUrls && ch.fallbackUrls.length > 0) {
          ch.fallbackUrls.forEach((furl, idx) => {
            streams.push({
              title: `⚡ ${ch.name} | Backup Server ${idx + 1}`,
              url: furl,
              behaviorHints: {
                notWebReady: false,
              }
            });
          });
        }

        // 3. Search and include fuzzy-matched IPTV streams from aggregated lists
        const matchingIPTV = allChannels.filter((c) => {
          if (c.id === id) return false;
          if (c.streamUrl === ch.streamUrl) return false;
          if (ch.fallbackUrls?.includes(c.streamUrl)) return false;

          // Match by EPG ID
          if (c.epgId && ch.epgId && c.epgId.toLowerCase() === ch.epgId.toLowerCase()) return true;

          // Fuzzy match name
          const cleanCh = ch.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          const cleanC = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          return cleanCh === cleanC || cleanC.includes(cleanCh) || cleanCh.includes(cleanC);
        });

        matchingIPTV.forEach((c, idx) => {
          streams.push({
            title: `🌐 IPTV Option ${idx + 1} (${c.category})`,
            url: c.streamUrl,
            behaviorHints: {
              notWebReady: false,
            }
          });
        });
      }
    } else if (type === 'movie') {
      // Fetch movie streams from movie providers using Promise.allSettled()
      const fetchPromises = movieProviders.map(async (provider) => {
        try {
          if (provider.type === 'movie' || provider.type === 'both') {
            return await provider.getStreams(id, 'movie');
          }
          return [];
        } catch (err) {
          console.error(`[Stream] Movie provider ${provider.name} failed:`, err);
          return [];
        }
      });

      const results = await Promise.allSettled(fetchPromises);
      results.forEach((res) => {
        if (res.status === 'fulfilled') {
          streams.push(...res.value);
        }
      });
    } else if (type === 'series') {
      // Fetch series streams from series providers using Promise.allSettled()
      const fetchPromises = seriesProviders.map(async (provider) => {
        try {
          if (provider.type === 'series' || provider.type === 'both') {
            return await provider.getStreams(id, 'series');
          }
          return [];
        } catch (err) {
          console.error(`[Stream] Series provider ${provider.name} failed:`, err);
          return [];
        }
      });

      const results = await Promise.allSettled(fetchPromises);
      results.forEach((res) => {
        if (res.status === 'fulfilled') {
          streams.push(...res.value);
        }
      });
    }

    const response: StremioStreamResponse = {
      streams,
      cacheMaxAge: 1800, // 30 minutes cache
      staleRevalidate: 600,
    };

    return response;
  } catch (err: any) {
    console.error('[Stream Endpoint] Error:', err.message);
    return { streams: [] };
  }
});
