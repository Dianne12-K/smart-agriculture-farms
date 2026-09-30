<template>
  <div v-if="popup.visible"
       class="absolute bg-gray-800 border border-gray-700 rounded-xl min-w-[200px] z-[1000]
              shadow-[0_20px_60px_rgba(0,0,0,0.5)] -translate-x-1/2 -translate-y-full -mt-2"
       :style="{ left: popup.x + 'px', top: popup.y + 'px' }">

    <!-- Header -->
    <div class="flex items-center justify-between px-3 pt-2.5 pb-2 border-b border-gray-700">
      <span class="text-gray-50 text-[13px] font-semibold">
        {{ popup.feature?.properties?.farm_name || 'Feature ' + popup.feature?.id }}
      </span>
      <button class="bg-transparent border-none text-gray-500 cursor-pointer p-0.5 rounded hover:text-gray-50"
              @click="$emit('close')">
        <i class="pi pi-times" />
      </button>
    </div>

    <!-- Body -->
    <div class="px-3 py-2.5">
      <div v-if="popup.feature?.properties?.crop_type"
           class="flex items-center gap-2 text-gray-300 text-xs mb-1.5">
        <i class="pi pi-leaf text-green-400" />
        <span>{{ popup.feature.properties.crop_type }}</span>
      </div>
      <div v-if="popup.feature?.properties?.area_ha"
           class="flex items-center gap-2 text-gray-300 text-xs mb-1.5">
        <i class="pi pi-th-large text-blue-400" />
        <span>{{ popup.feature.properties.area_ha }} ha</span>
      </div>
      <div v-if="popup.feature?.properties?.owner"
           class="flex items-center gap-2 text-gray-300 text-xs mb-1.5">
        <i class="pi pi-user text-purple-400" />
        <span>{{ popup.feature.properties.owner }}</span>
      </div>
      <div v-if="popup.ndvi" class="flex items-center gap-2 text-gray-300 text-xs mb-1.5">
        <i class="pi pi-sun text-yellow-400" />
        <span>NDVI: {{ typeof popup.ndvi === 'number' ? popup.ndvi.toFixed(3) : popup.ndvi }}</span>
      </div>

      <!-- Actions -->
      <div class="flex gap-1.5 mt-2.5 pt-2.5 border-t border-gray-700">
        <button class="flex items-center justify-center gap-1 flex-1 px-2.5 py-1 rounded-md bg-gray-700
                       text-gray-300 text-[11px] transition-all hover:bg-gray-600 hover:text-white"
                @click="$emit('analytics', popup.feature)">
          <i class="pi pi-chart-line" /> Analytics
        </button>
        <button class="flex items-center justify-center gap-1 flex-1 px-2.5 py-1 rounded-md bg-gray-700
                       text-gray-300 text-[11px] transition-all hover:bg-gray-600 hover:text-white"
                @click="$emit('edit', popup.feature)">
          <i class="pi pi-pencil" /> Edit
        </button>
        <button class="flex items-center justify-center gap-1 flex-1 px-2.5 py-1 rounded-md bg-gray-700
                       text-gray-300 text-[11px] transition-all hover:bg-gray-600 hover:text-white"
                title="Edit attribute values"
                @click="$emit('edit-attributes', popup.feature)">
          <i class="pi pi-sliders-h" /> Attributes
        </button>
        <button class="flex items-center justify-center gap-1 px-2.5 py-1 rounded-md bg-gray-700
                       text-gray-300 text-[11px] transition-all hover:bg-red-800 hover:text-white"
                @click="$emit('delete', popup.feature)">
          <i class="pi pi-trash" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ popup: Object })
defineEmits(['close', 'analytics', 'edit', 'edit-attributes', 'delete'])
</script>