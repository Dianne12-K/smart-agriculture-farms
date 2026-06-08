import { defineStore } from 'pinia'
import {
    getLayers, createLayer, deleteLayer,
    getLayerGroups, createLayerGroup, deleteLayerGroup,
    getAttributes, addAttributes, deleteAttribute,
    uploadFile
} from '@/services/api'

export const useLayersStore = defineStore('layers', {
    state: () => ({
        layers:          [],
        groups:          [],
        activeLayerUuid: null,
        loading:         false,
    }),

    getters: {
        activeLayer:    (state) => state.layers.find(l => l.uuid === state.activeLayerUuid) || null,
        totalLayers:    (state) => state.layers.length,
        groupOptions:   (state) => state.groups.map(g => ({ name: g.name, uuid: g.uuid })),

        groupedLayers: (state) => {
            return state.groups.map(g => ({
                ...g,
                layers: state.layers.filter(
                    l => l.layer_group_id === g.id || l.layergroup_uuid === g.uuid
                ),
            }))
        },

        ungroupedLayers: (state) => {
            const groupedUuids = state.groups.flatMap(g =>
                state.layers
                    .filter(l => l.layer_group_id === g.id || l.layergroup_uuid === g.uuid)
                    .map(l => l.uuid)
            )
            return state.layers.filter(l => !groupedUuids.includes(l.uuid))
        },
    },

    actions: {
        // ── Layers ───────────────────────────────────────────────
        async fetchAll(projectUuid) {
            this.loading = true
            try {
                const [layersRes, groupsRes] = await Promise.all([
                    getLayers(projectUuid),
                    getLayerGroups(projectUuid),
                ])
                this.layers = layersRes.data || []
                this.groups = groupsRes.data || []
            } finally {
                this.loading = false
            }
        },

        async addLayer(data) {
            const res = await createLayer(data)
            this.layers.unshift(res.data)
            return res.data
        },

        async removeLayer(layerUuid) {
            await deleteLayer(layerUuid)
            this.layers = this.layers.filter(l => l.uuid !== layerUuid)
            if (this.activeLayerUuid === layerUuid) this.activeLayerUuid = null
        },

        setActiveLayer(uuid) {
            this.activeLayerUuid = uuid
        },

        // ── Groups ───────────────────────────────────────────────
        async addGroup(data) {
            const res = await createLayerGroup(data)
            this.groups.push(res.data)
            return res.data
        },

        async removeGroup(groupUuid) {
            await deleteLayerGroup(groupUuid)
            this.groups = this.groups.filter(g => g.uuid !== groupUuid)
        },

        // ── Attributes ───────────────────────────────────────────
        async fetchAttributes(layerUuid) {
            const res = await getAttributes(layerUuid)
            const layer = this.layers.find(l => l.uuid === layerUuid)
            if (layer) layer.attributes = res.data
            return res.data
        },

        async addAttributes(layerUuid, attributes) {
            const res = await addAttributes(layerUuid, { attributes })
            const layer = this.layers.find(l => l.uuid === layerUuid)
            if (layer) layer.attributes = [...(layer.attributes || []), ...res.data]
            return res.data
        },

        async removeAttribute(layerUuid, attrId) {
            await deleteAttribute(layerUuid, attrId)
            const layer = this.layers.find(l => l.uuid === layerUuid)
            if (layer?.attributes) {
                layer.attributes = layer.attributes.filter(a => a.id !== attrId)
            }
        },

        // ── Upload ───────────────────────────────────────────────
        async uploadLayerFile(layerUuid, file) {
            const formData = new FormData()
            formData.append('file', file)
            const res = await uploadFile(layerUuid, formData)
            return res.data
        },
    },
})