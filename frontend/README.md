# Calm Coach frontend

A warm little Next.js room for talking with the FastAPI coach in `/api`.
No dashboards. No shouting. Just a chat column and a send button.

## What it talks to

The UI posts `{ "message": "..." }` to `POST /api/chat` and expects `{ "reply": "..." }`.

- **Local:** `http://localhost:8000/api/chat` (set via `NEXT_PUBLIC_API_URL` in `.env.development`)
- **Vercel:** same-origin `/api/chat` (blank `NEXT_PUBLIC_API_URL` in `.env.production`)

Never put a Groq API key in this folder. The backend already holds that secret.

## Run it locally

You need **two terminals**. Node 20.9+ for the frontend, and `uv` for the Python API.

**Terminal 1 — backend** (from the repo root):

```bash
uv sync
# Windows PowerShell:
$env:GROQ_API_KEY="gsk_..."
uv run uvicorn api.index:app --reload
```

**Terminal 2 — this app** (from `/frontend`):

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Type a check-in, hit Enter (Shift+Enter for a new line). If the API is down you will see a calm inline error instead of a crash.

## Scripts

- `npm run dev` — Next.js dev server (Turbopack)
- `npm run build` — production build
- `npm start` — serve the production build
- `npm run lint` — ESLint

## Deploying with the API

The root `vercel.json` uses [Vercel Services](https://vercel.com/docs/services): Next.js in `frontend/`, FastAPI from `api.index:app`. Public `/api/*` goes to Python; everything else goes to this UI. Set `GROQ_API_KEY` in the Vercel project, then `vercel` from the repo root.
