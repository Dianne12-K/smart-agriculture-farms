<template>
  <Dialog v-model:visible="visible" header="Rename Layer" :modal="true" :style="{ width: '360px' }">
    <div class="pt-2">
      <InputText v-model="value" class="w-full" autofocus />
    </div>
    <template #footer>
      <Button label="Cancel" text severity="secondary" @click="visible = false" />
      <Button label="Save" icon="pi pi-check" :loading="loading"
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

const props = defineProps({
  modelValue:   Boolean,
  initialValue: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'renamed'])

const visible = ref(props.modelValue)
const loading = ref(false)
const value   = ref(props.initialValue)

watch(() => props.modelValue, (v) => {
  visible.value = v
  if (v) value.value = props.initialValue
})
watch(visible, (v) => emit('update:modelValue', v))

async function handleSubmit() {
  if (!value.value.trim()) return
  loading.value = true
  try {
    emit('renamed', value.value.trim())
    visible.value = false
  } finally {
    loading.value = false
  }
}
</script>