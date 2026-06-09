import { defineEventHandler, createError } from 'h3';
import { StremioMetaResponse, StremioMetaDetail } from '../../types';
import { liveTvProvider } from '../../providers/live-tv';
import { iptvService } from '../../services/iptvService';

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
    const id = segments[1]; // e.g. 'bbc-persian' or 'tt0118843'

    let meta: StremioMetaDetail | null = null;

    if (type === 'channel') {
      await iptvService.getAggregatedChannels();
      const ch = liveTvProvider.getChannelById(id);
      if (ch) {
        meta = {
          id: ch.id,
          type: 'channel',
          name: ch.name,
          poster: ch.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=256&h=256&q=80',
          posterShape: 'square',
          banner: 'https://images.unsplash.com/photo-1574375927938-d5a98e8fed85?auto=format&fit=crop&w=800&h=300&q=80',
          description: `Persian Live TV channel under Category: ${ch.category || 'General'}. Stream is continuously monitored for health.`,
          background: 'https://images.unsplash.com/photo-1574375927938-d5a98e8fed85?auto=format&fit=crop&w=800&h=300&q=80',
        };
      }
    } else if (type === 'movie') {
      // Mock static details for standard IDs
      if (id === 'tt0118843') {
        meta = {
          id: 'tt0118843',
          type: 'movie',
          name: 'Children of Heaven (بچه‌های آسمان)',
          poster: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=300&h=450&q=80',
          banner: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=800&h=300&q=80',
          description: 'A young boy loses his sister\'s shoes and they decide to share his shoes in secret, alternating them to go to school.',
          releaseInfo: '1997',
          released: '1997-08-01',
          runtime: '89 min',
          genres: ['Drama', 'Family'],
          cast: ['Amir Farrokh Hashemian', 'Bahare Seddiqi'],
          directors: ['Majid Majidi'],
          imdbRating: '8.2',
        };
      } else if (id === 'tt1610192') {
        meta = {
          id: 'tt1610192',
          type: 'movie',
          name: 'A Separation (جدایی نادر از سیمین)',
          poster: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=300&h=450&q=80',
          banner: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=800&h=300&q=80',
          description: 'A married couple faced with a difficult decision to improve the life of their child, leading to unexpected legal and moral struggles.',
          releaseInfo: '2011',
          released: '2011-03-16',
          runtime: '123 min',
          genres: ['Drama', 'Mystery'],
          cast: ['Peyman Moaadi', 'Leila Hatami'],
          directors: ['Asghar Farhadi'],
          imdbRating: '8.3',
        };
      }
    } else if (type === 'series') {
      if (id === 'tt14948834') {
        meta = {
          id: 'tt14948834',
          type: 'series',
          name: 'Shahrzad (شهرزاد)',
          poster: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=300&h=450&q=80',
          banner: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=800&h=300&q=80',
          description: 'Love story of Shahrzad and Farhad, set during the coup d\'etat in 1953 Iran.',
          releaseInfo: '2015-2018',
          genres: ['Drama', 'Romance', 'History'],
          imdbRating: '8.0',
          videos: [
            {
              id: 'tt14948834:1:1',
              title: 'Episode 1',
              season: 1,
              episode: 1,
              released: '2015-10-14',
            },
            {
              id: 'tt14948834:1:2',
              title: 'Episode 2',
              season: 1,
              episode: 2,
              released: '2015-10-21',
            }
          ]
        };
      }
    }

    if (!meta) {
      throw createError({ statusCode: 404, statusMessage: 'Meta not found' });
    }

    const response: StremioMetaResponse = {
      meta,
      cacheMaxAge: 3600, // 1 hour cache
    };

    return response;
  } catch (err: any) {
    console.error('[Meta Endpoint] Error:', err.message);
    throw createError({ statusCode: err.statusCode || 500, statusMessage: err.statusMessage || 'Internal Server Error' });
  }
});
