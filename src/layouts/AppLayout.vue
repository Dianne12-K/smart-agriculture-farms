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
          Kakamega Farms GIS
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
                    w-[280px] bg-[#191f2f] border-r border-[#3d4a3d] z-40">

        <div class="px-6 py-5 border-b border-[#3d4a3d]">
          <h2 class="text-[18px] font-bold text-[#4be277]">Main Menu</h2>
          <p class="text-[10px] text-[#bccbb9] uppercase tracking-[0.05em] mt-0.5">
            GIS Operator Control
          </p>
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
                class="flex items-center gap-3 px-4 py-3 rounded-full cursor-pointer
                     transition-all duration-150 group"
                :class="isActive
                ? 'bg-[#0566d9] text-[#e6ecff]'
                : 'text-[#bccbb9] hover:bg-[#2e3545] hover:text-[#dce2f7]'"
                @click="navigate"
            >
              <i :class="`pi ${item.icon} text-sm`"
                 :style="isActive ? {} : { color: 'inherit' }" />
              <span class="text-[12px] font-medium tracking-[0.04em] uppercase">
                {{ item.label }}
              </span>
            </div>
          </RouterLink>
        </nav>

        <!-- Storage widget -->
        <div class="px-4 py-4 border-t border-[#3d4a3d]">
          <div class="p-4 rounded-xl bg-[#2e3545]/40 border border-[#3d4a3d]">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[10px] font-bold text-[#4be277] uppercase tracking-widest">
                Storage
              </span>
              <span class="text-[10px] text-[#bccbb9]">78%</span>
            </div>
            <div class="h-1.5 w-full bg-[#141b2b] rounded-full overflow-hidden">
              <div class="h-full bg-[#4be277] rounded-full transition-all" style="width:78%" />
            </div>
            <p class="text-[10px] text-[#869585] mt-2">7.8 GB of 10 GB used</p>
          </div>
        </div>
      </aside>

      <!-- Main content -->
      <main class="flex-1 lg:ml-[280px] min-h-[calc(100vh-64px)] overflow-auto">
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
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'

const router    = useRouter()
const route     = useRoute()
const toast     = useToast()
const authStore = useAuthStore()

const navItems = [
  { name: 'Dashboard',        label: 'Dashboard',         icon: 'pi-home'       },
  { name: 'LayerManagement',  label: 'Layer Management',  icon: 'pi-th-large'   },
  { name: 'FieldAnalytics',   label: 'Field Analytics',   icon: 'pi-chart-bar'  },
  { name: 'YieldReports',     label: 'Yield Reports',     icon: 'pi-chart-line' },
  { name: 'Settings',         label: 'Settings',          icon: 'pi-cog'        },
]

// Mobile nav shows only the 4 most important
const mobileNavItems = [
  { name: 'Dashboard',       label: 'Projects', icon: 'pi-home'      },
  { name: 'LayerManagement', label: 'Layers',   icon: 'pi-th-large'  },
  { name: 'FieldAnalytics',  label: 'Analytics', icon: 'pi-chart-bar' },
  { name: 'YieldReports',   label: 'Yield',    icon: 'pi-chart-line' },
]

const pageTitles = {
  Dashboard:        'Projects Dashboard',
  LayerManagement:  'Layer Management',
  FieldAnalytics:   'Field Analytics',
  YieldReports:     'Yield Reports',
  Settings:         'Settings',
  MapView:          'Map Workspace',
}

const currentPageTitle = computed(() => pageTitles[route.name] || 'Kakamega Farms')

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