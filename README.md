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
- `app/` — Next.js App Router UI (Proceedings, Developments, Bills, Watchlist, Subscriptions).
- `data/` — JSON the app renders; updated automatically by the ingestion job.
- `scripts/ingest/` — the scrapers: `cpuc.mjs` (headless Playwright), `cec.mjs`, `carb.mjs`, `legiscan.mjs`.
- `.github/workflows/ingest.yml` — runs the scrapers on a schedule and commits new data.

## How updates happen
1. The Action runs on cron (~7am & 3pm Pacific, weekdays) or when you click **Run workflow**.
2. Scrapers pull each source; `run.mjs` merges + dedupes into `data/*.json`.
3. The job commits the changed data, which triggers a Vercel redeploy — the site shows the new data.

## One-time setup
- **LegiScan API key (free):** register at https://legiscan.com/legiscan, then in the
  GitHub repo add a secret `LEGISCAN_API_KEY` (Settings → Secrets and variables → Actions).
  Without it, the Bills tab stays empty; everything else still works.
- **Vercel:** framework preset **Next.js** (auto-detected). No env vars needed for the app.

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
