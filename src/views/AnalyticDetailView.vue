<template>
  <div class="min-h-full" style="background:#0c1322; color:#dce2f7;">

    <!-- Header -->
    <div class="sticky top-0 z-10 border-b" style="border-color:#3d4a3d; background:#141b2b;">
      <div class="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
        <button class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 hover:bg-white/10 transition-colors"
                @click="goBack" title="Back to map">
          <i class="pi pi-arrow-left" style="color:#bccbb9;" />
        </button>
        <div class="flex items-center gap-2.5 shrink-0">
          <span class="material-symbols-outlined text-[22px]" :style="{ color: config.color }">{{ config.icon }}</span>
          <h1 class="text-[20px] font-bold leading-tight">{{ config.title }}</h1>
        </div>
        <span class="text-[13px] truncate" style="color:#869585;">
          — {{ feature?.properties?.farm_name || feature?.properties?.name || `Feature ${gid}` }}
        </span>
      </div>
    </div>

    <div class="max-w-5xl mx-auto px-6 py-6 space-y-6">

      <!-- Explanation -->
      <section class="rounded-xl border p-5" style="background:#191f2f; border-color:#3d4a3d;">
        <h2 class="text-[13px] font-semibold uppercase tracking-wider mb-2" style="color:#bccbb9;">What this is</h2>
        <p class="text-[14px] leading-relaxed" style="color:#dce2f7;">{{ config.explanation }}</p>
      </section>

      <div v-if="loading" class="flex items-center gap-2 py-16 justify-center text-[14px]" style="color:#869585;">
        <i class="pi pi-spin pi-spinner" /> Loading {{ config.title.toLowerCase() }}…
      </div>

      <!-- ── VEGETATION ───────────────────────────────────────── -->
      <template v-else-if="metric === 'vegetation'">
        <section class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div v-for="idx in vegIndices" :key="idx.key" class="rounded-xl border p-4" style="background:#191f2f; border-color:#3d4a3d;">
            <span class="block text-[10px] uppercase tracking-wider mb-1" style="color:#bccbb9;">{{ idx.label }}</span>
            <span class="block text-[24px] font-bold" :style="{ color: idx.color }">{{ ndvi?.[idx.key]?.toFixed(3) ?? '—' }}</span>
            <p class="text-[11px] mt-1 leading-relaxed" style="color:#869585;">{{ idx.help }}</p>
          </div>
        </section>

        <section class="rounded-xl border p-5" style="background:#191f2f; border-color:#3d4a3d;">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-[14px] font-semibold">NDVI trend (180 days)</h3>
            <span class="text-[11px] px-2 py-0.5 rounded-full" :style="trendBadgeStyle">{{ ndviChange?.trend ?? '—' }}</span>
          </div>
          <div v-if="ndviTrend.length" class="h-[220px]">
            <Line :data="trendChartData" :options="lineOptions" />
          </div>
          <p v-else class="text-[13px] text-center py-8" style="color:#869585;">No trend data yet.</p>
        </section>

        <section class="rounded-xl border p-5" style="background:#191f2f; border-color:#3d4a3d;">
          <h3 class="text-[14px] font-semibold mb-3">Full history</h3>
          <div v-if="ndviHistory.length" class="h-[180px]">
            <Line :data="historyChartData" :options="lineOptions" />
          </div>
          <p v-else class="text-[13px] text-center py-8" style="color:#869585;">No history yet — use Generate Demo Data on the map.</p>
        </section>

        <section class="rounded-xl border p-5" style="background:#191f2f; border-color:#3d4a3d;">
          <h3 class="text-[14px] font-semibold mb-3">Stress hotspots (30d, 5×5)</h3>
          <div class="grid grid-cols-5 gap-1.5 max-w-sm">
            <div v-for="(cell, i) in hotspotCells" :key="i" class="aspect-square rounded"
                 :style="{ background: cell.color, opacity: cell.opacity }" :title="cell.value" />
          </div>
          <p class="text-[11px] mt-3" style="color:#869585;">
            Greener cells indicate healthier vegetation; red/orange cells flag possible stress within the field.
          </p>
        </section>
      </template>

      <!-- ── SOIL ─────────────────────────────────────────────── -->
      <template v-else-if="metric === 'soil'">
        <section class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="rounded-xl border p-4" style="background:#191f2f; border-color:#3d4a3d;">
            <span class="block text-[10px] uppercase tracking-wider mb-1" style="color:#bccbb9;">Moisture</span>
            <span class="block text-[22px] font-bold" style="color:#dce2f7;">{{ soilProfile?.moisture?.surface_pct ?? '—' }}%</span>
            <span class="block text-[11px]" style="color:#4be277;">{{ soilProfile?.moisture?.status?.label }}</span>
          </div>
          <div class="rounded-xl border p-4" style="background:#191f2f; border-color:#3d4a3d;">
            <span class="block text-[10px] uppercase tracking-wider mb-1" style="color:#bccbb9;">pH</span>
            <span class="block text-[22px] font-bold" style="color:#dce2f7;">{{ soilProperties?.ph_estimate ?? '—' }}</span>
            <span class="block text-[11px]" :style="{ color: soilProperties?.ph_status?.color }">{{ soilProperties?.ph_status?.label }}</span>
          </div>
          <div class="rounded-xl border p-4" style="background:#191f2f; border-color:#3d4a3d;">
            <span class="block text-[10px] uppercase tracking-wider mb-1" style="color:#bccbb9;">Organic carbon</span>
            <span class="block text-[22px] font-bold" style="color:#dce2f7;">{{ soilProperties?.organic_carbon ?? '—' }}</span>
            <span class="block text-[11px]" style="color:#869585;">g/kg</span>
          </div>
          <div class="rounded-xl border p-4" style="background:#191f2f; border-color:#3d4a3d;">
            <span class="block text-[10px] uppercase tracking-wider mb-1" style="color:#bccbb9;">Texture</span>
            <span class="block text-[16px] font-bold" style="color:#dce2f7;">{{ soilProperties?.texture_class ?? '—' }}</span>
            <span class="block text-[11px]" style="color:#869585;">Clay {{ soilProperties?.clay_pct }}% · Sand {{ soilProperties?.sand_pct }}%</span>
          </div>
        </section>

        <section class="rounded-xl border p-5" style="background:#191f2f; border-color:#3d4a3d;">
          <h3 class="text-[14px] font-semibold mb-3">Moisture &amp; pH history</h3>
          <div v-if="soilHistory.length" class="h-[200px]">
            <Line :data="soilChartData" :options="lineOptions" />
          </div>
          <p v-else class="text-[13px] text-center py-8" style="color:#869585;">No soil history yet.</p>
        </section>

        <section v-if="lulcClassify" class="rounded-xl border p-5" style="background:#191f2f; border-color:#3d4a3d;">
          <h3 class="text-[14px] font-semibold mb-3">Land cover breakdown</h3>
          <div class="space-y-2">
            <div v-for="cls in lulcClasses" :key="cls.name" class="flex items-center gap-2">
              <span class="text-[12px] w-24 truncate" style="color:#bccbb9;">{{ cls.name }}</span>
              <div class="flex-1 h-2 rounded-full overflow-hidden" style="background:#2e3545;">
                <div class="h-full rounded-full" :style="{ width: cls.pct + '%', background: cls.color }"></div>
              </div>
              <span class="text-[12px] font-mono w-10 text-right">{{ cls.pct }}%</span>
            </div>
          </div>
        </section>
      </template>

      <!-- ── DISASTER ─────────────────────────────────────────── -->
      <template v-else-if="metric === 'disaster'">
        <section class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div v-for="type in disasterTypes" :key="type.key" class="rounded-xl border p-4" style="background:#191f2f; border-color:#3d4a3d;">
            <div class="flex items-center gap-2 mb-2">
              <span class="material-symbols-outlined text-[18px]" :style="{ color: type.color }">{{ type.icon }}</span>
              <span class="text-[13px] font-semibold capitalize">{{ type.key }}</span>
              <span class="ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold uppercase"
                    :style="riskBadgeStyle(disasterDetail[type.key]?.[type.key + '_risk'])">
                {{ disasterDetail[type.key]?.[type.key + '_risk'] || 'none' }}
              </span>
            </div>
            <p class="text-[12px] leading-relaxed" style="color:#bccbb9;">{{ type.help }}</p>
            <p v-if="disasterDetail[type.key]?.alert_message" class="text-[11px] mt-2" style="color:#ffb4ab;">
              {{ disasterDetail[type.key].alert_message }}
            </p>
          </div>
        </section>

        <section class="rounded-xl border p-5" style="background:#191f2f; border-color:#3d4a3d;">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-[14px] font-semibold">Alert history</h3>
            <button class="text-[11px] underline" style="color:#869585;" @click="showLayerAlerts = !showLayerAlerts">
              {{ showLayerAlerts ? 'This feature only' : 'Whole layer' }}
            </button>
          </div>
          <div v-if="displayedAlerts.length" class="space-y-2 max-h-[300px] overflow-y-auto">
            <div v-for="a in displayedAlerts" :key="a.id" class="rounded-lg p-3 border-l-[3px]"
                 style="background:rgba(0,0,0,0.15);" :style="{ borderColor: severityColor(a.severity) }">
              <div class="flex items-center justify-between">
                <span class="text-[12px] font-semibold capitalize">{{ a.disaster_type }}</span>
                <span class="text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold"
                      :style="{ background: severityColor(a.severity) + '22', color: severityColor(a.severity) }">{{ a.severity }}</span>
              </div>
              <p class="text-[11px] mt-0.5" style="color:#bccbb9;">{{ a.description || a.title }}</p>
              <span class="text-[10px]" style="color:#869585;">{{ a.detected_at }}</span>
            </div>
          </div>
          <p v-else class="text-[13px] text-center py-8" style="color:#869585;">No alerts recorded.</p>
        </section>
      </template>

      <!-- ── YIELD / AI INSIGHTS ──────────────────────────────── -->
      <template v-else-if="metric === 'yield'">
        <section class="rounded-xl border p-5 flex items-end gap-3" style="background:#191f2f; border-color:#3d4a3d;">
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] uppercase tracking-wider" style="color:#869585;">Crop type</label>
            <Select v-model="cropType" :options="cropTypes" class="w-40" size="small" @change="refreshYield" />
          </div>
          <div v-if="yieldData" class="ml-4">
            <span class="text-[24px] font-bold">{{ yieldData.predicted_yield }}</span>
            <span class="text-[12px] ml-1" style="color:#869585;">{{ yieldData.unit || 't/ha' }}</span>
            <span class="text-[11px] ml-2 px-2 py-0.5 rounded-full" style="background:rgba(75,226,119,0.12); color:#4be277;">
              {{ yieldData.confidence_pct }}% confidence
            </span>
          </div>
        </section>

        <section class="rounded-xl border p-5" style="background:#191f2f; border-color:#3d4a3d;">
          <h3 class="text-[14px] font-semibold mb-3">Recorded &amp; predicted yield history</h3>
          <div v-if="yieldHistory.length" class="h-[200px]">
            <Line :data="yieldChartData" :options="lineOptions" />
          </div>
          <p v-else class="text-[13px] text-center py-8" style="color:#869585;">No yield history yet.</p>
        </section>

        <section class="rounded-xl border p-5" style="background:#191f2f; border-color:#3d4a3d;">
          <h3 class="text-[14px] font-semibold mb-3">Recommendation history</h3>
          <div v-if="recHistory.length" class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div v-for="r in recHistory" :key="r.id" class="rounded-lg p-2.5 border-l-[3px]"
                 style="background:rgba(0,0,0,0.15);" :style="{ borderColor: priorityColor(r.priority) }">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold"
                      :style="{ background: priorityColor(r.priority) + '22', color: priorityColor(r.priority) }">{{ r.priority }}</span>
                <span class="text-[10px]" style="color:#869585;">{{ r.generated_at }}</span>
              </div>
              <p class="text-[12px]" style="color:#bccbb9;">{{ r.text }}</p>
            </div>
          </div>
          <p v-else class="text-[13px] text-center py-8" style="color:#869585;">No recommendations recorded yet.</p>
        </section>
      </template>

      <!-- ── WEATHER ──────────────────────────────────────────── -->
      <template v-else-if="metric === 'weather'">
        <section class="grid grid-cols-2 md:grid-cols-4 gap-3" v-if="weatherCurrent">
          <div class="rounded-xl border p-4" style="background:#191f2f; border-color:#3d4a3d;">
            <span class="block text-[10px] uppercase tracking-wider mb-1" style="color:#bccbb9;">Temp</span>
            <span class="block text-[22px] font-bold">{{ weatherCurrent.temperature }}°C</span>
          </div>
          <div class="rounded-xl border p-4" style="background:#191f2f; border-color:#3d4a3d;">
            <span class="block text-[10px] uppercase tracking-wider mb-1" style="color:#bccbb9;">Humidity</span>
            <span class="block text-[22px] font-bold">{{ weatherCurrent.humidity }}%</span>
          </div>
          <div class="rounded-xl border p-4" style="background:#191f2f; border-color:#3d4a3d;">
            <span class="block text-[10px] uppercase tracking-wider mb-1" style="color:#bccbb9;">Wind</span>
            <span class="block text-[22px] font-bold">{{ weatherCurrent.wind_speed ?? '—' }}</span>
          </div>
          <div class="rounded-xl border p-4" style="background:#191f2f; border-color:#3d4a3d;">
            <span class="block text-[10px] uppercase tracking-wider mb-1" style="color:#bccbb9;">Condition</span>
            <span class="block text-[16px] font-bold">{{ weatherCurrent.condition ?? '—' }}</span>
          </div>
        </section>

        <section class="rounded-xl border p-5" style="background:#191f2f; border-color:#3d4a3d;">
          <h3 class="text-[14px] font-semibold mb-3">5-day forecast</h3>
          <div v-if="weatherForecast.length" class="flex justify-between">
            <div v-for="day in weatherForecast" :key="day.date" class="flex flex-col items-center gap-1 px-1">
              <span class="text-[11px]" style="color:#bccbb9;">{{ day.day }}</span>
              <span class="text-[14px] font-bold">{{ day.temp }}°</span>
              <span class="text-[10px]" style="color:#869585;">{{ day.rain }}mm</span>
            </div>
          </div>
          <p v-else class="text-[13px] text-center py-8" style="color:#869585;">No forecast available.</p>
        </section>

        <section class="rounded-xl border p-5" style="background:#191f2f; border-color:#3d4a3d;">
          <h3 class="text-[14px] font-semibold mb-3">24-month history</h3>
          <div v-if="weatherHistory?.monthly_data?.length" class="h-[200px]">
            <Line :data="weatherChartData" :options="lineOptions" />
          </div>
          <p v-else class="text-[13px] text-center py-8" style="color:#869585;">No historical weather yet.</p>
        </section>

        <section v-if="weatherSummary?.farming_suitability" class="rounded-xl border p-4 flex items-start gap-2.5"
                 style="background:rgba(5,102,217,0.08); border-color:rgba(5,102,217,0.25);">
          <span class="material-symbols-outlined text-[18px] mt-0.5" style="color:#adc6ff;">info</span>
          <p class="text-[12px] leading-relaxed">{{ weatherSummary.farming_suitability }}</p>
        </section>
      </template>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler
} from 'chart.js'
import Select from 'primevue/select'
import {
  getFeature,
  getNdvi, getNdviTrend, getNdviChange, getNdviHotspots, getNdviHistory,
  getSoilProfile, getSoilProperties, getSoilHistory, getLulcClassify,
  getDisasterScan, getDrought, getFire, getFlood, getFeatureAlerts, getDisasterAlerts,
  predictYield, getYieldHistory, getFeatureRecommendation, getRecommendationHistory,
  getWeatherCurrent, getWeatherForecast, getWeatherSummary, getWeatherHistorical,
} from '@/services/api'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const route  = useRoute()
const router = useRouter()

