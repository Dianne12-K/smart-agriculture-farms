import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
    // Public routes
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/LoginView.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('@/views/RegisterView.vue'),
        meta: { requiresAuth: false }
    },

    // All authenticated routes share AppLayout (sidebar + topbar)
    {
        path: '/',
        component: () => import('@/layouts/AppLayout.vue'),
        meta: { requiresAuth: true },
        redirect: '/dashboard',
        children: [
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: () => import('@/views/DashboardView.vue'),
            },
            {
                path: 'layers',
                name: 'LayerManagement',
                component: () => import('@/views/LayerManagementView.vue'),
            },
            {
                path: 'analytics',
                name: 'FieldAnalytics',
                component: () => import('@/views/FieldAnalyticsView.vue'),
            },
            {
                path: 'yield',
                name: 'YieldReports',
                component: () => import('@/views/YieldReportsView.vue'),
            },
            {
                path: 'settings',
                name: 'Settings',
                component: () => import('@/views/SettingsView.vue'),
            },
            {
                path: 'map/:projectUuid',
                name: 'MapView',
                component: () => import('@/views/MapView.vue'),
            },
        ]
    },

    // Catch-all
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to) => {
    const authStore       = useAuthStore()
    const hasToken        = !!localStorage.getItem('token')
    const isAuthenticated = authStore.isLoggedIn || hasToken

    // Guard protected routes
    if (to.meta.requiresAuth && !isAuthenticated) {
        return { name: 'Login' }
    }

    // Redirect away from auth pages if already logged in
    if (isAuthenticated && (to.name === 'Login' || to.name === 'Register')) {
        return { name: 'Dashboard' }
    }

    return true
})

export default router