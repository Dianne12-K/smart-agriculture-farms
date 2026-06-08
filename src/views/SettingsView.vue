<template>
  <div class="p-6 pb-24 lg:pb-8">
    <div class="max-w-3xl mx-auto">
      <div class="mb-8">
        <h1 class="text-[30px] font-bold text-[#dce2f7] tracking-tight">Settings</h1>
        <p class="text-[14px] text-[#bccbb9] mt-1">Account and application preferences.</p>
      </div>

      <!-- Account section -->
      <div class="bg-[#191f2f] border border-[#3d4a3d] rounded-xl p-6 mb-6">
        <h2 class="text-[16px] font-semibold text-[#dce2f7] mb-4">Account</h2>
        <div class="flex items-center gap-4 mb-6">
          <div class="w-14 h-14 rounded-full bg-[#22c55e]/20 border border-[#3d4a3d]
                      flex items-center justify-center">
            <i class="pi pi-user text-[#4be277] text-xl" />
          </div>
          <div>
            <p class="text-[#dce2f7] font-semibold">
              {{ authStore.user?.username || 'Operator' }}
            </p>
            <p class="text-[12px] text-[#bccbb9]">{{ authStore.user?.email || '—' }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-[11px] font-medium uppercase tracking-[0.05em] text-[#bccbb9]">
              Username
            </label>
            <InputText
                :value="authStore.user?.username"
                disabled
                class="!bg-[#0c1322] !border-[#3d4a3d] !text-[#869585]"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-[11px] font-medium uppercase tracking-[0.05em] text-[#bccbb9]">
              Email
            </label>
            <InputText
                :value="authStore.user?.email"
                disabled
                class="!bg-[#0c1322] !border-[#3d4a3d] !text-[#869585]"
            />
          </div>
        </div>
      </div>

      <!-- Danger zone -->
      <div class="bg-[#191f2f] border border-[#93000a]/40 rounded-xl p-6">
        <h2 class="text-[16px] font-semibold text-[#ffb4ab] mb-1">Danger Zone</h2>
        <p class="text-[12px] text-[#bccbb9] mb-4">
          This will end your session immediately.
        </p>
        <button
            class="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#93000a]
                 text-[#ffb4ab] text-[12px] font-bold uppercase
                 hover:bg-[#b91c1c] transition-all"
            @click="handleLogout"
        >
          <i class="pi pi-sign-out" /> Sign Out
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import InputText from 'primevue/inputtext'

const router    = useRouter()
const toast     = useToast()
const authStore = useAuthStore()

function handleLogout() {
  authStore.logout()
  toast.add({ severity: 'info', summary: 'Logged out', detail: 'See you next time!', life: 2000 })
  router.push({ name: 'Login' })
}
</script>