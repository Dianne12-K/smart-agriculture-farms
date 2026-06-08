<template>
  <Dialog v-model:visible="visible" header="Delete Layer" :modal="true" :style="{ width: '380px' }">
    <div class="pt-2 flex flex-col gap-3">
      <div class="flex items-center gap-3 p-3 bg-red-950/30 border border-red-900/50 rounded-lg">
        <i class="pi pi-exclamation-triangle text-red-400 text-xl" />
        <p class="text-[13px] text-[#bccbb9]">
          This will permanently delete
          <strong class="text-[#dce2f7]">"{{ layerName }}"</strong>
          and all its features.
        </p>
      </div>
    </div>
    <template #footer>
      <Button label="Cancel" text severity="secondary" @click="visible = false" />
      <Button label="Delete" icon="pi pi-trash" severity="danger"
              :loading="loading" @click="handleSubmit" />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

const props = defineProps({
  modelValue: Boolean,
  layerName:  { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'confirmed'])

const visible = ref(props.modelValue)
const loading = ref(false)

watch(() => props.modelValue, (v) => { visible.value = v })
watch(visible, (v) => emit('update:modelValue', v))

async function handleSubmit() {
  loading.value = true
  try {
    emit('confirmed')
    visible.value = false
  } finally {
    loading.value = false
  }
}
</script>