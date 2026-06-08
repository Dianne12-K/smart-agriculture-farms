<template>
  <Dialog v-model:visible="visible" header="New Layer" :modal="true" :style="{ width: '440px' }">
    <div class="grid grid-cols-2 gap-3 pt-2">
      <div class="flex flex-col gap-1 col-span-2 sm:col-span-1">
        <label class="text-[10px] text-[#869585] uppercase font-bold tracking-wider">Display Name *</label>
        <InputText v-model="form.display_name" placeholder="e.g. Farm Boundaries" class="w-full" autofocus />
      </div>
      <div class="flex flex-col gap-1 col-span-2 sm:col-span-1">
        <label class="text-[10px] text-[#869585] uppercase font-bold tracking-wider">Table Name *</label>
        <InputText v-model="form.table_name" placeholder="farm_boundaries_2024" class="w-full" />
      </div>
      <div class="flex flex-col gap-1 col-span-2 sm:col-span-1">
        <label class="text-[10px] text-[#869585] uppercase font-bold tracking-wider">Geometry Type *</label>
        <Select v-model="form.geometry_type" :options="geometryTypes" class="w-full" />
      </div>
      <div class="flex flex-col gap-1 col-span-2 sm:col-span-1">
        <label class="text-[10px] text-[#869585] uppercase font-bold tracking-wider">Layer Group</label>
        <Select v-model="form.layergroup_uuid" :options="groupOptions"
                option-label="name" option-value="uuid"
                placeholder="None" class="w-full" />
      </div>
    </div>
    <template #footer>
      <Button label="Cancel" text severity="secondary" @click="visible = false" />
      <Button label="Create Layer" icon="pi pi-check" :loading="loading"
              class="!bg-[#22c55e] !border-[#22c55e] !text-[#003915] font-bold"
              @click="handleSubmit" />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import Dialog    from 'primevue/dialog'
import Button    from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select    from 'primevue/select'

const props = defineProps({
  modelValue:   Boolean,
  projectUuid:  String,
  groupOptions: { type: Array, default: () => [] },
  presetGroupUuid: { type: String, default: null },
})
const emit = defineEmits(['update:modelValue', 'created'])

const geometryTypes = ['POINT', 'LINESTRING', 'POLYGON', 'MULTIPOINT', 'MULTILINESTRING', 'MULTIPOLYGON']

const visible = ref(props.modelValue)
const loading = ref(false)
const form    = ref(defaultForm())

function defaultForm() {
  return {
    display_name:    '',
    table_name:      '',
    geometry_type:   'POLYGON',
    layergroup_uuid: props.presetGroupUuid,
  }
}

watch(() => props.modelValue, (v) => {
  visible.value = v
  if (v) form.value = defaultForm()
})
watch(visible, (v) => emit('update:modelValue', v))

async function handleSubmit() {
  if (!form.value.display_name.trim() || !form.value.table_name.trim()) return
  loading.value = true
  try {
    emit('created', { ...form.value, project_uuid: props.projectUuid })
    visible.value = false
  } finally {
    loading.value = false
  }
}
</script>