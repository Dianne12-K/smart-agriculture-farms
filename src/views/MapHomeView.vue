<template>
  <div class="p-6 pb-24 lg:pb-8">
    <div class="max-w-7xl mx-auto">
      <div class="mb-8">
        <h1 class="text-[30px] font-bold text-[#dce2f7] tracking-tight">Map</h1>
        <p class="text-[14px] text-[#bccbb9] mt-1">
          Choose a project to open its map, layer groups, and layers.
        </p>
      </div>

      <!-- Loading -->
      <div v-if="projectsStore.loading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div v-for="n in 3" :key="n"
             class="h-40 rounded-xl bg-[#141b2b] border border-[#3d4a3d] animate-pulse" />
      </div>

      <!-- Empty -->
      <div v-else-if="projectsStore.projects.length === 0"
           class="flex flex-col items-center justify-center py-24 text-center">
        <div class="w-20 h-20 rounded-2xl bg-[#232a3a] border border-[#3d4a3d]
                    flex items-center justify-center mb-4">
          <i class="pi pi-map text-4xl text-[#869585]" />
        </div>
        <h3 class="text-[#dce2f7] text-lg font-semibold">No projects yet</h3>
        <p class="text-[#bccbb9] text-sm mt-1 mb-6">
          Create a project from the Dashboard before opening the map.
        </p>
        <RouterLink :to="{ name: 'Dashboard' }"
                    class="px-6 py-3 rounded-xl bg-[#22c55e] text-[#003915] text-[12px] font-bold uppercase hover:brightness-110 transition-all">
          Go to Dashboard
        </RouterLink>
      </div>

      <!-- Project picker grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <button
            v-for="project in projectsStore.projects"
            :key="project.uuid"
            class="text-left bg-[#141b2b] border border-[#3d4a3d] rounded-xl p-6
                   hover:border-[#4be277]/50 hover:shadow-xl hover:shadow-black/30
                   transition-all flex flex-col gap-3"
            @click="openProject(project)"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                 :style="{ background: getProjectColor(project.uuid) + '22' }">
              <i class="pi pi-map" :style="{ color: getProjectColor(project.uuid) }" />
            </div>
            <h3 class="text-[16px] font-semibold text-[#dce2f7] leading-snug truncate">
              {{ project.name }}
            </h3>
          </div>
          <p class="text-[13px] text-[#bccbb9] line-clamp-2 flex-1">
            {{ project.description || 'No description provided.' }}
          </p>
          <div class="flex items-center gap-4 text-[#869585]">
            <div class="flex items-center gap-1.5">
              <i class="pi pi-th-large text-xs" />
              <span class="text-[12px]">{{ project.layer_count ?? '—' }} Layers</span>
            </div>
            <div class="flex items-center gap-1.5">
              <i class="pi pi-sitemap text-xs" />
              <span class="text-[12px]">{{ project.group_count ?? '—' }} Groups</span>
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'

const router = useRouter()
const projectsStore = useProjectsStore()

onMounted(() => {
  // fetchProjects rethrows; the message is already on projectsStore.error
  if (!projectsStore.projects.length) projectsStore.fetchProjects().catch(() => {})
})

const PROJECT_COLORS = ['#4be277', '#adc6ff', '#ffba61', '#ef9900', '#22c55e', '#3b82f6']
function getProjectColor(uuid) {
  if (!uuid) return PROJECT_COLORS[0]
  const hash = uuid.split('').reduce((a, c) => Math.imul(31, a) + c.charCodeAt(0) | 0, 0)
  return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length]
}

function openProject(project) {
  router.push({ name: 'MapView', params: { projectUuid: project.uuid } })
}
</script>
