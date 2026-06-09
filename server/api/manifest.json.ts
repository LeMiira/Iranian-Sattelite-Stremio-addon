import { defineEventHandler } from 'h3';
import { StremioManifest } from '../types';

export default defineEventHandler((event) => {
  const config = useRuntimeConfig();

  const manifest: StremioManifest = {
    id: 'com.lemiira.persian-satellite-addon',
    version: '1.0.0',
    name: 'Persian Satellite & IPTV Addon',
    description: 'Live Persian TV channels, movies & series, subtitles, and customizable IPTV playlist aggregation.',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=256&h=256&q=80', // Premium visual placeholder
    types: ['channel', 'movie', 'series'],
    resources: ['catalog', 'meta', 'stream', 'subtitles'],
    catalogs: [
      {
        type: 'channel',
        id: 'persian-live',
        name: 'Persian Live TV',
        extra: [
          {
            name: 'search',
            isRequired: false
          },
          {
            name: 'genre',
            isRequired: false,
            options: ['All', 'News', 'Entertainment', 'Sports', 'Movies', 'Kids', 'Music', 'Religious', 'General']
          }
        ]
      },
      {
        type: 'movie',
        id: 'persian-movies',
        name: 'Persian Movies',
        extra: [
          {
            name: 'search',
            isRequired: false
          }
        ]
      },
      {
        type: 'series',
        id: 'persian-series',
        name: 'Persian TV Series',
        extra: [
          {
            name: 'search',
            isRequired: false
          }
        ]
      }
    ],
    idPrefixes: ['iptv:', 'bbc-', 'iran-', 'irib-', 'pmc', 'gem-', 'tt'],
    behaviorHints: {
      configurable: true,
      configurationRequired: false
    }
  };

  return manifest;
});