const metric      = route.params.metric
const projectUuid = route.params.projectUuid
const layerUuid   = route.params.layerUuid
const gid         = route.params.gid

const feature = ref(null)
const loading = ref(true)

const METRIC_CONFIG = {
  vegetation: {
    title: 'Vegetation Health', icon: 'monitoring', color: '#4be277',
    explanation: 'Satellite vegetation indices (NDVI, SAVI, NDWI, LAI) derived from Sentinel-2 imagery describe how healthy, dense, and water-stressed the crop canopy is across this field, tracked over time to catch stress before it is visible on the ground.',
  },
  soil: {
    title: 'Soil & Land Cover', icon: 'opacity', color: '#60a5fa',
    explanation: 'Soil moisture, pH, organic carbon and texture are estimated from satellite and modeled soil data, alongside a land-use/land-cover classification showing what portion of the field is cropland, bare soil, or other cover types.',
  },
  disaster: {
    title: 'Disaster Risk', icon: 'report', color: '#ffb4ab',
    explanation: 'Automated scans for flood, drought, and fire risk based on recent rainfall, soil moisture, vegetation stress and thermal anomalies, with a history of alerts raised for this feature and its layer.',
  },
  yield: {
    title: 'Yield & AI Recommendations', icon: 'auto_awesome', color: '#4be277',
    explanation: 'A predictive model estimates expected yield for the selected crop from vegetation, soil and weather signals, and the recommendation engine turns current field conditions into prioritized actions.',
  },
  weather: {
    title: 'Weather', icon: 'cloud', color: '#adc6ff',
    explanation: 'Current conditions, a 5-day forecast, and long-run historical weather for this project’s location, plus a farming-suitability note generated from the forecast.',
  },
}
const config = computed(() => METRIC_CONFIG[metric] || METRIC_CONFIG.vegetation)

