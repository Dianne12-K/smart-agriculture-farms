import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'

// PrimeVue + Aura theme
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'

// Optional: PrimeIcons if you use any <i class="pi pi-...">
import 'primeicons/primeicons.css'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Tooltip from 'primevue/tooltip'


// ✅ Import Pinia
import { createPinia } from 'pinia'

const app = createApp(App)
const pinia = createPinia()

// ✅ Register Pinia BEFORE router
app.use(pinia)
app.use(ConfirmationService)
app.use(router)

app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: false
        }
    }
})
app.use(ToastService)
app.directive('tooltip', Tooltip)

app.mount('#app')