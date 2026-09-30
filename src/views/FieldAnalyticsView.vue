<template>
  <div class="p-6 pb-24 lg:pb-8">
    <div class="max-w-7xl mx-auto">
      <div class="mb-6">
        <h1 class="text-[30px] font-bold text-[#dce2f7] tracking-tight">Field Analytics</h1>
        <p class="text-[14px] text-[#bccbb9] mt-1">
          NDVI trends, soil health, land cover, disaster alerts, and recommendations for a farm feature.
        </p>
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
          <Select v-model="demoCropType" :options="cropTypes" class="w-32" size="small" />
          <Button label="Generate Demo Data" icon="pi pi-sparkles" :loading="generatingDemo"
                  class="!bg-[#22c55e] !border-[#22c55e] !text-[#003915] font-bold" size="small"
                  @click="handleGenerateDemoData" />
        </div>
      </div>

      <!-- No feature selected -->
      <div v-if="!picker.selectedFeature.value" class="flex flex-col items-center justify-center py-24 text-center">
        <div class="w-20 h-20 rounded-2xl bg-[#232a3a] border border-[#3d4a3d] flex items-center justify-center mb-4">
          <i class="pi pi-chart-bar text-4xl text-[#4be277]" />
        </div>
        <p class="text-[#bccbb9] text-sm">Pick a project, layer, and feature above to view its analytics.</p>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <!-- NDVI -->
        <section class="bg-[#191f2f] border border-[#3d4a3d] rounded-xl p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-[14px] font-semibold text-[#dce2f7] flex items-center gap-2">
              <i class="pi pi-chart-line text-[#4be277]" /> NDVI history
            </h3>
            <Button label="Refresh from satellite" size="small" text @click="fetchNdviTrendLive" :loading="ndviTrendLoading" />
          </div>
          <div v-if="ndviLoading" class="py-8 text-center text-[#869585] text-sm">Loading…</div>
          <div v-else-if="ndviHistory.length" class="h-[180px]">
            <Line :data="ndviChartData" :options="lineChartOptions" />
          </div>
          <p v-else class="text-[#869585] text-sm py-6 text-center">
            No NDVI history yet — use Generate Demo Data or wait for real satellite readings.
          </p>
        </section>

        <!-- Soil -->
        <section class="bg-[#191f2f] border border-[#3d4a3d] rounded-xl p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-[14px] font-semibold text-[#dce2f7] flex items-center gap-2">
              <i class="pi pi-stop-circle text-[#adc6ff]" /> Soil history
            </h3>
            <Button label="Current properties" size="small" text @click="fetchSoilPropertiesLive" :loading="soilPropsLoading" />
          </div>
          <div v-if="soilLoading" class="py-8 text-center text-[#869585] text-sm">Loading…</div>
          <div v-else-if="soilHistory.length" class="h-[180px]">
            <Line :data="soilChartData" :options="lineChartOptions" />
          </div>
          <p v-else class="text-[#869585] text-sm py-6 text-center">No soil history yet.</p>

          <div v-if="soilProperties" class="mt-4 grid grid-cols-2 gap-2 text-[12px]">
            <div class="bg-[#0c1322] border border-[#3d4a3d] rounded-lg p-2.5">
              <span class="block text-[10px] text-[#869585] uppercase">Texture</span>
              <span class="text-[#dce2f7] font-semibold">{{ soilProperties.texture_class }}</span>
            </div>
            <div class="bg-[#0c1322] border border-[#3d4a3d] rounded-lg p-2.5">
              <span class="block text-[10px] text-[#869585] uppercase">pH</span>
              <span class="text-[#dce2f7] font-semibold">{{ soilProperties.ph_estimate }}
                <span class="text-[10px] text-[#869585]">{{ soilProperties.ph_status?.label }}</span>
              </span>
            </div>
          </div>
        </section>

        <!-- LULC -->
        <section class="bg-[#191f2f] border border-[#3d4a3d] rounded-xl p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-[14px] font-semibold text-[#dce2f7] flex items-center gap-2">
              <i class="pi pi-map text-[#facc15]" /> Land cover history
            </h3>
            <Button label="Current breakdown" size="small" text @click="fetchLulcStatsLive" :loading="lulcStatsLoading" />
          </div>
          <div v-if="lulcLoading" class="py-8 text-center text-[#869585] text-sm">Loading…</div>
          <div v-else-if="lulcHistory.length" class="space-y-1.5 max-h-[180px] overflow-y-auto">
            <div v-for="r in lulcHistory" :key="r.id"
                 class="flex items-center justify-between text-[12px] border-b border-[#3d4a3d] pb-1.5">
              <span class="text-[#dce2f7] font-medium capitalize">{{ r.dominant_class }}</span>
              <span class="text-[#869585]">{{ r.date_start }} → {{ r.date_end }}</span>
              <span class="text-[#4be277] font-mono">{{ r.confidence_pct?.toFixed(0) }}%</span>
            </div>
          </div>
          <p v-else class="text-[#869585] text-sm py-6 text-center">No land cover history yet.</p>

          <div v-if="lulcStats?.breakdown" class="mt-4 h-[140px]">
            <Bar :data="lulcBarData" :options="barChartOptions" />
          </div>
        </section>

        <!-- Disaster alerts -->
        <section class="bg-[#191f2f] border border-[#3d4a3d] rounded-xl p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-[14px] font-semibold text-[#dce2f7] flex items-center gap-2">
              <i class="pi pi-exclamation-triangle text-[#ffb4ab]" /> Disaster alerts
            </h3>
            <button class="text-[11px] text-[#869585] hover:text-[#dce2f7] underline"
                    @click="showLayerAlerts = !showLayerAlerts">
              {{ showLayerAlerts ? 'This feature only' : 'Whole layer' }}
            </button>
          </div>
          <div v-if="alertsLoading" class="py-8 text-center text-[#869585] text-sm">Loading…</div>
          <div v-else-if="displayedAlerts.length" class="space-y-2 max-h-[220px] overflow-y-auto">
            <div v-for="a in displayedAlerts" :key="a.id"
                 class="rounded-lg p-2.5 border-l-[3px]" style="background:rgba(0,0,0,0.15);"
                 :style="{ borderColor: severityColor(a.severity) }">
              <div class="flex items-center justify-between">
                <span class="text-[12px] font-semibold text-[#dce2f7] capitalize">{{ a.disaster_type }}</span>
                <span class="text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold"
                      :style="{ background: severityColor(a.severity) + '22', color: severityColor(a.severity) }">
                  {{ a.severity }}
                </span>
              </div>
              <p class="text-[11px] text-[#bccbb9] mt-0.5">{{ a.description || a.title }}</p>
              <span class="text-[10px] text-[#869585]">{{ a.detected_at }}</span>
            </div>
          </div>
          <p v-else class="text-[#869585] text-sm py-6 text-center">No alerts recorded.</p>
        </section>

        <!-- Recommendations -->
        <section class="bg-[#191f2f] border border-[#3d4a3d] rounded-xl p-5 lg:col-span-2">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-[14px] font-semibold text-[#dce2f7] flex items-center gap-2">
              <i class="pi pi-lightbulb text-[#4be277]" /> Recommendations
            </h3>
            <Button label="Generate for whole layer" size="small" text :loading="generatingBatchRecs"
                    @click="handleGenerateBatchRecommendations" />
          </div>
          <div v-if="recsLoading" class="py-8 text-center text-[#869585] text-sm">Loading…</div>
          <div v-else-if="recHistory.length" class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div v-for="r in recHistory" :key="r.id"
                 class="rounded-lg p-2.5 border-l-[3px]" style="background:rgba(0,0,0,0.15);"
                 :style="{ borderColor: priorityColor(r.priority) }">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold"
                      :style="{ background: priorityColor(r.priority) + '22', color: priorityColor(r.priority) }">
                  {{ r.priority }}
                </span>
                <span class="text-[10px] text-[#869585]">{{ r.generated_at }}</span>
              </div>
              <p class="text-[12px] text-[#bccbb9]">{{ r.text }}</p>
            </div>
          </div>
          <p v-else class="text-[#869585] text-sm py-6 text-center">No recommendations recorded yet.</p>
        </section>

        <!-- Weather history -->
        <section class="bg-[#191f2f] border border-[#3d4a3d] rounded-xl p-5 lg:col-span-2">
          <h3 class="text-[14px] font-semibold text-[#dce2f7] flex items-center gap-2 mb-3">
            <i class="pi pi-cloud text-[#adc6ff]" /> Weather history (project location)
          </h3>
          <div v-if="weatherLoading" class="py-8 text-center text-[#869585] text-sm">Loading…</div>
          <div v-else-if="weatherHistory?.monthly_data?.length" class="h-[180px]">
            <Line :data="weatherChartData" :options="lineChartOptions" />
          </div>
          <p v-else class="text-[#869585] text-sm py-6 text-center">
            {{ weatherError || 'No weather history yet — generate demo data on a feature to set the project location.' }}
          </p>
        </section>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import Select from 'primevue/select'
import Button from 'primevue/button'
import { Line, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler
} from 'chart.js'
import { useFeaturePicker } from '@/composables/useFeaturePicker'
import {
  getNdviHistory, getNdviTrend,
  getSoilHistory, getSoilProperties,
  getLulcHistory, getLulcStatistics,
  getFeatureAlerts, getDisasterAlerts,
  getRecommendationHistory, generateRecommendations,
  getWeatherHistorical,
  generateDemoData,
} from '@/services/api'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler)

