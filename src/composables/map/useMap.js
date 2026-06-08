import { ref, onMounted, onUnmounted } from 'vue'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import OSM from 'ol/source/OSM'
import XYZ from 'ol/source/XYZ'
import { fromLonLat } from 'ol/proj'
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style'
import 'ol/ol.css'

export function useMap(mapContainer) {
    const basemap = ref('osm')

    let map            = null
    let osmLayer       = null
    let satelliteLayer = null
    let vectorSource   = null
    let vectorLayer    = null

    const defaultStyle = new Style({
        fill:   new Fill({ color: 'rgba(34,197,94,0.15)' }),
        stroke: new Stroke({ color: '#22c55e', width: 2 }),
        image:  new CircleStyle({ radius: 6, fill: new Fill({ color: '#22c55e' }), stroke: new Stroke({ color: '#fff', width: 2 }) }),
    })

    const selectedStyle = new Style({
        fill:   new Fill({ color: 'rgba(251,191,36,0.25)' }),
        stroke: new Stroke({ color: '#fbbf24', width: 3 }),
        image:  new CircleStyle({ radius: 8, fill: new Fill({ color: '#fbbf24' }), stroke: new Stroke({ color: '#fff', width: 2 }) }),
    })

    function initMap() {
        osmLayer = new TileLayer({ source: new OSM(), visible: true })

        satelliteLayer = new TileLayer({
            source: new XYZ({
                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                attributions: 'Esri World Imagery',
            }),
            visible: false,
        })

        vectorSource = new VectorSource()
        vectorLayer  = new VectorLayer({ source: vectorSource, style: defaultStyle, zIndex: 10 })

        map = new Map({
            target: mapContainer.value,
            layers: [osmLayer, satelliteLayer, vectorLayer],
            view: new View({ center: fromLonLat([34.7519, 0.3412]), zoom: 12 }),
            controls: [],
        })

        return map
    }

    function destroyMap() {
        map?.setTarget(null)
    }

    function setBasemap(type) {
        basemap.value = type
        osmLayer.setVisible(type === 'osm')
        satelliteLayer.setVisible(type === 'satellite')
    }

    function zoomIn()  { map.getView().animate({ zoom: map.getView().getZoom() + 1, duration: 300 }) }
    function zoomOut() { map.getView().animate({ zoom: map.getView().getZoom() - 1, duration: 300 }) }
    function zoomToExtent() {
        if (vectorSource.getFeatures().length > 0) {
            map.getView().fit(vectorSource.getExtent(), { padding: [60, 60, 60, 60], duration: 800 })
        }
    }

    function highlightFeature(featureId) {
        vectorLayer.setStyle(f => f.getId() === featureId ? selectedStyle : defaultStyle)
    }

    function resetStyles() {
        vectorLayer.setStyle(defaultStyle)
    }

    function getMap()          { return map }
    function getVectorSource() { return vectorSource }
    function getVectorLayer()  { return vectorLayer }

    return {
        basemap,
        initMap, destroyMap,
        setBasemap,
        zoomIn, zoomOut, zoomToExtent,
        highlightFeature, resetStyles,
        getMap, getVectorSource, getVectorLayer,
    }
}