# Deployment Guidelines

This addon can be deployed on a local server, containerized using Docker/Docker Compose, or hosted serverless on Vercel.

---

## ⚡ Deployment Option 1: Vercel (Serverless)

Vercel is the easiest and most cost-effective hosting option for Stremio addons.

### Setup Instructions
1.  Install Vercel CLI:
    ```bash
    npm install -g vercel
    ```
2.  Deploy the project:
    ```bash
    vercel
    ```
3.  Configure Environment Variables in the Vercel Dashboard:
    *   `M3U_URLS`: Your IPTV M3U playlist link
    *   `CUSTOM_CHANNELS`: (Optional) Manual channels JSON
    *   `REDIS_URL`: (Optional) Connection URL for a serverless Redis database (e.g. Upstash, Redis Labs).
4.  Alias or deploy to production:
    ```bash
    vercel --prod
    ```

Your Vercel deployment URL (e.g., `https://my-addon.vercel.app`) serves as the addon's installation endpoint in Stremio.

---

## 🐳 Deployment Option 2: Docker & Docker Compose

Docker deployment packages the entire Nuxt/Nitro server into a lightweight, isolated execution environment.

### Using Docker Compose
Running Docker Compose spins up the addon container and an accompanying Redis database container:

```bash
# Build and run containers
docker-compose up -d --build

# View logs
docker-compose logs -f
```

The server binds to port `3000` on the host machine. You can configure variables directly inside the [docker-compose.yml](file:///media/mira/Depo/miiiira/Iranian-Sattelite-Stremio-addon/docker-compose.yml) file.

### Single Container Run
To run the addon alone without docker-compose:
```bash
# Build the image
docker build -t iranian-satellite-addon .

# Run the container
docker run -d -p 3000:3000 -e M3U_URLS="https://example.com/playlist.m3u" iranian-satellite-addon
```

---

## 🖥️ Deployment Option 3: Local Node.js PM2

For VM environments (such as Ubuntu VPS):

1.  Build the project locally:
    ```bash
    npm run build
    ```
2.  Install PM2:
    ```bash
    npm install -g pm2
    ```
3.  Launch the compiled Nitro bundle:
    ```bash
    PORT=3000 HOST=127.0.0.1 REDIS_URL=redis://127.0.0.1:6379 pm2 start .output/server/index.mjs --name persian-addon
    ```
4.  Configure Nginx as a reverse proxy targeting `http://127.0.0.1:3000` to expose the addon publicly over HTTPS.
