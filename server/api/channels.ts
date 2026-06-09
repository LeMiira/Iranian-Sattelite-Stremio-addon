import { defineEventHandler, getQuery, readBody } from 'h3';
import { liveTvProvider } from '../providers/live-tv';
import { iptvService } from '../services/iptvService';

export default defineEventHandler(async (event) => {
  const method = event.node.req.method;
  
  if (method === 'POST') {
    // Check if the user wants to refresh playlists or run a health check
    const body = await readBody(event).catch(() => ({}));
    if (body.action === 'refresh') {
      await iptvService.refreshPlaylists();
      return { message: 'Playlists refreshed successfully', count: liveTvProvider.getChannels().length };
    }
    if (body.action === 'health_check') {
      const results = await iptvService.checkAllStreamsHealth();
      return { message: 'Stream health check completed', results };
    }
    if (body.action === 'test_stream' && body.channelId) {
      const ch = liveTvProvider.getChannelById(body.channelId);
      if (!ch) {
        return { error: 'Channel not found' };
      }
      const status = await iptvService.checkStreamHealth(ch);
      ch.status = status;
      ch.lastChecked = new Date().toISOString();
      return { channelId: ch.id, status };
    }
  }

  // GET Request
  const query = getQuery(event);
  const category = query.category as string || 'All';
  const search = query.search as string || '';

  // Make sure we trigger IPTV channels load
  await iptvService.getAggregatedChannels();

  let channels = liveTvProvider.getChannels();

  if (category && category !== 'All') {
    channels = liveTvProvider.getChannelsByCategory(category);
  }

  if (search) {
    channels = liveTvProvider.search(search);
  }

  return {
    count: channels.length,
    channels,
  };
});
