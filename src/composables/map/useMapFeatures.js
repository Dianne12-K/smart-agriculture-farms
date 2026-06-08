import { ref } from 'vue'
import GeoJSON from 'ol/format/GeoJSON'
import { getFeatures, getNdvi, deleteFeature } from '@/services/api.js'

export function useMapFeatures(getMap, getVectorSource, getVectorLayer, highlightFeature) {
    const layerFeatures  = ref([])
    const selectedFeature = ref(null)
    const popup = ref({ visible: false, x: 0, y: 0, feature: null, ndvi: null })

    async function loadLayerFeatures(layerUuid) {
        try {
            const res     = await getFeatures(layerUuid, { page_size: 1000 })
            const geoJson = res.data
            layerFeatures.value = geoJson.features || []

            const source   = getVectorSource()
            const map      = getMap()
            source.clear()

            const features = new GeoJSON().readFeatures(geoJson, { featureProjection: 'EPSG:3857' })
            source.addFeatures(features)

            if (features.length > 0) {
                map.getView().fit(source.getExtent(), { padding: [60, 60, 60, 60], maxZoom: 16, duration: 800 })
            }
        } catch (err) {
            console.error('Failed to load features', err)
        }
    }

    async function onMapClick(evt, activeTool, activeLayerUuid, mapContainer) {
        if (activeTool !== 'pan') return

        const map   = getMap()
        const pixel = map.getEventPixel(evt.originalEvent)
        const olFeat = map.forEachFeatureAtPixel(pixel, f => f)

        if (!olFeat) {
            popup.value.visible = false
            return
        }

        const rect = mapContainer.getBoundingClientRect()
        popup.value = {
            visible: true,
            x: evt.originalEvent.clientX - rect.left,
            y: evt.originalEvent.clientY - rect.top - 10,
            feature: { id: olFeat.getId(), properties: olFeat.getProperties() },
            ndvi: null,
        }

        if (activeLayerUuid && olFeat.getId()) {
            try {
                const res = await getNdvi(activeLayerUuid, olFeat.getId())
                popup.value.ndvi = res.data.ndvi
            } catch { /* no ndvi yet */ }
        }
    }

    async function deleteFeatureFromPopup(feature, activeLayerUuid) {
        if (!confirm(`Delete feature ${feature.id}?`)) return
        try {
            await deleteFeature(activeLayerUuid, feature.id)
            popup.value.visible = false
            await loadLayerFeatures(activeLayerUuid)
        } catch (err) {
            console.error('Delete failed', err)
        }
    }

    function selectFeatureOnMap(feature) {
        selectedFeature.value = feature
        const source  = getVectorSource()
        const map     = getMap()
        const olFeat  = source.getFeatures().find(f => f.getId() === feature.id)
        if (olFeat) {
            const extent = olFeat.getGeometry().getExtent()
            map.getView().fit(extent, { padding: [80, 80, 80, 80], maxZoom: 16, duration: 600 })
            highlightFeature(feature.id)
        }
    }

    return {
        layerFeatures,
        selectedFeature,
        popup,
        loadLayerFeatures,
        onMapClick,
        deleteFeatureFromPopup,
        selectFeatureOnMap,
    }
}