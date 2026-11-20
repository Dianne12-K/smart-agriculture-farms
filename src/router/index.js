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
                path: 'map',
                name: 'MapHome',
                component: () => import('@/views/MapHomeView.vue'),
            },
            {
                path: 'map/:projectUuid',
                name: 'MapView',
                component: () => import('@/views/MapView.vue'),
            },
            {
                path: 'map/:projectUuid/analytics/:metric/:layerUuid/:gid',
                name: 'AnalyticDetail',
                component: () => import('@/views/AnalyticDetailView.vue'),
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

// A deploy replaces every hashed chunk. A tab that was already open still holds
// the previous build's filenames, so its next lazy import 404s and the route
// silently fails to mount - the symptom being a successful login that never
// leaves /login. Reload once to pick up the new index.html.
const RELOAD_FLAG = 'chunk-reload-attempted'

router.onError((error, to) => {
    const stale = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i
    if (!stale.test(error?.message ?? '')) return

    // Guard against a reload loop if the chunk is genuinely broken rather
    // than merely stale.
    if (sessionStorage.getItem(RELOAD_FLAG)) return
    sessionStorage.setItem(RELOAD_FLAG, '1')
    window.location.assign(to?.fullPath || '/')
})

router.afterEach(() => {
    // Navigation worked, so the next stale import is allowed to reload again.
    sessionStorage.removeItem(RELOAD_FLAG)
})

export default router