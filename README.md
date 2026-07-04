# Reg-Policy-Tracker

Live command console for California regulatory monitoring (CPUC, CEC, CARB, AQMD, Legislature) for the TEC Regulatory Policy & Strategy role.

The **spreadsheet is the source of truth.** `build_site.py` reads
`../TEC_Regulatory_Tracker.xlsx` and bakes its data into a self-contained
`index.html`, so the deployed site always matches the tracker. Static site,
no build step on Vercel — it just serves `index.html`.

## Update the live site
```bash
# 1. Edit ../TEC_Regulatory_Tracker.xlsx (proceedings, digest log, etc.)
# 2. Regenerate the page from the spreadsheet
python3 build_site.py
# 3. Publish
git add index.html && git commit -m "Update tracker" && git push
```
Vercel auto-deploys on push.

## Tabs
- **Proceedings** — the ~12 tracked CPUC dockets, each linking to its live docket card.
- **Digest Log** — tracked developments (from the spreadsheet's Digest Log tab).
- **Agency Watchlist** — CEC / CARB / AQMD / Legislature / PDAEnergyWeb.
- **Subscriptions** — the official alert subscriptions to set up.

## Local preview
Open `index.html` in any browser.

## Requirements
`pip install openpyxl` (only needed to run `build_site.py`).
