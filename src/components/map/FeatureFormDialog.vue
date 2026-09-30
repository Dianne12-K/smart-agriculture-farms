<template>
  <Dialog :visible="true" modal :header="isEditing ? 'Edit feature' : 'New feature'"
          :style="{ width: '420px' }" :closable="false">
    <div class="flex flex-col gap-3 pt-2">
      <div v-for="attr in sortedAttributes" :key="attr.id ?? attr.name" class="flex flex-col gap-1">
        <label class="text-[10px] text-gray-400 uppercase font-bold">
          {{ attr.name }}<span v-if="attr.required" class="text-red-400"> *</span>
        </label>

        <InputText v-if="isTextType(attr.type)" v-model="form[attr.name]" class="w-full" />
        <InputNumber v-else-if="isNumberType(attr.type)" v-model="form[attr.name]" class="w-full"
                     :max-fraction-digits="attr.type === 'float' ? 4 : 0" />
        <div v-else-if="attr.type === 'boolean'" class="flex items-center gap-2 pt-1">
          <Checkbox v-model="form[attr.name]" binary />
        </div>
        <DatePicker v-else-if="attr.type === 'date'" v-model="form[attr.name]" class="w-full" date-format="yy-mm-dd" />
      </div>

      <p v-if="!attributes.length" class="text-xs text-gray-500 italic">
        This layer has no attributes defined yet{{ isEditing ? '.' : ' — the feature will be saved with geometry only.' }}
      </p>
    </div>

    <template #footer>
      <Button label="Cancel" text severity="secondary" @click="$emit('cancel')" />
      <Button v-if="attributes.length || !isEditing" label="Save" icon="pi pi-check" :loading="saving" @click="handleSave"
              class="bg-emerald-600 border-emerald-600" />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import Dialog      from 'primevue/dialog'
import Button      from 'primevue/button'
import InputText   from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Checkbox    from 'primevue/checkbox'
import DatePicker  from 'primevue/datepicker'
import { createFeature, updateFeature } from '@/services/api'

const props = defineProps({
  layerUuid:  String,
  geometry:   { type: Object, default: null },  // required when creating
  feature:    { type: Object, default: null },  // {id, properties} — set when editing
  attributes: { type: Array, default: () => [] },
})
const emit = defineEmits(['saved', 'cancel'])

const toast  = useToast()
const saving = ref(false)
const isEditing = computed(() => !!props.feature)

const sortedAttributes = computed(() =>
    [...props.attributes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
)

function isTextType(type)   { return type === 'text' || type === 'string' }
function isNumberType(type) { return type === 'integer' || type === 'float' }

function buildInitialForm() {
  const initial = {}
  const existing = props.feature?.properties || {}
  for (const attr of props.attributes) {
    let value = existing[attr.name]
    if (attr.type === 'date' && value) value = new Date(value)
    initial[attr.name] = value ?? null
  }
  return initial
}

const form = ref(buildInitialForm())

function toISODate(value) {
  const date = value instanceof Date ? value : new Date(value)
  return date.toISOString().slice(0, 10)
}

async function handleSave() {
  const missing = props.attributes.filter(a =>
      a.required && (form.value[a.name] === undefined || form.value[a.name] === null || form.value[a.name] === '')
  )
  if (missing.length) {
    toast.add({ severity: 'warn', summary: `Missing required: ${missing.map(a => a.name).join(', ')}`, life: 3000 })
    return
  }

  const properties = {}
  for (const attr of props.attributes) {
    let value = form.value[attr.name]
    if (value === undefined || value === null || value === '') continue
    if (attr.type === 'date') value = toISODate(value)
    properties[attr.name] = value
  }

  saving.value = true
  try {
    if (isEditing.value) {
      await updateFeature(props.layerUuid, props.feature.id, { properties })
      toast.add({ severity: 'success', summary: 'Feature updated', life: 2000 })
    } else {
      await createFeature(props.layerUuid, { geometry: props.geometry, properties })
      toast.add({ severity: 'success', summary: 'Feature saved', life: 2000 })
    }
    emit('saved')
  } catch (err) {
    toast.add({ severity: 'error', summary: err.response?.data?.error || 'Failed to save feature', life: 3000 })
  } finally {
    saving.value = false
  }
}
</script>
