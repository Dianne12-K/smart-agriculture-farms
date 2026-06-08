<template>
  <div class="p-6 max-w-7xl mx-auto">

    <!-- Header row -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white">My Projects</h1>
        <p class="text-gray-400 text-sm mt-1">Select a project to open the map</p>
      </div>
      <Button
          label="New Project"
          icon="pi pi-plus"
          class="bg-green-600 border-green-600 hover:bg-green-700"
          @click="showCreateDialog = true"
      />
    </div>

    <!-- Stats bar -->
    <div class="grid grid-cols-3 gap-4 mb-8">
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
        <div class="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center">
          <i class="pi pi-folder text-green-400" />
        </div>
        <div>
          <p class="text-2xl font-bold text-white">{{ projectsStore.totalProjects }}</p>
          <p class="text-xs text-gray-400">Projects</p>
        </div>
      </div>
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
        <div class="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
          <i class="pi pi-map text-blue-400" />
        </div>
        <div>
          <p class="text-2xl font-bold text-white">{{ totalLayers }}</p>
          <p class="text-xs text-gray-400">Total Layers</p>
        </div>
      </div>
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
        <div class="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
          <i class="pi pi-th-large text-purple-400" />
        </div>
        <div>
          <p class="text-2xl font-bold text-white">{{ totalGroups }}</p>
          <p class="text-xs text-gray-400">Layer Groups</p>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="projectsStore.loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Skeleton v-for="n in 3" :key="n" height="10rem" class="rounded-xl" />
    </div>

    <!-- Empty state -->
    <div
        v-else-if="projectsStore.projects.length === 0"
        class="flex flex-col items-center justify-center py-24 text-center"
    >
      <div class="w-20 h-20 rounded-2xl bg-gray-800 flex items-center justify-center mb-4">
        <i class="pi pi-map text-4xl text-gray-600" />
      </div>
      <h3 class="text-white text-lg font-semibold">No projects yet</h3>
      <p class="text-gray-400 text-sm mt-1 mb-6">Create your first project to get started</p>
      <Button
          label="Create Project"
          icon="pi pi-plus"
          class="bg-green-600 border-green-600"
          @click="showCreateDialog = true"
      />
    </div>

    <!-- Projects grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
          v-for="project in projectsStore.projects"
          :key="project.uuid"
          class="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-4
               hover:border-green-700 transition-colors duration-200 group"
      >
        <!-- Top -->
        <div class="flex items-start justify-between">
          <div class="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center shrink-0">
            <i class="pi pi-folder-open text-green-400" />
          </div>
          <Button
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              size="small"
              v-tooltip.top="'Delete project'"
              @click="confirmDelete(project)"
          />
        </div>

        <!-- Info -->
        <div class="flex-1">
          <h3 class="text-white font-semibold text-base leading-tight">{{ project.name }}</h3>
          <p class="text-gray-400 text-sm mt-1 line-clamp-2">
            {{ project.description || 'No description provided' }}
          </p>
        </div>

        <!-- Meta -->
        <div class="flex items-center gap-2 text-xs text-gray-500">
          <i class="pi pi-map text-gray-600" />
          <span>{{ project.layer_count ?? 0 }} layers</span>
          <span class="mx-1">·</span>
          <i class="pi pi-calendar text-gray-600" />
          <span>{{ formatDate(project.created_at) }}</span>
        </div>

        <!-- Action -->
        <Button
            label="Open Project"
            icon="pi pi-arrow-right"
            iconPos="right"
            class="w-full bg-gray-800 border-gray-700 hover:bg-green-700 hover:border-green-700
                 text-white transition-colors duration-200"
            @click="openProject(project)"
        />
      </div>
    </div>

  </div>

  <!-- Create Project Dialog -->
  <Dialog
      v-model:visible="showCreateDialog"
      header="New Project"
      :modal="true"
      :style="{ width: '420px' }"
      class="bg-gray-900"
  >
    <div class="flex flex-col gap-4 pt-2">
      <div class="flex flex-col gap-1">
        <label class="text-sm text-gray-400">Project Name *</label>
        <InputText
            v-model="newProject.name"
            placeholder="e.g. Kakamega North Farms"
            class="w-full"
            autofocus
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm text-gray-400">Description</label>
        <Textarea
            v-model="newProject.description"
            placeholder="Optional description..."
            rows="3"
            class="w-full"
        />
      </div>
    </div>

    <template #footer>
      <Button label="Cancel" text severity="secondary" @click="showCreateDialog = false" />
      <Button
          label="Create"
          icon="pi pi-check"
          class="bg-green-600 border-green-600"
          :loading="creating"
          @click="handleCreate"
      />
    </template>
  </Dialog>

  <!-- Confirm Delete Dialog -->
  <ConfirmDialog />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useProjectsStore } from '@/stores/projects'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Skeleton from 'primevue/skeleton'
import ConfirmDialog from 'primevue/confirmdialog'

const router         = useRouter()
const toast          = useToast()
const confirm        = useConfirm()
const projectsStore  = useProjectsStore()

const showCreateDialog = ref(false)
const creating         = ref(false)
const newProject       = ref({ name: '', description: '' })

// These would come from your API later — placeholder for now
const totalLayers = computed(() =>
    projectsStore.projects.reduce((sum, p) => sum + (p.layer_count ?? 0), 0)
)
const totalGroups = ref(0)

onMounted(() => {
  projectsStore.fetchProjects()
})

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

function openProject(project) {
  router.push({ name: 'MapView', params: { projectUuid: project.uuid } })
}

async function handleCreate() {
  if (!newProject.value.name.trim()) {
    toast.add({ severity: 'warn', summary: 'Required', detail: 'Project name is required', life: 3000 })
    return
  }
  creating.value = true
  try {
    await projectsStore.addProject(newProject.value)
    toast.add({ severity: 'success', summary: 'Created!', detail: 'Project created successfully', life: 2000 })
    showCreateDialog.value = false
    newProject.value = { name: '', description: '' }
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Could not create project', life: 3000 })
  } finally {
    creating.value = false
  }
}

function confirmDelete(project) {
  confirm.require({
    message: `Delete "${project.name}"? This cannot be undone.`,
    header: 'Delete Project',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await projectsStore.removeProject(project.uuid)
        toast.add({ severity: 'success', summary: 'Deleted', detail: 'Project removed', life: 2000 })
      } catch {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Could not delete project', life: 3000 })
      }
    }
  })
}
</script>