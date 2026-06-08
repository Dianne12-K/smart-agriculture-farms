<template>
  <div class="p-6 pb-24 lg:pb-8">
    <div class="max-w-7xl mx-auto">
      <div class="mb-8">
        <h1 class="text-[30px] font-bold text-[#dce2f7] tracking-tight">Yield Reports</h1>
        <p class="text-[14px] text-[#bccbb9] mt-1">
          Predicted and recorded yield data across all farm layers.
        </p>
      </div>

      <div class="flex flex-col items-center justify-center py-24 text-center">
        <div class="w-20 h-20 rounded-2xl bg-[#232a3a] border border-[#3d4a3d]
                    flex items-center justify-center mb-4">
          <i class="pi pi-chart-line text-4xl text-[#ffba61]" />
        </div>
        <h3 class="text-[#dce2f7] text-lg font-semibold">Yield Reports Coming Soon</h3>
        <p class="text-[#bccbb9] text-sm mt-2 max-w-sm">
          Yield prediction history and actual yield records will be aggregated
          here across all your projects and layers.
        </p>
        <RouterLink
            :to="{ name: 'Dashboard' }"
            class="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl bg-[#22c55e]
                 text-[#003915] text-[12px] font-bold uppercase hover:brightness-110
                 transition-all"
        >
          <i class="pi pi-arrow-left" /> Go to Projects
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup></script>