<template>
  <div class="min-h-screen bg-[#0c1322] text-[#dce2f7] font-['Inter',sans-serif] flex flex-col">

    <!-- ── TOP APP BAR ──────────────────────────────────────── -->
    <header class="fixed top-0 w-full z-50 h-16 flex items-center justify-between
                   px-6 bg-[#0c1322] border-b border-[#3d4a3d] shrink-0">

      <!-- Brand -->
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-[#22c55e] flex items-center justify-center shrink-0">
          <i class="pi pi-map text-[#003915] text-sm font-bold" />
        </div>
        <span class="text-[#4be277] font-bold text-lg tracking-tight hidden sm:block">
          {{ APP_NAME }}
        </span>
      </div>

      <!-- Page title (mobile) -->
      <span class="lg:hidden text-[#dce2f7] text-sm font-semibold">
        {{ currentPageTitle }}
      </span>

      <!-- User area -->
      <div class="flex items-center gap-3">
        <div class="hidden sm:flex flex-col items-end">
          <span class="text-[13px] text-[#dce2f7] font-medium leading-tight">
            {{ authStore.user?.username || 'Operator' }}
          </span>
          <span class="text-[10px] text-[#bccbb9] uppercase tracking-widest">
            {{ greeting }}
          </span>
        </div>
        <div class="w-9 h-9 rounded-full bg-[#22c55e]/20 border border-[#3d4a3d]
                    flex items-center justify-center">
          <i class="pi pi-user text-[#4be277] text-sm" />
        </div>
        <button
            class="p-2 text-[#bccbb9] hover:text-[#ffb4ab] transition-colors rounded"
            title="Logout"
            @click="handleLogout"
        >
          <i class="pi pi-sign-out" />
        </button>
      </div>
    </header>

    <!-- ── BODY: SIDEBAR + CONTENT ──────────────────────────── -->
    <div class="flex flex-1 pt-16">

      <!-- Sidebar (desktop) -->
      <aside class="fixed left-0 top-16 h-[calc(100vh-64px)] hidden lg:flex flex-col
                    bg-[#191f2f] border-r border-[#3d4a3d] z-40 transition-all duration-200"
             :class="sidebarCollapsed ? 'w-[76px]' : 'w-[280px]'">

        <div class="flex items-center border-b border-[#3d4a3d]"
             :class="sidebarCollapsed ? 'justify-center py-4' : 'justify-between px-6 py-5'">
          <div v-if="!sidebarCollapsed">
            <h2 class="text-[18px] font-bold text-[#4be277]">Main Menu</h2>
            <p class="text-[10px] text-[#bccbb9] uppercase tracking-[0.05em] mt-0.5">
              GIS Operator Control
            </p>
          </div>
          <button
              class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[#bccbb9]
                   hover:bg-[#2e3545] hover:text-[#dce2f7] transition-colors"
              :title="sidebarCollapsed ? 'Expand menu' : 'Collapse menu'"
              @click="sidebarCollapsed = !sidebarCollapsed"
          >
            <i class="pi text-sm" :class="sidebarCollapsed ? 'pi-angle-right' : 'pi-angle-left'" />
          </button>
        </div>

        <!-- Nav items -->
        <nav class="flex flex-col gap-1 px-2 py-3 flex-1">
          <RouterLink
              v-for="item in navItems"
              :key="item.name"
              :to="{ name: item.name }"
              custom
              v-slot="{ isActive, navigate }"
          >
            <div
                class="flex items-center gap-3 py-3 rounded-full cursor-pointer
                     transition-all duration-150 group"
                :class="[
                  isActive ? 'bg-[#0566d9] text-[#e6ecff]' : 'text-[#bccbb9] hover:bg-[#2e3545] hover:text-[#dce2f7]',
                  sidebarCollapsed ? 'justify-center px-0 mx-2' : 'px-4',
                ]"
                :title="sidebarCollapsed ? item.label : ''"
                @click="navigate"
            >
              <i :class="`pi ${item.icon} text-sm`"
                 :style="isActive ? {} : { color: 'inherit' }" />
              <span v-if="!sidebarCollapsed" class="text-[12px] font-medium tracking-[0.04em] uppercase">
                {{ item.label }}
              </span>
            </div>
          </RouterLink>
        </nav>

        <!-- Copyright -->
        <div class="px-4 py-4 border-t border-[#3d4a3d] text-[10px] text-[#869585] text-center">
          <span v-if="!sidebarCollapsed">&copy; {{ currentYear }} {{ APP_NAME }}. All rights reserved.</span>
          <span v-else :title="`© ${currentYear} ${APP_NAME}`">&copy;</span>
        </div>
      </aside>

      <!-- Main content -->
      <main class="flex-1 min-h-[calc(100vh-64px)] overflow-auto transition-all duration-200"
            :class="sidebarCollapsed ? 'lg:ml-[76px]' : 'lg:ml-[280px]'">
        <RouterView />
      </main>
    </div>

    <!-- ── MOBILE BOTTOM NAV ─────────────────────────────────── -->
    <nav class="lg:hidden fixed bottom-0 left-0 w-full z-50 h-16 flex justify-around
                items-center bg-[#191f2f] border-t border-[#3d4a3d] shadow-lg">
      <RouterLink
          v-for="item in mobileNavItems"
          :key="item.name"
          :to="{ name: item.name }"
          custom
          v-slot="{ isActive, navigate }"
      >
        <div
            class="flex flex-col items-center justify-center gap-0.5 px-3 py-1
                 rounded-xl cursor-pointer transition-colors min-w-[56px]"
            :class="isActive
            ? 'text-[#4be277]'
            : 'text-[#bccbb9] hover:text-[#dce2f7]'"
            @click="navigate"
        >
          <i :class="`pi ${item.icon} text-base`" />
          <span class="text-[9px] tracking-wide uppercase">{{ item.label }}</span>
        </div>
      </RouterLink>
    </nav>

  </div>
</template>

<script setup>
import { APP_NAME } from '@/constants/brand'
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'

const router    = useRouter()
const route     = useRoute()
const toast     = useToast()
const authStore = useAuthStore()

const currentYear = new Date().getFullYear()

const sidebarCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true')
watch(sidebarCollapsed, (v) => localStorage.setItem('sidebarCollapsed', v))

const navItems = [
  { name: 'Dashboard',        label: 'Dashboard',         icon: 'pi-home'       },
  { name: 'LayerManagement',  label: 'Layer Management',  icon: 'pi-th-large'   },
  { name: 'MapHome',          label: 'Map',               icon: 'pi-map'        },
  { name: 'FieldAnalytics',   label: 'Field Analytics',   icon: 'pi-chart-bar'  },
  { name: 'YieldReports',     label: 'Yield Reports',     icon: 'pi-chart-line' },
  { name: 'Settings',         label: 'Settings',          icon: 'pi-cog'        },
]

// Mobile nav shows only the 4 most important
const mobileNavItems = [
  { name: 'Dashboard',       label: 'Projects', icon: 'pi-home'      },
  { name: 'MapHome',         label: 'Map',      icon: 'pi-map'       },
  { name: 'FieldAnalytics',  label: 'Analytics', icon: 'pi-chart-bar' },
  { name: 'YieldReports',   label: 'Yield',    icon: 'pi-chart-line' },
]

const pageTitles = {
  Dashboard:        'Projects Dashboard',
  LayerManagement:  'Layer Management',
  MapHome:          'Map',
  FieldAnalytics:   'Field Analytics',
  YieldReports:     'Yield Reports',
  Settings:         'Settings',
  MapView:          'Map Workspace',
  AnalyticDetail:   'Analytic Detail',
}

const currentPageTitle = computed(() => pageTitles[route.name] || APP_NAME)

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning 🌱'
  if (h < 17) return 'Good afternoon ☀️'
  return 'Good evening 🌙'
})

function handleLogout() {
  authStore.logout()
  toast.add({ severity: 'info', summary: 'Logged out', detail: 'See you next time!', life: 2000 })
  router.push({ name: 'Login' })
}
</script>