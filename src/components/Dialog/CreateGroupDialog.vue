<template>
  <Dialog v-model:visible="visible" header="New Layer Group" :modal="true" :style="{ width: '380px' }">
    <div class="flex flex-col gap-3 pt-2">
      <div class="flex flex-col gap-1">
        <label class="text-[10px] text-[#869585] uppercase font-bold tracking-wider">Name *</label>
        <InputText v-model="form.name" placeholder="e.g. Soil Sensors" class="w-full" autofocus />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-[10px] text-[#869585] uppercase font-bold tracking-wider">Description</label>
        <Textarea v-model="form.description" placeholder="Optional description..." rows="2" class="w-full" />
      </div>
    </div>
    <template #footer>
      <Button label="Cancel" text severity="secondary" @click="visible = false" />
      <Button label="Create" icon="pi pi-check" :loading="loading"
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
import Textarea  from 'primevue/textarea'

const props = defineProps({
  modelValue: Boolean,
  projectUuid: String,
})
const emit = defineEmits(['update:modelValue', 'created'])

const visible = ref(props.modelValue)
const loading = ref(false)
const form    = ref({ name: '', description: '' })

watch(() => props.modelValue, (v) => {
  visible.value = v
  if (v) form.value = { name: '', description: '' }
})
watch(visible, (v) => emit('update:modelValue', v))

async function handleSubmit() {
  if (!form.value.name.trim()) return
  loading.value = true
  try {
    emit('created', { ...form.value, project_uuid: props.projectUuid })
    visible.value = false
  } finally {
    loading.value = false
  }
}
</script>