const toast = useToast()
const picker = useFeaturePicker()
const cropTypes = ['maize', 'tea', 'beans', 'sugarcane']
const demoCropType = ref('maize')
const generatingDemo = ref(false)

const featureOptions = computed(() =>
    picker.features.value.map(f => ({ ...f, label: f.properties?.farm_name || f.properties?.name || `Feature ${f.id}` }))
)

// ── NDVI ──────────────────────────────────────────────────────
const ndviHistory = ref([])
const ndviLoading = ref(false)
const ndviTrendLoading = ref(false)

// ── Soil ──────────────────────────────────────────────────────
const soilHistory = ref([])
const soilLoading = ref(false)
const soilProperties = ref(null)
const soilPropsLoading = ref(false)

// ── LULC ──────────────────────────────────────────────────────
const lulcHistory = ref([])
const lulcLoading = ref(false)
const lulcStats = ref(null)
const lulcStatsLoading = ref(false)

// ── Disaster alerts ───────────────────────────────────────────
const featureAlerts = ref([])
const layerAlerts = ref([])
const alertsLoading = ref(false)
const showLayerAlerts = ref(false)
const displayedAlerts = computed(() => showLayerAlerts.value ? layerAlerts.value : featureAlerts.value)

// ── Recommendations ───────────────────────────────────────────
const recHistory = ref([])
const recsLoading = ref(false)
const generatingBatchRecs = ref(false)

