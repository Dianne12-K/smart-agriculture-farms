<template>
  <div class="flex flex-col h-full bg-gray-900 text-gray-200">

    <!-- Header -->
    <div class="flex items-center justify-between p-3 px-4 border-b border-gray-800">
      <span class="text-[13px] font-semibold text-gray-50">Layers</span>
      <button class="p-1 px-1.5 rounded text-gray-500 hover:bg-gray-700 hover:text-gray-50 transition-colors"
              @click="showCreateGroup = true" title="New Group">
        <i class="pi pi-plus text-xs" />
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center gap-2 p-5 text-gray-500 text-[13px]">
      <i class="pi pi-spin pi-spinner text-emerald-400" />
      <span>Loading layers...</span>
    </div>

    <!-- Layer Groups -->
    <div v-else class="flex-1 overflow-y-auto py-2">
      <div v-for="group in groups" :key="group.uuid" class="group/folder">

        <!-- Group Header -->
        <div class="flex items-center gap-2 py-2 px-3 cursor-pointer select-none hover:bg-gray-800 transition-colors"
             @click="toggleGroup(group.uuid)">
          <i class="pi text-[10px] text-gray-400 transition-transform duration-200"
             :class="expandedGroups[group.uuid] ? 'pi-chevron-down' : 'pi-chevron-right'" />
          <i class="pi pi-folder text-yellow-400 text-xs" />
          <span class="flex-1 text-[12px] font-medium text-gray-300">{{ group.name }}</span>
          <span class="text-[10px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded-full">
            {{ group.layers?.length || 0 }}
          </span>
          <button class="opacity-0 group-hover/folder:opacity-100 p-1 rounded text-gray-500 hover:bg-gray-700 hover:text-gray-50 transition-all"
                  @click.stop="addLayerToGroup(group)" title="Add Layer">
            <i class="pi pi-plus text-[10px]" />
          </button>
        </div>

        <!-- Layers inside group -->
        <div v-if="expandedGroups[group.uuid]" class="pl-4 pb-1">
          <div v-for="layer in group.layers" :key="layer.uuid"
               class="group/layer flex items-center gap-2 py-1.5 px-3 rounded-l-md transition-colors m-0.5"
               :class="activeLayerUuid === layer.uuid
                 ? 'bg-emerald-900/40 border-l-2 border-emerald-500'
                 : 'hover:bg-gray-800'">

            <!-- Visibility checkbox -->
            <input type="checkbox"
                   :checked="visibleLayers[layer.uuid] !== false"
                   @change="toggleLayerVisibility(layer.uuid, $event.target.checked)"
                   class="w-3.5 h-3.5 accent-emerald-500 cursor-pointer shrink-0" />

            <!-- Geom icon + name (non-clickable) -->
            <i class="pi text-[10px] shrink-0"
               :class="getGeomIcon(layer.geometry_type)"
               :style="{ color: getLayerColor(layer.uuid) }" />
            <span class="flex-1 text-[12px] text-gray-300 truncate select-none">
              {{ layer.display_name || layer.name }}
            </span>
            <span class="text-[10px] text-gray-500 shrink-0">{{ layer.feature_count }}</span>

            <!-- Ellipsis menu trigger -->
            <button class="opacity-0 group-hover/layer:opacity-100 p-1 rounded text-gray-500
                           hover:bg-gray-700 hover:text-gray-200 transition-all shrink-0"
                    @click.stop="openMenu($event, layer)"
                    title="Options">
              <i class="pi pi-ellipsis-v text-[11px]" />
            </button>
          </div>

          <!-- Empty layer state -->
          <div v-if="!group.layers?.length"
               class="flex items-center gap-2 py-2 px-3 text-gray-500 text-[12px] italic">
            <span>No layers</span>
            <button class="text-emerald-500 hover:underline" @click="addLayerToGroup(group)">+ Add layer</button>
          </div>
        </div>
      </div>

      <!-- No groups empty state -->
      <div v-if="!groups.length" class="flex flex-col items-center justify-center p-8 gap-2 text-gray-500">
        <i class="pi pi-folder text-2xl" />
        <p class="text-[13px]">No layer groups yet</p>
        <button class="text-emerald-500 hover:underline text-[12px]" @click="showCreateGroup = true">
          Create group
        </button>
      </div>
    </div>

    <!-- Ungrouped layers -->
    <div v-if="ungroupedLayers.length" class="border-t border-gray-800 py-2">
      <div class="flex justify-between items-center px-3 py-1.5 text-[10px] text-gray-500 uppercase tracking-widest">
        <span>Ungrouped</span>
        <button class="p-1 hover:text-emerald-500" @click="showCreateLayer = true">
          <i class="pi pi-plus" />
        </button>
      </div>
      <div v-for="layer in ungroupedLayers" :key="layer.uuid"
           class="group/layer flex items-center gap-2 py-1.5 px-3 transition-colors hover:bg-gray-800"
           :class="activeLayerUuid === layer.uuid ? 'bg-emerald-900/30 border-l-2 border-emerald-500' : ''">
        <input type="checkbox" :checked="visibleLayers[layer.uuid] !== false"
               @change="toggleLayerVisibility(layer.uuid, $event.target.checked)"
               class="w-3.5 h-3.5 accent-emerald-500 shrink-0" />
        <i class="pi text-[10px] shrink-0"
           :class="getGeomIcon(layer.geometry_type)"
           :style="{ color: getLayerColor(layer.uuid) }" />
        <span class="flex-1 text-[12px] text-gray-300 truncate select-none">
          {{ layer.display_name || layer.name }}
        </span>
        <span class="text-[10px] text-gray-600 shrink-0">{{ layer.feature_count }}</span>
        <button class="opacity-0 group-hover/layer:opacity-100 p-1 rounded text-gray-500
                       hover:bg-gray-700 hover:text-gray-200 transition-all shrink-0"
                @click.stop="openMenu($event, layer)" title="Options">
          <i class="pi pi-ellipsis-v text-[11px]" />
        </button>
      </div>
    </div>

    <!-- Bottom actions -->
    <div class="flex gap-2 p-3 border-t border-gray-800 bg-gray-900/50">
      <button @click="showCreateLayer = true"
              class="flex-1 flex items-center justify-center gap-2 p-2 rounded-md border border-gray-700
                     bg-gray-800 text-gray-400 text-[12px] hover:bg-gray-700 hover:text-gray-100 transition-all">
        <i class="pi pi-plus" /> New Layer
      </button>
      <button @click="showUploadDialog = true"
              class="flex-1 flex items-center justify-center gap-2 p-2 rounded-md border border-gray-700
                     bg-gray-800 text-gray-400 text-[12px] hover:bg-gray-700 hover:text-gray-100 transition-all">
        <i class="pi pi-upload" /> Upload
      </button>
    </div>

    <!-- Context Menu (ellipsis) -->
    <Menu ref="layerMenu" :model="menuItems" popup />

    <!-- ── DIALOGS ────────────────────────────────────────────── -->

    <!-- Create Group -->
    <Dialog v-model:visible="showCreateGroup" header="New layer group" :modal="true" :style="{ width: '360px' }">
      <div class="flex flex-col gap-3 pt-2">
        <InputText v-model="newGroup.name" placeholder="Group name" class="w-full" autofocus />
        <Textarea v-model="newGroup.description" placeholder="Description (optional)" rows="2" class="w-full" />
      </div>
      <template #footer>
        <Button label="Cancel" text severity="secondary" @click="showCreateGroup = false" />
        <Button label="Create" icon="pi pi-check" :loading="creating" @click="handleCreateGroup"
                class="bg-emerald-600 border-emerald-600" />
      </template>
    </Dialog>

    <!-- Create Layer -->
    <Dialog v-model:visible="showCreateLayer" header="New layer" :modal="true" :style="{ width: '400px' }">
      <div class="flex flex-col gap-3 pt-2">
        <div class="flex flex-col gap-1">
          <label class="text-[10px] text-gray-400 uppercase font-bold">Display name *</label>
          <InputText v-model="newLayer.display_name" placeholder="e.g. Farm Boundaries" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-[10px] text-gray-400 uppercase font-bold">Table name * (lowercase)</label>
          <InputText v-model="newLayer.table_name" placeholder="e.g. farm_boundaries" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-[10px] text-gray-400 uppercase font-bold">Geometry type *</label>
          <Select v-model="newLayer.geometry_type" :options="geometryTypes" class="w-full" />
        </div>
        <div v-if="groups.length" class="flex flex-col gap-1">
          <label class="text-[10px] text-gray-400 uppercase font-bold">Layer group</label>
          <Select v-model="newLayer.layergroup_uuid" :options="groupOptions"
                  option-label="name" option-value="uuid" placeholder="None" class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" text severity="secondary" @click="showCreateLayer = false" />
        <Button label="Create" icon="pi pi-check" :loading="creating" @click="handleCreateLayer"
                class="bg-emerald-600 border-emerald-600" />
      </template>
    </Dialog>

    <!-- Upload -->
    <Dialog v-model:visible="showUploadDialog"
            :header="'Upload to: ' + (uploadTargetLayer?.display_name || uploadTargetLayer?.name || 'Layer')"
            :modal="true" :style="{ width: '400px' }">
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col items-center gap-2 p-8 border-2 border-dashed border-gray-700 rounded-xl
                    cursor-pointer hover:border-emerald-500 hover:bg-emerald-500/5 transition-all"
             @dragover.prevent @drop.prevent="onFileDrop" @click="$refs.fileInput.click()">
          <i class="pi pi-upload text-2xl text-gray-500" />
          <p class="text-sm text-gray-400">Drop file or click to browse</p>
          <p class="text-[11px] text-gray-600 text-center">GeoJSON, Shapefile (.zip), KML, KMZ, GPX, CSV</p>
          <span v-if="pendingFile" class="text-xs text-emerald-400 mt-2 font-medium">{{ pendingFile.name }}</span>
        </div>
        <input ref="fileInput" type="file" class="hidden"
               accept=".geojson,.json,.kml,.kmz,.zip,.gpx,.csv"
               @change="onFileSelected" />
      </div>
      <template #footer>
        <Button label="Cancel" text severity="secondary" @click="showUploadDialog = false" />
        <Button label="Upload" icon="pi pi-upload" :loading="uploading" :disabled="!pendingFile"
                @click="handleUpload" class="bg-emerald-600 border-emerald-600" />
      </template>
    </Dialog>

    <!-- Post-upload attribute mapping -->
    <UploadMappingDialog
        v-model="showMappingDialog"
        :layer-uuid="uploadTargetLayer?.uuid"
        :attributes-found="attributesFound"
        @applied="fetchAll"
    />

    <!-- Rename Layer -->
    <Dialog v-model:visible="showRenameDialog" header="Rename layer" :modal="true" :style="{ width: '360px' }">
      <div class="pt-2">
        <InputText v-model="renameValue" class="w-full" autofocus />
      </div>
      <template #footer>
        <Button label="Cancel" text severity="secondary" @click="showRenameDialog = false" />
        <Button label="Save" icon="pi pi-check" :loading="creating" @click="handleRename"
                class="bg-emerald-600 border-emerald-600" />
      </template>
    </Dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import Dialog    from 'primevue/dialog'
