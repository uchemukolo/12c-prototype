# I2C Recipe Intelligence — Prototype

A clickable prototype built with React + Vite. All AI, OCR, costing and memory
behaviour is simulated with pre-scripted demo data.

## Run locally

```bash
npm install
npm run dev
```

Open the printed local URL (usually http://localhost:5173).

## Build

```bash
npm run build     # outputs to /dist
npm run preview   # preview the production build locally
```

## Deploy to Vercel

**Option A — GitHub (recommended)**
1. Push this folder to a new GitHub repository.
2. Go to https://vercel.com → **Add New → Project** → import the repo.
3. Vercel auto-detects Vite. Confirm the settings:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Click **Deploy**.

**Option B — Vercel CLI (no GitHub)**
```bash
npm i -g vercel
vercel          # first run: answer the prompts, links the project
vercel --prod   # deploy to production
```

That's it — Vercel builds and hosts the app at a public URL.
