<template>
  <div class="h-12 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-3 gap-2 shrink-0 z-[100]">

    <!-- Left: back + project name -->
    <div class="flex items-center gap-1.5 min-w-[180px]">
      <button class="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-transparent text-gray-400
                     text-[13px] transition-all hover:bg-gray-700 hover:text-gray-50"
              @click="$emit('go-back')">
        <i class="pi pi-arrow-left" />
      </button>
      <div class="flex items-center gap-1.5 text-gray-200 text-[13px] font-medium">
        <i class="pi pi-map text-green-400 text-sm" />
        <span>{{ projectName }}</span>
      </div>
    </div>

    <!-- Center: tools -->
    <div class="flex items-center gap-1 flex-1 justify-center">

      <!-- Draw -->
      <div class="flex items-center gap-0.5 bg-gray-800 rounded-lg p-0.5">
        <button v-for="tool in drawTools" :key="tool.id"
                class="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-transparent text-gray-400
                       text-[13px] transition-all hover:bg-gray-700 hover:text-gray-50"
                :class="activeTool === tool.id ? 'bg-green-900 !text-green-400' : ''"
                :title="tool.label"
                @click="$emit('set-tool', tool.id)">
          <i :class="`pi ${tool.icon}`" />
        </button>
      </div>

      <div class="w-px h-6 bg-gray-700 mx-1" />

      <!-- Zoom -->
      <div class="flex items-center gap-0.5 bg-gray-800 rounded-lg p-0.5">
        <button class="flex items-center justify-center px-2.5 py-1.5 rounded-md bg-transparent text-gray-400
                       text-[13px] transition-all hover:bg-gray-700 hover:text-gray-50"
                title="Zoom In" @click="$emit('zoom-in')">
          <i class="pi pi-plus" />
        </button>
        <button class="flex items-center justify-center px-2.5 py-1.5 rounded-md bg-transparent text-gray-400
                       text-[13px] transition-all hover:bg-gray-700 hover:text-gray-50"
                title="Zoom Out" @click="$emit('zoom-out')">
          <i class="pi pi-minus" />
        </button>
        <button class="flex items-center justify-center px-2.5 py-1.5 rounded-md bg-transparent text-gray-400
                       text-[13px] transition-all hover:bg-gray-700 hover:text-gray-50"
                title="Zoom to Extent" @click="$emit('zoom-extent')">
          <i class="pi pi-expand" />
        </button>
      </div>

      <div class="w-px h-6 bg-gray-700 mx-1" />

      <!-- Basemap -->
      <Select :model-value="basemap" :options="basemaps" option-label="name" option-value="id"
              class="!h-8 !text-[13px] !bg-gray-800 !border-gray-700 !text-gray-300 w-44"
              @update:model-value="(id) => $emit('set-basemap', id)" />
    </div>

    <!-- Right: panel toggles -->
    <div class="flex items-center gap-1.5 min-w-[180px] justify-end">
      <button class="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-transparent text-gray-400
                     text-[13px] transition-all hover:bg-gray-700 hover:text-gray-50"
              @click="$emit('toggle-layers')">
        <i class="pi pi-th-large" />
        <span class="text-xs ml-1">Layers</span>
      </button>
      <button class="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-transparent text-gray-400
                     text-[13px] transition-all hover:bg-gray-700 hover:text-gray-50"
              :class="hasFeature ? 'bg-green-900 !text-green-400' : ''"
              @click="$emit('toggle-analytics')">
        <i class="pi pi-chart-bar" />
        <span class="text-xs ml-1">Analytics</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import Select from 'primevue/select'

defineProps({
  projectName: String,
  activeTool:  String,
  basemap:     String,
  basemaps:    { type: Array, default: () => [] },
  hasFeature:  Boolean,
})

defineEmits(['go-back', 'set-tool', 'zoom-in', 'zoom-out', 'zoom-extent',
  'set-basemap', 'toggle-layers', 'toggle-analytics'])

const drawTools = [
  { id: 'pan',          icon: 'pi-hand-paper', label: 'Pan' },
  { id: 'draw-point',   icon: 'pi-map-marker', label: 'Draw Point' },
  { id: 'draw-polygon', icon: 'pi-vector',     label: 'Draw Polygon' },
  { id: 'draw-line',    icon: 'pi-minus',      label: 'Draw Line' },
]
</script>