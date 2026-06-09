<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useDashboardStore } from '~/stores/dashboard';

const store = useDashboardStore();
const activeTab = ref<'health' | 'channels' | 'testing'>('health');

// Filter & search for channels
const selectedCategory = ref('All');
const channelSearch = ref('');

// Test parameters
const testSearchType = ref<'movie' | 'series' | 'channel'>('movie');
const testSearchQuery = ref('');
const testStreamType = ref<'movie' | 'series' | 'channel'>('movie');
const testStreamId = ref('');

onMounted(async () => {
  await Promise.all([
    store.fetchStats(),
    store.fetchProviders(),
    store.fetchChannels()
  ]);

  // Auto poll stats every 10 seconds
  setInterval(() => {
    store.fetchStats();
  }, 10000);
});

// Categories list
const categories = ['All', 'News', 'Entertainment', 'Sports', 'Movies', 'Kids', 'Music', 'Religious', 'General'];

// Trigger channel filter
function filterChannels() {
  store.fetchChannels(selectedCategory.value, channelSearch.value);
}

// Clear all cache
async function clearCache() {
  if (confirm('Are you sure you want to clear the system cache?')) {
    store.actionLoading.value = 'clear-cache';
    try {
      await $fetch('/stats', { method: 'DELETE' }); // We can implement cache flush here or simple simulation
      alert('Cache cleared successfully!');
      await store.fetchStats();
    } catch (err) {
      alert('Failed to clear cache');
    } finally {
      store.actionLoading.value = null;
    }
  }
}

// Test actions
async function runSearchTest() {
  if (!testSearchQuery.value.trim()) return;
  await store.testSearch(testSearchType.value, testSearchQuery.value);
}

async function runStreamTest() {
  if (!testStreamId.value.trim()) return;
  await store.testStreamResource(testStreamType.value, testStreamId.value);
}

