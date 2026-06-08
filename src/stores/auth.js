import { defineStore } from 'pinia'
import { login as loginApi, register as registerApi } from '@/services/api'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('token') || null,
        uuid:  localStorage.getItem('uuid')  || null,
        user:  JSON.parse(localStorage.getItem('user') || 'null'),
    }),

    getters: {
        isLoggedIn: (state) => !!state.token,
        isAuthenticated: (state) => !!state.token,
    },

    actions: {
        async login(credentials) {
            const res = await loginApi(credentials)

            this.token = res.data.access_token
            this.uuid  = res.data.uuid

            // Store whatever user info the API returns
            this.user  = {
                uuid:     res.data.uuid,
                username: res.data.username  || res.data.email || 'Operator',
                email:    res.data.email     || '',
            }

            localStorage.setItem('token', this.token)
            localStorage.setItem('uuid',  this.uuid)
            localStorage.setItem('user',  JSON.stringify(this.user))
        },

        async register(userData) {
            await registerApi(userData)
        },

        logout() {
            this.token = null
            this.uuid  = null
            this.user  = null
            localStorage.removeItem('token')
            localStorage.removeItem('uuid')
            localStorage.removeItem('user')
        }
    }
})