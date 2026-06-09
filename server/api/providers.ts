import { defineEventHandler } from 'h3';
import { movieProviders } from '../providers/movies';
import { seriesProviders } from '../providers/series';
import { subtitlesProvider } from '../providers/subtitles';

export default defineEventHandler((event) => {
  const providers = [
    ...movieProviders.map((p) => ({
      id: p.id,
      name: p.name,
      type: 'movie',
      enabled: p.enabled,
    })),
    ...seriesProviders.map((p) => ({
      id: p.id,
      name: p.name,
      type: 'series',
      enabled: p.enabled,
    })),
    {
      id: 'fa-subtitles',
      name: 'Persian Subtitles Provider',
      type: 'subtitles',
      enabled: true,
    }
  ];

  return {
    count: providers.length,
    providers,
  };
});
