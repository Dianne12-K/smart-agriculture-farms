import { defineStore } from 'pinia'
import {
    getLayerGroups, createLayerGroup,
    deleteLayerGroup, getLayerGroup
} from '@/services/api'

export const useLayerGroupsStore = defineStore('layergroups', {
    state: () => ({
        groups:  [],
        loading: false,
    }),

    getters: {
        totalGroups: (state) => state.groups.length,
    },

    actions: {
        async fetchGroups(projectUuid) {
            this.loading = true
            try {
                const res = await getLayerGroups(projectUuid)
                this.groups = res.data
            } finally {
                this.loading = false
            }
        },

        async addGroup(data) {
            const res = await createLayerGroup(data)
            this.groups.unshift(res.data)
            return res.data
        },

        async removeGroup(groupUuid) {
            await deleteLayerGroup(groupUuid)
            this.groups = this.groups.filter(g => g.uuid !== groupUuid)
        },

        async fetchGroupWithLayers(groupUuid) {
            const res = await getLayerGroup(groupUuid)
            return res.data
        }
    }
})