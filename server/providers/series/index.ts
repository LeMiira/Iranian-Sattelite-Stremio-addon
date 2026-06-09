import { StremioMetaPreview, StremioStream, MediaProvider } from '../../types';

export class PersianSeriesProvider implements MediaProvider {
  id = 'persian-series';
  name = 'Persian Series Hub';
  type: 'movie' | 'series' | 'both' = 'series';
  enabled = true;

  async search(query: string, type: 'movie' | 'series'): Promise<StremioMetaPreview[]> {
    return [];
  }

  async getStreams(id: string, type: 'movie' | 'series'): Promise<StremioStream[]> {
    try {
      // id will be in format: "imdb_id:season:episode", e.g. "tt0944947:1:1"
      const parts = id.split(':');
      const imdbId = parts[0];
      const season = parts[1] || '1';
      const episode = parts[2] || '1';
      
      console.log(`[SeriesHub] Fetching streams for series ${imdbId} S${season}E${episode}`);
      
      return [
        {
          title: `SeriesHub | S${season}E${episode} | 1080p | دوبله فارسی`,
          url: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4`,
        },
        {
          title: `SeriesHub | S${season}E${episode} | 720p | زیرنویس چسبیده`,
          url: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4`,
        }
      ];
    } catch (err) {
      console.error('[SeriesHub] Stream fetching failed:', err);
      return [];
    }
  }
}

export const seriesProviders = [
  new PersianSeriesProvider(),
];