import Button    from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea  from 'primevue/textarea'
import Select    from 'primevue/select'
import Menu      from 'primevue/menu'
import UploadMappingDialog from '@/components/Dialog/UploadMappingDialog.vue'
import {
  getLayerGroups, createLayerGroup,
  getLayers, createLayer, deleteLayer,
  uploadFile as uploadLayerFile,
} from '@/services/api'
import { getLayerColor } from '@/utils/layerColors'

const props = defineProps({ projectUuid: String, activeLayerUuid: String })
const emit  = defineEmits(['layer-selected', 'layer-toggled', 'open-attribute-table', 'layers-loaded', 'layer-renamed'])

const toast   = useToast()
const loading = ref(false)
const groups  = ref([])
const ungroupedLayers = ref([])
const expandedGroups  = ref({})
const visibleLayers   = ref({})
const creating  = ref(false)
const uploading = ref(false)

// dialogs
const showCreateGroup  = ref(false)
const showCreateLayer  = ref(false)
const showUploadDialog = ref(false)
const showRenameDialog = ref(false)
const showMappingDialog = ref(false)

const uploadTargetLayer = ref(null)
const pendingFile       = ref(null)
const fileInput         = ref(null)
const renameValue       = ref('')
const attributesFound   = ref([])

const newGroup = ref({ name: '', description: '' })
const newLayer = ref({ display_name: '', table_name: '', geometry_type: 'POLYGON', layergroup_uuid: null })
const geometryTypes = ['POINT', 'LINESTRING', 'POLYGON', 'MULTIPOINT', 'MULTILINESTRING', 'MULTIPOLYGON']

