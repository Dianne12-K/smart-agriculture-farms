<template>
  <div class="p-6 pb-24 lg:pb-8">
    <div class="max-w-7xl mx-auto">

      <!-- Page Header -->
      <div class="mb-6">
        <h1 class="text-[30px] font-bold text-[#dce2f7] tracking-tight">Layer Management</h1>
        <p class="text-[14px] text-[#bccbb9] mt-1">
          Control visibility, data structures, and uploads for geospatial assets.
        </p>
      </div>

      <!-- Project Selector Bar -->
      <div class="bg-[#191f2f] border border-[#3d4a3d] rounded-xl p-5 mb-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div class="flex flex-col gap-1.5 flex-1">
            <label class="text-[10px] font-semibold tracking-widest uppercase text-[#869585]">
              Select Project
            </label>
            <Select
                v-model="selectedProjectUuid"
                :options="projectOptions"
                option-label="name"
                option-value="uuid"
                placeholder="Choose a project..."
                class="w-full sm:w-80"
            />
          </div>
          <div v-if="selectedProjectUuid" class="flex gap-2 sm:mt-5">
            <Button
                label="New Group"
                icon="pi pi-folder-plus"
                severity="secondary"
                outlined
                size="small"
                @click="openCreateGroup"
            />
            <Button
                label="New Layer"
                icon="pi pi-plus"
                size="small"
                class="!bg-[#22c55e] !border-[#22c55e] !text-[#003915] font-bold"
                @click="openCreateLayer(null)"
            />
          </div>
        </div>
      </div>

      <!-- No project selected -->
      <div v-if="!selectedProjectUuid"
           class="flex flex-col items-center justify-center py-28 text-center">
        <div class="w-16 h-16 rounded-2xl bg-[#232a3a] border border-[#3d4a3d]
                    flex items-center justify-center mb-4">
          <i class="pi pi-th-large text-3xl text-[#869585]" />
        </div>
        <p class="text-[#bccbb9] text-sm">Select a project to manage its layers</p>
      </div>

      <!-- Main content: sidebar + detail panel -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-5">

        <!-- LEFT: Layer Tree -->
        <div class="lg:col-span-4 bg-[#191f2f] border border-[#3d4a3d] rounded-xl overflow-hidden flex flex-col">

          <!-- Sidebar Header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-[#3d4a3d]">
            <span class="text-[13px] font-semibold text-[#dce2f7]">Layers</span>
            <button class="p-1 px-1.5 rounded text-[#869585] hover:bg-[#232a3a] hover:text-[#dce2f7] transition-colors"
                    title="New Group" @click="openCreateGroup">
              <i class="pi pi-plus text-xs" />
            </button>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="flex items-center gap-2 p-5 text-[#869585] text-[13px]">
            <i class="pi pi-spin pi-spinner text-[#22c55e]" />
            <span>Loading layers...</span>
          </div>

          <!-- Layer Groups -->
          <div v-else class="flex-1 overflow-y-auto py-2">

            <div v-for="group in groups" :key="group.uuid" class="group/folder">
              <!-- Group Row -->
              <div class="flex items-center gap-2 py-2 px-3 cursor-pointer select-none
                          hover:bg-[#232a3a] transition-colors"
                   @click="toggleGroup(group.uuid)">
                <i class="pi text-[10px] text-[#869585] transition-transform duration-200"
                   :class="expandedGroups[group.uuid] ? 'pi-chevron-down' : 'pi-chevron-right'" />
                <i class="pi pi-folder text-yellow-400 text-xs" />
                <span class="flex-1 text-[12px] font-medium text-[#bccbb9]">{{ group.name }}</span>
                <span class="text-[10px] bg-[#232a3a] text-[#869585] px-1.5 py-0.5 rounded-full">
                  {{ group.layers?.length || 0 }}
                </span>
                <button class="opacity-0 group-hover/folder:opacity-100 p-1 rounded
                               text-[#869585] hover:bg-[#2e3545] hover:text-[#dce2f7] transition-all"
                        @click.stop="openCreateLayer(group.uuid)" title="Add Layer">
                  <i class="pi pi-plus text-[10px]" />
                </button>
              </div>

              <!-- Layers inside group -->
              <div v-if="expandedGroups[group.uuid]" class="pl-4 pb-1">
                <div v-for="layer in group.layers" :key="layer.uuid"
                     class="group/layer flex items-center gap-2 py-1.5 px-3 rounded-l-md
                            transition-colors m-0.5 cursor-pointer"
                     :class="selectedLayer?.uuid === layer.uuid
                       ? 'bg-emerald-900/40 border-l-2 border-[#22c55e]'
                       : 'hover:bg-[#232a3a]'"
                     @click="selectLayer(layer)">
                  <input type="checkbox"
                         :checked="visibleLayers[layer.uuid] !== false"
                         @change="toggleLayerVisibility(layer.uuid, $event.target.checked)"
                         @click.stop
                         class="w-3.5 h-3.5 accent-[#22c55e] cursor-pointer shrink-0" />
                  <i class="pi text-[10px] shrink-0"
                     :class="getGeomIcon(layer.geometry_type)"
                     :style="{ color: getLayerColor(layer.uuid) }" />
                  <span class="flex-1 text-[12px] text-[#dce2f7] truncate select-none">
                    {{ layer.display_name || layer.name }}
                  </span>
                  <span class="text-[10px] text-[#869585] shrink-0">{{ layer.feature_count }}</span>
                  <button class="opacity-0 group-hover/layer:opacity-100 p-1 rounded
                                 text-[#869585] hover:bg-[#2e3545] hover:text-[#dce2f7] transition-all shrink-0"
                          @click.stop="openLayerMenu($event, layer)" title="Options">
                    <i class="pi pi-ellipsis-v text-[11px]" />
                  </button>
                </div>

                <div v-if="!group.layers?.length"
                     class="flex items-center gap-2 py-2 px-3 text-[#869585] text-[12px] italic">
                  <span>No layers</span>
                  <button class="text-[#22c55e] hover:underline"
                          @click="openCreateLayer(group.uuid)">+ Add layer</button>
                </div>
              </div>
            </div>

            <!-- No groups -->
            <div v-if="!groups.length"
                 class="flex flex-col items-center justify-center p-8 gap-2 text-[#869585]">
              <i class="pi pi-folder text-2xl" />
              <p class="text-[13px]">No layer groups yet</p>
              <button class="text-[#22c55e] hover:underline text-[12px]"
                      @click="openCreateGroup">Create group</button>
            </div>

            <!-- Ungrouped layers -->
            <div v-if="ungroupedLayers.length" class="border-t border-[#3d4a3d] py-2 mt-1">
              <div class="flex justify-between items-center px-3 py-1.5
                          text-[10px] text-[#869585] uppercase tracking-widest">
                <span>Ungrouped</span>
                <button class="p-1 hover:text-[#22c55e]" @click="openCreateLayer(null)">
                  <i class="pi pi-plus" />
                </button>
              </div>
              <div v-for="layer in ungroupedLayers" :key="layer.uuid"
                   class="group/layer flex items-center gap-2 py-1.5 px-3 transition-colors
                          hover:bg-[#232a3a] cursor-pointer"
                   :class="selectedLayer?.uuid === layer.uuid
                     ? 'bg-emerald-900/30 border-l-2 border-[#22c55e]' : ''"
                   @click="selectLayer(layer)">
                <input type="checkbox"
                       :checked="visibleLayers[layer.uuid] !== false"
                       @change="toggleLayerVisibility(layer.uuid, $event.target.checked)"
                       @click.stop
                       class="w-3.5 h-3.5 accent-[#22c55e] shrink-0" />
                <i class="pi text-[10px] shrink-0"
                   :class="getGeomIcon(layer.geometry_type)"
                   :style="{ color: getLayerColor(layer.uuid) }" />
                <span class="flex-1 text-[12px] text-[#dce2f7] truncate select-none">
                  {{ layer.display_name || layer.name }}
                </span>
                <span class="text-[10px] text-[#869585] shrink-0">{{ layer.feature_count }}</span>
                <button class="opacity-0 group-hover/layer:opacity-100 p-1 rounded
                               text-[#869585] hover:bg-[#2e3545] hover:text-[#dce2f7] transition-all shrink-0"
                        @click.stop="openLayerMenu($event, layer)" title="Options">
                  <i class="pi pi-ellipsis-v text-[11px]" />
                </button>
              </div>
            </div>
          </div>

          <!-- Bottom actions -->
          <div class="flex gap-2 p-3 border-t border-[#3d4a3d]">
            <button @click="openCreateLayer(null)"
                    class="flex-1 flex items-center justify-center gap-2 p-2 rounded-md
                           border border-[#3d4a3d] bg-[#232a3a] text-[#bccbb9] text-[12px]
                           hover:bg-[#2e3545] hover:text-[#dce2f7] transition-all">
              <i class="pi pi-plus" /> New Layer
            </button>
            <button @click="openUpload(null)"
                    class="flex-1 flex items-center justify-center gap-2 p-2 rounded-md
                           border border-[#3d4a3d] bg-[#232a3a] text-[#bccbb9] text-[12px]
                           hover:bg-[#2e3545] hover:text-[#dce2f7] transition-all">
              <i class="pi pi-upload" /> Upload
            </button>
          </div>
        </div>

        <!-- RIGHT: Detail Panel -->
        <div class="lg:col-span-8 bg-[#191f2f] border border-[#3d4a3d] rounded-xl
                    overflow-hidden flex flex-col min-h-[520px]">

          <!-- No layer selected -->
          <div v-if="!selectedLayer"
               class="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
            <div class="w-14 h-14 rounded-2xl bg-[#232a3a] border border-[#3d4a3d]
                        flex items-center justify-center">
              <i class="pi pi-map text-2xl text-[#869585]" />
            </div>
            <p class="text-[#bccbb9] text-sm">Select a layer to view its details</p>
          </div>

          <!-- Layer Detail -->
          <template v-else>
            <!-- Detail Header -->
            <div class="px-5 py-4 border-b border-[#3d4a3d] bg-[#1c2334]
                        flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-emerald-900/30 border border-emerald-700/40
                            flex items-center justify-center">
                  <i class="pi text-[#22c55e]"
                     :class="getGeomIcon(selectedLayer.geometry_type)" />
                </div>
                <div>
                  <h3 class="text-[15px] font-semibold text-[#dce2f7]">
                    {{ selectedLayer.display_name || selectedLayer.name }}
                  </h3>
                  <p class="text-[11px] text-[#869585] mt-0.5">
                    {{ selectedLayer.geometry_type }} &nbsp;·&nbsp;
                    {{ selectedLayer.feature_count ?? 0 }} features
                  </p>
                </div>
              </div>
              <div class="flex gap-2">
                <Button label="Rename" icon="pi pi-pencil" severity="secondary"
                        outlined size="small" @click="openRename" />
                <Button label="Delete" icon="pi pi-trash" severity="danger"
                        outlined size="small" @click="confirmDelete" />
              </div>
            </div>

            <!-- Tabs -->
            <div class="flex border-b border-[#3d4a3d] bg-[#191f2f] px-4">
              <button v-for="tab in tabs" :key="tab.key"
                      class="py-3 px-5 text-[12px] font-semibold tracking-wide transition-all border-b-2"
                      :class="activeTab === tab.key
                        ? 'border-[#22c55e] text-[#22c55e]'
                        : 'border-transparent text-[#869585] hover:text-[#bccbb9]'"
                      @click="activeTab = tab.key">
                {{ tab.label }}
              </button>
            </div>

            <!-- Tab: Overview -->
            <div v-if="activeTab === 'overview'" class="p-5 flex-1 overflow-y-auto space-y-4">
              <div class="grid grid-cols-3 gap-3">
                <div v-for="stat in overviewStats" :key="stat.label"
                     class="bg-[#0c1322] border border-[#3d4a3d] rounded-lg p-4 flex flex-col gap-1">
                  <span class="text-[10px] text-[#869585] uppercase tracking-wider">{{ stat.label }}</span>
                  <span class="text-[22px] font-bold text-[#dce2f7]">{{ stat.value }}</span>
                  <span class="text-[10px] text-[#869585]">{{ stat.sub }}</span>
                </div>
              </div>
              <div class="bg-[#0c1322] border border-[#3d4a3d] rounded-lg overflow-hidden">
                <div class="px-4 py-3 border-b border-[#3d4a3d] flex justify-between items-center">
                  <span class="text-[11px] font-semibold text-[#bccbb9] uppercase tracking-wider">
                    Layer Info
                  </span>
                </div>
                <div class="p-4 grid grid-cols-2 gap-3 text-[13px]">
                  <div>
                    <span class="text-[10px] text-[#869585] uppercase tracking-wide block mb-1">Table Name</span>
                    <span class="font-mono text-[#dce2f7]">{{ selectedLayer.name }}</span>
                  </div>
                  <div>
                    <span class="text-[10px] text-[#869585] uppercase tracking-wide block mb-1">Geometry</span>
                    <span class="text-[#dce2f7]">{{ selectedLayer.geometry_type }}</span>
                  </div>
                  <div>
                    <span class="text-[10px] text-[#869585] uppercase tracking-wide block mb-1">Project</span>
                    <span class="text-[#dce2f7]">{{ currentProjectName }}</span>
                  </div>
                  <div>
                    <span class="text-[10px] text-[#869585] uppercase tracking-wide block mb-1">UUID</span>
                    <span class="font-mono text-[11px] text-[#bccbb9] truncate block">
                      {{ selectedLayer.uuid }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tab: Attributes -->
            <div v-if="activeTab === 'attributes'" class="p-5 flex-1 overflow-y-auto space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-[12px] font-semibold text-[#bccbb9]">
                  Attributes ({{ attributes.length }})
                </span>
                <button class="flex items-center gap-1.5 text-[11px] text-[#22c55e]
                               bg-emerald-900/20 border border-emerald-700/40 px-3 py-1.5
                               rounded hover:bg-emerald-900/40 transition-colors"
                        @click="showAddAttribute = true">
                  <i class="pi pi-plus text-[10px]" /> Add Attribute
                </button>
              </div>

              <div v-if="loadingAttributes"
                   class="flex items-center gap-2 py-6 text-[#869585] text-[13px]">
                <i class="pi pi-spin pi-spinner text-[#22c55e]" />
                <span>Loading attributes...</span>
              </div>

              <div v-else-if="attributes.length"
                   class="border border-[#3d4a3d] rounded-lg overflow-x-auto">
                <table class="w-full text-left">
                  <thead>
                  <tr class="bg-[#232a3a] border-b border-[#3d4a3d]">
                    <th class="p-3 text-[10px] font-semibold text-[#869585] uppercase tracking-wider">Name</th>
                    <th class="p-3 text-[10px] font-semibold text-[#869585] uppercase tracking-wider">Type</th>
                    <th class="p-3 text-[10px] font-semibold text-[#869585] uppercase tracking-wider">Required</th>
                    <th class="p-3 text-[10px] font-semibold text-[#869585] uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="attr in attributes" :key="attr.id"
                      class="border-b border-[#3d4a3d] hover:bg-[#232a3a]/50 transition-colors">
                    <td class="p-3 font-mono text-[12px] text-[#dce2f7]">{{ attr.name }}</td>
                    <td class="p-3">
                        <span class="bg-[#232a3a] text-[#bccbb9] text-[10px] px-2 py-0.5 rounded">
                          {{ attr.type }}
                        </span>
                    </td>
                    <td class="p-3">
                      <i :class="attr.required ? 'pi-check text-[#22c55e]' : 'pi-minus text-[#869585]'"
                         class="pi text-[12px]" />
                    </td>
                    <td class="p-3 text-right">
                      <button class="text-[#869585] hover:text-red-400 transition-colors"
                              @click="deleteAttr(attr.id)">
                        <i class="pi pi-trash text-[12px]" />
                      </button>
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>

              <div v-else class="flex flex-col items-center justify-center py-12 text-[#869585]">
                <i class="pi pi-list text-2xl mb-2" />
                <p class="text-[13px]">No attributes defined yet</p>
              </div>
            </div>

            <!-- Tab: Upload -->
            <div v-if="activeTab === 'upload'"
                 class="p-5 flex-1 flex flex-col items-center justify-center">
              <div class="w-full max-w-md border-2 border-dashed border-[#3d4a3d] rounded-xl
                          p-10 flex flex-col items-center gap-4
                          hover:border-[#22c55e] hover:bg-emerald-900/5 transition-all cursor-pointer"
                   @dragover.prevent @drop.prevent="onFileDrop"
                   @click="$refs.fileInput.click()">
                <div class="w-14 h-14 rounded-full bg-[#232a3a] flex items-center justify-center">
                  <i class="pi pi-upload text-2xl text-[#22c55e]" />
                </div>
                <div class="text-center">
                  <p class="text-[14px] font-semibold text-[#dce2f7]">
                    Click to upload or drag and drop
                  </p>
                  <p class="text-[12px] text-[#869585] mt-1">
                    GeoJSON, Shapefile (.zip), KML, KMZ, GPX, CSV
                  </p>
                </div>
                <span v-if="pendingFile" class="text-[12px] text-[#22c55e] font-medium">
                  {{ pendingFile.name }}
                </span>
              </div>
              <input ref="fileInput" type="file" class="hidden"
                     accept=".geojson,.json,.kml,.kmz,.zip,.gpx,.csv"
                     @change="onFileSelected" />
              <Button v-if="pendingFile" label="Upload" icon="pi pi-upload"
                      :loading="uploading"
                      class="mt-4 !bg-[#22c55e] !border-[#22c55e] !text-[#003915] font-bold"
                      @click="handleUpload" />
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Context Menu -->
    <Menu ref="layerMenu" :model="menuItems" popup />

    <!-- Dialogs -->
    <CreateGroupDialog
        v-model="showCreateGroup"
        :project-uuid="selectedProjectUuid"
        @created="handleGroupCreated"
    />

    <CreateLayerDialog
        v-model="showCreateLayer"
        :project-uuid="selectedProjectUuid"
        :group-options="groupOptions"
        :preset-group-uuid="presetGroupUuid"
        @created="handleLayerCreated"
    />

    <RenameLayerDialog
        v-model="showRenameDialog"
        :initial-value="renameInitialValue"
        @renamed="handleRenamed"
    />

    <AddAttributeDialog
        v-model="showAddAttribute"
        @created="handleAttributeCreated"
    />

    <DeleteLayerDialog
        v-model="showDeleteDialog"
        :layer-name="deleteTargetName"
        @confirmed="handleDeleteLayer"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useProjectsStore } from '@/stores/projects'
import {
  getLayerGroups, createLayerGroup,
  getLayers, createLayer, deleteLayer,
  getAttributes, addAttributes, deleteAttribute,
  uploadFile as uploadLayerFile,
} from '@/services/api'

import Select  from 'primevue/select'
import Button  from 'primevue/button'
import Menu    from 'primevue/menu'

import CreateGroupDialog  from '@/components/Dialog/CreateGroupDialog.vue'
import CreateLayerDialog  from '@/components/Dialog/CreateLayerDialog.vue'
import RenameLayerDialog  from '@/components/Dialog/RenameLayerDialog.vue'
import AddAttributeDialog from '@/components/Dialog/AddAttributeDialog.vue'
import DeleteLayerDialog  from '@/components/Dialog/DeleteLayerDialog.vue'

const toast         = useToast()
const projectsStore = useProjectsStore()

// ── State ──────────────────────────────────────────────────────
const selectedProjectUuid = ref(null)
const loading             = ref(false)
const groups              = ref([])
const ungroupedLayers     = ref([])
const expandedGroups      = ref({})
const visibleLayers       = ref({})
const selectedLayer       = ref(null)
const activeTab           = ref('overview')

const uploading         = ref(false)
const loadingAttributes = ref(false)

// Dialogs
const showCreateGroup  = ref(false)
const showCreateLayer  = ref(false)
const showRenameDialog = ref(false)
const showDeleteDialog = ref(false)
const showAddAttribute = ref(false)

// Dialog state
const presetGroupUuid    = ref(null)
const renameInitialValue = ref('')
const deleteTargetName   = ref('')

// Attributes
const attributes = ref([])

// Upload
const pendingFile = ref(null)
const fileInput   = ref(null)

// Context menu
const layerMenu = ref(null)
const menuLayer = ref(null)

// ── Constants ──────────────────────────────────────────────────
const tabs = [
  { key: 'overview',   label: 'Overview' },
  { key: 'attributes', label: 'Attributes' },
  { key: 'upload',     label: 'Upload' },
]

const LAYER_COLORS = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899']
const geomIcons = {
  POINT: 'pi-map-marker', MULTIPOINT: 'pi-map-marker',
  LINESTRING: 'pi-minus', MULTILINESTRING: 'pi-minus',
  POLYGON: 'pi-vector',   MULTIPOLYGON: 'pi-vector',
}

// ── Computed ───────────────────────────────────────────────────
const projectOptions = computed(() =>
    projectsStore.projects.map(p => ({ name: p.name, uuid: p.uuid }))
)

const groupOptions = computed(() =>
    groups.value.map(g => ({ name: g.name, uuid: g.uuid }))
)

const currentProjectName = computed(() =>
    projectsStore.projects.find(p => p.uuid === selectedProjectUuid.value)?.name ?? '—'
)

const overviewStats = computed(() => [
  { label: 'Features',   value: selectedLayer.value?.feature_count ?? 0, sub: 'total features' },
  { label: 'Geometry',   value: selectedLayer.value?.geometry_type ?? '—', sub: 'geometry type' },
  { label: 'Attributes', value: attributes.value.length, sub: 'defined fields' },
])

const menuItems = computed(() => [
  {
    label: 'Rename',
    icon: 'pi pi-pencil',
    command: () => openRename(),
  },
  {
    label: 'Upload data',
    icon: 'pi pi-upload',
    command: () => { selectLayer(menuLayer.value); activeTab.value = 'upload' },
  },
  { separator: true },
  {
    label: 'Delete',
    icon: 'pi pi-trash',
    class: 'text-red-400',
    command: () => confirmDelete(),
  },
])

// ── Watchers ───────────────────────────────────────────────────
watch(selectedProjectUuid, (uuid) => {
  if (uuid) {
    selectedLayer.value = null
    fetchAll(uuid)
  }
})

watch(selectedLayer, async (layer) => {
  if (layer) {
    activeTab.value = 'overview'
    await fetchAttributes(layer.uuid)
  }
})

// ── Helpers ────────────────────────────────────────────────────
function hashCode(str) {
  return str.split('').reduce((a, c) => Math.imul(31, a) + c.charCodeAt(0) | 0, 0)
}
const getLayerColor = (uuid) => LAYER_COLORS[Math.abs(hashCode(uuid)) % LAYER_COLORS.length]
const getGeomIcon   = (type) => geomIcons[type?.toUpperCase()] || 'pi-map'

function toggleGroup(uuid) {
  expandedGroups.value[uuid] = !expandedGroups.value[uuid]
}

function toggleLayerVisibility(uuid, visible) {
  visibleLayers.value[uuid] = visible
}

function selectLayer(layer) {
  selectedLayer.value = layer
}

// ── Data ───────────────────────────────────────────────────────
async function fetchAll(projectUuid) {
  loading.value = true
  try {
    const [groupsRes, layersRes] = await Promise.all([
      getLayerGroups(projectUuid),
      getLayers(projectUuid),
    ])
    const allLayers = layersRes.data || []
    groups.value    = groupsRes.data || []
    groups.value.forEach(g => {
      g.layers = allLayers.filter(l => l.layer_group_id === g.id || l.layergroup_uuid === g.uuid)
      expandedGroups.value[g.uuid] = true
    })
    const groupedUuids = groups.value.flatMap(g => (g.layers || []).map(l => l.uuid))
    ungroupedLayers.value = allLayers.filter(l => !groupedUuids.includes(l.uuid))
  } catch {
    toast.add({ severity: 'error', summary: 'Failed to load layers', life: 3000 })
  } finally {
    loading.value = false
  }
}

async function fetchAttributes(layerUuid) {
  loadingAttributes.value = true
  try {
    const res = await getAttributes(layerUuid)
    attributes.value = res.data || []
  } catch {
    attributes.value = []
  } finally {
    loadingAttributes.value = false
  }
}

// ── Openers ────────────────────────────────────────────────────
function openCreateGroup() {
  showCreateGroup.value = true
}

function openCreateLayer(groupUuid) {
  presetGroupUuid.value = groupUuid
  showCreateLayer.value = true
}

function openRename() {
  const layer = menuLayer.value || selectedLayer.value
  renameInitialValue.value = layer?.display_name || layer?.name || ''
  showRenameDialog.value = true
}

function confirmDelete() {
  const layer = menuLayer.value || selectedLayer.value
  deleteTargetName.value = layer?.display_name || layer?.name || ''
  showDeleteDialog.value = true
}

function openUpload(layer) {
  if (layer) selectLayer(layer)
  activeTab.value = 'upload'
}

function openLayerMenu(event, layer) {
  menuLayer.value = layer
  selectLayer(layer)
  layerMenu.value.show(event)
}

// ── Handlers ───────────────────────────────────────────────────
async function handleGroupCreated(data) {
  try {
    await createLayerGroup(data)
    toast.add({ severity: 'success', summary: 'Group created', life: 2000 })
    await fetchAll(selectedProjectUuid.value)
  } catch {
    toast.add({ severity: 'error', summary: 'Failed to create group', life: 3000 })
  }
}

async function handleLayerCreated(data) {
  try {
    await createLayer(data)
    toast.add({ severity: 'success', summary: 'Layer created', life: 2000 })
    await fetchAll(selectedProjectUuid.value)
  } catch (err) {
    toast.add({ severity: 'error', summary: err.response?.data?.error || 'Failed to create layer', life: 3000 })
  }
}

async function handleRenamed(newName) {
  const layer = menuLayer.value || selectedLayer.value
  if (!layer) return
  layer.display_name = newName
  toast.add({ severity: 'success', summary: 'Layer renamed', life: 2000 })
}

async function handleDeleteLayer() {
  const layer = menuLayer.value || selectedLayer.value
  if (!layer) return
  try {
    await deleteLayer(layer.uuid)
    toast.add({ severity: 'success', summary: 'Layer deleted', life: 2000 })
    if (selectedLayer.value?.uuid === layer.uuid) selectedLayer.value = null
    menuLayer.value = null
    await fetchAll(selectedProjectUuid.value)
  } catch {
    toast.add({ severity: 'error', summary: 'Failed to delete layer', life: 3000 })
  }
}

async function handleAttributeCreated(attr) {
  if (!selectedLayer.value) return
  try {
    await addAttributes(selectedLayer.value.uuid, { attributes: [attr] })
    toast.add({ severity: 'success', summary: 'Attribute added', life: 2000 })
    await fetchAttributes(selectedLayer.value.uuid)
  } catch (err) {
    toast.add({ severity: 'error', summary: err.response?.data?.error || 'Failed to add attribute', life: 3000 })
  }
}

async function deleteAttr(attrId) {
  if (!selectedLayer.value) return
  try {
    await deleteAttribute(selectedLayer.value.uuid, attrId)
    toast.add({ severity: 'success', summary: 'Attribute deleted', life: 2000 })
    await fetchAttributes(selectedLayer.value.uuid)
  } catch {
    toast.add({ severity: 'error', summary: 'Failed to delete attribute', life: 3000 })
  }
}

function onFileSelected(evt) { pendingFile.value = evt.target.files[0] }
function onFileDrop(evt)     { pendingFile.value = evt.dataTransfer.files[0] }

async function handleUpload() {
  if (!pendingFile.value || !selectedLayer.value) return
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', pendingFile.value)
    await uploadLayerFile(selectedLayer.value.uuid, formData)
    toast.add({ severity: 'success', summary: 'Upload successful', life: 2000 })
    pendingFile.value = null
    await fetchAll(selectedProjectUuid.value)
  } catch (err) {
    toast.add({ severity: 'error', summary: err.response?.data?.error || 'Upload failed', life: 3000 })
  } finally {
    uploading.value = false
  }
}

// ── Init ───────────────────────────────────────────────────────
onMounted(() => {
  if (!projectsStore.projects.length) projectsStore.fetchProjects()
})
</script>