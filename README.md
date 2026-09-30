# Smart Agriculture GIS Platform — Frontend (Kakamega Farms)

A Vue 3 single-page app for the Kakamega Farms GIS platform. It renders farm
boundaries on an interactive map, lets operators manage projects/layers, and
surfaces satellite-derived analytics (NDVI, soil, land cover, disaster risk,
yield, weather) served by the Flask backend (a separate repository — see
[Backend](#backend)).

## Tech stack

- **Framework:** Vue 3 (`<script setup>`), Vite
- **Routing / state:** Vue Router, Pinia
- **UI:** PrimeVue 4 + PrimeIcons, Tailwind CSS 4
- **Map:** MapLibre GL JS, with Terra Draw for draw/edit interactions
- **Charts:** Chart.js + `vue-chartjs`
- **HTTP:** Axios (JWT bearer auth via interceptor)

## Prerequisites

- Node.js 18+ and npm
- The Kakamega Farms Flask API running locally (or reachable over the
  network) — this app is a pure client and does no processing of its own;
  every data view depends on the backend being up. See [Backend](#backend).

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the API base URL

Create a `.env` file in the project root (git-ignored):

```env
VITE_API_BASE_URL=http://127.0.0.1:5000/api
```

If omitted, it defaults to `http://127.0.0.1:5000/api`. Vite is also
configured to proxy `/api` to `http://localhost:5000` in dev
(`vite.config.js`), so same-origin requests work either way.

### 3. Run the dev server

```bash
npm run dev
```

The app starts at `http://localhost:5400` (falls back to another port if
taken). Log in or register against the backend's `/api/auth` endpoints to
get started.

### Other scripts

```bash
npm run build     # production build to dist/
npm run preview   # preview the production build locally
```

## Project structure

```
src/
├── views/                 # Route-level pages
├── layouts/AppLayout.vue  # Authenticated shell (sidebar + topbar)
├── components/
│   ├── Dialog/             # Layer/group/attribute CRUD dialogs
│   └── map/                 # Map UI: toolbar, layer panel, popup, attribute table, analytics panel
├── composables/map/        # useMap (MapLibre setup), useMapLayers (per-layer sources/rendering), useMapTools (Terra Draw draw/edit)
├── stores/                 # Pinia stores: auth, projects, layers, layergroups
├── services/api.js         # Axios instance + all backend endpoint wrappers
└── router/index.js         # Routes + auth guard
```

## What's implemented

**Auth**
- Login / register views, JWT stored in `localStorage`, attached to every
  request via an Axios interceptor, route guard redirects unauthenticated
  users to `/login` and clears the token on a 401.

**Projects** (`DashboardView.vue`, routed as `/dashboard`)
- Full CRUD: list, create, edit, delete, with stats cards (project/layer/group
  counts) computed client-side from parallel fetches.

**Layers & layer groups** (`LayerManagementView.vue`, `/layers`)
- Create/delete layer groups and layers, expandable tree view, per-layer
  attribute schema management (add/remove attributes), file upload for
  boundary data (shapefile/GeoJSON/etc. via `POST /layers/upload/:uuid`).
- **Basemaps tab** — per-project catalog of custom basemap tile sources
  (name + XYZ URL template, optional attribution/max zoom), backed by
  `/api/basemaps`. Ships with one-click presets (Esri World Imagery/
  Hillshade/Terrain, Google Roadmap/Satellite/Hybrid) that just fill the
  form — nothing is saved until you hit Create.

**Map** (`MapView.vue`, `/map/:projectUuid`)
- MapLibre GL map rendering every visible layer of a project simultaneously
  (each with its own deterministic color), with working per-layer visibility
  checkboxes, zoom/basemap controls (basemap switcher reads from the
  project's Basemaps catalog above, defaulting to a built-in OpenStreetMap
  layer), a feature popup, and a bottom attribute table synced to map
  selection. Scale, fullscreen, and geolocate controls included.
- **Draw and save**: point/line/polygon tools (Terra Draw) open a dialog
  with a real form generated from the layer's attribute schema; saving
  calls `POST /layers/:uuid/features` and the new feature renders
  immediately.
- **Edit existing geometry**: the popup's Edit button drags the feature's
  vertices in place (Terra Draw select mode) and persists via
  `PUT /layers/:uuid/features/:gid/geometry` on Save. Only single-part
  geometries (Point/LineString/Polygon) are editable this way — Multi*
  features aren't supported by Terra Draw's editor yet.

**Analytics panel** (`components/map/AnalyticsPanel.vue`, opened per feature
from the map)
- Vegetation health: NDVI + trend chart, stress hotspots, zonal stats
  (`ndvi`, `ndvi/trend`, `ndvi/change`, `ndvi/hotspots`).
- Soil & land cover snapshot (`soil/:layer/:gid`, `lulc/:layer/:gid/classify`).
- Yield prediction for a selected crop type (`yield/:layer/:gid/predict`).
- Disaster risk scan — flood/drought/fire combined (`disasters/:layer/:gid/scan`).
- Crop recommendation for the feature (`recommendations/:layer/:gid`).
- Weather forecast + summary for the project (`weather/:project/forecast`,
  `weather/:project/summary`).

**Settings** (`/settings`) — read-only account info + sign out.

## What's remaining

These are stubbed, wired-but-unused, or missing pieces relative to what the
backend exposes:

- **Attribute values on features** aren't editable from the UI beyond
  creation (schema *definitions* can be added/removed in Layer Management,
  the draw-and-save dialog sets values for a *new* feature, but there's no
  form to edit an *existing* feature's attribute values).
- **Bulk feature operations** — `bulkDeleteFeatures`, `bulkUpdateFeatures`,
  and the CSV/attribute-mapping step after upload (`mapAttributes`) are
  defined in `services/api.js` but not called from any component. The
  attribute table has no multi-select/bulk actions yet.
- **Field Analytics and Yield Reports pages are placeholders.**
  `FieldAnalyticsView.vue` and `YieldReportsView.vue` (routes `/analytics`
  and `/yield`) just show "coming soon" and point users back to the map.
  There's no cross-project aggregation of NDVI/soil/yield history — that
  data is currently only viewable one feature at a time via the map's
  Analytics panel.
- **History/trend endpoints beyond the analytics panel snapshot are unused**:
  `getNdviHistory`, `getNdviHotspots` (grid rendering exists but not the
  standalone endpoint history), `getLulcHistory`, `getLulcChange`,
  `getLulcStatistics`, `getLulcCropMask`, `getSoilHistory`,
  `getSoilMoisture`, `getSoilProperties`, `getYieldHistory`,
  `recordActualYield`, `getYieldModelInfo`, `trainYieldModel`,
  `getRecommendationHistory`, `generateRecommendations`,
  `getDisasterAlerts`/`getFeatureAlerts` (saved alert history),
  and individual `getFlood`/`getFire`/`getDrought` (only the combined
  `scan` is used), `getWeatherCurrent`, `getWeatherHistorical`. These are
  ready-made API wrappers with no UI consuming them yet — natural home for
  the Field Analytics / Yield Reports pages above.
- **Disaster alerts** have no dedicated view — no way to browse saved alert
  history per feature or per layer, or filter by type/severity, even though
  the backend supports it.
- **`src/views/ProjectsView.vue` is dead code.** The actual projects
  dashboard lives in `DashboardView.vue` (routed at `/dashboard`);
  `ProjectsView.vue` (248 lines, similar UI) isn't referenced by the router
  or imported anywhere — likely a leftover from a rename and safe to delete
  once confirmed.
- **Settings page** is read-only (no profile edit, password change, or
  `GEE`/API-key-style config — none of which the backend currently exposes
  either).
- **No automated tests** (unit or e2e) exist yet.

## Backend

This app targets the Kakamega Farms Flask API (Flask, PostgreSQL, Google
Earth Engine — lives in its own repo, not this one). It exposes NDVI, LULC,
soil, weather, disaster, yield, and recommendation endpoints under `/api/*`,
with interactive docs at `/apidocs/` once it's running. Point
`VITE_API_BASE_URL` at wherever that API is deployed; see that project's own
README for setup, environment variables, and Earth Engine authentication.
