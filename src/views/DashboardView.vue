<template>
  <div class="p-6 pb-24 lg:pb-8">
    <div class="max-w-7xl mx-auto">

      <!-- Page header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 class="text-[30px] leading-[38px] font-bold text-[#dce2f7] tracking-tight">
            Projects Dashboard
          </h1>
          <p class="text-[14px] text-[#bccbb9] mt-1">
            Manage geospatial datasets and regional farm analytics.
          </p>
        </div>
        <button
            class="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#22c55e] text-[#003915]
                 text-[12px] font-bold tracking-[0.05em] uppercase shadow-lg
                 hover:brightness-110 active:scale-95 transition-all self-start md:self-auto"
            @click="showCreateDialog = true"
        >
          <i class="pi pi-plus" />
          New Project
        </button>
      </div>

      <!-- Stats cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <div
            v-for="stat in statCards"
            :key="stat.label"
            class="bg-[#232a3a] border border-[#3d4a3d] p-6 rounded-xl flex items-center
                 gap-6 group hover:border-[#4be277]/50 transition-colors"
        >
          <div
              class="h-14 w-14 rounded-full flex items-center justify-center
                   group-hover:scale-110 transition-transform"
              :class="stat.bgClass"
          >
            <i :class="`pi ${stat.icon} text-2xl`" :style="{ color: stat.color }" />
          </div>
          <div>
            <div class="text-[24px] font-bold text-[#dce2f7] leading-tight">
              <span v-if="projectsStore.loading">—</span>
              <span v-else>{{ stat.value }}</span>
            </div>
            <div class="text-[11px] text-[#bccbb9] uppercase tracking-[0.05em] mt-0.5">
              {{ stat.label }}
            </div>
          </div>
        </div>
      </div>

      <!-- Loading skeletons -->
      <div v-if="projectsStore.loading"
           class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <div
            v-for="n in 3" :key="n"
            class="bg-[#141b2b] border border-[#3d4a3d] rounded-xl overflow-hidden animate-pulse"
        >
          <div class="h-32 bg-[#2e3545]" />
          <div class="p-6 flex flex-col gap-3">
            <div class="h-4 bg-[#2e3545] rounded w-3/4" />
            <div class="h-3 bg-[#2e3545] rounded w-full" />
            <div class="h-3 bg-[#2e3545] rounded w-2/3" />
            <div class="h-10 bg-[#2e3545] rounded-lg mt-4" />
          </div>
        </div>
      </div>

      <!-- Error state -->
      <!-- Must precede the empty state: a failed fetch leaves projects at [],
           and "No projects yet" would otherwise hide a real server problem. -->
      <div
          v-else-if="projectsStore.error"
          class="flex flex-col items-center justify-center py-24 text-center"
      >
        <div class="w-20 h-20 rounded-2xl bg-[#2b1b1b] border border-[#5c3a3a]
                    flex items-center justify-center mb-4">
          <i class="pi pi-exclamation-triangle text-4xl text-[#f87171]" />
        </div>
        <h3 class="text-[#dce2f7] text-lg font-semibold">Couldn't load your projects</h3>
        <p class="text-[#bccbb9] text-sm mt-1 mb-6 max-w-md">
          {{ projectsStore.error }}
        </p>
        <button
            class="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#22c55e] text-[#003915]
                 text-[12px] font-bold uppercase hover:brightness-110 transition-all"
            @click="loadProjects"
        >
          <i class="pi pi-refresh" /> Try again
        </button>
      </div>

      <!-- Empty state -->
      <div
          v-else-if="projectsStore.projects.length === 0"
          class="flex flex-col items-center justify-center py-24 text-center"
      >
        <div class="w-20 h-20 rounded-2xl bg-[#232a3a] border border-[#3d4a3d]
                    flex items-center justify-center mb-4">
          <i class="pi pi-map text-4xl text-[#869585]" />
        </div>
        <h3 class="text-[#dce2f7] text-lg font-semibold">No projects yet</h3>
        <p class="text-[#bccbb9] text-sm mt-1 mb-6">
          Create your first project to get started
        </p>
        <button
            class="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#22c55e] text-[#003915]
                 text-[12px] font-bold uppercase hover:brightness-110 transition-all"
            @click="showCreateDialog = true"
        >
          <i class="pi pi-plus" /> Create Project
        </button>
      </div>

      <!-- Projects grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">

        <div
            v-for="project in projectsStore.projects"
            :key="project.uuid"
            class="bg-[#141b2b] border border-[#3d4a3d] rounded-xl overflow-hidden
                 hover:shadow-xl hover:shadow-black/30 transition-all flex flex-col group"
        >
          <!-- Decorative header strip -->
          <div class="h-32 relative overflow-hidden bg-[#2e3545]">
            <div
                class="absolute inset-0 opacity-30"
                :style="{
                background: `radial-gradient(ellipse at 30% 50%,
                  ${getProjectColor(project.uuid)}40 0%, transparent 70%)`
              }"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-[#141b2b] to-transparent" />

            <!-- Active badge -->
            <div class="absolute bottom-3 left-4 flex items-center gap-1.5">
              <div class="w-1.5 h-1.5 rounded-full bg-[#4be277] animate-pulse" />
              <span class="text-[10px] font-bold text-[#4be277] uppercase tracking-widest
                           bg-[#070e1d]/80 backdrop-blur px-2 py-0.5 rounded-full
                           border border-[#4be277]/20">
                Active
              </span>
            </div>

            <!-- Edit / Delete (hover) -->
            <div class="absolute top-3 right-3 flex gap-1 opacity-0
                        group-hover:opacity-100 transition-opacity">
              <!-- Only the owner can manage who else has access -->
              <button
                  v-if="project.role !== 'viewer' && project.role !== 'editor'"
                  class="w-7 h-7 rounded-lg bg-[#070e1d]/80 backdrop-blur border border-[#3d4a3d]
                       flex items-center justify-center text-[#bccbb9] hover:text-[#4be277]
                       transition-colors"
                  title="Manage access"
                  @click.stop="openMembers(project)"
              >
                <i class="pi pi-users text-[10px]" />
              </button>
              <button
                  class="w-7 h-7 rounded-lg bg-[#070e1d]/80 backdrop-blur border border-[#3d4a3d]
                       flex items-center justify-center text-[#bccbb9] hover:text-[#dce2f7]
                       transition-colors"
                  @click.stop="startEdit(project)"
              >
                <i class="pi pi-pencil text-[10px]" />
              </button>
              <button
                  class="w-7 h-7 rounded-lg bg-[#070e1d]/80 backdrop-blur border border-[#3d4a3d]
                       flex items-center justify-center text-[#bccbb9] hover:text-[#ffb4ab]
                       transition-colors"
                  @click.stop="confirmDelete(project)"
              >
                <i class="pi pi-trash text-[10px]" />
              </button>
            </div>
          </div>

          <!-- Card body -->
          <div class="p-6 flex flex-col flex-1">
            <h3 class="text-[16px] font-semibold text-[#dce2f7] leading-snug mb-2">
              {{ project.name }}
            </h3>
            <p class="text-[14px] text-[#bccbb9] line-clamp-2 mb-6 flex-1">
              {{ project.description || 'No description provided.' }}
            </p>

            <!-- Meta -->
            <div class="flex items-center gap-4 text-[#869585] mb-5">
              <div class="flex items-center gap-1.5">
                <i class="pi pi-th-large text-xs" />
                <span class="text-[12px]">{{ project.layer_count ?? '—' }} Layers</span>
              </div>
              <div class="flex items-center gap-1.5">
                <i class="pi pi-calendar text-xs" />
                <span class="text-[12px]">{{ formatDate(project.created_at) }}</span>
              </div>
            </div>

            <button
                class="w-full py-3 rounded-lg text-[12px] font-bold uppercase tracking-[0.05em]
                     bg-[#4be277] text-[#003915] hover:brightness-110
                     active:scale-[0.98] transition-all"
                @click="openProject(project)"
            >
              Open Project
            </button>
          </div>
        </div>

        <!-- New project placeholder card -->
        <div
            class="border-2 border-dashed border-[#3d4a3d] rounded-xl flex flex-col
                 items-center justify-center p-8 min-h-[360px] cursor-pointer
                 hover:border-[#4be277]/50 hover:bg-[#4be277]/5 transition-all"
            @click="showCreateDialog = true"
        >
          <div class="w-16 h-16 rounded-full bg-[#232a3a] flex items-center justify-center mb-4">
            <i class="pi pi-plus-circle text-3xl text-[#4be277]" />
          </div>
          <h3 class="text-[16px] font-semibold text-[#dce2f7] mb-1">Create New Area</h3>
          <p class="text-[12px] text-[#bccbb9] text-center">
            Define a new farm boundary or import geospatial shapefiles.
          </p>
        </div>

      </div>
    </div>

    <!-- Create / Edit Dialog -->
    <Dialog
        v-model:visible="showCreateDialog"
        :header="editingProject ? 'Edit Project' : 'New Project'"
        :modal="true"
        :style="{ width: '440px' }"
        :pt="{
        root:    { class: '!bg-[#141b2b] !border !border-[#3d4a3d] !rounded-2xl' },
        header:  { class: '!bg-[#141b2b] !text-[#dce2f7] !border-b !border-[#3d4a3d] !rounded-t-2xl' },
        content: { class: '!bg-[#141b2b]' },
        footer:  { class: '!bg-[#141b2b] !border-t !border-[#3d4a3d] !rounded-b-2xl' },
      }"
    >
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-2">
          <label class="text-[11px] font-medium tracking-[0.05em] uppercase text-[#bccbb9]">
            Project Name *
          </label>
          <InputText
              v-model="form.name"
              placeholder="e.g. Western Soy Region"
              class="w-full !bg-[#0c1322] !border-[#3d4a3d] !text-[#dce2f7]"
              autofocus
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-[11px] font-medium tracking-[0.05em] uppercase text-[#bccbb9]">
            Description
          </label>
          <Textarea
              v-model="form.description"
              placeholder="Optional description..."
              :rows="3"
              class="w-full !bg-[#0c1322] !border-[#3d4a3d] !text-[#dce2f7] resize-none"
          />
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" text severity="secondary" @click="closeDialog" />
        <Button
            :label="editingProject ? 'Save Changes' : 'Create'"
            icon="pi pi-check"
            :loading="saving"
            class="!bg-[#22c55e] !border-[#22c55e] !text-[#003915] !font-bold"
            @click="handleSubmit"
        />
      </template>
    </Dialog>

    <!-- Manage access -->
    <Dialog
        v-model:visible="showMembersDialog"
        modal
        :header="`Access — ${membersProject?.name ?? ''}`"
        :style="{ width: '34rem' }"
    >
      <p class="text-[12px] text-[#bccbb9] mb-4 leading-relaxed">
        People you add here see this project when they sign in. They must create
        their own account first at
        <span class="text-[#4be277]">/register</span>, then give you the email
        they used.
      </p>

      <!-- Add -->
      <div class="flex gap-2 mb-4">
        <InputText
            v-model="newMemberEmail"
            placeholder="their@email.com"
            class="flex-1"
            :disabled="membersBusy"
            @keyup.enter="handleAddMember"
        />
        <Select
            v-model="newMemberRole"
            :options="['viewer', 'editor', 'admin']"
            class="w-32"
            :disabled="membersBusy"
        />
        <Button
            label="Add"
            :loading="membersBusy"
            :disabled="!newMemberEmail.trim()"
            @click="handleAddMember"
        />
      </div>

      <div v-if="membersError"
           class="text-[12px] text-[#ffb4ab] mb-3 p-2 rounded-lg bg-[#2b1b1b] border border-[#5c3a3a]">
        {{ membersError }}
      </div>

      <!-- Current access -->
      <div v-if="membersLoading" class="text-[12px] text-[#bccbb9] py-4">Loading…</div>
      <ul v-else class="flex flex-col gap-2 max-h-72 overflow-auto">
        <li
            v-for="person in members" :key="person.uuid"
            class="flex items-center gap-3 p-3 rounded-lg bg-[#2e3545]/40 border border-[#3d4a3d]"
        >
          <div class="w-8 h-8 rounded-full bg-[#22c55e]/15 flex items-center justify-center shrink-0">
            <i class="pi pi-user text-[#4be277] text-xs" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[13px] text-[#dce2f7] font-medium truncate">{{ person.username }}</p>
            <p class="text-[11px] text-[#869585] truncate">{{ person.email }}</p>
          </div>
          <span v-if="person.role === 'owner'"
                class="text-[10px] px-2 py-0.5 rounded-full shrink-0"
                style="background:rgba(75,226,119,0.15); color:#4be277;">owner</span>
          <template v-else>
            <Select
                :model-value="person.role"
                :options="['viewer', 'editor', 'admin']"
                class="w-28 shrink-0"
                @update:model-value="(r) => handleRoleChange(person, r)"
            />
            <button
                class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                     text-[#bccbb9] hover:text-[#ffb4ab] transition-colors"
                title="Remove access"
                @click="handleRemoveMember(person)"
            >
              <i class="pi pi-times text-[10px]" />
            </button>
          </template>
        </li>
      </ul>

      <template #footer>
        <Button label="Done" text severity="secondary" @click="showMembersDialog = false" />
      </template>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useProjectsStore } from '@/stores/projects'
import {
  updateProject, getProjectMembers, addProjectMember,
  updateMemberRole, removeProjectMember,
} from '@/services/api'
import { describeApiError } from '@/utils/apiError'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import ConfirmDialog from 'primevue/confirmdialog'

const router        = useRouter()
const toast         = useToast()
const confirm       = useConfirm()
const projectsStore = useProjectsStore()

const showCreateDialog = ref(false)

// ── Manage access ──────────────────────────────────────────────
const showMembersDialog = ref(false)
const membersProject    = ref(null)
const members           = ref([])
const membersLoading    = ref(false)
const membersBusy       = ref(false)
const membersError      = ref('')
const newMemberEmail    = ref('')
const newMemberRole     = ref('viewer')

async function openMembers(project) {
  membersProject.value   = project
  showMembersDialog.value = true
  members.value          = []
  membersError.value     = ''
  newMemberEmail.value   = ''
  newMemberRole.value    = 'viewer'
  membersLoading.value   = true
  try {
    members.value = (await getProjectMembers(project.uuid)).data
  } catch (e) {
    membersError.value = describeApiError(e)
  } finally {
    membersLoading.value = false
  }
}

async function handleAddMember() {
  const email = newMemberEmail.value.trim()
  if (!email) return
  membersBusy.value  = true
  membersError.value = ''
  try {
    await addProjectMember(membersProject.value.uuid, email, newMemberRole.value)
    members.value = (await getProjectMembers(membersProject.value.uuid)).data
    newMemberEmail.value = ''
    toast.add({ severity: 'success', summary: 'Access granted',
                detail: `${email} can now open this project`, life: 3000 })
  } catch (e) {
    // Surfaces the backend's own wording, e.g. "No account exists for X.
    // Ask them to register first" - the actionable part.
    membersError.value = describeApiError(e)
  } finally {
    membersBusy.value = false
  }
}

async function handleRoleChange(person, role) {
  if (!role || role === person.role) return
  try {
    await updateMemberRole(membersProject.value.uuid, person.uuid, role)
    person.role = role
  } catch (e) {
    membersError.value = describeApiError(e)
  }
}

async function handleRemoveMember(person) {
  try {
    await removeProjectMember(membersProject.value.uuid, person.uuid)
    members.value = members.value.filter(m => m.uuid !== person.uuid)
  } catch (e) {
    membersError.value = describeApiError(e)
  }
}
const saving           = ref(false)
const editingProject   = ref(null)
const form = ref({ name: '', description: '' })

const statCards = computed(() => [
  {
    label:   'Projects',
    value:   projectsStore.totalProjects,
    icon:    'pi-folder-open',
    color:   '#4be277',
    bgClass: 'bg-[#4be277]/10',
  },
  {
    label:   'Layers',
    value:   projectsStore.totalLayers,
    icon:    'pi-th-large',
    color:   '#adc6ff',
    bgClass: 'bg-[#adc6ff]/10',
  },
  {
    label:   'Layer Groups',
    value:   projectsStore.totalGroups,
    icon:    'pi-sitemap',
    color:   '#ffba61',
    bgClass: 'bg-[#ffba61]/10',
  },
])

const PROJECT_COLORS = ['#4be277','#adc6ff','#ffba61','#ef9900','#22c55e','#3b82f6']
function getProjectColor(uuid) {
  if (!uuid) return PROJECT_COLORS[0]
  const hash = uuid.split('').reduce((a, c) => Math.imul(31, a) + c.charCodeAt(0) | 0, 0)
  return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length]
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// fetchProjects rethrows so callers can react; the store has already recorded
// the message in projectsStore.error, which the error state above renders.
async function loadProjects() {
  try {
    await projectsStore.fetchProjects()
  } catch {
    /* surfaced via projectsStore.error */
  }
}

onMounted(loadProjects)

function openProject(project) {
  router.push({ name: 'MapView', params: { projectUuid: project.uuid } })
}

function startEdit(project) {
  editingProject.value = project
  form.value = { name: project.name, description: project.description || '' }
  showCreateDialog.value = true
}

function closeDialog() {
  showCreateDialog.value = false
  editingProject.value   = null
  form.value = { name: '', description: '' }
}

async function handleSubmit() {
  if (!form.value.name.trim()) {
    toast.add({ severity: 'warn', summary: 'Required', detail: 'Project name is required', life: 3000 })
    return
  }
  saving.value = true
  try {
    if (editingProject.value) {
      await updateProject(editingProject.value.uuid, form.value)
      const proj = projectsStore.projects.find(p => p.uuid === editingProject.value.uuid)
      if (proj) { proj.name = form.value.name; proj.description = form.value.description }
      toast.add({ severity: 'success', summary: 'Updated!', detail: 'Project saved', life: 2000 })
    } else {
      await projectsStore.addProject(form.value)
      toast.add({ severity: 'success', summary: 'Created!', detail: 'Project ready', life: 2000 })
    }
    closeDialog()
  } catch (err) {
    const msg = err.response?.data?.message || 'Something went wrong'
    toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 })
  } finally {
    saving.value = false
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
        toast.add({ severity: 'error', summary: 'Error', detail: 'Could not delete', life: 3000 })
      }
    },
  })
}
</script>