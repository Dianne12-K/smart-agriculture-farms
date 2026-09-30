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
        <template v-if="selected.size">
          <span class="text-[10px] bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded-full">
            {{ selected.size }} selected
          </span>
          <button class="text-[11px] text-gray-400 hover:text-gray-100 underline"
                  @click="clearSelection">clear</button>
          <button class="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-gray-800
                         text-gray-300 hover:bg-gray-700"
                  @click="$emit('bulk-edit', selectedGids)">
            <i class="pi pi-pencil text-[10px]" /> Edit
          </button>
          <button class="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-gray-800
                         text-red-400 hover:bg-red-900/50"
                  @click="handleBulkDelete">
            <i class="pi pi-trash text-[10px]" /> Delete
          </button>
        </template>
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
          <th class="w-8 px-3 py-1.5 border-b border-gray-700">
            <input type="checkbox" class="accent-emerald-500" :checked="allFilteredSelected"
                   @change="toggleSelectAll($event.target.checked)" />
          </th>
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
          <th class="w-20 px-3 py-1.5 text-left text-gray-400 font-medium text-[11px] uppercase tracking-wider border-b border-gray-700 whitespace-nowrap">
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
          <td class="px-3 py-1.5 border-b border-gray-900" @click.stop>
            <input type="checkbox" class="accent-emerald-500"
                   :checked="selected.has(feature.id)"
                   @change="toggleOne(feature.id, $event.target.checked)" />
          </td>
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
                @click.stop="$emit('edit-feature', feature)"
                title="Edit attributes"
            >
              <i class="pi pi-pencil" />
            </button>
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
          <td :colspan="columns.length + 3" class="text-center py-5 text-gray-500">
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

const emit = defineEmits(['feature-selected', 'edit-feature', 'bulk-edit', 'bulk-delete', 'close'])

const search  = ref('')
const sortCol = ref(null)
const sortDir = ref('asc')
const selected = ref(new Set())

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

const allFilteredSelected = computed(() =>
    filteredFeatures.value.length > 0 && filteredFeatures.value.every(f => selected.value.has(f.id))
)
const selectedGids = computed(() => [...selected.value])

function sortBy(col) {
  if (sortCol.value === col) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortCol.value = col; sortDir.value = 'asc' }
}

function toggleOne(gid, checked) {
  const next = new Set(selected.value)
  if (checked) next.add(gid)
  else next.delete(gid)
  selected.value = next
}

function toggleSelectAll(checked) {
  const next = new Set(selected.value)
  filteredFeatures.value.forEach(f => checked ? next.add(f.id) : next.delete(f.id))
  selected.value = next
}

function clearSelection() {
  selected.value = new Set()
}

function handleBulkDelete() {
  if (!confirm(`Delete ${selected.value.size} selected feature(s)?`)) return
  emit('bulk-delete', selectedGids.value)
  clearSelection()
}
</script>
