import { defineEventHandler } from 'h3';

export default defineEventHandler((event) => {
  const url = event.node.req.url || '';
  console.log(`[Request] Incoming: ${event.node.req.method} ${url}`);
  
  // CORS Headers for Stremio client compatibility
  setHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Range',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  });

  // Handle options preflight
  if (event.node.req.method === 'OPTIONS') {
    event.node.res.statusCode = 204;
    return '';
  }
});
