import { ref, computed, watch } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { getLayers, getFeatures } from '@/services/api'

/**
 * Shared "pick a project -> pick a layer -> pick a feature" cascade used by
 * Field Analytics and Yield Reports — both need the same entry flow into a
 * specific feature's history without duplicating three cascading dropdowns.
 */
export function useFeaturePicker() {
    const projectsStore = useProjectsStore()
    if (!projectsStore.projects.length) projectsStore.fetchProjects()

    const selectedProjectUuid = ref(null)
    const selectedLayerUuid   = ref(null)
    const selectedFeature     = ref(null)

    const layers   = ref([])
    const features = ref([])
    const loadingLayers   = ref(false)
    const loadingFeatures = ref(false)

    const selectedLayer = computed(() => layers.value.find(l => l.uuid === selectedLayerUuid.value) || null)

    watch(selectedProjectUuid, async (uuid) => {
        selectedLayerUuid.value = null
        layers.value = []
        if (!uuid) return
        loadingLayers.value = true
        try {
            layers.value = (await getLayers(uuid)).data || []
        } finally {
            loadingLayers.value = false
        }
    })

    watch(selectedLayerUuid, async (uuid) => {
        selectedFeature.value = null
        features.value = []
        if (!uuid) return
        loadingFeatures.value = true
        try {
            const res = await getFeatures(uuid, { page_size: 1000 })
            features.value = res.data?.features || []
        } finally {
            loadingFeatures.value = false
        }
    })

    return {
        projects: computed(() => projectsStore.projects),
        layers, features, selectedLayer,
        loadingLayers, loadingFeatures,
        selectedProjectUuid, selectedLayerUuid, selectedFeature,
    }
}
