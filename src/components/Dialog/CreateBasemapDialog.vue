<template>
  <Dialog v-model:visible="visible" :header="isEditing ? 'Edit Basemap' : 'New Basemap'"
          :modal="true" :style="{ width: '440px' }">
    <div class="flex flex-col gap-3 pt-2">

      <!-- Presets -->
      <div v-if="!isEditing" class="flex flex-col gap-1.5">
        <label class="text-[10px] text-[#869585] uppercase font-bold tracking-wider">Quick fill</label>
        <div class="flex flex-wrap gap-1.5">
          <button v-for="preset in presets" :key="preset.name"
                  class="text-[11px] px-2.5 py-1 rounded-full border border-[#3d4a3d] bg-[#232a3a]
                         text-[#bccbb9] hover:border-[#22c55e] hover:text-[#dce2f7] transition-colors"
                  @click="applyPreset(preset)">
            {{ preset.name }}
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[10px] text-[#869585] uppercase font-bold tracking-wider">Name *</label>
        <InputText v-model="form.name" placeholder="e.g. Google Satellite" class="w-full" autofocus />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-[10px] text-[#869585] uppercase font-bold tracking-wider">Tile URL Template *</label>
        <InputText v-model="form.url_template" placeholder="https://.../{z}/{y}/{x}" class="w-full" />
        <p class="text-[10px] text-[#869585]">Must contain {x}, {y}, and {z} placeholders.</p>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-[10px] text-[#869585] uppercase font-bold tracking-wider">Attribution</label>
        <InputText v-model="form.attribution" placeholder="Optional" class="w-full" />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-[10px] text-[#869585] uppercase font-bold tracking-wider">Max Zoom</label>
        <InputNumber v-model="form.max_zoom" :min="1" :max="24" class="w-full" />
      </div>
    </div>
    <template #footer>
      <Button label="Cancel" text severity="secondary" @click="visible = false" />
      <Button :label="isEditing ? 'Save' : 'Create'" icon="pi pi-check" :loading="loading"
              class="!bg-[#22c55e] !border-[#22c55e] !text-[#003915] font-bold"
              @click="handleSubmit" />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Dialog      from 'primevue/dialog'
import Button      from 'primevue/button'
import InputText   from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import { BASEMAP_PRESETS } from '@/utils/basemapPresets'

const props = defineProps({
  modelValue: Boolean,
  initial:    { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'submit'])

const visible = ref(props.modelValue)
const loading = ref(false)
const presets = BASEMAP_PRESETS

const emptyForm = () => ({ name: '', url_template: '', attribution: '', max_zoom: 19 })
const form = ref(emptyForm())

const isEditing = computed(() => !!props.initial)

watch(() => props.modelValue, (v) => {
  visible.value = v
  if (v) form.value = props.initial ? { ...emptyForm(), ...props.initial } : emptyForm()
})
watch(visible, (v) => emit('update:modelValue', v))

function applyPreset(preset) {
  form.value.name = preset.name
  form.value.url_template = preset.url_template
  form.value.attribution = preset.attribution
}

function isValidUrlTemplate(url) {
  return ['{x}', '{y}', '{z}'].every(token => url.includes(token))
}

async function handleSubmit() {
  if (!form.value.name.trim() || !isValidUrlTemplate(form.value.url_template)) return
  loading.value = true
  try {
    emit('submit', { ...form.value })
    visible.value = false
  } finally {
    loading.value = false
  }
}
</script>
