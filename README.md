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
| `MAX_INPUT_CHARS` | no | `6000` | Max characters accepted per request; longer input is rejected with 413. |
| `MAX_OUTPUT_TOKENS` | no | `700` | Max output tokens per generation — the main cost cap. |
| `DAILY_CALL_WARN_THRESHOLD` | no | `500` | Daily call count that triggers a `WARN` line in the logs. |

**Security rule:** none of these may be prefixed `NEXT_PUBLIC_`. They are read
only inside `app/api/generate/route.ts` on the server and never reach the client.

## Cost & abuse protection

- In-memory per-IP rate limit (10 requests / 60s). Resets when the serverless
  instance restarts — intentionally lightweight, no external store.
- Hard caps: input length (`MAX_INPUT_CHARS`) and output tokens (`MAX_OUTPUT_TOKENS`).
- Structured call log (stdout) on every request: timestamp, IP, model, input
  **length** (never the text), token usage, duration, running daily count.
- API key is masked in logs (`sk-***abcd`); the raw key is never logged.
- Daily threshold warning: emits a `WARN` line each time the daily call count
  crosses `DAILY_CALL_WARN_THRESHOLD`.

No database, no file writes, no disk cache — nothing the user types is persisted.

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Import the repo in Vercel.
3. Add `DEEPSEEK_API_KEY` in Project → Settings → Environment Variables.
4. Deploy. The single page lives at `/`, with `/privacy` and `/terms`.

## Structure

- `app/page.tsx` — single page: H1 + landing + SEO footer + footer
- `app/api/generate/route.ts` — server-side DeepSeek streaming + in-memory rate limit + call logging
- `components/Landing.tsx` — hero, output mockup, how-it-works, audience, FAQ, footer
- `components/GeneratorModal.tsx` — 4-step guided flow + result + export
- `lib/prompt.ts` — system prompt + request builder
- `lib/export.ts` — PDF (window.print) + Word (Blob .doc), pure frontend
- `lib/jsonld.ts` — WebApplication + FAQPage structured data
