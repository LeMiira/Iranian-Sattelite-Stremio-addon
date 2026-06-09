# Environment Variables Configuration

This addon is configured entirely using environment variables. These can be set locally in a `.env` file, in your Docker Compose environment, or inside the Vercel dashboard.

---

## 🔑 Variables Reference

| Variable Name | Type | Description | Example Value |
| :--- | :--- | :--- | :--- |
| `M3U_URLS` | String (CSV) | Comma-separated list of remote IPTV M3U/M3U8 playlist URLs to aggregate. | `https://example.com/tv.m3u,https://example2.com/fas.m3u` |
| `EPG_URLS` | String (CSV) | Comma-separated list of XMLTV EPG data feeds for program guides (Reserved for EPG matching). | `http://example.com/epg.xml` |
| `CUSTOM_CHANNELS` | String (JSON) | JSON array containing manual channel streams to inject into the live TV list. | *See format below* |
| `REDIS_URL` | String | Connection string for Redis cache database. Falls back to memory if empty. | `redis://default:password@localhost:6379` |
| `PORT` | Number | Port number the Nitro server binds to. Defaults to `3000`. | `3000` |
| `HOST` | String | Host binding for the application process. Defaults to `0.0.0.0`. | `0.0.0.0` |

---

## 📝 Custom Channels JSON Format

The `CUSTOM_CHANNELS` environment variable accepts a JSON-encoded string representing an array of channel objects. Use this to add custom streaming links that are not available in the default M3U playlist.

### Schema
```json
[
  {
    "id": "my-custom-channel",
    "name": "My Custom TV Channel",
    "logo": "https://example.com/logo.png",
    "category": "Entertainment",
    "streamUrl": "http://example.com/live/stream.m3u8",
    "epgId": "MyCustomChannel.ir"
  }
]
```

### Setting via Shell
When running in bash, stringify the JSON:
```bash
export CUSTOM_CHANNELS='[{"id":"custom-1","name":"Private Persian Channel","category":"Movies","streamUrl":"https://example.com/film.m3u8"}]'
```

---

## 🔒 Security Recommendations

*   **Rate Limiting**: Nitro runs under standard Node.js server configurations. It is recommended to place a reverse proxy (like Nginx, Cloudflare, or Vercel proxy) in front of the application in production environments to handle DDOS protection and request throttling.
*   **Token Protection**: If your IPTV playlist provider requires auth tokens/passwords, make sure you append those credentials securely in your `M3U_URLS` strings.
