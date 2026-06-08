<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-950">
    <div class="w-full max-w-md px-6">

      <!-- Logo / Brand -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-600 mb-4">
          <i class="pi pi-map text-white text-3xl" />
        </div>
        <h1 class="text-3xl font-bold text-white">Kakamega Farms</h1>
        <p class="text-gray-400 mt-1">GIS-powered farm management</p>
      </div>

      <!-- Card -->
      <div class="bg-gray-900 rounded-2xl p-8 border border-gray-800">
        <h2 class="text-xl font-semibold text-white mb-6">Create an account</h2>

        <form @submit.prevent="handleRegister" class="flex flex-col gap-4">

          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-400">Username</label>
            <InputText
                v-model="form.username"
                placeholder="e.g. diana"
                class="w-full"
                :disabled="loading"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-400">Email</label>
            <InputText
                v-model="form.email"
                type="email"
                placeholder="diana@kakamega.com"
                class="w-full"
                :disabled="loading"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-400">Password</label>
            <Password
                v-model="form.password"
                placeholder="Create a password"
                toggleMask
                class="w-full"
                inputClass="w-full"
                :disabled="loading"
            />
          </div>

          <Button
              type="submit"
              label="Create Account"
              icon="pi pi-user-plus"
              class="w-full mt-2"
              :loading="loading"
          />

        </form>

        <p class="text-center text-gray-500 text-sm mt-6">
          Already have an account?
          <RouterLink to="/login" class="text-green-400 hover:text-green-300 font-medium">
            Sign in
          </RouterLink>
        </p>
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

const router    = useRouter()
const toast     = useToast()
const authStore = useAuthStore()

const loading = ref(false)
const form = ref({
  username: '',
  email: '',
  password: ''
})

async function handleRegister() {
  if (!form.value.username || !form.value.email || !form.value.password) {
    toast.add({ severity: 'warn', summary: 'Required', detail: 'Please fill in all fields', life: 3000 })
    return
  }

  loading.value = true
  try {
    await authStore.register(form.value)
    toast.add({ severity: 'success', summary: 'Account created!', detail: 'Please sign in', life: 2000 })
    router.push({ name: 'Login' })
  } catch (err) {
    const msg = err.response?.data?.message || 'Registration failed'
    toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 })
  } finally {
    loading.value = false
  }
}
</script>