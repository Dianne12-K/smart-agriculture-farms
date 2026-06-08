<template>
  <div class="flex flex-col h-full overflow-hidden" style="background:#0c1322; color:#dce2f7;">

    <!-- ── HEADER ─────────────────────────────────────────────── -->
    <div class="shrink-0 border-b" style="border-color:#3d4a3d; background:#141b2b;">
      <div class="px-5 pt-4 pb-3">
        <div class="flex items-start justify-between mb-3">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                    style="background:rgba(75,226,119,0.12); color:#4be277;">Active Sector</span>
              <span class="font-mono text-[11px]" style="color:#869585;">
                ID: {{ feature?.id || '—' }}
              </span>
            </div>
            <h2 class="text-[20px] font-bold leading-tight" style="color:#dce2f7;">
              {{ feature?.properties?.farm_name || 'Unknown Farm' }}
            </h2>
            <div class="flex items-center gap-4 mt-1.5">
              <div v-if="feature?.properties?.crop_type" class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[15px]" style="color:#4be277;">grass</span>
                <span class="text-[13px]" style="color:#bccbb9;">{{ feature.properties.crop_type }}</span>
              </div>
              <div v-if="feature?.properties?.area_ha" class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[15px]" style="color:#4be277;">square_foot</span>
                <span class="text-[13px]" style="color:#bccbb9;">{{ feature.properties.area_ha }} ha</span>
              </div>
              <div v-if="feature?.properties?.owner" class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[15px]" style="color:#4be277;">person</span>
                <span class="text-[13px]" style="color:#bccbb9;">{{ feature.properties.owner }}</span>
              </div>
            </div>
          </div>
          <button class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                  @click="$emit('close')">
            <span class="material-symbols-outlined text-[18px]" style="color:#869585;">close</span>
          </button>
        </div>

        <!-- Quick Stats Strip -->
        <div class="grid grid-cols-4 gap-2">
          <div class="rounded p-2 text-center border" style="background:#191f2f; border-color:#3d4a3d;">
            <span class="block text-[9px] font-bold uppercase tracking-wider mb-1" style="color:#bccbb9;">NDVI</span>
            <span class="block text-[15px] font-bold" style="color:#4be277;">
              {{ ndviData?.ndvi?.toFixed(2) ?? (ndviLoading ? '…' : '—') }}
            </span>
          </div>
          <div class="rounded p-2 text-center border" style="background:#191f2f; border-color:#3d4a3d;">
            <span class="block text-[9px] font-bold uppercase tracking-wider mb-1" style="color:#bccbb9;">Temp</span>
            <span class="block text-[15px] font-bold" style="color:#dce2f7;">
              {{ weatherSummary?.current?.temperature ?? (weatherLoading ? '…' : '—') }}{{ weatherSummary ? '°C' : '' }}
            </span>
          </div>
          <div class="rounded p-2 text-center border" style="background:#191f2f; border-color:#3d4a3d;">
            <span class="block text-[9px] font-bold uppercase tracking-wider mb-1" style="color:#bccbb9;">Risk</span>
            <span class="block text-[15px] font-bold" :style="{ color: overallRiskColor }">
              {{ disasterData?.overall_risk ? capitalize(disasterData.overall_risk) : (disasterLoading ? '…' : '—') }}
            </span>
          </div>
          <div class="rounded p-2 text-center border" style="background:#191f2f; border-color:#3d4a3d;">
            <span class="block text-[9px] font-bold uppercase tracking-wider mb-1" style="color:#bccbb9;">Health</span>
            <span class="block text-[15px] font-bold" style="color:#4be277;">
              {{ healthScore !== null ? healthScore + '%' : (recsLoading ? '…' : '—') }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── SCROLLABLE CONTENT ──────────────────────────────────── -->
    <div class="flex-1 overflow-y-auto px-5 py-5 space-y-7" style="scrollbar-width:thin; scrollbar-color:#3d4a3d transparent;">

      <!-- ── 1. VEGETATION HEALTH ── -->
      <section>
        <div class="flex items-center justify-between mb-3">
          <h3 class="flex items-center gap-2 text-[14px] font-semibold" style="color:#dce2f7;">
            <span class="material-symbols-outlined text-[18px]" style="color:#4be277;">monitoring</span>
            Vegetation health
          </h3>
          <span class="text-[10px]" style="color:#869585;">Sentinel-2 · 90d</span>
        </div>

        <div v-if="ndviLoading" class="flex items-center gap-2 py-6 justify-center text-[13px]" style="color:#869585;">
          <ProgressSpinner style="width:18px;height:18px;" strokeWidth="4" /> Fetching satellite data…
        </div>

        <div v-else-if="ndviData" class="space-y-3">
          <!-- Indices Grid -->
          <div class="grid grid-cols-2 gap-2">
            <div v-for="idx in indices" :key="idx.key" class="rounded-xl p-3 border" style="background:#191f2f; border-color:#3d4a3d;">
              <span class="block text-[10px] uppercase tracking-wider mb-1" style="color:#bccbb9;">{{ idx.label }}</span>
              <span class="block text-[20px] font-bold" :style="{ color: idx.color }">
                {{ ndviData[idx.key]?.toFixed(3) ?? '—' }}
              </span>
              <span class="block text-[10px] mt-0.5" style="color:#869585;">{{ idx.sub }}</span>
            </div>
          </div>

          <!-- NDVI Trend Chart -->
          <div v-if="ndviTrend.length" class="rounded-xl border p-3" style="background:#191f2f; border-color:#3d4a3d;">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[11px] font-semibold uppercase tracking-wider" style="color:#bccbb9;">NDVI trend</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full"
                    :style="trendBadgeStyle">{{ ndviChange?.trend ?? '' }}</span>
            </div>
            <div class="h-[100px]">
              <Line :data="trendChartData" :options="trendChartOptions" />
            </div>
          </div>

          <!-- Stress Hotspots + Zonal Stats side by side -->
          <div class="grid grid-cols-2 gap-2">
            <div class="rounded-xl border p-3" style="background:#191f2f; border-color:#3d4a3d;">
              <span class="block text-[10px] uppercase tracking-wider mb-2" style="color:#bccbb9;">Stress hotspots</span>
              <div class="grid grid-cols-3 gap-1">
                <div v-for="(cell, i) in hotspotCells" :key="i"
                     class="h-6 rounded-sm"
                     :style="{ background: cell.color, opacity: cell.opacity }"></div>
              </div>
            </div>
            <div class="rounded-xl border p-3" style="background:#191f2f; border-color:#3d4a3d;">
              <span class="block text-[10px] uppercase tracking-wider mb-2" style="color:#bccbb9;">Zonal stats</span>
              <div class="space-y-1.5">
                <div v-for="stat in zonalStats" :key="stat.label"
                     class="flex justify-between text-[11px] border-b pb-1" style="border-color:#3d4a3d22;">
                  <span style="color:#bccbb9;">{{ stat.label }}</span>
                  <span class="font-mono" style="color:#dce2f7;">{{ stat.value }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="flex justify-center py-6">
          <Button label="Fetch NDVI data" icon="pi pi-refresh" size="small" outlined @click="fetchNdvi" />
        </div>
      </section>

      <div class="border-t" style="border-color:#3d4a3d;"></div>

      <!-- ── 2. SOIL & LAND COVER ── -->
      <section>
        <h3 class="flex items-center gap-2 text-[14px] font-semibold mb-3" style="color:#dce2f7;">
          <span class="material-symbols-outlined text-[18px]" style="color:#4be277;">opacity</span>
          Soil &amp; land cover
        </h3>

        <div v-if="soilLoading" class="flex items-center gap-2 py-6 justify-center text-[13px]" style="color:#869585;">
          <ProgressSpinner style="width:18px;height:18px;" strokeWidth="4" /> Fetching soil data…
        </div>

        <div v-else-if="soilData" class="space-y-3">
          <div class="grid grid-cols-2 gap-2">
            <!-- Moisture -->
            <div class="rounded-xl border p-3" style="background:#191f2f; border-color:#3d4a3d;">
              <span class="block text-[10px] uppercase tracking-wider mb-1" style="color:#bccbb9;">Moisture</span>
              <div class="flex items-end gap-2">
                <span class="text-[20px] font-bold" style="color:#dce2f7;">{{ soilData.moisture?.surface_pct }}%</span>
                <span class="text-[10px] mb-1" style="color:#4be277;">{{ soilData.moisture?.status?.label }}</span>
              </div>
              <div class="w-full h-1.5 rounded-full mt-2 overflow-hidden" style="background:#2e3545;">
                <div class="h-full rounded-full transition-all duration-500"
                     :style="{ width: soilData.moisture?.surface_pct + '%', background: '#4be277' }"></div>
              </div>
            </div>
            <!-- pH -->
            <div class="rounded-xl border p-3" style="background:#191f2f; border-color:#3d4a3d;">
              <span class="block text-[10px] uppercase tracking-wider mb-1" style="color:#bccbb9;">pH</span>
              <div class="flex items-end gap-2">
                <span class="text-[20px] font-bold" style="color:#dce2f7;">{{ soilData.properties?.ph_estimate }}</span>
                <span class="text-[10px] mb-1" :style="{ color: soilData.properties?.ph_status?.color }">
                  {{ soilData.properties?.ph_status?.label }}
                </span>
              </div>
            </div>
          </div>

          <!-- OC + Texture -->
          <div class="grid grid-cols-2 gap-2">
            <div class="rounded-xl border p-3" style="background:#191f2f; border-color:#3d4a3d;">
              <span class="block text-[10px] uppercase tracking-wider mb-1" style="color:#bccbb9;">Organic carbon</span>
              <span class="block text-[15px] font-bold" style="color:#dce2f7;">{{ soilData.properties?.organic_carbon }} g/kg</span>
              <span class="block text-[10px] mt-0.5" :style="{ color: soilData.properties?.oc_status?.color }">
                {{ soilData.properties?.oc_status?.label }}
              </span>
            </div>
            <div class="rounded-xl border p-3" style="background:#191f2f; border-color:#3d4a3d;">
              <span class="block text-[10px] uppercase tracking-wider mb-1" style="color:#bccbb9;">Texture</span>
              <span class="block text-[15px] font-bold" style="color:#dce2f7;">{{ soilData.properties?.texture_class }}</span>
              <span class="block text-[10px] mt-0.5" style="color:#869585;">
                Clay {{ soilData.properties?.clay_pct }}% · Sand {{ soilData.properties?.sand_pct }}%
              </span>
            </div>
          </div>

          <!-- LULC -->
          <div v-if="lulcData" class="rounded-xl border p-3" style="background:#191f2f; border-color:#3d4a3d;">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[10px] uppercase tracking-wider font-semibold" style="color:#bccbb9;">LULC class</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-bold"
                    style="background:rgba(75,226,119,0.12); color:#4be277;">
                {{ lulcData.dominant_class }}
              </span>
            </div>
            <div class="space-y-1.5">
              <div v-for="cls in lulcClasses" :key="cls.name" class="flex items-center gap-2">
                <span class="text-[11px] w-20 truncate" style="color:#bccbb9;">{{ cls.name }}</span>
                <div class="flex-1 h-1.5 rounded-full overflow-hidden" style="background:#2e3545;">
                  <div class="h-full rounded-full" :style="{ width: cls.pct + '%', background: cls.color }"></div>
                </div>
                <span class="text-[11px] font-mono w-8 text-right" style="color:#dce2f7;">{{ cls.pct }}%</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="flex justify-center py-6">
          <Button label="Fetch soil data" icon="pi pi-refresh" size="small" outlined @click="fetchSoil" />
        </div>
      </section>

      <div class="border-t" style="border-color:#3d4a3d;"></div>

      <!-- ── 3. DISASTER RISK ── -->
      <section>
        <h3 class="flex items-center gap-2 text-[14px] font-semibold mb-3" style="color:#dce2f7;">
          <span class="material-symbols-outlined text-[18px]" style="color:#ffb4ab;">report</span>
          Disaster risk
        </h3>

        <div v-if="disasterLoading" class="flex items-center gap-2 py-6 justify-center text-[13px]" style="color:#869585;">
          <ProgressSpinner style="width:18px;height:18px;" strokeWidth="4" /> Scanning…
        </div>

        <div v-else-if="disasterData" class="space-y-2">
          <div v-for="type in disasterTypes" :key="type.key"
               class="rounded-xl border p-3" style="background:#191f2f; border-color:#3d4a3d;">
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[16px]" :style="{ color: type.color }">
                  {{ type.icon }}
                </span>
                <span class="text-[13px] font-semibold capitalize" style="color:#dce2f7;">{{ type.key }}</span>
              </div>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase"
                    :style="riskBadgeStyle(getRisk(type.key))">
                {{ getRisk(type.key) || 'none' }}
              </span>
            </div>
            <p class="text-[11px] leading-relaxed" style="color:#bccbb9;">
              {{ disasterData[type.key]?.alert_message || '—' }}
            </p>
          </div>
        </div>

        <div v-else class="flex justify-center py-6">
          <Button label="Scan for risks" icon="pi pi-search" size="small" outlined @click="fetchDisasters" />
        </div>
      </section>

      <div class="border-t" style="border-color:#3d4a3d;"></div>

      <!-- ── 4. YIELD & AI RECOMMENDATIONS ── -->
      <section>
        <div class="rounded-xl border p-4 relative overflow-hidden" style="background:rgba(75,226,119,0.05); border-color:rgba(75,226,119,0.2);">
          <span class="material-symbols-outlined absolute -right-2 -top-2 text-[72px] pointer-events-none"
                style="color:rgba(75,226,119,0.07);">psychology</span>

          <h3 class="flex items-center gap-2 text-[14px] font-semibold mb-3" style="color:#4be277;">
            <span class="material-symbols-outlined text-[18px]">auto_awesome</span>
            AI insights
          </h3>

          <div v-if="recsLoading" class="flex items-center gap-2 py-4 justify-center text-[13px]" style="color:#869585;">
            <ProgressSpinner style="width:18px;height:18px;" strokeWidth="4" /> Generating…
          </div>

          <div v-else-if="recommendations.length || yieldData">
            <!-- Yield + Health Score row -->
            <div class="flex items-center gap-4 mb-4">
              <!-- Health Ring -->
              <div v-if="healthScore !== null" class="relative w-16 h-16 shrink-0">
                <svg viewBox="0 0 64 64" class="w-16 h-16 -rotate-90">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#2e3545" stroke-width="6" />
                  <circle cx="32" cy="32" r="26" fill="none"
                          :stroke="getHealthColor(healthScore)" stroke-width="6"
                          stroke-dasharray="163"
                          :stroke-dashoffset="163 - (163 * healthScore / 100)"
                          stroke-linecap="round" />
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span class="text-[14px] font-bold" style="color:#dce2f7;">{{ healthScore }}</span>
                  <span class="text-[9px]" style="color:#869585;">/100</span>
                </div>
              </div>
              <div>
                <p class="text-[13px] font-semibold" :style="{ color: getHealthColor(healthScore) }">{{ healthStatus }}</p>
                <p class="text-[11px]" style="color:#bccbb9;">Farm health score</p>
                <div v-if="yieldData" class="mt-1">
                  <span class="text-[15px] font-bold" style="color:#dce2f7;">{{ yieldData.predicted_yield }}</span>
                  <span class="text-[11px] ml-1" style="color:#869585;">{{ yieldData.unit || 't/ha' }}</span>
                  <span class="text-[10px] ml-1.5 px-1.5 py-0.5 rounded-full"
                        style="background:rgba(75,226,119,0.12); color:#4be277;">
                    {{ yieldData.confidence_pct }}% confidence
                  </span>
                </div>
              </div>
            </div>

            <!-- Crop selector + Predict button -->
            <div v-if="!yieldData" class="flex gap-2 mb-3">
              <Select v-model="selectedCropType" :options="cropTypes" placeholder="Crop type"
                      class="flex-1 text-[12px]" size="small" />
              <Button label="Predict yield" icon="pi pi-chart-line" size="small" outlined @click="fetchYield" />
            </div>

            <!-- Recommendations -->
            <div class="space-y-2">
              <div v-for="rec in recommendations" :key="rec.title"
                   class="rounded-lg p-2.5 border-l-[3px]"
                   style="background:rgba(0,0,0,0.2);"
                   :style="{ borderColor: priorityColor(rec.priority) }">
                <div class="flex items-center gap-2 mb-1">
                  <span class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ background: priorityColor(rec.priority) }"></span>
                  <span class="flex-1 text-[12px] font-semibold" style="color:#dce2f7;">{{ rec.title }}</span>
                  <span class="text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold"
                        :style="priorityBadgeStyle(rec.priority)">{{ rec.priority }}</span>
                </div>
                <p class="text-[11px] leading-relaxed" style="color:#bccbb9;">{{ rec.detail }}</p>
              </div>
            </div>
          </div>

          <div v-else class="flex flex-col items-center gap-2 py-4">
            <div class="flex gap-2">
              <Select v-model="selectedCropType" :options="cropTypes" placeholder="Crop type"
                      class="text-[12px]" size="small" />
              <Button label="Generate" icon="pi pi-lightbulb" size="small" outlined @click="fetchBoth" />
            </div>
          </div>
        </div>
      </section>

      <div class="border-t" style="border-color:#3d4a3d;"></div>

      <!-- ── 5. WEATHER ── -->
      <section>
        <h3 class="flex items-center gap-2 text-[14px] font-semibold mb-3" style="color:#dce2f7;">
          <span class="material-symbols-outlined text-[18px]" style="color:#4be277;">cloud</span>
          5-day outlook
        </h3>

        <div v-if="weatherLoading" class="flex items-center gap-2 py-6 justify-center text-[13px]" style="color:#869585;">
          <ProgressSpinner style="width:18px;height:18px;" strokeWidth="4" /> Fetching weather…
        </div>

        <div v-else-if="weatherForecast.length" class="space-y-3">
          <!-- Forecast Strip -->
          <div class="rounded-xl border p-3" style="background:#191f2f; border-color:#3d4a3d;">
            <div class="flex justify-between">
              <div v-for="day in weatherForecast" :key="day.date"
                   class="flex flex-col items-center gap-1 px-1">
                <span class="text-[10px]" style="color:#bccbb9;">{{ day.day }}</span>
                <span class="material-symbols-outlined text-[20px]" :style="{ color: day.iconColor }">
                  {{ day.icon }}
                </span>
                <span class="text-[12px] font-bold" style="color:#dce2f7;">{{ day.temp }}°</span>
                <span class="text-[9px]" style="color:#869585;">{{ day.rain }}mm</span>
              </div>
            </div>
          </div>

          <!-- Suitability note -->
          <div v-if="weatherSummary?.farming_suitability" class="flex items-start gap-2.5 rounded-lg p-3 border"
               style="background:rgba(5,102,217,0.08); border-color:rgba(5,102,217,0.25);">
            <span class="material-symbols-outlined text-[16px] mt-0.5" style="color:#adc6ff;">info</span>
            <p class="text-[11px] leading-relaxed" style="color:#dce2f7;">
              {{ weatherSummary.farming_suitability }}
            </p>
          </div>
        </div>

        <div v-else class="flex justify-center py-6">
          <Button label="Load weather" icon="pi pi-cloud" size="small" outlined @click="fetchWeather" />
        </div>
      </section>

      <!-- Bottom spacer for action bar -->
      <div class="h-16"></div>
    </div>

    <!-- ── FOOTER ACTION BAR ──────────────────────────────────── -->
    <div class="shrink-0 flex gap-2 p-3 border-t" style="border-color:#3d4a3d; background:#0c1322;">
      <Button label="Export analysis" icon="pi pi-download" class="flex-1"
              style="background:#4be277; color:#003915; border:none; font-weight:600;" />
      <Button icon="pi pi-share-alt" outlined style="border-color:#3d4a3d; color:#bccbb9; width:44px;" />
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js'
import Button from 'primevue/button'
import Select from 'primevue/select'
import ProgressSpinner from 'primevue/progressspinner'
import {
  getNdvi, getNdviTrend, getNdviChange,
  getSoilProfile, getFeatureRecommendation,
  predictYield, getDisasterScan,
  getLulcClassify, getWeatherForecast, getWeatherSummary
} from '@/services/api'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const props = defineProps({
  layerUuid:   String,
  projectUuid: String,
  feature:     Object,
})
defineEmits(['close'])

// ── State ──────────────────────────────────────────────────────
const ndviData       = ref(null)
const ndviTrend      = ref([])
const ndviChange     = ref(null)
const soilData       = ref(null)
const lulcData       = ref(null)
const recommendations = ref([])
const healthScore    = ref(null)
const healthStatus   = ref('')
const yieldData      = ref(null)
const disasterData   = ref(null)
const weatherForecast = ref([])
const weatherSummary  = ref(null)

const selectedCropType = ref('maize')
const cropTypes = ['maize', 'tea', 'beans', 'sugarcane']

const ndviLoading     = ref(false)
const soilLoading     = ref(false)
const recsLoading     = ref(false)
const yieldLoading    = ref(false)
const disasterLoading = ref(false)
const weatherLoading  = ref(false)

// Reset + auto-fetch on feature change
watch(() => props.feature, () => {
  ndviData.value = null; ndviTrend.value = []; ndviChange.value = null
  soilData.value = null; lulcData.value = null
  recommendations.value = []; healthScore.value = null
  yieldData.value = null; disasterData.value = null
  weatherForecast.value = []; weatherSummary.value = null

  fetchNdvi()
  fetchSoil()
  fetchDisasters()
  fetchRecommendations()
  fetchWeather()
}, { immediate: true })

// ── Fetchers ───────────────────────────────────────────────────
async function fetchNdvi() {
  if (!props.layerUuid || !props.feature?.id) return
  ndviLoading.value = true
  try {
    const [ndviRes, trendRes, changeRes] = await Promise.all([
      getNdvi(props.layerUuid, props.feature.id),
      getNdviTrend(props.layerUuid, props.feature.id, 90),
      getNdviChange(props.layerUuid, props.feature.id, 30),
    ])
    ndviData.value   = ndviRes.data
    ndviTrend.value  = trendRes.data.series || []
    ndviChange.value = changeRes.data
  } catch (e) { console.error('NDVI', e) }
  finally { ndviLoading.value = false }
}

async function fetchSoil() {
  if (!props.layerUuid || !props.feature?.id) return
  soilLoading.value = true
  try {
    const [soilRes, lulcRes] = await Promise.all([
      getSoilProfile(props.layerUuid, props.feature.id),
      getLulcClassify(props.layerUuid, props.feature.id),
    ])
    soilData.value = soilRes.data
    lulcData.value = lulcRes.data
  } catch (e) { console.error('Soil', e) }
  finally { soilLoading.value = false }
}

async function fetchRecommendations() {
  if (!props.layerUuid || !props.feature?.id) return
  recsLoading.value = true
  try {
    const cropType = props.feature?.properties?.crop_type || selectedCropType.value
    const res = await getFeatureRecommendation(props.layerUuid, props.feature.id, { crop_type: cropType })
    recommendations.value = res.data.recommendations || []
    healthScore.value  = res.data.health_score
    healthStatus.value = res.data.health_status
  } catch (e) { console.error('Recs', e) }
  finally { recsLoading.value = false }
}

async function fetchYield() {
  if (!props.layerUuid || !props.feature?.id) return
  yieldLoading.value = true
  try {
    const res = await predictYield(props.layerUuid, props.feature.id, selectedCropType.value)
    yieldData.value = res.data
  } catch (e) { console.error('Yield', e) }
  finally { yieldLoading.value = false }
}

async function fetchDisasters() {
  if (!props.layerUuid || !props.feature?.id) return
  disasterLoading.value = true
  try {
    const res = await getDisasterScan(props.layerUuid, props.feature.id)
    disasterData.value = res.data
  } catch (e) { console.error('Disasters', e) }
  finally { disasterLoading.value = false }
}

async function fetchWeather() {
  if (!props.projectUuid) return
  weatherLoading.value = true
  try {
    const [forecastRes, summaryRes] = await Promise.all([
      getWeatherForecast(props.projectUuid),
      getWeatherSummary(props.projectUuid),
    ])
    weatherSummary.value = summaryRes.data

    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    weatherForecast.value = (forecastRes.data.forecast || []).slice(0, 5).map(d => ({
      date: d.date,
      day:  days[new Date(d.date).getDay()],
      temp: Math.round(d.temp_max ?? d.temperature ?? 0),
      rain: d.precipitation ?? 0,
      icon: weatherIcon(d.condition),
      iconColor: weatherIconColor(d.condition),
    }))
  } catch (e) { console.error('Weather', e) }
  finally { weatherLoading.value = false }
}

async function fetchBoth() {
  await Promise.all([fetchRecommendations(), fetchYield()])
}

// ── Computed helpers ───────────────────────────────────────────
const indices = computed(() => [
  { key: 'ndvi', label: 'NDVI',  color: '#4be277', sub: getNdviLabel(ndviData.value?.ndvi) },
  { key: 'savi', label: 'SAVI',  color: '#facc15', sub: 'Soil adjusted' },
  { key: 'ndwi', label: 'NDWI',  color: '#60a5fa', sub: 'Water index' },
  { key: 'lai',  label: 'LAI',   color: '#c084fc', sub: 'Leaf area index' },
])

const zonalStats = computed(() => ndviData.value ? [
  { label: 'Mean NDVI', value: ndviData.value.ndvi?.toFixed(3) },
  { label: 'SAVI',      value: ndviData.value.savi?.toFixed(3) },
  { label: 'NDWI',      value: ndviData.value.ndwi?.toFixed(3) },
] : [])

const hotspotCells = computed(() => {
  if (!ndviData.value) return Array(9).fill({ color: '#2e3545', opacity: 1 })
  // Map NDVI value to grid — real hotspot data would come from /ndvi/{gid}/hotspots
  const v = ndviData.value.ndvi ?? 0.5
  return Array(9).fill(null).map((_, i) => {
    const jitter = (Math.sin(i * 137.5) + 1) / 2
    const val = Math.max(0, Math.min(1, v + (jitter - 0.5) * 0.3))
    return {
      color: val > 0.6 ? '#4be277' : val > 0.4 ? '#ffba61' : '#ffb4ab',
      opacity: 0.6 + val * 0.4,
    }
  })
})

const lulcClasses = computed(() => {
  if (!lulcData.value?.probabilities) return []
  const colors = { crops: '#4be277', trees: '#22c55e', shrubland: '#facc15', flooded: '#60a5fa', built: '#9ca3af', bare: '#d97706', snow: '#e0e7ff', clouds: '#6b7280', water: '#3b82f6' }
  return Object.entries(lulcData.value.probabilities)
      .map(([name, pct]) => ({ name: capitalize(name), pct: Math.round(pct * 100), color: colors[name] || '#4be277' }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 5)
})

const trendChartData = computed(() => ({
  labels: ndviTrend.value.map(d => d.date?.slice(5)),
  datasets: [{
    label: 'NDVI',
    data: ndviTrend.value.map(d => d.ndvi),
    borderColor: '#4be277',
    backgroundColor: 'rgba(75,226,119,0.08)',
    fill: true, tension: 0.4, pointRadius: 2,
    pointBackgroundColor: '#4be277',
  }]
}))

const trendChartOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: '#869585', font: { size: 9 } }, grid: { color: '#1f2937' } },
    y: { ticks: { color: '#869585', font: { size: 9 } }, grid: { color: '#1f2937' }, min: 0, max: 1 },
  }
}