// ── Weather ───────────────────────────────────────────────────
const weatherHistory = ref(null)
const weatherLoading = ref(false)
const weatherError = ref('')

const layerUuid = () => picker.selectedLayerUuid.value
const gid       = () => picker.selectedFeature.value?.id

async function fetchNdviHistory() {
  if (!layerUuid() || gid() == null) return
  ndviLoading.value = true
  try {
    ndviHistory.value = (await getNdviHistory(layerUuid(), gid())).data.readings || []
  } catch { ndviHistory.value = [] }
  finally { ndviLoading.value = false }
}

async function fetchNdviTrendLive() {
  if (!layerUuid() || gid() == null) return
  ndviTrendLoading.value = true
  try {
    await getNdviTrend(layerUuid(), gid(), 90)
    toast.add({ severity: 'success', summary: 'Fetched latest satellite NDVI', life: 2000 })
    await fetchNdviHistory()
  } catch (err) {
    toast.add({ severity: 'error', summary: err.response?.data?.error || 'No satellite data available', life: 3000 })
  } finally { ndviTrendLoading.value = false }
}

async function fetchSoilHistory() {
  if (!layerUuid() || gid() == null) return
  soilLoading.value = true
  try {
    soilHistory.value = (await getSoilHistory(layerUuid(), gid())).data.readings || []
  } catch { soilHistory.value = [] }
  finally { soilLoading.value = false }
}

