import { defineEventHandler, createError } from 'h3';
import { StremioCatalogResponse, StremioMetaPreview } from '../../types';
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

    // Split path and clean up the last segment by removing .json
    const segments = rawPath.split('/');
    if (segments.length > 0) {
      const lastIndex = segments.length - 1;
      if (segments[lastIndex].endsWith('.json')) {
        segments[lastIndex] = segments[lastIndex].substring(0, segments[lastIndex].length - 5);
      }
    }

    const type = segments[0]; // 'channel', 'movie', 'series'
    const catalogId = segments[1]; // e.g. 'persian-live', 'persian-movies', 'persian-series'
    const extraSegment = segments[2] || ''; // e.g. 'genre=News' or 'search=bbc'

    // Parse extra parameters (format is key=value)
    let genre: string | undefined;
    let searchQuery: string | undefined;

    if (extraSegment) {
      const equalIndex = extraSegment.indexOf('=');
      if (equalIndex !== -1) {
        const key = extraSegment.substring(0, equalIndex);
        const val = decodeURIComponent(extraSegment.substring(equalIndex + 1));
        if (key === 'genre') genre = val;
        if (key === 'search') searchQuery = val;
      }
    }

    // Ensure we trigger IPTV aggregation to populate liveTvProvider channels
    await iptvService.getAggregatedChannels();

    const metas: StremioMetaPreview[] = [];

    if (type === 'channel' && catalogId === 'persian-live') {
      let channels = liveTvProvider.getChannels();

      if (genre && genre !== 'All') {
        channels = liveTvProvider.getChannelsByCategory(genre);
      }

      if (searchQuery) {
        channels = liveTvProvider.search(searchQuery);
      }

      // Convert channels to StremioMetaPreview format
      for (const ch of channels) {
        metas.push({
          id: ch.id,
          type: 'channel',
          name: ch.name,
          poster: ch.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=256&h=256&q=80',
          posterShape: 'square',
          description: `Category: ${ch.category || 'General'} | Stream URL: ${ch.streamUrl.substring(0, 30)}...`,
        });
      }
    } else if (type === 'movie') {
      // Fetch movies from movies providers in parallel
      if (searchQuery) {
        const providerSearches = movieProviders.map(async (provider) => {
          try {
            return await provider.search(searchQuery!, 'movie');
          } catch (err) {
            console.error(`[Catalog] Movie provider ${provider.name} failed during search:`, err);
            return [];
          }
        });

        const results = await Promise.allSettled(providerSearches);
        results.forEach((res) => {
          if (res.status === 'fulfilled') {
            metas.push(...res.value);
          }
        });
      } else {
        // Return default featured Persian movies list
        metas.push(
          {
            id: 'tt0118843', // Children of Heaven (IMDb ID)
            type: 'movie',
            name: 'Children of Heaven (بچه‌های آسمان)',
            poster: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=300&h=450&q=80',
            description: 'Two siblings go on an adventure to find a lost pair of shoes in Tehran.',
          },
          {
            id: 'tt1610192', // A Separation
            type: 'movie',
            name: 'A Separation (جدایی نادر از سیمین)',
            poster: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=300&h=450&q=80',
            description: 'A married couple faced with a difficult decision to improve the life of their child.',
          }
        );
      }
    } else if (type === 'series') {
      if (searchQuery) {
        const providerSearches = seriesProviders.map(async (provider) => {
          try {
            return await provider.search(searchQuery!, 'series');
          } catch (err) {
            console.error(`[Catalog] Series provider ${provider.name} failed during search:`, err);
            return [];
          }
        });

        const results = await Promise.allSettled(providerSearches);
        results.forEach((res) => {
          if (res.status === 'fulfilled') {
            metas.push(...res.value);
          }
        });
      } else {
        // Default featured Persian series
        metas.push(
          {
            id: 'tt14948834', // Shahrzad
            type: 'series',
            name: 'Shahrzad (شهرزاد)',
            poster: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=300&h=450&q=80',
            description: 'A romantic historical drama series set in Tehran in the 1950s.',
          }
        );
      }
    }

    const response: StremioCatalogResponse = {
      metas,
      cacheMaxAge: 600, // 10 minutes cache
      staleRevalidate: 300,
    };

    return response;
  } catch (err: any) {
    console.error('[Catalog Endpoint] Error:', err.message);
    return { metas: [] };
  }
});
