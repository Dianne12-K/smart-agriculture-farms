<template>
  <Dialog :visible="true" modal :header="`Edit ${gids.length} features`" :style="{ width: '420px' }" :closable="false">
    <div class="flex flex-col gap-3 pt-2">
      <p class="text-xs text-gray-500">
        Leave a field blank to leave it unchanged. Filled-in fields are applied to all
        {{ gids.length }} selected features.
      </p>

      <div v-for="attr in sortedAttributes" :key="attr.id ?? attr.name" class="flex flex-col gap-1">
        <label class="text-[10px] text-gray-400 uppercase font-bold">{{ attr.name }}</label>

        <InputText v-if="isTextType(attr.type)" v-model="form[attr.name]" class="w-full" />
        <InputNumber v-else-if="isNumberType(attr.type)" v-model="form[attr.name]" class="w-full"
                     :max-fraction-digits="attr.type === 'float' ? 4 : 0" />
        <div v-else-if="attr.type === 'boolean'" class="flex items-center gap-2 pt-1">
          <Checkbox v-model="form[attr.name]" binary />
        </div>
        <DatePicker v-else-if="attr.type === 'date'" v-model="form[attr.name]" class="w-full" date-format="yy-mm-dd" />
      </div>

      <p v-if="!attributes.length" class="text-xs text-gray-500 italic">
        This layer has no attributes defined.
      </p>
    </div>

    <template #footer>
      <Button label="Cancel" text severity="secondary" @click="$emit('cancel')" />
      <Button :label="`Apply to ${gids.length}`" icon="pi pi-check" :loading="saving" @click="handleSave"
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
import { bulkUpdateFeatures } from '@/services/api'

const props = defineProps({
  layerUuid:  String,
  gids:       { type: Array, default: () => [] },
  attributes: { type: Array, default: () => [] },
})
const emit = defineEmits(['saved', 'cancel'])

const toast  = useToast()
const saving = ref(false)
const form   = ref({})

const sortedAttributes = computed(() =>
    [...props.attributes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
)

function isTextType(type)   { return type === 'text' || type === 'string' }
function isNumberType(type) { return type === 'integer' || type === 'float' }

function toISODate(value) {
  const date = value instanceof Date ? value : new Date(value)
  return date.toISOString().slice(0, 10)
}

async function handleSave() {
  const properties = {}
  for (const attr of props.attributes) {
    const value = form.value[attr.name]
    if (value === undefined || value === null || value === '') continue
    properties[attr.name] = attr.type === 'date' ? toISODate(value) : value
  }

  if (!Object.keys(properties).length) {
    toast.add({ severity: 'warn', summary: 'Fill in at least one field to apply', life: 3000 })
    return
  }

  saving.value = true
  try {
    await bulkUpdateFeatures(props.layerUuid, { gids: props.gids, properties })
    toast.add({ severity: 'success', summary: `${props.gids.length} features updated`, life: 2000 })
    emit('saved')
  } catch (err) {
    toast.add({ severity: 'error', summary: err.response?.data?.error || 'Bulk update failed', life: 3000 })
  } finally {
    saving.value = false
  }
}
</script>
