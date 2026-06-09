import { defineEventHandler, getQuery, sendProxy, setHeaders, setHeader } from 'h3';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const targetUrl = query.url as string;
  
  if (!targetUrl) {
    event.node.res.statusCode = 400;
    return { error: 'Missing target URL' };
  }

  // Set CORS Headers for browser players compatibility
  setHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  });

  if (event.node.req.method === 'OPTIONS') {
    event.node.res.statusCode = 204;
    return '';
  }

  const isM3u8 = targetUrl.toLowerCase().includes('.m3u8');

  if (isM3u8) {
    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch remote playlist: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      const host = event.node.req.headers.host || 'localhost:3000';
      const protocol = (event.node.req.headers['x-forwarded-proto'] as string) || 'http';
      const baseUrl = `${protocol}://${host}`;

      const lines = text.split('\n');
      const rewrittenLines = lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;
        
        if (trimmed.startsWith('#')) {
          // Replace relative URI="..." in tags like #EXT-X-KEY or #EXT-X-MEDIA
          return line.replace(/URI=["']([^"']+)["']/g, (match, p1) => {
            try {
              if (/^https?:\/\//i.test(p1)) {
                return match;
              }
              const absolute = new URL(p1, targetUrl).href;
              // If the referenced URI is another playlist, proxy it as well
              if (absolute.toLowerCase().includes('.m3u8')) {
                return `URI="${baseUrl}/proxy?url=${encodeURIComponent(absolute)}"`;
              }
              return `URI="${absolute}"`;
            } catch {
              return match;
            }
          });
        } else {
          // Rewrite relative URIs
          try {
            if (/^https?:\/\//i.test(trimmed)) {
              // If it's already absolute and is another playlist, proxy it
              if (trimmed.toLowerCase().includes('.m3u8')) {
                return `${baseUrl}/proxy?url=${encodeURIComponent(trimmed)}`;
              }
              return line;
            }
            const absolute = new URL(trimmed, targetUrl).href;
            if (absolute.toLowerCase().includes('.m3u8')) {
              return `${baseUrl}/proxy?url=${encodeURIComponent(absolute)}`;
            }
            return absolute;
          } catch {
            return line;
          }
        }
      });

      // Set correct Content-Type for HLS playlist
      setHeader(event, 'Content-Type', 'application/vnd.apple.mpegurl');
      return rewrittenLines.join('\n');
    } catch (err: any) {
      console.error(`[Proxy Rewrite Error] Failed to fetch/rewrite ${targetUrl}:`, err.message);
      event.node.res.statusCode = 502;
      return { error: `Bad Gateway: Failed to fetch/rewrite stream resource: ${err.message}` };
    }
  }

  try {
    // We stream the remote files through Nitro server
    return await sendProxy(event, targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
  } catch (err: any) {
    console.error(`[Proxy Error] Failed to fetch ${targetUrl}:`, err.message);
    event.node.res.statusCode = 502;
    return { error: 'Bad Gateway: Failed to fetch stream resource' };
  }
});
