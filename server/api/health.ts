import { defineEventHandler } from 'h3';
import { liveTvProvider } from '../providers/live-tv';
import { movieProviders } from '../providers/movies';
import { seriesProviders } from '../providers/series';
import { cache } from '../cache';
import { iptvService } from '../services/iptvService';

export default defineEventHandler(async (event) => {
  // Make sure we trigger IPTV channels load
  const channels = await iptvService.getAggregatedChannels();

  const providerStatuses: Record<string, string> = {};
  [...movieProviders, ...seriesProviders].forEach((prov) => {
    providerStatuses[prov.name] = prov.enabled ? 'active' : 'disabled';
  });

  const channelStats: Record<string, any> = {
    total: channels.length,
    custom: channels.filter(c => c.isCustom).length,
    builtin: channels.filter(c => !c.isCustom).length,
    online: channels.filter(c => c.status === 'online').length,
    offline: channels.filter(c => c.status === 'offline').length,
    unknown: channels.filter(c => c.status === 'unknown').length,
  };

  return {
    status: 'healthy',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    cache: cache.getStats(),
    providers: providerStatuses,
    channels: channelStats,
    iptvLastRefreshed: iptvService.getLastRefreshed()
  };
});
