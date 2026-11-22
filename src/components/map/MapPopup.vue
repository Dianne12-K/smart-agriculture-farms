<template>
  <Dialog :visible="popup.visible"
          :modal="false"
          draggable
          position="topright"
          :style="{ width: '320px' }"
          @update:visible="v => { if (!v) $emit('close') }">
    <template #header>
      <span class="text-[13px] font-semibold">
        {{ popup.feature?.properties?.farm_name || 'Feature ' + popup.feature?.id }}
      </span>
    </template>

    <!-- Body -->
    <div>
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
    </div>

    <!-- Actions -->
    <template #footer>
      <div class="flex gap-1.5 w-full">
        <Button label="Analytics" icon="pi pi-chart-line" size="small" severity="secondary" class="flex-1"
                @click="$emit('analytics', popup.feature)" />
        <Button label="Edit" icon="pi pi-pencil" size="small" severity="secondary" class="flex-1"
                @click="$emit('edit', popup.feature)" />
        <Button label="Attributes" icon="pi pi-sliders-h" size="small" severity="secondary" class="flex-1"
                title="Edit attribute values"
                @click="$emit('edit-attributes', popup.feature)" />
        <Button icon="pi pi-trash" size="small" severity="danger" text title="Delete feature"
                @click="$emit('delete', popup.feature)" />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

defineProps({ popup: Object })
defineEmits(['close', 'analytics', 'edit', 'edit-attributes', 'delete'])
</script>
