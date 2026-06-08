<template>
  <div class="flex flex-col h-full bg-gray-900 text-gray-200">

    <!-- Header -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-gray-800 shrink-0">
      <div class="flex items-center gap-2">
        <i class="pi pi-table text-green-400 text-xs" />
        <span class="text-xs font-semibold text-gray-50">Attribute Table</span>
        <span class="text-[10px] bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
          {{ features.length }} features
        </span>
      </div>
      <div class="flex items-center gap-2">
        <InputText
            v-model="search"
            placeholder="Search..."
            class="!h-7 !text-xs !bg-gray-800 !border-gray-700 !text-gray-200 w-44"
            size="small"
        />
        <button
            class="bg-transparent border-none text-gray-500 cursor-pointer p-1 rounded text-xs hover:text-gray-50"
            @click="$emit('close')"
            title="Close"
        >
          <i class="pi pi-times" />
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="flex-1 overflow-auto">
      <table class="w-full border-collapse text-xs">
        <thead>
        <tr class="bg-gray-800 sticky top-0 z-10">
          <th class="w-14 px-3 py-1.5 text-left text-gray-400 font-medium text-[11px] uppercase tracking-wider border-b border-gray-700 whitespace-nowrap">
            GID
          </th>
          <th
              v-for="col in columns"
              :key="col"
              @click="sortBy(col)"
              class="px-3 py-1.5 text-left text-gray-400 font-medium text-[11px] uppercase tracking-wider border-b border-gray-700 whitespace-nowrap cursor-pointer select-none hover:text-gray-200"
          >
            {{ col }}
            <i class="pi text-xs ml-1"
               :class="sortCol === col ? (sortDir === 'asc' ? 'pi-sort-up' : 'pi-sort-down') : 'pi-sort'" />
          </th>
          <th class="w-14 px-3 py-1.5 text-left text-gray-400 font-medium text-[11px] uppercase tracking-wider border-b border-gray-700 whitespace-nowrap">
            Actions
          </th>
        </tr>
        </thead>
        <tbody>
        <tr
            v-for="feature in filteredFeatures"
            :key="feature.id"
            class="transition-colors duration-100 cursor-pointer hover:bg-gray-800"
            :class="selectedGid === feature.id ? 'bg-emerald-950' : ''"
            @click="$emit('feature-selected', feature)"
        >
          <td class="px-3 py-1.5 text-gray-500 text-[11px] border-b border-gray-900 whitespace-nowrap">
            {{ feature.id }}
          </td>
          <td
              v-for="col in columns"
              :key="col"
              class="px-3 py-1.5 text-gray-300 border-b border-gray-900 whitespace-nowrap max-w-[150px] overflow-hidden text-ellipsis"
          >
            {{ feature.properties?.[col] ?? '—' }}
          </td>
          <td class="px-3 py-1.5 border-b border-gray-900 text-center whitespace-nowrap">
            <button
                class="bg-transparent border-none text-gray-600 cursor-pointer px-1.5 py-0.5 rounded text-[11px] transition-all duration-150 hover:bg-gray-700 hover:text-green-500"
                @click.stop="$emit('feature-selected', feature)"
                title="View on map"
            >
              <i class="pi pi-map-marker" />
            </button>
          </td>
        </tr>
        <tr v-if="!filteredFeatures.length">
          <td :colspan="columns.length + 2" class="text-center py-5 text-gray-500">
            No features found
          </td>
        </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import InputText from 'primevue/inputtext'

const props = defineProps({
  layerUuid:   String,
  features:    { type: Array, default: () => [] },
  selectedGid: [Number, String],
})

defineEmits(['feature-selected', 'close'])

const search  = ref('')
const sortCol = ref(null)
const sortDir = ref('asc')

const columns = computed(() => {
  if (!props.features.length) return []
  const keys = new Set()
  props.features.forEach(f => Object.keys(f.properties || {}).forEach(k => keys.add(k)))
  return [...keys]
})

const filteredFeatures = computed(() => {
  let list = props.features
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(f =>
        String(f.id).includes(q) ||
        Object.values(f.properties || {}).some(v => String(v).toLowerCase().includes(q))
    )
  }
  if (sortCol.value) {
    list = [...list].sort((a, b) => {
      const va = a.properties?.[sortCol.value] ?? ''
      const vb = b.properties?.[sortCol.value] ?? ''
      return sortDir.value === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
    })
  }
  return list
})

function sortBy(col) {
  if (sortCol.value === col) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortCol.value = col; sortDir.value = 'asc' }
}
</script>
