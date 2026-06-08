import { ref } from 'vue'
import Draw from 'ol/interaction/Draw'
import GeoJSON from 'ol/format/GeoJSON'

export function useMapTools(getMap, getVectorSource) {
    const activeTool     = ref('pan')
    const drawnGeometry  = ref(null)
    const showDrawDialog = ref(false)

    let drawInteraction = null

    function setTool(tool, activeLayerUuid) {
        activeTool.value = tool
        removeDraw()

        if (!activeLayerUuid && tool !== 'pan') {
            alert('Please select a layer first')
            activeTool.value = 'pan'
            return
        }

        if (tool === 'draw-polygon') startDraw('Polygon')
        else if (tool === 'draw-point') startDraw('Point')
        else if (tool === 'draw-line') startDraw('LineString')
    }

    function startDraw(type) {
        const map    = getMap()
        const source = getVectorSource()

        drawInteraction = new Draw({ source, type })
        map.addInteraction(drawInteraction)

        drawInteraction.on('drawend', (evt) => {
            const geom    = evt.feature.getGeometry().clone().transform('EPSG:3857', 'EPSG:4326')
            drawnGeometry.value  = JSON.parse(new GeoJSON().writeGeometry(geom))
            showDrawDialog.value = true
            removeDraw()
            source.removeFeature(evt.feature)
            activeTool.value = 'pan'
        })
    }

    function removeDraw() {
        if (drawInteraction) {
            getMap().removeInteraction(drawInteraction)
            drawInteraction = null
        }
    }

    return {
        activeTool,
        drawnGeometry,
        showDrawDialog,
        setTool,
        removeDraw,
    }
}