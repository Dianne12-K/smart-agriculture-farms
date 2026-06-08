import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getProjects, createProject, deleteProject, getLayers, getLayerGroups } from '@/services/api'
import axios from 'axios'

export const useProjectsStore = defineStore('projects', () => {
    const projects    = ref([])
    const loading     = ref(false)
    const layerCounts = ref({})  // { [uuid]: number }
    const groupCounts = ref({})  // { [uuid]: number }

    // ── Stats derived client-side from parallel fetches ──
    const totalProjects = computed(() => projects.value.length)
    const totalLayers   = computed(() => Object.values(layerCounts.value).reduce((s, n) => s + n, 0))
    const totalGroups   = computed(() => Object.values(groupCounts.value).reduce((s, n) => s + n, 0))

    async function fetchProjects() {
        loading.value = true
        try {
            const res = await getProjects()
            projects.value = res.data

            await Promise.all(
                res.data.map(async (project) => {
                    const uuid = project.uuid
                    const [layersRes, groupsRes] = await Promise.allSettled([
                        getLayers(uuid),
                        getLayerGroups(uuid),
                    ])
                    layerCounts.value[uuid] = layersRes.status === 'fulfilled'
                        ? (layersRes.value.data?.length ?? 0) : 0
                    groupCounts.value[uuid] = groupsRes.status === 'fulfilled'
                        ? (groupsRes.value.data?.length ?? 0) : 0

                    const proj = projects.value.find(p => p.uuid === uuid)
                    if (proj) {
                        proj.layer_count = layerCounts.value[uuid]
                        proj.group_count = groupCounts.value[uuid]
                    }
                })
            )
        } finally {
            loading.value = false
        }
    }

    async function addProject(data) {
        const res = await createProject(data)
        projects.value.unshift(res.data)
        return res.data
    }

    async function removeProject(uuid) {
        await deleteProject(uuid)
        projects.value = projects.value.filter(p => p.uuid !== uuid)
        delete layerCounts.value[uuid]
        delete groupCounts.value[uuid]
    }

    return {
        projects, loading,
        totalProjects, totalLayers, totalGroups,
        fetchProjects, addProject, removeProject,
    }
})