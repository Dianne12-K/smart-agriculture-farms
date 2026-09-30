import bbox from '@turf/bbox'
import { getFeatures } from '@/services/api'
import { getLayerColor } from '@/utils/layerColors'

const MAX_FEATURES_PER_LAYER = 5000

const sourceId  = (uuid) => `src-${uuid}`
const fillId    = (uuid) => `lyr-${uuid}-fill`
const outlineId = (uuid) => `lyr-${uuid}-outline`
const lineId    = (uuid) => `lyr-${uuid}-line`
const circleId  = (uuid) => `lyr-${uuid}-circle`

export function useMapLayers(getMap, whenReady) {
    // uuid -> { geojson, allLayerIds, interactiveLayerIds }
    const registry      = new Map()
    const layerIdToUuid = new Map()

    async function fetchAllFeatures(layerUuid) {
        let page = 1
        let all  = []
        let pagination = null
        do {
            const res = await getFeatures(layerUuid, { page, page_size: 1000 })
            const geoJson = res.data
            all = all.concat(geoJson.features || [])
            pagination = geoJson.pagination
            page += 1
        } while (pagination?.has_next && all.length < MAX_FEATURES_PER_LAYER)

        if (pagination?.has_next) {
            console.warn(`Layer ${layerUuid}: more than ${MAX_FEATURES_PER_LAYER} features, truncating for map display`)
        }
        return { type: 'FeatureCollection', features: all }
    }

    function addStyleLayers(map, layer) {
        const uuid  = layer.uuid
        const type  = (layer.geometry_type || '').toUpperCase()
        const color = getLayerColor(uuid)

        let allLayerIds, interactiveLayerIds

        if (type.includes('POLYGON')) {
            map.addLayer({ id: fillId(uuid), type: 'fill', source: sourceId(uuid),
                paint: { 'fill-color': color, 'fill-opacity': 0.15 } })
            map.addLayer({ id: outlineId(uuid), type: 'line', source: sourceId(uuid),
                paint: { 'line-color': color, 'line-width': 2 } })
            allLayerIds = [fillId(uuid), outlineId(uuid)]
            interactiveLayerIds = [fillId(uuid)]
        } else if (type.includes('LINE')) {
            map.addLayer({ id: lineId(uuid), type: 'line', source: sourceId(uuid),
                paint: { 'line-color': color, 'line-width': 3 } })
            allLayerIds = [lineId(uuid)]
            interactiveLayerIds = [lineId(uuid)]
        } else {
            map.addLayer({ id: circleId(uuid), type: 'circle', source: sourceId(uuid),
                paint: { 'circle-radius': 6, 'circle-color': color, 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 } })
            allLayerIds = [circleId(uuid)]
            interactiveLayerIds = [circleId(uuid)]
        }

        allLayerIds.forEach(id => layerIdToUuid.set(id, uuid))

        // Keep the highlight ring above every newly added data layer.
        if (map.getLayer('highlight-outline')) map.moveLayer('highlight-outline')
        if (map.getLayer('highlight-circle')) map.moveLayer('highlight-circle')

        return { allLayerIds, interactiveLayerIds }
    }

    function removeStyleLayers(map, uuid) {
        [fillId(uuid), outlineId(uuid), lineId(uuid), circleId(uuid)].forEach(id => {
            if (map.getLayer(id)) map.removeLayer(id)
            layerIdToUuid.delete(id)
        })
    }

    async function addOrUpdateLayer(layer) {
        const geojson = await fetchAllFeatures(layer.uuid)

        await new Promise(resolve => whenReady(resolve))
        const map = getMap()

        const existing = registry.get(layer.uuid)
        if (existing) {
            map.getSource(sourceId(layer.uuid))?.setData(geojson)
            existing.geojson = geojson
        } else {
            map.addSource(sourceId(layer.uuid), { type: 'geojson', data: geojson })
            const { allLayerIds, interactiveLayerIds } = addStyleLayers(map, layer)
            registry.set(layer.uuid, { geojson, allLayerIds, interactiveLayerIds })
        }
        return geojson
    }

    function refreshLayer(uuid) {
        return addOrUpdateLayer({ uuid })
    }

    function removeLayer(uuid) {
        const map = getMap()
        if (!registry.has(uuid)) return
        removeStyleLayers(map, uuid)
        if (map.getSource(sourceId(uuid))) map.removeSource(sourceId(uuid))
        registry.delete(uuid)
    }

    function setLayerVisibility(uuid, visible) {
        const map = getMap()
        const entry = registry.get(uuid)
        if (!entry) return
        entry.allLayerIds.forEach(id => map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none'))
    }

    function getRegisteredUuids() {
        return Array.from(registry.keys())
    }

    function getLayerFeatures(uuid) {
        return registry.get(uuid)?.geojson.features || []
    }

    function getLayerBbox(uuid) {
        const geojson = registry.get(uuid)?.geojson
        if (!geojson?.features?.length) return null
        return bbox(geojson)
    }

    function getAllBbox() {
        const features = Array.from(registry.values()).flatMap(e => e.geojson.features)
        if (!features.length) return null
        return bbox({ type: 'FeatureCollection', features })
    }

    function queryFeaturesAt(point) {
        const map = getMap()
        const layers = Array.from(registry.values()).flatMap(e => e.interactiveLayerIds)
        if (!layers.length) return null

        const hits = map.queryRenderedFeatures(point, { layers })
        if (!hits.length) return null

        const feature = hits[0]
        return {
            layerUuid:  layerIdToUuid.get(feature.layer.id),
            gid:        feature.id,
            properties: feature.properties,
            geometry:   feature.geometry,
        }
    }

    return {
        addOrUpdateLayer, refreshLayer, removeLayer,
        setLayerVisibility,
        getLayerFeatures, getLayerBbox, getAllBbox, getRegisteredUuids,
        queryFeaturesAt,
    }
}