async function fetchSoilPropertiesLive() {
  if (!layerUuid() || gid() == null) return
  soilPropsLoading.value = true
  try {
    soilProperties.value = (await getSoilProperties(layerUuid(), gid())).data
  } catch (err) {
    toast.add({ severity: 'error', summary: err.response?.data?.error || 'Soil data unavailable', life: 3000 })
  } finally { soilPropsLoading.value = false }
}

async function fetchLulcHistory() {
  if (!layerUuid() || gid() == null) return
  lulcLoading.value = true
  try {
    lulcHistory.value = (await getLulcHistory(layerUuid(), gid())).data.records || []
  } catch { lulcHistory.value = [] }
  finally { lulcLoading.value = false }
}

async function fetchLulcStatsLive() {
  if (!layerUuid() || gid() == null) return
  lulcStatsLoading.value = true
  try {
    lulcStats.value = (await getLulcStatistics(layerUuid(), gid(), 90)).data
  } catch (err) {
    toast.add({ severity: 'error', summary: err.response?.data?.error || 'Land cover data unavailable', life: 3000 })
  } finally { lulcStatsLoading.value = false }
}

async function fetchAlerts() {
  if (!layerUuid() || gid() == null) return
  alertsLoading.value = true
  try {
    const [featRes, layerRes] = await Promise.all([
      getFeatureAlerts(layerUuid(), gid()),
      getDisasterAlerts(layerUuid()),
    ])
    featureAlerts.value = featRes.data.alerts || []
    layerAlerts.value   = layerRes.data.alerts || []
  } catch { featureAlerts.value = []; layerAlerts.value = [] }
  finally { alertsLoading.value = false }
}

async function fetchRecHistory() {
  if (!layerUuid() || gid() == null) return
  recsLoading.value = true
  try {
    recHistory.value = (await getRecommendationHistory(layerUuid(), gid())).data || []
  } catch { recHistory.value = [] }
  finally { recsLoading.value = false }
}

async function handleGenerateBatchRecommendations() {
  if (!layerUuid()) return
  generatingBatchRecs.value = true
  try {
    const res = await generateRecommendations(layerUuid(), { crop_type: demoCropType.value, days: 30, limit: 10 })
    toast.add({ severity: 'success', summary: `${res.data.recommendations_saved} recommendations generated across ${res.data.features_processed} features`, life: 3000 })
    await fetchRecHistory()
  } catch (err) {
    toast.add({ severity: 'error', summary: err.response?.data?.error || 'Failed to generate recommendations', life: 3000 })
  } finally { generatingBatchRecs.value = false }
}

async function fetchWeatherHistory() {
  if (!picker.selectedProjectUuid.value) return
  weatherLoading.value = true
  weatherError.value = ''
  try {
    weatherHistory.value = (await getWeatherHistorical(picker.selectedProjectUuid.value, 12)).data
  } catch (err) {
    weatherHistory.value = null
    weatherError.value = err.response?.data?.error || 'Weather data unavailable'
  } finally { weatherLoading.value = false }
}