const trendBadgeStyle = computed(() => {
  const t = ndviChange.value?.trend
  if (t === 'improving') return 'background:rgba(75,226,119,0.15); color:#4be277;'
  if (t === 'stable')    return 'background:rgba(134,149,133,0.15); color:#bccbb9;'
  return 'background:rgba(255,180,171,0.15); color:#ffb4ab;'
})

const overallRiskColor = computed(() => {
  const r = disasterData.value?.overall_risk
  if (!r || r === 'none') return '#4be277'
  if (r === 'low')        return '#4be277'
  if (r === 'medium')     return '#ffba61'
  return '#ffb4ab'
})

const disasterTypes = [
  { key: 'flood',   icon: 'water',              color: '#60a5fa' },
  { key: 'drought', icon: 'wb_sunny',            color: '#ffba61' },
  { key: 'fire',    icon: 'local_fire_department', color: '#ffb4ab' },
]

// ── Style helpers ──────────────────────────────────────────────
function riskBadgeStyle(risk) {
  if (!risk || risk === 'none') return 'background:rgba(134,149,133,0.15); color:#bccbb9;'
  if (risk === 'low')           return 'background:rgba(75,226,119,0.15); color:#4be277;'
  if (risk === 'medium')        return 'background:rgba(255,186,97,0.15); color:#ffba61;'
  return 'background:rgba(255,180,171,0.15); color:#ffb4ab;'
}

