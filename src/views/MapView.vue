<template>
  <div class="flex flex-col h-[calc(100vh-64px)] bg-gray-950 overflow-hidden">

    <MapToolbar
        :project-name="projectName"
        :active-tool="activeTool"
        :basemap="basemap"
        :has-feature="!!selectedFeature"
        @go-back="router.push({ name: 'Projects' })"
        @set-tool="(t) => setTool(t, activeLayerUuid)"
        @zoom-in="zoomIn"
        @zoom-out="zoomOut"
        @zoom-extent="zoomToExtent"
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
              :project-uuid="projectUuid"
              :active-layer-uuid="activeLayerUuid"
              @layer-selected="onLayerSelected"
              @layer-toggled="onLayerToggled"
              @open-attribute-table="onOpenAttributeTable"
          />
        </div>
      </transition>

      <!-- Map -->
      <div ref="mapContainer" class="flex-1 relative" />

      <!-- Popup -->
      <MapPopup
          :popup="popup"
          @close="popup.visible = false"
          @analytics="onViewAnalytics"
          @edit="onViewAnalytics"
          @delete="(f) => deleteFeatureFromPopup(f, activeLayerUuid)"
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
            @close="showAttributeTable = false"
        />
      </div>
    </transition>

    <!-- Draw Dialog -->
    <DrawFeatureDialog
        v-if="showDrawDialog"
        :layer-uuid="activeLayerUuid"
        :geometry="drawnGeometry"
        :attributes="activeLayerAttributes"
        @saved="onFeatureSaved"
        @cancel="showDrawDialog = false"
    />

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useMap }         from '@/composables/map/useMap'
import { useMapTools }    from '@/composables/map/useMapTools'
import { useMapFeatures } from '@/composables/map/useMapFeatures'

import MapToolbar       from '@/components/map/MapToolbar.vue'
import MapPopup         from '@/components/map/MapPopup.vue'
import LayerPanel       from '@/components/map/LayerPanel.vue'
import AnalyticsPanel   from '@/components/map/AnalyticsPanel.vue'
import AttributeTable   from '@/components/map/AttributeTable.vue'
import DrawFeatureDialog from '@/components/map/DrawFeatureDialog.vue'

const route  = useRoute()
const router = useRouter()

const projectUuid = route.params.projectUuid
const projectName = ref('Map')

const mapContainer = ref(null)

// ── UI state ──────────────────────────────────────────────────
const showLayerPanel     = ref(true)
const showAnalyticsPanel = ref(false)
const showAttributeTable = ref(false)

const activeLayerUuid       = ref(null)
const activeLayerAttributes = ref([])

// ── Composables ───────────────────────────────────────────────
const {
  basemap,
  initMap, destroyMap,
  setBasemap, zoomIn, zoomOut, zoomToExtent,
  highlightFeature,
  getMap, getVectorSource, getVectorLayer,
} = useMap(mapContainer)

const {
  activeTool, drawnGeometry, showDrawDialog,
  setTool,
} = useMapTools(getMap, getVectorSource)

const {
  layerFeatures, selectedFeature, popup,
  loadLayerFeatures, onMapClick,
  deleteFeatureFromPopup, selectFeatureOnMap,
} = useMapFeatures(getMap, getVectorSource, getVectorLayer, highlightFeature)

// ── Init ──────────────────────────────────────────────────────
onMounted(() => {
  const map = initMap()
  map.on('click', (evt) => onMapClick(evt, activeTool.value, activeLayerUuid.value, mapContainer.value))
})

onUnmounted(destroyMap)

// ── Layer events ──────────────────────────────────────────────
async function onLayerSelected(layer) {
  activeLayerUuid.value       = layer.uuid
  activeLayerAttributes.value = layer.attributes || []
  await loadLayerFeatures(layer.uuid)
}

function onOpenAttributeTable(layer) {
  activeLayerUuid.value       = layer.uuid
  activeLayerAttributes.value = layer.attributes || []
  showAttributeTable.value    = true
  loadLayerFeatures(layer.uuid)
}

function onLayerToggled({ uuid, visible }) {
  // per-layer visibility — extend when multi-layer sources are added
}

// ── Analytics ─────────────────────────────────────────────────
function onViewAnalytics(feature) {
  selectedFeature.value    = feature
  showAnalyticsPanel.value = true
  popup.value.visible      = false
}

// ── Attribute table ───────────────────────────────────────────
function onTableFeatureSelected(feature) {
  selectFeatureOnMap(feature)
}

// ── Draw ──────────────────────────────────────────────────────
async function onFeatureSaved() {
  showDrawDialog.value = false
  await loadLayerFeatures(activeLayerUuid.value)
}
</script>