# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # install dependencies
npm run dev       # start dev server at http://localhost:5400 (falls back to another port if taken)
npm run build     # production build to dist/
npm run preview   # preview the production build locally
```

There is no lint script and no test suite (unit or e2e) in this repo yet.

This app is a pure client with no backend of its own — set `VITE_API_BASE_URL` in a
git-ignored `.env` file (defaults to `http://127.0.0.1:5000/api`), pointing at the
Flask API in the sibling `smart-agriculture` repo, or a deployed instance of it.
Every view depends on that API being reachable.

## Architecture

**Auth and routing.** `src/router/index.js` defines every route under a single parent
(`AppLayout.vue`, the sidebar+topbar shell) except `/login` and `/register`. A global
`beforeEach` guard redirects unauthenticated users to `/login` and bounces logged-in
users away from the auth pages; the JWT lives in `localStorage` and is attached to
every request by an Axios interceptor in `src/services/api.js`, which also force-logs-out
on a 401. `services/api.js` is the single source of truth for the backend contract —
every endpoint the frontend calls is a one-line wrapper there; check it first when
wiring a new feature to the backend, and add new endpoints there rather than calling
`api.get/post` directly from components.

**The map (`MapView.vue`, route `/map/:projectUuid`) is the most architecturally
involved part of the app.** It composes three composables under `src/composables/map/`:
- `useMap.js` owns the MapLibre GL instance itself: style/sources/basemap layers
  (a built-in OpenStreetMap fallback plus whatever the project's basemap catalog
  defines — see `useMap.loadProjectBasemaps`), zoom/fit-bounds, and a dedicated
  "highlight" GeoJSON source used to ring the currently-selected feature. Exposes
  `whenReady(cb)` — MapLibre's style loads asynchronously, and both other composables
  gate their map-touching calls on this.
- `useMapLayers.js` renders *data* layers (as opposed to basemaps): one GeoJSON
  source + style layer(s) per project layer, keyed by layer UUID, with pagination
  handled internally (loops `GET /layers/:uuid/features` until `has_next` is false,
  capped at 5000 features/layer). Layer color is deterministic — hashed from the
  layer UUID via `src/utils/layerColors.js`, shared with `LayerPanel.vue`'s sidebar
  icons so the two always agree.
- `useMapTools.js` wraps Terra Draw for drawing new features and editing existing
  ones. A subtlety worth knowing before touching this file: Terra Draw rejects
  coordinates with more than 9 decimal places ("excessive precision"), which
  geometry round-tripped through PostGIS/float64 can exceed — coordinates are
  rounded before being handed to Terra Draw's `addFeatures`. Also, Terra Draw's
  store only supports singular Point/LineString/Polygon, not Multi* geometries —
  editing a Multi* feature is intentionally unsupported and short-circuits with
  an alert.

`MapView.vue` itself owns UI-level state (popup, selected feature, attribute table,
edit-session save/cancel bar) and wires the three composables together; it does not
touch MapLibre directly.

**Layer Management (`LayerManagementView.vue`, route `/layers`) and the map's own
`LayerPanel.vue` are two independent implementations of layer/group/basemap CRUD**
against the same endpoints — they don't share state or components, just the same
`services/api.js` wrappers and the same `layerColors.js` util. Keep both in sync
when changing how layers or basemaps are created/edited/deleted.

**Backend response quirks worth knowing:**
- `GET /layers?project_uuid=...` (list) returns a slimmer shape than
  `GET /layers/:uuid` (detail) — notably, only the detail endpoint includes
  `attributes`. Components that need a layer's attribute schema fetch it
  separately via `getAttributes(uuid)` rather than relying on the list payload.
- GeoJSON features use the feature's top-level `id` as the backend's `gid` — this
  is what MapLibre's `queryRenderedFeatures` returns as `feature.id` with no
  `promoteId` needed, and what every feature-CRUD call keys off.

## Known gaps

See the README's "What's remaining" section for the current list of backend
endpoints with no frontend UI yet (bulk feature ops, Field Analytics / Yield
Reports pages, disaster alert history, attribute *value* editing, etc.) —
`src/services/api.js` already has wrapper functions defined for most of these;
the gap is UI, not API plumbing.