function priorityColor(p) {
  return { critical: '#ffb4ab', high: '#fb923c', medium: '#ffba61', low: '#4be277' }[p] || '#4be277'
}

function priorityBadgeStyle(p) {
  const c = priorityColor(p)
  return `background:${c}22; color:${c};`
}

function getHealthColor(v) {
  if (!v) return '#869585'
  if (v >= 70) return '#4be277'
  if (v >= 50) return '#ffba61'
  return '#ffb4ab'
}

function getNdviLabel(v) {
  if (!v) return '—'
  if (v >= 0.6) return 'Healthy'
  if (v >= 0.4) return 'Moderate'
  return 'Stressed'
}

function getRisk(type) {
  return disasterData.value?.[type]?.flood_risk
      || disasterData.value?.[type]?.drought_risk
      || disasterData.value?.[type]?.fire_risk
      || 'none'
}

function weatherIcon(condition = '') {
  const c = condition.toLowerCase()
  if (c.includes('rain'))  return 'rainy'
  if (c.includes('cloud')) return 'partly_cloudy_day'
  if (c.includes('storm')) return 'thunderstorm'
  return 'sunny'
}

function weatherIconColor(condition = '') {
  const c = condition.toLowerCase()
  if (c.includes('rain'))  return '#adc6ff'
  if (c.includes('storm')) return '#ffb4ab'
  return '#4be277'
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
}
</script>

<style scoped>
::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #3d4a3d; border-radius: 10px; }
</style>