async function handleGenerateDemoData() {
  if (!layerUuid() || gid() == null) return
  generatingDemo.value = true
  try {
    const res = await generateDemoData(layerUuid(), gid(), demoCropType.value)
    const c = res.data.inserted
    toast.add({
      severity: 'success',
      summary: `Demo data generated: ${c.ndvi} NDVI, ${c.soil} soil, ${c.lulc} LULC, ${c.yield_records} yield records, ${c.disaster_alerts} alerts, ${c.recommendations} recommendations`,
      life: 5000,
    })
    await refreshAll()
  } catch (err) {
    toast.add({ severity: 'error', summary: err.response?.data?.error || 'Failed to generate demo data', life: 3000 })
  } finally { generatingDemo.value = false }
}

async function refreshAll() {
  await Promise.all([
    fetchNdviHistory(), fetchSoilHistory(), fetchLulcHistory(),
    fetchAlerts(), fetchRecHistory(), fetchWeatherHistory(),
  ])
}

watch(() => picker.selectedFeature.value, (f) => {
  soilProperties.value = null
  lulcStats.value = null
  if (f) refreshAll()
})

watch(() => picker.selectedProjectUuid.value, () => {
  if (picker.selectedProjectUuid.value) fetchWeatherHistory()
})

// ── Chart data ─────────────────────────────────────────────────
const lineChartOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: '#869585', font: { size: 9 } }, grid: { color: '#1f2937' } },
    y: { ticks: { color: '#869585', font: { size: 9 } }, grid: { color: '#1f2937' } },
  },
}
const barChartOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: '#869585', font: { size: 9 } }, grid: { display: false } },
    y: { ticks: { color: '#869585', font: { size: 9 } }, grid: { color: '#1f2937' } },
  },
}

const ndviChartData = computed(() => {
  const sorted = [...ndviHistory.value].reverse()
  return {
    labels: sorted.map(r => r.date?.slice(5)),
    datasets: [{
      label: 'NDVI', data: sorted.map(r => r.ndvi),
      borderColor: '#4be277', backgroundColor: 'rgba(75,226,119,0.08)',
      fill: true, tension: 0.4, pointRadius: 2, pointBackgroundColor: '#4be277',
    }],
  }
})

const soilChartData = computed(() => {
  const sorted = [...soilHistory.value].reverse()
  return {
    labels: sorted.map(r => r.date?.slice(5)),
    datasets: [
      { label: 'Moisture %', data: sorted.map(r => r.moisture_pct), borderColor: '#60a5fa', tension: 0.4, pointRadius: 2 },
      { label: 'pH', data: sorted.map(r => r.ph_estimate), borderColor: '#facc15', tension: 0.4, pointRadius: 2 },
    ],
  }
})

const lulcBarData = computed(() => {
  const breakdown = lulcStats.value?.breakdown || []
  return {
    labels: breakdown.map(b => b.label),
    datasets: [{ label: '%', data: breakdown.map(b => b.percentage), backgroundColor: breakdown.map(b => b.color) }],
  }
})

const weatherChartData = computed(() => {
  const monthly = weatherHistory.value?.monthly_data || []
  return {
    labels: monthly.map(m => m.month),
    datasets: [
      { label: 'Temp °C', data: monthly.map(m => m.temperature_c), borderColor: '#ffba61', tension: 0.4, pointRadius: 2 },
      { label: 'Rainfall mm', data: monthly.map(m => m.rainfall_mm), borderColor: '#60a5fa', tension: 0.4, pointRadius: 2 },
    ],
  }
})

function severityColor(s) {
  return { critical: '#ffb4ab', high: '#fb923c', medium: '#ffba61', low: '#4be277' }[s] || '#bccbb9'
}
function priorityColor(p) {
  return { critical: '#ffb4ab', high: '#fb923c', medium: '#ffba61', low: '#4be277' }[p] || '#4be277'
}
</script>
