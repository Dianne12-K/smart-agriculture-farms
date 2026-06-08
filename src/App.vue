<template>
  <div id="app" class="min-h-screen bg-gray-950">
    <RouterView />
    <Toast />
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import Toast from 'primevue/toast'
</script>