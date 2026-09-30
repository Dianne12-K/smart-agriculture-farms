import { ref } from 'vue'
import { Map as MapLibreMap, ScaleControl, FullscreenControl, GeolocateControl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { getBasemaps } from '@/services/api'

const BUILTIN_OSM_ID      = 'basemap-osm'
const HIGHLIGHT_SOURCE_ID = 'highlight-src'

export function useMap(mapContainer) {
    const basemap = ref(BUILTIN_OSM_ID)

    let map = null
    let isReady = false
    const readyCallbacks = []
    let basemapLayerIds = [BUILTIN_OSM_ID]

    function whenReady(cb) {
        if (isReady) cb()
        else readyCallbacks.push(cb)
    }

    function initMap() {
        map = new MapLibreMap({
            container: mapContainer.value,
            style: {
                version: 8,
                sources: {
                    [BUILTIN_OSM_ID]: {
                        type: 'raster',
                        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                        tileSize: 256,
                        attribution: '&copy; OpenStreetMap contributors',
                    },
                    [HIGHLIGHT_SOURCE_ID]: {
                        type: 'geojson',
                        data: { type: 'FeatureCollection', features: [] },
                    },
                },
                layers: [
                    { id: BUILTIN_OSM_ID, type: 'raster', source: BUILTIN_OSM_ID, layout: { visibility: 'visible' } },
                ],
            },
            center: [34.7519, 0.3412],
            zoom: 12,
            dragRotate: false,
            pitchWithRotate: false,
            attributionControl: { compact: true },
        })

        map.touchZoomRotate.disableRotation()

        map.addControl(new ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left')
        map.addControl(new FullscreenControl(), 'top-right')
        map.addControl(new GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
        }), 'top-right')

        map.on('load', () => {
            // Highlight layers are added last so they always draw above every data layer.
            map.addLayer({
                id: 'highlight-outline',
                type: 'line',
                source: HIGHLIGHT_SOURCE_ID,
                filter: ['!=', '$type', 'Point'],
                paint: { 'line-color': '#fbbf24', 'line-width': 3 },
            })
            map.addLayer({
                id: 'highlight-circle',
                type: 'circle',
                source: HIGHLIGHT_SOURCE_ID,
                filter: ['==', '$type', 'Point'],
                paint: { 'circle-radius': 8, 'circle-color': '#fbbf24', 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 },
            })

            isReady = true
            readyCallbacks.splice(0).forEach(cb => cb())
        })

        return map
    }

    function destroyMap() {
        map?.remove()
        map = null
        isReady = false
        basemapLayerIds = [BUILTIN_OSM_ID]
    }

    async function loadProjectBasemaps(projectUuid) {
        await new Promise(resolve => whenReady(resolve))
        const res = await getBasemaps(projectUuid)
        const custom = res.data || []

        custom.forEach(bm => {
            const id = `basemap-${bm.uuid}`
            if (map.getSource(id)) return
            map.addSource(id, {
                type: 'raster',
                tiles: [bm.url_template],
                tileSize: 256,
                maxzoom: bm.max_zoom || 19,
                attribution: bm.attribution || '',
            })
            map.addLayer({ id, type: 'raster', source: id, layout: { visibility: 'none' } })
            basemapLayerIds.push(id)
        })

        return [
            { id: BUILTIN_OSM_ID, name: 'OpenStreetMap' },
            ...custom.map(bm => ({ id: `basemap-${bm.uuid}`, name: bm.name })),
        ]
    }

    function setBasemap(id) {
        basemap.value = id
        basemapLayerIds.forEach(layerId => {
            map.setLayoutProperty(layerId, 'visibility', layerId === id ? 'visible' : 'none')
        })
    }

    function zoomIn()  { map.zoomIn({ duration: 300 }) }
    function zoomOut() { map.zoomOut({ duration: 300 }) }

    function fitBounds(bbox, opts = {}) {
        if (!bbox) return
        map.fitBounds(bbox, { padding: 60, duration: 800, maxZoom: 17, ...opts })
    }

    function setHighlight(feature) {
        map.getSource(HIGHLIGHT_SOURCE_ID)?.setData(
            feature ? { type: 'FeatureCollection', features: [feature] } : { type: 'FeatureCollection', features: [] }
        )
    }
    function clearHighlight() { setHighlight(null) }

    function getMap() { return map }

    return {
        basemap,
        initMap, destroyMap, whenReady,
        loadProjectBasemaps, setBasemap, zoomIn, zoomOut, fitBounds,
        setHighlight, clearHighlight,
        getMap,
    }
}
