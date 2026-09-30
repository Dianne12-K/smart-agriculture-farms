<template>
  <Dialog v-model:visible="visible" header="Map uploaded attributes" :modal="true" :style="{ width: '420px' }">
    <div class="flex flex-col gap-3 pt-2">
      <p class="text-xs text-gray-400">
        Rename any columns found in the uploaded file before finalizing — leave
        unchanged to keep the original name.
      </p>
      <div v-for="(name, i) in attributesFound" :key="name" class="flex items-center gap-2">
        <span class="text-xs text-gray-500 w-1/2 truncate" :title="name">{{ name }}</span>
        <i class="pi pi-arrow-right text-gray-600 text-[10px]" />
        <InputText v-model="renames[i]" class="w-1/2" />
      </div>
    </div>
    <template #footer>
      <Button label="Skip" text severity="secondary" @click="handleSkip" />
      <Button label="Apply" icon="pi pi-check" :loading="loading" @click="handleApply"
              class="bg-emerald-600 border-emerald-600" />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import Dialog    from 'primevue/dialog'
import Button    from 'primevue/button'
import InputText from 'primevue/inputtext'
import { mapAttributes } from '@/services/api'

const props = defineProps({
  modelValue:      Boolean,
  layerUuid:       String,
  attributesFound: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'applied'])

const visible = ref(props.modelValue)
const loading = ref(false)
const renames = ref([])

watch(() => props.modelValue, (v) => {
  visible.value = v
  if (v) renames.value = [...props.attributesFound]
})
watch(visible, (v) => emit('update:modelValue', v))

async function handleApply() {
  loading.value = true
  try {
    const mappings = props.attributesFound
        .map((old_name, i) => ({ old_name, new_name: renames.value[i]?.trim() }))
        .filter(m => m.new_name && m.new_name !== m.old_name)
    if (mappings.length) {
      await mapAttributes(props.layerUuid, { mappings })
    }
    visible.value = false
    emit('applied')
  } finally {
    loading.value = false
  }
}

function handleSkip() {
  visible.value = false
  emit('applied')
}
</script>
