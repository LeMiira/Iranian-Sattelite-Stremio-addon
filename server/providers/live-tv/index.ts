import { LiveChannel } from '../../types';

export const BUILTIN_CHANNELS: LiveChannel[] = [
  {
    id: 'bbc-persian',
    name: 'BBC Persian',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/BBC_Persian_logo.svg',
    category: 'News',
    streamUrl: 'https://iranintl-hls.live/live/index.m3u8', // Fallback/direct HLS or simulated live
    epgId: 'BBCPersian.uk',
    status: 'unknown',
  },
  {
    id: 'iran-international',
    name: 'Iran International',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/00/Iran_International_logo.svg',
    category: 'News',
    streamUrl: 'https://iranintl-hls.live/live/index.m3u8',
    epgId: 'IranInternational.ir',
    status: 'unknown',
  },
  {
    id: 'irib-tv1',
    name: 'IRIB TV 1',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/IRIB_TV1_logo.svg',
    category: 'General',
    streamUrl: 'http://live.telewebion.com/tv1/index.m3u8', // Standard telewebion format or alternative
    epgId: 'IRIBTV1.ir',
    status: 'unknown',
  },
  {
    id: 'irib-tv2',
    name: 'IRIB TV 2',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/IRIB_TV2_logo.svg',
    category: 'General',
    streamUrl: 'http://live.telewebion.com/tv2/index.m3u8',
    epgId: 'IRIBTV2.ir',
    status: 'unknown',
  },
  {
    id: 'irib-tv3',
    name: 'IRIB TV 3',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/IRIB_TV3_logo.svg',
    category: 'Sports',
    streamUrl: 'http://live.telewebion.com/tv3/index.m3u8',
    epgId: 'IRIBTV3.ir',
    status: 'unknown',
  },
  {
    id: 'irib-varzesh',
    name: 'IRIB Varzesh',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/IRIB_Varzesh_logo.svg',
    category: 'Sports',
    streamUrl: 'http://live.telewebion.com/varzesh/index.m3u8',
    epgId: 'IRIBVarzesh.ir',
    status: 'unknown',
  },
  {
    id: 'irib-nasim',
    name: 'IRIB Nasim',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/IRIB_Nasim_logo.svg',
    category: 'Entertainment',
    streamUrl: 'http://live.telewebion.com/nasim/index.m3u8',
    epgId: 'IRIBNasim.ir',
    status: 'unknown',
  },
  {
    id: 'irib-pooya',
    name: 'IRIB Pooya (Kids)',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/IRIB_Pooya_logo.svg',
    category: 'Kids',
    streamUrl: 'http://live.telewebion.com/pooya/index.m3u8',
    epgId: 'IRIBPooya.ir',
    status: 'unknown',
  },
  {
    id: 'irib-namayesh',
    name: 'IRIB Namayesh',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/8/87/IRIB_Namayesh_logo.svg',
    category: 'Movies',
    streamUrl: 'http://live.telewebion.com/namayesh/index.m3u8',
    epgId: 'IRIBNamayesh.ir',
    status: 'unknown',
  },
  {
    id: 'irib-ifilm',
    name: 'iFilm Persian',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/IFilm_logo.svg',
    category: 'Movies',
    streamUrl: 'http://live.telewebion.com/ifilm/index.m3u8',
    epgId: 'iFilm.ir',
    status: 'unknown',
  },
  {
    id: 'pmc',
    name: 'PMC Music',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fb/PMC_Logo.png',
    category: 'Music',
    streamUrl: 'http://185.105.101.5:8081/pmc/index.m3u8', // Public HLS stream url
    epgId: 'PMCTV.ir',
    status: 'unknown',
  },
  {
    id: 'gem-tv',
    name: 'GEM TV',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/GEM_TV_logo.svg',
    category: 'Entertainment',
    streamUrl: 'http://185.105.101.5:8081/gemtv/index.m3u8',
    epgId: 'GEMTV.ae',
    status: 'unknown',
  },
  {
    id: 'gem-drama',
    name: 'GEM Drama',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/5/52/GEM_Drama_logo.svg',
    category: 'Entertainment',
    streamUrl: 'http://185.105.101.5:8081/gemdrama/index.m3u8',
    epgId: 'GEMDrama.ae',
    status: 'unknown',
  },
  {
    id: 'gem-bollywood',
    name: 'GEM Bollywood',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/d/da/GEM_Bollywood_logo.svg',
    category: 'Movies',
    streamUrl: 'http://185.105.101.5:8081/gembollywood/index.m3u8',
    epgId: 'GEMBollywood.ae',
    status: 'unknown',
  }
];

export class LiveTvProvider {
  private channels: LiveChannel[] = [...BUILTIN_CHANNELS];

  getChannels(): LiveChannel[] {
    return this.channels;
  }

  setChannels(channels: LiveChannel[]) {
    this.channels = channels;
  }

  search(query: string): LiveChannel[] {
    const term = query.toLowerCase().trim();
    if (!term) return this.channels;
    return this.channels.filter(
      (ch) =>
        ch.name.toLowerCase().includes(term) ||
        (ch.category && ch.category.toLowerCase().includes(term))
    );
  }

  getChannelsByCategory(category: string): LiveChannel[] {
    if (category.toLowerCase() === 'all') return this.channels;
    return this.channels.filter((ch) => ch.category.toLowerCase() === category.toLowerCase());
  }

  getChannelById(id: string): LiveChannel | undefined {
    return this.channels.find((ch) => ch.id === id);
  }
}

export const liveTvProvider = new LiveTvProvider();