function goBack() {
  router.push({ name: 'MapView', params: { projectUuid } })
}

// ── Vegetation state ──────────────────────────────────────────
const ndvi        = ref(null)
const ndviTrend   = ref([])
const ndviChange  = ref(null)
const ndviHistory = ref([])
const hotspots    = ref(null)

const vegIndices = [
  { key: 'ndvi', label: 'NDVI', color: '#4be277', help: 'Overall vegetation greenness/health' },
  { key: 'savi', label: 'SAVI', color: '#facc15', help: 'Vegetation index adjusted for exposed soil' },
  { key: 'ndwi', label: 'NDWI', color: '#60a5fa', help: 'Canopy water content' },
  { key: 'lai',  label: 'LAI',  color: '#c084fc', help: 'Leaf area index — canopy density' },
]

const trendChartData = computed(() => ({
  labels: ndviTrend.value.map(d => d.date?.slice(5)),
  datasets: [{ label: 'NDVI', data: ndviTrend.value.map(d => d.ndvi), borderColor: '#4be277', backgroundColor: 'rgba(75,226,119,0.08)', fill: true, tension: 0.4, pointRadius: 2 }],
}))
const historyChartData = computed(() => {
  const sorted = [...ndviHistory.value].reverse()
  return { labels: sorted.map(r => r.date?.slice(5)), datasets: [{ label: 'NDVI', data: sorted.map(r => r.ndvi), borderColor: '#4be277', tension: 0.4, pointRadius: 2 }] }
})
const trendBadgeStyle = computed(() => {
  const t = ndviChange.value?.trend
  if (t === 'improving') return 'background:rgba(75,226,119,0.15); color:#4be277;'
  if (t === 'stable')    return 'background:rgba(134,149,133,0.15); color:#bccbb9;'
  return 'background:rgba(255,180,171,0.15); color:#ffb4ab;'
})
const hotspotCells = computed(() => {
  const grid = hotspots.value?.grid || hotspots.value?.cells
  if (Array.isArray(grid) && grid.length) {
    return grid.map(c => {
      const v = c.ndvi ?? c.value ?? 0.5
      return { value: v?.toFixed?.(2), color: v > 0.6 ? '#4be277' : v > 0.4 ? '#ffba61' : '#ffb4ab', opacity: 0.6 + v * 0.4 }
    })
  }
  const v = ndvi.value?.ndvi ?? 0.5
  return Array(25).fill(null).map((_, i) => {
    const jitter = (Math.sin(i * 137.5) + 1) / 2
    const val = Math.max(0, Math.min(1, v + (jitter - 0.5) * 0.3))
    return { value: val.toFixed(2), color: val > 0.6 ? '#4be277' : val > 0.4 ? '#ffba61' : '#ffb4ab', opacity: 0.6 + val * 0.4 }
  })
})

