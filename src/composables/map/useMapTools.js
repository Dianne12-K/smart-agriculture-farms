import { ref } from 'vue'
import {
    TerraDraw,
    TerraDrawPolygonMode,
    TerraDrawPointMode,
    TerraDrawLineStringMode,
    TerraDrawSelectMode,
} from 'terra-draw'
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter'
import { updateGeometry } from '@/services/api'

const GEOM_TYPE_TO_MODE = { POINT: 'point', LINESTRING: 'linestring', POLYGON: 'polygon' }

function modeForGeometryType(geometryType) {
    const base = (geometryType || '').toUpperCase().replace('MULTI', '')
    return GEOM_TYPE_TO_MODE[base] || null
}

// Terra Draw rejects coordinates with more than 9 decimal places; geometry that has
// round-tripped through PostGIS/float64 can pick up trailing precision noise beyond that.
function roundCoordinates(coords) {
    if (typeof coords[0] === 'number') return coords.map(n => Math.round(n * 1e9) / 1e9)
    return coords.map(roundCoordinates)
}

function withRoundedCoordinates(geometry) {
    return { ...geometry, coordinates: roundCoordinates(geometry.coordinates) }
}

export function useMapTools(getMap, whenReady) {
    const activeTool     = ref('pan')
    const drawnGeometry  = ref(null)
    const showDrawDialog = ref(false)
    const isEditing      = ref(false)

    let draw = null
    let editState = null // { internalId, gid, layerUuid }

    function ensureDraw() {
        if (draw) return draw

        draw = new TerraDraw({
            adapter: new TerraDrawMapLibreGLAdapter({ map: getMap() }),
            modes: [
                new TerraDrawPolygonMode(),
                new TerraDrawPointMode(),
                new TerraDrawLineStringMode(),
                new TerraDrawSelectMode({
                    flags: {
                        polygon:    { feature: { draggable: true, coordinates: { draggable: true, deletable: true, midpoints: true } } },
                        linestring: { feature: { draggable: true, coordinates: { draggable: true, deletable: true, midpoints: true } } },
                        point:      { feature: { draggable: true } },
                    },
                }),
            ],
        })
        draw.start()

        draw.on('finish', (id) => {
            if (draw.getMode() === 'select') return // edits are saved explicitly via saveEdit(), not here
            const feature = draw.getSnapshotFeature(id)
            drawnGeometry.value = feature.geometry
            draw.removeFeatures([id])
            draw.setMode('static')
            showDrawDialog.value = true
            activeTool.value = 'pan'
        })

        return draw
    }

    function setTool(tool, activeLayerUuid) {
        if (!activeLayerUuid && tool !== 'pan') {
            alert('Please select a layer first')
            return
        }
        if (isEditing.value) cancelEdit()

        activeTool.value = tool
        whenReady(() => {
            const d = ensureDraw()
            if (tool === 'draw-polygon') d.setMode('polygon')
            else if (tool === 'draw-point') d.setMode('point')
            else if (tool === 'draw-line') d.setMode('linestring')
            else d.setMode('static')
        })
    }

    function startEditFeature(feature, layerUuid) {
        const modeName = modeForGeometryType(feature.geometry?.type)
        if (!modeName) {
            alert('Editing multi-part geometries is not supported yet')
            return
        }

        whenReady(() => {
            const d = ensureDraw()
            if (isEditing.value) cancelEdit()

            const [validation] = d.addFeatures([{
                type: 'Feature',
                geometry: withRoundedCoordinates(feature.geometry),
                properties: { mode: modeName },
            }])
            if (!validation?.valid) {
                alert('Could not start editing this feature')
                return
            }

            editState = { internalId: validation.id, gid: feature.id, layerUuid }
            activeTool.value = 'select-edit'
            d.setMode('select')
            d.selectFeature(validation.id)
            isEditing.value = true
        })
    }

    async function saveEdit() {
        if (!editState || !draw) return null
        const { internalId, gid, layerUuid } = editState
        const feature = draw.getSnapshotFeature(internalId)
        await updateGeometry(layerUuid, gid, { geometry: feature.geometry })
        cleanupEdit()
        activeTool.value = 'pan'
        return layerUuid
    }

    function cancelEdit() {
        cleanupEdit()
        activeTool.value = 'pan'
    }

    function cleanupEdit() {
        if (draw && editState) draw.removeFeatures([editState.internalId])
        if (draw) draw.setMode('static')
        editState = null
        isEditing.value = false
    }

    return {
        activeTool, drawnGeometry, showDrawDialog, isEditing,
        setTool, startEditFeature, saveEdit, cancelEdit,
    }
}
