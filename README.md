# Ribolovc.si 🎣

A free, installable web app (PWA) for fishing in Slovenia, built especially for anglers who don't know the waters yet. It has four language versions: Slovenian, English, German and Italian.

- **Map of fishing spots** with filters by fish, technique, water type, region and "beginner friendly", plus a "near me" button.
- **Spot pages:**
  - what you can catch
  - recommended rigs and lures
  - permit and rules summary, with a link to buy the permit
  - how to get there: parking, Google/Apple Maps/Waze/OSM links
  - approved visitor photos
- **4-day conditions per spot:**
  - weather: temperature, wind/gusts, rain, cloud, pressure with its trend
  - sunrise/sunset and moon phase
  - water level, flow and water temperature from the nearest ARSO gauging station
  - waves and sea temperature for sea spots
  - an explainable **fishing score** that lists every factor
  - a **setup advisor**: pick a fish and a day and it suggests the technique, rig, lure or bait and the best time, with the reasons. The reasons cover water temperature, rain-coloured water, river flow, pressure trend, wind, sun and the section's allowed methods. The rules are in `lib/advice.ts`.
- **Species encyclopedia** (freshwater and sea), including the EU minimum sizes for sea fish.
- **Guides:** first steps, permits and the fishing exam, etiquette and catch-and-release, knots, float/feeder/hair rig/drop-shot, spinning, euro-nymphing, dry fly, huchen, sea bottom rig, eging and sea bass.
- **"Which lure?" finder:** pick fish, water clarity and season to get lures and rigs.
- **Donations** through a Ko-fi (or Buy Me a Coffee) link. No ads, no tracking.
- **Works offline** for pages, forecasts and map tiles you've already opened.

## Tech

- **App:** Next.js 16 (App Router, static generation) and TypeScript.
- **Styling and languages:** Tailwind CSS 4 and `next-intl`.
- **Map:** MapLibre GL with the free OpenFreeMap/OSM basemap and an optional EMODnet sea-depth layer.
- **Content:** YAML and Markdown in `content/`, validated with Zod. Changes go through pull requests and there is no database.
- **Conditions:** `/api/conditions?spot=<slug>` combines Open-Meteo forecast and marine data with the ARSO hydrology feed and `suncalc`. Responses are cached at the edge for 30 minutes.

## Local development

```bash
npm install
npm run dev            # http://localhost:3000
npm run check          # lint, typecheck, content validation, message parity, unit tests
npm run build
npm run test:e2e       # Playwright; runs offline against generated weather/water fixtures
```

If Playwright's own browser download isn't available, point it at a local Chromium: `PW_CHROMIUM_PATH=/path/to/chrome npm run test:e2e`.

`CONDITIONS_FIXTURE_DIR=.e2e-fixtures` makes the conditions API read `forecast.json`, `marine.json` and `arso.xml` from that folder instead of the network. `node scripts/make-fixtures.mjs <dir>` generates those files.

## Deploying (free)

