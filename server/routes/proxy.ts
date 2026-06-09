import { defineEventHandler, getQuery, sendProxy } from 'h3';

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

  try {
    // We stream the remote HLS files through Nitro server
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