async function loadVegetation() {
  const [ndviRes, trendRes, changeRes, historyRes, hotspotsRes] = await Promise.allSettled([
    getNdvi(layerUuid, gid),
    getNdviTrend(layerUuid, gid, 180),
    getNdviChange(layerUuid, gid, 30),
    getNdviHistory(layerUuid, gid),
    getNdviHotspots(layerUuid, gid, 30, 5),
  ])
  if (ndviRes.status === 'fulfilled') ndvi.value = ndviRes.value.data
  if (trendRes.status === 'fulfilled') ndviTrend.value = trendRes.value.data.series || []
  if (changeRes.status === 'fulfilled') ndviChange.value = changeRes.value.data
  if (historyRes.status === 'fulfilled') ndviHistory.value = historyRes.value.data.readings || []
  if (hotspotsRes.status === 'fulfilled') hotspots.value = hotspotsRes.value.data
}

// ── Soil state ─────────────────────────────────────────────────
const soilProfile    = ref(null)
const soilProperties = ref(null)
const soilHistory    = ref([])
const lulcClassify   = ref(null)

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
const lulcClasses = computed(() => {
  if (!lulcClassify.value?.probabilities) return []
  const colors = { crops: '#4be277', trees: '#22c55e', shrubland: '#facc15', flooded: '#60a5fa', built: '#9ca3af', bare: '#d97706', snow: '#e0e7ff', clouds: '#6b7280', water: '#3b82f6' }
  return Object.entries(lulcClassify.value.probabilities)
      .map(([name, pct]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), pct: Math.round(pct * 100), color: colors[name] || '#4be277' }))
      .sort((a, b) => b.pct - a.pct).slice(0, 6)
})