1. Push the repo to GitHub and import it on [Vercel](https://vercel.com/new). The free Hobby plan is enough.
2. Set these environment variables (see `.env.example`):
   - `NEXT_PUBLIC_SITE_URL`: e.g. `https://ribolovc.si`
   - `NEXT_PUBLIC_DONATE_URL`: your Ko-fi page, e.g. `https://ko-fi.com/yourname`
3. Add your domain (e.g. `ribolovc.si` from a `.si` registrar) under Project → Domains.

Cloudflare Pages or any Node host also works: run `npm run build && npm start`.

### Donations

1. Create a free page at [ko-fi.com](https://ko-fi.com). Ko-fi charges no platform fee on one-off donations (PayPal or Stripe processing fees still apply), and both payout options work in Slovenia.
2. Put the page URL in `NEXT_PUBLIC_DONATE_URL` and redeploy.

The **Support** button in the header, the `/podpri` page and the call to action under each spot then link to it. Donation income may be taxable, so check with a Slovenian accountant (FURS) once it becomes regular.

## Fishing sections (ribiskekarte.si + OpenStreetMap)

The 473 fishing sections (*revirji*) are crawled from ribiskekarte.si and placed on the map with OpenStreetMap data:

- **Weekly refresh, never on every build.** `.github/workflows/scrape.yml` runs on Mondays (and on demand from the Actions tab).
  - It crawls ribiskekarte.si only when the stored crawl on the `data/revirji` branch is more than 7 days old.
  - Otherwise it reuses that crawl and only re-runs the fast geocoding step.
  - The crawl identifies itself, waits 1.2 s between requests and respects `robots.txt`.
- **Local rebuild without crawling.** `npm run data:sync` pulls the stored crawl and OSM layers from the `data/revirji` branch, rebuilds the sections with the current geocoder and copies them to `content/revirji/`. Commit the result to publish it.
- **Placement quality** is in `data/report.md`, and every section page says how its position was found:
  - **segment:** the exact stretch, found from the "from X to Y" boundaries.
  - **water:** the whole lake, or a short river, matched by name.
  - **partial / gauge / place:** approximate.
  - **none:** not yet on the map.
- **Manual fixes.** Sections the geocoder can't place can be given coordinates in `data/overrides.yaml`.

After a sync, `npx tsx scripts/anchor-spots.ts` re-links the hand-written spots in `content/spots/` to their sections and moves their pins and parking to the matched geometry.

## Visitor photos (approved by an admin)

Every section and spot page has an **Add a photo** link that opens the GitHub issue form `.github/ISSUE_TEMPLATE/photo.yml`, with the page already filled in. Visitors drag in 1–4 photos, give a name for the credit and confirm they took the photo, agree to CC BY 4.0 and that no recognisable people or number plates are shown. Submitting needs a free GitHub account.

- **Approve:** add the `photo-approved` label to the issue. `.github/workflows/photo-approve.yml` checks that you have write access, then:
  - downloads the uploads and re-encodes them to WebP (1600 px plus a 640 px thumbnail), which removes all metadata including GPS
  - writes them to `public/photos/` and adds entries to `content/photos.yaml`
  - commits to the default branch (which redeploys the site), comments on the issue and closes it
- **Reject:** close the issue.
- **Take a photo down:** delete its entry in `content/photos.yaml` and its two files in `public/photos/`.

Create the `photo` and `photo-approved` labels once under Issues → Labels.

## Adding or fixing a spot

Spots live in `content/spots/<region>.yaml`. Copy an existing entry, then:

- Use only species slugs that exist in `content/species.yaml`.
- Set `water:` to the river or lake name as ARSO/OSM spell it, so the nearest gauging station and section are found.
- After checking the spot on site, set `approx: false` and update `lastVerified`.

Run `npm run validate:content` before committing. Guides are `content/guides/<slug>/<locale>.md`. Slovenian and English are required; German and Italian fall back to English with a notice.

## Data sources and notes

| Data | Source | Notes |
|---|---|---|
| Weather and marine forecast | [Open-Meteo](https://open-meteo.com) | CC BY 4.0. The free API is for non-commercial use; a donation-funded hobby site should qualify, but move to their paid API if the site earns real revenue or traffic grows a lot. |
| Water level, flow, temperature | [ARSO](https://www.arso.gov.si), `xml/vode/hidro_podatki_zadnji.xml` | The parser follows the feed's documented format, but **it hasn't been tested against the live feed yet** (the build sandbox had no access to arso.gov.si). If the format differs, the panel shows "data unavailable" and the rest of the page keeps working. Verify after the first deploy. |
| Base map | OpenStreetMap / OpenFreeMap | Attribution is shown on the map. |
| Sea depth | EMODnet Bathymetry WMS | Check that the layer name `emodnet:mean_multicolour` still renders after deploy. |
| Fishing sections (revirji), species, methods, permits | [ribiskekarte.si](https://www.ribiskekarte.si/ribolovni-revirji), crawled weekly at most | Facts plus a short description excerpt; every page links back to the club's permit page. |
| River/lake geometry, places, parking | [Geofabrik](https://download.geofabrik.de/europe/slovenia.html) OpenStreetMap extract (ODbL) | Used to place sections; official boundaries (ZZRS RIBKAT) would be more precise if ZZRS shares them. |
| Coastal spots | Public sources; [SeaFishingSlovenia](https://seafishingslovenia.com/skriti-koticki-za-ribolov-na-slovenski-obali/) linked for more spots | Their map isn't copied. Ask the owner for permission or a partnership to import it. |
| Fishing-activity forecasts like AlgoCatch | — | AlgoCatch has no public API, so it can't be integrated. The free equivalent here is Open-Meteo Marine (waves, sea temperature, sea level) plus EMODnet depth and the explainable score. |

**Disclaimer:** the information here is guidance only. The rules on the angler's permit and the fishing club's instructions always take precedence.

## Roadmap

- **Phase 2, community** (Supabase free tier):
  - magic-link accounts
  - "suggest a spot" form with moderation
  - catch reports with photos, with the exact location hidden as an option
  - an admin page that exports approved spots into `content/`
- **Phase 3:**
  - personal catch log with stats
  - favourite spots with push alerts for good conditions or high water
  - offline map regions
  - trip planner
  - native app wrappers (Capacitor) for the Play Store and App Store
  - affiliate links in lure guides
  - partnerships with the fishing clubs (ribiške družine) and the national federation (RZS) for official data
