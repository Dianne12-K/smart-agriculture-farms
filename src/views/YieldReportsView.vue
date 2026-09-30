<template>
  <div class="p-6 pb-24 lg:pb-8">
    <div class="max-w-7xl mx-auto">
      <div class="mb-6">
        <h1 class="text-[30px] font-bold text-[#dce2f7] tracking-tight">Yield Reports</h1>
        <p class="text-[14px] text-[#bccbb9] mt-1">
          Predicted and recorded yield data, and the model behind it.
        </p>
      </div>

      <!-- Model status -->
      <div class="bg-[#191f2f] border border-[#3d4a3d] rounded-xl p-5 mb-6 flex items-center justify-between flex-wrap gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center"
               :class="modelInfo?.trained ? 'bg-emerald-900/30' : 'bg-[#232a3a]'">
            <i class="pi pi-cog text-lg" :class="modelInfo?.trained ? 'text-[#4be277]' : 'text-[#869585]'" />
          </div>
          <div>
            <p class="text-[14px] font-semibold text-[#dce2f7]">
              {{ modelInfo?.trained ? 'Model trained' : 'Model not trained yet' }}
            </p>
            <p v-if="modelInfo?.trained" class="text-[11px] text-[#869585]">
              MAE {{ modelInfo.mae?.toFixed?.(2) ?? modelInfo.mae }} · R² {{ modelInfo.r2?.toFixed?.(2) ?? modelInfo.r2 }}
              · {{ modelInfo.n_samples }} samples
            </p>
            <p v-else class="text-[11px] text-[#869585]">Train it on synthetic data — no real records required.</p>
          </div>
        </div>
        <Button label="Train model" icon="pi pi-refresh" :loading="training"
                class="!bg-[#22c55e] !border-[#22c55e] !text-[#003915] font-bold" @click="handleTrainModel" />
      </div>

      <!-- Picker bar -->
      <div class="bg-[#191f2f] border border-[#3d4a3d] rounded-xl p-5 mb-6 flex flex-wrap items-end gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] font-semibold tracking-widest uppercase text-[#869585]">Project</label>
          <Select v-model="picker.selectedProjectUuid.value" :options="picker.projects.value"
                  option-label="name" option-value="uuid" placeholder="Choose a project…" class="w-56" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] font-semibold tracking-widest uppercase text-[#869585]">Layer</label>
          <Select v-model="picker.selectedLayerUuid.value" :options="picker.layers.value"
                  option-label="display_name" option-value="uuid" placeholder="Choose a layer…" class="w-56"
                  :disabled="!picker.selectedProjectUuid.value" :loading="picker.loadingLayers.value" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] font-semibold tracking-widest uppercase text-[#869585]">Feature</label>
          <Select v-model="picker.selectedFeature.value" :options="featureOptions"
                  option-label="label" placeholder="Choose a feature…" class="w-56"
                  :disabled="!picker.selectedLayerUuid.value" :loading="picker.loadingFeatures.value" />
        </div>
        <div v-if="picker.selectedFeature.value" class="flex items-end gap-2">
          <Select v-model="cropType" :options="cropTypes" class="w-32" size="small" />
          <Button label="Generate Demo Data" icon="pi pi-sparkles" :loading="generatingDemo"
                  class="!bg-[#22c55e] !border-[#22c55e] !text-[#003915] font-bold" size="small"
                  @click="handleGenerateDemoData" />
        </div>
      </div>

      <!-- No feature selected -->
      <div v-if="!picker.selectedFeature.value" class="flex flex-col items-center justify-center py-24 text-center">
        <div class="w-20 h-20 rounded-2xl bg-[#232a3a] border border-[#3d4a3d] flex items-center justify-center mb-4">
          <i class="pi pi-chart-line text-4xl text-[#ffba61]" />
        </div>
        <p class="text-[#bccbb9] text-sm">Pick a project, layer, and feature above to predict or record yield.</p>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <!-- Predict -->
        <section class="bg-[#191f2f] border border-[#3d4a3d] rounded-xl p-5">
          <h3 class="text-[14px] font-semibold text-[#dce2f7] flex items-center gap-2 mb-3">
            <i class="pi pi-chart-line text-[#4be277]" /> Predict yield
          </h3>
          <div class="flex items-end gap-2 mb-4">
            <Select v-model="cropType" :options="cropTypes" class="flex-1" size="small" />
            <Button label="Predict" icon="pi pi-play" size="small" :loading="predicting"
                    class="!bg-[#22c55e] !border-[#22c55e] !text-[#003915]" @click="handlePredict" />
          </div>
          <div v-if="prediction" class="bg-[#0c1322] border border-[#3d4a3d] rounded-lg p-4 text-center">
            <span class="block text-[28px] font-bold text-[#dce2f7]">{{ prediction.predicted_yield }}</span>
            <span class="text-[11px] text-[#869585]">{{ prediction.yield_unit || 'bags/acre' }}</span>
            <span class="block mt-1 text-[10px] px-2 py-0.5 rounded-full inline-block"
                  style="background:rgba(75,226,119,0.15); color:#4be277;">
              {{ prediction.confidence_pct }}% confidence
            </span>
          </div>
        </section>

        <!-- Record actual -->
        <section class="bg-[#191f2f] border border-[#3d4a3d] rounded-xl p-5">
          <h3 class="text-[14px] font-semibold text-[#dce2f7] flex items-center gap-2 mb-3">
            <i class="pi pi-pencil text-[#adc6ff]" /> Record actual yield
          </h3>
          <div class="grid grid-cols-2 gap-3">
            <InputNumber v-model="actualForm.actual_yield" placeholder="Bags / acre" class="w-full" size="small" />
            <Select v-model="actualForm.crop_type" :options="cropTypes" class="w-full" size="small" />
            <InputText v-model="actualForm.season" placeholder="Season (e.g. Long Rains)" class="w-full" size="small" />
            <InputNumber v-model="actualForm.year" placeholder="Year" :use-grouping="false" class="w-full" size="small" />
          </div>
          <Button label="Save record" icon="pi pi-check" size="small" :loading="savingActual"
                  class="!bg-[#22c55e] !border-[#22c55e] !text-[#003915] font-bold mt-3" @click="handleRecordActual" />
        </section>

        <!-- Prediction history -->
        <section class="bg-[#191f2f] border border-[#3d4a3d] rounded-xl p-5">
          <h3 class="text-[14px] font-semibold text-[#dce2f7] mb-3">Prediction history</h3>
          <div v-if="loadingHistory" class="py-6 text-center text-[#869585] text-sm">Loading…</div>
          <div v-else-if="predictions.length" class="space-y-1.5 max-h-[220px] overflow-y-auto">
            <div v-for="p in predictions" :key="p.id"
                 class="flex items-center justify-between text-[12px] border-b border-[#3d4a3d] pb-1.5">
              <span class="text-[#dce2f7] capitalize">{{ p.crop_type }}</span>
              <span class="text-[#4be277] font-mono">{{ p.predicted_yield }} {{ p.yield_unit }}</span>
              <span class="text-[#869585]">{{ p.predicted_at?.slice(0, 10) }}</span>
            </div>
          </div>
          <p v-else class="text-[#869585] text-sm py-6 text-center">No predictions yet.</p>
        </section>

        <!-- Actual yield records -->
        <section class="bg-[#191f2f] border border-[#3d4a3d] rounded-xl p-5">
          <h3 class="text-[14px] font-semibold text-[#dce2f7] mb-3">Actual yield records</h3>
          <div v-if="loadingHistory" class="py-6 text-center text-[#869585] text-sm">Loading…</div>
          <div v-else-if="actuals.length" class="space-y-1.5 max-h-[220px] overflow-y-auto">
            <div v-for="a in actuals" :key="a.id"
                 class="flex items-center justify-between text-[12px] border-b border-[#3d4a3d] pb-1.5">
              <span class="text-[#dce2f7] capitalize">{{ a.crop_type }}</span>
              <span class="text-[#adc6ff] font-mono">{{ a.actual_yield }} {{ a.yield_unit }}</span>
              <span class="text-[#869585]">{{ a.season || '—' }} {{ a.year || '' }}</span>
            </div>
          </div>
          <p v-else class="text-[#869585] text-sm py-6 text-center">No actual yield records yet.</p>
        </section>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import Select      from 'primevue/select'
import Button      from 'primevue/button'
import InputText   from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import { useFeaturePicker } from '@/composables/useFeaturePicker'
import {
  getYieldModelInfo, trainYieldModel,
  predictYield, recordActualYield, getYieldHistory,
  generateDemoData,
} from '@/services/api'

const toast = useToast()
const picker = useFeaturePicker()
const cropTypes = ['maize', 'tea', 'beans', 'sugarcane']
const cropType = ref('maize')

const featureOptions = computed(() =>
    picker.features.value.map(f => ({ ...f, label: f.properties?.farm_name || f.properties?.name || `Feature ${f.id}` }))
)

// ── Model ──────────────────────────────────────────────────────
const modelInfo = ref(null)
const training  = ref(false)

async function fetchModelInfo() {
  try {
    modelInfo.value = (await getYieldModelInfo()).data
  } catch { modelInfo.value = null }
}

async function handleTrainModel() {
  training.value = true
  try {
    const res = await trainYieldModel({ use_synthetic: true })
    toast.add({ severity: 'success', summary: res.data?.message || 'Model trained', life: 3000 })
    await fetchModelInfo()
  } catch (err) {
    toast.add({ severity: 'error', summary: err.response?.data?.error || 'Training failed', life: 3000 })
  } finally { training.value = false }
}

onMounted(fetchModelInfo)

// ── Demo data ──────────────────────────────────────────────────
const generatingDemo = ref(false)
async function handleGenerateDemoData() {
  const layerUuid = picker.selectedLayerUuid.value
  const gid = picker.selectedFeature.value?.id
  if (!layerUuid || gid == null) return
  generatingDemo.value = true
  try {
    const res = await generateDemoData(layerUuid, gid, cropType.value)
    const c = res.data.inserted
    toast.add({ severity: 'success', summary: `Demo data generated: ${c.yield_records} yield records added`, life: 3000 })
    await fetchYieldHistory()
  } catch (err) {
    toast.add({ severity: 'error', summary: err.response?.data?.error || 'Failed to generate demo data', life: 3000 })
  } finally { generatingDemo.value = false }
}

// ── Predict ────────────────────────────────────────────────────
const predicting = ref(false)
const prediction  = ref(null)

async function handlePredict() {
  const layerUuid = picker.selectedLayerUuid.value
  const gid = picker.selectedFeature.value?.id
  if (!layerUuid || gid == null) return
  predicting.value = true
  try {
    prediction.value = (await predictYield(layerUuid, gid, { crop_type: cropType.value })).data
    await fetchYieldHistory()
  } catch (err) {
    toast.add({ severity: 'error', summary: err.response?.data?.error || 'Prediction failed', life: 3000 })
  } finally { predicting.value = false }
}

// ── Record actual ────────────────────────────────────────────────
const savingActual = ref(false)
const actualForm = ref({ actual_yield: null, crop_type: 'maize', season: '', year: new Date().getFullYear() })

async function handleRecordActual() {
  const layerUuid = picker.selectedLayerUuid.value
  const gid = picker.selectedFeature.value?.id
  if (!layerUuid || gid == null) return
  if (!actualForm.value.actual_yield) {
    toast.add({ severity: 'warn', summary: 'Enter an actual yield value', life: 3000 })
    return
  }
  savingActual.value = true
  try {
    await recordActualYield(layerUuid, gid, actualForm.value)
    toast.add({ severity: 'success', summary: 'Yield record saved', life: 2000 })
    actualForm.value.actual_yield = null
    await fetchYieldHistory()
  } catch (err) {
    toast.add({ severity: 'error', summary: err.response?.data?.error || 'Failed to save record', life: 3000 })
  } finally { savingActual.value = false }
}

// ── History ────────────────────────────────────────────────────
const predictions = ref([])
const actuals = ref([])
const loadingHistory = ref(false)

async function fetchYieldHistory() {
  const layerUuid = picker.selectedLayerUuid.value
  const gid = picker.selectedFeature.value?.id
  if (!layerUuid || gid == null) return
  loadingHistory.value = true
  try {
    const res = await getYieldHistory(layerUuid, gid)
    predictions.value = res.data.predictions || []
    actuals.value     = res.data.actuals || []
  } catch { predictions.value = []; actuals.value = [] }
  finally { loadingHistory.value = false }
}

watch(() => picker.selectedFeature.value, (f) => {
  prediction.value = null
  if (f) fetchYieldHistory()
})
</script>