// ── Context menu ───────────────────────────────────────────────
const layerMenu    = ref(null)
const menuLayer    = ref(null)

const menuItems = computed(() => [
  {
    label: 'View on map',
    icon:  'pi pi-map',
    command: () => emit('layer-selected', menuLayer.value),
  },
  {
    label: 'Open attribute table',
    icon:  'pi pi-table',
    command: () => emit('open-attribute-table', menuLayer.value),
  },
  { separator: true },
  {
    label: 'Upload data',
    icon:  'pi pi-upload',
    command: () => {
      uploadTargetLayer.value = menuLayer.value
      showUploadDialog.value  = true
    },
  },
  {
    label: 'Rename',
    icon:  'pi pi-pencil',
    command: () => {
      renameValue.value    = menuLayer.value?.display_name || menuLayer.value?.name || ''
      showRenameDialog.value = true
    },
  },
  { separator: true },
  {
    label: 'Delete',
    icon:  'pi pi-trash',
    class: 'text-red-400',
    command: () => confirmDeleteLayer(menuLayer.value),
  },
])

function openMenu(event, layer) {
  menuLayer.value = layer
  layerMenu.value.show(event)
}

// ── Data ───────────────────────────────────────────────────────
const geomIcons = {
  POINT: 'pi-map-marker', MULTIPOINT: 'pi-map-marker',
  LINESTRING: 'pi-minus', MULTILINESTRING: 'pi-minus',
  POLYGON: 'pi-vector',   MULTIPOLYGON: 'pi-vector',
}
const getGeomIcon = (type) => geomIcons[type?.toUpperCase()] || 'pi-map'

