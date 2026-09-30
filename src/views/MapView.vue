<template>
  <div class="flex flex-col h-[calc(100vh-64px)] bg-gray-950 overflow-hidden">

    <MapToolbar
        :project-name="projectName"
        :active-tool="activeTool"
        :basemap="basemap"
        :basemaps="basemapsList"
        :has-feature="!!selectedFeature"
        @go-back="router.push({ name: 'Dashboard' })"
        @set-tool="(t) => setTool(t, activeLayerUuid)"
        @zoom-in="zoomIn"
        @zoom-out="zoomOut"
        @zoom-extent="zoomToActiveExtent"
        @set-basemap="setBasemap"
        @toggle-layers="showLayerPanel = !showLayerPanel"
        @toggle-analytics="showAnalyticsPanel = !showAnalyticsPanel"
    />

    <!-- Main body -->
    <div class="flex flex-1 overflow-hidden relative"
         :class="showAttributeTable ? 'mb-[220px]' : ''">

      <!-- Left: Layer Panel -->
      <transition enter-active-class="transition-all duration-250 ease"
                  leave-active-class="transition-all duration-250 ease"
                  enter-from-class="-translate-x-full"
                  leave-to-class="-translate-x-full">
        <div v-if="showLayerPanel"
             class="w-[280px] min-w-[280px] bg-gray-900 border-r border-gray-800 overflow-y-auto z-10">
          <LayerPanel
              ref="layerPanelRef"
              :project-uuid="projectUuid"
              :active-layer-uuid="activeLayerUuid"
              @layer-selected="onLayerSelected"
              @layer-toggled="onLayerToggled"
              @open-attribute-table="onOpenAttributeTable"
              @layers-loaded="onLayersLoaded"
          />
        </div>
      </transition>

      <!-- Map -->
      <div ref="mapContainer" class="flex-1 relative">
        <!-- Edit session bar -->
        <div v-if="isEditing"
             class="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2
                    bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 shadow-lg">
          <span class="text-xs text-gray-300">Editing geometry — drag vertices to reshape</span>
          <Button label="Save" size="small" :loading="savingEdit" @click="handleSaveEdit"
                  class="bg-emerald-600 border-emerald-600" />
          <Button label="Cancel" size="small" text severity="secondary" @click="cancelEdit" />
        </div>
      </div>

      <!-- Popup -->
      <MapPopup
          :popup="popup"
          @close="popup.visible = false"
          @analytics="onViewAnalytics"
          @edit="onEditFeature"
          @edit-attributes="onEditAttributes"
          @delete="onDeleteFeature"
      />

      <!-- Right: Analytics Panel -->
      <transition enter-active-class="transition-all duration-250 ease"
                  leave-active-class="transition-all duration-250 ease"
                  enter-from-class="translate-x-full"
                  leave-to-class="translate-x-full">
        <div v-if="showAnalyticsPanel && selectedFeature"
             class="w-[400px] min-w-[400px] bg-gray-900 border-l border-gray-800 z-10 flex flex-col">
          <AnalyticsPanel
              :layer-uuid="activeLayerUuid"
              :project-uuid="projectUuid"
              :feature="selectedFeature"
              @close="showAnalyticsPanel = false"
          />
        </div>
      </transition>
    </div>

    <!-- Bottom: Attribute Table -->
    <transition enter-active-class="transition-all duration-250 ease"
                leave-active-class="transition-all duration-250 ease"
                enter-from-class="translate-y-full"
                leave-to-class="translate-y-full">
      <div v-if="showAttributeTable && activeLayerUuid"
           class="absolute bottom-0 left-0 right-0 h-[220px] bg-gray-900 border-t border-gray-800 z-50">
        <AttributeTable
            :layer-uuid="activeLayerUuid"
            :features="layerFeatures"
            :selected-gid="selectedFeature?.id"
            @feature-selected="onTableFeatureSelected"
            @edit-feature="(f) => onEditAttributes({ ...f, layerUuid: activeLayerUuid })"
            @bulk-edit="onBulkEdit"
            @bulk-delete="onBulkDelete"
            @close="showAttributeTable = false"
        />
      </div>
    </transition>

    <!-- Draw Dialog -->
    <FeatureFormDialog
        v-if="showDrawDialog"
        :layer-uuid="activeLayerUuid"
        :geometry="drawnGeometry"
        :attributes="activeLayerAttributes"
        @saved="onFeatureSaved"
        @cancel="showDrawDialog = false"
    />

    <!-- Edit attribute values -->
    <FeatureFormDialog
        v-if="editingAttributesFeature"
        :layer-uuid="editingAttributesFeature.layerUuid"
        :feature="editingAttributesFeature"
        :attributes="editingAttributesSchema"
        @saved="onAttributesSaved"
        @cancel="editingAttributesFeature = null"
    />

    <!-- Bulk edit -->
    <BulkEditFeaturesDialog
        v-if="bulkEditGids"
        :layer-uuid="activeLayerUuid"
        :gids="bulkEditGids"
        :attributes="activeLayerAttributes"
        @saved="onBulkEditSaved"
        @cancel="bulkEditGids = null"
    />

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import bbox from '@turf/bbox'
import Button from 'primevue/button'

