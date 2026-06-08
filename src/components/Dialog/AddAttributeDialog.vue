<template>
  <Dialog v-model:visible="visible" header="Add Attribute" :modal="true" :style="{ width: '380px' }">
    <div class="flex flex-col gap-3 pt-2">
      <div class="flex flex-col gap-1">
        <label class="text-[10px] text-[#869585] uppercase font-bold tracking-wider">Name *</label>
        <InputText v-model="form.name" placeholder="e.g. crop_type" class="w-full" autofocus />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-[10px] text-[#869585] uppercase font-bold tracking-wider">Type *</label>
        <Select v-model="form.type" :options="attrTypes" class="w-full" />
      </div>
      <div class="flex items-center gap-2">
        <Checkbox v-model="form.required" :binary="true" inputId="attr-required" />
        <label for="attr-required" class="text-[13px] text-[#bccbb9] cursor-pointer">Required</label>
      </div>
    </div>
    <template #footer>
      <Button label="Cancel" text severity="secondary" @click="visible = false" />
      <Button label="Add" icon="pi pi-check" :loading="loading"
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
import Checkbox  from 'primevue/checkbox'

const props = defineProps({ modelValue: Boolean })
const emit  = defineEmits(['update:modelValue', 'created'])

const attrTypes = ['text', 'number', 'integer', 'float', 'boolean', 'date']

const visible = ref(props.modelValue)
const loading = ref(false)
const form    = ref({ name: '', type: 'text', required: false })

watch(() => props.modelValue, (v) => {
  visible.value = v
  if (v) form.value = { name: '', type: 'text', required: false }
})
watch(visible, (v) => emit('update:modelValue', v))

async function handleSubmit() {
  if (!form.value.name.trim()) return
  loading.value = true
  try {
    emit('created', { ...form.value })
    visible.value = false
  } finally {
    loading.value = false
  }
}
</script>