async function loadSoil() {
  const [profileRes, propsRes, historyRes, lulcRes] = await Promise.allSettled([
    getSoilProfile(layerUuid, gid, 14),
    getSoilProperties(layerUuid, gid),
    getSoilHistory(layerUuid, gid),
    getLulcClassify(layerUuid, gid, 90),
  ])
  if (profileRes.status === 'fulfilled') soilProfile.value = profileRes.value.data
  if (propsRes.status === 'fulfilled') soilProperties.value = propsRes.value.data
  if (historyRes.status === 'fulfilled') soilHistory.value = historyRes.value.data.readings || []
  if (lulcRes.status === 'fulfilled') lulcClassify.value = lulcRes.value.data
}

// ── Disaster state ────────────────────────────────────────────
const disasterDetail  = ref({ flood: null, drought: null, fire: null })
const featureAlerts   = ref([])
const layerAlerts     = ref([])
const showLayerAlerts = ref(false)
const displayedAlerts = computed(() => showLayerAlerts.value ? layerAlerts.value : featureAlerts.value)

const disasterTypes = [
  { key: 'flood',   icon: 'water',                   color: '#60a5fa', help: 'Risk of waterlogging or inundation from heavy rainfall and poor drainage.' },
  { key: 'drought', icon: 'wb_sunny',                 color: '#ffba61', help: 'Risk of water stress from extended low rainfall and declining soil moisture.' },
  { key: 'fire',    icon: 'local_fire_department',    color: '#ffb4ab', help: 'Risk of fire from dry vegetation, high temperatures, and low humidity.' },
]

