# Stremio Addon Submission Guide

This document describes how to validate, test, and submit your Persian Satellite & IPTV addon to the Stremio Addons registry at **[stremio-addons.net/submit-addon](https://stremio-addons.net/submit-addon)**.

---

## 🧪 Step 1: Test Locally

Before submitting, you should verify the JSON response structures of your addon.

### 1. Run the Addon Locally
You can run either the dev server or the production build:
```bash
# Option A: Run in development
npm run dev

# Option B: Run production build
node .output/server/index.mjs
```

### 2. Verify JSON Endpoints
Use your browser or command-line tool `curl` to query the endpoints:
```bash
# Get Manifest details (must return valid JSON manifest structure)
curl http://localhost:3000/manifest.json

# Get Channels list (returns active IPTV channels)
curl http://localhost:3000/channels

# Get Live TV Catalog
curl http://localhost:3000/catalog/channel/persian-live.json
```

### 3. Load Addon in Stremio Desktop App
1.  Open the **Stremio Desktop App** on your PC.
2.  Navigate to the **Add-ons** section (puzzle piece icon in the left-hand sidebar).
3.  In the search input box at the top, paste the addon manifest URL:
    `http://localhost:3000/manifest.json`
4.  Stremio should detect the manifest, show your addon icon (a premium dark gradient logo) and description, and display an **Install** button.
5.  Click **Install**. You can now test live streaming channels and catalogs directly inside the Stremio Player!

---

## 🚀 Step 2: Deploy Publicly

Addons must be hosted on a public HTTPS domain.

1.  Deploy the project using Vercel (see [DEPLOYMENT.md](file:///media/mira/Depo/miiiira/Iranian-Sattelite-Stremio-addon/docs/DEPLOYMENT.md)):
    ```bash
    vercel --prod
    ```
2.  Once deployed, Vercel will output a live domain, for example:
    `https://persian-satellite-addon.vercel.app`
3.  Test your live manifest URL:
    `https://persian-satellite-addon.vercel.app/manifest.json`

---

## 📝 Step 3: Submit to stremio-addons.net

1.  Go to the submission page: **[stremio-addons.net/submit-addon](https://stremio-addons.net/submit-addon)**.
2.  **Log In**: Sign in using your Stremio Account.
3.  **Submission Form Details**:
    *   **Addon Base URL**: Input only the base domain of your hosted addon.
        *   *Example*: `https://persian-satellite-addon.vercel.app`
        *   *Note*: Do **not** append `/manifest.json` or pre-filled query parameters. The submit system automatically appends `/manifest.json` to check and register it.
    *   **Addon Details**: The submission portal automatically parses the addon name, description, categories, and catalogs from your manifest payload.
    *   **Markdown Description**: You can copy-paste the details from the repository `README.md` to show features (Persian TV, movies providers, and responsive IPTV aggregation dashboard).
4.  Submit! Once submitted, it will be indexed and immediately discoverable under the Community Add-ons directory inside Stremio for all users globally.
