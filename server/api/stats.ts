import { defineEventHandler } from 'h3';
import { liveTvProvider } from '../providers/live-tv';
import { cache } from '../cache';
import { iptvService } from '../services/iptvService';

export default defineEventHandler(async (event) => {
  const channels = await iptvService.getAggregatedChannels();
  const mem = process.memoryUsage();
  
  return {
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    memory: {
      rss: Math.round(mem.rss / 1024 / 1024) + ' MB',
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024) + ' MB',
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + ' MB',
      external: Math.round(mem.external / 1024 / 1024) + ' MB',
    },
    cache: cache.getStats(),
    channels: {
      total: channels.length,
      online: channels.filter(c => c.status === 'online').length,
      offline: channels.filter(c => c.status === 'offline').length,
      unknown: channels.filter(c => c.status === 'unknown').length,
      custom: channels.filter(c => c.isCustom).length,
      builtin: channels.filter(c => !c.isCustom).length,
    },
    system: {
      platform: process.platform,
      nodeVersion: process.version,
    }
  };
});
