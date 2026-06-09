import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useDashboardStore = defineStore('dashboard', () => {
  const stats = ref<any>(null);
  const providers = ref<any[]>([]);
  const channels = ref<any[]>([]);
  const loading = ref(false);
  const actionLoading = ref<string | null>(null);
  const searchResults = ref<any>(null);
  const testStreamResults = ref<any>(null);

  async function fetchStats() {
    try {
      const data = await $fetch<any>('/stats');
      stats.value = data;
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }

  async function fetchProviders() {
    try {
      const data = await $fetch<any>('/providers');
      providers.value = data.providers || [];
    } catch (err) {
      console.error('Failed to fetch providers:', err);
    }
  }

  async function fetchChannels(category = 'All', search = '') {
    loading.value = true;
    try {
      const queryParams: Record<string, string> = {};
      if (category !== 'All') queryParams.category = category;
      if (search) queryParams.search = search;

      const data = await $fetch<any>('/channels', { query: queryParams });
      channels.value = data.channels || [];
    } catch (err) {
      console.error('Failed to fetch channels:', err);
    } finally {
      loading.value = false;
    }
  }

  async function refreshIPTV() {
    actionLoading.value = 'refresh';
    try {
      const res = await $fetch<any>('/channels', {
        method: 'POST',
        body: { action: 'refresh' },
      });
      await fetchStats();
      await fetchChannels();
      return res;
    } catch (err) {
      console.error('Failed to refresh IPTV:', err);
    } finally {
      actionLoading.value = null;
    }
  }

  async function runHealthCheck() {
    actionLoading.value = 'health';
    try {
      const res = await $fetch<any>('/channels', {
        method: 'POST',
        body: { action: 'health_check' },
      });
      await fetchStats();
      await fetchChannels();
      return res;
    } catch (err) {
      console.error('Failed to run health check:', err);
    } finally {
      actionLoading.value = null;
    }
  }

  async function testChannel(channelId: string) {
    actionLoading.value = `test-${channelId}`;
    try {
      const res = await $fetch<any>('/channels', {
        method: 'POST',
        body: { action: 'test_stream', channelId },
      });
      // Update local channel status
      const channelIndex = channels.value.findIndex(c => c.id === channelId);
      if (channelIndex !== -1 && res.status) {
        channels.value[channelIndex].status = res.status;
        channels.value[channelIndex].lastChecked = new Date().toISOString();
      }
      return res;
    } catch (err) {
      console.error('Failed to test stream:', err);
    } finally {
      actionLoading.value = null;
    }
  }

  async function testSearch(type: 'movie' | 'series' | 'channel', query: string) {
    actionLoading.value = 'search';
    searchResults.value = null;
    try {
      const cleanQuery = query.trim();
      const endpoint = `/catalog/${type}/persian-${type === 'channel' ? 'live' : type === 'movie' ? 'movies' : 'series'}/search=${encodeURIComponent(cleanQuery)}.json`;
      const data = await $fetch<any>(endpoint);
      searchResults.value = data;
    } catch (err) {
      console.error('Failed to search:', err);
      searchResults.value = { error: 'Search request failed' };
    } finally {
      actionLoading.value = null;
    }
  }

  async function testStreamResource(type: 'movie' | 'series' | 'channel', id: string) {
    actionLoading.value = 'stream-test';
    testStreamResults.value = null;
    try {
      const endpoint = `/stream/${type}/${encodeURIComponent(id)}.json`;
      const data = await $fetch<any>(endpoint);
      testStreamResults.value = data;
    } catch (err) {
      console.error('Failed to test stream resource:', err);
      testStreamResults.value = { error: 'Stream fetch request failed' };
    } finally {
      actionLoading.value = null;
    }
  }

  return {
    stats,
    providers,
    channels,
    loading,
    actionLoading,
    searchResults,
    testStreamResults,
    fetchStats,
    fetchProviders,
    fetchChannels,
    refreshIPTV,
    runHealthCheck,
    testChannel,
    testSearch,
    testStreamResource,
  };
});