import { useMap }       from '@/composables/map/useMap'
import { useMapLayers } from '@/composables/map/useMapLayers'
import { useMapTools }  from '@/composables/map/useMapTools'

import MapToolbar         from '@/components/map/MapToolbar.vue'
import MapPopup           from '@/components/map/MapPopup.vue'
import LayerPanel          from '@/components/map/LayerPanel.vue'
import AnalyticsPanel     from '@/components/map/AnalyticsPanel.vue'
import AttributeTable         from '@/components/map/AttributeTable.vue'
import FeatureFormDialog      from '@/components/map/FeatureFormDialog.vue'
import BulkEditFeaturesDialog from '@/components/map/BulkEditFeaturesDialog.vue'

import { getAttributes, getNdvi, deleteFeature, bulkDeleteFeatures } from '@/services/api'

const route  = useRoute()
const router = useRouter()

const projectUuid = route.params.projectUuid
const projectName = ref('Map')

const mapContainer  = ref(null)
const layerPanelRef = ref(null)

// ── UI state ──────────────────────────────────────────────────
const showLayerPanel     = ref(true)
const showAnalyticsPanel = ref(false)
const showAttributeTable = ref(false)

const activeLayerUuid       = ref(null)
const activeLayerAttributes = ref([])
const layerFeatures          = ref([])
const selectedFeature       = ref(null)
const popup = ref({ visible: false, x: 0, y: 0, feature: null, ndvi: null })
const savingEdit = ref(false)
const basemapsList = ref([])
const editingAttributesFeature = ref(null)
const editingAttributesSchema  = ref([])
const bulkEditGids = ref(null)

// ── Composables ───────────────────────────────────────────────
const {
  basemap,
  initMap, destroyMap, whenReady,
  loadProjectBasemaps, setBasemap, zoomIn, zoomOut, fitBounds,
  setHighlight, clearHighlight,
  getMap,
} = useMap(mapContainer)

const {
  addOrUpdateLayer, refreshLayer, removeLayer,
  setLayerVisibility,
  getLayerFeatures, getLayerBbox, getAllBbox, getRegisteredUuids,
  queryFeaturesAt,
} = useMapLayers(getMap, whenReady)

const {
  activeTool, drawnGeometry, showDrawDialog, isEditing,
  setTool, startEditFeature, saveEdit, cancelEdit,
} = useMapTools(getMap, whenReady)

// ── Init ──────────────────────────────────────────────────────
onMounted(async () => {
  const map = initMap()
  map.on('click', onMapClick)
  basemapsList.value = await loadProjectBasemaps(projectUuid)
})

onUnmounted(destroyMap)

// ── Layers ────────────────────────────────────────────────────
async function onLayersLoaded(layers) {
  const incomingUuids = new Set(layers.map(l => l.uuid))
  getRegisteredUuids().forEach(uuid => { if (!incomingUuids.has(uuid)) removeLayer(uuid) })

  await Promise.all(layers.map(l => addOrUpdateLayer(l)))
  const box = getAllBbox()
  if (box) fitBounds(box)
}

function onLayerToggled({ uuid, visible }) {
  setLayerVisibility(uuid, visible)
}