const groupOptions = computed(() => groups.value.map(g => ({ name: g.name, uuid: g.uuid })))

onMounted(fetchAll)

async function fetchAll() {
  loading.value = true
  try {
    const [groupsRes, layersRes] = await Promise.all([
      getLayerGroups(props.projectUuid),
      getLayers(props.projectUuid),
    ])
    const allLayers = layersRes.data || []
    groups.value    = groupsRes.data || []
    groups.value.forEach(g => {
      g.layers = allLayers.filter(l => l.layer_group_id === g.id || l.layergroup_uuid === g.uuid)
      expandedGroups.value[g.uuid] = true
    })
    const groupedUuids = groups.value.flatMap(g => (g.layers || []).map(l => l.uuid))
    ungroupedLayers.value = allLayers.filter(l => !groupedUuids.includes(l.uuid))
    emit('layers-loaded', allLayers)
  } finally {
    loading.value = false
  }
}

defineExpose({ refresh: fetchAll })

function toggleGroup(uuid) {
  expandedGroups.value[uuid] = !expandedGroups.value[uuid]
}

function toggleLayerVisibility(uuid, visible) {
  visibleLayers.value[uuid] = visible
  emit('layer-toggled', { uuid, visible })
}

function addLayerToGroup(group) {
  newLayer.value.layergroup_uuid = group.uuid
  showCreateLayer.value = true
}

// ── Handlers ───────────────────────────────────────────────────
async function handleCreateGroup() {
  if (!newGroup.value.name.trim()) return
  creating.value = true
  try {
    await createLayerGroup({ ...newGroup.value, project_uuid: props.projectUuid })
    toast.add({ severity: 'success', summary: 'Group created', life: 2000 })
    showCreateGroup.value = false
    newGroup.value = { name: '', description: '' }
    await fetchAll()
  } catch {
    toast.add({ severity: 'error', summary: 'Error creating group', life: 3000 })
  } finally { creating.value = false }
}

async function handleCreateLayer() {
  if (!newLayer.value.display_name || !newLayer.value.table_name) {
    toast.add({ severity: 'warn', summary: 'Fill in required fields', life: 2000 })
    return
  }
  creating.value = true
  try {
    await createLayer({ ...newLayer.value, project_uuid: props.projectUuid })
    toast.add({ severity: 'success', summary: 'Layer created', life: 2000 })
    showCreateLayer.value = false
    newLayer.value = { display_name: '', table_name: '', geometry_type: 'POLYGON', layergroup_uuid: null }
    await fetchAll()
  } catch (err) {
    toast.add({ severity: 'error', summary: err.response?.data?.error || 'Error creating layer', life: 3000 })
  } finally { creating.value = false }
}

async function handleRename() {
  if (!renameValue.value.trim() || !menuLayer.value) return
  creating.value = true
  try {
    // patch display_name via updateFeature or a dedicated layer update endpoint
    // emit up so MapView can call the API if needed
    emit('layer-renamed', { layer: menuLayer.value, name: renameValue.value.trim() })
    showRenameDialog.value = false
    await fetchAll()
  } finally { creating.value = false }
}

function onFileSelected(evt) { pendingFile.value = evt.target.files[0] }
function onFileDrop(evt)     { pendingFile.value = evt.dataTransfer.files[0] }

async function handleUpload() {
  if (!pendingFile.value || !uploadTargetLayer.value) return
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', pendingFile.value)
    const res = await uploadLayerFile(uploadTargetLayer.value.uuid, formData)
    toast.add({ severity: 'success', summary: 'Upload successful', life: 2000 })
    showUploadDialog.value = false
    pendingFile.value = null

    attributesFound.value = res.data?.attributes_found || []
    if (attributesFound.value.length) {
      showMappingDialog.value = true
    } else {
      await fetchAll()
    }
  } catch (err) {
    toast.add({ severity: 'error', summary: err.response?.data?.error || 'Upload failed', life: 3000 })
  } finally { uploading.value = false }
}

async function confirmDeleteLayer(layer) {
  if (!confirm(`Delete layer "${layer.display_name || layer.name}"?`)) return
  try {
    await deleteLayer(layer.uuid)
    toast.add({ severity: 'success', summary: 'Layer deleted', life: 2000 })
    await fetchAll()
  } catch {
    toast.add({ severity: 'error', summary: 'Delete failed', life: 3000 })
  }
}
</script>