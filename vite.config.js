import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    worker: {
        format: 'es',
    },
    optimizeDeps: {
        exclude: ['maplibre-gl'],
    },
    server: {
        port: 5400,
        strictPort: false,
        hmr: {
            protocol: 'ws',
            host: 'localhost'
        }
    }
})