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

    const host = event.node.req.headers.host || 'localhost:3000';
    const protocol = (event.node.req.headers['x-forwarded-proto'] as string) || 'http';
    const baseUrl = `${protocol}://${host}`;

    const streams: StremioStream[] = [];

    if (type === 'channel') {
      const allChannels = await iptvService.getAggregatedChannels();
      const ch = liveTvProvider.getChannelById(id);
      if (ch) {
        // Helper to add direct & proxied stream options
        const addStreamOptions = (titleName: string, targetUrl: string) => {
          // Direct Stream (Best for Desktop / Mobile Apps)
          streams.push({
            title: `🎥 ${titleName} | Direct Server`,
            url: targetUrl,
            behaviorHints: { notWebReady: false }
          });
          
          // Proxied Stream (Best for Browser players to bypass CORS / Mixed Content / PNA blocks)
          streams.push({
            title: `🛡️ ${titleName} | Web Proxy (CORS Bypass)`,
            url: `${baseUrl}/proxy?url=${encodeURIComponent(targetUrl)}`,
            behaviorHints: { notWebReady: false }
          });
        };

        // 1. Primary stream
        addStreamOptions(ch.name, ch.streamUrl);

        // 2. Builtin backup streams
        if (ch.fallbackUrls && ch.fallbackUrls.length > 0) {
          ch.fallbackUrls.forEach((furl, idx) => {
            addStreamOptions(`${ch.name} (Backup ${idx + 1})`, furl);
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
          addStreamOptions(`IPTV Mirror ${idx + 1} (${c.category})`, c.streamUrl);
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
