# AI Performance Review Generator

Single-page Next.js (App Router) + TypeScript + Tailwind app. Generates structured
employee performance reviews in 4 guided steps. All features free, no login, no database.

## Run locally

```bash
cp .env.local.example .env.local   # then paste your real DEEPSEEK_API_KEY
npm install
npm run dev                        # http://localhost:3000
```

## Build

```bash
npm run build && npm run start
```

## Environment

| Variable | Required | Default | Notes |
|---|---|---|---|
| `DEEPSEEK_API_KEY` | yes | — | Your DeepSeek key. Server-side only, never exposed to the browser. |
| `DEEPSEEK_MODEL` | no | `deepseek-chat` | DeepSeek chat model id (e.g. `deepseek-chat`, `deepseek-reasoner`). |
| `DEEPSEEK_BASE_URL` | no | `https://api.deepseek.com` | Override only if using a DeepSeek-compatible proxy/endpoint. |

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Import the repo in Vercel.
3. Add `DEEPSEEK_API_KEY` in Project → Settings → Environment Variables.
4. Deploy. The single page lives at `/`, with `/privacy` and `/terms`.

## Structure

- `app/page.tsx` — single page: H1 + wizard + SEO footer + footer
- `app/api/generate/route.ts` — server-side DeepSeek streaming + in-memory rate limit
- `components/Wizard.tsx` — 4-step guided flow + result + export
- `components/SeoFooter.tsx` — H2 sections + FAQ (in HTML source for SEO)
- `lib/prompt.ts` — system prompt + request builder
- `lib/export.ts` — PDF (window.print) + Word (Blob .doc), pure frontend
- `lib/jsonld.ts` — WebApplication + FAQPage structured data
