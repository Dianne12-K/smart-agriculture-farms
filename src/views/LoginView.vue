<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-[#030712] relative">

    <main class="w-full max-w-md px-4">

      <!-- Brand Header -->
      <div class="mb-8 text-center">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#22c55e] mb-6 shadow-lg shadow-green-900/40">
          <i class="pi pi-map text-[#003915] text-4xl" />
        </div>
        <h1 class="text-[30px] leading-[38px] font-bold text-[#dce2f7] tracking-tight">
          Kakamega Farms
        </h1>
        <p class="text-sm text-[#bccbb9] mt-1">GIS-powered farm management</p>
      </div>

      <!-- Card -->
      <div class="bg-[#0c1322] border border-[#1f2937] rounded-xl shadow-2xl p-8 flex flex-col items-center">

        <form @submit.prevent="handleLogin" class="w-full flex flex-col gap-6">

          <!-- Email -->
          <div class="flex flex-col gap-2">
            <label class="text-[11px] font-medium tracking-[0.05em] uppercase text-[#bccbb9]">
              Email Address
            </label>
            <div class="relative">
              <i class="pi pi-envelope absolute left-3 top-1/2 -translate-y-1/2 text-[#bccbb9] text-sm pointer-events-none" />
              <InputText
                  v-model="form.email"
                  type="email"
                  placeholder="officer@kakamegafarms.com"
                  :disabled="loading"
                  class="w-full !pl-10 !pr-4 !py-3 !rounded !bg-[#111827] !border-[#1f2937]
                       !text-[#dce2f7] text-sm
                       focus:!border-[#22c55e] focus:!ring-1 focus:!ring-[#22c55e]
                       placeholder:!text-[#4b5563] transition-all"
              />
            </div>
          </div>

          <!-- Password -->
          <div class="flex flex-col gap-2">
            <div class="flex justify-between items-center">
              <label class="text-[11px] font-medium tracking-[0.05em] uppercase text-[#bccbb9]">
                Password
              </label>
              <a href="#" class="text-[#4be277] text-[11px] font-medium hover:underline">
                Forgot?
              </a>
            </div>
            <Password
                v-model="form.password"
                placeholder="••••••••"
                :feedback="false"
                toggleMask
                :disabled="loading"
                class="w-full"
                :pt="{
                root: { class: 'w-full' },
                input: {
                  class: 'w-full !pl-10 !pr-10 !py-3 !rounded !bg-[#111827] !border-[#1f2937] !text-[#dce2f7] text-sm focus:!border-[#22c55e] focus:!ring-1 focus:!ring-[#22c55e] placeholder:!text-[#4b5563] transition-all'
                }
              }"
            >
              <template #prefix>
                <i class="pi pi-lock text-[#bccbb9] text-sm" />
              </template>
            </Password>
          </div>

          <!-- Remember me -->
          <div class="flex items-center gap-2 -mt-2">
            <Checkbox v-model="rememberMe" :binary="true" inputId="remember"
                      :pt="{ box: { class: '!bg-[#111827] !border-[#3d4a3d]' } }"
            />
            <label for="remember" class="text-sm text-[#bccbb9] cursor-pointer select-none">
              Remember device for 30 days
            </label>
          </div>

          <!-- Submit -->
          <Button
              type="submit"
              :loading="loading"
              class="w-full !bg-[#22c55e] !text-[#003915] !border-0 !font-semibold !text-base
                   !py-4 !rounded-lg hover:!brightness-110 active:!scale-[0.98] transition-all"
          >
            <template #default>
              <span class="flex items-center justify-center gap-2">
                <span>Sign In</span>
                <i class="pi pi-arrow-right transition-transform group-hover:translate-x-1" />
              </span>
            </template>
          </Button>

        </form>

        <!-- Register link -->
        <div class="mt-8 pt-6 border-t border-[#3d4a3d] w-full text-center">
          <p class="text-sm text-[#bccbb9]">
            New to the platform?
            <RouterLink
                to="/register"
                class="text-[#4be277] font-semibold ml-1 hover:underline"
            >
              Register
            </RouterLink>
          </p>
        </div>
      </div>

      <!-- Footer links -->
      <div class="mt-8 flex justify-center gap-6">
        <a href="#"
           class="text-[#bccbb9] text-[11px] tracking-wide hover:text-[#dce2f7] transition-colors flex items-center gap-1">
          <i class="pi pi-question-circle text-xs" /> Support
        </a>
        <a href="#"
           class="text-[#bccbb9] text-[11px] tracking-wide hover:text-[#dce2f7] transition-colors flex items-center gap-1">
          <i class="pi pi-shield text-xs" /> Privacy
        </a>
        <a href="#"
           class="text-[#bccbb9] text-[11px] tracking-wide hover:text-[#dce2f7] transition-colors flex items-center gap-1">
          <i class="pi pi-globe text-xs" /> EN
        </a>
      </div>
    </main>

    <!-- Coordinate watermark (bottom-left, like the stitch) -->
    <div class="fixed bottom-0 left-0 w-full p-4 pointer-events-none opacity-20">
      <div class="flex justify-between items-end font-mono text-[11px] text-[#bccbb9]">
        <span>Lat: 0.2827° N, Lon: 34.7519° E</span>
        <span>V 4.2.0-GIS</span>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'

const router    = useRouter()
const toast     = useToast()
const authStore = useAuthStore()

const loading    = ref(false)
const rememberMe = ref(false)
const form = ref({ email: '', password: '' })

async function handleLogin() {
  if (!form.value.email || !form.value.password) {
    toast.add({ severity: 'warn', summary: 'Required', detail: 'Please fill in all fields', life: 3000 })
    return
  }
  loading.value = true
  try {
    await authStore.login(form.value)
    toast.add({ severity: 'success', summary: 'Welcome back!', detail: 'Logged in successfully', life: 2000 })
    router.push({ name: 'Dashboard' })
  } catch (err) {
    const msg = err.response?.data?.message || 'Invalid email or password'
    toast.add({ severity: 'error', summary: 'Login failed', detail: msg, life: 4000 })
  } finally {
    loading.value = false
  }
}
</script>