function getManifestUrl() {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}/manifest.json`;
  }
  return 'http://localhost:3000/manifest.json';
}

function copyManifest() {
  const url = getManifestUrl();
  navigator.clipboard.writeText(url)
    .then(() => alert('Manifest URL copied to clipboard!'))
    .catch(() => alert('Failed to copy. URL: ' + url));
}
</script>

<template>
  <div class="app-container">
    <header>
      <div class="brand-section">
        <div class="brand-logo">IR</div>
        <div class="brand-title">
          <h1>Iranian Satellite & IPTV</h1>
          <p>Stremio Addon Production Management Dashboard</p>
        </div>
      </div>
      <div class="header-actions">
        <div class="status-badge" v-if="store.stats">
          <span class="status-dot online"></span>
          <span>Addon: Online</span>
        </div>
        <div class="status-badge" v-else>
          <span class="status-dot offline"></span>
          <span>Addon: Connecting...</span>
        </div>
      </div>
    </header>

    <!-- Navigation Tabs -->
    <div class="tabs">
      <button 
        class="tab" 
        :class="{ active: activeTab === 'health' }" 
        @click="activeTab = 'health'"
      >
        System Status & Health
      </button>
      <button 
        class="tab" 
        :class="{ active: activeTab === 'channels' }" 
        @click="activeTab = 'channels'"
      >
        IPTV & Live Channels
      </button>
      <button 
        class="tab" 
        :class="{ active: activeTab === 'testing' }" 
        @click="activeTab = 'testing'"
      >
        Integration Testing
      </button>
    </div>

    <!-- MAIN DASHBOARD CONTENT -->
    <div class="dashboard-content">
      
      <!-- TAB 1: HEALTH & HEALTH METRICS -->
      <div v-if="activeTab === 'health'" class="fade-in">
        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="glass-card stat-item">
            <div class="stat-header">
              <span>System Uptime</span>
              <span class="tag">System</span>
            </div>
            <div class="stat-value" v-if="store.stats">
              {{ Math.floor(store.stats.uptime / 3600) }}h {{ Math.floor((store.stats.uptime % 3600) / 60) }}m
            </div>
            <div class="stat-value" v-else>--</div>
            <div class="stat-footer">Active process lifetime</div>
          </div>

          <div class="glass-card stat-item">
            <div class="stat-header">
              <span>Active Channels</span>
              <span class="tag">IPTV</span>
            </div>
            <div class="stat-value" v-if="store.stats">
              {{ store.stats.channels.total }}
            </div>
            <div class="stat-value" v-else>--</div>
            <div class="stat-footer">
              {{ store.stats?.channels.builtin || 0 }} Builtin | {{ store.stats?.channels.custom || 0 }} IPTV
            </div>
          </div>

          <div class="glass-card stat-item">
            <div class="stat-header">
              <span>Cache Efficiency</span>
              <span class="tag">Cache</span>
            </div>
            <div class="stat-value" v-if="store.stats">
              {{ store.stats.cache.hits + store.stats.cache.misses > 0 
                ? Math.round((store.stats.cache.hits / (store.stats.cache.hits + store.stats.cache.misses)) * 100) 
                : 0 }}%
            </div>
            <div class="stat-value" v-else>--</div>
            <div class="stat-footer">
              Hits: {{ store.stats?.cache.hits || 0 }} | Misses: {{ store.stats?.cache.misses || 0 }}
            </div>
          </div>

          <div class="glass-card stat-item">
            <div class="stat-header">
              <span>Memory Usage</span>
              <span class="tag">Engine</span>
            </div>
            <div class="stat-value" v-if="store.stats">
              {{ store.stats.memory?.heapUsed || '0 MB' }}
            </div>
            <div class="stat-value" v-else>--</div>
            <div class="stat-footer">Heap Size Limit: {{ store.stats?.memory?.heapTotal || '0' }}</div>
          </div>
        </div>

        <div class="dashboard-layout">
          <!-- Left Col: Providers & Status -->
          <div class="glass-card">
            <div class="card-header">
              <h2 class="card-title">Active Stream Providers</h2>
              <span class="tag">Promise.allSettled Isolated</span>
            </div>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Provider Name</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="provider in store.providers" :key="provider.id">
                    <td><strong>{{ provider.name }}</strong></td>
                    <td><span class="tag">{{ provider.type }}</span></td>
                    <td>
                      <span class="status-badge">
                        <span class="status-dot" :class="{ online: provider.enabled, offline: !provider.enabled }"></span>
                        {{ provider.enabled ? 'Active' : 'Disabled' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Right Col: Control Panel -->
          <div class="glass-card">
            <h2 class="card-title" style="margin-bottom: 1.5rem;">Control Center</h2>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              <button 
                class="btn btn-primary" 
                :disabled="store.actionLoading !== null"
                @click="store.refreshIPTV()"
              >
                {{ store.actionLoading === 'refresh' ? 'Refetching Playlists...' : 'Force Reload IPTV Playlists' }}
              </button>
              
              <button 
                class="btn" 
                :disabled="store.actionLoading !== null"
                @click="store.runHealthCheck()"
              >
                {{ store.actionLoading === 'health' ? 'Checking streams...' : 'Check All Streams Health' }}
              </button>

              <button 
                class="btn" 
                style="border-color: var(--color-accent-pink); color: var(--color-accent-pink);"
                :disabled="store.actionLoading !== null"
                @click="clearCache()"
              >
                {{ store.actionLoading === 'clear-cache' ? 'Clearing...' : 'Clear Cache Databases' }}
              </button>
            </div>
            <div style="margin-top: 1.5rem; font-size: 0.85rem; color: var(--text-muted);">
              <p><strong>IPTV Refreshed:</strong> {{ store.stats?.iptvLastRefreshed || 'Never' }}</p>
              <p><strong>Cache Type:</strong> {{ store.stats?.cache?.type.toUpperCase() || 'MEMORY' }}</p>
            </div>
          </div>
        </div>

        <!-- Addon Informational Cards -->
        <div class="info-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 2.5rem;">
          <div class="glass-card" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <h3 class="card-title" style="margin-bottom: 0.75rem; color: var(--color-accent-blue);">
                🚀 Quick Setup Guide
              </h3>
              <p style="font-size: 0.85rem; line-height: 1.5; color: var(--text-secondary); margin-bottom: 1rem;">
                Copy the manifest URL below and paste it into Stremio's addon search bar to install this addon on any device.
              </p>
              <div style="background: rgba(0, 0, 0, 0.25); border: 1px solid var(--border-color); padding: 0.75rem; border-radius: 8px; font-family: monospace; font-size: 0.75rem; word-break: break-all; margin-bottom: 1rem; color: var(--color-accent-blue);">
                {{ getManifestUrl() }}
              </div>
            </div>
            <button class="btn btn-sm btn-primary" @click="copyManifest" style="width: 100%;">
              Copy Manifest URL
            </button>
          </div>

          <div class="glass-card">
            <h3 class="card-title" style="margin-bottom: 0.75rem; color: var(--color-accent-purple);">
              🛡️ Web Player Guide
            </h3>
            <p style="font-size: 0.85rem; line-height: 1.5; color: var(--text-secondary);">
              Browser players (like Stremio Web) block HTTP localhost requests due to CORS and Private Network Access security rules. 
              For seamless web playback, select the <strong>Web Proxy (CORS Bypass)</strong> stream, install a browser HLS extension, or use native desktop/mobile apps.
            </p>
          </div>

          <div class="glass-card" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <h3 class="card-title" style="margin-bottom: 0.75rem; color: var(--color-accent-pink);">
                💖 Support & Repository
              </h3>
              <p style="font-size: 0.85rem; line-height: 1.5; color: var(--text-secondary); margin-bottom: 1.25rem;">
                This addon is open-source and free to use. Visit our repository to report issues or check the code. Support the developer by donating below.
              </p>
            </div>
            <div style="display: flex; gap: 0.75rem;">
              <a href="https://github.com/LeMiira/Iranian-Sattelite-Stremio-addon" target="_blank" rel="noopener" class="btn btn-sm" style="flex: 1; text-decoration: none; text-align: center;">
                📁 GitHub Repo
              </a>
              <a href="https://buymeacoffee.com/miiiira" target="_blank" rel="noopener" class="btn btn-sm btn-primary" style="flex: 1; text-decoration: none; text-align: center; background: linear-gradient(135deg, hsl(40, 85%, 55%), hsl(30, 85%, 50%)); border: none;">
                ☕ Buy Me Coffee
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: CHANNELS MANAGER -->
      <div v-if="activeTab === 'channels'" class="glass-card fade-in">
        <div class="card-header" style="flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem;">
          <h2 class="card-title">Live & IPTV Channels</h2>
          
          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
            <div class="input-group" style="margin-bottom: 0;">
              <select class="select-input" v-model="selectedCategory" @change="filterChannels">
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>

            <div class="input-group" style="margin-bottom: 0;">
              <input 
                type="text" 
                class="text-input" 
                placeholder="Search channel name..." 
                v-model="channelSearch"
                @input="filterChannels"
              />
            </div>
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Logo</th>
                <th>Channel Name</th>
                <th>Category</th>
                <th>EPG ID</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ch in store.channels" :key="ch.id">
                <td>
                  <img :src="ch.logo" style="width: 32px; height: 32px; object-fit: contain; border-radius: 4px;" alt="Logo" />
                </td>
                <td>
                  <strong>{{ ch.name }}</strong>
                  <div style="font-size: 0.75rem; color: var(--text-muted); word-break: break-all;">
                    {{ ch.streamUrl }}
                  </div>
                </td>
                <td><span class="tag">{{ ch.category }}</span></td>
                <td><code>{{ ch.epgId || '--' }}</code></td>
                <td>
                  <span class="status-badge">
                    <span class="status-dot" :class="{ online: ch.status === 'online', offline: ch.status === 'offline', unknown: ch.status === 'unknown' }"></span>
                    {{ ch.status.toUpperCase() }}
                  </span>
                </td>
                <td>
                  <button 
                    class="btn btn-sm"
                    :disabled="store.actionLoading === `test-${ch.id}`"
                    @click="store.testChannel(ch.id)"
                  >
                    {{ store.actionLoading === `test-${ch.id}` ? 'Testing...' : 'Test Stream' }}
                  </button>
                </td>
              </tr>
              <tr v-if="store.channels.length === 0">
                <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 3rem;">
                  No channels found matching the filters.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 3: INTEGRATION TESTING -->
      <div v-if="activeTab === 'testing'" class="dashboard-layout fade-in">
        <!-- Search catalog tester -->
        <div class="glass-card">
          <h2 class="card-title">Catalog Query Tester</h2>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1.5rem;">
            Test catalog search endpoints which query internal configurations and movies/series provider scraping logic.
          </p>

          <div class="input-group">
            <label>Catalog Type</label>
            <select class="select-input" v-model="testSearchType">
              <option value="movie">Movies</option>
              <option value="series">TV Series</option>
              <option value="channel">Live TV Channel</option>
            </select>
          </div>

          <div class="input-group">
            <label>Search Term</label>
            <input 
              type="text" 
              class="text-input" 
              placeholder="e.g. Separation, Shahrzad, bbc..." 
              v-model="testSearchQuery"
            />
          </div>

          <button 
            class="btn btn-primary" 
            :disabled="store.actionLoading === 'search'"
            @click="runSearchTest"
          >
            {{ store.actionLoading === 'search' ? 'Querying Catalog...' : 'Test Catalog Search' }}
          </button>

          <div class="tester-box" v-if="store.searchResults">
            <h3 style="font-size: 0.9rem; margin-bottom: 0.75rem; color: var(--text-secondary);">Response Payload:</h3>
            <pre class="json-renderer">{{ JSON.stringify(store.searchResults, null, 2) }}</pre>
          </div>
        </div>

        <!-- Stream link tester -->
        <div class="glass-card">
          <h2 class="card-title">Stream Resolution Tester</h2>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1.5rem;">
            Test Stremio stream resolution for movies, series episodes, or live channels using target IDs.
          </p>

          <div class="input-group">
            <label>Content Type</label>
            <select class="select-input" v-model="testStreamType">
              <option value="movie">Movie</option>
              <option value="series">TV Series Episode</option>
              <option value="channel">Live TV Channel</option>
            </select>
          </div>

          <div class="input-group">
            <label>Content ID / Video ID</label>
            <input 
              type="text" 
              class="text-input" 
              placeholder="e.g. tt1610192 (Movie), tt14948834:1:1 (Series), bbc-persian (Channel)" 
              v-model="testStreamId"
            />
          </div>

          <button 
            class="btn btn-primary" 
            :disabled="store.actionLoading === 'stream-test'"
            @click="runStreamTest"
          >
            {{ store.actionLoading === 'stream-test' ? 'Resolving Streams...' : 'Resolve Streams' }}
          </button>

          <div class="tester-box" v-if="store.testStreamResults">
            <h3 style="font-size: 0.9rem; margin-bottom: 0.75rem; color: var(--text-secondary);">Response Payload:</h3>
            <pre class="json-renderer">{{ JSON.stringify(store.testStreamResults, null, 2) }}</pre>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style>
.fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