async function onLayerSelected(layer) {
  activeLayerUuid.value       = layer.uuid
  activeLayerAttributes.value = (await getAttributes(layer.uuid)).data || []
  const box = getLayerBbox(layer.uuid)
  if (box) fitBounds(box)
}

async function onOpenAttributeTable(layer) {
  activeLayerUuid.value       = layer.uuid
  activeLayerAttributes.value = (await getAttributes(layer.uuid)).data || []
  layerFeatures.value          = getLayerFeatures(layer.uuid)
  showAttributeTable.value    = true
}

function zoomToActiveExtent() {
  const box = activeLayerUuid.value ? getLayerBbox(activeLayerUuid.value) : getAllBbox()
  if (box) fitBounds(box)
}

async function refreshAfterMutation(layerUuid) {
  await refreshLayer(layerUuid)
  await layerPanelRef.value?.refresh()
  if (showAttributeTable.value && activeLayerUuid.value === layerUuid) {
    layerFeatures.value = getLayerFeatures(layerUuid)
  }
}

// ── Map click / popup ───────────────────────────────────────────
async function onMapClick(evt) {
  if (activeTool.value !== 'pan') return

  const hit = queryFeaturesAt(evt.point)
  if (!hit) {
    popup.value.visible = false
    clearHighlight()
    return
  }

  popup.value = {
    visible: true,
    x: evt.point.x,
    y: evt.point.y - 10,
    feature: { id: hit.gid, layerUuid: hit.layerUuid, properties: hit.properties, geometry: hit.geometry },
    ndvi: null,
  }
  setHighlight({ type: 'Feature', geometry: hit.geometry, properties: {} })

  if (hit.layerUuid && hit.gid != null) {
    try {
      const res = await getNdvi(hit.layerUuid, hit.gid)
      popup.value.ndvi = res.data.ndvi
    } catch { /* no ndvi yet */ }
  }
}

// ── Analytics ─────────────────────────────────────────────────
function onViewAnalytics(feature) {
  selectedFeature.value    = feature
  showAnalyticsPanel.value = true
  popup.value.visible      = false
}

// ── Edit / delete ───────────────────────────────────────────────
function onEditFeature(feature) {
  popup.value.visible = false
  startEditFeature(feature, feature.layerUuid)
}

async function handleSaveEdit() {
  savingEdit.value = true
  try {
    const layerUuid = await saveEdit()
    if (layerUuid) await refreshAfterMutation(layerUuid)
  } finally {
    savingEdit.value = false
  }
}

async function onEditAttributes(feature) {
  popup.value.visible = false
  editingAttributesSchema.value = (await getAttributes(feature.layerUuid)).data || []
  editingAttributesFeature.value = feature
}

async function onAttributesSaved() {
  const layerUuid = editingAttributesFeature.value.layerUuid
  editingAttributesFeature.value = null
  await refreshAfterMutation(layerUuid)
}

async function onDeleteFeature(feature) {
  if (!confirm(`Delete feature ${feature.id}?`)) return
  try {
    await deleteFeature(feature.layerUuid, feature.id)
    popup.value.visible = false
    clearHighlight()
    await refreshAfterMutation(feature.layerUuid)
  } catch (err) {
    console.error('Delete failed', err)
  }
}

// ── Bulk operations ───────────────────────────────────────────
function onBulkEdit(gids) {
  bulkEditGids.value = gids
}

async function onBulkEditSaved() {
  bulkEditGids.value = null
  await refreshAfterMutation(activeLayerUuid.value)
}

async function onBulkDelete(gids) {
  try {
    await bulkDeleteFeatures(activeLayerUuid.value, gids)
    await refreshAfterMutation(activeLayerUuid.value)
  } catch (err) {
    console.error('Bulk delete failed', err)
  }
}

// ── Attribute table ───────────────────────────────────────────
function onTableFeatureSelected(feature) {
  selectedFeature.value = feature
  setHighlight({ type: 'Feature', geometry: feature.geometry, properties: {} })
  fitBounds(bbox(feature), { maxZoom: 16, duration: 600 })
}

// ── Draw ──────────────────────────────────────────────────────
async function onFeatureSaved() {
  showDrawDialog.value = false
  await refreshAfterMutation(activeLayerUuid.value)
}
</script>