async function loadDisaster() {
  const [scanRes, droughtRes, fireRes, floodRes, featRes, layerRes] = await Promise.allSettled([
    getDisasterScan(layerUuid, gid, 60),
    getDrought(layerUuid, gid, 60),
    getFire(layerUuid, gid, 60),
    getFlood(layerUuid, gid, 60),
    getFeatureAlerts(layerUuid, gid),
    getDisasterAlerts(layerUuid),
  ])
  const detail = {}
  if (scanRes.status === 'fulfilled') Object.assign(detail, scanRes.value.data)
  if (droughtRes.status === 'fulfilled') detail.drought = { ...detail.drought, ...droughtRes.value.data }
  if (fireRes.status === 'fulfilled') detail.fire = { ...detail.fire, ...fireRes.value.data }
  if (floodRes.status === 'fulfilled') detail.flood = { ...detail.flood, ...floodRes.value.data }
  disasterDetail.value = detail
  if (featRes.status === 'fulfilled') featureAlerts.value = featRes.value.data.alerts || []
  if (layerRes.status === 'fulfilled') layerAlerts.value = layerRes.value.data.alerts || []
}

function severityColor(s) { return { critical: '#ffb4ab', high: '#fb923c', medium: '#ffba61', low: '#4be277' }[s] || '#bccbb9' }
function riskBadgeStyle(risk) {
  if (!risk || risk === 'none') return 'background:rgba(134,149,133,0.15); color:#bccbb9;'
  if (risk === 'low')    return 'background:rgba(75,226,119,0.15); color:#4be277;'
  if (risk === 'medium') return 'background:rgba(255,186,97,0.15); color:#ffba61;'
  return 'background:rgba(255,180,171,0.15); color:#ffb4ab;'
}

