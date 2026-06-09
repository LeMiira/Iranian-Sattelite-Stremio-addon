import { defineEventHandler, createError } from 'h3';
import { StremioSubtitleResponse } from '../../types';
import { subtitlesProvider } from '../../providers/subtitles';

export default defineEventHandler(async (event) => {
  try {
    const rawPath = event.context.params?.path || '';
    if (!rawPath) {
      throw createError({ statusCode: 400, statusMessage: 'Bad Request: Missing path parameters' });
    }

    const segments = rawPath.split('/');
    if (segments.length > 0) {
      const lastIndex = segments.length - 1;
      if (segments[lastIndex].endsWith('.json')) {
        segments[lastIndex] = segments[lastIndex].substring(0, segments[lastIndex].length - 5);
      }
    }

    const type = segments[0] as 'movie' | 'series';
    const id = segments[1]; // IMDb/TMDB ID or episode ID

    const subtitles = await subtitlesProvider.getSubtitles(id, type);

    const response: StremioSubtitleResponse = {
      subtitles,
      cacheMaxAge: 86400, // 24 hours cache
    };

    return response;
  } catch (err: any) {
    console.error('[Subtitles Endpoint] Error:', err.message);
    return { subtitles: [] };
  }
});
