# Reg-Policy-Tracker

A live California regulatory monitoring product for the TEC Regulatory Policy & Strategy role. Tracks CPUC proceedings plus CEC, CARB, AQMD, and the Legislature.

**Not hardcoded.** Scheduled GitHub Actions run real scrapers that fetch fresh
data and commit it into `data/*.json`. The Next.js app on Vercel renders that
data live. No database, no external accounts beyond GitHub + Vercel, and fully
independent of any other infrastructure.

## Architecture
```
Next.js app (Vercel)  ──reads──►  data/*.json  ◄──writes──  GitHub Actions scrapers (cron)
```
- `app/` — Next.js App Router UI: Director Brief, Proceedings, Developments, Topics, Bills, Watchlist, Subscriptions, plus one-click Excel export.
- `data/` — JSON the app renders (`proceedings`, `developments`, `bills`, `brief`, `meta`); updated automatically by the ingestion job.
- `scripts/ingest/` — scrapers (`cpuc.mjs` headless Playwright, `cec.mjs`, `carb.mjs`, `legiscan.mjs`), `analyze.mjs` (topic / qual-quant / relevance / impact tagging + Director synthesis), `run.mjs` (orchestrator).
- `.github/workflows/ingest.yml` — runs the scrapers on a schedule and commits new data.

## Analysis layer
Every ingested item is auto-tagged at ingest time (no external API): adjacent **topic**,
**qualitative vs. quantitative** (dollar/%/MW/deadline signals), **client relevance**,
and a **suggested impact summary**. CPUC items inherit their proceeding's topic. The
**Director Brief** synthesizes these into a review-ready rollup on each run. Suggested
impacts are analyst starting points, not final language.

## How updates happen
1. The Action runs on cron (~7am & 3pm Pacific, weekdays) or when you click **Run workflow**.
2. Scrapers pull each source; `run.mjs` merges + dedupes into `data/*.json`.
3. The job commits the changed data, which triggers a Vercel redeploy — the site shows the new data.

## One-time setup
- **LegiScan API key (free):** register at https://legiscan.com/legiscan, then in the
  GitHub repo add a secret `LEGISCAN_API_KEY` (Settings → Secrets and variables → Actions).
  Without it, the Bills tab stays empty; everything else still works.
- **AI summaries (optional, free):** turns the templated impact summaries into real
  AI-written ones and adds a narrative Director briefing. Add ONE of these GitHub secrets:
  - `GEMINI_API_KEY` — free tier via Google AI Studio (aistudio.google.com). Preferred.
  - `ANTHROPIC_API_KEY` — Claude, if you'd rather use Anthropic.
  Without either, the rule-based analysis runs instead — nothing breaks. Optional `AI_MODEL`
  secret overrides the default model (`gemini-2.5-flash` / `claude-haiku-4-5-20251001`).
- **Vercel:** framework preset **Next.js** (auto-detected).
- **Intelligence tab (chat):** add `GEMINI_API_KEY` to the **Vercel** project's Environment
  Variables (Settings → Environment Variables), then redeploy. This is separate from the GitHub
  Actions secret — the chat runs as a Vercel serverless function (`app/api/chat`) so the key stays
  server-side, never in the browser. Without it, the Intelligence tab shows a "not configured" message.

## Local development
```bash
npm install
npm run dev        # http://localhost:3000

# run the scrapers locally (optional)
cd scripts && npm install && npx playwright install chromium
LEGISCAN_API_KEY=xxxx node ingest/run.mjs
```

## Notes on data reliability
- CPUC's docket system is JavaScript-rendered, so its scraper uses a headless
  browser (Playwright) in the Action. Selectors are best-effort and may need
  tuning after the first live run — failures there are non-fatal; other sources
  still ingest.
- Automated ingestion is the fast, prioritized layer. The official email
  subscriptions (see the Subscriptions tab) remain the authoritative record.