// ── Yield state ────────────────────────────────────────────────
const cropTypes   = ['maize', 'tea', 'beans', 'sugarcane']
const cropType    = ref(feature.value?.properties?.crop_type || 'maize')
const yieldData   = ref(null)
const yieldHistory = ref([])
const recHistory  = ref([])

const yieldChartData = computed(() => {
  const sorted = [...yieldHistory.value].reverse()
  return {
    labels: sorted.map(r => r.date?.slice(0, 10) || r.recorded_at?.slice(0, 10)),
    datasets: [{ label: 'Yield (t/ha)', data: sorted.map(r => r.yield_value ?? r.predicted_yield), borderColor: '#4be277', backgroundColor: 'rgba(75,226,119,0.08)', fill: true, tension: 0.4, pointRadius: 2 }],
  }
})

async function refreshYield() {
  try { yieldData.value = (await predictYield(layerUuid, gid, { crop_type: cropType.value })).data } catch { yieldData.value = null }
}

async function loadYield() {
  const [histRes, recHistRes] = await Promise.allSettled([
    getYieldHistory(layerUuid, gid),
    getRecommendationHistory(layerUuid, gid),
  ])
  if (histRes.status === 'fulfilled') yieldHistory.value = histRes.value.data || []
  if (recHistRes.status === 'fulfilled') recHistory.value = recHistRes.value.data || []
  await refreshYield()
  try { await getFeatureRecommendation(layerUuid, gid, { crop_type: cropType.value }) } catch { /* optional */ }
}

function priorityColor(p) { return { critical: '#ffb4ab', high: '#fb923c', medium: '#ffba61', low: '#4be277' }[p] || '#4be277' }

// ── Weather state ──────────────────────────────────────────────
const weatherCurrent  = ref(null)
const weatherForecast = ref([])
const weatherSummary  = ref(null)
const weatherHistory  = ref(null)

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

async function loadWeather() {
  const [curRes, fcRes, sumRes, histRes] = await Promise.allSettled([
    getWeatherCurrent(projectUuid),
    getWeatherForecast(projectUuid),
    getWeatherSummary(projectUuid),
    getWeatherHistorical(projectUuid, 24),
  ])
  if (curRes.status === 'fulfilled') weatherCurrent.value = curRes.value.data
  if (sumRes.status === 'fulfilled') weatherSummary.value = sumRes.value.data
  if (histRes.status === 'fulfilled') weatherHistory.value = histRes.value.data
  if (fcRes.status === 'fulfilled') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    weatherForecast.value = (fcRes.value.data.forecast || []).slice(0, 5).map(d => ({
      date: d.date, day: days[new Date(d.date).getDay()],
      temp: Math.round(d.temp_max ?? d.temperature ?? 0), rain: d.precipitation ?? 0,
    }))
  }
}

// ── Chart options ──────────────────────────────────────────────
const lineOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: true, labels: { color: '#bccbb9', font: { size: 10 } } } },
  scales: {
    x: { ticks: { color: '#869585', font: { size: 9 } }, grid: { color: '#1f2937' } },
    y: { ticks: { color: '#869585', font: { size: 9 } }, grid: { color: '#1f2937' } },
  },
}

onMounted(async () => {
  try { feature.value = (await getFeature(layerUuid, gid)).data } catch { /* best-effort */ }

  loading.value = true
  try {
    if (metric === 'vegetation') await loadVegetation()
    else if (metric === 'soil') await loadSoil()
    else if (metric === 'disaster') await loadDisaster()
    else if (metric === 'yield') await loadYield()
    else if (metric === 'weather') await loadWeather()
  } finally {
    loading.value = false
  }
})
</script>
